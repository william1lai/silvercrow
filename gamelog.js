
readLog();

function readLog() {
  console.log("read log called");

  chrome.storage.sync.get(["gamelog"], function(items){
    $('#loghead').after(items["gamelog"]);
  });
}