import {main} from './image-to-text.js';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure multer for file uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from the root directory
app.use('/uploads', express.static('uploads'));

const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Updated to handle multiple file uploads
app.post('/upload', upload.array('images', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }
  
  // Return the file paths so the frontend can use them
  const filePaths = req.files.map(file => file.path);
  const fileNames = req.files.map(file => file.filename);
  
  res.json({ 
    message: 'Files uploaded successfully',
    filePaths: filePaths,
    fileNames: fileNames
  });
});

// Updated to handle multiple images
app.post('/chat', async (req, res) => {
  const imagePaths = req.body.images; // Now expecting an array of image paths
  const message = req.body.message;

  if (!imagePaths || !Array.isArray(imagePaths) || imagePaths.length === 0) {
    return res.status(400).send('No images provided');
  }
  
  // For now, we'll use the first image for analysis
  // In a more advanced implementation, you might want to analyze all images
  const result = await main(imagePaths, message);
  res.json({message: result});
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});