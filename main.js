var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var fs = require('fs');
var path = require('path');
var favicon = require('serve-favicon');
var Player = require('./player');

/******
* Let Heroku choose the listening port
******/
var port = process.env.PORT || 8080;


var session = require('express-session');
var cookieParser = require('cookie-parser');

app.use(favicon(__dirname + '/public/img/favicon.ico'));
app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '/public/html/index.html'));
});


const MAX_PLAYERS_BY_ROOM = 2;

// nombres de lignes nécessaires pour gagner
const LINES_TO_WIN = 30;

/**********************
      SOCKET.IO
**********************/

var players = {};
var listeRooms = [];
/*************
io.nsps['/'].adapter.rooms contient déjà la liste des rooms, mais il contient aussi une room 
supplémentaire par socket connectée, crée automatiquement à la connection de chaque socket.

listeRooms contiendra uniquement les rooms crées manuellement.
************/


io.on('connection', function (socket) {
  players[socket.id] = new Player(socket.id);

  //console.log('Player '+ socket.id + 'joined, current players connected : ' + JSON.stringify(players));
  socket.on('getRoomList', sendRoomList);
  socket.on('newPlayer', createPlayer);
  socket.on('nameChange', nameChange);
  socket.on('joinRoom', joinRoom);
  socket.on('playerReady', getReady);
  socket.on('newGrid', sendGrid);
  socket.on('blockMoved', sendBlockPosition);
  socket.on('linesWereCompleted', sendPunishment);
  socket.on('gameOver', gameOver);
  socket.on('disconnect', removePlayer);
  socket.on('leaveRoom', leaveRoom);
});




var sendRoomList = function(){
  this.emit('rooms', {rooms: listeRooms});
};

var nameChange = function(data){
  if(data.name != ''){
    for(let player of Object.keys(players)){
      //console.log(players[player].ready);
      if(players[player].nick == data.name){
        this.emit('nameChanged', {name: null, msg: 'Ce nom est déjà pris.'});
        return;
      }
    }
    players[this.id].nick = data.name;
    this.emit('nameChanged', {name: data.name});
  }
}
var createPlayer = function(){

};

var joinRoom = function(data){
  //console.log('joinroom' + JSON.stringify(data));
  if(!players[this.id].nick){
    this.emit('roomJoined', {room: null, message: 'Vous devez entrer un nom d\'utilisateur avant de pouvoir rejoindre une partie.'});
  }
  else{
    let roomName = data.room || createRandomRoomNumber();
    let room = io.nsps['/'].adapter.rooms[roomName];
  

    if(room && room.length >= MAX_PLAYERS_BY_ROOM){
      this.emit('roomJoined', {room: null, message: 'Il n\'y a plus de place dans la partie que vous essayez de joindre.'});
    }
    else{
      if(!room){
        listeRooms.push(roomName);
      }
  //    this.test = Math.random()* 10 | 0;
      sendPlayerList(this, roomName);
      this.join(roomName);
      players[this.id].room = roomName;
      this.broadcast.to(players[this.id].room).emit('newPlayer', {id:this.id, name: players[this.id].nick});
      //this.emit('playerList', {list: io.nsps['/'].adapter.rooms[players[this.id].room].sockets.keys()});
      this.emit('roomJoined', {room: roomName});
    }
    //console.log(listeRooms);
  }
};

var getReady = function(){
  players[this.id].ready = true;
  players[this.id].score = 0;
  let currentRoom = players[this.id].room;
  //console.log(this.id + ' is ready');
  // Si il y a plus d'un joueur dans la room et que tout le monde est prêt, on lance la partie
  if(io.nsps['/'].adapter.rooms[currentRoom].length > 1 && checkReady(currentRoom)){
    //console.log(checkReady(currentRoom));
    // Avant de lancer, on remet la variable 'gameOver' de chaque joueur à 'false'
    for(let player of Object.keys(io.nsps['/'].adapter.rooms[currentRoom].sockets)){
      //console.log(players[player].ready);
      players[player].gameOver = false;
    }

    io.sockets.in(currentRoom).emit('go', {goal: LINES_TO_WIN});
  }
};

// Vérifie si tout le monde est prêt
var checkReady = function(room){
  //console.log(io.nsps['/'].adapter.rooms[room]);
  for(let player of Object.keys(io.nsps['/'].adapter.rooms[room].sockets)){
    //console.log(players[player].ready);
    if(!players[player].ready){
      return false;
    }
  }
  return true;
};

