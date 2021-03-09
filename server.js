const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const formatMessage = require('./utils/messages')
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)


//Setting static dir
app.use(express.static(path.join(__dirname, 'public')))

//Run when client connects
io.on('connection', socket => {
    const botName = 'Chattest bot'

    //JOINING  room
    socket.on('joinRoom', ({username, room}) => {
        const user = userJoin(socket.id, username, room)
        socket.join(user.room)

        //Welcome current user
        socket.emit('message', formatMessage(botName, 'Welcome to WS!'))

        //Broadcast when a user connects
        socket.broadcast.to(user.room)
        .emit('message',
         formatMessage(botName, `${user.username} has joined the chat!`
         ))

        //Send users and room info (sidebar)
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })
    })

    // Listen for chatMessage
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id)
        io.to(user.room).emit('message', formatMessage(user.username, msg))
    })

    //DISCONNECTING from chat
    socket.on('disconnect', () => {
        const user = userLeave(socket.id)
        if (user) {
        io.to(user.room)
        .emit('message',
        formatMessage(botName, `${user.username} has disconnected from the chat!`
        ))

        //Send users and room info (sidebar)
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })
        }
    })
})

const PORT = 9999 || process.env.PORT
server.listen(PORT, () => console.log(`Server is running on port: ${PORT}`))