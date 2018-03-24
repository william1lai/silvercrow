# silvercrow

1. Provide game log for AMQ
  i. Barebones functionality. Tapping the player level will open a page with the log.
2. Keep in-game stats on songs that appear and how often correct

Known Issues
1. Table not aligned well
2. Seems that data doesn't persist on reload (i.e. only lasts one session).

# How to install

Refer to https://www.mattcutts.com/blog/how-to-install-a-chrome-extension-from-github/

# Ghetto Mechanics

To open the game log, tap the level button in the bottom middle of any game (whether you're a player or spectator). If it doesn't load, you need to wait for the next song to be revealed.

To clear the game log, first load the game log. Then close any open AMQ tabs. Finally, change the strange URL for the game log by appending a "clear" to the "gamelog.html", so that it reads "cleargamelog.html". There should be a message indicating the log has been cleared.