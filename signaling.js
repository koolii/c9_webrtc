
var http = require('http');
var path = require('path');
var express = require('express');
var router = express();
var socketio = require('socket.io');
var server = http.createServer(router);

var port = 9001;
var io = socketio.listen(server);

console.log((new Date()) + " Server is listening on port " + port);

var connections = [];

var deleteConnection = function (socketId) {
  for (var i = 0, len = connections.length; i < len; i++) {
    if (connections[i] == socketId) {
      delete connections[i];
      
      console.log("delete socket. Id is " + socketId);
    }
  }
};

 
io.sockets.on('connection', function(socket) {
  
  connections.push(socket.id);
  
  console.log(connections);
  
  socket.on('message', function(message) {
    socket.broadcast.emit('message', message);
  });
 
  socket.on('websocket_chat', function(message) {
      console.log(message);
      socket.broadcast.emit('websocket_chat', message);
  });
  
  // コネクションを返す
  socket.on('clients', function(id) {
    socket(id).send(JSON.stringify((connections)));
  });
  
  socket.on('sendOffer', function(message) {
      socket.broadcast.emit('sendOffer', message);
  });
  
  socket.on('sendAnswer', function(message) {
      socket.broadcast.emit('sendAnswer', message);
  });
  
  socket.on('candidate', function(message) {
      socket.broadcast.emit('candidate', message);
  });
  
  
  
  socket.on('disconnect', function() {
    console.log("--------------------------");
    
    if (connections.indexOf(socket.id)) {
      deleteConnection(socket.id);
    }
    
    socket.broadcast.emit('disconnect', socket.id);
  });
  
});


router.use(express.static(path.resolve(__dirname, 'web')));

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});