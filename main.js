// Utility function to convert newlines to <br> and preserve formatting
function formatText(text) {
  return text
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

// Show a toast notification
function showToast(message, type = 'success') {
  const toastContainer = document.querySelector('.toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = message;
  toastContainer.appendChild(toast);
  
  // Remove toast after animation completes
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Function to fetch explanation from API
async function fetchExplanation(prompt, level) {
  try {
    const response = await fetch('/api/explain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, level }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching explanation:', error);
    return { error: error.message };
  }
}

// Function to update gallery count badge
function updateGalleryCount() {
  try {
    const history = JSON.parse(localStorage.getItem('explanationHistory') || '[]');
    const countElement = document.getElementById('galleryCount');
    if (countElement) {
      countElement.textContent = history.length;
      // Hide count if zero
      countElement.style.display = history.length > 0 ? 'inline-flex' : 'none';
    }
  } catch (error) {
    console.error('Error updating gallery count:', error);
  }
}

// Function to save explanation to history
function saveExplanation(prompt, level, explanation) {
  try {
    // Get existing history from localStorage or initialize empty array
    const history = JSON.parse(localStorage.getItem('explanationHistory') || '[]');
    
    // Add new explanation to history
    history.push({
      id: Date.now(),
      prompt,
      level,
      explanation,
      timestamp: new Date().toISOString()
    });
    
    // Save updated history back to localStorage
    localStorage.setItem('explanationHistory', JSON.stringify(history));
    
    // Update gallery count
    updateGalleryCount();
    
    // Render the updated gallery if it's visible
    if (document.getElementById('galleryArea').classList.contains('visible')) {
      renderGallery();
    }
  } catch (error) {
    console.error('Error saving explanation:', error);
  }
}

// Function to render explanation history as gallery
function renderGallery() {
  const galleryArea = document.getElementById('galleryArea');
  const history = JSON.parse(localStorage.getItem('explanationHistory') || '[]');
  
  if (history.length === 0) {
    galleryArea.innerHTML = '<div class="alert alert-info">Your knowledge gallery is empty. Ask questions to build your collection!</div>';
    return;
  }
  
  // Sort history by timestamp (newest first)
  history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  let galleryHTML = `
    <div class="gallery-header">
      <h2>Knowledge Gallery</h2>
      <button class="gallery-close-btn" onclick="hideGallery()">
        <i class="bi bi-x-lg"></i>
      </button>
    </div>
    <div class="gallery-grid">
  `;
  
  history.forEach(item => {
    const date = new Date(item.timestamp).toLocaleDateString();
    const time = new Date(item.timestamp).toLocaleTimeString();
    const levelBadge = getLevelBadge(item.level);
    
    galleryHTML += `
      <div class="gallery-card">
        <div class="card-header">
          <span class="text-truncate" title="${item.prompt}">${item.prompt}</span>
          ${levelBadge}
        </div>
        <div class="card-body" onclick="openExplanationInChat(${item.id})">
          <div class="explanation-preview">${item.explanation.substring(0, 150)}${item.explanation.length > 150 ? '...' : ''}</div>
        </div>
        <div class="card-footer">
          <span>${date} at ${time}</span>
          <div class="card-actions">
            <button class="btn btn-sm btn-primary" onclick="openExplanationInChat(${item.id})"><i class="bi bi-chat-left-text"></i></button>
            <button class="btn btn-sm btn-danger" onclick="deleteExplanation(${item.id})"><i class="bi bi-trash"></i></button>
          </div>
        </div>
      </div>
    `;
  });
  
  galleryHTML += '</div>';
  galleryArea.innerHTML = galleryHTML;
}

// Function to get level badge HTML
function getLevelBadge(level) {
  const badges = {
    low: '<span class="badge bg-success">Simple</span>',
    medium: '<span class="badge bg-primary">Step-by-step</span>',
    high: '<span class="badge bg-warning text-dark">Technical</span>'
  };
  return badges[level] || '';
}

// Function to open an explanation from gallery in the chat
function openExplanationInChat(id) {
  try {
    // Get history from localStorage
    const history = JSON.parse(localStorage.getItem('explanationHistory') || '[]');
    
    // Find the explanation with the given id
    const item = history.find(item => item.id === id);
    
    if (!item) {
      showToast('Explanation not found', 'error');
      return;
    }
    
    // Hide gallery
    hideGallery();
    
    // Clear chat container
    const chatContainer = document.getElementById('chatContainer');
    chatContainer.innerHTML = '';
    
    // Add user message to chat
    const userMessage = document.createElement('div');
    userMessage.className = 'message message-user';
    userMessage.innerHTML = `
      <div class="message-bubble">
        <p>${item.prompt}</p>
      </div>
      <div class="message-meta">You</div>
    `;
    chatContainer.appendChild(userMessage);
    
    // Add AI response to chat
    const responseMessage = document.createElement('div');
    responseMessage.className = 'message message-ai';
    
    // Extract thinking portion and actual explanation
    let thinkContent = '';
    let actualExplanation = item.explanation;
    
    // Check if the response contains a thinking portion
    const thinkMatch = item.explanation.match(/<think>(.*?)<\/think>\s*/s);
    if (thinkMatch) {
      thinkContent = thinkMatch[1].trim();
      // Remove the thinking portion from the actual explanation
      actualExplanation = item.explanation.replace(/<think>.*?<\/think>\s*/s, '').trim();
    }
    
    // Process content for images and apply formatting
    const processedContent = processMessageContent(formatText(actualExplanation));
    
    // Create HTML with thinking toggle
    responseMessage.innerHTML = `
      <div class="message-bubble">
        ${thinkContent ? `
          <div class="thinking-toggle">
            <button class="btn btn-sm btn-outline-secondary" onclick="toggleThinking(this)" title="View AI's thinking process">
              <i class="bi bi-lightbulb"></i> View thinking
            </button>
            <div class="thinking-content" style="display: none;">
              <div class="thinking-box">
                <p>${formatText(thinkContent)}</p>
              </div>
            </div>
          </div>
        ` : ''}
        <p data-original-text="${actualExplanation.replace(/"/g, '&quot;')}">${processedContent}</p>
        <button class="btn btn-sm text-to-speech-btn" onclick="speakText(this)" title="Listen to this explanation">
          <i class="bi bi-volume-up"></i>
        </button>
      </div>
      <div class="message-meta">AI Assistant ${getLevelBadge(item.level)}</div>
    `;
    
    chatContainer.appendChild(responseMessage);
    
    // Scroll to bottom of chat
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Set level selector to match the explanation's level
    document.getElementById('levelSelect').value = item.level;
    
    // Show toast notification
    showToast('Opened explanation in chat', 'success');
  } catch (error) {
    console.error('Error opening explanation in chat:', error);
    showToast('Error opening explanation', 'error');
  }
}

// Function to delete an explanation from history
function deleteExplanation(id) {
  try {
    // Get existing history
    const history = JSON.parse(localStorage.getItem('explanationHistory') || '[]');
    
    // Filter out the item to delete
    const updatedHistory = history.filter(item => item.id !== id);
    
    // Save updated history
    localStorage.setItem('explanationHistory', JSON.stringify(updatedHistory));
    
    // Update gallery count
    updateGalleryCount();
    
    // Re-render the gallery
    renderGallery();
    
    // Show toast notification
    showToast('Item deleted successfully', 'success');
    
    // If gallery is now empty, hide it after a short delay
    if (updatedHistory.length === 0) {
      setTimeout(() => {
        hideGallery();
      }, 1500);
    }
  } catch (error) {
    console.error('Error deleting explanation:', error);
    showToast('Error deleting item', 'error');
  }
}

// Function to show the gallery
function showGallery() {
  const galleryArea = document.getElementById('galleryArea');
  renderGallery();
  galleryArea.style.display = 'block';
  // Use setTimeout to ensure display:block is applied before adding the visible class
  setTimeout(() => {
    galleryArea.classList.add('visible');
  }, 10);
}

// Function to hide the gallery
function hideGallery() {
  const galleryArea = document.getElementById('galleryArea');
  galleryArea.classList.remove('visible');
  // Wait for transition to complete before hiding
  setTimeout(() => {
    galleryArea.style.display = 'none';
  }, 300); // Match this with the CSS transition duration
}

// Function to show toast notifications
function showToast(message, type = 'info') {
  const toastContainer = document.querySelector('.toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <i class="bi ${type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'}"></i>
      <span>${message}</span>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.classList.add('toast-fade-out');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// Event listener for the explain button
document.getElementById('explainBtn').addEventListener('click', async () => {
  const promptInput = document.getElementById('promptInput');
  const levelSelect = document.getElementById('levelSelect');
  const chatContainer = document.getElementById('chatContainer');
  
  const prompt = promptInput.value.trim();
  const level = levelSelect.value;
  
  if (!prompt) {
    showToast('Please enter a concept to explain.', 'error');
    return;
  }
  
  // Add user message to chat
  const userMessage = document.createElement('div');
  userMessage.className = 'message message-user';
  userMessage.innerHTML = `
    <div class="message-bubble">
      <p>${prompt}</p>
    </div>
    <div class="message-meta">You</div>
  `;
  chatContainer.appendChild(userMessage);
  
  // Add loading message
  const loadingId = 'loading-' + Date.now();
  const loadingMessage = document.createElement('div');
  loadingMessage.id = loadingId;
  loadingMessage.className = 'message message-ai';
  loadingMessage.innerHTML = `
    <div class="message-bubble">
      <div class="spinner-border spinner-border-sm text-secondary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <span class="ms-2">Generating explanation...</span>
    </div>
    <div class="message-meta">AI Assistant</div>
  `;
  chatContainer.appendChild(loadingMessage);
  
  // Scroll to bottom of chat
  chatContainer.scrollTop = chatContainer.scrollHeight;
  
  // Clear input
  promptInput.value = '';
  
  try {
    // Fetch explanation from API
    const result = await fetchExplanation(prompt, level);
    
    // Remove loading message
    const loadingElement = document.getElementById(loadingId);
    if (loadingElement) {
      loadingElement.remove();
    }
    
    // Create response message
    const responseMessage = document.createElement('div');
    responseMessage.className = 'message message-ai';
    
    if (result.error) {
      // Show error message
      responseMessage.innerHTML = `
        <div class="message-bubble error">
          <p>Sorry, I encountered an error: ${result.error}</p>
        </div>
        <div class="message-meta">AI Assistant</div>
      `;
    } else {
      // Extract thinking portion and actual explanation
      let thinkContent = '';
      let actualExplanation = result.explanation;
      
      // Check if the response contains a thinking portion
      const thinkMatch = result.explanation.match(/<think>(.*?)<\/think>\s*/s);
      if (thinkMatch) {
        thinkContent = thinkMatch[1].trim();
        // Remove the thinking portion from the actual explanation
        actualExplanation = result.explanation.replace(/<think>.*?<\/think>\s*/s, '').trim();
      }
      
      // Process content for images and apply formatting
      const processedContent = processMessageContent(formatText(actualExplanation));
      
      // Create HTML with thinking toggle
      responseMessage.innerHTML = `
        <div class="message-bubble">
          ${thinkContent ? `
            <div class="thinking-toggle">
              <button class="btn btn-sm btn-outline-secondary" onclick="toggleThinking(this)" title="View AI's thinking process">
                <i class="bi bi-lightbulb"></i> View thinking
              </button>
              <div class="thinking-content" style="display: none;">
                <div class="thinking-box">
                  <p>${formatText(thinkContent)}</p>
                </div>
              </div>
            </div>
          ` : ''}
          <p data-original-text="${actualExplanation.replace(/"/g, '&quot;')}">${processedContent}</p>
          <button class="btn btn-sm text-to-speech-btn" onclick="speakText(this)" title="Listen to this explanation">
            <i class="bi bi-volume-up"></i>
          </button>
        </div>
        <div class="message-meta">AI Assistant ${getLevelBadge(level)}</div>
      `;
      
      // Save explanation to history
      saveExplanation(prompt, level, result.explanation);
    }
    
    chatContainer.appendChild(responseMessage);
    
    // Scroll to bottom of chat
    chatContainer.scrollTop = chatContainer.scrollHeight;
  } catch (error) {
    console.error('Error:', error);
    
    // Remove loading message
    const loadingElement = document.getElementById(loadingId);
    if (loadingElement) {
      loadingElement.remove();
    }
    
    // Show error message
    const errorMessage = document.createElement('div');
    errorMessage.className = 'message message-ai';
    errorMessage.innerHTML = `
      <div class="message-bubble error">
        <p>Sorry, I encountered an error: ${error.message}</p>
      </div>
      <div class="message-meta">AI Assistant</div>
    `;
    chatContainer.appendChild(errorMessage);
    
    // Scroll to bottom of chat
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
});

// Allow pressing Enter to submit
document.getElementById('promptInput').addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    document.getElementById('explainBtn').click();
  }
});

// New chat button functionality - if this button exists in the UI
const newChatBtn = document.querySelector('.new-chat-btn');
if (newChatBtn) {
  newChatBtn.addEventListener('click', () => {
    // Clear chat except for the first welcome message
    const chatContainer = document.getElementById('chatContainer');
    const welcomeMessage = chatContainer.querySelector('.message');
    chatContainer.innerHTML = '';
    if (welcomeMessage) {
      chatContainer.appendChild(welcomeMessage);
    }
    
    // Clear input
    document.getElementById('promptInput').value = '';
    
    // Hide gallery if it's open
    hideGallery();
    
    // Show toast notification
    showToast('Started a new chat', 'success');
  });
}

// Category button functionality - if these buttons exist in the UI
document.querySelectorAll('.category-btn').forEach(button => {
  button.addEventListener('click', () => {
    // Get the category text
    const category = button.textContent.trim();
    
    // Set the input field with a template prompt based on category
    const promptInput = document.getElementById('promptInput');
    promptInput.value = `Explain ${category} concepts and best practices`;
    promptInput.focus();
    
    // Hide gallery if it's open
    hideGallery();
  });
});

// Function to toggle the thinking content visibility
function toggleThinking(button) {
  const thinkingContent = button.nextElementSibling;
  if (thinkingContent.style.display === 'none') {
    thinkingContent.style.display = 'block';
    button.innerHTML = '<i class="bi bi-lightbulb-fill"></i> Hide thinking';
  } else {
    thinkingContent.style.display = 'none';
    button.innerHTML = '<i class="bi bi-lightbulb"></i> View thinking';
  }
}

// Function to handle text-to-speech
function speakText(button) {
  // Get the text content from the message bubble
  const messageBubble = button.closest('.message-bubble');
  const messageElement = messageBubble.querySelector('p');
  
  // Get the original explanation text without HTML tags
  // First try to get it from the data attribute if available
  let textContent;
  if (messageElement.dataset.originalText) {
    textContent = messageElement.dataset.originalText;
  } else {
    // Otherwise, use the text content (which might include some HTML artifacts)
    textContent = messageElement.textContent;
  }
  
  // Make sure we're not reading any thinking content that might be in the text
  textContent = textContent.replace(/<think>.*?<\/think>/gs, '').trim();
  
  // Check if the Web Speech API is supported
  if ('speechSynthesis' in window) {
    // Create a new speech synthesis utterance
    const utterance = new SpeechSynthesisUtterance(textContent);
    
    // Optional: Set voice properties
    utterance.rate = 1.0; // Speed of speech (0.1 to 10)
    utterance.pitch = 1.0; // Pitch of speech (0 to 2)
    utterance.volume = 1.0; // Volume (0 to 1)
    
    // Use cached voices if available
     if (speechVoices.length > 0) {
       // Try to find an English voice
       const englishVoice = speechVoices.find(voice => voice.lang.includes('en'));
       if (englishVoice) {
         utterance.voice = englishVoice;
       }
     } else {
       // Try to load voices again if not available
       loadVoices();
     }
    
    // Toggle button icon between play and stop
     if (window.speechSynthesis.speaking) {
       window.speechSynthesis.cancel();
       button.innerHTML = '<i class="bi bi-volume-up"></i>';
       button.title = 'Listen to this explanation';
     } else {
       // Show loading state
       button.innerHTML = '<i class="bi bi-hourglass-split"></i>';
       button.title = 'Preparing speech...';
       button.disabled = true;
       
       try {
         window.speechSynthesis.speak(utterance);
         
         // Small delay to ensure the speech has started
         setTimeout(() => {
           if (window.speechSynthesis.speaking) {
             button.innerHTML = '<i class="bi bi-stop-fill"></i>';
             button.title = 'Stop reading';
             button.disabled = false;
           } else {
             // If speech didn't start, reset the button
             button.innerHTML = '<i class="bi bi-volume-up"></i>';
             button.title = 'Listen to this explanation';
             button.disabled = false;
             showToast('Could not start speech synthesis', 'error');
           }
         }, 100);
         
         // When speech ends, reset the button
         utterance.onend = function() {
           button.innerHTML = '<i class="bi bi-volume-up"></i>';
           button.title = 'Listen to this explanation';
           button.disabled = false;
         };
         
         // Handle errors
         utterance.onerror = function(event) {
           console.error('Speech synthesis error:', event);
           button.innerHTML = '<i class="bi bi-volume-up"></i>';
           button.title = 'Listen to this explanation';
           button.disabled = false;
           showToast('Error during speech synthesis', 'error');
         };
       } catch (error) {
         console.error('Speech synthesis error:', error);
         button.innerHTML = '<i class="bi bi-volume-up"></i>';
         button.title = 'Listen to this explanation';
         button.disabled = false;
         showToast('Error starting speech synthesis', 'error');
       }
     }
  } else {
    // Speech synthesis not supported
    showToast('Text-to-speech is not supported in your browser', 'error');
  }
}

// Function to render images in chat messages
function renderImage(url, caption = '') {
  return `
    <div class="image-container">
      <img src="${url}" alt="${caption || 'Generated image'}" />
      ${caption ? `<div class="image-caption">${caption}</div>` : ''}
    </div>
  `;
}

// Function to process message content for potential image URLs
function processMessageContent(content) {
  // Check if content contains image URLs (this is a simple example, adjust based on your API response format)
  const imgRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/gi;
  return content.replace(imgRegex, (match) => {
    return renderImage(match);
  });
}

// Variable to store available voices
let speechVoices = [];

// Function to load and cache available voices
function loadVoices() {
  speechVoices = window.speechSynthesis.getVoices();
}

// Load voices when they become available
if ('speechSynthesis' in window) {
  // Chrome loads voices asynchronously
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
  // Initial load attempt
  loadVoices();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Hide gallery initially
  document.getElementById('galleryArea').style.display = 'none';
  
  // Initialize gallery count
  updateGalleryCount();
  
  // Focus on input field
  document.getElementById('promptInput').focus();
});