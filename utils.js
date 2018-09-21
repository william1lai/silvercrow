
/*
 * Player:
 * - username: String
 */
function Player(username) {
  this.username = username;
}

/*
 * Song:
 * - songTitle: String
 * - animeTitle: String
 * - artist: String
 * - type: String
 */
function Song(songTitle, animeTitle, artist, type) {
  this.songTitle = songTitle;
  this.animeTitle = animeTitle;
  this.artist = artist;
  this.type = type;
}
Song.equals = function(song1, song2) {
  return song1.songTitle === song2.songTitle
    && song1.animeTitle === song2.animeTitle
    && song1.artist === song2.artist
    && song1.type === song2.type;
}

/*
 * SongRecord:
 * - song: Song
 * - songNumber: Int
 * - answers: {Player.username: answer} - since JS dictionary keys have to be strings
 * - correct: [Player]
 * - fromPlayer: [Player]
 */
function SongRecord(song, songNumber, answers, correct, fromPlayer) {
  this.song = song;
  this.songNumber = songNumber;
  this.answers = answers;
  this.correct = correct;
  this.fromPlayer = fromPlayer;
}

/*
 * Game:
 * - songs: [SongRecord]
 * - players: [Player]
 * - timestamp: String
 */
function Game(songs, players, timestamp) {
  this.songs = songs;
  this.players = players;
  this.timestamp = timestamp;
  this.id = timestamp.toString()
}
Game.prototype.addSong = function(song) {
  this.songs.push(song);
}


/*
 * JSON/HTML serializers and deserializers
 */

Player.prototype.toJSON = function() {
  return this.username;
}
Player.fromJSON = function(json) {
  return new Player(json);
}

Song.prototype.toJSON = function() {
  return JSON.stringify({
    songTitle: this.songTitle,
    animeTitle: this.animeTitle,
    artist: this.artist,
    type: this.type
  });
}
Song.prototype.toHTML = function() {
  return "Anime: " + this.animeTitle
    + ", Song: " + this.songTitle
    + ", Artist: " + this.artist
    + ", Type: " + this.type;
}
Song.fromJSON = function(json) {
  var data = JSON.parse(json);
  return new Song(data.songTitle, data.animeTitle, data.artist, data.type);
}

SongRecord.prototype.toJSON = function() {
  return JSON.stringify({
    song: this.song,
    songNumber: this.songNumber,
    answers: this.answers,
    correct: this.correct,
    fromPlayer: this.fromPlayer
  });
}
SongRecord.prototype.toHTML = function() {
  var songHTML = this.song.toHTML();
  var answersHTML = "";
  for (var key in this.answers) {
    var player = Player.fromJSON(key);
    var entryHTML = "<table width=50%><tr><td width=90%>"
      + key + ": " + this.answers[key] + "</td>"
    if (this.correct.some(e => e.username === player.username)) {
      entryHTML += "<td width=5%>O</td>";
    } else {
      entryHTML += "<td width=5%>X<?td>";
    }
    if (this.fromPlayer.some(e => e.username === player.username)) {
      entryHTML += "<td width=5%>(MAL)</td>";
    } else {
      entryHTML += "<td width=5%> </td>";
    }
    answersHTML += entryHTML + "</tr></table><br>";
  }
  return "<font size=\"3\">(" + this.songNumber + ") "
    + songHTML + "</font><br>"
    + answersHTML + "<br>";
}
SongRecord.fromJSON = function(json) {
  var data = JSON.parse(json);
  var correct = data.correct;
  var deserCorrect = [];
  if (correct) {
    correct.forEach(function(player) {
      deserCorrect.push(Player.fromJSON(player));
    });
  }
  var fromPlayer = data.fromPlayer;
  var deserFromPlayer = [];
  if (fromPlayer) {
    fromPlayer.forEach(function(player) {
      deserFromPlayer.push(Player.fromJSON(player));
    });
  }
  return new SongRecord(Song.fromJSON(data.song), data.songNumber, data.answers, deserCorrect, deserFromPlayer);
}

Game.prototype.toJSON = function() {
  return JSON.stringify({
    songs: this.songs,
    players: this.players,
    timestamp: this.timestamp
  });
}
Game.prototype.toHTML = function() {
  var playersJSON = this.players[0].toJSON();
  for (var i = 1; i < this.players.length; i++) {
    playersJSON += ", " + this.players[i].toJSON();
  }
  var timestampJSON = new Date(this.timestamp).toLocaleString();
  var gameDescription = "Time: " + timestampJSON + ", Players: " + playersJSON

  var songsHTML = ""
  for (var i = 0; i < this.songs.length; i++) {
    songsHTML += this.songs[i].toHTML();
  }

  var html = "<button class=\"gameTab\">" + gameDescription + "</button>"
    + "<div class=\"panel\">"
    + "<p>" + songsHTML + "</p>"
    + "</div>"
  return html;
}
Game.fromJSON = function(json) {
  var data = JSON.parse(json);
  var songs = data.songs;
  var deserSongs = [];
  if (songs) {
    songs.forEach(function(songRecord) {
      deserSongs.push(SongRecord.fromJSON(songRecord));
    });
  }
  var players = data.players;
  var deserPlayers = [];
  if (players) {
    players.forEach(function(player) {
      deserPlayers.push(Player.fromJSON(player));
    });
  }
  return new Game(deserSongs, deserPlayers, data.timestamp);
}