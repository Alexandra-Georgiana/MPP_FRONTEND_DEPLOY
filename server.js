import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Load environment variables
console.log("\nLoading environment variables...");
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET_KEY || 'admin-secret-key-change-this-in-production';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database Configuration
console.log("\nReading database configuration...");
const MYSQL_PUBLIC_URL = process.env.MYSQL_PUBLIC_URL;

if (!MYSQL_PUBLIC_URL) {
  console.error("MYSQL_PUBLIC_URL environment variable is not set");
  throw new Error("MYSQL_PUBLIC_URL environment variable is not set");
}

console.log("\nParsed connection details:");
const parsedUrl = new URL(MYSQL_PUBLIC_URL);
console.log(`Host: ${parsedUrl.hostname}`);
console.log(`Port: ${parsedUrl.port}`);
console.log(`User: ${parsedUrl.username}`);
console.log(`Database: ${parsedUrl.pathname.slice(1)}`);

console.log("\nAttempting to connect to MySQL...");
const db = mysql.createPool({
  host: parsedUrl.hostname,
  port: parsedUrl.port,
  user: parsedUrl.username,
  password: parsedUrl.password,
  database: parsedUrl.pathname.slice(1),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the connection
db.getConnection()
  .then(connection => {
    console.log(`\nSuccessfully connected to MySQL database at ${parsedUrl.hostname}:${parsedUrl.port}`);
    connection.release();
  })
  .catch(err => {
    console.error("\nMySQL Error:", err);
    console.error("Connection URL:", MYSQL_PUBLIC_URL);
    throw err;
  });

// Email Configuration
console.log("\nConfiguring email transporter...");
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Create uploads directory if it doesn't exist
console.log("\nSetting up uploads directory...");
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  console.log("Creating uploads directory...");
  fs.mkdirSync(uploadsPath);
  console.log("Uploads directory created successfully");
}

// Middleware
console.log("\nConfiguring middleware...");
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// Multer for file uploads
console.log("Setting up file upload configuration...");
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads');
  },
  filename: function(req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: function(req, file, cb) {
    if (file.fieldname === "albumCover") {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed for album cover!'), false);
      }
    } else if (file.fieldname === "audioFile") {
      if (!file.mimetype.startsWith('audio/')) {
        return cb(new Error('Only audio files are allowed for song!'), false);
      }
    }
    cb(null, true);
  }
});

// Static file serving
console.log("Configuring static file serving...");
const staticPath = path.join(__dirname, '..', 'dist');
app.use(express.static(staticPath));
app.use('/uploads', express.static(uploadsPath));

// Helper: Generate random 6-digit code
function generateVerificationToken() {
  return crypto.randomInt(100000, 999999).toString();
}

// Helper: Send verification email
async function sendVerificationEmail(toEmail, verificationCode) {
  console.log(`\nSending verification email to ${toEmail}...`);
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: toEmail,
    subject: "Music Library - Email Verification",
    text: `Welcome to Music Library!\n\nYour verification code is: ${verificationCode}\n\nThis code will expire in 10 minutes.\nIf you didn't request this code, please ignore this email.`,
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50; text-align: center;">Welcome to Music Library!</h2>
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p style="font-size: 16px;">Your verification code is:</p>
              <h1 style="text-align: center; color: #3498db; font-size: 32px; letter-spacing: 5px;">${verificationCode}</h1>
              <p style="color: #7f8c8d; font-size: 14px;">This code will expire in 10 minutes.</p>
            </div>
            <p style="color: #95a5a6; font-size: 12px; text-align: center;">If you didn't request this code, please ignore this email.</p>
          </div>
        </body>
      </html>
    `
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log("Verification email sent successfully");
  } catch (err) {
    console.error("Failed to send verification email:", err);
    throw err;
  }
}

// Helper: JWT for admin
function generateAdminToken(admin_id, email) {
  const expiration = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours
  return jwt.sign({ admin_id, email, exp: expiration }, SECRET_KEY, { algorithm: 'HS256' });
}

// Middleware: User authentication (JWT)
function authenticateUser(req, res, next) {
  console.log("\nAuthenticating user...");
  const token = req.headers.authorization?.split('Bearer ')[1] || req.query.token;
  if (!token) {
    console.log("No token provided");
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    console.log(`User authenticated: ${decoded.email}`);
    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Middleware: Admin authentication (JWT)
function verifyAdminToken(req, res, next) {
  console.log("\nVerifying admin token...");
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    console.log("No admin token provided");
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.admin = decoded;
    console.log(`Admin authenticated: ${decoded.email}`);
    next();
  } catch (err) {
    console.error("Admin token verification failed:", err);
    return res.status(401).json({ error: 'Invalid or expired admin token' });
  }
}

// -------------------- USER ENDPOINTS --------------------

// Register user
app.post('/api/register', async (req, res) => {
  console.log("\nProcessing user registration...");
  const { email, username, password } = req.body;
  if (!email || !username || !password) {
    console.log("Missing required fields");
    return res.status(400).json({ error: 'Email, username, and password are required' });
  }

  try {
    // Check if email exists
    console.log(`Checking if email ${email} exists...`);
    const [users] = await db.query('SELECT email FROM users WHERE email = ?', [email]);
    if (users.length) {
      console.log("Email already exists");
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    console.log("Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = generateVerificationToken();
    const tokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Insert user
    console.log("Inserting new user...");
    await db.query(
      `INSERT INTO users (email, username, password, two_factor_token, two_factor_expires, email_verified)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [email, username, hashedPassword, verificationToken, tokenExpires, false]
    );

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    console.log("User registered successfully");
    res.status(201).json({ message: "User registered successfully. Please check your email for verification." });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Verify email
