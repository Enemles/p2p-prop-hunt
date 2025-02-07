import { sendEvent } from './lib/events';
import { peerEventsSchema } from './config';
import { peer, createConnection, setConn } from './connection';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const myIdElem = document.getElementById('my-id') as HTMLElement;
const roleDisplay = document.getElementById('role-display') as HTMLElement;
const remoteIdInput = document.getElementById('remote-id') as HTMLInputElement;
const connectBtn = document.getElementById('connect-btn') as HTMLButtonElement;

const backgroundImage = new Image();
backgroundImage.src = '/bg.png';

const assetList = ['bush.png', 'flower.png', 'pig.png'];
let localImage = new Image();
let remoteImage = new Image();

interface PlayerState {
  x: number;
  y: number;
  asset: string;
  role: 'prop' | 'hunter';
}

let localPlayer: PlayerState = {
  x: getRandomPosition(canvas.width),
  y: getRandomPosition(canvas.height),
  asset: '',
  role: 'hunter'
};

let remotePlayer: PlayerState = {
  x: 0,
  y: 0,
  asset: '',
  role: 'prop'
};

let gameOver = false;
let winMessage = '';

function getRandomAsset(): string {
  return assetList[Math.floor(Math.random() * assetList.length)];
}

function getRandomPosition(max: number): number {
  return Math.floor(Math.random() * (max - 50)) + 25;
}

peer.on('open', (id: string) => {
  myIdElem.textContent = id;
});

peer.on('connection', (connection) => {
  setConn(connection);
  localPlayer.role = 'prop';
  localPlayer.asset = getRandomAsset();
  localImage.src = '/' + localPlayer.asset;
  roleDisplay.textContent = localPlayer.role;

  connection.on('open', () => {
    sendEvent('UPDATE_POS', localPlayer);
  });

  connection.on('data', (data: any) => {
    let eventObj: any;
    if (typeof data === 'string') {
      try {
        eventObj = JSON.parse(data);
        console.log('eventObj', eventObj);
      } catch (error) {
        console.error("Erreur JSON (conn entrante) :", error);
        return;
      }
    } else {
      eventObj = data;
      console.log('eventObj', eventObj);
    }
    try {
      const parsedData = peerEventsSchema.parse(eventObj);
      if (parsedData.eventName === 'WIN') {
        alert(localPlayer.role === 'hunter' ? 'Vous avez gagné !' : 'Le chasseur a gagné !');
        gameOver = true;
      } else { // UPDATE_POS
        remotePlayer = parsedData.payload;
        if (parsedData.payload.asset && remoteImage.src !== '/' + parsedData.payload.asset) {
          remoteImage.src = '/' + parsedData.payload.asset;
        }
      }
    } catch (e) {
      console.error('Données invalides (conn entrante) :', e);
    }
  });
});

connectBtn.addEventListener('click', () => {
  if (!remoteIdInput.value.trim()) return;

  const connection = createConnection(remoteIdInput.value.trim());
  setConn(connection);
  localPlayer.role = 'hunter';
  localPlayer.asset = 'hunter.png';
  localImage.src = '/' + localPlayer.asset;
  roleDisplay.textContent = localPlayer.role;

  connection.on('open', () => {
    sendEvent('UPDATE_POS', localPlayer);
  });

  connection.on('data', (data: any) => {
    let eventObj: any;
    if (typeof data === 'string') {
      try {
        eventObj = JSON.parse(data);
      } catch (error) {
        console.error("Erreur JSON (conn sortante) :", error);
        return;
      }
    } else {
      eventObj = data;
    }
    try {
      const parsedData = peerEventsSchema.parse(eventObj);
      if (parsedData.eventName === 'WIN') {
        alert(localPlayer.role === 'hunter' ? 'Vous avez gagné !' : 'Le chasseur a gagné !');
        gameOver = true;
      } else { // UPDATE_POS
        remotePlayer = parsedData.payload;
        if (parsedData.payload.asset && remoteImage.src !== '/' + parsedData.payload.asset) {
          remoteImage.src = '/' + parsedData.payload.asset;
        }
      }
    } catch (e) {
      console.error('Données invalides (conn sortante) :', e);
    }
  });
});

let keys: Record<string, boolean> = {};
document.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault();
  }
  keys[e.key] = true;
});
document.addEventListener('keyup', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault();
  }
  keys[e.key] = false;
});

function update() {
  const speed = 3;
  if (keys['ArrowUp']) localPlayer.y -= speed;
  if (keys['ArrowDown']) localPlayer.y += speed;
  if (keys['ArrowLeft']) localPlayer.x -= speed;
  if (keys['ArrowRight']) localPlayer.x += speed;

  localPlayer.x = Math.max(0, Math.min(canvas.width, localPlayer.x));
  localPlayer.y = Math.max(0, Math.min(canvas.height, localPlayer.y));

  sendEvent('UPDATE_POS', localPlayer);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

  if (remotePlayer.asset) {
    ctx.drawImage(remoteImage, remotePlayer.x - 25, remotePlayer.y - 25, 50, 50);
  }

  if (localPlayer.asset) {
    ctx.drawImage(localImage, localPlayer.x - 25, localPlayer.y - 25, 50, 50);
  }
}

canvas.addEventListener('click', (e) => {
  if (localPlayer.role === 'hunter' && !gameOver) {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (
      clickX >= remotePlayer.x - 25 &&
      clickX <= remotePlayer.x + 25 &&
      clickY >= remotePlayer.y - 25 &&
      clickY <= remotePlayer.y + 25
    ) {
      winMessage = 'Vous avez gagné !';
      gameOver = true;
      sendEvent('WIN', null);
    }
  }
});

function gameLoop() {
  if (!gameOver) update();
  draw();

  if (gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.fillText(winMessage, canvas.width / 2 - 100, canvas.height / 2);
  }
  requestAnimationFrame(gameLoop);
}

gameLoop();
