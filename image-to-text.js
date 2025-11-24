import { Groq } from 'groq-sdk';
import 'dotenv/config';
import fs from 'fs';
import { WebClient } from '@slack/web-api';
import {validateImages} from './image-validater.js';

const groq = new Groq();

const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);


async function encodeImageToBase64(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  return imageBuffer.toString('base64');
}

async function buildMessages(message, imagePaths) {
  const messages = [
    {
      type: "text",
      text: message + "\n" + imagePaths.join("\n")
    }
  ];

  for (const imagePath of imagePaths) {
    const base64Image = await encodeImageToBase64(imagePath);

    messages.push({
      type: "image_url",
      image_url: {
        url: `data:image/jpeg;base64,${base64Image}`
      }
    });
  }
  try {
    await validateImages(imagePaths);

    console.log("All images valid. Proceed with AI request.");
  } catch (err) {
    console.error("Validation failed:", err.message);
  }

  return messages; // <-- correct!
}


export async function main(imagePaths, message) {
  const messages = await buildMessages(message, imagePaths);
  // return messages;

// create a welcome message and post this with image on slack channel id C09TYUAS7J7
// Please one image from the list and write a breif description about that image and send it to slack channel id C09TYUAS7J7
  const chatCompletion = await groq.chat.completions.create({
    "messages": [{"role": "user", "content": messages}],
    "tools": [
        {
          "type": "function",
          "function": {
            "name": "slack_image_upload",
            "description": "upload user image to slack channel",
            "parameters": {
              "type": "object",
              "properties": {
                "image_url": {
                  "type": "string",
                  "description": "The URL of the image to upload."
                },
                "channel": {
                  "type": "string",
                  "description": "The Slack channel id to upload the image to."
                },
                "context": {
                  "type": "string",
                  "description": "Any additional context or text description along with the image."
                }
              },
              "required": ["image_url", "channel"]
            }
          }
        }
      ],
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
  const response = await slack_image_upload(function_args);
  return response;
}

async function slack_image_upload({image_url, channel, context}) {
  const response = await slackClient.filesUploadV2({
    channel_id: channel,
    initial_comment: context,
    file: image_url,
    filename: image_url
  });
  console.log(response);

  if (response.ok) {
    return "data uploaded successfully";
  } else {
    return "failed to upload data";
  }

}
