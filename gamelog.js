var storage = new HugeStorageSync();
readLog();

function readLog() {
  console.log("read log called");

  // chrome.storage.sync.get(["gamelog"], function(items){
  //   $('#loghead').after(items["gamelog"]);
  // });
  storage.get("gamelog", function(item) {
    $('#loghead').after(item);
  });
}