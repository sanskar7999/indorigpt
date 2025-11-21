import {main} from './image-to-text.js';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

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

app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  // Return the file path so the frontend can use it
  res.json({ 
    message: 'File uploaded successfully',
    filePath: req.file.path,
    fileName: req.file.filename
  });
});

app.post('/chat', async (req, res) => {
  const image = req.body.image;
  console.log(`Image: ${JSON.stringify(req.body)}`);
  if (!image) return res.status(400).send('No image provided');
  const result = await main(image);
  res.json({message: result});
});

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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});