var PlayField = require('./playField');
var Canvas = require('./canvas');
var Piece = require('./pieces');
socket = require('./socket');

var states = {
  WAITING: 0,
  READY: 1,
  PLAYING: 2,
  GAME_OVER: 3
};

var colors = [
  null,
  'cyan',
  'orange',
  'yellow',
  'purple',
  'blue',
  'green',
  'red',
  'gray'
];

var Instance = function(element, id){
  if(id){
    this.id = id;
  }
  this.canvas = new Canvas(element.querySelector('.maingame'));
  this.message = element.querySelector('.message');
  this.playField = null;
  this.piece = null;
  this.score = 0;
  this.state = states.WAITING;
  this.actions = [];
};

Instance.prototype.init = function(){
  console.log(this.state);
  if(this.state != states.PLAYING){
    this.playField = new PlayField();
    this.playField.init();
    if(this.message){
      this.message.innerHTML = 'Press Space when you are ready.';   
    }
    //this.piece = new Piece(4, 0);
    this.score = 0;
    this.actions = [];
  }
};

Instance.prototype.reset = function(){
  this.playField.init();
}

let lastTime = 0;

Instance.prototype.update = function(time){
  let action = this.actions.shift();
  if(this.state == states.PLAYING){
    this.handle(action);
    let elapsedTime = time - lastTime; 
    if(elapsedTime > 500){
      this.piece.y++;
      socket.emit('blockMoved', {piece: this.piece});
      if(this.checkCollision()){
        let nbDeletedLines = this.playField.addPiece(this.piece);
        this.sendPunishment(nbDeletedLines);
        socket.emit('newGrid', {grid: this.playField.grid});
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
           return true; // Hors limites
        }
        if (this.playField.grid[currentBlockY][currentBlockX] != 0){
          return true; // Collision avec une autre pièce
        }
      }
    }
  }
  return false;
};

Instance.prototype.newPiece = function(){
  this.piece = new Piece(4, 0);
  //console.log(this.piece);
  socket.emit('blockMoved', {piece: this.piece});
  if(this.checkCollision()){
    //console.log('game over');
    this.gameOver();
  }
}


Instance.prototype.move = function(sens){
  this.piece.x += sens;
  if(this.checkCollision()){
    this.piece.x -= sens;
  }
  else{
    socket.emit('blockMoved', {piece: this.piece});
  }
};

// Fait descendre la pièce plus vite
Instance.prototype.moveDown = function(){
  this.piece.y++;
  if(this.checkCollision()){
    let nbDeletedLines = this.playField.addPiece(this.piece);
    this.sendPunishment(nbDeletedLines);
    socket.emit('newGrid', {grid: this.playField.grid});
    this.newPiece();
  }
  else {
    socket.emit('blockMoved', {piece: this.piece});
  }
};

// Lâche la pièce
Instance.prototype.drop = function(){
  while(!this.checkCollision()){
    this.piece.y++;
  }
  let nbDeletedLines = this.playField.addPiece(this.piece);
  this.sendPunishment(nbDeletedLines);
  socket.emit('newGrid', {grid: this.playField.grid});
  this.newPiece();
}

// Tente de tourner la pièce, si le bord de la grille ou une autre pièce bloque, remet la pièce dans son état initial
Instance.prototype.rotate = function(sens){
  this.piece.rotate(sens);
  if(this.checkCollision()){
    this.piece.rotate(-sens);
  }
  else {
    socket.emit('blockMoved', {piece: this.piece});
  }
};

// Si un joueur efface 2, 3 ou 4 lignes d'un coup, il envoie respectivement 1, 2 ou 4 lignes incomplètes à son adversaire
Instance.prototype.sendPunishment = function(nbLines){
  if(nbLines != 4){
    nbLines--;
  }
  console.log('punishment ! ' + nbLines);
  socket.emit('punishment', {nbLignes: nbLines});
};

Instance.prototype.draw = function(){
//  if(this.state == states.PLAYING){

    this.canvas.ctx.clearRect(0,0,this.canvas.width, this.canvas.height);
    this.canvas.ctx.fillStyle = 'black';
    this.canvas.ctx.fillRect(0,0, this.canvas.width, this.canvas.height);
    this.canvas.ctx.strokeStyle = '#000';

    for(let col in this.playField.grid){
      for(let row in this.playField.grid[col]){
        if(this.playField.grid[col][row] != 0){
          this.canvas.ctx.fillStyle = colors[this.playField.grid[col][row]];
          this.canvas.ctx.fillRect(parseInt(row) * this.canvas.blockSize, (parseInt(col)) * this.canvas.blockSize, this.canvas.blockSize, this.canvas.blockSize);
          this.canvas.ctx.strokeRect(parseInt(row) * this.canvas.blockSize, (parseInt(col)) * this.canvas.blockSize , this.canvas.blockSize, this.canvas.blockSize);
        }
      }
    }

    if(this.piece){
      for(let col in this.piece.shape){
        for(let row in this.piece.shape[col]){
          if(this.piece.shape[col][row] != 0){
            this.canvas.ctx.fillStyle = colors[this.piece.shape[col][row]];
            //console.log(col, this.piece.x, row, this.piece.y, (col + this.piece.x) * this.canvas.blockSize, (row + this.piece.y) * this.canvas.blockSize);
            this.canvas.ctx.fillRect((parseInt(row) + this.piece.x) * this.canvas.blockSize, (parseInt(col) + this.piece.y) * this.canvas.blockSize , this.canvas.blockSize, this.canvas.blockSize);
            this.canvas.ctx.strokeRect((parseInt(row) + this.piece.x) * this.canvas.blockSize, (parseInt(col) + this.piece.y) * this.canvas.blockSize , this.canvas.blockSize, this.canvas.blockSize);
          }
        }
      }
    }
  //}

//  console.log(this.piece.shape);

};


Instance.prototype.run = function(){
  console.log('run');
  this.state = states.PLAYING;
  this.newPiece();
  this.message.style.display = 'none';
};

Instance.prototype.getReady = function(){
  if(this.state != states.PLAYING){
    this.state = states.READY;
    if(this.message){
      this.message.style.display = '';
      this.message.innerHTML = 'Waiting for opponents';
    }
    socket.emit('playerReady');  
  }
};

Instance.prototype.gameOver = function(){
  this.state = states.GAME_OVER;
  document.querySelector('#main .score').innerHTML = 'Game Over :(';
  socket.emit('gameOver');
};

Instance.prototype.endGame = function(){
  this.state = states.WAITING;
}

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