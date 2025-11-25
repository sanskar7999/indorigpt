// Determine the base URL dynamically
const baseURL = window.location.origin;

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const previewArea = document.getElementById('previewArea');
const imageInput = document.getElementById('imageInput');
const userInput = document.getElementById('userInput');
const uploadBtn = document.getElementById('uploadBtn');
const sendBtn = document.getElementById('sendBtn');

// Modal Elements
const modal = document.getElementById('imageModal');
const enlargedImage = document.getElementById('enlargedImage');
const modalCaption = document.getElementById('modalCaption');
const closeBtn = document.querySelector('.close');

// State
let uploadedImagePaths = [];
let uploadedImageNames = [];
let fullImageDataUrls = [];
let originalFiles = [];

// Initialize the application
function initApp() {
    setupEventListeners();
    setupModalEventListeners();
}

// Set up main event listeners
function setupEventListeners() {
    uploadBtn.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', handleImageUpload);
    userInput.addEventListener('keypress', handleKeyPress);
    sendBtn.addEventListener('click', sendMessage);
}

// Set up modal event listeners
function setupModalEventListeners() {
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', handleWindowClick);
    enlargedImage.addEventListener('click', closeModal);
}

// Handle key press events
function handleKeyPress(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
}

// Close modal
function closeModal() {
    modal.style.display = 'none';
}

// Handle window click events
function handleWindowClick(e) {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
}

// Handle image upload
async function handleImageUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Limit to 5 files total
    const currentFileCount = fullImageDataUrls.length;
    const maxFilesToAdd = 5 - currentFileCount;
    
    // If we've already reached the limit, don't add more
    if (maxFilesToAdd <= 0) {
        showError("You can only upload up to 5 images.");
        imageInput.value = '';
        return;
    }
    
    // Limit new files to add
    const filesToProcess = Array.from(files).slice(0, maxFilesToAdd);
    
    // Update originalFiles array
    const newOriginalFiles = [];
    const previewContainers = document.querySelectorAll('.preview-container');
    
    // Add existing files from current previews
    previewContainers.forEach(container => {
        if (container.fileObject) {
            newOriginalFiles.push(container.fileObject);
        }
    });
    
    // Add new files
    filesToProcess.forEach(file => newOriginalFiles.push(file));
    originalFiles = newOriginalFiles;
    
    // Process each new file for preview
    for (const file of filesToProcess) {
        showImagePreview(file);
    }
    
    // Upload all current files to server
    await uploadAllCurrentFiles();
    
    // Clear the input value
    imageInput.value = '';
}

// Upload all current files to server
async function uploadAllCurrentFiles() {
    try {
        // Only upload if we have files
        if (originalFiles.length === 0) {
            sendBtn.disabled = true;
            return;
        }
        
        const formData = new FormData();
        
        // Append all current files to form data
        originalFiles.forEach((file, index) => {
            formData.append('images', file);
            console.log(`Appending file ${index}:`, file.name);
        });
        
        const response = await fetch(`${baseURL}/upload`, {
            method: 'POST',
            body: formData
        });
        
        // Check if response is OK
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server response error:', errorText);
            throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
        }
        
        const result = await response.json();
        
        // Store the paths and names
        uploadedImagePaths = result.filePaths || [];
        uploadedImageNames = result.fileNames || [];
        sendBtn.disabled = false;
        sendBtn.innerHTML = '➤';
    } catch (error) {
        console.error('Upload error:', error);
        showError(`Error uploading images: ${error.message}. Please make sure you're accessing this page through http://localhost:3000`);
    }
}

// Show image preview
function showImagePreview(file) {
    // Create preview container for each image
    const previewContainer = document.createElement('div');
    previewContainer.className = 'preview-container';
    previewContainer.fileObject = file;
    
    // Create image preview
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageDataUrl = e.target.result;
        fullImageDataUrls.push(imageDataUrl);
        
        const img = document.createElement('img');
        img.src = imageDataUrl;
        img.className = 'preview-image';
        img.alt = 'Preview of uploaded image';
        
        // Add click event to show enlarged image
        const currentIndex = fullImageDataUrls.length - 1;
        img.addEventListener('click', () => showEnlargedImage(currentIndex, file.name));
        
        previewContainer.appendChild(img);
        
        // Add file info
        const infoDiv = createFileInfoDiv(file);
        previewContainer.appendChild(infoDiv);
        
        // Add remove button
        const removeBtn = createRemoveButton();
        removeBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            removeImageAtIndex(currentIndex);
        });
        previewContainer.appendChild(removeBtn);
        
        // Add to preview area
        previewArea.appendChild(previewContainer);
        previewArea.scrollLeft = previewArea.scrollWidth;
    };
    reader.readAsDataURL(file);
}

