import Player from './Player.mjs';
import Collectible from './Collectible.mjs';
import Projectile from './Projectile.mjs';

const width = 640;
const height = 480;
const header = 75;
const rotSpeed =  10;
const moveSpeed = 10;
const socket = io();
const canvas = document.getElementById('game-window');
canvas.width = width;
canvas.height = height;
const context = canvas.getContext('2d');
const messageList = document.getElementById("message-list");
let myPlayer = null;
let playerList = [];
let gameInt = null;
let collectible = null;
let projectile = null;
let changed = false;

document.addEventListener('DOMContentLoaded', () => {
    postMessage(`Connecting to game...`);
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    const myfont = new FontFace('Press Start', 'url(https://fonts.gstatic.com/s/pressstart2p/v14/e3t4euO8T-267oIAQAu6jDQyK3nRivN04w.woff2)');
    document.fonts.add(myfont);
    myfont.load().then( () => {console.log("Font is loaded.")});
 

    socket.on ('connect', () => {
        postMessage(`You have connected to game.`);
    });

    socket.on ('Welcome', function(data) {
        myPlayer = new Player(Math.floor((Math.random()*(width-100)) + 50), 
                                                Math.floor((Math.random()*((height-header)-100))+header+50),  
                                                Math.floor(Math.random()*360), 0, data.nextColor,socket.id); 

        socket.emit("New Player", myPlayer.serialize());

        data.players.forEach( player => {
            playerList.push(new Player(player.x, player.y, player.rot, player.score, player.color, player.id));
        })

        collectible = new Collectible(data.collectible.x, data.collectible.y, data.collectible.value, data.collectible.id);

        projectile = new Projectile(data.projectile.x, data.projectile.y, data.projectile.value, data.projectile.id);
        
        drawHeader();
        changed = true;
        gameInt = setInterval(drawGame, 66);
    });
    
    socket.on ('Player List', function(list) {

    });

    socket.on ('Player Add', function(player) {
        if (player.id != myPlayer.id) {
            changed = true;
            postMessage(`A ${player.color} player has joined the game.`);
            playerList.push(new Player(player.x, player.y, player.rot, player.score, player.color, player.id));
            drawRanking();
        }
    });

    socket.on ('Player Update', function(player) {
        if (player.id != myPlayer.id) {
            changed = true;
            for (let value in player) {
                playerList[playerList.findIndex( item => item.id == player.id)][value] = player[value];
            }
        }   
        drawRanking();
    });

    socket.on ('Player Remove', function(id) {
        postMessage(`A ${playerList[playerList.findIndex(obj => obj.id == id)].color} player has left the game.`)
        playerList = playerList.filter(player => player.id != id);
        changed = true;
        drawRanking();
    });

    socket.on ('Collectible Add', function(coll) {
        collectible = new Collectible(coll);
        changed = true;
    });

    socket.on ('Projectile Add', function(proj) {
        projectile = new Projectile(proj);
        changed = true;
    });

    socket.on ('Projectile Update', function(proj) {
        for (key in proj) {
            projectile[key] = proj[key];
            changed = true;
        }
    });

});
/*  socket.on("Update Collectable", () => {
 
  socket.on("Update Projectile", proj => {
    if ("destroyed" in proj) {}*/ 

function drawGame () {
    if (myPlayer.moving != 0) {
        changed = true;
        myPlayer.movePlayer(myPlayer.moving, moveSpeed);
        if (myPlayer.x > width - 20 ) { myPlayer.x = width-20 }
        else if (myPlayer.x < 20 ) { myPlayer.x = 20 }
        if (myPlayer.y > height - 20 ) { myPlayer.y = height-20 }
        else if (myPlayer.y < header + 20 ) { myPlayer.y = header+20 }

        socket.emit("Update Player", {id: myPlayer.id, x: myPlayer.x, y: myPlayer.y});
    }

    if (myPlayer.rotating != 0) {
        changed = true;
        myPlayer.rotPlayer(myPlayer.rotating, rotSpeed);
        socket.emit("Update Player", {id: myPlayer.id, rot: myPlayer.rot});
    }

    collectible.draw(context);

    if (changed) {
        
        context.clearRect(0,header,width,height-header);

        myPlayer.draw(context);

        projectile.draw(context);

        for (let player of playerList) {
            player.draw(context);
        }

    }
}

