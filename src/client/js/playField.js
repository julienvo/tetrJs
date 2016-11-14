/* Playfield constructor */

var PlayField = function(){
  this.nbRows = 0; // nombre de lignes
  this.nbCols = 0; // nombre de colonnes
  this.grid = []; // tableau du jeu
};

PlayField.prototype.init = function(h,w){
  this.nbCols = w || 10;
  this.nbRows = h || 20;

  for(let row = 0; row < this.nbRows; row++){
    let ligne = [];
    for(let col = 0; col < this.nbCols; col++){
      ligne.push(0);
    }
    this.grid.push(ligne);
  }
};

// Ajoute la pièce courante à la grille, une fois qu'elle est posée
PlayField.prototype.addPiece = function(piece){
  for(let row in piece.shape){
    for(let col in piece.shape[row]){
      if(piece.shape[col][row] != 0){
        this.grid[parseInt(col) + parseInt(piece.y) - 1][parseInt(row) + piece.x] = piece.shape[col][row];
      }
    }
  }
  return this.checkLines();
};

// Supprime une ligne de la grille, et fait descendre toutes les lignes au dessus
PlayField.prototype.deleteRow = function(row){
  this.grid.splice(row, 1);
  this.grid.unshift(new Array(this.nbCols).fill(0));
}

// Vérifie qu'une ligne est complète
PlayField.prototype.checkLines = function(){
  let isFull = false;
  let nbRowsDeleted = 0;
  for(let row = 0; row < this.nbRows; row++){
    isFull = true;
    for(let col = 0; col < this.nbCols; col++){
      if(this.grid[row][col] == 0){
        isFull = false;
      }
    }
    if(isFull){
      nbRowsDeleted++;
      this.deleteRow(row);
    }
  }
  return nbRowsDeleted;
}

PlayField.prototype.print = function () {
    if ( console.clear && 0 ) {
      console.clear();
    } else {
      console.log('-------------------------------');
    }

    for ( var i = 0; i < this.grid.length; i++ ) {
      console.log(this.grid[i].join(' '));
    }
};
module.exports = PlayField;