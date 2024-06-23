const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const rooms = {};

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('create_room', (roomId) => {
        if (!rooms[roomId]) {
            rooms[roomId] = {
                admin: socket.id,
                users: [],
                votes: {},
                lastActivity: Date.now()
            };
            socket.join(roomId);
            console.log(`Room ${roomId} created by ${socket.id}`);
            io.to(socket.id).emit('room_created', { roomId, admin: true });
        } else {
            io.to(socket.id).emit('error', 'Room already exists');
        }
    });

    socket.on('join_room', (roomId) => {
        if (rooms[roomId]) {
            rooms[roomId].users.push(socket.id);
            socket.join(roomId);
            rooms[roomId].lastActivity = Date.now();
            console.log(`User ${socket.id} joined room ${roomId}`);
            io.to(socket.id).emit('room_joined', { roomId, admin: false });
        } else {
            io.to(socket.id).emit('error', 'Room does not exist');
        }
    });

    socket.on('vote', ({ roomId, vote }) => {
        if (rooms[roomId]) {
            rooms[roomId].votes[socket.id] = vote;
            rooms[roomId].lastActivity = Date.now();
            console.log(`User ${socket.id} voted ${vote} in room ${roomId}`);
            const votes = Object.values(rooms[roomId].votes);
            const avgVote = votes.reduce((a, b) => a + b, 0) / votes.length;
            io.to(roomId).emit('vote_update', { votes: rooms[roomId].votes, avgVote });
        } else {
            io.to(socket.id).emit('error', 'Room does not exist');
        }
    });

    socket.on('reset_votes', (roomId) => {
        if (rooms[roomId] && rooms[roomId].admin === socket.id) {
            rooms[roomId].votes = {};
            rooms[roomId].lastActivity = Date.now();
            io.to(roomId).emit('votes_reset');
            console.log(`Votes reset in room ${roomId}`);
        } else {
            io.to(socket.id).emit('error', 'Only admin can reset votes or room does not exist');
        }
    });

    socket.on('kick_user', ({ roomId, userId }) => {
        if (rooms[roomId] && rooms[roomId].admin === socket.id) {
            const index = rooms[roomId].users.indexOf(userId);
            if (index !== -1) {
                rooms[roomId].users.splice(index, 1);
                io.to(userId).emit('kicked');
                socket.to(userId).disconnect();
                console.log(`User ${userId} kicked from room ${roomId}`);
            }
        } else {
            io.to(socket.id).emit('error', 'Only admin can kick users or room does not exist');
        }
    });

    socket.on('close_room', (roomId) => {
        if (rooms[roomId] && rooms[roomId].admin === socket.id) {
            delete rooms[roomId];
            io.to(roomId).emit('room_closed');
            io.in(roomId).socketsLeave(roomId);
            console.log(`Room ${roomId} closed by admin`);
        } else {
            io.to(socket.id).emit('error', 'Only admin can close room or room does not exist');
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        for (const roomId in rooms) {
            if (rooms[roomId].admin === socket.id) {
                delete rooms[roomId];
                io.to(roomId).emit('room_closed');
                io.in(roomId).socketsLeave(roomId);
                console.log(`Room ${roomId} closed due to admin disconnect`);
            } else {
                const index = rooms[roomId].users.indexOf(socket.id);
                if (index !== -1) {
                    rooms[roomId].users.splice(index, 1);
                    delete rooms[roomId].votes[socket.id];
                    const votes = Object.values(rooms[roomId].votes);
                    const avgVote = votes.reduce((a, b) => a + b, 0) / votes.length;
                    io.to(roomId).emit('vote_update', { votes: rooms[roomId].votes, avgVote });
                }
            }
        }
    });

    setInterval(() => {
        const now = Date.now();
        for (const roomId in rooms) {
            if (now - rooms[roomId].lastActivity > 10 * 60 * 1000) { // 10 minutes inactivity
                delete rooms[roomId];
                io.to(roomId).emit('room_closed');
                io.in(roomId).socketsLeave(roomId);
                console.log(`Room ${roomId} closed due to inactivity`);
            }
        }
    }, 60 * 1000); // check every minute
});

server.listen(3000, () => {
    console.log('Listening on port 3000');
});
