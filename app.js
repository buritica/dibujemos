
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var io = require('socket.io');
var connections = 0;

var app = express();
var server = http.createServer(app);
io = io.listen(server);

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', function(req, res){
  res.render('index', { title: 'Dibujemos' });
});

io.set('log level', 1);

// Escuchamos conexiones entrantes
io.sockets.on('connection', function (socket) {
  connections++;
  console.log('connected', connections);
  socket.broadcast.emit('connections', {connections:connections});

  // Detectamos eventos de mouse
  socket.on('mousemove', function (data) {
    // transmitimos el movimiento a todos los clientes conectados
    socket.broadcast.emit('move', data);
  });

  socket.on('disconnect', function() {
    connections--;
    console.log('connected', connections);
    socket.broadcast.emit('connections', {connections:connections});
  });
});


server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

