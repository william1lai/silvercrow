
readLog();

function readLog() {
  console.log("read log called");

  chrome.storage.local.get(["gamelog"], function(items){
    $('#loghead').after(items["gamelog"]);
  });
}


