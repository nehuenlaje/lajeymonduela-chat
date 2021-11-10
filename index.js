const express = require('express');
const mongoose = require('mongoose');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

let usersConnected = 0;

const port = process.env.PORT || 3000;
const db = 'mongodb://localhost/lajeymonduela_chat'
mongoose.connect(db);
const MessageSchema = new mongoose.Schema({
  nick: String, text: String
});
const Message = mongoose.model('Message', MessageSchema);
app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('a user connected');
  usersConnected += 1;
  console.log('usuarios conectados: ' + usersConnected);
  socket.on('chat message', (msg) => {
    // DEBUG: console.log(msg);
    const message = new Message(msg);
    socket.broadcast.emit('chat message', msg);
    message.save((err, msg) => console.log(msg));
  });
  socket.on('disconnect', () => {
    console.log('user disconnected');
    usersConnected -= 1;
    console.log('usuarios conectados: ' + usersConnected);
  });
});

http.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
