import io
import asyncio

from PIL import Image
from decouple import config
from flask import Flask, send_from_directory, request
from flask_socketio import SocketIO, send, emit, join_room
from model.server_class import Server

import google.generativeai as genai

# TODO: Remove the model stuff from here, it was just for testing
genai.configure(api_key=config('API_KEY'))
model = genai.GenerativeModel('gemini-pro-vision', generation_config=genai.GenerationConfig(temperature=0,max_output_tokens=100))

# TODO: This is the real code path, but we are commenting it out and
# using fake code to simulate a faster response
# imgMem = Image.frombytes(mode="RGBA", size=(400, 400), data=data)

# memBuffer = io.BytesIO()
# imgMem.save(memBuffer, format='PNG')
## TODO: Delete this, save the image as a file to double check it
# imgMem.save("output.png")
# memBuffer.seek(0)
async def ai(filepath):
    imgPNG = Image.open("output.png")

    response = await model.generate_content_async([imgPNG, "You are a guessing bot. Guess this image. Give the shortest answer possible. Do not include punctuation in the answer."])

    await response.resolve()
    print(response.text)

# emit('guessResponse', response.text, room=request.sid)
async def main():
    await asyncio.gather(ai(""), ai(""))

asyncio.run(main())
print("test")
exit()

app = Flask(__name__)
socketio = SocketIO(app)
server = Server()


@app.route("/", defaults={'path': ''})
@app.route("/<path:path>")
def main_route(path):
    if path == '':
        path = 'index.html'
    return send_from_directory("../frontend", path)

@socketio.on("join")
def handle_join(data):
    player = request.sid
    join_room(data)

    if not(server.room_exists(data)):
        server.create_game(player, data)
        print("creating game room on leader")

    else: 
        server.add_player_to_game(player, data)

        # check game and send 
        if server.game_waiting_for_start(data):
            game = server.get_game_from_room(data)
            emit('showStartButton', ",".join(game.players_joined), room=data)

    # add mapping of player to room id so that backend can tell
    # which game to map requests to    
    server.add_player_to_room_mapping(player, data)


@socketio.on("start")
def handle_start(data):
    # move game to start state, pick a random word, send word to front end
    game  = server.start_game(request.sid)
    emit('showWordToGuess', game.current_word, room=game.room_id)


@socketio.on("drawing")
def handle_drawing(data):
    game = server.get_game_from_player(request.sid)

    ok = game.guess_word(request.sid, data)
    if ok:
        emit("gameWon", request.sid, to=game.room_id)


socketio.run(app, host="0.0.0.0", port=3000)