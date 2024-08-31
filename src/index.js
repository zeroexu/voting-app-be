const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const rooms = {};

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('create_room', ({ roomId, maxParticipants, name }) => {
        if (!rooms[roomId]) {
            rooms[roomId] = {
                admin: socket.id,
                participants: {},
                maxParticipants: maxParticipants,
                votes: {},
                lastActivity: Date.now()
            };
            rooms[roomId].participants[socket.id] = { name: 'Admin', vote: null };
            socket.join(roomId);
            socket.emit('room_created', { roomId, adminId: rooms[roomId].admin });
            console.log(`Room ${roomId} created with admin ${socket.id}`);
        } else {
            socket.emit('error', 'Room already exists');
        }
    });

    socket.on('join_room', ({ name, roomId }) => {
        if (rooms[roomId]) {
            const room = rooms[roomId];
            if (Object.keys(room.participants).length < room.maxParticipants) {
                room.participants[socket.id] = { name: name, vote: null };
                socket.join(roomId);
                socket.emit('room_joined', { roomId, adminId: rooms[roomId].admin });
                io.to(roomId).emit('user_joined', { userId: socket.id, name: name });
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
            if (typeof vote === 'number' && [1, 2, 3, 5, 8, 13, 21].includes(vote)) {
                room.participants[socket.id].vote = vote;
                room.votes[socket.id] = vote;
                room.lastActivity = Date.now();

                const votesArray = Object.values(room.votes);
                const avgVote = votesArray.reduce((a, b) => a + b, 0) / votesArray.length;

                io.to(roomId).emit('vote_update', { votes: room.votes, averageVote: avgVote});
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
            for (const participantId in rooms[roomId].participants) {
                rooms[roomId].participants[participantId].vote = null;
            }
            rooms[roomId].lastActivity = Date.now();
            io.to(roomId).emit('votes_reset');
            console.log(`Votes reset in room ${roomId}`);
        } else {
            socket.emit('error', 'Only admin can reset votes or room does not exist');
        }
    });

    socket.on('close_room', ({ roomId }) => { 
        if (rooms[roomId] && rooms[roomId].admin === socket.id) {
            io.to(roomId).emit('room_closed');
            for (const participantId in rooms[roomId].participants) {
                io.sockets.sockets.get(participantId)?.leave(roomId);
            }
            delete rooms[roomId];
            console.log(`Room ${roomId} closed by admin`);
        } else {
            socket.emit('error', 'Only admin can close the room or room does not exist');
        }
    });

    socket.on('exit_room', ({ roomId }) => {
        const userId = socket.id;
        if (!rooms[roomId]) {
            socket.emit('error', 'The room does not exist');
            return;
        }
        const room = rooms[roomId];
        const isAdmin = room.admin === userId;
        delete room.participants[userId];
        delete room.votes[userId];
        io.sockets.sockets.get(userId)?.leave(roomId);
        if (isAdmin) {
            io.to(roomId).emit('room_closed', 'Room closed by the admin');
            for (const participantId in room.participants) {
                io.sockets.sockets.get(participantId)?.leave(roomId);
            }
            delete rooms[roomId];
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
    console.log(`Listening on port 3000`);
});