var sendPlayerList = function(socket, roomName) {
  let room = io.nsps['/'].adapter.rooms[roomName];
  //console.log(room);
  if(room){
    let list = [];
    for(let id of Object.keys(room.sockets)){
      list.push({id:id, name:players[id].nick});
    }
    socket.emit('playerList', {list: list});
  }
};

var sendGrid = function(data){
  this.broadcast.to(players[this.id].room).emit('enemyLaidAPiece', {grid: data.grid, id:this.id});
};

var sendBlockPosition = function(data){
  this.broadcast.to(players[this.id].room).emit('enemyMoved', {piece: data.piece, id:this.id});
};

// Quand un joueur efface 2,3, ou 4 lignes, on ajoute respectivement 1, 2 ou 4 lignes incomplètes aux adversaires
var sendPunishment = function(data){
  players[this.id].score += data.nbLignes;
  //console.log(players[this.id].nick + ' : ' + players[this.id].score);
  if (data.nbLignes <= 4){ // Anti-triche :o
    if(data.nbLignes != 4){
      data.nbLignes--;
    }
    this.broadcast.to(players[this.id].room).emit('iPityTheFool', {nbLignes: data.nbLignes, score: players[this.id].score});
  }

  if(players[this.id].score >= LINES_TO_WIN){
    io.sockets.in(players[this.id].room).emit('weHaveAWinner', {winner: {id: this.id, nick: players[this.id].nick}});
  }
};

// Prend en note quand un joueur a perdu, et si tout le monde a perdu sauf un joueur,
// prévient le joueur gagnant de sa victoire
var gameOver = function(data){
  players[this.id].gameOver = true;
  //console.log(this.id + 'lost');
  let stillAliveList = stillAlive(players[this.id].room);
  if(stillAlive.length == 1){
    for(let player of Object.keys(io.nsps['/'].adapter.rooms[players[this.id].room].sockets)){
      //console.log(players[player].ready);
      players[player].ready = false;
    }
    io.sockets.in(players[this.id].room).emit('weHaveAWinner', {winner: {id: stillAliveList[0], nick: players[stillAliveList[0]].nick}});
  }
};

var leaveRoom = function(socket, room){
  //console.log('leave' + room);
  socket.leave(room);
  // Si la room est vide, on la supprime de la liste des rooms
  if(!io.nsps['/'].adapter.rooms[room]){
    //console.log('room is empty');
    listeRooms.splice(listeRooms.indexOf(room), 1);
  }
};

var removePlayer = function(data){
  let currentRoom = players[this.id].room;
  // Si le client était dans une room, n prévient les autres clients présents dans la room
  // pour qu'ils supprimment l'affichage du joueur
  if(currentRoom){
    this.broadcast.to(currentRoom).emit('playerLeft', {id: this.id});
    leaveRoom(this, currentRoom);
  }
  delete players[this.id];
  //console.log('Player '+ this.id + 'quit, current players connected : ' + JSON.stringify(players));
};

// Renvoie la liste des joueurs n'ayant pas encore perdu
var stillAlive = function(room){
  let stillAliveList = [];
  Object.keys(io.nsps['/'].adapter.rooms[room].sockets).forEach(function(element){
    if(!players[element].gameOver){
      stillAliveList.push(element);
    }
  });
  return stillAliveList;
};


var createRandomRoomNumber = function(){
  let room;
  do{
    room = Math.random() * 1000000000 | 0;
  }while(listeRooms.indexOf(room) > -1);
  return room;
};

/*
io.on('connection', function (socket) {
  if(players.length < 2){
    let id = players.length;
    if(players.length == 1){
      socket.emit('newPlayer', {id:players[0].id});
      socket.emit('go', {});
      socket.broadcast.emit('go', {});
    }
    players.push({id: id, ready:false});
    console.log('connection joueur ' + players.length);
    socket.broadcast.emit('newPlayer', {id: id});
    socket.on('newGrid', function (data) {

      this.emit('test', {test:this.id});
      socket.broadcast.emit('enemyLaidAPiece', {grid: data.grid});
    });

    socket.on('blockMoved', function(data){
      socket.broadcast.emit('enemyMoved', {piece: data.piece});
    });

    socket.on('punishment', function(data){
      socket.broadcast.emit('iPityTheFool', {nbLignes: data.nbLignes})
    })
    socket.on('disconnect', function(data){
      // delete player from player list
    });
  }
});
*/

server.listen(port);