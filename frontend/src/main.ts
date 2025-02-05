import './style.css'
import Peer from 'peerjs';

const peer = new Peer("someid", {
  host: "localhost",
  port: 3002,
  path: "/prophunt",
});

document.addEventListener('DOMContentLoaded', () => {
  const peer = new Peer({
    debug: 2
  });

  peer.on('open', (id: string) => {
    console.log(`Mon ID Peer est : ${id}`);
    const myIdElem = document.getElementById('my-id');
    if (myIdElem) myIdElem.textContent = id;
  });

  peer.on('error', (err) => {
    console.error('Erreur PeerJS : ', err);
  });

  peer.on('connection', (conn) => {
    console.log(`Connexion entrante de ${conn.peer}`);
    conn.on('data', (data: any) => {
      console.log(`Message reçu de ${conn.peer} :`, data);
      addMessage(`Reçu de ${conn.peer} : ${data}`);
    });
  });

  function addMessage(message: string) {
    const messagesDiv = document.getElementById('messages');
    if (messagesDiv) {
      const p = document.createElement('p');
      p.textContent = message;
      messagesDiv.appendChild(p);
    }
  }

});
