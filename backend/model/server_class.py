from model.game_classes import Game, Status

class Server:
    def __init__(self):
        self.player_to_room_dict: dict[str, str] = dict()
        self.room_id_to_game_dict: dict[str, Game] = dict()
    
    
    def room_exists(self, room_id: str) -> bool:
        return room_id in self.room_id_to_game_dict


    def add_player_to_game(self, player, room_id):
        game = self.get_game_from_from_room(room_id)
        if game.full():
            print(f"room {room_id} is already full, {player} can't join")
            return
        
        else:
            game.add_player(player)


    def add_player_to_room_mapping(self, player, room_id):
        """
        Adds player to the player_dict if it's not already there
        
        Args:
            player: sid
        """
        if player not in self.player_to_room_dict:
            self.player_to_room_dict[player] : room_id
        else:
            print(f"{player} is already assigned to another room: {self.player_to_room_dict[player]}")

    
    def create_game(self, player, room_id):
        self.room_id_to_game_dict[room_id] = Game(room_id, player)


    def get_game_from_from_player(self, player):
        return self.room_id_to_game_dict[self.player_to_room_dict[player]]


    def get_game_from_from_room(self, room_id):
        return self.room_id_to_game_dict[room_id]
    

    def game_waiting_for_start(self, room_id):
        return self.room_id_to_game_dict[room_id].status == Status.WAITING_FOR_START