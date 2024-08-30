const express = require('express');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql');
require('dotenv').config();

// Initialize the Express app
const app = express();

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

// Middleware to parse incoming requests with JSON payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the current directory
app.use(express.static(__dirname));

// Serve the login page as the default route
app.post('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html')); // Ensure you have a login.html in your root directory
});

// Handle login form submission
app.get('/login', (req, res) => {
//     For simplicity, we're not doing any actual authentication here
  //   You can add real authentication logic if needed
    const username = req.body.username;
    const password = req.body.password;

    // Log the username and password for debugging (optional)
    console.log(`Username: ${username}, Password: ${password}`);

    // Redirect to the upload page
    res.redirect('/upload');
});

// Serve the upload page
app.get('/upload', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // Assuming 'index.html' is the current upload page
});

// Handle signup
app.get('/signup', (req, res) => {
    res.send('Signup Page (Under Construction)'); // Placeholder or you can create a signup.html
});

// Define the storage engine for Multer
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Initialize upload with Multer
const upload = multer({ storage: storage });

// Route to handle file upload
app.post('/upload', upload.single('media'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Save file metadata to MySQL
        const newMedia = {
            filePath: req.file.path,
            description: req.body.description
        };

        const query = 'INSERT INTO media SET ?';
        connection.query(query, newMedia, (error, results) => {
            if (error) {
                console.error('Error during file upload:', error);
                return res.status(500).json({ error: 'Failed to upload file' });
            }
            res.status(200).json({ message: 'File uploaded successfully', media: newMedia });
        });
    } catch (err) {
        console.error('Error during file upload:', err);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// Route to get the news feed (list of uploaded files)
app.get('/feed', async (req, res) => {
    try {
        const query = 'SELECT * FROM media ORDER BY createdAt DESC';
        connection.query(query, (error, results) => {
            if (error) {
                console.error('Error fetching feed:', error);
                return res.status(500).json({ error: 'Failed to fetch feed' });
            }
            res.status(200).json(results);
        });
    } catch (err) {
        console.error('Error fetching feed:', err);
        res.status(500).json({ error: 'Failed to fetch feed' });
    }
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://13.239.25.104:${PORT}`);
});
