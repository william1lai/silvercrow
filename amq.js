console.log('running silvercrow');
init();
logGame();

function init() {
}

var game = [];
var info = "";
function logGame() {
  var target = document.querySelector('div#qpAnimeName');
  var observer = new MutationObserver(function(mutations) {
      logSongInfo();
  });

  var config = {
    attributes: true,
    characterData: true,
    subtree: true,
    attributeFilter: ['class']
  }
  observer.observe(target, config);
}

function logSongInfo() {
  var animeTitle = $('#qpAnimeName').text();
  var songTitle = $('#qpSongName').text();
  var songArtist = $('#qpSongArtist').text();
  var songType = $('#qpSongType').text();
  var songNum = $('#qpCurrentSongCount').text();
  var players = $('.qpAvatarContainer');
  var nplayers = players.length;

  if (info === "") {
    info = "<div id='amq-log'> \
    <table> \
    <tr> \
    <td><b>#</b></td> \
    <td><b>Anime</b></td> \
    <td><b>Song</b></td> \
    <td><b>Type</b></td>";
    
    players.each(function(index, player) {
      var name = $(player).attr('id').split('-')[1];
      info += "<td><b>" + name + "</b></td>";
    });
    info += "</tr>";  
  }

  info += "<tr> \
  <td>" + songNum + "</td> \
  <td>" + animeTitle + "</td> \
  <td>" + songTitle + "</td> \
  <td>" + songType + "</td>";
  players.each(function(index, player) {
    var answer = $(player).find('.qpAvatarAnswer').text();
    info += "<td>" + answer + "</td>";
  });

  chrome.storage.sync.set({ "gamelog": info }, function(){
  });

  $('#levelText').unbind().click(readLog);
  
  // var amqlog = $('#amq-log').remove();
  // $('#mainContainer').after(info + "</tr></table>");
}

// class=qpAvatarContainer id=qpAvatar-pikachudoraemon (for each user)
// div class=qpAvatarAnswerContainer wrongAnswer
// div class=qpAvatarAnswer

function readLog() {
  console.log('opening ' + chrome.runtime.getURL('gamelog.html'));
  window.open(chrome.runtime.getURL('gamelog.html'), '_blank');
}