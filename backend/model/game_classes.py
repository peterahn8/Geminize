from enum import Enum


class Status(Enum):
    WAITING = 1
    IN_PROGRESS = 2
    FINISHED = 3
    ABANDONED = 4

class Game:
    def __init__(self, room_id: int):
        self.room_id = room_id # what the front end sends to backend
        self.status = Status.WAITING
        self.players_joined = [] # the same as the id from the socket connection
        self.current_word = None
        self.used_words = set()
        self.start_time = None
        self.winner = None

    def join_game(self, player):
        """
        Adds a player to the game.

        Args:
            player: The player object.
        """
        self.players_joined.append(player)
        if len(self.players_joined) == 2:
            self.start_game()

    def start_game(self):
        """
        Sets the game status to in progress, chooses a word, and starts the timer.
        """
        self.status = Status.IN_PROGRESS
        self.choose_unused_word()
        self.start_time = datetime.now()

    def guess_word(self, player, guess):
        """
        Checks if the player's guess is correct.

        Args:
            player: The player object.
            guess: The guessed word.

        Returns:
            True if the guess is correct, False otherwise.
        """
        if guess == self.current_word:
            self.finish_game(winner=player)
            return True
        self.used_words.add(guess)
        return False

    def abandon_game(self):
        """
        Sets the game status to abandoned.
        """
        self.status = Status.ABANDONED

    def finish_game(self, winner):
        """
        Sets the game status to finished and updates the players' scores.

        Args:
            winner: The player who won the game (optional).
        """
        self.status = Status.FINISHED
        # Update players' scores based on winner/loser logic

    def choose_unused_word(self):
        """
        Picks a random word from the word bank that hasn't been used in this game yet.
        """
        while True:
            word = random.choice(word_bank)  # Replace `word_bank` with your actual word bank
            if word not in self.used_words:
                self.current_word = word
                break

    def __repr__(self):
        return f"Room ID: {self.room_id}, Status: {self.status}, Players: {self.players_joined}, Current Word: {self.current_word}, Used Words: {self.used_words}, Start Time: {self.start_time}"
