var pieces = require('./pieces');
var Instance = require('./instance');
var lobby = require('./lobby');
var gameZone = require('./gamezone');
var socket = require('./socket');
//console.log(socket);

var instances = [];
var nbOpponents = 0;
socket.emit('getRoomList');

socket.on('rooms', function(data){
  console.log('rooms: ' + JSON.stringify(data));
  lobby.populate(data.rooms);
});

socket.on('newPlayer', function(data){
  //console.log(data);
  if(nbOpponents == 0){
    instances[1] = new Instance(document.querySelector('#other'),data.id);
    instances[1].setName(data.name);
    instances[1].init();
    nbOpponents++;
  }
});

socket.on('nameChanged', function(data){
  if(!data.name){
    lobby.error(data.msg);
  }
  else{
    instances[0].setName(data.name);
  }
});

socket.on('playerList', function(data){
  console.log('playerList');
  for(let i of data.list){
    console.log('push');
    let newInstance = new Instance(document.querySelector('#other'), i.id);
    newInstance.init();
    newInstance.setName(i.name)
    instances.push(newInstance);
  }
});

socket.on('enemyMoved', function(data){
  //console.log(data);
  instances[1].piece = data.piece;
});

socket.on('enemyLaidAPiece', function(data){
    //console.log(data);
  instances[1].playField.grid = data.grid;
});

socket.on('go', function(){
  console.log('GOGOGO');
  for(let instance of instances){
    instance.playField.init();
  }
  instances[0].run();
});

socket.on('roomJoined', function(data){
  console.log('roomJoined');
  if(!data.room){
    lobby.error(data.message);
  }
  else{
    lobby.hide();
    gameZone.show();
  }
  console.log(data);
})

socket.on('iPityTheFool', function(data){
  instances[0].playField.addRowsToBottom(data.nbLignes);
});

socket.on('weHaveAWinner', function(data){
  gameZone.setMessage(data.winner.nick + ' wins ! Press Space to restart.');
  instances[0].endGame();
  
/*  for (let player of instances){
    if(player.id == data.winner){
      console.log(player.id + ' gagne la partie !');
    }
  }*/
});

gameZone.hide();

window.document.querySelector('#lobby>form').onsubmit = function(event){
  event.preventDefault();
  let nom = window.document.querySelector('#name').value;
  if(nom != ''){
    socket.emit('nameChange', {name: nom});
  }
//  socket.emit()
};

window.document.querySelector('#creerPartie').onclick = function(){
  console.log('joinRoom');
  socket.emit('joinRoom', {room:null});
};

window.document.querySelector('#refresh').onclick = function(){
  console.log('refreshRooms');
  socket.emit('getRoomList');
};

window.onkeydown = function(event){
  switch(event.keyCode){
    case 37: // gauche
    case 38: // haut
    case 39: // droite
    case 40: // bas
    case 87: // W
    case 88: // X
      event.preventDefault();
      instances[0].actions.push(event.keyCode);
      break;
    case 32: // espace
      event.preventDefault();
      instances[0].getReady();

  };

};

var gameLoop = function(timestamp) {
  // On met à jour l'instance locale, puis on dessine toutes les instances du jeu.
  // Les autres instances sont mises à jour depuis le serveur.
  instances[0].update(timestamp);
  for(let i of instances){
    i.draw();
  }

  requestAnimationFrame(gameLoop);
};

var gameInit = function(){
  instances[0] = new Instance(document.querySelector('#main'));
  instances[0].init();
}

gameInit();
gameLoop();