var pieces = require('./pieces');
var canvas = require('./canvas');
var Instance = require('./instance');


var instances = [];

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
      instances[0].init();

  };

};

var gameLoop = function(timestamp) {
  for(i of instances){
    i.update(timestamp);
    i.draw();
  }



  requestAnimationFrame(gameLoop);
};

var gameInit = function(){
  instances[0] = new Instance();
  instances[0].init();
}

gameInit();
gameLoop();