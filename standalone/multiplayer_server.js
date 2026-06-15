const http = require('http');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

const PORT = 8091;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

class MultiplayerServer extends EventEmitter {
  constructor() {
    super();
    this.rooms = new Map();
    this.clients = new Map();
    this.leaderboard = this._loadLeaderboard();
    this._roomIdCounter = 1000;
  }

  _loadLeaderboard() {
    try {
      const dataPath = path.join(ROOT, 'data', 'leaderboard.json');
      if (fs.existsSync(dataPath)) {
        return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      }
    } catch (e) {
      console.warn('[Leaderboard] Failed to load leaderboard:', e.message);
    }
    return { global: [], tracks: {} };
  }

  _saveLeaderboard() {
    try {
      const dataDir = path.join(ROOT, 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const dataPath = path.join(dataDir, 'leaderboard.json');
      fs.writeFileSync(dataPath, JSON.stringify(this.leaderboard, null, 2));
    } catch (e) {
      console.error('[Leaderboard] Failed to save leaderboard:', e.message);
    }
  }

  _generateRoomId() {
    this._roomIdCounter++;
    return 'ROOM_' + this._roomIdCounter;
  }

  createRoom(hostClient, options) {
    const roomId = this._generateRoomId();
    const room = {
      id: roomId,
      name: options.name || '房间 ' + roomId,
      track: options.track || 1,
      maxPlayers: options.maxPlayers || 4,
      hostId: hostClient.id,
      players: new Map(),
      status: 'waiting',
      raceStartTime: null,
      raceEndTime: null,
      results: [],
      createdAt: Date.now(),
      trackLength: options.trackLength || 5000,
      raceId: null,
      raceCount: 0
    };

    this.rooms.set(roomId, room);
    this._addPlayerToRoom(room, hostClient, options.playerName || '玩家');

    console.log(`[Room] Room created: ${roomId} by ${hostClient.id}`);
    return room;
  }

  _addPlayerToRoom(room, client, playerName) {
    const player = {
      id: client.id,
      name: playerName,
      ready: false,
      position: { x: 0, y: 0, rotation: 0 },
      velocity: { x: 0, y: 0 },
      progress: 0,
      finished: false,
      finishTime: null,
      rank: 0,
      disconnected: false,
      reconnectToken: null,
      carColor: this._getRandomColor()
    };

    room.players.set(client.id, player);
    client.currentRoomId = room.id;
    client.playerName = playerName;

    return player;
  }

  _getRandomColor() {
    const colors = ['#ff4500', '#1e90ff', '#32cd32', '#ffd700', '#ff69b4', '#00ced1', '#ff6347', '#9370db'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  joinRoom(client, roomId, playerName) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, reason: 'room_not_found' };
    }

    if (room.status !== 'waiting') {
      return { success: false, reason: 'race_in_progress' };
    }

    if (room.players.size >= room.maxPlayers) {
      return { success: false, reason: 'room_full' };
    }

    const player = this._addPlayerToRoom(room, client, playerName || '玩家');

    console.log(`[Room] Player ${client.id} joined room ${roomId}`);
    this._broadcastRoomUpdate(room);

    return { success: true, room: room, player: player };
  }

  leaveRoom(client) {
    const roomId = client.currentRoomId;
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    room.players.delete(client.id);
    client.currentRoomId = null;

    if (room.players.size === 0) {
      this.rooms.delete(roomId);
      console.log(`[Room] Room ${roomId} destroyed (empty)`);
    } else {
      if (room.hostId === client.id) {
        const firstPlayer = room.players.values().next().value;
        room.hostId = firstPlayer.id;
      }
      this._broadcastRoomUpdate(room);
    }

    console.log(`[Room] Player ${client.id} left room ${roomId}`);
  }

  setPlayerReady(client, ready) {
    const room = this._getClientRoom(client);
    if (!room || room.status !== 'waiting') return false;

    const player = room.players.get(client.id);
    if (!player) return false;

    player.ready = ready;
    this._broadcastRoomUpdate(room);
    return true;
  }

