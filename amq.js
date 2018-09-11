
console.log('running silvercrow');
var currentPlayers = [];
var currentSongNum = -1;
var info;
var game;
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

  var openRequest = idb.open('silvercrow', 4);
  openRequest.onupgradeneeded = function(e) {
    console.log("running onupgradeneeded");
    var thisDb = e.target.result;
    var stores = ["songRecords"];
    stores.forEach(function(storeName) {
      if(!thisDb.objectStoreNames.contains(storeName)) {
        console.log("making " + storeName + " objectstore");
        var objectStore = thisDb.createObjectStore(storeName, { autoIncrement: true });
      }
    });
    var keystores = ["gameRecords"];
    keystores.forEach(function(storeName) {
      if(!thisDb.objectStoreNames.contains(storeName)) {
        console.log("making " + storeName + " key objectstore");
        var objectStore = thisDb.createObjectStore(storeName, { autoIncrement: true });
      }
    });
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
      $('#qpVoteSkip').click();
      //$('#qpVideosUserHidden').click();
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
  var songTitle = $('#qpSongName').text();
  var animeTitle = $('#qpAnimeName').text();
  var songArtist = $('#qpSongArtist').text();
  var songType = $('#qpSongType').text();
  var song = new Song(songTitle, animeTitle, songArtist, songType);

  var songNum = $('#qpCurrentSongCount').text();
  var players = $('.qpAvatarContainer');
  var nplayers = players.length;
  var gameplayers = [];
  players.each(function(index, player) {
    var name = $(player).attr('id').split('-')[1];
    gameplayers.push(new Player(name));
  });

  if (!game || isNewGame(gameplayers, songNum)) {
    // create new Game
    console.log('New game created, ' + !game + ' ' + isNewGame(gameplayers, songNum));
    game = new Game([], gameplayers, Date.now());
  }
  currentPlayers = gameplayers;
  currentSongNum = songNum;

  var answers = {};
  var correct = [];
  var inMalList = [];
  players.each(function(index, player) {
    var username = gameplayers[index].username;
    var answer = $(player).find('.qpAvatarAnswer').text().trim();
    answers[username] = answer;
    var hasCorrectAnswer = !$(player).find('.qpAvatarAnswer').parent().hasClass('wrongAnswer');
    if (hasCorrectAnswer) {
      correct.push(username);
    }
    var hasInMalList = !$(player).find('.qpAvatarInMal').hasClass('hide');
    if (hasInMalList) {
      inMalList.push(username);
    }
  });
  console.log("answers " + JSON.stringify(answers));

  var songRecord = new SongRecord(song, songNum, answers, correct, inMalList);
  console.log(songRecord.toJSON());
  var songTransaction = db.transaction(['songRecords'], 'readwrite');
  var songStore = songTransaction.objectStore('songRecords');
  var songRequest = songStore.add(songRecord.toJSON());
  songRequest.onerror = function(e) {
    console.log('Error while saving song record', e.target.error);
  };
  songRequest.onsuccess = function(e) {
    console.log('Song record successfully added');
  };

  game.addSong(songRecord);
  console.log(game.toJSON());
  var gameTransaction = db.transaction(['gameRecords'], 'readwrite');
  var gameStore = gameTransaction.objectStore('gameRecords');
  var gameRequest = gameStore.get(game.timestamp)
  gameRequest.onerror = function(e) {
    console.log('Error while reading current game record. ', e.target.error);
  }
  gameRequest.onsuccess = function(e) {
    var data = e.target.result;
    if (data == undefined) {
      data = game
    } else {
      data = Game.fromJSON(data);
      data.songs.push(songRecord);
    }
    console.log('current game record: ' + data.toJSON());

    var updateRequest = gameStore.put(data.toJSON(), data.id);
    updateRequest.onerror = function(e) {
      console.log('Error while saving game record. ', e.target.error);
    }
    updateRequest.onsuccess = function(e) {
      console.log('Successfully updated game record');
    }
  }

  updateStatOverlay(animeTitle, songTitle, songArtist, songType, players, nplayers);

  $('.levelUpHighLightText').unbind().click(readLog);
}

function readLog() {
  var transaction = db.transaction(['gameRecords']);
  var objectStore = transaction.objectStore('gameRecords');
  var request = objectStore.getAll();
  var logHTML = "";
  request.onerror = function(event) {
    console.log("Could not generate game log.")
  }
  request.onsuccess = function(event) {
    console.log(request.result);
    request.result.forEach(function(gameJSON) {
      var gr = Game.fromJSON(gameJSON);
      console.log("serialized game: " + gr.toJSON());
      var grHTML = gr.toHTML();
      console.log(grHTML)
      logHTML += grHTML + "<br><br>"
    });

    chrome.storage.local.set({ "gamelog": logHTML }, function() {
      console.log('opening ' + chrome.runtime.getURL('gamelog.html'));
      window.open(chrome.runtime.getURL('gamelog.html'), '_blank');
    });
  }
}

function updateStatOverlay(animeTitle, songTitle, songArtist, songType, players, nplayers) {
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
  var transaction = db.transaction(['songRecords']);
  var objectStore = transaction.objectStore('songRecords');
  var request = objectStore.getAll();
  request.onerror = function(event) {
  }
  request.onsuccess = function(event) {
    request.result.forEach(function(songRecord) {
      var sr = SongRecord.fromJSON(songRecord);
      var songOfInterest = new Song(songTitle, animeTitle, songArtist, songType);
      // console.log("rec " + sr.song.toJSON());
      if (Song.equals(sr.song, songOfInterest)) {
        for (var i = 0; i < players.length; i++) {
          console.log(sr.answers);
          if (names[i] in sr.answers) {
            total[i] += 1;
            if (sr.correct.includes(names[i])) {
              correct[i] += 1;
            }
          }
        }
      }
    });

    // Inject historic score for song above each player's avatar
    for (var j = 0; j < players.length; j++) {
      console.log(names[j] + ': ' + correct[j] + ' / ' + total[j]);
      $(players[j]).find('.accel').remove();
      $(players[j]).append("<div class=accel>" + correct[j] + ' / ' + total[j] + "</div>");
    }
  };  
}

/*
 * Returns true if a new game is being observed/played
 */
function isNewGame(players, songNum) {
  if (currentPlayers.length == players.length) {
    for (var i = 0; i < players.length; i++) {
      if (currentPlayers[i].username !== players[i].username) {
        // if players don't match, we're in a new game
        return true;
      }
    }
    // if players match but song number isn't incremental, we're in a new game
    var x = parseInt(songNum) !== parseInt(currentSongNum) + 1;
    return x;
  }
  return true;
}

