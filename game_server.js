
var cons = require('./server_constants');
var board = require('./game_board');
var actions = require('./game_actions');

(function() {

	module.exports.initializeGame = function( user_ids, gameid, points ) {
		var num_users = user_ids.length;
		var newGame = {
			gameid: gameid,
			num_players: num_users,
			structures: board.initializePlayerStructures( num_users ),

			resources: initPlayerResources( num_users ),
			resourceCollect: initResourceCollect( num_users ),
			resourceUpkeep: initResourceUpkeep( num_users ),
			resourcePackages: initResourcePackages( num_users ),

			points: board.initializePlayerPoints( num_users ),
			points_remaining: board.initializePoints( num_users ),
			points_to_win: points,
			players: board.createPlayerOrder( user_ids ),
			round: 0,
			phase: cons.PHS_PLACING,
			phaseDone: board.initializeUserArray( num_users, false ),
			turn: 0,
			trades: board.initializeUserArray(num_users, undefined),
            time_next_trade_allowed: board.initializeUserArray(num_users, (Date.now() / 1000) + 30),
            num_surveyor_missions: board.initializeUserArray(num_users, 0),
			playerTurn: 0,
			playerOffset: 0,
			missions: {},
			missionindex: 0,
			secondmines: false,
			board: board.initializeBoard( num_users ),
			stats: { points: initStats(num_users) },
			isEnded: false
		};

		return newGame;
	};

	module.exports.resolveAction = function( action, gameInfo ) {
		// This will be a switch for all different action types.
		switch (action.actiontype) {
			case cons.ACT_LOADED_ASSETS:
				return actions.resolveLoadingDone( action, gameInfo.game );
			case cons.ACT_TURN_DONE:
				return actions.resolveTurnDone( action, gameInfo.game );
			case cons.ACT_PLACE:
			case cons.ACT_VIEWED_MISSIONS:
			case cons.ACT_BLOCK_MISSION:
			case cons.ACT_BUILD:
			case cons.ACT_RECRUIT:
			case cons.ACT_RETIRE:
			case cons.ACT_REMOVE_FLEET:
			case cons.ACT_REMOVE:
			case cons.ACT_MOVE_AGENT:
			case cons.ACT_LAUNCH_MISSION:
			case cons.ACT_COLLECT_RESOURCES:
			case cons.ACT_PAY_UPKEEP:
			case cons.ACT_TRADE_FOUR_TO_ONE:
			case cons.ACT_TRADE_REQUEST:
			case cons.ACT_TRADE_CANCEL:
			case cons.ACT_TRADE_ACCEPT:
			case cons.ACT_TRADE_DECLINE:
			case cons.ACT_MISSION_RESOLVE:
			case cons.ACT_MISSION_VIEWED:
			case cons.ACT_FLEET_MOVE:
			case cons.ACT_FLEET_ATTACK:
			case cons.ACT_BASE_ATTACK:
				return actions.resolveGameAction( action, gameInfo.game );
			default:
				return false;
		}
	};

}());

var initPlayerResources = function( num_users ) {
	var resources = [];

	for ( var i = 0; i < num_users; i++ ){

		resources.push( {} );

		resources[i][cons.RES_METAL] = cons.INITIAL_RESOURCES[cons.RES_METAL];
		resources[i][cons.RES_WATER] = cons.INITIAL_RESOURCES[cons.RES_WATER];
		resources[i][cons.RES_FUEL] = cons.INITIAL_RESOURCES[cons.RES_FUEL];
		resources[i][cons.RES_FOOD] = cons.INITIAL_RESOURCES[cons.RES_FOOD];
	}
	
	return resources;
};

var initResourcePackages = function( num_players ){
	var resourcePackages = {};
	for ( var i = 0; i < num_players; i++ ){
		resourcePackages[i] = [];
	}
	return resourcePackages;
};

var initResourceCollect = function( num_users ){
	var resourceCollect = [];
	for (var i = 0; i < num_users; i++) {
		resourceCollect.push( [0, 0, 0, 0] );
	}
	return resourceCollect;
};

var initResourceUpkeep = function( num_users ){
	var resourceUpkeep = [];
	for (var i = 0; i < num_users; i++) {
		resourceUpkeep.push( [0, 0, 0, 0] );
	}
	return resourceUpkeep;
};

var initStats = function( num_users ){
	var stats = [];
	for ( var p = 0; p < num_users; p++ ){
		stats.push([]);
	}
	return stats;
};