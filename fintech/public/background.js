// Background service worker for StartupKit Chrome Extension

// Handle extension icon click - open side panel or popup
chrome.action.onClicked.addListener((tab) => {
  // Open side panel if available
  if (chrome.sidePanel) {
    chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CLIP_DATA') {
    // Store clipped data from web pages
    chrome.storage.local.get(['clippedData'], (result) => {
      const clippedData = result.clippedData || [];
      clippedData.push({
        ...request.data,
        timestamp: Date.now(),
        sourceUrl: sender.tab?.url
      });
      chrome.storage.local.set({ clippedData }, () => {
        sendResponse({ success: true });
      });
    });
    return true; // Keep message channel open for async response
  }

  if (request.type === 'GET_CLIPPED_DATA') {
    chrome.storage.local.get(['clippedData'], (result) => {
      sendResponse({ data: result.clippedData || [] });
    });
    return true;
  }

  if (request.type === 'SAVE_PROJECT') {
    chrome.storage.local.get(['projects'], (result) => {
      const projects = result.projects || [];
      const existingIndex = projects.findIndex(p => p.id === request.project.id);
      if (existingIndex >= 0) {
        projects[existingIndex] = request.project;
      } else {
        projects.push(request.project);
      }
      chrome.storage.local.set({ projects }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (request.type === 'GET_PROJECTS') {
    chrome.storage.local.get(['projects'], (result) => {
      sendResponse({ projects: result.projects || [] });
    });
    return true;
  }
});