// Remove image at specific index
function removeImageAtIndex(index) {
    // Find and remove the preview container
    const previewContainers = document.querySelectorAll('.preview-container');
    if (previewContainers[index]) {
        previewContainers[index].remove();
    }
    
    // Remove the corresponding data from our arrays
    fullImageDataUrls.splice(index, 1);
    uploadedImagePaths.splice(index, 1);
    uploadedImageNames.splice(index, 1);
    originalFiles.splice(index, 1);
    
    // Disable send button if no images left
    if (fullImageDataUrls.length === 0) {
        sendBtn.disabled = true;
    }
    
    // Re-upload the remaining files to sync with the server
    if (originalFiles.length > 0) {
        uploadAllCurrentFiles();
    }
}

// Create file info div
function createFileInfoDiv(file) {
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
    
    return infoDiv;
}

// Create remove button
function createRemoveButton() {
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.innerHTML = '×';
    removeBtn.setAttribute('aria-label', 'Remove image');
    return removeBtn;
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
    const message = userInput.value.trim() || "What's in these images?";
    if (uploadedImagePaths.length === 0) return;

    // Add user message to chat
    addUserMessage(message);
    userInput.value = '';
    
    // Disable the send button to prevent multiple submissions
    sendBtn.disabled = true;
    sendBtn.innerHTML = '⏳';
    
    // Show typing indicator
    const typingIndicator = showTypingIndicator();
    
    try {
        const response = await fetch(`${baseURL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                images: uploadedImagePaths,
                message: message
            })
        });
        
        // Remove typing indicator
        typingIndicator.remove();
        
        // Check if response is OK
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const result = await response.json();
        addBotMessage(result.message);
        
        // Remove image previews after sending
        removeImagePreview();
        
        // Reset state
        resetState();
    } catch (error) {
        // Remove typing indicator
        typingIndicator.remove();
        console.error('Chat error:', error);
        showError(`Error communicating with AI: ${error.message}. Please make sure you're accessing this page through http://localhost:3000`);
        sendBtn.innerHTML = '➤';
    }
}

// Remove image preview
function removeImagePreview() {
    const previewContainers = document.querySelectorAll('.preview-container');
    previewContainers.forEach(container => container.remove());
    imageInput.value = '';
}

// Reset application state
function resetState() {
    uploadedImagePaths = [];
    uploadedImageNames = [];
    fullImageDataUrls = [];
    originalFiles = [];
    sendBtn.disabled = true;
    sendBtn.innerHTML = '➤';
}

// Add user message to chat
function addUserMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    
    // Add text message
    const textElement = document.createElement('div');
    textElement.textContent = text;
    messageDiv.appendChild(textElement);
    
    // Add image previews to user message
    fullImageDataUrls.forEach((imageUrl) => {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.className = 'message-image';
        img.alt = 'Uploaded image';
        img.addEventListener('click', () => showEnlargedImageFromData(imageUrl));
        messageDiv.appendChild(img);
    });
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show enlarged image in modal
function showEnlargedImage(index, fileName) {
    event.stopPropagation();
    enlargedImage.src = fullImageDataUrls[index];
    modalCaption.innerHTML = fileName || uploadedImageNames[index] || 'Uploaded Image';
    modal.style.display = 'block';
}

// Show enlarged image in modal directly from image data
function showEnlargedImageFromData(imageDataUrl) {
    event.stopPropagation();
    enlargedImage.src = imageDataUrl;
    modalCaption.innerHTML = 'Uploaded Image';
    modal.style.display = 'block';
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
    messageDiv.className = 'message bot-message error-message';
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Initialize the application
initApp();