# AI Image Chatbot

An intelligent image analysis and social media content generation application that leverages AI to analyze uploaded images and automatically generate engaging social media posts.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [How It Works](#how-it-works)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Error Handling](#error-handling)
- [Contributing](#contributing)
- [License](#license)

## Overview

The AI Image Chatbot is a web application that allows users to upload images and receive AI-generated descriptions and social media content. When multiple images are uploaded, the AI selects the best image for social media posting and creates a tailored caption for it.

## Features

- Upload up to 5 images simultaneously
- AI-powered image analysis and selection
- Automatic generation of social media-ready content
- Real-time chat interface
- Image preview and management
- Slack integration for content publishing
- Responsive web design
- Error handling and validation

## Technology Stack

- **Backend**: Node.js with Express.js
- **AI Processing**: Groq API with Llama model
- **Image Processing**: Sharp.js
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Storage**: Local file system
- **Communication**: RESTful API
- **Slack Integration**: Slack Web API

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Groq API key
- Slack API token (for Slack integration)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd indorigpt
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create an uploads directory:
   ```bash
   mkdir uploads
   ```

4. Start the server:
   ```bash
   node server.js
   ```

5. Access the application at `http://localhost:3000`

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
GROQ_API_KEY=your_groq_api_key_here
SLACK_USER_TOKEN=your_slack_user_token_here
PORT=3000
```

## API Endpoints

### `GET /`
- **Description**: Serves the main web application
- **Response**: HTML page with chat interface

### `POST /upload`
- **Description**: Handles image file uploads
- **Request**:
  - Form data with `images` field containing up to 5 image files
- **Response**:
  ```json
  {
    "message": "Files uploaded successfully",
    "filePaths": ["uploads/filename1.jpg", "uploads/filename2.png"],
    "fileNames": ["filename1.jpg", "filename2.png"]
  }
  ```
- **Errors**:
  - 400: No files uploaded
  - 500: Server error during upload

### `POST /chat`
- **Description**: Processes images with AI and generates content
- **Request**:
  ```json
  {
    "images": ["uploads/filename1.jpg", "uploads/filename2.jpg"],
    "message": "What's in these images?"
  }
  ```
- **Response**:
  ```json
  {
    "message": "AI-generated response with selected image description"
  }
  ```
- **Errors**:
  - 400: No images provided
  - 500: AI processing error

## How It Works

1. **Image Upload**: Users can upload up to 5 images through the web interface
2. **Image Processing**: Uploaded images are processed and optimized using Sharp.js
3. **AI Analysis**: Images are sent to the Groq API with Llama model for analysis
4. **Image Selection**: When multiple images are provided, the AI selects the best one for social media
5. **Content Generation**: The AI generates a detailed description and social media post for the selected image
6. **Slack Integration**: Generated content can be published directly to a Slack channel
7. **Response**: Results are displayed in the chat interface

### AI Workflow

1. Images are resized and compressed for efficient processing
2. Images are validated for size and format
3. Images are sent to the AI with a detailed system prompt
4. AI selects one image and generates content according to the prompt
5. AI can optionally trigger the Slack upload tool
6. Response is formatted and sent back to the user

## Usage

1. Open the web application in your browser
2. Click the camera icon to upload images (up to 5)
3. View image previews before sending
4. Type a message or use the default prompt
5. Click send to process images with AI
6. View AI-generated content in the chat
7. (Optional) Use Slack integration to publish content

## Project Structure

```
indorigpt/
├── public/
│   ├── index.html          # Main HTML file
│   ├── script.js           # Frontend JavaScript
│   └── styles.css          # CSS styling
├── uploads/                # Uploaded images directory
├── image-to-text.js        # AI image processing logic
├── image-validater.js      # Image validation functions
├── server.js               # Express server
├── package.json            # Project dependencies
└── .env                    # Environment variables (not included in repo)
```

## Error Handling

The application implements comprehensive error handling:

- **File Upload Errors**: Size limits, format validation
- **AI Processing Errors**: API failures, timeout handling
- **Slack Integration Errors**: Channel not found, upload failures
- **User Input Validation**: Required fields, data format validation
- **Server Errors**: 500 errors with detailed logging

All errors are logged to the console and appropriate HTTP status codes are returned.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.