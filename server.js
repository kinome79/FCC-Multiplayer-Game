require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const expect = require('chai');
const cors = require('cors');
const helmet = require('helmet');
const noCache = require('nocache');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');

const app = express();

// use helmet to secure site, preventing sniffing, xss attachs, and client side caching
app.use(helmet.noSniff());
app.use(noCache());

// set x-powered-by on headers to php7.4.3 to misdirect
app.use( (req,res,next) => {
  res.setHeader("X-Powered-By", "PHP 7.4.3");
  next();
});

// set XSS protection to block (newer version of helmet sets it to 0 which doesn't pass the test)
app.use((req, res, next) => {
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//For FCC testing purposes and enables user to connect from outside the hosting platform
app.use(cors({origin: '*'})); 

// Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  }); 

//For FCC testing purposes
fccTestingRoutes(app);
    
// 404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

// GAME SERVER SECTION ---------------------------------------------------------------------------------------
// declare server variables
const http = require('http').Server(app);
const io = require('socket.io')(http);

// declare and import game variables from modules
let playerList = [];
const colors = ["cyan", "red", "green", "yellow","grey","orange","pink","purple"];
let nextColor = 0;
const Collectible = require('./public/Collectible.mjs');
const Projectile = require('./public/Projectile.mjs');
let collID = 0;
let projID = 0;
let collectible = createColl();
let projectile = createProj();

// createColl function - creates a collectable object with random positioning and value between 50-100, and unique ID
function createColl() {
  collID ++;
  return new Collectible({
    x: Math.floor((Math.random()*(640-100)) + 50), 
    y: Math.floor((Math.random()*((480-75)-100))+75+50),
    value: Math.floor((Math.random()*50) + 50), 
    id: collID});
}

// createProj function - create a projectile object with random positioning, value of 25, and unique ID
function createProj() {
  projID ++;
  return new Projectile({
    x: Math.floor((Math.random()*(640-100)) + 50),
    y: Math.floor((Math.random()*((480-75)-100))+75+50),
    value: 25,
    id: projID});
}

// On client connection, log player id to log and send wecome packet with their color, list of players, and collectible/projectile objects
io.on("connection", (socket) => {
  console.log("New Player Connected: Player Id - " + socket.id);
  io.to(socket.id).emit("Welcome", {nextColor: colors[nextColor%8], players: playerList, collectible: collectible, projectile: projectile });
  nextColor ++;

  // On client disconnect, log player leaving, remove player from playerlist, and send Remove Player network message to clients
  socket.on("disconnect", sock => {
    console.log("A Player has left the game: Player Id - " + socket.id);
    playerList = playerList.filter( player => player.id != socket.id );

    io.emit("Player Remove", socket.id);
  });

  // On new player added, add to local player list, and send Player Add network message to clients with player details
  socket.on("New Player", player => {
    playerList.push(player);
    io.emit("Player Add", player); 
  });

  // On player changed, update local player list, and send Player Update network message to clients with changes
  socket.on("Update Player", player => {
    for (key in player) {
      playerList[playerList.findIndex(obj => obj.id == player.id)][key] = player[key];
    }
    io.emit("Player Update", player)
  });

  // On collectible update(collected), create new collectible and sent it to clients with Collectible Add
  socket.on("Update Collectible", () => {
    io.emit("Collectible Add", createColl());
  });

  // On projectile changes, if destroyed create new projectile and send to clients, otherwise update projectile and send to clients
  socket.on("Update Projectile", proj => {
    if ("destroyed" in proj) {
      projectile = createProj();
      io.emit("Projectile Add", projectile);
    } else {
      for (key in proj) {
        projectile[key] = proj[key];
        io.emit("Projectile Update", proj);
      }
    }
  })
});

// END GAME SERVER SECTION -----------------------------------------------------------------------------------

const portNum = process.env.PORT || 3000;

// Set up server and tests
const server = http.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});

module.exports = app; // For testing
