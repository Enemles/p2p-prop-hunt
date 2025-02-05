const { PeerServer } = require('peer');

const peerServer = PeerServer({ port: 3002, path: '/prophunt' });

console.log('Peer server running on port 3002');
