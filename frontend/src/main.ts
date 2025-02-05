import Peer from 'peerjs';

interface PlayerState {
  x: number;
  y: number;
  asset: string;
  role: 'prop' | 'hunter';
}

// Récupération des éléments du DOM
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const myIdElem = document.getElementById('my-id') as HTMLElement;
const roleDisplay = document.getElementById('role-display') as HTMLElement;
const remoteIdInput = document.getElementById('remote-id') as HTMLInputElement;
const connectBtn = document.getElementById('connect-btn') as HTMLButtonElement;

// Chargement de l'image de fond depuis le dossier public
const backgroundImage = new Image();
backgroundImage.src = '/bg.png';

// Liste des assets possibles pour le prop
const assetList = ['bush.png', 'flower.png', 'pig.png'];
function getRandomAsset(): string {
  return assetList[Math.floor(Math.random() * assetList.length)];
}
function getRandomPosition(max: number): number {
  return Math.floor(Math.random() * (max - 50)) + 25;
}

// Initialisation des états
let localPlayer: PlayerState = {
  x: getRandomPosition(canvas.width),
  y: getRandomPosition(canvas.height),
  asset: '', // définie en fonction du rôle
  role: 'hunter' // par défaut, sera modifié si on reçoit une connexion
};

let remotePlayer: PlayerState = {
  x: 0,
  y: 0,
  asset: '',
  role: 'prop'
};

let localImage = new Image();
let remoteImage = new Image();

let connection: Peer.DataConnection | null = null;
const peer = new Peer(undefined, { debug: 2 });

peer.on('open', (id: string) => {
  myIdElem.textContent = id;
});

// Si une connexion entrante est reçue, vous êtes l'hôte (prop)
peer.on('connection', (conn) => {
  connection = conn;
  localPlayer.role = 'prop';
  localPlayer.asset = getRandomAsset();
  localImage.src = '/' + localPlayer.asset;
  roleDisplay.textContent = localPlayer.role;

  // Dès l'ouverture, envoyer l'état local
  connection.on('open', () => {
    connection.send(localPlayer);
  });

  connection.on('data', (data: any) => {
    if (data.win) {
      alert('Le chasseur a gagné !');
      gameOver = true;
    } else {
      // Mettre à jour l'état distant (le hunter)
      remotePlayer = data;
      if (data.asset && remoteImage.src !== '/' + data.asset) {
        remoteImage.src = '/' + data.asset;
      }
    }
  });

  connection.on('error', (err) => {
    console.error('Erreur de connexion :', err);
  });
});

// Lorsque vous initiez la connexion, vous devenez le chasseur
connectBtn.addEventListener('click', () => {
  if (remoteIdInput.value.trim() === '') return;
  connection = peer.connect(remoteIdInput.value.trim());
  localPlayer.role = 'hunter';
  // Pour le hunter, asset toujours "hunter.png"
  localPlayer.asset = 'hunter.png';
  localImage.src = '/' + localPlayer.asset;
  roleDisplay.textContent = localPlayer.role;

  connection.on('open', () => {
    connection.send(localPlayer);
  });

  connection.on('data', (data: any) => {
    if (data.win) {
      alert('Vous avez gagné !');
      gameOver = true;
    } else {
      remotePlayer = data;
      if (data.asset && remoteImage.src !== '/' + data.asset) {
        remoteImage.src = '/' + data.asset;
      }
    }
  });

  connection.on('error', (err) => {
    console.error('Erreur de connexion :', err);
  });
});

// Déplacements via flèches (les deux joueurs peuvent se déplacer)
let keys: Record<string, boolean> = {};
document.addEventListener('keydown', (e) => keys[e.key] = true);
document.addEventListener('keyup', (e) => keys[e.key] = false);

function update() {
  const speed = 3;
  if (keys['ArrowUp']) localPlayer.y -= speed;
  if (keys['ArrowDown']) localPlayer.y += speed;
  if (keys['ArrowLeft']) localPlayer.x -= speed;
  if (keys['ArrowRight']) localPlayer.x += speed;

  localPlayer.x = Math.max(0, Math.min(canvas.width, localPlayer.x));
  localPlayer.y = Math.max(0, Math.min(canvas.height, localPlayer.y));

  if (connection && connection.open) {
    connection.send(localPlayer);
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

  // Dessiner l'asset du joueur distant
  if (remotePlayer.asset) {
    ctx.drawImage(remoteImage, remotePlayer.x - 25, remotePlayer.y - 25, 50, 50);
  }

  // Dessiner l'asset local
  if (localPlayer.asset) {
    ctx.drawImage(localImage, localPlayer.x - 25, localPlayer.y - 25, 50, 50);
  }
}

let gameOver = false;
let winMessage = '';

// Pour le chasseur, cliquer sur l'asset du prop permet de gagner
canvas.addEventListener('click', (e) => {
  if (localPlayer.role === 'hunter' && !gameOver) {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    // Vérification sur la zone de l'asset du prop (50x50 centré)
    if (
      clickX >= remotePlayer.x - 25 &&
      clickX <= remotePlayer.x + 25 &&
      clickY >= remotePlayer.y - 25 &&
      clickY <= remotePlayer.y + 25
    ) {
      winMessage = 'Vous avez gagné !';
      gameOver = true;
      if (connection && connection.open) {
        connection.send({ win: true });
      }
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
