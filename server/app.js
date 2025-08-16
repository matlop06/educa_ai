const express = require('express');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
require('dotenv').config();
const { setupMailService } = require('./services/mailService');

const app = express();

// CORS Configuration
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
if (process.env.NODE_ENV === 'production' && process.env.PROD_URL) {
  allowedOrigins.push(process.env.PROD_URL);
}

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Passport config
require('./config/passport')(passport);

// Setup Mail Service
setupMailService();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
});

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/institutions', require('./routes/institutions'));
app.use('/api/invitations', require('./routes/invitations'));
app.use('/api/users', require('./routes/users'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/assistants', require('./routes/assistants'));
app.use('/api/student', require('./routes/student'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/evaluations', require('./routes/evaluations'));

// In production, serve static files from the React app
if (process.env.NODE_ENV === 'production') {
    const publicPath = path.join(__dirname, 'public');
    console.log(`Serving static files from: ${publicPath}`);

    app.use(express.static(publicPath));

    // The "catchall" handler: for any request that doesn't
    // match one above, send back React's index.html file.
    app.get('*', (req, res) => {
        res.sendFile(path.join(publicPath, 'index.html'));
    });
}

// --- API de Usuario ---
const { ensureAuth } = require('./middleware/auth');
app.get('/api/users/current', ensureAuth, (req, res) => {
    res.json({
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        institution: req.user.institution
    });
});

module.exports = { app, sessionMiddleware };
