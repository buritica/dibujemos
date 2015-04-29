 $(document).ready(function(){
  if(!('getContext' in document.createElement('canvas'))){
    alert('Lo sentimos, tu navegador no soporta canvas!');
    return false;
  }
  var url = 'http://' + window.location.host;

  // cache de objetos de jQuery
  var doc = $(document);
  var win = $(window);
  var canvas = $('#papel');
  var instructions = $('#instructions');
  var connections = $('#connections');
  var ctx = canvas[0].getContext("2d");

  // id único para la session
  var id = Math.round($.now()*Math.random());

  // inicializamos el estado
  var goma_de_borrar = '#DDDDDD';
  var drawing = false;
  var clients = {};
  var cursors = {};
  var prev = {};
  var lastEmit = $.now();
  var cursorColor = randomColor();
  var anchoLinea = 3;

  // abrimos la conexion
  var socket = io.connect(url);

  /*
    Administradores de eventos
   */
  $('.heights').on('click', ancho)
  $('#colorPicker').on('click', function(){
    $('.colores').slideToggle();
  });
  $('.colores ul li').on('click', colours);
  $('#clearing').on('click', function(){
    location.reload();
  });
  $('#helping').on('click', function() {
    instructions.fadeIn();
  });
  $('#eraser').on('click', function(){
    cursorColor = goma_de_borrar;
  });

  function ancho (data) {
    var numeros = data.currentTarget.id;
    anchoLinea = parseInt(numeros)
  }

  function colours (data) {
    var colores = {
      'rojo': '#ff0000',
      'magenta': '#FF00FF',
      'azul': '#00dfff',
      'verde': 'rgb(15, 221, 32)',
      'amarillo': '#fdff00',
      'naranja': '#ff7400',
      'negro': '#000000',
      // random: randomColor();
    }
    var clase = data.currentTarget.className
    $('.' + clase).click(function(data){
      if (clase == 'rojo') {
        cursorColor = colores.rojo;
      } else if (clase == 'magenta'){
        cursorColor = colores.magenta
      } else if (clase == 'azul'){
        cursorColor = colores.azul
      } else if (clase == 'verde'){
        cursorColor = colores.verde
      } else if (clase == 'amarillo'){
        cursorColor = colores.amarillo;
      } else if (clase == 'naranja'){
        cursorColor = colores.naranja;
      } else if (clase == 'negro'){
        cursorColor = colores.negro;
      } else if (clase == 'random'){
        cursorColor = randomColor();
      }

    })
  }

    

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
      drawLine(clients[data.id].x, clients[data.id].y, data.x, data.y, data.color, data.line);
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
        'id': id,
        'line': anchoLinea
      };
      socket.emit('mousemove', movement);
      lastEmit = $.now();
    }

    if(drawing){

      drawLine(prev.x, prev.y, e.pageX, e.pageY, cursorColor, anchoLinea);
      prev.x = e.pageX;
      prev.y = e.pageY;
    }
  }

  function drawLine(fromx, fromy, tox, toy, color, anchoLinea){
    ctx.beginPath(); // create a new empty path (no subpaths!)
    ctx.strokeStyle = color;
    ctx.lineWidth = anchoLinea;
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
  socket.on('chat message', writeText);
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


// Modal
$('#papel').dblclick(modal);
var x = ''; var y = '';
  function modal (e) {
     x = e.pageX, y = e.pageY;

  $('#modal').fadeIn();
  $('#input-ado').focus();
  $('#close').click(function(){
  $('#modal').fadeOut();
  });

$('form').submit(function(){
  $('#input-ado').val();
  var carlos = {
    'x': x,
    'y': y,
    'mensaje': $('#input-ado').val()
  }
  socket.emit('chat message', carlos)
  $('#input-ado').val('');
    $('#modal').fadeOut();
    return false;
});
}

function writeText (carlos) {
  var canvas = $('#papel');
  var ctx = canvas[0].getContext('2d')
  ctx.font = 20 + 'pt Lucida Grande'
  ctx.fillText(carlos.mensaje, carlos.x, carlos.y);

}
});