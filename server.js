const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Middleware to parse incoming requests with JSON payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the current directory
app.use(express.static(__dirname));

// Serve index.html at the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Set up storage for file uploads using multer
const storage = multer.diskStorage({
  destination: './uploads/', // Folder to save the files
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to file name
  }
});

const upload = multer({ storage: storage });

// Define a Mongoose schema for the uploaded media
const MediaSchema = new mongoose.Schema({
  filePath: String,
  description: String,
  createdAt: { type: Date, default: Date.now }
});

const Media = mongoose.model('Media', MediaSchema);

// Route to handle file upload
app.post('/upload', upload.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Save file metadata to MongoDB
    const newMedia = new Media({
      filePath: req.file.path,
      description: req.body.description
    });
    await newMedia.save();

    res.status(200).json({ message: 'File uploaded successfully', media: newMedia });
  } catch (err) {
    console.error('Error during file upload:', err);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Route to get the news feed (list of uploaded files)
app.get('/feed', async (req, res) => {
  try {
    const mediaItems = await Media.find().sort({ createdAt: -1 });
    res.status(200).json(mediaItems);
  } catch (err) {
    console.error('Error fetching feed:', err);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

// Serve the uploaded files statically
app.use('/uploads', express.static('uploads'));

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
