import { main } from './image-to-text.js';
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

// More explicit multer configuration
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
    files: 5 // Maximum 5 files
  }
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from the root directory
app.use('/uploads', express.static('uploads'));

const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle multiple file uploads
app.post('/upload', upload.array('images', 5), (req, res) => {
  // Debug: Log what Multer received
  console.log('Multer received files:', req.files);
  console.log('Multer received body:', req.body);
  console.log('Multer received fields:', Object.keys(req.body));
  
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

// Handle chat requests with multiple images
app.post('/chat', async (req, res) => {
  const imagePaths = req.body.images; // Now expecting an array of image paths
  const message = req.body.message;

  if (!imagePaths || !Array.isArray(imagePaths) || imagePaths.length === 0) {
    return res.status(400).send('No images provided');
  }
  
  try {
    const result = await main(imagePaths, message);
    res.json({ message: result });
  } catch (error) {
    console.error('Error processing chat request:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});