  startRace(client) {
    const room = this._getClientRoom(client);
    if (!room) return { success: false, reason: 'room_not_found' };

    if (room.hostId !== client.id) {
      return { success: false, reason: 'not_host' };
    }

    const readyPlayers = Array.from(room.players.values()).filter(p => p.ready && !p.disconnected);
    if (readyPlayers.length < 1) {
      return { success: false, reason: 'not_enough_players' };
    }

    room.status = 'racing';
    room.raceCount++;
    room.raceStartTime = Date.now();
    room.raceEndTime = null;
    room.results = [];
    room._leaderboardRecorded = false;
    room.raceId = room.id + '_R' + room.raceCount + '_' + room.raceStartTime;

    let startX = 80;
    room.players.forEach((player) => {
      player.position.x = startX;
      player.position.y = 200;
      player.position.rotation = 0;
      player.progress = 0;
      player.finished = false;
      player.finishTime = null;
      player.rank = 0;
      startX += 100;
    });

    this._broadcastToRoom(room, {
      type: 'race_start',
      timestamp: room.raceStartTime,
      players: this._serializePlayers(room),
      raceId: room.raceId
    });

    console.log(`[Race] Race started in room ${room.id}`);
    return { success: true };
  }

  updatePlayerPosition(client, positionData) {
    const room = this._getClientRoom(client);
    if (!room || room.status !== 'racing') return;

    const player = room.players.get(client.id);
    if (!player || player.finished || player.disconnected) return;

    player.position.x = positionData.x;
    player.position.y = positionData.y;
    player.position.rotation = positionData.rotation || 0;
    player.velocity.x = positionData.vx || 0;
    player.velocity.y = positionData.vy || 0;

    const progress = Math.max(0, Math.min(1, positionData.x / room.trackLength));
    player.progress = progress;

    if (progress >= 1 && !player.finished) {
      player.finished = true;
      player.finishTime = Date.now() - room.raceStartTime;
      player.rank = room.results.length + 1;

      var alreadyInResults = room.results.some(r => r.playerId === player.id);
      if (!alreadyInResults) {
        room.results.push({
          playerId: player.id,
          playerName: player.name,
          rank: player.rank,
          time: player.finishTime,
          carColor: player.carColor
        });
      }

      this._sendToClient(client, {
        type: 'player_finished',
        rank: player.rank,
        time: player.finishTime
      });

      const finishedCount = room.results.length;
      const totalPlayers = Array.from(room.players.values()).filter(p => !p.disconnected).length;

      if (finishedCount >= totalPlayers) {
        this._endRace(room);
      }
    }
  }

  _endRace(room) {
    if (room.status === 'finished') return;
    room.status = 'finished';
    room.raceEndTime = Date.now();

    room.results.sort((a, b) => a.rank - b.rank);

    if (!room._leaderboardRecorded) {
      room._leaderboardRecorded = true;
      this._recordLeaderboard(room);
    }

    this._broadcastToRoom(room, {
      type: 'race_end',
      results: room.results,
      raceId: room.raceId
    });

    console.log(`[Race] Race ended in room ${room.id}, results:`, room.results);
  }

  _recordLeaderboard(room) {
    for (const result of room.results) {
      const entry = {
        playerName: result.playerName,
        time: result.time,
        track: room.track,
        rank: result.rank,
        timestamp: Date.now()
      };

      if (!this.leaderboard.tracks[room.track]) {
        this.leaderboard.tracks[room.track] = [];
      }

      const trackBoard = this.leaderboard.tracks[room.track];
      trackBoard.push(entry);
      trackBoard.sort((a, b) => a.time - b.time);
      if (trackBoard.length > 100) trackBoard.length = 100;

      if (!this.leaderboard.global) this.leaderboard.global = [];
      this.leaderboard.global.push(entry);
      this.leaderboard.global.sort((a, b) => a.time - b.time);
      if (this.leaderboard.global.length > 100) this.leaderboard.global.length = 100;
    }

    this._saveLeaderboard();
  }

