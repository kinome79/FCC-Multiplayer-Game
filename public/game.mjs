// to do list
//-possibly implement additional graphics on selecting coin or just coin shine
//-possibly implement stealing projectiles
//-use firer on a projectile to assign score to firing tank possibly
//-detect how many people are on the server and sync list
//-maybe need to update with only update, not adjusting locally

// import game modules
import Player from './Player.mjs';
import Collectible from './Collectible.mjs';
import Projectile from './Projectile.mjs';

// set gameboard width/height and header height
const width = 640;
const height = 480;
const header = 75;

// set rotational and movement speeds for player
const rotSpeed =  10;
const moveSpeed = 10;

// estabish socket connection
const socket = io();

// set canvas configuration variables

const canvas = document.getElementById('game-window');
canvas.width = width;
canvas.height = height;
const context = canvas.getContext('2d');
document.fonts.ready.then( () => {
    context.font = "24px 'Press Start 2P'";
    context.fillStyle = 'black';
    context.fillText ("Loading ... ", 300, 252);
});

// get the log html element
const messageList = document.getElementById("message-list");

// set initial game varialbes for storing game items
let myPlayer = null;  // stores local player
let playerList = [];  // stores list of remote players
let gameInt = null;   // stores the game animation interval
let collectible = null;  // stores the collectable object
let projectile = null;   // stores the projectile object
let changed = false;     // indicates if frame has changed for animation update
let deadcounter = 0;     // counts frames that a destroyed player should remain dead


// function DOM Content Loaded - runs when page finishes loading - configures and starts game
document.addEventListener('DOMContentLoaded', () => {

    // Post a starting game message to log display
    postMessage(`Connecting to game...`);
    
    // Set event listeners for keys
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Attempt to preload font - still not working 
    const myfont = new FontFace('Press Start', 'url(https://fonts.gstatic.com/s/pressstart2p/v14/e3t4euO8T-267oIAQAu6jDQyK3nRivN04w.woff2)');
    document.fonts.add(myfont);
    myfont.load().then( () => {context.font = "24px 'Press Start 2P'";});
 
// NETWORK MESSAGES ------------------------------------------------------ BELOW HERE -------------------

    // On socket connect message - log welcome to game message
    socket.on ('connect', () => {
        postMessage(`You have connected to game.`);
    });

    // On welcome packet from server, build objects for the game with provided data
    socket.on ('Welcome', function(data) {

        // Create your character using random values, and color provided from server (data.nextColor)
        myPlayer = new Player({
                            x: Math.floor((Math.random()*(width-100)) + 50), 
                            y: Math.floor((Math.random()*((height-header)-100))+header+50),  
                            rot: Math.floor(Math.random()*360), 
                            score: 0, 
                            color: data.nextColor,
                            id: socket.id});

        // Send newly created player data to server
        socket.emit("New Player", myPlayer.serialize());
        
        // Create and load each of your fellow players received into array
        data.players.forEach( player => {
            playerList.push(new Player({
                            x: player.x,
                            y: player.y,
                            rot: player.rot,
                            score: player.score,
                            color: player.color,
                            id: player.id}));
        })

        // Create the collectible received
        collectible = new Collectible({
                            x: data.collectible.x,
                            y: data.collectible.y,
                            value: data.collectible.value,
                            id: data.collectible.id});

        // Create the projectile received
        projectile = new Projectile({
                            x: data.projectile.x,
                            y: data.projectile.y,
                            value: data.projectile.value,
                            id: data.projectile.id,
                            fired: data.projectile.fired,
                            carried: data.projectile.carried});
        
        // Draw the title, indicate a change needs draw, and start the game interval clock
        drawHeader();
        changed = true;
        gameInt = setInterval(drawGame, 66);
    });
    
    // Player List message - ran when a refresher list of players has been sent
    socket.on ('Player List', function(list) {

    });

    // Player Add message - indicates a new player has joined the game
    socket.on ('Player Add', function(player) {

        // If not yourself, go through data and build a new player, add to array, redraw/calculate rankings, request redraw with change
        if (player.id != myPlayer.id) {
            changed = true;
            postMessage(`A ${player.color} player has joined the game.`);
            playerList.push(new Player({
                                x: player.x,
                                y: player.y,
                                rot: player.rot,
                                score: player.score,
                                color: player.color,
                                id: player.id}));
            drawRanking();
        }
    });

    // Player Update - indicates a player has moved/changed, if not yourself, update data and request redraw with change
    socket.on ('Player Update', function(player) {
        if (player.id != myPlayer.id) {
            changed = true;
            for (let value in player) {
                playerList[playerList.findIndex( item => item.id == player.id)][value] = player[value];
            }
        }   

        // If new score supplied, redraw rankings
        if ('score' in player) {
            drawRanking();
        }
    });

    // Player Remove - indicates a player left the game, post message and remove player from array, request redraw of frame and ranking
    socket.on ('Player Remove', function(id) {
        postMessage(`A ${playerList[playerList.findIndex(obj => obj.id == id)].color} player has left the game.`)
        playerList = playerList.filter(player => player.id != id);
        changed = true;
        drawRanking();
    });

    // Collectible Add - indicates new collectible, overwrite current collectible and request redraw with change
    socket.on ('Collectible Add', function(coll) {
        collectible = new Collectible({
                                x: coll.x,
                                y: coll.y,
                                value: coll.value,
                                id: coll.id});
        changed = true;
    });

    // Projectile Add - indicates new projectile, overwrite current projectile and request redraw with change
    socket.on ('Projectile Add', function(proj) {
        projectile = null;
        projectile = new Projectile({
                                x: proj.x,
                                y: proj.y,
                                value: proj.value,
                                id: proj.id,
                                fired: proj.fired,
                                carried: proj.carried});
        changed = true;
    });

    // Projectile Update - indicates change in projectile location/status - update accordingly and redraw
    socket.on ('Projectile Update', function(proj) {
        if (!myPlayer.carrying) {
            for (let key in proj) {
                projectile[key] = proj[key];
                changed = true;
            }
        }
    });

    // disconnect - indicates you've been disconnected from server... clears all variables... will rebuild when reconnected
    socket.on ('disconnect', () => {
        postMessage("You've been disconnected from server!");
        myPlayer = null;
        projectile = null;
        collectible = null;
        playerList = [];
        clearInterval(gameInt);
        gameInt = null;
        context.clearRect(0,0,width,height);
    })
// NETWORK MESSAGES ------------------------------------------------------ ABOVE HERE -------------------

});

