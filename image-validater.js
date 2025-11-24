import fs from "fs";
import sharp from "sharp";

const MAX_IMAGES = 5;
const MAX_URL_IMAGE_SIZE = 20 * 1024 * 1024;   // 20MB
const MAX_BASE64_SIZE = 4 * 1024 * 1024;       // 4MB
const MAX_PIXELS = 33177600;                   // 33 megapixels

export async function validateImages(imagePaths = []) {
  // 1. Max image count
  if (imagePaths.length > MAX_IMAGES) {
    throw new Error(`Too many images. Maximum allowed is ${MAX_IMAGES}.`);
  }

  for (const imagePath of imagePaths) {
    // ---- A) File exists ----
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image not found: ${imagePath}`);
    }

    // ---- B) File size limit (20 MB) ----
    const fileStats = fs.statSync(imagePath);
    if (fileStats.size > MAX_URL_IMAGE_SIZE) {
      throw new Error(
        `Image ${imagePath} is too large (${fileStats.size} bytes). Maximum allowed is 20MB.`
      );
    }

    // ---- C) Base64 size limit (4 MB request) ----
    const base64 = fs.readFileSync(imagePath, "base64");
    const base64SizeBytes = Buffer.byteLength(base64, "utf8");

    if (base64SizeBytes > MAX_BASE64_SIZE) {
      throw new Error(
        `Base64 version of ${imagePath} exceeds 4MB request limit.`
      );
    }

    // ---- D) Resolution limit (33 megapixels) ----
    const metadata = await sharp(imagePath).metadata();

    const { width, height } = metadata;
    const totalPixels = width * height;

    if (totalPixels > MAX_PIXELS) {
      throw new Error(
        `Image ${imagePath} too large: ${totalPixels} pixels. Maximum allowed is 33 megapixels.`
      );
    }
  }

  return true; // All good
}
