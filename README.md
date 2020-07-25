# Hello WebSockets

Una aplicación de chat usando [WebSockets](https://developer.mozilla.org/es/docs/Web/API/WebSockets_API) y NodeJS. Basado en el [tutorial de Socket.IO](https://socket.io/get-started/chat). Demo en [la35chat.herokuapp.com](https://la35chat.herokuapp.com/).

## Qué vamos a hacer

Vamos a desarrollar una app de chat super sencilla y de paso aprendemos a usar Socket.IO, una librería de JS para trabajar con comunicación en tiempo real bidireccional basada en eventos. Internamente Socket.IO utiliza WebSockets en la gran mayoría de las plataformas.

## Sockets

No voy a extenderme mucho sobre el tema porque tienen una materia entera en sexto año que gira alrededor de este concepto.

Un _socket_ es un medio de comunicación entre procesos (programas). En el contexto de la programación sobre redes hablamos de _sockets_ cuando dos o más programas en distintas computadoras se comunican entre sí a través de una red. Un _socket_ es la interfaz a través de la cual sucede esa comunicación. La palabra _socket_ quiere decir enchufe o tomacorriente, el cable que los une es la red. El concepto es mucho más antiguo que la web, existe al menos desde [1983](https://en.wikipedia.org/wiki/Berkeley_sockets).

Claro que toda comunicación a través de la red sucede a través de _sockets_, el protocolo HTTP no es la excepción, pero los WebSockets que son un estándar más moderno son distintos. HTTP y WS son protocolos distintos.

La ventaja de los WebSockets es que liberan al cliente de tener que iniciar una comunicación con el servidor para recibir datos. Antes de que los navegadores implementaran este protocolo (que existe desde el 2011), aplicaciones como el chat de Facebook usaban una técnica llamada _AJAX long polling_, que es una versión adaptada a aplicaciones de tiempo real de lo que hicimos en [hello-fetch](https://github.com/santiagotrini/hello-fetch). Con el protocolo WebSockets obtenemos un canal [_full-duplex_](https://es.wikipedia.org/wiki/D%C3%BAplex_(telecomunicaciones)), es decir algo parecido al teléfono, que podemos hablar todos a la vez y la información viaja en los dos sentidos en tiempo real. En cambio HTTP sería más parecido a comunicarse por carta.

## Creando el proyecto

Basta de teoría, creamos el proyecto. Vamos a usar Express para mandar HTML a los clientes y Socket.IO para pasar los mensajes entre los clientes conectados. Instalamos esos paquetes con npm. No voy a guardar los mensajes en alguna base de datos para no complicar demasiado el ejemplo.

```console
$ mkdir hello-websockets
$ cd hello-websockets
$ npm init -y
$ git init
$ echo node_modules > .gitignore
$ echo web: npm start > Procfile
$ touch index.js
$ mkdir public
$ mkdir public/scripts
$ mkdir public/styles
$ touch public/index.html
$ touch public/scripts/chat.js
$ touch public/styles/style.css
$ npm i express socket.io
$ npm i -D nodemon
```

En total son cuatro archivos de código, HTML, CSS y JS para el cliente, todo desde el directorio `public` usando `express.static()`, y un `index.js` en el server para recibir y transmitir los mensajes del chat.

## El server

En la tercer línea del server importamos el módulo `http`. Este módulo no lo instalamos con npm porque es uno de los módulos bases de NodeJS. Sirve para crear servidores HTTP y lo necesitamos porque Socket.IO se integra o monta sobre servidores creados con `http`.

De todas maneras podemos utilizar Express pasando el objeto `app` de Express a `http.createServer()`. Además usamos Express para servir los archivos de `public`, los llamados _static assets_ para el cliente.

```js
const express = require('express');
const app     = express();
const http    = require('http').createServer(app);
const io      = require('socket.io')(http);

const port = process.env.PORT || 3000;

app.use(express.static('public'));

io.on('connection', (socket) => {
  socket.on('chat message', (msg) => {
    socket.broadcast.emit('chat message', msg);
  });
});

http.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
```

El método `listen()` es similar al que usamos con Express solo que ahora es un método de `http` (la instancia del server HTTP de NodeJS) y no de `app` que es la instancia de Express.

Lo más interesante está en el medio. La instancia de Socket.IO nos provee del método `on()` para registrar _listeners_ a distintos eventos. El primer evento que escuchamos es el de `connection` que es uno de los eventos por defecto de la librería. Este evento se dispara cuando un cliente se conecta al servidor de la app y ejecuta una _callback_ que registra un segundo _event listener_ ahora escuchando para ese _socket_ particular (el _socket_ que se crea cuando se conecta algún cliente) el evento de `chat message` que es un evento que definimos nosotros. Cuando se dispara ese evento el server retransmite el mensaje que le llega a todos los otros clientes excepto por el cliente que lo envió con `socket.broadcast.emit()`.

Y ese es todo el código del lado del servidor, super simple gracias a la magia de Socket.IO.

## El cliente

Socket.IO consiste en dos partes, la librería del lado del servidor y la del lado del cliente que funciona en el navegador web. Si tenemos nuestro _frontend_ en el mismo server que el server de Socket.IO podemos importar la librería para el navegador simplemente con

```html
<script src="/socket.io/socket.io.js"></script>
```

Esto expone una variable global llamada `io` que podemos usar para comunicarnos con el server después en JavaScript.

### La UI

La interfaz de usuario es sencilla. Un _header_ con un _input_ para el nombre de usuario, un contenedor para los mensajes y un formulario con un _input_ para el mensaje y un botón de enviar. La definimos en `public/index.html`.

```html
<!DOCTYPE html>
<html>
  <head>
    <!-- Required meta tags -->
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!-- Custom CSS -->
    <link rel="stylesheet" href="styles/style.css">
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
    <!-- Google fonts -->
     <link href="https://fonts.googleapis.com/css2?family=Knewave&display=swap" rel="stylesheet">
     <!-- Titulo -->
    <title>la35chat</title>
  </head>
  <body>
    <!-- Top level container -->
    <div class="container">
      <!-- Header -->
      <div class="header">
        <span>la35chat</span>
        <input id="nick" size="10" class="nick-input" placeholder="Nombre *" value="" autocomplete="off">
      </div>
      <!-- Messages container -->
      <div class="messages" id="messages"></div>
      <!-- Message form -->
      <form id="form" class="form" action="">
        <input id="msg" class="" autocomplete="off" placeholder="Mensaje">
        <button class=""><i class="fa fa-paper-plane"></i></button>
      </form>
    </div>
    <!-- JavaScript -->
    <script src="/socket.io/socket.io.js"></script>
    <script type="text/javascript" src="scripts/chat.js"></script>
  </body>
</html>
```

Antes de cerrar el _body_ importamos la librería y nuestro código de JS donde vamos a definir la lógica de la app. En el _head_ linkeamos [Font Awesome](https://fontawesome.com/), [Google Fonts](https://fonts.google.com/) y nuestro CSS.

### Un poco de diseño

Yo usé el siguiente CSS, para mí fue un proceso de prueba y error, acepto críticas y consejos. Si quieren lo usan y sino se arman el suyo. No voy a decir que soy un experto en el tema ni mucho menos.

```css
html, body {
  font-family: sans-serif;
  height: 100%;
  width: 100%;
  margin: 0;
  position: fixed;
}

.container {
  min-height: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.header {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: auto;
  background-color: black;
  font-family: 'Knewave', cursive;
  color: white;
  padding: 12px 12px;
  font-size: 24px;
}

.messages {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  flex-grow: 1;
  margin-bottom: 10px;
  overflow-y: scroll;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.messages::-webkit-scrollbar {
  display: none;
}

.form {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  flex-wrap: wrap;
  margin-top: auto;
  margin-bottom: 5px;
  margin-left: 5px;
  margin-right: 5px;
}

input, button {
  margin: 0.1em;
  font-size: 16px;
}

button {
  padding: 5px 15px;
  color: white;
  background-color: teal;
  text-align: center;
  border: none;
  border-radius: 5px;
}

.nick-input {
  background: transparent;
  border: none;
  color: white;
  border-bottom: 1px solid #ccc;
  margin-left: auto;
}

#msg {
  background: transparent;
  border: none;
  color: black;
  border-bottom: 1px solid #888;
  flex-grow: 1;
  margin-right: 15px;
}

.chat-message, .sent-message {
  display: inline-block;
  font-size: 16px;
  margin: 0.4em;
  padding: 10px 10px;
  background-color: white;
  border-radius: 5px;
  line-height: 1.8em;
}

.chat-message {
  background-color: gainsboro;
}

.sent-message {
  background-color: lightsteelblue;
  align-self: flex-end;
}

.nick {
  font-weight: bold;
}
```

Una cosa interesante con la que estuve experimentando en esta app es Flexbox, una sintaxis relativamente reciente para definir el _layout_ de una web. Si quieren aprender sobre el tema la mejor guía que encontré online es la de [CSS Tricks](https://css-tricks.com/snippets/css/a-guide-to-flexbox/) (en inglés). También pueden leer en [MDN](https://developer.mozilla.org/es/docs/Web/CSS/CSS_Flexible_Box_Layout/Conceptos_Basicos_de_Flexbox) sobre el tema.

Como no voy a explicar lo que intenté hacer con lo de arriba les dejo un link a [Khan Academy](https://es.khanacademy.org/computing/computer-programming/html-css) si quieren un poco más de teoría y práctica de CSS.

### Agregamos JavaScript

En el `index.html` agregamos dos scripts de JS. El primero era la librería para el cliente de Socket.IO. En el segundo script `scripts/chat.js` tenemos que escribir código para enviar y recibir los mensajes.

En la primera línea tenemos la variable que representa la conexión con el server. Lo hacemos con `io()` que sin argumentos se conecta al _host_ del sitio (que sería `http://localhost`) y es el mismo _host_ para el _frontend_ y _backend_. Si el server estuviera en otra dirección pondríamos la URL como argumento de `io()`.

Lo primero que hacemos es agregar un _listener_ al formulario. Cuando enviamos el formulario, o sea el evento de _submit_, enviamos el mensaje y el _nick_ al server y agregamos el mensaje a la interfaz con un `div` y dos `span`.

Aclaración, hay dos _sockets_ en cada conexión entre cliente y servidor. Del lado del cliente la variable `socket` emite eventos que representan mensajes de chat y del lado del server (en `index.js`) se retransmiten a todos los otros clientes que estén escuchando (en la parte de `socket.broadcast.emit()`).

```js
const socket = io();

document.getElementById('form').addEventListener('submit', (e) => {
  e.preventDefault();
  const message = document.getElementById('msg').value;
  if (!message) return false;
  const nick = document.getElementById('nick').value;
  if (!nick) return false;
  const chatMessage = {
    nick: nick,
    text: message
  };
  socket.emit('chat message', chatMessage);
  // clear input
  document.getElementById('msg').value = '';
  // put message for sender
  const div = document.createElement('div');
  const nickText = document.createElement('span');
  const messageText = document.createElement('span');
  nickText.classList.add('nick');
  nickText.innerHTML = nick;
  messageText.innerHTML = message;
  div.append(nickText);
  div.append(document.createElement('br'));
  div.append(messageText);
  div.classList.add('sent-message');
  document.getElementById('messages').append(div);
  div.scrollIntoView();
  return false;
});

socket.on('chat message', (msg) => {
  const div = document.createElement('div');
  const nick = document.createElement('span');
  const message = document.createElement('span');
  nick.classList.add('nick');
  nick.innerHTML = msg.nick;
  message.innerHTML = msg.text;
  div.append(nick);
  div.append(document.createElement('br'));
  div.append(message);
  div.classList.add('chat-message');
  document.getElementById('messages').append(div);
  div.scrollIntoView();
});
```

La otra parte de este script es cuando registramos el _listener_ de eventos `chat message` con `socket.on()`. Cuando el server envía eventos de este tipo creamos un `div` y dos `span` y los agregamos al contenedor de mensajes con el texto correspondiente.

El código que manipula el DOM y crea los mensajes es muy similar cuando enviamos y cuando recibimos, no estaría mal mejorar el código para no repetir lo mismo dos veces, pero se los dejo a ustedes de tarea.

## ¿Y ahora?

Después de este breve desvío podemos terminar de ver el _stack_ MERN en [hello-react](https://github.com/santiagotrini/hello-react).

Si les interesa saber más sobre protocolos distintos a HTTP pasen por [hello-iot](https://github.com/santiagotrini/hello-iot) donde armo un pequeño proyecto de Internet de las Cosas con el protocolo MQTT.
