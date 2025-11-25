import fs from "fs";
import sharp from "sharp";

// Configuration constants
const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 20 * 1024 * 1024;   // 20MB
const MAX_BASE64_SIZE = 4 * 1024 * 1024;  // 4MB
const MAX_PIXELS = 33177600;              // 33 megapixels

/**
 * Validates uploaded images against size and resolution limits
 * @param {string[]} imagePaths - Array of image file paths to validate
 * @returns {Promise<boolean>} - True if all images are valid
 * @throws {Error} - If any validation fails
 */
export async function validateImages(imagePaths = []) {
  // Check max image count
  if (imagePaths.length > MAX_IMAGES) {
    throw new Error(`Too many images. Maximum allowed is ${MAX_IMAGES}.`);
  }

  // Validate each image
  for (const imagePath of imagePaths) {
    await validateSingleImage(imagePath);
  }

  return true;
}

/**
 * Validates a single image file
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<void>}
 * @throws {Error} - If validation fails
 */
async function validateSingleImage(imagePath) {
  // Check if file exists
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image not found: ${imagePath}`);
  }

  // Check file size limit
  const fileStats = fs.statSync(imagePath);
  if (fileStats.size > MAX_FILE_SIZE) {
    throw new Error(
      `Image ${imagePath} is too large (${fileStats.size} bytes). Maximum allowed is 20MB.`
    );
  }

  // Check base64 size limit
  const base64 = fs.readFileSync(imagePath, "base64");
  const base64SizeBytes = Buffer.byteLength(base64, "utf8");

  if (base64SizeBytes > MAX_BASE64_SIZE) {
    throw new Error(
      `Base64 version of ${imagePath} exceeds 4MB request limit.`
    );
  }

  // Check resolution limit
  try {
    const metadata = await sharp(imagePath).metadata();
    const { width, height } = metadata;
    const totalPixels = width * height;

    if (totalPixels > MAX_PIXELS) {
      throw new Error(
        `Image ${imagePath} too large: ${totalPixels} pixels. Maximum allowed is 33 megapixels.`
      );
    }
  } catch (error) {
    if (error.message.includes("Input file is of invalid type")) {
      throw new Error(`Invalid image format for file: ${imagePath}`);
    }
    throw error;
  }
}