$(function(){

  if(!('getContext' in document.createElement('canvas'))){
    alert('Lo sentimos, tu navegador no soporta canvas!');
    return false;
  }

  var url = 'http://' + window.location.host;

  // cache de objetos de jQuery
  var doc = $(document);
  var win = $(window);
  var canvas = $('#paper');
  var instructions = $('#instructions');
  var connections = $('#connections');
  var ctx = canvas[0].getContext('2d');

  // id único para la session
  var id = Math.round($.now()*Math.random());

  // inicializamos el estado
  var drawing = false;
  var clients = {};
  var cursors = {};
  var prev = {};
  var lastEmit = $.now();
  var cursorColor = randomColor();

  // abrimos la conexion
  var socket = io.connect(url);

  /*
    Administradores de eventos
   */

  function moveHandler(data) {
    if(! (data.id in clients)){
      // le damos un cursor a cada usuario nuestro
      cursors[data.id] = $('<div class="cursor">').appendTo('#cursors');
    }

    // movemos el cursor a su posicion
    cursors[data.id].css({
      'left' : data.x,
      'top' : data.y
    });

    if(data.drawing && clients[data.id]){
      drawLine(clients[data.id].x, clients[data.id].y, data.x, data.y, data.color);
    }

    // actualizamos el estado
    clients[data.id] = data;
    clients[data.id].updated = $.now();
  }

  function mousedownHandler(e) {
    e.preventDefault();
    drawing = true;
    prev.x = e.pageX;
    prev.y = e.pageY;

    // escondemos las instrucciones
    instructions.fadeOut();
  }

  function mousemoveHandler(e) {
    if($.now() - lastEmit > 30){
      var movement = {
        'x': e.pageX,
        'y': e.pageY,
        'drawing': drawing,
        'color': cursorColor,
        'id': id
      };
      socket.emit('mousemove', movement);
      lastEmit = $.now();
    }

    if(drawing){

      drawLine(prev.x, prev.y, e.pageX, e.pageY, cursorColor);

      prev.x = e.pageX;
      prev.y = e.pageY;
    }
  }

  function drawLine(fromx, fromy, tox, toy, color){
    ctx.beginPath(); // create a new empty path (no subpaths!)
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.stroke();
  }

  function connectionHandler(data) {
    console.log('connections', connections);
    connections.text(data.connections + ' conectados');
  }

  function randomColor() {
    // from http://www.paulirish.com/2009/random-hex-color-code-snippets/
    return '#'+(function lol(m,s,c){return s[m.floor(m.random() * s.length)] +
    (c && lol(m,s,c-1));})(Math,'0123456789ABCDEF',4);
  }

  /**
   * Adjuntamos los eventos
   */
  socket.on('move', moveHandler);
  socket.on('connections', connectionHandler);
  canvas.on('mousedown', mousedownHandler);
  doc.on('mousemove', mousemoveHandler);

  doc.bind('mouseup mouseleave',function(){
    drawing = false;
  });

  /**
   * Borramos sessiones viejas
   */
  setInterval(function(){
    for(var ident in clients){
      if($.now() - clients[ident].updated > 10000){
        cursors[ident].remove();
        delete clients[ident];
        delete cursors[ident];
      }
    }
  },10000);
});