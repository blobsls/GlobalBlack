// Background service worker
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSettings') {
    chrome.storage.sync.get('globalBlackSettings', (data) => {
      sendResponse(data.globalBlackSettings || {});
    });
    return true; // Required for async response
  }
});

// Ensure content script gets the latest settings when injected
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    chrome.storage.sync.get('globalBlackSettings', (data) => {
      if (data.globalBlackSettings?.enabled !== false) {
        chrome.tabs.sendMessage(tabId, {
          action: 'updateSettings',
          settings: data.globalBlackSettings || {}
        });
      }
    });
  }
});
