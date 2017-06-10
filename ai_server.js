var cons = require('./server_constants');
var helpers = require('./game_helpers');
var gamedata = require('./game_data');

var doAiCycle = function(io, game_server, gamesInfo, users, aiIndex) {
    for (var gameid = 0; gameid < gamesInfo.length; gameid++) {
        if (gamesInfo[gameid].status == cons.GAME_PROGRESS) {
            var game = gamesInfo[gameid].game;
            for (var p = 0; p < game.players.length; p++){
                if (p == aiIndex) {
                    var userid = game.players[p];
                    if (users[userid].isComputer) {
                        doAIGameAction(io, game_server, gamesInfo, gameid, users, userid);
                    }
                }
            }
        }
    }
};

var doAIGameAction = function(io, game_server, gamesInfo, gameid, users, userid) {
    var game = gamesInfo[gameid].game;
    var playerIndex = game.players.indexOf(userid);
    var action = createAiGameAction(game, playerIndex);

    if (action) {
        console.log("Computer player " + users[userid].name + " requesting a game action");
        var response = game_server.resolveAction(action, gamesInfo[gameid]);

        if (response.to == cons.EVENT_ONE) {
            console.log('computer action response: ' + response.response);
        }
        else if (response.to == cons.EVENT_ALL) {
            var newMsg = helpers.addGameActionMessage(gamesInfo[gameid],
                userid,
                action);
            io.in(gamesInfo[gameid].room).emit(response.evnt, response.content, newMsg);
        }
    }
};

// return an action for the computer player to request
// or return null if no action appropriate.
var createAiGameAction = function(game, playerIndex) {
    var action = null;
    switch(game.phase) {
        case cons.PHS_PLACING:
            action = createAiPlaceAction(game, playerIndex);
            break;
        case cons.PHS_RESOURCE:
            action = createAiCollectResourcesAction(game, playerIndex);
            break;
        case cons.PHS_UPKEEP:
            action = createAiUpkeepPhaseAction(game, playerIndex);
            break;
        case cons.PHS_BUILD:
            action = createAiBuildPhaseAction(game, playerIndex);
            break;
        case cons.PHS_ACTIONS:
            action = createAiActionPhaseAction(game, playerIndex);
            break;
        case cons.PHS_MISSIONS:
            action = createAiMissionsPhaseAction(game, playerIndex);
            break;
        default:
            break;
    }
    return action;
};

var createAiPlaceAction = function(game, playerIndex) {
    console.log('creating ai place action');
    if (gamedata.isPlayerTurn(game, playerIndex)) {
        return createBestMineBuildAction(game, playerIndex, cons.ACT_PLACE);
    }
    return null;
};

var createAiCollectResourcesAction = function(game, playerIndex) {
    console.log('creating ai collect action');
    // TODO FIX:
    //          This should instead return a createAi4to1Action
    //          if too many resources to collect the package
    var resource_pkgs = game.resourcePackages[playerIndex];
    for (var i = 0; i < resource_pkgs.length; i++) {
        var pkg = resource_pkgs[i];
        if (!pkg.collected && pkg.pkgtype != cons.PKG_UPKEEP) {
            return {
                player: playerIndex,
                actiontype: cons.ACT_COLLECT_RESOURCES,
                pkgindex: i
            };
        }
    }
    return null;
};

var createAiUpkeepPhaseAction = function(game, playerIndex) {
    console.log('creating ai pay upkeep action');
    // TODO FIX:
    //          This should check if upkeep can be paid and
    //          remove appropriate agents / structures if not
    // TODO FEATURE:
    //          This should consider retiring agents even if
    //          it *can* pay upkeep for them
    var resource_pkgs = game.resourcePackages[playerIndex];
    for (var i = 0; i < resource_pkgs.length; i++) {
        var pkg = resource_pkgs[i];
        if (pkg.pkgtype == cons.PKG_UPKEEP) {
            if (!pkg.collected && !pkg.cancelled) {
                return {
                    player: playerIndex,
                    actiontype: cons.ACT_PAY_UPKEEP,
                    pkgindex: i
                };
            }
        }
    }
    return null;
};

var createAiBuildPhaseAction = function(game, playerIndex) {
    if (gamedata.isPlayerTurn(game, playerIndex)) {
        var action = createBestBuildAction(game, playerIndex);
        if (action) {
            return action;
        } else {
            return {
                player: playerIndex,
                actiontype: cons.ACT_TURN_DONE
            };
        }
    }
    return null;
};

var createAiActionPhaseAction = function(game, playerIndex) {
    if (gamedata.isPlayerTurn(game, playerIndex)) {
        return {
            player: playerIndex,
            actiontype: cons.ACT_TURN_DONE
        };
    }
    return null;
};

