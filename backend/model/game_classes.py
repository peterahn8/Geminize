from enum import Enum

GAME_CAPACITY = 2

class Status(Enum):
    WAITING_FOR_PLAYERS = 1 # less than the max have joined
    WAITING_FOR_START = 2 # lobby is full but the leaders has not pressed start
    IN_PROGRESS = 3
    FINISHED = 4
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

    def add_player(self, player):
        """
        Adds a player to the game.

        Args:
            player: The player object.
        """
        self.players_joined.append(player)
        if self.full():
            self.move_to_wait_for_start()

    
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
            winner: The player who won the game.
        """
        self.status = Status.FINISHED
        self.winner = winner
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
    
    def full(self):
        return len(self.players_joined) == GAME_CAPACITY


    def __repr__(self):
        return f"Room ID: {self.room_id}, Leader: {self.leader}, Status: {self.status}, Players: {self.players_joined}, Current Word: {self.current_word}, Used Words: {self.used_words}, Start Time: {self.start_time}"
