
window.onkeydown = function(event){
  switch(event.keyCode){
    case 37: // gauche
      event.preventDefault();
      instances[0].move(-1);
      break;
    case 38: // haut
      event.preventDefault();
      instances[0].drop();
      break;
    case 39: // droite
      event.preventDefault();
      instances[0].move(1);
      break;
    case 40: // bas
      event.preventDefault();
      instances[0].moveDown();

  };

};

module.exports = {};