// Creates an AI action for the mission resolve phase
// If there is a current mission pending:
//   If it is resolved but not viewed:
//     ACT_MISSION_VIEWED
//   If it is not resolved:
//     If AI has not responded with spy action:
//       ACT_BLOCK_MISSION (true or false)
//     Else IF it is AI's mission:
//        Create Mission Resolve Action
var createAiMissionsPhaseAction = function(game, playerIndex) {
    var mission = gamedata.getCurrentMission(game);
    if (mission) {
        if (mission.resolution.resolved) {
            if (!game.missionViewed[playerIndex]) {
                return {
                    player: playerIndex,
                    actiontype: cons.ACT_MISSION_VIEWED,
                    choice: gamedata.getCurrentMissionIndex(game)
                };
            }
        } else {
            if (mission.waitingOnResolve) {
                if (mission.player == playerIndex) {
                    // TODO FEATURE: create resolve mission action
                }
            } else {
                if (game.missionSpied[playerIndex] == null) {
                    return createAiBlockMissionAction(game, playerIndex, mission);
                }
            }
        }
    }
    return null;
};

// Creates an AI action to either allow, block, or collect from a mission
// TODO FEATURE: add logic to block or collect if AI player has spy eyes
var createAiBlockMissionAction = function(game, playerIndex, mission) {
    return {
        player: playerIndex,
        actiontype: cons.ACT_BLOCK_MISSION,
        choice: false
    };
};

// create an action of the given action type to build a mine on the best available resource
var createBestMineBuildAction = function(game, playerIndex, actionType) {
    var action = null;
    // check if can afford first
    if (actionType != cons.ACT_PLACE) {
        if (!gamedata.playerCanBuild(game, playerIndex, cons.OBJ_MINE)) {
            return null;
        }
    }
    var planets = game.board.planets.filter(function(planet) {
        return planet.explored && (actionType == cons.ACT_PLACE || planet.buildableBy[playerIndex]);
    });
    shuffle(planets);  // shuffle to eliminate being biased to first spots
    var futures = gamedata.getResourceFuturesWithNewStructure(game, playerIndex, cons.OBJ_MINE);
    var greatestNeedFound = 1000; // (greater needs are lower numbers)
    for (var p = 0; p < planets.length; p++) {
        var resources = planets[p].resources;
        for (var r = 0; r < resources.length; r++) {
            if (!resources[r].structure) {
                var kind = resources[r].kind;
                if (futures[kind] < greatestNeedFound) {
                    greatestNeedFound = futures[kind];
                    action = {
                        player: playerIndex,
                        actiontype: actionType,
                        objecttype: cons.OBJ_MINE,
                        resourceid: r,
                        planetid: planets[p].planetid
                    };
                }
            }
        }
    }
    return action;
};

// randomly chooses to try building either an embassy or factory. returns build action if possible
var createBestTier2BuildAction = function(game, playerIndex) {
    var action = null;
    var objtype = Math.random() * 2 > 1 ? cons.OBJ_FACTORY : cons.OBJ_EMBASSY;
    if (gamedata.playerCanBuild(game, playerIndex, objtype)) {
        var planets = game.board.planets.filter(function (planet) {
            return planet.settledBy[playerIndex];
        });
        shuffle(planets);  // shuffle to eliminate being biased to first spots
        var futures = gamedata.getResourceFuturesWithNewStructure(game, playerIndex, objtype);
        var greatestNeedFound = 1000; // (greater needs are lower numbers)
        for (var p = 0; p < planets.length; p++) {
            var resources = planets[p].resources;
            for (var r = 0; r < resources.length; r++) {
                var structure = resources[r].structure;
                if (structure && structure.player == playerIndex && structure.kind == cons.OBJ_MINE) {
                    var kind = resources[r].kind;
                    if (futures[kind] < greatestNeedFound) {
                        greatestNeedFound = futures[kind];
                        action = {
                            player: playerIndex,
                            actiontype: cons.ACT_BUILD,
                            objecttype: objtype,
                            resourceid: r,
                            planetid: planets[p].planetid
                        };
                    }
                }
            }
        }
    }
    return action;
};

var createBestBuildAction = function(game, playerIndex) {
    // try to build a mine first.
    var action = createBestMineBuildAction(game, playerIndex, cons.ACT_BUILD);
    if (action == null) {
        action = createBestTier2BuildAction(game, playerIndex);
    }
    return action;
};

/**
 * Shuffles array in place.
 * @param {Array} a items The array containing the items.
 */
function shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
}

(function() {
    module.exports = {
        doAiCycle: doAiCycle
    };
}());