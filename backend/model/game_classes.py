from enum import Enum
import random
import datetime
from PIL import Image
import io
from flask import request
from flask_socketio import emit
import google.generativeai as genai
from decouple import config

genai.configure(api_key=config('API_KEY'))
model = genai.GenerativeModel('gemini-pro-vision')

GAME_CAPACITY = 10

WORD_BANK = [
    "apple", "backpack", "bag", "ball", "banana", "bed", "belt", "bird", "boat",
    "book", "bottle", "bowl", "bracelet", "brush", "bus", "camera", "cap", "car",
    "cat", "chair", "chicken", "clock", "coat", "comb", "computer", "cup", "desk",
    "dog", "door", "dress", "eraser", "face", "fan", "fish", "flower", "fork",
    "fridge", "glass", "glasses", "gloves", "glue", "grape", "hat", "headphones",
    "heater", "house", "jacket", "jeans", "jug", "kiwi", "knife", "lamp", "lemon",
    "mango", "marker", "microwave", "moon", "necklace", "notebook", "orange", "oven",
    "pan", "pants", "peach", "pen", "pencil", "phone", "plate", "pot", "radio", "ring",
    "ruler", "scarf", "scissors", "shirt", "shoe", "shoes", "skirt", "socks", "sofa",
    "sponge", "spoon", "star", "strawberry", "sun", "sunglasses", "t-shirt", "table",
    "tape", "toaster", "toothbrush", "tree", "tv", "umbrella", "watch", "window"
]

class Status(Enum):
    WAITING_FOR_PLAYERS = 1 # less than the max number of players have joined
    WAITING_FOR_START = 2 # lobby is full but the leader has not pressed start
    IN_PROGRESS = 3 # leader started the game. players can now draw and submit
    FINISHED = 4 # a player has won the game. the game can be restarted
    ABANDONED = 5

class Game:
    def __init__(self, room_id: str, leader: str):
        self.room_id = room_id # what the front end sends to backend
        self.leader = leader # person that can start the game or maybe end the game
        self.status = Status.WAITING_FOR_PLAYERS
        self.players_joined = [leader] # the same as the id from the socket connection
        self.current_word = None
        self.used_words = set()
        self.start_time = None
        self.winner = None
        self.winners = []

    def add_player(self, player):
        """
        Adds a player to the game.

        Args:
            player: The player object.
        """
        self.players_joined.append(player)
        if self.full():
            self.move_to_wait_for_start()

    def remove_player(self, player):
        if player in self.players_joined:
            self.players_joined.remove(player)
            print("server removed ", player, " from game. Game now contains these players: ", self.players_joined)

    def move_to_wait_for_start(self):
        self.status = Status.WAITING_FOR_START

        #TODO: stream message to the room that game is full
        # front end will show start button

    def start_game(self):
        """
        Sets the game status to in progress, chooses a word, and starts the timer.
        """
        self.status = Status.IN_PROGRESS
        self.choose_unused_word()
        self.start_time = datetime.datetime.now()

    def guess_word(self, player, data):
        """
        Checks if the player's guess is correct.

        Args:
            player: The player object.
            guess: Image data.

        Returns:
            True if the guess is correct, False otherwise.
        """

        imgMem = Image.frombytes(mode="RGBA", size=(400, 400), data=data)

        memBuffer = io.BytesIO()
        imgMem.save(memBuffer, format='PNG')
        ## TODO: Delete this, save the image as a file to double check it
        imgMem.save("output.png")
        memBuffer.seek(0)
        imgPNG = Image.open(memBuffer)

        response = model.generate_content(["What is this drawing? Answer in one word only. Do not add capitalization or punctuation. Do not add leading or trailing spaces.", imgPNG], stream=True)
        response.resolve()
        # print(response.text)
        
        # added strip method for testing purposes. ideally we won't need it
        guess = response.text.strip()
        print("the AI's guess string is", len(guess), "characters long. it should be", len(self.current_word), "characters long.")

        #  tell the front end what Gemini guessed on which player
        guess_info = {"player": player, "guess": guess}
        emit('updateGuessList', guess_info, room=self.room_id)

        emit('guessResponse', response.text, room=request.sid)

        # TODO: Delete this line its for simulating a fast response
        # guess = self.current_word

        if guess == self.current_word and not self.winners:
            self.winners.append(player)
            print(f"Player {player} wins")
            emit("gameWon", player, room=self.room_id)
            self.finish_game()
            return True
        elif guess == self.current_word:
            # correct guess but not the first one
            self.winners.append(player)
            print(f"Player {player} also guessed correctly but was not the first")
        else:
            # incorrect guess or the game is already finished
            self.used_words.add(guess)
        return False

    def abandon_game(self):
        """
        Sets the game status to abandoned.
        """
        self.status = Status.ABANDONED

    def finish_game(self):
        """
        Sets the game status to finished and updates the players' scores.

        Args:
            winner: The player who won the game.
        """
        self.status = Status.FINISHED
        # Update players' scores based on winner/loser logic

    def choose_unused_word(self):
        """
        Picks a random word from the word bank that hasn't been used in this game yet.
        """
        while True:
            word = random.choice(WORD_BANK)
            if word not in self.used_words:
                self.current_word = word
                break
    
    def wipe(self):
        self.winner = None
        self.winners = []

    def full(self):
        print("players in room:", len(self.players_joined), "capacity:", GAME_CAPACITY)
        return len(self.players_joined) == GAME_CAPACITY


    def __repr__(self):
        return f"Room ID: {self.room_id}, Leader: {self.leader}, Status: {self.status}, Players: {self.players_joined}, Current Word: {self.current_word}, Used Words: {self.used_words}, Start Time: {self.start_time}"
