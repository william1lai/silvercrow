
readLog();
initListeners();

function readLog() {
  console.log("read log called");

  chrome.storage.local.get(["gamelog"], function(items){
    $('#loghead').after(items["gamelog"]);
  });
}


function initListeners() {
  $(document).ready(function() {
    var acc = document.getElementsByClassName("gameTab");
    for (var i = 0; i < acc.length; i++) {
      acc[i].addEventListener("click", function() {
        this.classList.toggle("active");
        var panel = this.nextElementSibling;
        if (panel.style.display === "block") {
          panel.style.display = "none";
        } else {
          panel.style.display = "block";
        }
      });
    }
  });
}