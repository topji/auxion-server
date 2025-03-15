const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
require('dotenv').config();
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors());

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Define Verification Schema
const verificationSchema = new mongoose.Schema({
  username: { type: String, required: true },
  walletAddress: { type: String, required: true },
  identityProofPath: { type: String, required: true },
  country: { type: String, required: true },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const Verification = mongoose.model('Verification', verificationSchema);

// POST endpoint for verification request
app.post('/verificationRequest', upload.single('identityProof'), async (req, res) => {
  try {
    const { username, walletAddress, country } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Identity proof file is required' });
    }

    const verification = new Verification({
      username,
      walletAddress,
      identityProofPath: req.file.path,
      country
    });

    await verification.save();
    
    res.status(201).json({
      message: 'Verification request submitted successfully',
      verificationId: verification._id
    });
  } catch (error) {
    res.status(500).json({ error: 'Error processing verification request' });
  }
});

// GET endpoint for verification status
app.get('/verificationSent/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const verification = await Verification.findOne({ walletAddress }).sort({ createdAt: -1 });
    
    // Simply return true if verification exists, false otherwise
    res.json({
      verified: verification !== null
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching verification status' });
  }
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: "ok" });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
