var PlayField = require('./playField');
var canvas = require('./canvas');
var Piece = require('./pieces');

var states = {
  WAITING: 0,
  GAME_OVER: 1,
  PLAYING: 2
}

var size = canvas.width/10;
/*var colors =  [
  null,
  '#FF0D72',
  '#0DC2FF',
  '#0DFF72',
  '#F538FF',
  '#FF8E0D',
  '#FFE138',
  '#3877FF',
];
*/
var colors = [
  null,
  'cyan',
  'orange',
  'yellow',
  'purple',
  'blue',
  'green',
  'red'
];

var Instance = function(){
  this.playField = null;
  this.piece = null;
  this.score = 0;
  this.state = states.WAITING;
  this.actions = [];
}

Instance.prototype.init = function(){
  console.log(this.state);
  if(this.state != states.PLAYING){
    this.playField = new PlayField();
    this.playField.init();
    this.piece = new Piece(5, 0, 'I');
    this.score = 0;
    this.state = states.PLAYING;
    this.actions = [];
  }
};

let lastTime = 0;
let debug = true;

Instance.prototype.update = function(time){
  if(this.state == states.PLAYING){
    this.handle(this.actions.shift());
    let elapsedTime = time - lastTime; 
    if(elapsedTime > 500){
      this.piece.y++;
      if(this.checkCollision()){
        this.playField.addPiece(this.piece);
        this.newPiece();
      }
      lastTime = time;
    };
  }
};


Instance.prototype.checkCollision = function(){
  for(let row in this.piece.shape){
    for(let col in this.piece.shape[row]){
      let currentBlockX = parseInt(row) + this.piece.x;
      let currentBlockY = parseInt(col) + this.piece.y;
      let currentBlockColor = this.piece.shape[col][row];

     
      if( currentBlockColor !=0 ){
        if(currentBlockX < 0 || currentBlockX >= this.playField.nbCols || currentBlockY < 0 || currentBlockY >= this.playField.nbRows){
         // console.log('test' + currentBlockX < 0, currentBlockX >= this.playField.nbCols, currentBlockY < 0, currentBlockY >= this.playField.nbRows);
          //console.log(currentBlockY, this.piece.y);
          return true; // Out of boundscurrentBlockY < 0
        }
        if (this.playField.grid[currentBlockY][currentBlockX] != 0){
         // console.log(currentBlockX, currentBlockY, this.playField.grid[currentBlockX][currentBlockY]);
          return true; // Collision with a previous block
        }
      }
    }
  }
  return false;
};

Instance.prototype.newPiece = function(){
  this.piece = new Piece(Math.floor(Math.random()*6), 0);
  console.log(this.piece);
  if(this.checkCollision()){
    console.log('game over');
    this.gameOver();
  }
}


Instance.prototype.move = function(sens){
  this.piece.x += sens;
  if(this.checkCollision()){
    this.piece.x -= sens;
  }
};

Instance.prototype.moveDown = function(){
  this.piece.y++;
  if(this.checkCollision()){
    this.playField.addPiece(this.piece);
    this.newPiece();
  }
};


Instance.prototype.drop = function(){
  while(!this.checkCollision()){
    this.piece.y++;
  }
  this.playField.addPiece(this.piece);
  this.newPiece();
}

Instance.prototype.rotate = function(sens){
  this.piece.rotate(sens);
  if(this.checkCollision()){
    this.piece.rotate(-sens);
  }
};

Instance.prototype.draw = function(){
  canvas.ctx.clearRect(0,0,canvas.width, canvas.height);
  canvas.ctx.fillStyle = 'black';
  canvas.ctx.fillRect(0,0, canvas.width, canvas.height);
  canvas.ctx.strokeStyle = '#000';

  for(col in this.playField.grid){
    for(row in this.playField.grid[col]){
      if(this.playField.grid[col][row] != 0){
        canvas.ctx.fillStyle = colors[this.playField.grid[col][row]];
        canvas.ctx.fillRect(parseInt(row) * size, (parseInt(col)) * size, size, size);
        canvas.ctx.strokeRect(parseInt(row) * size, (parseInt(col)) * size , size, size);
      }
    }
  }

  for(col in this.piece.shape){
    for(row in this.piece.shape[col]){
      if(this.piece.shape[col][row] != 0){
        canvas.ctx.fillStyle = colors[this.piece.shape[col][row]];
        //console.log(col, this.piece.x, row, this.piece.y, (col + this.piece.x) * size, (row + this.piece.y) * size);
      }
      else{
        canvas.ctx.fillStyle = '#fff';
      }
        canvas.ctx.fillRect((parseInt(row) + this.piece.x) * size, (parseInt(col) + this.piece.y) * size , size, size);
        canvas.ctx.strokeRect((parseInt(row) + this.piece.x) * size, (parseInt(col) + this.piece.y) * size , size, size);
    }
  }

//  console.log(this.piece.shape);

};


Instance.prototype.run = function(){
  this.state = states.PLAYING;
}

Instance.prototype.gameOver = function(){
  this.state = states.GAME_OVER;
  document.getElementById('score').innerHTML = 'Game Over :(';
};

Instance.prototype.handle = function(keyCode){
    switch(keyCode){
    case 37: // gauche
      this.move(-1);
      break;
    case 38: // haut
      this.drop();
      break;
    case 39: // droite
      this.move(1);
      break;
    case 40: // bas
      this.moveDown();
      break;
    case 87: // W
      this.rotate(1);
      break;
    case 88: // X
      this.rotate(-1);
      break;

  };
};


module.exports = Instance;