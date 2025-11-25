import { Groq } from 'groq-sdk';
import 'dotenv/config';
import { WebClient } from '@slack/web-api';
import { validateImages } from './image-validater.js';
import sharp from 'sharp';

// Initialize clients
const groq = new Groq();
const slackClient = new WebClient(process.env.SLACK_USER_TOKEN);

/**
 * Builds messages for the AI including image data
 * @param {string} message - User's text message
 * @param {string[]} imagePaths - Array of image file paths
 * @returns {Promise<Array>} - Formatted messages for the AI
 */
async function buildMessages(message, imagePaths) {
  // Create text message with image indices
  const messages = [{
    type: "text",
    text: message + "\n" + imagePaths.map((path, index) => `Image ${index + 1}: ${path}`).join("\n")
  }];

  // Process images for AI analysis
  const encodedImages = await Promise.all(
    imagePaths.map(async (imagePath) => {
      try {
        const buffer = await sharp(imagePath)
          .resize({ width: 800 })
          .jpeg({ quality: 60 })
          .toBuffer();
        return buffer.toString("base64");
      } catch (error) {
        console.error(`Error processing image ${imagePath}:`, error);
        throw new Error(`Failed to process image: ${imagePath}`);
      }
    })
  );

  // Add encoded images to messages
  encodedImages.forEach((encodedImage) => {
    messages.push({
      type: "image_url",
      image_url: {
        url: `data:image/jpeg;base64,${encodedImage}`
      }
    });
  });

  // Validate images
  try {
    await validateImages(imagePaths);
    console.log("All images valid. Proceed with AI request.");
  } catch (err) {
    console.error("Validation failed:", err.message);
    throw err;
  }

  return messages;
}

/**
 * Main function to process images and generate AI response
 * @param {string[]} imagePaths - Array of image file paths
 * @param {string} message - User's text message
 * @returns {Promise<string>} - AI-generated response
 */
export async function main(imagePaths, message) {
  try {
    const messages = await buildMessages(message, imagePaths);

    const chatCompletion = await groq.chat.completions.create({
      "messages": [{
        "role": "system", 
        "content": `You are an Image Content Generation & Publishing Agent.
          Core Responsibilities:
          Image Understanding:
          When the user provides one or more images, analyze them.
          If multiple images are provided, select only ONE image that is best suited for social media posting.
          Do not mix content from multiple images.
          Description Generation:
          Create a detailed, engaging, and accurate description for the selected image.
          The description should be written in a tone suitable for social media (clear, expressive, and high-quality).
          Never hallucinate any objects or scenes that are not present in the image.
          Image–Description Consistency:
          Ensure the description strictly matches the selected image.
          If multiple images are provided, make sure the description and selected image correspond to each other correctly.
          Social Media Preparation:
          Format the final output as a ready-to-post social media content package.
          The output should contain:
          Selected Image Index (1-based indexing)
          Generated Description
          Hashtags (optional)
          Post text ready for publishing
          Error Handling:
          If no images are provided, ask the user to upload an image.
          If an image is unclear or corrupted, request a clearer version.
          Primary Goal:
          Generate the best possible social media-ready post based on one selected image, even if multiple images are provided. The agent should always maintain accuracy, clarity, and consistency between the chosen image and the generated description.`
      }, {"role": "user", "content": messages}],
      "tools": [{
        "type": "function",
        "function": {
          "name": "slack_image_upload",
          "description": "upload user image to slack channel",
          "parameters": {
            "type": "object",
            "properties": {
              "image_index": {
                "type": "string",
                "description": "The 1-based index of the selected image to upload as a string."
              },
              "channel": {
                "type": "string",
                "description": "The Slack channel name where the image should be uploaded."
              },
              "context": {
                "type": "string",
                "description": "Any additional context or text description along with the image."
              }
            },
            "required": ["image_index", "channel"]
          }
        }
      }],
      "tool_choice": "auto",
      "model": "meta-llama/llama-4-scout-17b-16e-instruct",
      "temperature": 1,
      "max_completion_tokens": 1024,
      "top_p": 1,
      "stream": false,
      "stop": null
    });

    const tool_calls = chatCompletion.choices[0].message.tool_calls;
    console.log("Tool calls:", tool_calls);
    
    if (!tool_calls) {
      return chatCompletion.choices[0].message.content;
    }

    const tool_call = tool_calls[0];
    const function_args = JSON.parse(tool_call.function.arguments);
    console.log(function_args);
    
    // Convert image_index to integer
    if (typeof function_args.image_index === 'string') {
      function_args.image_index = parseInt(function_args.image_index, 10);
    }
    
    // Pass the image paths so we can select the correct image based on the index
    const response = await slack_image_upload(function_args, imagePaths);
    return response;
  } catch (error) {
    console.error('Error in main function:', error);
    throw error;
  }
}

/**
 * Uploads selected image to Slack
 * @param {Object} params - Upload parameters
 * @param {number} params.image_index - Index of the selected image
 * @param {string} params.channel - Slack channel name
 * @param {string} params.context - Context message
 * @param {string[]} imagePaths - Array of image file paths
 * @returns {Promise<string>} - Upload result message
 */
async function slack_image_upload({ image_index, channel, context }, imagePaths) {
  try {
    // Find the channel by name
    const channelList = await slackClient.conversations.list({
      exclude_archived: true
    });
    
    const channelData = channelList.channels.find(c => c.name === channel);

    if (!channelData) {
      return `Channel #${channel} not found.`;
    }
    
    // Convert image_index to integer if it's a string
    const index = parseInt(image_index, 10);
    
    // Validate image index
    if (isNaN(index) || index < 1 || index > imagePaths.length) {
      return `Invalid image index: ${image_index}. Please select an index between 1 and ${imagePaths.length}.`;
    }
    
    // Get the actual image path for the selected index (convert from 1-based to 0-based)
    const selectedImagePath = imagePaths[index - 1];
    console.log(`Uploading image ${index} to Slack: ${selectedImagePath}`);
    
    const response = await slackClient.filesUploadV2({
      channel_id: channelData.id,
      initial_comment: context,
      file: selectedImagePath,
      filename: `image_${index}.jpg`
    });

    if (response.ok) {
      return "Image uploaded successfully";
    } else {
      return "Failed to upload image";
    }
  } catch (error) {
    console.error("Error uploading to Slack:", error);
    return `Error uploading image: ${error.message}`;
  }
}