  getLeaderboard(track, limit) {
    limit = limit || 20;
    let entries = [];

    if (track && this.leaderboard.tracks[track]) {
      entries = this.leaderboard.tracks[track].slice(0, limit);
    } else {
      entries = (this.leaderboard.global || []).slice(0, limit);
    }

    return entries;
  }

  handleDisconnect(client) {
    const room = this._getClientRoom(client);
    if (!room) return;

    const player = room.players.get(client.id);
    if (!player) return;

    player.disconnected = true;

    if (room.status === 'racing') {
      const token = this._generateReconnectToken(client.id, room.id);
      player.reconnectToken = token;

      this._broadcastToRoom(room, {
        type: 'player_disconnected',
        playerId: client.id
      });

      setTimeout(() => {
        if (player.reconnectToken === token && player.disconnected) {
          room.players.delete(client.id);

          if (room.status === 'racing') {
            const remainingPlayers = Array.from(room.players.values()).filter(p => !p.disconnected);
            if (remainingPlayers.length === 0) {
              this._endRace(room);
            }
          }

          if (room.players.size === 0) {
            this.rooms.delete(room.id);
          } else {
            this._broadcastRoomUpdate(room);
          }
        }
      }, 30000);
    } else {
      this.leaveRoom(client);
    }

    console.log(`[Connection] Client ${client.id} disconnected`);
  }

