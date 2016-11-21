var Canvas = function(element){
  this.height = 400;
  this.width = 200;

  this.canvas = element;
  this.canvas.height = this.height;
  this.canvas.width = this.width;
  
  this.ctx = this.canvas.getContext('2d');
  this.ctx.strokeStyle = 'white';

  this.blockSize = this.width/10;

};

module.exports = Canvas;