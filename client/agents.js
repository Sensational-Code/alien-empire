/** Agents.js contains all methods for initializing and drawing agents
 * All agents are drawn once and then hidden or shown based on their 
 * current planetid (either a number or undefined). 
 */

var initAgents = function() {

	//create container to store all agent shapes
	var agentsContainer = new createjs.Container();
	agentsContainer.name = 'agentsContainer';
	agentsContainer.mouseEnabled = true;
	agentsContainer.x = 0;
	agentsContainer.y = 0;

	for( var agentid in clientGame.game.board.agents ) {

		var agent = clientGame.game.board.agents[agentid];
		var agenttype = agent.agenttype;
		var player = agent.player;

		var agentshape = new createjs.Shape();
		agentshape.name = AGT_ENGLISH[ agenttype ] + player;
		agentshape.agenttype = agenttype;

		var agentImg = loader.getResult( agentshape.name );
		agentshape.graphics.beginBitmapFill(agentImg, "no-repeat").drawRect(0, 0, 103, 103);
		agentshape.shadow = new createjs.Shadow("rgba(0,0,0,0.5)", 2, 2, 1);
		agentshape.visible = false;
		agentshape.mouseEnabled = false;

		agentshape.on("mouseover", function() {
			selectAgent( this.name );
		});

		agentshape.on("mouseout", function() {
			hideSelection();
		});

		agentshape.on("click", function() {
			handleClickAgent( this.agenttype )
		});

		agentsContainer.addChild(agentshape);
	}

	board.addChild(agentsContainer);
};

var updateAgents = function(planetid) {

	var agentsContainer = board.getChildByName('agentsContainer');
	var planet = clientGame.game.board.planets[planetid];
	var agents = clientGame.game.board.agents;
	var num_agents = planet.agents.length;

	var space = agtSpace;
	var agtWidAll = (agtWid * num_agents) + (space * (num_agents - 1));

	if (agtWidAll > planet.w * sWid) {
		space = ((planet.w * sWid) - (num_agents * agtWid)) / (num_agents - 1);
		agtWidAll = (agtWid * num_agents) + (space * (num_agents - 1));
	}

	var agentsX = ((planet.w * sWid) / 2.0) - ( agtWidAll / 2.0);
	var agentsY = planet.w == 1 ? 15 : 155 ;

	for (var i = 0; i < num_agents; i++) {

		var id = planet.agents[i];
		var agent = agents[id];
		var player = agent.player;
		var agenttype = agent.agenttype;

		var agentshape = agentsContainer.getChildByName(AGT_ENGLISH[agenttype] + player);
		
		agentsContainer.setChildIndex( agentshape, 
									   agentsContainer.getNumChildren() - 1);

		agentshape.visible = true;

		agentshape.x = tiles[planetid].x + agentsX;
		agentshape.y = tiles[planetid].y + agentsY;

		agentsX += agtWid + space;
	}
};

var updateAgentsInteractivity = function() {
	
	console.log("updating agents interactivity");

	var agentsContainer = board.getChildByName('agentsContainer');

	switch ( clientGame.game.phase ) {
		case PHS_UPKEEP:
		case PHS_ACTIONS:
			mouseOnAgents( true );
			break;
		case PHS_PLACING:
		case PHS_MISSIONS:
		case PHS_RESOURCE:
		case PHS_BUILD:
		default:
			mouseOnAgents( false );
			break;
	}
};

var mouseOnAgents = function( on ) {
	var agentsContainer = board.getChildByName('agentsContainer');

	for ( var i = AGT_EXPLORER; i <= AGT_SABATEUR; i++ ){
		var agentshape = agentsContainer.getChildByName( AGT_ENGLISH[i] 
														+ clientTurn );
		agentshape.mouseEnabled = on;
	}
};

var handleClickAgent = function( agenttype ) {
	switch ( clientGame.game.phase ){
		case PHS_UPKEEP:
			updateAgentsRetireMenu( agenttype );
			showAgentRetireMenu();
			break;
		case PHS_ACTIONS:
			console.log("clicked ", name);
			// showAgentActionsMenu();
			break;
		default:
			break;
	}
};

var showAgentRetireMenu = function() {
	$('#agent-retire-div')[0].style.visibility = "visible";
};

var hideAgentRetireMenu = function() {
	$('#agent-retire-div')[0].style.visibility = "hidden";
};

var updateAgentsRetireMenu = function( agenttype ){
	$('#agent-retire-name')[0].innerHTML = AGT_ENGLISH[agenttype];
	$('#agent-retire-button').click( function() { 
											submitAgentRetire( agenttype );
										} );
};

var submitAgentRetire = function( agenttype, player ){
	console.log('submitting agent retire ' + AGT_ENGLISH[agenttype]);
};

var selectAgent = function( agentname) {
	var agentsContainer = board.getChildByName('agentsContainer');
	var agentshape = agentsContainer.getChildByName( agentname );
	console.log('selecting agent', agentshape);
	setSelection(agentshape.x + 27, agentshape.y - 28);
};