// drawGame function - ran by gameInt interval to move player, check collisions and redraw elements
function drawGame () {

    // if currently dead(counter not 0), decrement deadcounter until 0, then recreate yourself with random location/rotation and send network update
    if (deadcounter > 0) {
        deadcounter --;
        if (deadcounter == 0) {
            myPlayer.x = Math.floor((Math.random()*(width-100)) + 50);
            myPlayer.y = Math.floor((Math.random()*((height-header)-100))+header+50);
            myPlayer.rot = Math.floor(Math.random()*360);
            myPlayer.dead = false; 
            socket.emit("Update Player", {id: myPlayer.id, x: myPlayer.x, y: myPlayer.y, rot: myPlayer.rot, dead: myPlayer.dead})
        }
    }

    // if key held down (moving) indicate change needs redrawn, and move your player accordingly
    if (myPlayer.moving != 0) {
        changed = true;

        myPlayer.movePlayer(myPlayer.moving, moveSpeed);

        // if player location is outside the canvas, set location to the boundry
        if (myPlayer.x > width - 20 ) { myPlayer.x = width-20 }
        else if (myPlayer.x < 20 ) { myPlayer.x = 20 }
        if (myPlayer.y > height - 20 ) { myPlayer.y = height-20 }
        else if (myPlayer.y < header + 20 ) { myPlayer.y = header+20 }

        // if collectible exists and player hit it, update and draw score, and send network messages of location/score change and collectible change
        if (collectible && myPlayer.collision(collectible)) {
            myPlayer.score += collectible.value;
            drawScore();
            collectible = null;
            socket.emit("Update Collectible");
            socket.emit("Update Player", {id: myPlayer.id, x: myPlayer.x, y: myPlayer.y, rot: myPlayer.rot, score: myPlayer.score})

        // if no collectible hit, just send location update to server    
        } else {
            socket.emit("Update Player", {id: myPlayer.id, x: myPlayer.x, y: myPlayer.y, rot: myPlayer.rot});
        }

        // if player is carrying the projectile, update projectile location and send network update message for projectile
        if (myPlayer.carrying) {
            projectile.x = myPlayer.x;
            projectile.y = myPlayer.y;
            socket.emit("Update Projectile", {id: projectile.id, x: projectile.x, y: projectile.y});
        }

    }

    // if key pressed down to rotate character, indicate change and rotate character, send update to network of change
    if (myPlayer.rotating != 0) {
        changed = true;
        myPlayer.rotPlayer(myPlayer.rotating, rotSpeed);
        socket.emit("Update Player", {id: myPlayer.id, rot: myPlayer.rot});
    }

    // if current projectile needs replaced (fired=999) clear and send destroyed update to server, indicate change
    if (projectile && projectile.fired == 999 && projectile.firer == myPlayer.id) {
        socket.emit("Update Projectile", {id: projectile.id, destroyed: true});
        projectile = null;
        changed = true;
    }
    
    // if a frame change has been indicated, redraw and update frame
    if (changed) {

        // if projectile exists and its touching a character, handle event
        if (projectile && myPlayer.collision(projectile)) {

            // if projectile has been fired, and not by the hit player, and its active (<400), handle destruction
            if (projectile.fired) {
                if (projectile.firer != myPlayer.id && projectile.fired < 400) {
                    
                    // reduce/update score and update player as dead, set projectile to animate explosion(fired=990), and update server
                    myPlayer.score -= 200;
                    projectile.fired = 990;
                    projectile.x = myPlayer.x;
                    projectile.y = myPlayer.y; 
                    myPlayer.dead = true;
                    myPlayer.moving = 0;
                    myPlayer.rotating = 0;
                    deadcounter = 30;
                    drawScore();
                    socket.emit("Update Projectile", {id: projectile.id, fired: projectile.fired, x: projectile.x, y: projectile.y});
                    socket.emit("Update Player", {id: myPlayer.id, score: myPlayer.score, dead: myPlayer.dead})
                }

            // if projectile is not being carried, have hit player pick it up    
            } else if (!projectile.carried) {

                // update/draw score, set player and projectile to carrying status, update server
                myPlayer.score += projectile.value;
                myPlayer.carrying = true;
                projectile.carried = true;
                projectile.x = myPlayer.x;
                projectile.y = myPlayer.y;
                drawScore();
                socket.emit("Update Player", {id: myPlayer.id, score: myPlayer.score});
                socket.emit("Update Projectile", {id: projectile.id, x: projectile.x, y: projectile.y, carried: projectile.carried});

            // projectile currently carried while you hit it, maybe implement stealing
            } else {
                // if you're not the carrier, could implement stealing of projectile
            }
        }
        
        // Clear the drawing window(excluding the header)
        context.clearRect(0,header,width,height-header);

        // If collectible exists, draw it (draw method animates the coin spinning)
        if (collectible){collectible.draw(context)};

        // if projectile exists, isn't carried or fired, draw it before players... otherwise need to draw it after players
        if (projectile && !projectile.carried && !projectile.fired) {
            projectile.draw(context);
        }

        // draw each player in the player list if they aren't dead
        for (let player of playerList) {
            if (!player.dead) {
                player.draw(context);
            }
        }

        // draw yourself (draw function doesn't draw if you're dead)
        myPlayer.draw(context);

        // if projectile exists and is carried or fired, draw it on top of players
        if (projectile && (projectile.carried || projectile.fired)) {
            projectile.draw(context);
        }

    // if no player or projectile changes indicated, just redraw the collectible (the draw function animates the spinning)    
    } else {
        collectible.draw(context);
    }

}

