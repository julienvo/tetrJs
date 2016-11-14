

var Piece = function(x, y, shape){
  this.shape = this.createPiece(shape || 'IJLOSTZ'[Math.floor(Math.random() * 7)]);
  this.x = x || 0;
  this.y = y || 0;
}

Piece.prototype.createPiece = function(type){
  switch(type){
    case 'I':
      return [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0]
      ];
    
    case 'J':
      return [
        [0, 2, 0],
        [0, 2, 0],
        [2, 2, 0]
      ];
    
    case 'L':
      return [
        [0, 3, 0],
        [0, 3, 0],
        [0, 3, 3]
      ];

    case 'O':
      return [
        [4, 4],
        [4, 4]
      ];

    case 'S':
      return [
        [0, 5, 5],
        [5, 5, 0],
        [0, 0, 0]
      ];
    
    case 'T':
      return [
        [0, 0, 0],
        [6, 6, 6],
        [0, 6, 0]
      ];

    case 'Z':
      return [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0]
      ];   
  }
};

Piece.prototype.rotate = function(sens){
  for (let col = 0; col < this.shape.length; ++col) {
    for (let row = 0; row < col; ++row) {
      [
      this.shape[row][col],
      this.shape[col][row],
      ] = [
      this.shape[col][row],
      this.shape[row][col],
      ];
    }
  }

  if (sens > 0) {
    this.shape.forEach(row => row.reverse());
  } else {
    this.shape.reverse();
  }
}

module.exports = Piece;