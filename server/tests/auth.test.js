const request = require('supertest');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const MongoStore = require('connect-mongo');
require('dotenv').config({ path: __dirname + '/../.env' });

// Import routes to be tested
const authRoutes = require('../routes/auth');

// Setup express app for testing
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'test secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
}));
app.use(passport.initialize());
app.use(passport.session());
require('../config/passport')(passport);

app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
    it('should return 401 for failed login', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'wrong@example.com',
                password: 'wrongpassword'
            });
        expect(res.statusCode).toEqual(401);
    });
});
