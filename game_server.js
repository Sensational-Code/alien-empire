
var cons = require('./server_constants');
var board = require('./game_board');
var actions = require('./game_actions');

(function() {

	module.exports.initializeGame = function( user_ids, gameid ) {
		var num_users = user_ids.length;
		var newGame = {
			gameid: gameid,
			num_players: num_users,
			structures: board.initializePlayerStructures( num_users ),
			resources: board.initializePlayerResources( num_users ),
			points: board.initializePlayerPoints( num_users ),
			players: board.createPlayerOrder( user_ids ),
			round: 0,
			secondmines: false,
			turn: 0,
			board: board.initializeBoard( num_users )
		};

		return newGame;
	};

	module.exports.resolveAction = function( action, gameInfo ) {
		// This will be a switch for all different action types.
		switch (action.actiontype) {
			case cons.ACT_LOADED_ASSETS:
				return actions.resolveLoadingDone( action, gameInfo.game );
				break;
			case cons.ACT_TURN_DONE:
				return actions.resolveTurnDone( action, gameInfo.game );
				break;
			case cons.ACT_PLACE:
			case cons.ACT_BUILD:
				return actions.resolveGameAction( action, gameInfo.game );
				break;
			default:
				return false;
		}
	};

}());