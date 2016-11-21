var pieces = require('./pieces');
var Instance = require('./instance');
var lobby = require('./lobby');
var gameZone = require('./gamezone');
var socket = require('./socket');

var instances = [];
var nbOpponents = 0;
socket.emit('getRoomList');

// Récupération de la liste des rooms
socket.on('rooms', function(data){
  //console.log('rooms: ' + JSON.stringify(data));
  lobby.populate(data.rooms);
});


// Récupération des informations d'un autre joueur qui rejoint la room
socket.on('newPlayer', function(data){
  //console.log(data);
  // Limité à un autre joueur, pour l'instant
  if(nbOpponents == 0){
    instances[1] = new Instance(document.querySelector('#other'),data.id);
    instances[1].setName(data.name);
    instances[1].init();
    nbOpponents++;
  }
});

// Réponse du serveur à une demande de changement de surnom
socket.on('nameChanged', function(data){
  if(!data.name){
    lobby.error(data.msg);
  }
  else{
    lobby.setName(data.name);
    instances[0].setName(data.name);
  }
});

// Récupère la liste des autres joueurs déja présents dans la room
socket.on('playerList', function(data){
  //console.log('playerList');
  for(let i of data.list){
    //console.log('push');
    let newInstance = new Instance(document.querySelector('#other'), i.id);
    newInstance.init();
    newInstance.setName(i.name)
    instances.push(newInstance);
  }
});

// Mise à jour de l'instance quand un autre joueur bouge son bloc
socket.on('enemyMoved', function(data){
  //console.log(data);
  instances[1].piece = data.piece;
});

// Mise à jour de l'instance quand un autre joueur pose une pièce
socket.on('enemyLaidAPiece', function(data){
    //console.log(data);
  instances[1].playField.grid = data.grid;
});

// Lancement de la partie
socket.on('go', function(data){
  //console.log('GOGOGO');
  for(let instance of instances){
    instance.goal = data.goal;  
    instance.setScore(0);
    instance.playField.init();
  }
  instances[0].run();
});

// Réponse du serveur lors d'un essai de rejoindre ou créer une room
socket.on('roomJoined', function(data){
  //console.log('roomJoined');
  if(!data.room){
    lobby.error(data.message);
  }
  else{
    lobby.hide();
    gameZone.show();
  }
  //console.log(data);
});

// Quand un adversaire fait disparaitre une ou plusieurs lignes
socket.on('iPityTheFool', function(data){
  instances[0].playField.addRowsToBottom(data.nbLignes);
  instances[1].setScore(data.score);
});

// Fin de partie
socket.on('weHaveAWinner', function(data){
  gameZone.setMessage(data.winner.nick + ' wins ! Press Space to restart.');
  instances[0].endGame();
  
/*  for (let player of instances){
    if(player.id == data.winner){
      //console.log(player.id + ' gagne la partie !');
    }
  }*/
});

/*****************
* Initialisation de l'affichage et ajout des différents listeners
*****************/

gameZone.hide();

window.document.querySelector('#nameDiv>form').onsubmit = function(event){
  event.preventDefault();
  let nom = window.document.querySelector('#name').value;
  if(nom != ''){
    socket.emit('nameChange', {name: nom});
  }
//  socket.emit()
};

window.document.querySelector('#creerPartie').onclick = function(){
  //console.log('joinRoom');
  socket.emit('joinRoom', {room:null});
};

window.document.querySelector('#refresh').onclick = function(){
  //console.log('refreshRooms');
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


// Initialisation et lancement du jeu

var gameInit = function(){
  instances[0] = new Instance(document.querySelector('#main'));
  instances[0].init();
}

var gameLoop = function(timestamp) {
  // On met à jour l'instance locale, puis on dessine toutes les instances du jeu.
  // Les autres instances sont mises à jour depuis le serveur.
  instances[0].update(timestamp);
  for(let i of instances){
    i.draw();
  }

  requestAnimationFrame(gameLoop);
};
gameInit();
gameLoop();