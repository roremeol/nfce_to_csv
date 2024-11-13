
// popup.js

document.getElementById('extrair').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "iniciarExtracao" });
  });
});
    