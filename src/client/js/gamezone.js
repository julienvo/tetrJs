var gamezone = {
  container: document.querySelector('#gameContainer'),
  localPlayer: document.querySelector('#main'),
  otherPlayers: document.querySelector('#other'),

  hide: function(){
    this.container.style.display = 'none';
  },

  show: function(){
    this.container.style.display = '';
  }

};

module.exports = gamezone;