// drawHeader function - draws the entire top bar - only ran when game starts after welcome network message
function drawHeader () {

    // Draw top header bar
    context.fillStyle = 'darkgrey';
    context.strokeStyle = 'black';
    context.fillRect( 0, 0, width, header);

    // Draw the game title
    context.fillStyle = 'black';
    context.font = "24px 'Press Start 2P'";
    context.fillText ("TANK", 10, 35);
    context.fillText ("BATTLE", 10, 65)

    // Draw the menu header
    context.font = "16px 'Press Start 2P'";
    context.fillText ("Controls    Score     Rank", 200, 20);

    // Draw the buttons for controls graphics
    context.beginPath();
    context.moveTo(185, 50);
    context.lineTo(200, 50);
    context.lineTo(200, 65);
    context.lineTo(185, 65);
    context.lineTo(185, 50);
    context.moveTo(205, 50);
    context.lineTo(220, 50);
    context.lineTo(220, 65);
    context.lineTo(205, 65);
    context.lineTo(205, 50);
    context.moveTo(225, 50);
    context.lineTo(240, 50);
    context.lineTo(240, 65);
    context.lineTo(225, 65);
    context.lineTo(225, 50);
    context.moveTo(205, 30);
    context.lineTo(220, 30);
    context.lineTo(220, 45);
    context.lineTo(205, 45);
    context.lineTo(205, 30);
    context.moveTo(255, 35);
    context.lineTo(345, 35);
    context.lineTo(345, 50);
    context.lineTo(255, 50);
    context.lineTo(255, 35);
    context.stroke();
    context.closePath();

    //Draw the labels for the control buttons
    context.font = "12px 'Press Start 2P'";
    context.fillText ("Fire!", 272, 49);
    context.fillText ("◄", 186, 62);
    context.fillText ("▼", 206, 62);
    context.fillText ("►", 227, 62);
    context.fillText ("▲", 206, 42);

    //Draw alternate control text
    context.font = "10px 'Press Start 2P'";
    context.fillText ("(alt-wasd)", 250, 70 )

    //Draw the score box
    context.strokeRect(375, 30, 120, 35);
    context.fillStyle = 'darkgreen';
    context.fillRect(375, 30, 120, 35);

    //Calculate and draw score and ranking
    drawScore();
    drawRanking();

    //Draw sample player tank in header
    context.fillStyle = 'black';
    context.fillRect(608,30,22,30);
    context.fillStyle = myPlayer.color;
    context.fillRect(611, 31, 16, 27);
    context.strokeStyle = 'black';
    context.fillRect(616,29, 6, 12);
    context.strokeRect(616,29, 6, 12);
    context.beginPath();
    context.arc(619,48,7,0,2*Math.PI);
    context.stroke();
    context.closePath();

}

