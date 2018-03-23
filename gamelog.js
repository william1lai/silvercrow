var storage = new HugeStorageSync();
readLog();

function readLog() {
  console.log("read log called");

  storage.get("gamelog", function(item) {
    $('#loghead').after(item);
  });
}