const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });

beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
    await mongoose.connection.close();
});
