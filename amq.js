
console.log('running silvercrow');
var currentPlayers = [];
var currentSongNum = -1;
var isAutoOn = true;
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

function autocompleteOn() {
  $('.qpSideContainer').find('.homura').remove();
  $('.qpSideContainer').first().prepend('<div class="row homura"><h3>Auto is on</h3></div>');
  $('.homura').click(function() {
    autocompleteOff();
    var autocompleteElement = $('div.awesomplete').find('ul.ps');
    autocompleteElement.hide();
  });
  isAutoOn = true;
}

function autocompleteOff() {
  $('.qpSideContainer').find('.homura').remove();
  $('.qpSideContainer').first().prepend('<div class="row homura"><h3>Auto is off</h3></div>');
  $('.homura').click(function() {
    autocompleteOn();
    var autocompleteElement = $('div.awesomplete').find('ul.ps');
    autocompleteElement.show();
  });
  isAutoOn = false;
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
  if (isAutoOn) {
    autocompleteOn();
  } else {
    autocompleteOff();
  }

  var target = document.querySelector('div#qpAnimeNameHider');
  var observer = new MutationObserver(function(mutations) {
    if (isAutoOn) {
      logSongInfo();
      // $('#qpVoteSkip').click();
      // $('#qpVideosUserHidden').click();
    }
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
  var didGuessingComplete = $('#qpAnimeNameHider').hasClass('hide');
  // only record song if guessing turn just ended
  if (!didGuessingComplete) {
    return;
  }

  var songTitle = $('#qpSongName').text();
  var animeTitle = $('#qpAnimeName').text();
  var songArtist = $('#qpSongArtist').text();
  var songType = $('#qpSongType').text();
  var song = new Song(songTitle, animeTitle, songArtist, songType);
  console.log(song);

  // var youtubeSearchURL = "https://www.youtube.com/results?search_query=" + animeTitle + "+" + songTitle;
  // $('#gcMessageContainer').append('<li><img class="backerBadge hide" src=""><span class="gcUserName">Silvercrow_Bot</span>'
  //   + '<a href="' + youtubeSearchURL + '" target="_blank">' + songTitle + ' (' + animeTitle + ')</a></li>');

  var songNum = $('#qpCurrentSongCount').text();
  var players = $('.qpAvatarNameContainer.shadow');
  var nplayers = players.length;
  var gameplayers = [];
  players.each(function(index, player) {
    var name = $(player).text().trim();
    console.log(name);
    gameplayers.push(new Player(name));
  });

  if (!game || isNewGame(gameplayers, songNum)) {
    // create new Game
    game = new Game([], gameplayers, Date.now());
  }
  currentPlayers = gameplayers;
  currentSongNum = songNum;

  var answers = {};
  var correct = [];
  var inMalList = [];
  players.each(function(index, player) {
    var username = gameplayers[index].username;
    var answer = $(player).closest('.qpAvatarCenterContainer').find('.qpAvatarAnswer').text().trim();
    answers[username] = answer;
    var hasCorrectAnswer = !$(player).closest('.qpAvatarCenterContainer').find('.qpAvatarAnswer').parent().hasClass('wrongAnswer');
    if (hasCorrectAnswer) {
      correct.push(username);
    }
    // var listStatus = $(player).closest('.qpAvatarCenterContainer').find('.qpAvatarListStatus').text();
    // var hasInMalList = (listStatus === "C") || (listStatus === "W");
    var hasInMalList = !($('.qpAvatarStatus.hide').length);
    if (hasInMalList) {
      inMalList.push(username);
    }
    // we can also try using qpAvatarShowScore for more insights
  });

  var songRecord = new SongRecord(song, songNum, answers, correct, inMalList);
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
    // TODO: figure out how to limit in reverse chronological direction
    request.result.forEach(function(gameJSON) {
      var gr = Game.fromJSON(gameJSON);
      var grHTML = gr.toHTML();
      logHTML = grHTML + "<br><br>" + logHTML;
    });

    // perform analysis on the data

    // How players do with certain songs in/not in their list
    var allPlayers = [];
    var playerIncorrectList = {};
    var playerCorrectList = {};
    var playerIncorrectNoList = {};
    var playerCorrectNoList = {};

    // Which songs have shown up the most recently
    var metaSongsMap = {};

    request.result.forEach(function(gameJSON) {
      var gr = Game.fromJSON(gameJSON);
      var gameTime = new Date(gr.timestamp);
      var timeDiff = Date.now() - gameTime.getTime();
      var NINETY_DAYS_IN_SECS = 60 * 60 * 24 * 90;
      var playedInLast90Days = timeDiff > NINETY_DAYS_IN_SECS;

      // if (!playedInLast90Days) {
      //   return;
      // }

      var songRecords = gr.songs;
      for (var i = 0; i < songRecords.length; i++) {
        var songRecord = songRecords[i];

        var songKey = songRecord.song.songTitle + " (" + songRecord.song.animeTitle + ")";
        if (!(songKey in metaSongsMap)) {
          metaSongsMap[songKey] = 1;
        } else {
          metaSongsMap[songKey] += 1;
        }

        var isInsert = 0;
        if (songRecord.song.type == "Insert Song") {
          isInsert = 1;
        }
        for (var username in songRecord.answers) {
          var correct = false;
          var fromList = false;
          if (songRecord.correct.some(e => e.username === username)) {
            correct = true;
          }
          if (songRecord.fromPlayer.some(e => e.username === username)) {
            fromList = true;
          }

          if (!allPlayers.includes(username)) {
            allPlayers.push(username);
            playerCorrectList[username] = [0, 0];
            playerCorrectNoList[username] = [0, 0];
            playerIncorrectList[username] = [0, 0];
            playerIncorrectNoList[username] = [0, 0];
          }
          if (correct && fromList) {
            playerCorrectList[username][isInsert] += 1;
          } else if (correct) {
            playerCorrectNoList[username][isInsert] += 1;
          } else if (fromList) {
            playerIncorrectList[username][isInsert] += 1;
          } else {
            playerIncorrectNoList[username][isInsert] += 1;
          }
        }
      }
    });

    var statsHTML = "<h2>Statistical Analysis</h2>"
      + "<table width=80%><tr>"
      + "<td width=40%><b>Username<b></td>"
      + "<td width=15%><b>OP/ED<b></td>"
      + "<td width=15%><b>OP/ED From MAL<b></td>"
      + "<td width=15%><b>Inserts<b></td>"
      + "<td width=15%><b>Inserts From MAL<b></td>"
      + "</tr>";
    for (var i = 0; i < allPlayers.length; i++) {
      var username = allPlayers[i];
      var correctlist = parseInt(playerCorrectList[username][0]);
      var correctnolist = parseInt(playerCorrectNoList[username][0]);
      var incorrectlist = parseInt(playerIncorrectList[username][0]);
      var incorrectnolist = parseInt(playerIncorrectNoList[username][0]);
      var correct = correctlist + correctnolist;
      var incorrect = incorrectlist + incorrectnolist;
      var list = correctlist + incorrectlist;
      var nolist = correctnolist + incorrectnolist;
      var total = correct + incorrect;

      var correctlistInsert = parseInt(playerCorrectList[username][1]);
      var correctnolistInsert = parseInt(playerCorrectNoList[username][1]);
      var incorrectlistInsert = parseInt(playerIncorrectList[username][1]);
      var incorrectnolistInsert = parseInt(playerIncorrectNoList[username][1]);
      var correctInsert = correctlistInsert + correctnolistInsert;
      var incorrectInsert = incorrectlistInsert + incorrectnolistInsert;
      var listInsert = correctlistInsert + incorrectlistInsert;
      var nolistInsert = correctnolistInsert + incorrectnolistInsert;
      var totalInsert = correctInsert + incorrectInsert;

      playerHTML = "<tr><td width=40%>" + username + "</td>"
        + "<td width=15%>" + correct + " / " + total + " (" + makePercent(correct, total) + ")</td>"
        + "<td width=15%>" + correctlist + " / " + list + " (" + makePercent(correctlist, list) + ")</td>"
        + "<td width=15%>" + correctInsert + " / " + totalInsert + " (" + makePercent(correctInsert, totalInsert) + ")</td>"
        + "<td width=15%>" + correctlistInsert + " / " + listInsert + " (" + makePercent(correctlistInsert, listInsert) + ")</td>"
        + "</tr>";
      statsHTML += playerHTML;
    }
    statsHTML += "</table><br><br>";

    // add meta songs list
    var sortedMetaSongs = Object.keys(metaSongsMap).sort(
      function(a, b) {
        return metaSongsMap[b] - metaSongsMap[a];
      }
    )

    var metaHTML = "<h2>Meta Songs (last 90 days)</h2>"
    + "<table width=80%><tr>"
    + "<td width=20%><b>Count<b></td>"
    + "<td width=80%><b>Song<b></td>"
    + "</tr>";

    var MINIMUM_META_SONG_COUNT = 3;
    for (var i = 0; i < sortedMetaSongs.length; i++) {
      if (metaSongsMap[sortedMetaSongs[i]] >= MINIMUM_META_SONG_COUNT) {
        metaHTML += "<tr>"
        + "<td width=20%>" + metaSongsMap[sortedMetaSongs[i]] + "</td>"
        + "<td width=80%>" + sortedMetaSongs[i] + "</td>"
        + "</tr>";
      }
    }
    metaHTML += "</table><br><br>";

    chrome.storage.local.set({ "gamelog": statsHTML + metaHTML + logHTML }, function() {
      console.log('opening ' + chrome.runtime.getURL('gamelog.html'));
      window.open(chrome.runtime.getURL('gamelog.html'), '_blank');
    });
  }
}

function makePercent(numerator, denominator) {
  if (denominator == 0) {
    return "N/A";
  }
  return ((numerator/denominator)*100).toFixed(1) + "%";
}

function updateStatOverlay(animeTitle, songTitle, songArtist, songType, players, nplayers) {
  var names = [];
  var correct = [];
  var total = [];
  for (var i = 0; i < players.length; i++) {
    correct.push(0);
    total.push(0);
    names.push($(players[i]).text().trim());
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
      if (Song.equals(sr.song, songOfInterest)) {
        for (var i = 0; i < players.length; i++) {
          if (names[i] in sr.answers) {
            total[i] += 1;
            if (sr.correct.some(e => e.username === names[i])) {
              correct[i] += 1;
            }
          }
        }
      }
    });

    // Inject historic score for song above each player's avatar
    for (var j = 0; j < players.length; j++) {
      $(players[j]).closest('.qpAvatarCenterContainer').find('.accel').remove();
      $(players[j]).closest('.qpAvatarCenterContainer').append("<div class=accel>" + correct[j] + ' / ' + total[j] + "</div>");
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

