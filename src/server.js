const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const index = fs.readFileSync(`${__dirname}/../client/client.html`);

const onRequest = (request, response) => {
    response.writeHead(200, { 'ContentType': 'text/html' });
    response.write(index);
    response.end();
};

const app = http.createServer(onRequest).listen(port);

console.log(`Listening on 127.0.0.1: ${port}`)

const io = socketio(app);

const users =[];

const onJoined = (sock) => {
    const socket = sock;
    
    socket.on('join', (data) =>{
    const joinMsg = { 
    name: 'server',
    msg: `There are ${Object.keys(users).length} users online`
    };
    
    socket.name = data.name;
    users.push(socket);
    socket.emit('msg', joinMsg);
    socket.join('room1');
    
    const response = {
        name: 'server',
        msg: `${data.name} has joined the room`
    };
    socket.broadcast.to('room1').emit('msg', response);
    
    console.log(`${data.name} joined`);
    
    socket.emit('msg', {name: 'server', msg:'You joined the room'});
});
};

const onMsg = (sock) => {
    const socket = sock;
    socket.on('msgToServer', (data) => {
        io.sockets.in('room1').emit('msg', { name: socket.name, msg: data});
    });
    socket.on('meMsgToServer', (data) => {
        io.sockets.in('room1').emit('meMsg', { name: socket.name, msg: data});
    });
    socket.on('rollMsgToServer', (data) => {
        let num = Math.floor((Math.random()*6)+1);
        io.sockets.in('room1').emit('rollMsg', { name: socket.name, msg: num});
    });
    socket.on('coinMsgToServer', (data) => {
        let num = Math.random();
        let coin = "tails";
        if(num >= 0.5){
            coin = "heads";
        }
        io.sockets.in('room1').emit('coinMsg', { name: socket.name, msg: coin});
    });
};

const onDisconnect = (sock) => {
    const socket = sock;
    socket.on('disconnect', (data) =>{
        const exitMsg = { 
        name: 'server',
        msg: `${socket.name} has left the room`
        };
    socket.broadcast.to('room1').emit('msg', exitMsg);
    console.log(`${socket.name} disconnected`);
    users.splice(users.indexOf(socket), 1);
    socket.emit('msg', exitMsg);
    });
};

io.sockets.on('connection', (socket) => {
    console.log('started');
    onJoined(socket);
    onMsg(socket);
    onDisconnect(socket);
});

console.log('Websocket server started');
