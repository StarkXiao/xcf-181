(function() {
  var MountainRacer = window.MountainRacer || {};

  var RECONNECT_TOKEN_KEY = 'mp_reconnect_token';
  var DEFAULT_SERVER_URL = 'ws://localhost:8091';

  MountainRacer.MultiplayerManager = function(dataManager) {
    this._dm = dataManager;
    this._ws = null;
    this._connected = false;
    this._serverUrl = DEFAULT_SERVER_URL;
    this._currentRoom = null;
    this._localPlayerId = null;
    this._localPlayerName = '玩家' + Math.floor(Math.random() * 10000);
    this._otherPlayers = {};
    this._raceState = 'idle';
    this._raceStartTime = null;
    this._raceResults = null;
    this._currentRaceId = null;
    this._positionUpdateTimer = null;
    this._lastPositionSend = 0;
    this._eventListeners = {};
    this._reconnectAttempts = 0;
    this._maxReconnectAttempts = 5;
    this._autoReconnect = true;
    this._reconnecting = false;
    this._lastServerTime = 0;
    this._ping = 0;
  };

  var proto = MountainRacer.MultiplayerManager.prototype;

  proto.setServerUrl = function(url) {
    this._serverUrl = url;
  };

  proto.setPlayerName = function(name) {
    this._localPlayerName = name || ('玩家' + Math.floor(Math.random() * 10000));
  };

  proto.getPlayerName = function() {
    return this._localPlayerName;
  };

  proto.connect = function() {
    var self = this;

    if (this._ws && this._ws.readyState === 1) {
      return Promise.resolve(true);
    }

    return new Promise(function(resolve, reject) {
      try {
        self._ws = new WebSocket(self._serverUrl);

        self._ws.onopen = function() {
          console.log('[Multiplayer] Connected to server');
          self._connected = true;
          self._reconnectAttempts = 0;
          self._emit('connected');

          var savedToken = self._getSavedReconnectToken();
          if (savedToken) {
            self._send({ type: 'reconnect', token: savedToken });
          }

          resolve(true);
        };

        self._ws.onmessage = function(event) {
          try {
            var data = JSON.parse(event.data);
            self._handleMessage(data);
          } catch (e) {
            console.warn('[Multiplayer] Failed to parse message:', e);
          }
        };

        self._ws.onclose = function() {
          console.log('[Multiplayer] Disconnected from server');
          self._connected = false;
          self._emit('disconnected');

          if (self._autoReconnect && !self._reconnecting) {
            self._tryReconnect();
          }
        };

        self._ws.onerror = function(error) {
          console.error('[Multiplayer] WebSocket error:', error);
          self._emit('error', error);
          reject(error);
        };
      } catch (e) {
        console.error('[Multiplayer] Failed to connect:', e);
        reject(e);
      }
    });
  };

  proto.disconnect = function() {
    this._autoReconnect = false;
    if (this._ws) {
      this._ws.close();
      this._ws = null;
    }
    this._connected = false;
  };

  proto.isConnected = function() {
    return this._connected && this._ws && this._ws.readyState === 1;
  };

  proto._tryReconnect = function() {
    var self = this;

    if (this._reconnectAttempts >= this._maxReconnectAttempts) {
      console.log('[Multiplayer] Max reconnection attempts reached');
      this._emit('reconnect_failed');
      return;
    }

    this._reconnecting = true;
    this._reconnectAttempts++;

    var delay = Math.min(1000 * Math.pow(2, this._reconnectAttempts - 1), 10000);
    console.log('[Multiplayer] Attempting reconnection', this._reconnectAttempts, 'in', delay, 'ms');
    this._emit('reconnecting', { attempt: this._reconnectAttempts, delay: delay });

    setTimeout(function() {
      self.connect().then(function() {
        self._reconnecting = false;
        self._emit('reconnected');
      }).catch(function() {
        self._reconnecting = false;
        self._tryReconnect();
      });
    }, delay);
  };

  proto._handleMessage = function(msg) {
    switch (msg.type) {
      case 'room_list':
        this._emit('roomList', msg.rooms);
        break;

      case 'room_created':
        this._currentRoom = msg.room;
        this._localPlayerId = msg.playerId;
        this._emit('roomCreated', msg.room);
        break;

      case 'join_result':
        if (msg.success) {
          this._currentRoom = msg.room;
          this._localPlayerId = msg.player.id;
        }
        this._emit('joinResult', { success: msg.success, reason: msg.reason, room: msg.room });
        break;

      case 'room_update':
        this._currentRoom = msg.room;
        this._updateOtherPlayers(msg.room.players);
        this._emit('roomUpdated', msg.room);
        break;

      case 'left_room':
        this._currentRoom = null;
        this._otherPlayers = {};
        this._currentRaceId = null;
        this._clearReconnectToken();
        this._emit('leftRoom');
        break;

      case 'race_start':
        this._raceState = 'racing';
        this._raceStartTime = msg.timestamp;
        this._raceResults = null;
        this._currentRaceId = msg.raceId || null;
        this._updateOtherPlayers(msg.players);
        this._emit('raceStart', { timestamp: msg.timestamp, players: msg.players, raceId: msg.raceId });
        break;

      case 'positions_update':
        this._lastServerTime = msg.timestamp;
        this._updatePositions(msg.positions);
        this._emit('positionsUpdate', msg.positions);
        break;

      case 'player_finished':
        this._emit('playerFinished', { rank: msg.rank, time: msg.time });
        break;

      case 'race_end':
        this._raceState = 'finished';
        this._raceResults = msg.results;
        this._currentRaceId = msg.raceId || this._currentRaceId;
        this._clearReconnectToken();
        this._emit('raceEnd', { results: msg.results, raceId: msg.raceId });
        break;

      case 'player_disconnected':
        if (this._otherPlayers[msg.playerId]) {
          this._otherPlayers[msg.playerId].disconnected = true;
        }
        this._emit('playerDisconnected', msg.playerId);
        break;

      case 'player_reconnected':
        if (this._otherPlayers[msg.playerId]) {
          this._otherPlayers[msg.playerId].disconnected = false;
        }
        this._emit('playerReconnected', { playerId: msg.playerId, playerName: msg.playerName });
        break;

      case 'reconnect_success':
        this._currentRoom = msg.room;
        this._localPlayerId = msg.player.id;
        this._raceState = msg.raceState.status;
        this._raceStartTime = msg.raceState.startTime;
        this._currentRaceId = msg.raceState.raceId || null;
        this._updateOtherPlayers(msg.room.players);
        this._saveReconnectToken(null);
        this._emit('reconnectSuccess', {
          room: msg.room,
          player: msg.player,
          raceState: msg.raceState
        });
        break;

      case 'reconnect_failed':
        this._clearReconnectToken();
        this._emit('reconnectFailed', msg.reason);
        break;

      case 'leaderboard_data':
        this._emit('leaderboardData', { track: msg.track, entries: msg.entries });
        break;

      case 'start_race_result':
        this._emit('startRaceResult', { success: msg.success, reason: msg.reason });
        break;

      case 'chat_message':
        this._emit('chatMessage', {
          playerId: msg.playerId,
          playerName: msg.playerName,
          message: msg.message,
          timestamp: msg.timestamp
        });
        break;

      default:
        console.log('[Multiplayer] Unknown message type:', msg.type);
    }
  };

  proto._send = function(data) {
    if (this._ws && this._ws.readyState === 1) {
      try {
        this._ws.send(JSON.stringify(data));
        return true;
      } catch (e) {
        console.warn('[Multiplayer] Failed to send message:', e);
        return false;
      }
    }
    return false;
  };

  proto.getRoomList = function() {
    this._send({ type: 'get_room_list' });
  };

  proto.createRoom = function(options) {
    options = options || {};
    options.playerName = this._localPlayerName;
    this._send({ type: 'create_room', options: options });
  };

  proto.joinRoom = function(roomId) {
    this._send({
      type: 'join_room',
      roomId: roomId,
      playerName: this._localPlayerName
    });
  };

  proto.leaveRoom = function() {
    this._send({ type: 'leave_room' });
  };

  proto.setReady = function(ready) {
    this._send({ type: 'set_ready', ready: ready });
  };

  proto.startRace = function() {
    this._send({ type: 'start_race' });
  };

  proto.sendPosition = function(position) {
    var now = Date.now();
    if (now - this._lastPositionSend < 30) return;
    this._lastPositionSend = now;

    this._send({
      type: 'player_position',
      x: position.x,
      y: position.y,
      rotation: position.rotation || 0,
      vx: position.vx || 0,
      vy: position.vy || 0
    });
  };

  proto.getLeaderboard = function(track, limit) {
    this._send({ type: 'get_leaderboard', track: track, limit: limit });
  };

  proto.sendChat = function(message) {
    this._send({ type: 'chat_message', message: message });
  };

  proto.getCurrentRoom = function() {
    return this._currentRoom;
  };

  proto.getLocalPlayerId = function() {
    return this._localPlayerId;
  };

  proto.getOtherPlayers = function() {
    return this._otherPlayers;
  };

  proto.getRaceState = function() {
    return this._raceState;
  };

  proto.getRaceResults = function() {
    return this._raceResults;
  };

  proto.getCurrentRaceId = function() {
    return this._currentRaceId;
  };

  proto.isHost = function() {
    if (!this._currentRoom || !this._localPlayerId) return false;
    return this._currentRoom.hostId === this._localPlayerId;
  };

  proto._updateOtherPlayers = function(players) {
    var self = this;
    this._otherPlayers = {};
    for (var i = 0; i < players.length; i++) {
      var p = players[i];
      if (p.id !== this._localPlayerId) {
        this._otherPlayers[p.id] = {
          id: p.id,
          name: p.name,
          x: p.position ? p.position.x : 0,
          y: p.position ? p.position.y : 0,
          rotation: p.position ? p.position.rotation : 0,
          vx: p.velocity ? p.velocity.x : 0,
          vy: p.velocity ? p.velocity.y : 0,
          progress: p.progress || 0,
          ready: p.ready,
          finished: p.finished,
          rank: p.rank,
          finishTime: p.finishTime,
          disconnected: p.disconnected,
          carColor: p.carColor,
          _lastUpdate: Date.now(),
          _targetX: p.position ? p.position.x : 0,
          _targetY: p.position ? p.position.y : 0,
          _targetRotation: p.position ? p.position.rotation : 0
        };
      }
    }
  };

  proto._updatePositions = function(positions) {
    var now = Date.now();
    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      if (pos.id === this._localPlayerId) continue;

      var player = this._otherPlayers[pos.id];
      if (player) {
        player._targetX = pos.x;
        player._targetY = pos.y;
        player._targetRotation = pos.rotation;
        player.progress = pos.progress;
        player._lastUpdate = now;
      }
    }
  };

  proto.updateRemotePlayers = function(deltaTime) {
    var now = Date.now();
    for (var id in this._otherPlayers) {
      if (!this._otherPlayers.hasOwnProperty(id)) continue;
      var player = this._otherPlayers[id];

      if (player.disconnected) continue;

      var timeSinceUpdate = now - player._lastUpdate;
      var lerpFactor = Math.min(1, deltaTime / 100);

      player.x += (player._targetX - player.x) * lerpFactor;
      player.y += (player._targetY - player.y) * lerpFactor;
      player.rotation = player._targetRotation;

      if (timeSinceUpdate > 200) {
        player.x = player._targetX;
        player.y = player._targetY;
      }
    }
  };

  proto._saveReconnectToken = function(token) {
    try {
      if (token) {
        localStorage.setItem(RECONNECT_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(RECONNECT_TOKEN_KEY);
      }
    } catch (e) {
      console.warn('[Multiplayer] Failed to save reconnect token:', e);
    }
  };

  proto._getSavedReconnectToken = function() {
    try {
      return localStorage.getItem(RECONNECT_TOKEN_KEY);
    } catch (e) {
      return null;
    }
  };

  proto._clearReconnectToken = function() {
    this._saveReconnectToken(null);
  };

  proto.on = function(event, callback) {
    if (!this._eventListeners[event]) {
      this._eventListeners[event] = [];
    }
    this._eventListeners[event].push(callback);
  };

  proto.off = function(event, callback) {
    if (!this._eventListeners[event]) return;
    var index = this._eventListeners[event].indexOf(callback);
    if (index > -1) {
      this._eventListeners[event].splice(index, 1);
    }
  };

  proto._emit = function(event, data) {
    if (!this._eventListeners[event]) return;
    var listeners = this._eventListeners[event].slice();
    for (var i = 0; i < listeners.length; i++) {
      try {
        listeners[i](data);
      } catch (e) {
        console.error('[Multiplayer] Event listener error:', e);
      }
    }
  };

  proto.setRaceReconnectToken = function(token) {
    this._saveReconnectToken(token);
  };

  proto.getPing = function() {
    return this._ping;
  };

  window.MountainRacer = MountainRacer;
})();
