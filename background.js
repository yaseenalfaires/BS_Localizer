// LibreTranslate API integration for translation
async function translateTextAPI(text, targetLang = 'en', sourceLang = 'auto') {
  console.log(`Translating text from ${sourceLang} to ${targetLang} using LibreTranslate API`);
  const model = genAI.getGenerativeModel({ model: "models/gemma-3-1b-it" });
  const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemma-3-1b-it:generateContent';

  try {
    const apiUrl = "https://libretranslate.com/translate";
    
    const response = await fetch(apiUrl, {
      method: "POST",
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: targetLang,
        format: "text",
        api_key: "AIzaSyCqUCVN2yDsj8150PwDkZXU1l4Nc4nBWyQ" // API key is optional for basic usage
      }),
      headers: {
        "Content-Type": "application/json"
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`API Error: ${response.status} ${errorData ? JSON.stringify(errorData) : response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data && data.translatedText) {
      return data.translatedText;
    } else {
      throw new Error("Invalid response format from translation API");
    }
  } catch (error) {
    console.error("Translation API error:", error);
    // Fallback to original text with error indicator
    return `[Translation Error: ${error.message}] ${text}`;
  }
}

// Placeholder for actual generative AI styling API call
async function styleTextAPI(text, tone, style) {
  console.log(`Simulating styling of: "${text}" with Tone: ${tone}, Style: ${style}`);
  await new Promise(resolve => setTimeout(resolve, 300)); // Shorter delay

  let styledText = text;

  // Apply Tone
  switch (tone) {
    case 'formal':
      styledText = `It is with due consideration that we observe the following: "${styledText}"`;
      break;
    case 'informal':
      styledText = `Hey, so, like, about this: "${styledText}"`;
      break;
    case 'friendly':
      styledText = `Just wanted to share this with you: "${styledText}" Hope you find it helpful!`;
      break;
    case 'professional':
      styledText = `Please find the following information for your review: "${styledText}"`;
      break;
    case 'sarcastic':
      styledText = `Oh, joy. Another brilliant statement: "${styledText}" Clearly, this is going to change the world.`;
      break;
    case 'respectful':
      styledText = `With all due respect, I would like to present the following: "${styledText}"`;
      break;
  }

  // Apply Style (can be combined with tone)
  switch (style) {
    case 'concise':
      if (styledText.length > 100) { // Arbitrary length for conciseness demo
        styledText = styledText.substring(0, 97) + "...";
      }
      styledText += " (Concise)";
      break;
    case 'detailed':
      styledText += " (Detailed Elaboration: Further details would expand on each point, providing comprehensive background and examples.)";
      break;
    case 'persuasive':
      styledText = `You'll surely agree that ${styledText.toLowerCase().startsWith('"') ? styledText.charAt(0) : '"'}${styledText.toLowerCase().startsWith('"') ? styledText.slice(1) : styledText}. Consider the impactful implications. (Persuasive)`;
      break;
    case 'poetic':
      styledText = `Behold, a message woven with words of yore:
${styledText}
Thus echoes this truth, forevermore. (Poetic)`;
      break;
    case 'technical':
      styledText = `Technical Analysis: The input data "${text}" processed with tone='${tone}' and style='${style}' yields the output: ${styledText}. (Technical)`;
      break;
  }

  return styledText;
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "translateTab") {
    console.log("Background: translateTab message received");
    // 1. Get current tab
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs.length === 0) {
        console.error("No active tab found.");
        sendResponse({ error: "No active tab found." });
        return;
      }
      const activeTabId = tabs[0].id;

      // 2. Execute content script to get text
      chrome.scripting.executeScript(
        {
          target: { tabId: activeTabId },
          // A slightly more refined (but still very basic) text extraction
          function: () => { 
            const tagsToExtract = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'td', 'caption', 'span', 'a'];
            let text = [];
            tagsToExtract.forEach(tag => {
              const elements = document.querySelectorAll(tag);
              elements.forEach(el => {
                // Only take direct text, avoid script/style, and be mindful of hidden elements
                if (el.offsetParent !== null && !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName.toUpperCase())) {
                  // Get textContent and trim; only add if it's not just whitespace
                  const directText = Array.from(el.childNodes)
                                     .filter(node => node.nodeType === Node.TEXT_NODE)
                                     .map(node => node.textContent.trim())
                                     .join(' ');
                  if (directText) {
                    text.push(directText);
                  }
                }
              });
            });
            // Fallback to body innerText if specific tags yield nothing substantial
            if (text.join(' ').trim().length < 50) { // Arbitrary threshold
                return document.body.innerText;
            }
            return text.join('\n\n'); // Separate content from different elements
          }
        },
        (injectionResults) => {
          if (chrome.runtime.lastError || !injectionResults || !injectionResults[0] || injectionResults[0].result === null) {
            let errorMessage = "Failed to extract text from tab.";
            if (chrome.runtime.lastError) {
              errorMessage += " " + chrome.runtime.lastError.message;
            } else if (!injectionResults || !injectionResults[0] || injectionResults[0].result === null) {
              errorMessage += " No result from script execution or script returned null.";
            }
            console.error("Error injecting script or getting text:", errorMessage);
            chrome.runtime.sendMessage({ 
              action: "updatePopup", 
              error: errorMessage
            });
            return;
          }
          
          const pageText = injectionResults[0].result;
          if (!pageText || pageText.trim() === "") {
            chrome.runtime.sendMessage({ action: "updatePopup", text: "No meaningful text content found on the page to translate." });
            return;
          }

          console.log("Background: Text extracted from tab:", pageText.substring(0,100) + "...");

          // 3. Translate the text using LibreTranslate API
          translateTextAPI(pageText, 'en', 'auto')
            .then(translatedText => {
              console.log("Background: Text translated:", translatedText.substring(0,100) + "...");
              
              if (translatedText.trim() === pageText.trim()) {
                chrome.runtime.sendMessage({ action: "updatePopup", text: "Text appears to be already in English or no specific translation was applied." });
                return;
              }

              chrome.scripting.executeScript({
                target: { tabId: activeTabId },
                function: (newText) => {
                  // Still using innerText for replacement due to complexity of alternatives
                  // but this should be a major point of improvement for a real extension.
                  document.body.innerText = newText; 
                },
                args: [translatedText]
              }, () => {
                if (chrome.runtime.lastError) {
                  console.error("Error injecting script for text replacement:", chrome.runtime.lastError.message);
                  chrome.runtime.sendMessage({ action: "updatePopup", error: "Failed to update tab content: " + chrome.runtime.lastError.message});
                } else {
                  chrome.runtime.sendMessage({ action: "updatePopup", text: "Tab content has been updated with translated text." });
                }
              });
            })
            .catch(error => {
              console.error("Error during tab translation API call:", error);
              chrome.runtime.sendMessage({ action: "updatePopup", error: "Translation API failed: " + error.message });
            });
        }
      );
    });
    sendResponse({ status: "initiated" }); // Respond to popup immediately
    return true; // Indicates that sendResponse will be called asynchronously
  } 
  else if (request.action === "translateInput") {
    console.log("Background: translateInput message received", request);
    const { text, tone, style } = request;

    // Detect language and translate using LibreTranslate API
    (async () => {
      try {
        // First detect the language
        let sourceLang = 'auto';
        let targetLang = 'en';
        
        // Translate the text using LibreTranslate API
        let translatedText = await translateTextAPI(text, targetLang, sourceLang);
        console.log("Background: User input translated:", translatedText);
        
        // Apply styling if requested
        if (tone || style) {
          translatedText = await styleTextAPI(translatedText, tone, style);
          console.log("Background: Text styled:", translatedText);
        }
        
        sendResponse({ translatedText: translatedText });
      } catch (error) {
        console.error("Error during input translation/styling:", error);
        sendResponse({ error: "Failed to process input: " + error.message });
      }
    })();
    
    return true; // Indicates that sendResponse will be called asynchronously
  }
});

console.log("Background script loaded with LibreTranslate API integration.");
