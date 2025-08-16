const http = require('http');
const { Server } = require('socket.io');
const { app, sessionMiddleware } = require('./app');
const connectDB = require('./config/db');
const passport = require('passport');
const chatHandler = require('./socket/chatHandler');

// Conectar a la base de datos
connectDB();

const PORT = process.env.PORT || 3003;

const server = http.createServer(app);
const io = new Server(server);

// Wrap Express middleware for Socket.IO
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

io.use(wrap(sessionMiddleware));
io.use(wrap(passport.initialize()));
io.use(wrap(passport.session()));

// Custom middleware to check for user
io.use((socket, next) => {
    if (socket.request.user) {
        next();
    } else {
        next(new Error('unauthorized'));
    }
});

// Initialize chat handler
chatHandler(io);

server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = server; // Export for testing purposes
