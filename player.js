var Player = function(id){
  this.id = id;
  this.nick = null;
  this.room = null;
  this.ready = false;
  this.gameOver = false;
  this.score = 0;
};

module.exports = Player;