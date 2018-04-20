console.log('running silvercrow');
var game = [];
var info;
var db;
var idb = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;

init();
logGame();

function init() {
  fetchLogs();
  initDB();
}

function fetchLogs() {
  chrome.storage.local.get(["gamelog"], function(items){
    info = items["gamelog"];
  });
}

function initDB() {
  'use strict';

  //check for support
  if (!('indexedDB' in window)) {
    console.log('This browser doesn\'t support IndexedDB');
    return;
  }

  var openRequest = idb.open('silvercrow', 2);
  
  openRequest.onupgradeneeded = function(e) {
    console.log("running onupgradeneeded");
    var thisDb = e.target.result;

    if(!thisDb.objectStoreNames.contains("amq")) {
      console.log("making amq objectstore");
      var objectStore = thisDb.createObjectStore("amq", { autoIncrement: true });
    }
  }

  openRequest.onsuccess = function(e) {
    console.log('running onsuccess for db');
    db = e.target.result;
  };
  openRequest.onerror = function(e) {
    console.log('onerror for db!');
    console.dir(e);
  };
  
}

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

  var gameplayers = [];
  players.each(function(index, player) {
    var name = $(player).attr('id').split('-')[1];
    gameplayers.push(player);
  });
  if (playersChanged(gameplayers)) {
    game = gameplayers;
    info += "<div id='amq-log'> \
    <table> \
    <tr> \
    <td><b>#</b></td> \
    <td><b>Anime</b></td> \
    <td><b>Song</b></td> \
    <td><b>Artist</b></td> \
    <td><b>Type</b></td>";
    
    players.each(function(index, player) {
      var name = $(player).attr('id').split('-')[1];
      info += "<td><b>" + name + "</b></td>";
    })
    info += "</tr>";
  }

  logToDB(animeTitle, songTitle, songArtist, songType, players, nplayers);

  info += "<tr> \
  <td>" + songNum + "</td> \
  <td>" + animeTitle + "</td> \
  <td>" + songTitle + "</td> \
  <td>" + songArtist + "</td> \
  <td>" + songType + "</td>";
  players.each(function(index, player) {
    var answer = $(player).find('.qpAvatarAnswer').text();
    info += "<td>" + answer + "</td>";
  });

  chrome.storage.local.set({ "gamelog": info }, function(){
  })

  $('#levelText').unbind().click(readLog);
}

function readLog() {
  console.log('opening ' + chrome.runtime.getURL('gamelog.html'));
  window.open(chrome.runtime.getURL('gamelog.html'), '_blank');
}

function logToDB(animeTitle, songTitle, songArtist, songType, players, nplayers) {
  var transaction = db.transaction(['amq'], 'readwrite');
  var store = transaction.objectStore('amq');
  
  players.each(function(index, player) {
    var wrong = $(player).find('.qpAvatarAnswer').parent().hasClass('wrongAnswer');
    var playername = $(player).attr('id').split('-')[1];
    var item = {
      time: new Date().getTime(),
      animeTitle: animeTitle,
      songTitle: songTitle,
      songArtist: songArtist,
      songType: songType,
      player: playername,
      correct: !wrong
    };
  
    var request = store.add(item);
  
    request.onerror = function(e) {
      console.log('Error', e.target.error);
    };
    request.onsuccess = function(e) {
      console.log('Entry successfully added');
    };
  });

  var names = [];
  var correct = [];
  var total = [];
  for (var i = 0; i < players.length; i++) {
    correct.push(0);
    total.push(0);
    names.push($(players[i]).attr('id').split('-')[1]);
  }

  // retrieve all records and iterate over them once to find all cases of this song
  // where each user gets correct or not
  var transaction = db.transaction(["amq"]);
  var objectStore = transaction.objectStore("amq");
  var request = objectStore.getAll();
  request.onerror = function(event) {
  };
  request.onsuccess = function(event) {
    for (var i = 0; i < request.result.length; i++) {
      var line = request.result[i];
      console.log(line);
      if (line['songTitle'] === songTitle && line['animeTitle'] === animeTitle) {
        for (var j = 0; j < players.length; j++) {
          if (names[j] === line['player']) {
            total[j] += 1;
            console.log(line['correct']);
            if (line['correct'] == true) {
              correct[j] += 1;
            }
            break;
          }
        }
      }
    }

    // Inject historic score for song above each player's avatar
    for (var j = 0; j < players.length; j++) {
      console.log(names[j] + ': ' + correct[j] + ' / ' + total[j]);
      $(players[j]).prepend("<div id=accel>" + correct[j] + ' / ' + total[j] + "</div>");
    }
  };  
}

function playersChanged(players) {
  if (game.length == players.length) {
    for (var i = 0; i < players.length; i++) {
      if (game[i] !== players[i]) {
        return true;
      }
    }
    return false;
  }
  return true;
}



