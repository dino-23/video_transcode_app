const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const mysql = require('mysql');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Create a connection to the MySQL database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Dino@12345',
  database: 'social_media_app_db'
});

// Connect to MySQL
connection.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
  } else {
    console.log('Connected to MySQL');

    // Create the media table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS media (
          id INT AUTO_INCREMENT PRIMARY KEY,
          filePath VARCHAR(255) NOT NULL,
          description TEXT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    connection.query(createTableQuery, (error, results) => {
      if (error) {
        console.error('Error creating table:', error);
      } else {
        console.log('Table "media" created or already exists');
      }
    });
  }
});

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve the main page with upload form and video list
app.get('/', (req, res) => {
  const query = 'SELECT * FROM media ORDER BY createdAt DESC LIMIT 10';
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching videos:', error);
      return res.status(500).send('Failed to fetch videos.');
    }

    // Generate HTML with links to each uploaded video
    const videoLinks = results.map(file => `<li><a href="/uploads/${path.basename(file.filePath)}" target="_blank">${path.basename(file.filePath)}</a></li>`).join('');

    res.send(`
<html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f9;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
        }
        .container {
          background-color: #fff;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          width: 400px;
          text-align: center;
        }
        h1 {
          color: #3a3afb;
          margin-bottom: 20px;
        }
        .upload-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .upload-form input,
        .upload-form button {
          padding: 10px;
          font-size: 16px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        .upload-form button {
          background-color: #3a3afb;
          color: #fff;
          border: none;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        .upload-form button:hover {
          background-color: #2e2efa;
        }
        h3 {
          margin-top: 20px;
          color: #333;
        }
        ul {
          list-style: none;
          padding: 0;
          margin: 0;
          max-height: 200px;
          overflow-y: auto;
          text-align: left;
        }
        ul li {
          margin-bottom: 10px;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 5px;
          transition: background-color 0.3s;
        }
        ul li:hover {
          background-color: #f0f0ff;
        }
        ul li a {
          text-decoration: none;
          color: #3a3afb;
          word-break: break-all;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Upload Media</h1>
        <form class="upload-form" action="/upload" method="POST" enctype="multipart/form-data">
          <input type="file" name="video" accept="video/*" required>
          <input type="text" name="description" placeholder="Add a description" required>
          <button type="submit">Upload and Transcode</button>
        </form>
        <h3>Uploaded Videos:</h3>
        <ul>
          ${videoLinks}
        </ul>
      </div>
    </body>
    </html>
    `);
  });
});

// Handle video upload, store in MySQL, and start transcoding
app.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const inputFilePath = path.join(__dirname, req.file.path);
  const outputFilePath = path.join(__dirname, 'uploads', `output-${uuidv4()}.mp4`);
  const description = req.body.description;

  // Save file metadata to MySQL
  const newMedia = {
    filePath: req.file.path,
    description: description
  };

  const query = 'INSERT INTO media SET ?';
  connection.query(query, newMedia, (error, results) => {
    if (error) {
      console.error('Error during file metadata saving:', error);
      return res.status(500).json({ error: 'Failed to save file metadata' });
    }

    // Start transcoding using FFmpeg
    const ffmpegCommand = `ffmpeg -i "${inputFilePath}" -c:v libx264 -preset fast -crf 22 -c:a aac "${outputFilePath}"`;

    exec(ffmpegCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error during transcoding: ${error.message}`);
        return res.status(500).send('Error during transcoding.');
      }
      console.log(`Transcoding complete. File saved to ${outputFilePath}`);
      res.send(`Video uploaded and transcoded successfully. <a href="/">Upload another video</a>`);
    });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://3.27.125.143:${PORT}`);
});
