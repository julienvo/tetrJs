var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var fs = require('fs');
var path = require('path');
var Player = require('./player');

/******
* Let Heroku choose the listening port
******/
var port = process.env.PORT || 8080;


var session = require('express-session');
var cookieParser = require('cookie-parser');


app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '/public/html/index.html'));
});


/**********************
      SOCKET.IO
**********************/

const MAX_PLAYERS_BY_ROOM = 2;


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
  socket.on('joinRoom', joinRoom)
  socket.on('playerReady', getReady);
  socket.on('newGrid', sendGrid);
  socket.on('blockMoved', sendBlockPosition);
  socket.on('punishment', sendPunishment);
  socket.on('gameOver', gameOver);
  socket.on('disconnect', removePlayer);
  socket.on('leaveRoom', leaveRoom);
});




var sendRoomList = function(){
  this.emit('rooms', {rooms: listeRooms});
};

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
      this.broadcast.to(players[this.id].room).emit('newPlayer', {id:this.id});
      //this.emit('playerList', {list: io.nsps['/'].adapter.rooms[players[this.id].room].sockets.keys()});
      this.emit('roomJoined', {room: roomName});
    }
    //console.log(listeRooms);
  }
};

var getReady = function(){
  players[this.id].ready = true;
  let currentRoom = players[this.id].room;
  //console.log(this.id + ' is ready');
  // Si il y a plus d'un joueur dans la room et que tout le monde est prêt, on lance
  if(io.nsps['/'].adapter.rooms[currentRoom].length > 1 && checkReady(currentRoom)){
    //console.log(checkReady(currentRoom));
    io.sockets.in(currentRoom).emit('go');
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
    socket.emit('playerList', {list: Object.keys(room.sockets)});
  }
};

var sendGrid = function(data){
  this.broadcast.to(players[this.id].room).emit('enemyLaidAPiece', {grid: data.grid, id:this.id});
};

var sendBlockPosition = function(data){
  this.broadcast.to(players[this.id].room).emit('enemyMoved', {piece: data.piece, id:this.id});
};

var sendPunishment = function(data){
  this.broadcast.to(players[this.id].room).emit('iPityTheFool', {nbLignes: data.nbLignes});
};

// Prend en note quand un joueur a perdu, et si tout le monde a perdu sauf un joueur,
// prévient le joueur gagnant de sa victoire
var gameOver = function(data){
  players[this.id].gameOver = true;
  console.log(this.id + 'lost');
  let stillAliveList = stillAlive(players[this.id].room);
  if(stillAlive.length == 1){
    for(let player of Object.keys(io.nsps['/'].adapter.rooms[players[this.id].room].sockets)){
      //console.log(players[player].ready);
      players[player].ready = false;
    }
    io.sockets.in(players[this.id].room).emit('weHaveAWinner', {winner: stillAliveList[0]});
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

var stillAlive = function(room){
  let stillAliveList = [];
  Object.keys(io.nsps['/'].adapter.rooms[room].sockets).forEach(function(element){
    if(players[element].gameOver){
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