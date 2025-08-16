module.exports = {
    testEnvironment: 'node',
    testTimeout: 10000, // 10 second timeout
    setupFilesAfterEnv: ['./tests/setup.js'] // Optional: for global setup like DB connection
};
