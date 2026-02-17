const express = require('express');
const cors = require('cors');
require('dotenv').config();

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// Security Middleware
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Standard Middleware
app.use(cors());
app.use(express.json());

// Routes (Placeholder for now)
app.get('/', (req, res) => {
  res.send('Memorix API is running');
});

// Import Routes
const ingestRoutes = require('./routes/ingest');
const chatRoutes = require('./routes/chat');
const decisionRoutes = require('./routes/decisions');
const dashboardRoutes = require('./routes/dashboard');
const documentsRoutes = require('./routes/documents');
const rolesRoutes = require('./routes/roles');

// Mount Routes
app.use('/api/ingest', ingestRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/decisions', decisionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/roles', rolesRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
