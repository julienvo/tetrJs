var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var fs = require('fs');
var path = require('path');

var session = require('express-session');
var cookieParser = require('cookie-parser');


app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '/public/html/index.html'));
});

io.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});

app.listen(8080);