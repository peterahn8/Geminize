from PIL import Image
from decouple import config
from flask import Flask, send_from_directory, request
from flask_socketio import SocketIO, send, emit, join_room
from model.server_class import Server

import google.generativeai as genai

# TODO: Remove the model stuff from here, it was just for testing
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
        print("creating game room on leader")
        game = server.get_game_from_room(data)

    else: 
        server.add_player_to_game(player, data)
        game = server.get_game_from_room(data)

    # update player list in front end
    players_list = ",".join(game.players_joined)
    print("backend emitting 'updatePlayerList'")
    emit('updatePlayerList', players_list, room=data)

    # check game and send 
    if server.game_waiting_for_start(data):
        print("backend emitting 'showStartButton'")
        emit('showStartButton', players_list, room=data)

    # add mapping of player to room id so that backend can tell
    # which game to map requests to    
    server.add_player_to_room_mapping(player, data)


@socketio.on("startGame")
def handle_start(data):
    # move game to start state, pick a random word, send word to front end
    game  = server.start_game(request.sid)
    if game.leader == request.sid:
        emit('wordToGuess', game.current_word, room=game.room_id)

@socketio.on("countdown")
def handle_start_countdown():
    room_id = server.get_room_id_from_player(request.sid)
    emit('startClientCountdown', room=room_id)

@socketio.on("drawing")
def handle_drawing(data):
    game = server.get_game_from_player(request.sid)

    ok = game.guess_word(request.sid, data)
    # if ok:
    #     print("backend emitting 'gameWon' to the room")
    #     emit("gameWon", request.sid, to=game.room_id)

@socketio.on("disconnect")
def handle_disconnect():
    player = request.sid
    room_id = server.get_room_id_from_player(player)

    if room_id:
        game = server.get_game_from_room(room_id)
        if game and player in game.players_joined:
            game.remove_player(player)
            players_list = ",".join(game.players_joined)

            print("backend emitting 'updatePlayerList'")
            emit('updatePlayerList', players_list, room=room_id)

        # Remove player to room mapping
        server.remove_player_from_room_mapping(player)


socketio.run(app, host="0.0.0.0", port=3000)