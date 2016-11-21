//var socket = require('./socket');

var lobby = {
  lobby: document.querySelector('#lobby'),
  roomList: document.querySelector('#roomList'),
  errorMessage: document.querySelector('#errorMessage'),

  hide: function(){
    this.lobby.style.display = 'none';
  },

  show: function(){
    this.lobby.style.display = '';
  },

  clearList: function(){
    this.roomList.innerHTML = '';
  },

  clearError: function(){
    this.errorMessage.innerHTML = '';
  },

  populate: function(roomList){
    this.clearList();
    this.clearError();
    console.log(roomList);
    if(roomList.length > 0){
      for(room of roomList){
        this.addRoom(room);
      }
    }
    else{
      this.roomList.innerHTML = 'Il n\'y a pas de partie en cours.';
    }
  },

  addRoom: function(room){
    let li = document.createElement('li');

    let roomName = document.createElement('span');
    roomName.innerHTML = room;
    li.appendChild(roomName);

    let join = document.createElement('a');
    join.innerHTML = 'Rejoindre';
    join.href = '#';
    join.onclick = function(){
      socket.emit('joinRoom', {room:room});
    };
    li.appendChild(join);

    this.roomList.appendChild(li);
  },

  error: function(message){
    errorMessage.innerHTML = message;
  }
};

module.exports = lobby;