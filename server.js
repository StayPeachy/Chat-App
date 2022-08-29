const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const formatMessage = require('./utils/messages')
// const createAdapter = require('./@socket.io/redis-adapter').createAdapter;
// const redis = require('redis')
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users')

const app = express();
const server = http.createServer(app)
const io = socketio(server)

app.use(express.static(path.join(__dirname, 'public')))

const botName = 'ChatCord bot'

// (async () =>{
//     pubClinet = redis.createClient({url: "redis://127.0.0.1:6379"});
//     await pubClient.connect()
//     subClient = pubClient.duplicate();
//     io.adapter(createAdapter(pubClient, subClient))
// })();

// * Run when client connects
io.on('connection', socket => {
    console.log('New WS Connection...');

    socket.on('joinRoom', ({ username,room }) => {

        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        // * Welcome a user to the chat
        socket.emit('message', formatMessage(botName, 'Welcome to ChatCord'))

        // ? Broadcast when a user connects
     socket.broadcast.to(user.room).emit('message', formatMessage(botName,`${user.username} has joined the chat!`))

     // * send users and room info
     io.to(user.room).emit('roomUsers', {
        room: user.room, 
        users:getRoomUsers(user.room)
     })

    })

    // ? Runs when user disconnects
    socket.on('disconnect', () => {

        const user = userLeave(socket.id)
        if(user){
            io.emit('message', formatMessage(botName, `A ${user.username} has left the chat`))
        }


    })

    // ? Listen for Chat Message
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id)
        io.to(user.room).emit("message", formatMessage(user.username, msg))
    })
})


const PORT = 3000 || process.env.PORT;

server.listen(PORT,() => console.log('Server running on ${PORT}'))