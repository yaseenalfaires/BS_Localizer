console.log("Content script loaded. Ready to interact with the page.");

// Listening for messages from the background script (optional here, as background.js currently injects functions directly)
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "getPageText") {
    // This is an example if we wanted content.js to be responsible for getting text
    // Currently, background.js injects a function to do this.
    console.log("Content script received getPageText request.");
    sendResponse({ textContent: document.body.innerText });
  } else if (request.action === "replacePageText") {
    // This is an example if we wanted content.js to be responsible for replacing text
    // Currently, background.js injects a function to do this.
    console.log("Content script received replacePageText request.");
    if (request.text) {
      document.body.innerText = request.text;
      sendResponse({ status: "success" });
    } else {
      sendResponse({ status: "failed", message: "No text provided" });
    }
  }
  return true; // Keep channel open for async response if needed
});

// The primary functions for text extraction and replacement are currently
// dynamically injected by background.js using chrome.scripting.executeScript.
// This content.js file is here to fulfill the manifest requirement and for
// potential future expansion (e.g., more complex DOM interactions, persistent listeners).