// drawScore function - clears and redraws the score numbers, called when score changes occur
function drawScore () {
    context.fillStyle = 'darkgreen';
    context.fillRect(375, 30, 120, 35);
    context.textAlign = 'right';
    context.font = "20px 'Press Start 2P'";
    context.fillStyle = 'lightgreen';
    context.fillText(myPlayer.score, 485, 60);

}

// drawRanking function - called when any players add/remove or score changes - calculate and redraws the ranking text in header
function drawRanking () {
    context.fillStyle = 'darkgrey';
    context.fillRect(510, 25, 95, 45);
    context.textAlign = 'center';
    context.font = "28px 'Press Start 2P'";
    context.fillStyle = 'black';
    context.fillText(`#${myPlayer.calculateRank(playerList).split('/')[0].slice(6)}`, 570, 55);
    context.font = "10px 'Press Start 2P'";
    context.fillText(`out of ${playerList.length + 1}`, 560, 70);


}

// postMessage function - called to post a message in the bottom log window with a timestamp
function postMessage(message) {
    const m = document.createElement('li');
    m.innerHTML = `${new Date(Date.now()).toString().slice(0,25)} > ${message}`;
    messageList.append(m);
    m.scrollIntoView(true);
}

// handleKeyDown function - runs when key pressed, if arrows or space handles player action
function handleKeyDown (e) {
    const key = e.keyCode;
    if ([37,38,39,40,32,87,83,65,68].includes(key) && !myPlayer.dead) {
        e.preventDefault();

        //Based on key, sends player moving/rotation direction, or indicates firing of projectile
        if (key == 38) {       // up arror - go forward
            myPlayer.moving = 1;
        }     
        else if (key == 40) {    // down arror - go backward
            myPlayer.moving = -1;
        }
        else if (key == 37) {    //left arror - rotate left
            myPlayer.rotating = -1;
        }
        else if (key == 39) {    // right arror - rotate right
            myPlayer.rotating = 1;
        }
        else if (key == 32) {    // spacebar - fire

            // if player is carrying projectile, fire the projectile
            if (myPlayer.carrying) {

                // indicate not carrying, send fired to angle of attack, set player id to firer, and set projectile location to in front of tank
                myPlayer.carrying = false;
                projectile.fired = myPlayer.rot;
                projectile.firer = myPlayer.id;
                projectile.y -= 15 * Math.sin(projectile.fired*(Math.PI/180));
                projectile.x -= 15 * Math.cos(projectile.fired*(Math.PI/180));
                
                // update server regarding player and projectile changes
                socket.emit("Update Player", {id: myPlayer.id, carrying: false});
                socket.emit("Update Projectile", {id: projectile.id, x: projectile.x, y: projectile.y, carried: projectile.carried, fired: projectile.fired});
            }
        }
        else if (key == 87) {     // W - move up
            myPlayer.moving = 'up'
        }
        else if (key == 83) {     // S - move down
            myPlayer.moving = 'down'
        }
        else if (key == 65) {     // A - move left
            myPlayer.moving = 'left'
        }
        else if (key == 68) {     // D - move right
            myPlayer.moving = 'right'
        }
    }
}

// handleKeyUp function - called when key is released, if arrows, cancel player movement/rotation
function handleKeyUp (e) {
    const key = e.keyCode;
    if ([37,38,39,40,32,87,83,65,68].includes(key) && !myPlayer.dead) {
        e.preventDefault();
        if ([38,40,87,83,65,68].includes(key)) { myPlayer.moving = 0 }     // up, down, W, A, S, or D released - stop moving
        else if ([37,39].includes(key)) { myPlayer.rotating = 0 }   // left or right arrow - stop rotating
    }
}
