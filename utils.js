
/*
 * Player:
 * - username: String
 */
function Player(username) {
  this.username = username;
}
// Player.prototype.username = function() { return this.username; }

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
 * - answers: {Player: answer}
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
 * JSON serializers and deserializers
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
SongRecord.fromJSON = function(json) {
  var data = JSON.parse(json);
  return new SongRecord(Song.fromJSON(data.song), data.songNumber, data.answers, data.correct, Player.fromJSON(data.fromPlayer));
}

Game.prototype.toJSON = function() {
  return JSON.stringify({
    songs: this.songs,
    players: this.players,
    timestamp: this.timestamp
  });
}
Game.prototype.toHTML = function() {
  return "<table><tr><td>" + this.toJSON() + "</td></tr></table>";
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


/*
 * HTML serializers (TODO)
 */


// var sr = new SongRecord(1, "test song", 1, ["a", "b", "c"], ["p1", "p3"], ["p1", "p2"]);
// var g = new Game(1, sr, ["p1", "p2", "p3"], "timestamp");
// console.log(g.toJSON());
// console.log(sr.toJSON());
// console.log(sr);