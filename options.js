function clearData() {
    chrome.storage.local.set({ "gamelog": "" }, function() {
        document.getElementById('status').innerText = "Game log has been cleared. (If any AMQ tabs are open, please close them and refresh this page.)";
    })
}

document.getElementById('clear-data').addEventListener('click', clearData);