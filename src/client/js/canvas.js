var canvas = document.getElementById('maingame');
var ctx = canvas.getContext('2d');
var height = 400;
var width = 200;

canvas.height = height;
canvas.width = width;
ctx.strokeStyle = 'white';

module.exports = {
  clear: function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  },
  ctx: ctx,
  width: width,
  height: height,
  el: canvas
};