function drawHeader () {
    // Draw top header bar
    context.fillStyle = 'darkgrey';
    context.fillRect( 0, 0, width, header);

    // Draw the game title
    context.fillStyle = 'black';
    context.font = "24px 'Press Start 2P'";
    context.fillText ("TANK", 10, 35);
    context.fillText ("BATTLE", 10, 65)

    // Draw the menu header
    context.font = "16px 'Press Start 2P'";
    context.fillText ("Controls    Score     Rank", 200, 20);

    // Draw the buttons for controls
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
    context.moveTo(250, 40);
    context.lineTo(340, 40);
    context.lineTo(340, 55);
    context.lineTo(250, 55);
    context.lineTo(250, 40);
    context.stroke();
    context.closePath();

    //Draw the labels for the control buttons
    context.font = "12px 'Press Start 2P'";
    context.fillText ("Fire!", 267, 54);
    context.fillText ("◄", 186, 62);
    context.fillText ("▼", 206, 62);
    context.fillText ("►", 227, 62);
    context.fillText ("▲", 206, 42);

    //Draw the score box
    context.strokeRect(375, 30, 120, 35);
    context.fillStyle = 'darkgreen';
    context.fillRect(375, 30, 120, 35);

    drawScore();
    drawRanking();

    //Draw sample tank
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

function drawScore () {
    context.fillStyle = 'darkgreen';
    context.fillRect(375, 30, 120, 35);
    context.textAlign = 'right';
    context.font = "20px 'Press Start 2P'";
    context.fillStyle = 'lightgreen';
    context.fillText(myPlayer.score, 485, 60);

}

function drawRanking () {
    context.fillStyle = 'darkgrey';
    context.fillRect(510, 25, 95, 45);
    context.textAlign = 'center';
    context.font = "28px 'Press Start 2P'";
    context.fillStyle = 'black';
    context.fillText(`#${myPlayer.calculateRank(playerList)}`, 570, 55);
    context.font = "10px 'Press Start 2P'";
    context.fillText(`out of ${playerList.length + 1}`, 560, 70);


}

function postMessage(message) {
    const m = document.createElement('li');
    m.innerHTML = `${new Date(Date.now()).toString().slice(0,25)} > ${message}`;
    messageList.append(m);
}

function handleKeyDown (e) {
    const key = e.keyCode;
    if ([37,38,39,40,32].includes(key)) {
        e.preventDefault();
        if (key == '38') {       // up arror - go forward
            myPlayer.moving = 1;
            //myPlayer.movePlayer(myPlayer.rot, moveSpeed);
            //socket.emit("Update Player", {id: myPlayer.id, x: myPlayer.x, y: myPlayer.y});
        }     
        else if (key == 40) {    // down arror - go backward
            myPlayer.moving = -1;
            //myPlayer.movePlayer((myPlayer.rot+180) % 360, moveSpeed); 
            //socket.emit("Update Player", {id: myPlayer.id, x: myPlayer.x, y: myPlayer.y});
        }
        else if (key == 37) {    //left arror - rotate left
            myPlayer.rotating = -1;
            //myPlayer.rotPlayer(-1, rotSpeed); 
            //socket.emit("Update Player", {id: myPlayer.id, rot: myPlayer.rot});
        }
        else if (key == 39) {    // right arror - rotate right
            myPlayer.rotating = 1;
            //myPlayer.rotPlayer(1, rotSpeed);
            //socket.emit("Update Player", {id: myPlayer.id, rot: myPlayer.rot});
        }
        else if (key == 32) { myPlayer.fire() }   // spacebar - fire
       // drawGame();
    }
}

function handleKeyUp (e) {
    const key = e.keyCode;
    if ([37,38,39,40,32].includes(key)) {
        e.preventDefault();
        if (key == '38') { myPlayer.moving = 0 }     // up arror - go forward
        else if (key == 40) { myPlayer.moving = 0 }   // down arror - go backward
        else if (key == 37) { myPlayer.rotating = 0 }   // left arror - rotate left
        else if (key == 39) { myPlayer.rotating = 0 }   // right arror - rotate right
       // drawGame();
    }
}
