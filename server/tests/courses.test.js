const request = require('supertest');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const MongoStore = require('connect-mongo');
require('dotenv').config({ path: __dirname + '/../.env' });

const app = require('../app'); // Import the refactored app

// We will not mock the middleware anymore, we will handle auth in each test
// jest.mock('../middleware/auth');

describe('Course Routes', () => {
    it('should return 200 for public route', async () => {
        const res = await request(app).get('/api/courses');
        expect(res.statusCode).toEqual(200);
    });
});
