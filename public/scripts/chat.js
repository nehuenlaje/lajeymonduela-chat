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
  let timestamp = new Date();
  console.log(timestamp.getHours(), timestamp.getMinutes());
  socket.emit('chat message', chatMessage);
  // clear input
  document.getElementById('msg').value = '';
  // put message for sender
  const div = document.createElement('div');
  const nickText = document.createElement('span');
  const messageText = document.createElement('span');
  const timeText = document.createElement('span');
  nickText.classList.add('nick');
  nickText.innerHTML = nick;
  messageText.innerHTML = message;
  timeText.innerHTML = timestamp.getHours() +':'+ timestamp.getMinutes()
  div.append(nickText);
  div.append(document.createElement('br'));
  div.append(messageText);
  div.append(document.createElement('br'));
  div.append(timeText);

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
})


function showTime(){
    var date = new Date();
    var h = date.getHours(); // 0 - 23
    var m = date.getMinutes(); // 0 - 59
    var s = date.getSeconds(); // 0 - 59
    var session = "AM";

    if(h == 0){
        h = 12;
    }

    if(h > 12){
        h = h - 12;
        session = "PM";
    }

    h = (h < 10) ? "0" + h : h;
    m = (m < 10) ? "0" + m : m;
    s = (s < 10) ? "0" + s : s;

    var time = h + ":" + m + ":" + s + " " + session;
    document.getElementById("MyClockDisplay").innerText = time;
    document.getElementById("MyClockDisplay").textContent = time;

    setTimeout(showTime, 1000);

}

showTime();

function getMessageHistory() {
  fetch('/api/messages')
    .then(res => res.json())
    .then(mensajes => {
      console.log(mensajes);
      for (let mensaje of mensajes) {
        //console.log(mensaje);
        // poner cada mensaje en la pantalla
        let div = document.createElement('div');
        let nickText = document.createElement('span');
        let messageText = document.createElement('span');
        let timeText = document.createElement('span');
        nickText.innerHTML = mensaje.nick;
        messageText.innerHTML = mensaje.text;
        let fecha = new Date(mensaje.date)
        timeText.innerHTML = fecha.getHours() +':'+ fecha.getMinutes();
        div.append(nickText);
        div.append(document.createElement('br'));
        div.append(messageText);
        div.append(document.createElement('br'));
        div.append(timeText);
        div.classList.add('chat-message');
        document.getElementById('messages').append(div);
        div.scrollIntoView();
      }
    })
    .catch(err => console.log(err));
}
getMessageHistory();

// TODO: agregar nicknames
