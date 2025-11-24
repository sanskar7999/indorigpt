// Determine the base URL dynamically
const baseURL = window.location.origin;

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const previewArea = document.getElementById('previewArea'); // Changed from uploadedImagePreview
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
let uploadedImagePaths = []; // Changed from single path to array
let uploadedImageNames = []; // Changed from single name to array
let fullImageDataUrls = []; // Store multiple full image data URLs for modal viewing
let originalFiles = []; // Store original File objects for re-uploading

// Initialize the application
function initApp() {
    setupEventListeners();
    setupModalEventListeners();
}

// Set up main event listeners
function setupEventListeners() {
    uploadBtn.addEventListener('click', () => {
        imageInput.click();
    });

    imageInput.addEventListener('change', handleImageUpload);
    userInput.addEventListener('keypress', handleKeyPress);
    sendBtn.addEventListener('click', sendMessage);
}

// Set up modal event listeners
function setupModalEventListeners() {
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', handleWindowClick);
    // Make modal content clickable to close
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
        // Clear the input to prevent confusion
        imageInput.value = '';
        return;
    }
    
    // Limit new files to add
    const filesToProcess = Array.from(files).slice(0, maxFilesToAdd);
    
    // Don't clear previous previews and state
    // Instead, we'll add to existing previews
    
    // Process each file
    for (const file of filesToProcess) {
        // Store the original file for potential re-upload
        originalFiles.push(file);
        // Show preview for each file
        showImagePreview(file);
    }
    
    // Upload all current files to server
    await uploadAllCurrentFiles();
}

// Upload all current files to server
async function uploadAllCurrentFiles() {
    try {
        const formData = new FormData();
        
        // Append all current files to form data
        originalFiles.forEach((file) => {
            formData.append('images', file);
        });
        
        const response = await fetch(`${baseURL}/upload`, {
            method: 'POST',
            body: formData
        });
        
        // Check if response is OK
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // Try to parse JSON
        const result = await response.json();
        
        // Store the paths and names
        uploadedImagePaths = result.filePaths || [];
        uploadedImageNames = result.fileNames || [];
        sendBtn.disabled = false; // Enable the send button when new images are uploaded
        sendBtn.innerHTML = '➤'; // Restore the send button icon
        
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
    
    // Create image preview
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageDataUrl = e.target.result;
        fullImageDataUrls.push(imageDataUrl); // Store full image data for modal
        
        const img = document.createElement('img');
        img.src = imageDataUrl;
        img.className = 'preview-image';
        img.alt = 'Preview of uploaded image';
        
        // Add click event to show enlarged image (pass index for reference)
        const currentIndex = fullImageDataUrls.length - 1;
        img.addEventListener('click', () => showEnlargedImage(currentIndex, file.name));
        
        previewContainer.appendChild(img);
        
        // Add file info
        const infoDiv = createFileInfoDiv(file);
        previewContainer.appendChild(infoDiv);
        
        // Add remove button for each image
        const removeBtn = createRemoveButton();
        // Add click event to remove only this specific image
        removeBtn.addEventListener('click', function(event) {
            // Prevent the event from bubbling up
            event.stopPropagation();
            
            // Find the index of this image in our arrays
            const index = fullImageDataUrls.indexOf(imageDataUrl);
            if (index !== -1) {
                // Remove this specific preview
                previewContainer.remove();
                
                // Remove the corresponding data from our arrays
                fullImageDataUrls.splice(index, 1);
                uploadedImagePaths.splice(index, 1);
                uploadedImageNames.splice(index, 1);
                originalFiles.splice(index, 1); // Also remove the original file
                
                // Disable send button if no images left
                if (fullImageDataUrls.length === 0) {
                    sendBtn.disabled = true;
                }
            }
        });
        previewContainer.appendChild(removeBtn);
        
        // Add to preview area
        previewArea.appendChild(previewContainer);
        previewArea.scrollLeft = previewArea.scrollWidth; // Auto-scroll to show new preview
    };
    reader.readAsDataURL(file);
}

// Clear previous preview
function clearPreviousPreview() {
    const existingPreviews = document.querySelectorAll('.preview-container');
    existingPreviews.forEach(preview => preview.remove());
}

// Show enlarged image in modal
function showEnlargedImage(index, fileName) {
    // Prevent event from propagating to parent elements
    event.stopPropagation();
    
    // Get the image source from the clicked element
    const imgSrc = fullImageDataUrls[index];
    
    enlargedImage.src = imgSrc;
    // Use the file name if available, otherwise use the uploaded image name
    modalCaption.innerHTML = fileName || uploadedImageNames[index] || 'Uploaded Image';
    modal.style.display = 'block';
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
    // Don't add the general removeImage listener here
    // Each specific image will add its own listener in showImagePreview
    return removeBtn;
}

// Remove image
function removeImage() {
    const previewContainers = document.querySelectorAll('.preview-container');
    previewContainers.forEach(container => container.remove());
    
    imageInput.value = '';
    uploadedImagePaths = [];
    uploadedImageNames = [];
    fullImageDataUrls = [];
    originalFiles = []; // Clear the original files array
    sendBtn.disabled = true;
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

    // Add user message to chat (with image previews)
    addUserMessage(message);
    userInput.value = '';   // Clear the input 
    
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
            body: JSON.stringify({ 
                images: uploadedImagePaths, // Sending array of image paths
                message: message
            })
        });
        
        // Remove typing indicator
        typingIndicator.remove();
        
        // Check if response is OK
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // Parse JSON response
        const result = await response.json();
        
        addBotMessage(result.message);
        
        // Remove image previews after sending
        removeImagePreview();
        
        // Reset state
        uploadedImagePaths = [];
        uploadedImageNames = [];
        fullImageDataUrls = [];
        sendBtn.disabled = true;
        sendBtn.innerHTML = '➤';
    } catch (error) {
        // Remove typing indicator
        typingIndicator.remove();
        console.error('Chat error:', error);
        showError(`Error communicating with AI: ${error.message}. Please make sure you're accessing this page through http://localhost:3000`);
        
        // Change button icon back to arrow but keep it disabled
        sendBtn.innerHTML = '➤';
    }
}

// Remove image preview
function removeImagePreview() {
    const previewContainers = document.querySelectorAll('.preview-container');
    previewContainers.forEach(container => container.remove());
    imageInput.value = '';
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
        // Add click event to show enlarged image
        // Pass the image data directly instead of an index
        img.addEventListener('click', () => showEnlargedImageFromData(imageUrl));
        messageDiv.appendChild(img);
    });
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show enlarged image in modal directly from image data
function showEnlargedImageFromData(imageDataUrl) {
    // Prevent event from propagating to parent elements
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