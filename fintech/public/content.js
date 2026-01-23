// Content script for StartupKit - enables web clipping functionality

// Listen for messages from the extension popup/side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_PAGE_DATA') {
    // Extract useful data from the current page
    const pageData = {
      title: document.title,
      url: window.location.href,
      selectedText: window.getSelection()?.toString() || '',
      metaDescription: document.querySelector('meta[name="description"]')?.content || '',
    };
    sendResponse({ data: pageData });
  }

  if (request.type === 'ENABLE_CLIP_MODE') {
    enableClipMode();
    sendResponse({ success: true });
  }
});

// Clip mode - allows user to select elements on the page
function enableClipMode() {
  let overlay = document.createElement('div');
  overlay.id = 'startupkit-clip-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.1);
    z-index: 999999;
    cursor: crosshair;
  `;

  let tooltip = document.createElement('div');
  tooltip.id = 'startupkit-clip-tooltip';
  tooltip.style.cssText = `
    position: fixed;
    background: #4F46E5;
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-family: system-ui, sans-serif;
    z-index: 1000000;
    pointer-events: none;
  `;
  tooltip.textContent = 'Click to clip this content | ESC to cancel';

  document.body.appendChild(overlay);
  document.body.appendChild(tooltip);

  let highlightedElement = null;

  overlay.addEventListener('mousemove', (e) => {
    tooltip.style.left = e.clientX + 15 + 'px';
    tooltip.style.top = e.clientY + 15 + 'px';

    // Find element under cursor
    overlay.style.pointerEvents = 'none';
    const element = document.elementFromPoint(e.clientX, e.clientY);
    overlay.style.pointerEvents = 'auto';

    if (highlightedElement) {
      highlightedElement.style.outline = '';
    }

    if (element && element !== document.body && element !== document.documentElement) {
      highlightedElement = element;
      element.style.outline = '2px solid #4F46E5';
    }
  });

  overlay.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    overlay.style.pointerEvents = 'none';
    const element = document.elementFromPoint(e.clientX, e.clientY);
    overlay.style.pointerEvents = 'auto';

    if (element) {
      const clipData = {
        type: 'text',
        content: element.innerText?.trim() || element.textContent?.trim() || '',
        html: element.outerHTML,
        tag: element.tagName.toLowerCase(),
      };

      chrome.runtime.sendMessage({
        type: 'CLIP_DATA',
        data: clipData
      });

      // Show success feedback
      tooltip.textContent = 'Clipped!';
      tooltip.style.background = '#10B981';

      setTimeout(() => {
        cleanup();
      }, 500);
    }
  });

  const cleanup = () => {
    if (highlightedElement) {
      highlightedElement.style.outline = '';
    }
    overlay.remove();
    tooltip.remove();
  };

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cleanup();
    }
  }, { once: true });
}
