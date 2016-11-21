var gamezone = {
  container: document.querySelector('#gameZone'),
  localPlayer: document.querySelector('#main'),
  otherPlayers: document.querySelector('#other'),
  message: document.querySelector('#gameZone>.message'),

  hide: function(){
    this.container.style.display = 'none';
  },

  show: function(){
    this.container.style.display = '';
  },

  setMessage: function(message){
    this.message.innerHTML = message;
  }

};

module.exports = gamezone;