  _generateReconnectToken(playerId, roomId) {
    return 'RECON_' + playerId + '_' + roomId + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  reconnect(client, token) {
    for (const [roomId, room] of this.rooms) {
      for (const [playerId, player] of room.players) {
        if (player.reconnectToken === token) {
          const oldId = playerId;
          room.players.delete(oldId);

          player.id = client.id;
          player.disconnected = false;
          player.reconnectToken = null;
          room.players.set(client.id, player);

          if (room.hostId === oldId) {
            room.hostId = client.id;
          }

          client.currentRoomId = room.id;
          client.playerName = player.name;

          this._sendToClient(client, {
            type: 'reconnect_success',
            room: this._serializeRoom(room),
            player: this._serializePlayer(player),
            raceState: {
              status: room.status,
              startTime: room.raceStartTime,
              elapsed: room.raceStartTime ? (Date.now() - room.raceStartTime) : 0,
              raceId: room.raceId
            }
          });

          this._broadcastToRoom(room, {
            type: 'player_reconnected',
            playerId: client.id,
            playerName: player.name
          });

          console.log(`[Reconnect] Player ${client.id} reconnected to room ${roomId}`);
          return { success: true, room: room, player: player };
        }
      }
    }

    return { success: false, reason: 'invalid_token' };
  }

  _getClientRoom(client) {
    if (!client.currentRoomId) return null;
    return this.rooms.get(client.currentRoomId);
  }

  _serializePlayer(player) {
    return {
      id: player.id,
      name: player.name,
      ready: player.ready,
      position: player.position,
      velocity: player.velocity,
      progress: player.progress,
      finished: player.finished,
      finishTime: player.finishTime,
      rank: player.rank,
      disconnected: player.disconnected,
      carColor: player.carColor
    };
  }

  _serializePlayers(room) {
    const players = [];
    room.players.forEach((p) => {
      players.push(this._serializePlayer(p));
    });
    return players;
  }

  _serializeRoom(room) {
    return {
      id: room.id,
      name: room.name,
      track: room.track,
      maxPlayers: room.maxPlayers,
      hostId: room.hostId,
      status: room.status,
      playerCount: room.players.size,
      players: this._serializePlayers(room),
      trackLength: room.trackLength
    };
  }

  _serializeRoomList() {
    const list = [];
    this.rooms.forEach((room) => {
      list.push({
        id: room.id,
        name: room.name,
        track: room.track,
        maxPlayers: room.maxPlayers,
        playerCount: room.players.size,
        status: room.status,
        hostName: room.players.get(room.hostId)?.name || '未知'
      });
    });
    return list;
  }

  _broadcastRoomUpdate(room) {
    this._broadcastToRoom(room, {
      type: 'room_update',
      room: this._serializeRoom(room)
    });
  }

  _broadcastToRoom(room, message) {
    const data = JSON.stringify(message);
    room.players.forEach((player) => {
      const client = this.clients.get(player.id);
      if (client && !player.disconnected) {
        this._sendRaw(client, data);
      }
    });
  }

  _sendToClient(client, message) {
    this._sendRaw(client, JSON.stringify(message));
  }

  _sendRaw(client, data) {
    if (client.ws && client.ws.readyState === 1) {
      try {
        client.ws.send(data);
      } catch (e) {
        console.warn('[Send] Failed to send message:', e.message);
      }
    }
  }

  broadcastPositions(room) {
    if (room.status !== 'racing') return;

    const positions = [];
    room.players.forEach((player) => {
      if (!player.disconnected) {
        positions.push({
          id: player.id,
          x: player.position.x,
          y: player.position.y,
          rotation: player.position.rotation,
          vx: player.velocity.x,
          vy: player.velocity.y,
          progress: player.progress
        });
      }
    });

    this._broadcastToRoom(room, {
      type: 'positions_update',
      positions: positions,
      timestamp: Date.now()
    });
  }

  handleMessage(client, message) {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      return;
    }

    switch (data.type) {
      case 'get_room_list':
        this._sendToClient(client, {
          type: 'room_list',
          rooms: this._serializeRoomList()
        });
        break;

      case 'create_room':
        const createResult = this.createRoom(client, data.options || {});
        this._sendToClient(client, {
          type: 'room_created',
          room: this._serializeRoom(createResult),
          playerId: client.id
        });
        this._broadcastRoomList();
        break;

      case 'join_room':
        const joinResult = this.joinRoom(client, data.roomId, data.playerName);
        this._sendToClient(client, {
          type: 'join_result',
          success: joinResult.success,
          reason: joinResult.reason,
          room: joinResult.success ? this._serializeRoom(joinResult.room) : null,
          player: joinResult.success ? this._serializePlayer(joinResult.player) : null
        });
        if (joinResult.success) {
          this._broadcastRoomList();
        }
        break;

      case 'leave_room':
        this.leaveRoom(client);
        this._sendToClient(client, { type: 'left_room' });
        this._broadcastRoomList();
        break;

      case 'set_ready':
        this.setPlayerReady(client, data.ready);
        break;

      case 'start_race':
        const startResult = this.startRace(client);
        this._sendToClient(client, {
          type: 'start_race_result',
          success: startResult.success,
          reason: startResult.reason
        });
        break;

      case 'player_position':
        this.updatePlayerPosition(client, data);
        break;

      case 'get_leaderboard':
        this._sendToClient(client, {
          type: 'leaderboard_data',
          track: data.track,
          entries: this.getLeaderboard(data.track, data.limit)
        });
        break;

      case 'reconnect':
        const reconResult = this.reconnect(client, data.token);
        if (!reconResult.success) {
          this._sendToClient(client, {
            type: 'reconnect_failed',
            reason: reconResult.reason
          });
        }
        break;

      case 'chat_message':
        const room = this._getClientRoom(client);
        if (room) {
          this._broadcastToRoom(room, {
            type: 'chat_message',
            playerId: client.id,
            playerName: client.playerName || '未知',
            message: data.message,
            timestamp: Date.now()
          });
        }
        break;

      default:
        console.warn('[Message] Unknown message type:', data.type);
    }
  }

  _broadcastRoomList() {
    const roomList = this._serializeRoomList();
    this.clients.forEach((client) => {
      if (!client.currentRoomId) {
        this._sendToClient(client, {
          type: 'room_list',
          rooms: roomList
        });
      }
    });
  }
}

