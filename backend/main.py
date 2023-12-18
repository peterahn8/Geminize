import io

from PIL import Image
from decouple import config
from flask import Flask, send_from_directory, request
from flask_socketio import SocketIO, send

import google.generativeai as genai

genai.configure(api_key=config('API_KEY'))
model = genai.GenerativeModel('gemini-pro-vision')

app = Flask(__name__)
socketio = SocketIO(app)

@app.route("/", defaults={'path': ''})
@app.route("/<path:path>")
def main_route(path):
    if path == '':
        path = 'index.html'
    return send_from_directory("../frontend", path)

@socketio.on("join")
def handle_join(data):
    sid = request.sid
    join_room(data)

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
    send(response.text + " from: " + request.sid)
    print(response.text)

socketio.run(app, host="0.0.0.0", port=3000)