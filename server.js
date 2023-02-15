require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const expect = require('chai');
const cors = require('cors');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');

const app = express();

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
const http = require('http').Server(app);
const io = require('socket.io')(http);
let playerList = [];
const colors = ["cyan", "red", "green", "yellow","grey","orange","pink","purple"];
let nextColor = 0;
const Collectible = require('./public/Collectible.mjs');
const Projectile = require('./public/Projectile.mjs');
let collectible = createColl();
let projectile = createProj();

function createColl() {
  return new Collectible({
    x: Math.floor((Math.random()*(640-100)) + 50), 
    y: Math.floor((Math.random()*((480-75)-100))+75+50),
    value: Math.floor((Math.random()*50) + 50), 
    id: 1});
}

function createProj() {
  return new Projectile({
    x: Math.floor((Math.random()*(640-100)) + 50),
    y: Math.floor((Math.random()*((480-75)-100))+75+50),
    value: 50,
    id: 1});
}

io.on("connection", (socket) => {
  console.log("New Player Connected: Player Id - " + socket.id);

  io.to(socket.id).emit("Welcome", {nextColor: colors[nextColor%8], players: playerList, collectible: collectible, projectile: projectile });
  nextColor ++;

  socket.on("disconnect", sock => {
    console.log("A Player has left the game: Player Id - " + socket.id);
    playerList = playerList.filter( player => player.id != socket.id );

    io.emit("Player Remove", socket.id);
  });

  socket.on("New Player", player => {
    playerList.push(player);
    io.emit("Player Add", player); 
  });

  socket.on("Update Player", player => {
    for (key in player) {
      playerList[playerList.findIndex(obj => obj.id == player.id)][key] = player[key];
    }
    io.emit("Player Update", player)
  });

  socket.on("Update Collectible", () => {
    io.emit("Collectible Add", createColl());
  });

  socket.on("Update Projectile", proj => {
    if ("destroyed" in proj) {
      io.emit("Projectile Add", createProj());
    } else {
      for (key in proj) {
        projectile[key] = proj[key];
        io.emit("Projectile Update", projectile);
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
