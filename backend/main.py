import io

from PIL import Image
from decouple import config
from flask import Flask, send_from_directory, request
from flask_socketio import SocketIO, send, emit, join_room
from model.server_class import Server

import google.generativeai as genai

genai.configure(api_key=config('API_KEY'))
model = genai.GenerativeModel('gemini-pro-vision')

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

    else: 
        server.add_player_to_game(player, data)

        # check game and send 
        if server.game_waiting_for_start(data):
            game = server.get_game_from_from_room(data)
            emit('showStartButton', ",".join(game.players_joined), room=data)

    # add mapping of player to room id so that backend can tell
    # which game to map requests to    
    server.add_player_to_room_mapping(player, data)


@socketio.on("drawing")
def handle_drawing(data):
    imgMem = Image.frombytes(mode="RGBA", size=(400, 400), data=data)

    memBuffer = io.BytesIO()
    imgMem.save(memBuffer, format='PNG')
    # TODO: Delete this, save the image as a file to double check it
    imgMem.save("output.png")
    memBuffer.seek(0)
    imgPNG = Image.open(memBuffer)

    response = model.generate_content(["What do you think this image is? Give a one word answer.", imgPNG], stream=True)
    response.resolve()
    print(response.text)

    emit('guessResponse', response.text, room=request.sid)

socketio.run(app, host="0.0.0.0", port=3000)