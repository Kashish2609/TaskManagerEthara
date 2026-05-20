const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect Database
connectDB();

const app = express();

/* =========================
   Middleware
========================= */

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'https://task-manager-ethara-black.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {

      // Allow requests with no origin
      // (Postman, mobile apps, curl)
      if (!origin) {
        return callback(null, true);
      }

      // Allow all during development
      if (
        process.env.NODE_ENV !== 'production' ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error('Blocked by CORS policy'));
    },

    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* =========================
   API Routes
========================= */

app.use('/api/auth', require('./routers/authRoutes'));
app.use('/api/projects', require('./routers/projectRoutes'));
app.use('/api/tasks', require('./routers/taskRoutes'));

/* =========================
   Health Check Route
========================= */

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date()
  });
});

/* =========================
   Production Frontend
========================= */

if (process.env.NODE_ENV === 'production') {

  // Static folder
  app.use(
    express.static(
      path.join(__dirname, '../client/dist')
    )
  );

  // IMPORTANT:
  // Catch-all route for client-side routing in production
  app.get('/:path(.*)', (req, res) => {
    res.sendFile(
      path.resolve(
        __dirname,
        '..',
        'client',
        'dist',
        'index.html'
      )
    );
  });

} else {

  // Development Route
  app.get('/', (req, res) => {
    res.send('API is running in development mode...');
  });

}

/* =========================
   Global Error Handler
========================= */

app.use((err, req, res, next) => {

  console.error(err);

  const statusCode =
    res.statusCode && res.statusCode !== 200
      ? res.statusCode
      : 500;

  res.status(statusCode).json({
    success: false,
    message:
      err.message || 'Internal Server Error',

    stack:
      process.env.NODE_ENV === 'production'
        ? null
        : err.stack
  });

});

/* =========================
   Start Server
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

  console.log(
    `Server running in ${
      process.env.NODE_ENV || 'development'
    } mode on port ${PORT}`
  );

});