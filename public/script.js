// Determine the base URL dynamically
const baseURL = window.location.origin;

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const imageInput = document.getElementById('imageInput');
const uploadBtn = document.getElementById('uploadBtn');
const sendBtn = document.getElementById('sendBtn');

// State
let uploadedImagePath = null;
let uploadedImageName = null;

// Event Listeners
uploadBtn.addEventListener('click', () => {
    imageInput.click();
});

imageInput.addEventListener('change', handleImageUpload);
sendBtn.addEventListener('click', sendMessage);

// Handle image upload
async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Show preview
    showImagePreview(file);
    
    // Upload to server
    try {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch(`${baseURL}/upload`, {
            method: 'POST',
            body: formData
        });
        
        // Check if response is OK
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // Try to parse JSON
        let result;
        try {
            result = await response.json();
        } catch (parseError) {
            throw new Error('Invalid response format from server');
        }
        
        uploadedImagePath = result.filePath;
        uploadedImageName = result.fileName;
        sendBtn.disabled = false; // Enable the send button when a new image is uploaded
        sendBtn.innerHTML = '➤'; // Restore the send button icon
        
        // Add user message to chat
        addUserMessage(`Uploaded image: ${file.name}`);
    } catch (error) {
        console.error('Upload error:', error);
        showError(`Error uploading image: ${error.message}. Please make sure you're accessing this page through http://localhost:3000`);
    }
}

// Show image preview
function showImagePreview(file) {
    // Clear previous preview
    const existingPreview = document.querySelector('.preview-container');
    if (existingPreview) {
        existingPreview.remove();
    }
    
    // Create preview container
    const previewContainer = document.createElement('div');
    previewContainer.className = 'preview-container';
    
    // Create image preview
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.className = 'preview-image';
        previewContainer.appendChild(img);
        
        // Add file info
        const infoDiv = document.createElement('div');
        infoDiv.className = 'preview-info';
        
        const nameSpan = document.createElement('div');
        nameSpan.className = 'preview-name';
        nameSpan.textContent = file.name.length > 20 ? file.name.substring(0, 17) + '...' : file.name;
        
        const sizeSpan = document.createElement('div');
        sizeSpan.className = 'preview-size';
        sizeSpan.textContent = formatFileSize(file.size);
        
        infoDiv.appendChild(nameSpan);
        infoDiv.appendChild(sizeSpan);
        previewContainer.appendChild(infoDiv);
        
        // Add remove button
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '×';
        removeBtn.onclick = function() {
            previewContainer.remove();
            imageInput.value = '';
            uploadedImagePath = null;
            uploadedImageName = null;
            sendBtn.disabled = true;
        };
        previewContainer.appendChild(removeBtn);
        
        // Add to chat
        chatMessages.appendChild(previewContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };
    reader.readAsDataURL(file);
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Send message to AI
async function sendMessage() {
    if (!uploadedImagePath) return;
    
    // Disable the send button to prevent multiple submissions
    sendBtn.disabled = true;
    sendBtn.innerHTML = '⏳'; // Change button to show loading state
    
    // Show typing indicator
    const typingIndicator = showTypingIndicator();
    
    try {
        const response = await fetch(`${baseURL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
                },
            body: JSON.stringify({ image: uploadedImagePath })
        });
        
        // Remove typing indicator
        typingIndicator.remove();
        
        // Check if response is OK
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // Try to parse JSON
        let result;
        try {
            result = await response.json();
        } catch (parseError) {
            throw new Error('Invalid response format from server');
        }
        
        addBotMessage(result.message);
        
        // Change button icon back to arrow but keep it disabled
        sendBtn.innerHTML = '➤';
    } catch (error) {
        // Remove typing indicator
        typingIndicator.remove();
        console.error('Chat error:', error);
        showError(`Error communicating with AI: ${error.message}. Please make sure you're accessing this page through http://localhost:3000`);
        
        // Change button icon back to arrow but keep it disabled
        sendBtn.innerHTML = '➤';
    }
    // Note: We don't re-enable the button here - it stays disabled until a new image is uploaded
}

// Add user message to chat
function addUserMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add bot message to chat
function addBotMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return typingDiv;
}

// Show error message
function showError(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    messageDiv.style.background = '#ffebee';
    messageDiv.style.color = '#c62828';
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}