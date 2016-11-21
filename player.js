var Player = function(id){
  this.id = id;
  this.nick = 'Bob';
  this.room = null;
  this.ready = false;
  this.gameOver = false;
};

module.exports = Player;