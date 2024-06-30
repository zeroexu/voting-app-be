const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./helper/config/server');
const app = config(express());
const server = http.createServer(app);
const io = socketIo(server);
const Environment = require('./helper/config/environment');

const rooms = {};

io.use((socket, next) => {
    const eventName = socket.eventName;
    if (eventName === 'create_room' || eventName === 'join_room') {
        return next();
    }

    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error'));
    }

    jwt.verify(token, Environment.JWT_SECRET_KEY, (err, decoded) => {
        if (err) {
            return next(new Error('Authentication error'));
        }
        socket.user = decoded;
        next();
    });
});

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('create_room', ({ roomId, maxParticipants, name }) => {
        if (!rooms[roomId]) {
            const adminPayload = { name, roomId };
            const token = jwt.sign(adminPayload, JWT_SECRET, { expiresIn: '1h' });
            rooms[roomId] = {
                admin: socket.id,
                participants: {},
                maxParticipants: maxParticipants,
                votes: {},
                lastActivity: Date.now()
            };
            rooms[roomId].participants[socket.id] = { name: 'Admin', vote: null };
            socket.join(roomId);
            socket.emit('room_created', { roomId, admin: true, token });
            console.log(`Room ${roomId} created with admin ${socket.id}`);
        } else {
            socket.emit('error', 'Room already exists');
        }
    });

    socket.on('join_room', ({ roomId, name }) => {
        if (rooms[roomId]) {
            const room = rooms[roomId];
            const participantPayload = { name, roomId };
            const token = jwt.sign(participantPayload, JWT_SECRET, { expiresIn: '1h' });
            if (Object.keys(room.participants).length < room.maxParticipants) {
                room.participants[socket.id] = { name: name, vote: null };
                socket.join(roomId);
                socket.emit('room_joined', { roomId, admin: false });
                io.to(roomId).emit('user_joined', { userId: socket.id, name: name, token });
                console.log(`${name} joined room ${roomId}`);
            } else {
                socket.emit('error', 'Room is full');
            }
        } else {
            socket.emit('error', 'Room does not exist');
        }
    });

    socket.on('vote', ({ roomId, vote }) => {
        if (rooms[roomId] && rooms[roomId].participants[socket.id]) {
            const room = rooms[roomId];
            if (typeof vote === 'number' && vote >= 0) {
                room.participants[socket.id].vote = vote;
                room.votes[socket.id] = vote;
                room.lastActivity = Date.now();

                const votesArray = Object.values(room.votes);
                const avgVote = votesArray.reduce((a, b) => a + b, 0) / votesArray.length;

                io.to(roomId).emit('vote_update', { votes: room.votes, avgVote });
                console.log(`Vote recorded in room ${roomId}: ${vote}`);
            } else {
                socket.emit('error', 'Invalid vote');
            }
        } else {
            socket.emit('error', 'You must join the room to vote');
        }
    });

    socket.on('reset_votes', ({ roomId }) => { 
        if (rooms[roomId] && rooms[roomId].admin === socket.id) {
            rooms[roomId].votes = {};
            for (const participant in rooms[roomId].participants) {
                rooms[roomId].participants[participant].vote = null;
            }
            rooms[roomId].lastActivity = Date.now();
            io.to(roomId).emit('votes_reset');
            console.log(`Votes reset in room ${roomId}`);
        } else {
            socket.emit('error', 'Only admin can reset votes or room does not exist');
        }
    });

    socket.on('kick_user', ({ roomId, userId }) => {
        if (rooms[roomId] && rooms[roomId].admin === socket.id) {
            if (rooms[roomId].participants[userId]) {
                delete rooms[roomId].participants[userId];
                delete rooms[roomId].votes[userId];
                io.to(userId).emit('kicked');
                io.sockets.sockets.get(userId).leave(roomId);
                console.log(`User ${userId} kicked from room ${roomId}`);
            } else {
                socket.emit('error', 'User not found in room');
            }
        } else {
            socket.emit('error', 'Only admin can kick users or room does not exist');
        }
    });

    socket.on('close_room', ({ roomId }) => { 
        if (rooms[roomId] && rooms[roomId].admin === socket.id) {
            io.to(roomId).emit('room_closed');
            for (const userId in rooms[roomId].participants) {
                io.sockets.sockets.get(userId).leave(roomId);
            }
            delete rooms[roomId];
            console.log(`Room ${roomId} closed by admin`);
        } else {
            socket.emit('error', 'Only admin can close the room or room does not exist');
        }
    });

    socket.on('exit_room', ({ roomId, userId }) => {
        if (!rooms[roomId]) {
            socket.emit('error', 'The room does not exist');
            return;
        }
        const room = rooms[roomId];
        const isAdmin = room.admin === userId;

        io.sockets.sockets.get(userId)?.leave(roomId);
        if (isAdmin) {
            // Usar Socket.IO para notificar a todos los usuarios en el cuarto
            io.to(roomId).emit('room_closed', 'El cuarto ha sido cerrado por el admin');
            for (const userId in room.participants) {
                io.sockets.sockets.get(userId).leave(roomId);
            }
            // Eliminar el cuarto
            delete rooms[roomId];
        }
    });

    /* socket.on('disconnect', () => {
        for (const roomId in rooms) {
            const room = rooms[roomId];
            if (room.participants[socket.id]) {
                delete room.participants[socket.id];
                delete room.votes[socket.id];
                io.to(roomId).emit('user_left', { userId: socket.id });
                console.log(`User ${socket.id} left room ${roomId}`);
                if (socket.id === room.admin) {
                    io.to(roomId).emit('error', 'Room closed due to admin leaving');
                    for (const userId in room.participants) {
                        io.sockets.sockets.get(userId).leave(roomId);
                    }
                    delete rooms[roomId];
                    console.log(`Room ${roomId} closed because admin left`);
                }
            }
        }
    }); */

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

server.listen(Environment.PORT, () => {
    console.log(`'Listening on port ${Environment.PORT}`);
});