app.post('/api/verify-email', async (req, res) => {
  console.log("\nProcessing email verification...");
  const { email, code } = req.body;
  if (!email || !code) {
    console.log("Missing email or verification code");
    return res.status(400).json({ error: 'Email and verification code are required' });
  }

  try {
    console.log(`Verifying email ${email} with code ${code}...`);
    const [rows] = await db.query(
      `SELECT two_factor_token, two_factor_expires FROM users WHERE email = ? AND email_verified = 0`,
      [email]
    );
    if (!rows.length) {
      console.log("Invalid email or already verified");
      return res.status(400).json({ error: 'Invalid email or already verified' });
    }

    const { two_factor_token, two_factor_expires } = rows[0];
    if (!two_factor_token || !two_factor_expires) {
      console.log("No verification code found or code has expired");
      return res.status(400).json({ error: 'No verification code found or code has expired' });
    }

    if (new Date() > two_factor_expires) {
      console.log("Verification code has expired");
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    if (code !== two_factor_token) {
      console.log("Invalid verification code");
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    console.log("Updating user verification status...");
    await db.query(
      `UPDATE users SET email_verified = 1, two_factor_token = NULL, two_factor_expires = NULL WHERE email = ?`,
      [email]
    );
    console.log("Email verified successfully");
    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error("Email verification error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  console.log("\nProcessing login request...");
  const { email, password } = req.body;
  if (!email || !password) {
    console.log("Missing email or password");
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    console.log(`Authenticating user ${email}...`);
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!users.length) {
      console.log("User not found");
      return res.status(401).json({ error: 'User not found' });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log("Invalid credentials");
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.email_verified) {
      console.log("Email not verified");
      return res.status(403).json({ needsVerification: true, email });
    }

    // Generate JWT
    console.log("Generating JWT token...");
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      SECRET_KEY,
      { expiresIn: '24h' }
    );

    // Return user data (omit password)
    const userData = {
      username: user.username,
      email: user.email,
      favoriteGenre: user.favorite_genre,
      favoriteArtist: user.favorite_artist,
      bio: user.bio,
      avatar: user.avatar
    };

    console.log("Login successful");
    res.json({ message: 'Login successful', token, user: userData });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get user by email
app.post('/getUserByEmail', async (req, res) => {
  console.log("\nFetching user by email...");
  const { email } = req.body;
  try {
    console.log(`Looking up user with email: ${email}`);
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length) {
      console.log("User found");
      return res.json(users[0]);
    }
    console.log("No user found");
    res.json({});
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update user profile
app.post('/api/update', authenticateUser, upload.single('avatar'), async (req, res) => {
  console.log("\nUpdating user profile...");
  console.log("Request body:", req.body);
  console.log("Request file:", req.file);
  console.log("Authenticated user:", req.user);

  const { favoriteGenre, favoriteArtist, bio } = req.body;
  let avatar = req.file ? req.file.filename : undefined;

  try {
    // First get current user data
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [req.user.email]);
    if (!users.length) {
      console.log("User not found:", req.user.email);
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUser = users[0];
    console.log("Current user data:", currentUser);

    // Prepare update fields and values
    const updateFields = [];
    const queryParams = [];

    if (favoriteGenre !== undefined) {
      updateFields.push('favorite_genre = ?');
      queryParams.push(favoriteGenre);
    }
    if (favoriteArtist !== undefined) {
      updateFields.push('favorite_artist = ?');
      queryParams.push(favoriteArtist);
    }
    if (bio !== undefined) {
      updateFields.push('bio = ?');
      queryParams.push(bio);
    }
    if (avatar) {
      updateFields.push('avatar = ?');
      queryParams.push(avatar);
    }

    // If no fields to update, return success
    if (updateFields.length === 0) {
      console.log("No fields to update");
      return res.json({ 
        message: "No changes made",
        currentProfile: {
          favoriteGenre: currentUser.favorite_genre,
          favoriteArtist: currentUser.favorite_artist,
          bio: currentUser.bio,
          avatar: currentUser.avatar
        }
      });
    }

    // Add email to query params
    queryParams.push(req.user.email);

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE email = ?
    `;

    console.log("Update query:", updateQuery);
    console.log("Query parameters:", queryParams);

    const [result] = await db.query(updateQuery, queryParams);
    console.log("Update result:", result);

    if (result.affectedRows === 0) {
      console.log("No rows were updated");
      return res.status(500).json({ error: "Failed to update profile - no changes made" });
    }

    console.log("Profile updated successfully");
    res.json({ 
      message: "Profile updated successfully",
      updatedFields: {
        favoriteGenre: favoriteGenre || currentUser.favorite_genre,
        favoriteArtist: favoriteArtist || currentUser.favorite_artist,
        bio: bio || currentUser.bio,
        avatar: avatar || currentUser.avatar
      }
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Failed to update profile: " + err.message });
  }
});

// Get user profile
app.get('/api/profile', authenticateUser, async (req, res) => {
  console.log("\nFetching user profile...");
  try {
    console.log(`Looking up profile for user: ${req.user.email}`);
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [req.user.email]);
    if (!users.length) {
      console.log("User not found");
      return res.status(404).json({ error: 'User not found' });
    }
    const user = users[0];
    const avatarUrl = user.avatar ? `${process.env.API_URL || 'http://localhost:3000'}/uploads/${user.avatar}` : null;
    console.log("Profile fetched successfully");
    res.json({
      username: user.username,
      email: user.email,
      favoriteGenre: user.favorite_genre,
      favoriteArtist: user.favorite_artist,
      bio: user.bio,
      avatar: avatarUrl
    });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -------------------- SONGS ENDPOINTS --------------------

// Get all songs
app.get(['/api/songs', '/api/song'], async (req, res) => {
  console.log("\nFetching all songs...");
  try {
    const [rows] = await db.query(
      `SELECT track_id, track_name, artist_name, album_name, album_image, genres, rating FROM songs ORDER BY track_name`
    );
    console.log(`Found ${rows.length} songs`);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching songs:", err);
    res.status(500).json({ error: err.message });
  }
});

// Search songs
app.get('/api/songs/search/:query', async (req, res) => {
  console.log("\nSearching songs...");
  const query = req.params.query;
  if (!query || query.trim() === '') {
    console.log("Empty search query");
    return res.json([]);
  }
  if (query.length < 2) {
    console.log("Search query too short");
    return res.status(400).json({ error: "Search query must be at least 2 characters long" });
  }

  try {
    console.log(`Searching for: ${query}`);
    const searchPattern = `%${query.toLowerCase()}%`;
    const [rows] = await db.query(
      `SELECT track_id, track_name, artist_name, album_name, album_image, genres
       FROM songs
       WHERE LOWER(track_name) LIKE ? OR LOWER(artist_name) LIKE ? OR LOWER(album_name) LIKE ?
       ORDER BY track_name
       LIMIT 50`,
      [searchPattern, searchPattern, searchPattern]
    );
    console.log(`Found ${rows.length} matching songs`);
    res.json(rows);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get song details
app.get('/api/songs/details/:trackId', async (req, res) => {
  console.log("\nFetching song details...");
  const song_id = req.params.trackId;
  try {
    console.log(`Getting details for song ID: ${song_id}`);
    // Average rating
    const [[{ average_rating }]] = await db.query(
      `SELECT COALESCE(AVG(rating), 0) AS average_rating FROM ratings WHERE track_id = ?`,
      [song_id]
    );
    // Last 10 comments
    const [comments] = await db.query(
      `SELECT u.username, c.comment_text, c.created_at, COALESCE(r.rating, 0) as user_rating
       FROM comments c
       JOIN users u ON c.user_id = u.id
       LEFT JOIN ratings r ON c.user_id = r.user_id AND c.track_id = r.track_id
       WHERE c.track_id = ?
       ORDER BY c.created_at DESC
       LIMIT 10`,
      [song_id]
    );
    // Song info
    const [songs] = await db.query(
      `SELECT s.*, COUNT(DISTINCT r.user_id) as rating_count
       FROM songs s
       LEFT JOIN ratings r ON s.track_id = r.track_id
       WHERE s.track_id = ?
       GROUP BY s.track_id`,
      [song_id]
    );
    if (!songs.length) {
      console.log("Song not found");
      return res.status(404).json({ error: "Song not found" });
    }
    console.log("Song details fetched successfully");
    res.json({
      ...songs[0],
      average_rating: parseFloat(average_rating),
      comments
    });
  } catch (err) {
    console.error("Error fetching song details:", err);
    res.status(500).json({ error: "Failed to fetch song details" });
  }
});

// Get song by ID
app.get('/api/songs/:songId', async (req, res) => {
  console.log("\nFetching song by ID...");
  const track_id = req.params.songId;
  try {
    console.log(`Looking up song ID: ${track_id}`);
    const [songs] = await db.query(
      `SELECT track_id, track_name, artist_name, album_name, album_image, rating, audio_url FROM songs WHERE track_id = ?`,
      [track_id]
    );
    if (!songs.length) {
      console.log("Song not found");
      return res.status(404).json({ error: "Song not found" });
    }
    console.log("Song fetched successfully");
    res.json(songs[0]);
  } catch (err) {
    console.error("Error fetching song:", err);
    res.status(500).json({ error: "Failed to get song by ID" });
  }
});

// Add review
app.post('/api/songs/review', authenticateUser, async (req, res) => {
  console.log("\nProcessing review submission...");
  const { userId, trackId, rating, comment } = req.body;
  if (!userId || !trackId || rating == null) {
    console.log("Missing required fields");
    return res.status(400).json({ error: "Email, trackId, and rating are required" });
  }

  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    console.log("Invalid rating value");
    return res.status(400).json({ error: "Rating must be a number between 1 and 5" });
  }

  try {
    // Get user ID
    console.log(`Looking up user ID for email: ${userId}`);
    const [users] = await db.query('SELECT id FROM users WHERE email = ?', [userId]);
    if (!users.length) {
      console.log("User not found");
      return res.status(404).json({ error: `No user found with email: ${userId}` });
    }
    const user_id = users[0].id;

    // Add or update rating
    console.log("Adding/updating rating...");
    await db.query(
      `INSERT INTO ratings (user_id, track_id, rating)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating)`,
      [user_id, trackId, rating]
    );

    // Add comment if provided
    if (comment && comment.trim()) {
      console.log("Adding comment...");
      await db.query(
        `INSERT INTO comments (user_id, track_id, comment_text) VALUES (?, ?, ?)`,
        [user_id, trackId, comment]
      );
    }

    console.log("Review added successfully");
    res.json({ message: "Review added successfully" });
  } catch (err) {
    console.error("Error adding review:", err);
    res.status(500).json({ error: "Failed to add review" });
  }
});

// Add comment
app.post('/api/songs/comment', authenticateUser, async (req, res) => {
  console.log("\nProcessing comment submission...");
  const { userId, trackId, comment } = req.body;
  if (!userId || !trackId || !comment || !comment.trim()) {
    console.log("Missing required fields");
    return res.status(400).json({ error: "Email, trackId, and comment are required" });
  }

  try {
    console.log(`Looking up user ID for email: ${userId}`);
    const [users] = await db.query('SELECT id FROM users WHERE email = ?', [userId]);
    if (!users.length) {
      console.log("User not found");
      return res.status(404).json({ error: `No user found with email: ${userId}` });
    }
    const user_id = users[0].id;

    console.log("Adding comment...");
    await db.query(
      `INSERT INTO comments (user_id, track_id, comment_text) VALUES (?, ?, ?)`,
      [user_id, trackId, comment]
    );
    console.log("Comment added successfully");
    res.json({ message: "Comment added successfully" });
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// Like a song
app.post('/api/songs/like', authenticateUser, async (req, res) => {
  console.log("\nProcessing song like...");
  const email = req.user.email;
  const { songId } = req.body;
  if (!email || !songId) {
    console.log("Missing required fields");
    return res.status(400).json({ error: "Email and songId are required" });
  }

  try {
    console.log(`Looking up user ID for email: ${email}`);
    const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (!users.length) {
      console.log("User not found");
      return res.status(404).json({ error: "No user found with that email" });
    }
    const user_id = users[0].id;

    console.log("Adding song to liked list...");
    await db.query(
      `INSERT INTO liked_songs (user_id, track_id) VALUES (?, ?)`,
      [user_id, songId]
    );
    console.log("Song added to liked list successfully");
    res.json({ message: "Song added to liked list successfully" });
  } catch (err) {
    console.error("Error adding to liked list:", err);
    res.status(500).json({ error: "Failed to add to liked list" });
  }
});

// Get liked songs
app.post('/api/songs/liked', authenticateUser, async (req, res) => {
  console.log("\nFetching liked songs...");
  const email = req.user.email;
  try {
    console.log(`Looking up user ID for email: ${email}`);
    const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (!users.length) {
      console.log("User not found");
      return res.json([]);
    }
    const user_id = users[0].id;

    console.log("Fetching liked songs...");
    const [rows] = await db.query(
      `SELECT s.track_id, s.track_name, s.artist_name, s.album_name, s.album_image, s.audio_url, COALESCE(r.rating, 0) AS rating
       FROM songs s
       INNER JOIN liked_songs ls ON s.track_id = ls.track_id
       LEFT JOIN ratings r ON s.track_id = r.track_id AND r.user_id = ?
       WHERE ls.user_id = ?`,
      [user_id, user_id]
    );
    console.log(`Found ${rows.length} liked songs`);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching liked songs:", err);
    res.status(500).json({ error: "Failed to fetch liked songs" });
  }
});

// -------------------- ADMIN ENDPOINTS --------------------

// Admin login
app.post('/api/admin/login', async (req, res) => {
  console.log("\nProcessing admin login...");
  const { email, password } = req.body;
  if (!email || !password) {
    console.log("Missing email or password");
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    console.log(`Authenticating admin: ${email}`);
    const [admins] = await db.query('SELECT id, email, password FROM Admin WHERE email = ?', [email]);
    if (!admins.length) {
      console.log("Admin not found");
      return res.status(404).json({ error: "Admin not found" });
    }

    const admin = admins[0];
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      console.log("Invalid password");
      return res.status(401).json({ error: "Invalid password" });
    }

    console.log("Generating admin token...");
    const token = generateAdminToken(admin.id, admin.email);
    console.log("Admin login successful");
    res.json({
      message: "Login successful",
      token,
      admin: { id: admin.id, email: admin.email }
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ error: "Failed to fetch admin" });
  }
});

// Admin verify token
app.get('/api/admin/verify', verifyAdminToken, (req, res) => {
  console.log("\nVerifying admin token...");
  console.log("Token verified successfully");
  res.json({ message: 'Valid token', admin: req.admin });
});

// Get monitored users
app.get('/api/getMonitoredUsers', verifyAdminToken, async (req, res) => {
  console.log("\nFetching monitored users...");
  try {
    const [rows] = await db.query('SELECT * FROM monitored_users');
    console.log(`Found ${rows.length} monitored users`);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching monitored users:", err);
    res.status(500).json({ error: "Failed to fetch monitored users" });
  }
});

// Delete song
app.delete('/api/songs/delete/:song_id', verifyAdminToken, async (req, res) => {
  console.log("\nProcessing song deletion...");
  const song_id = req.params.song_id;
  try {
    // Check if song exists
    console.log(`Checking if song ${song_id} exists...`);
    const [songs] = await db.query('SELECT track_id FROM songs WHERE track_id = ?', [song_id]);
    if (!songs.length) {
      console.log("Song not found");
      return res.status(404).json({ error: "Song not found" });
    }

    // Delete related records
    console.log("Deleting related records...");
    await db.query('DELETE FROM comments WHERE track_id = ?', [song_id]);
    await db.query('DELETE FROM ratings WHERE track_id = ?', [song_id]);
    await db.query('DELETE FROM liked_songs WHERE track_id = ?', [song_id]);
    await db.query('DELETE FROM songs WHERE track_id = ?', [song_id]);

    console.log("Song deleted successfully");
    res.json({ message: "Song deleted successfully" });
  } catch (err) {
    console.error("Error deleting song:", err);
    res.status(500).json({ error: err.message });
  }
});

// Add song
app.post('/api/songs/add', verifyAdminToken, async (req, res) => {
  console.log("\nProcessing song addition...");
  const { trackName, artistName, albumName, albumImage, rating, genres, audioUrl } = req.body;
  try {
    console.log("Adding new song to database...");
    await db.query(
      `INSERT INTO songs (track_name, artist_name, album_name, album_image, rating, genres, audio_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [trackName, artistName, albumName, albumImage, rating, genres, audioUrl]
    );
    console.log("Song added successfully");
    res.json({ message: "Song added successfully" });
  } catch (err) {
    console.error("Error adding song:", err);
    res.status(500).json({ error: "Failed to add song" });
  }
});

// Update song
app.put('/api/songs/update/:song_id', verifyAdminToken, async (req, res) => {
  console.log("\nProcessing song update...");
  const song_id = req.params.song_id;
  const { title, artist, album, genre, year } = req.body;
  if (!title || !artist || !album || !genre || !year) {
    console.log("Missing required fields");
    return res.status(400).json({ error: "Missing required field" });
  }

  try {
    console.log(`Updating song ${song_id}...`);
    const [result] = await db.query(
      `UPDATE songs SET track_name = ?, artist_name = ?, album_name = ?, genres = ?, release_year = ? WHERE track_id = ?`,
      [title, artist, album, genre, year, song_id]
    );
    if (result.affectedRows === 0) {
      console.log("Song not found");
      return res.status(404).json({ error: "Song not found" });
    }
    console.log("Song updated successfully");
    res.json({ message: "Song updated successfully" });
  } catch (err) {
    console.error("Error updating song:", err);
    res.status(500).json({ error: err.message });
  }
});

// Most common genre by rating
app.get('/api/mostCommonGenre/:rating', async (req, res) => {
  console.log("\nFetching most common genre...");
  const rating = parseInt(req.params.rating, 10);
  let query = '';
  if (rating === 1) {
    query = `SELECT genres, COUNT(*) as count FROM songs WHERE rating <= 2 AND genres IS NOT NULL AND genres != '' GROUP BY genres ORDER BY count DESC LIMIT 1`;
  } else if (rating === 2) {
    query = `SELECT genres, COUNT(*) as count FROM songs WHERE rating = 3 AND genres IS NOT NULL AND genres != '' GROUP BY genres ORDER BY count DESC LIMIT 1`;
  } else if (rating === 3) {
    query = `SELECT genres, COUNT(*) as count FROM songs WHERE rating >= 4 AND genres IS NOT NULL AND genres != '' GROUP BY genres ORDER BY count DESC LIMIT 1`;
  } else {
    console.log("Invalid rating range");
    return res.status(400).json({ error: "Invalid rating range" });
  }
  try {
    console.log(`Executing query for rating ${rating}...`);
    const [rows] = await db.query(query);
    if (rows.length) {
      console.log(`Found most common genre: ${rows[0].genres}`);
      return res.json({ most_common_genre: rows[0].genres });
    }
    console.log("No genres found");
    res.json({ most_common_genre: "none" });
  } catch (err) {
    console.error("Error fetching most common genre:", err);
    res.status(500).json({ error: "Failed to fetch most common genre" });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  console.log("\nHealth check requested");
  res.status(200).json({ status: 'ok' });
});

// Fallback: serve frontend
app.get('*', (req, res) => {
  console.log("\nServing frontend...");
  const indexPath = path.join(staticPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    console.log("Serving index.html");
    res.sendFile(indexPath);
  } else {
    console.log("Frontend files not found");
    res.status(404).send('Frontend files not found. Make sure to build the frontend first.');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\nServer running on port ${PORT}`);
  console.log("Environment:", process.env.NODE_ENV || 'development');
  console.log("Database:", parsedUrl.hostname);
  console.log("Email:", process.env.GMAIL_USER);
}); 