const multiplayerServer = new MultiplayerServer();

setInterval(() => {
  multiplayerServer.rooms.forEach((room) => {
    if (room.status === 'racing') {
      multiplayerServer.broadcastPositions(room);
    }
  });
}, 50);

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  if (urlPath === '/api/leaderboard') {
    const track = new URL(req.url, 'http://localhost').searchParams.get('track');
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(multiplayerServer.getLeaderboard(track, 20)));
    return;
  }

  const filePath = path.join(ROOT, urlPath);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404); res.end('Not Found'); return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

let clientIdCounter = 0;

server.on('upgrade', (req, socket, head) => {
  clientIdCounter++;
  const clientId = 'CLIENT_' + clientIdCounter;

  const acceptKey = req.headers['sec-websocket-key'];
  const hash = generateAcceptKey(acceptKey);

  const responseHeaders = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: WebSocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${hash}`
  ];

  socket.write(responseHeaders.join('\r\n') + '\r\n\r\n');

  const client = {
    id: clientId,
    ws: socket,
    currentRoomId: null,
    playerName: null
  };

  multiplayerServer.clients.set(clientId, client);

  let buffer = Buffer.alloc(0);

  socket.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);

    while (buffer.length > 2) {
      const result = parseWebSocketFrame(buffer);
      if (!result) break;

      buffer = result.remaining;

      if (result.frame.opcode === 8) {
        socket.end();
        break;
      }

      if (result.frame.opcode === 1) {
        const message = result.frame.payload.toString('utf8');
        multiplayerServer.handleMessage(client, message);
      }
    }
  });

  socket.on('close', () => {
    multiplayerServer.handleDisconnect(client);
    multiplayerServer.clients.delete(clientId);
  });

  socket.on('error', () => {
    multiplayerServer.handleDisconnect(client);
    multiplayerServer.clients.delete(clientId);
  });

  console.log(`[Connection] New client connected: ${clientId}`);
});

function generateAcceptKey(key) {
  const crypto = require('crypto');
  return crypto
    .createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');
}

function parseWebSocketFrame(buffer) {
  if (buffer.length < 2) return null;

  const firstByte = buffer[0];
  const secondByte = buffer[1];

  const opcode = firstByte & 0x0F;
  const masked = (secondByte & 0x80) !== 0;
  let payloadLength = secondByte & 0x7F;
  let offset = 2;

  if (payloadLength === 126) {
    if (buffer.length < 4) return null;
    payloadLength = buffer.readUInt16BE(2);
    offset = 4;
  } else if (payloadLength === 127) {
    if (buffer.length < 10) return null;
    payloadLength = Number(buffer.readBigUInt64BE(2));
    offset = 10;
  }

  let maskingKey = null;
  if (masked) {
    if (buffer.length < offset + 4) return null;
    maskingKey = buffer.slice(offset, offset + 4);
    offset += 4;
  }

  if (buffer.length < offset + payloadLength) return null;

  let payload = buffer.slice(offset, offset + payloadLength);

  if (masked && maskingKey) {
    payload = Buffer.from(payload);
    for (let i = 0; i < payload.length; i++) {
      payload[i] ^= maskingKey[i % 4];
    }
  }

  return {
    frame: {
      opcode: opcode,
      payload: payload
    },
    remaining: buffer.slice(offset + payloadLength)
  };
}

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n=== Multiplayer Racing Server ===');
  console.log('Server started on port', PORT);
  console.log('HTTP: http://localhost:' + PORT + '/');
  console.log('WebSocket: ws://localhost:' + PORT + '/');
  console.log('\nFeatures:');
  console.log('  - Room creation and management');
  console.log('  - Real-time position synchronization');
  console.log('  - Race results and settlement');
  console.log('  - Disconnection and reconnection');
  console.log('  - Persistent leaderboard');
  console.log('================================\n');
});
