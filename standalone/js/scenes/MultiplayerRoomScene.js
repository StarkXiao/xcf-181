(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.MultiplayerRoomScene = function() {
    Phaser.Scene.call(this, { key: 'MultiplayerRoomScene' });
  };

  MountainRacer.MultiplayerRoomScene.prototype = Object.create(Phaser.Scene.prototype);
  MountainRacer.MultiplayerRoomScene.prototype.constructor = MountainRacer.MultiplayerRoomScene;

  var proto = MountainRacer.MultiplayerRoomScene.prototype;

  proto.init = function() {
    this.dataManager = MountainRacer.DataManager.getInstance();
    this.dataManager.init();
    this.mpManager = this.dataManager.getMultiplayerManager();
    this.room = null;
    this.isReady = false;
    this.playerCards = [];
    this.chatMessages = [];
  };

  proto.create = function() {
    var width = this.scale.width;
    var height = this.scale.height;

    this.createBackground(width, height);
    this.createHeader(width, height);
    this.createPlayersArea(width, height);
    this.createChatArea(width, height);
    this.createBottomBar(width, height);
    this.setupEventListeners();

    this.room = this.mpManager.getCurrentRoom();
    this.refreshRoom();
  };

  proto.setupEventListeners = function() {
    var self = this;

    this.mpManager.on('roomUpdated', function(room) {
      self.room = room;
      self.refreshRoom();
    });

    this.mpManager.on('raceStart', function(data) {
      self.startGame();
    });

    this.mpManager.on('chatMessage', function(msg) {
      self.addChatMessage(msg);
    });

    this.mpManager.on('playerDisconnected', function(playerId) {
      self.showToast('玩家断开连接');
    });

    this.mpManager.on('playerReconnected', function(data) {
      self.showToast(data.playerName + ' 重新连接');
    });

    this.mpManager.on('disconnected', function() {
      self.showToast('与服务器断开连接');
    });

    this.mpManager.on('reconnecting', function(data) {
      self.showToast('正在重连... 第' + data.attempt + '次');
    });

    this.mpManager.on('reconnected', function() {
      self.showToast('重连成功!');
    });

    this.mpManager.on('leftRoom', function() {
      self.scene.start('MultiplayerLobbyScene');
    });
  };

  proto.createBackground = function(width, height) {
    var bg = this.add.graphics();
    bg.fillGradientStyle(0x0d1117, 0x0d1117, 0x161b22, 0x161b22);
    bg.fillRect(0, 0, width, height);

    for (var i = 0; i < 30; i++) {
      var star = this.add.graphics();
      star.fillStyle(0xffd700, 0.15 + Math.random() * 0.4);
      star.fillCircle(
        Math.random() * width,
        Math.random() * height,
        1 + Math.random() * 2
      );
    }
  };

  proto.createHeader = function(width, height) {
    var headerBg = this.add.graphics();
    headerBg.fillStyle(0x1a1a3e, 0.95);
    headerBg.fillRect(0, 0, width, 70);
    headerBg.lineStyle(2, 0xffd700, 0.8);
    headerBg.lineBetween(0, 70, width, 70);

    var backBtn = this.createBackButton(50, 35);
    this.backBtn = backBtn;

    this.roomTitle = this.add.text(width / 2, 25, '房间', {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.roomSubtitle = this.add.text(width / 2, 50, '', {
      fontSize: '12px',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    this.statusText = this.add.text(width - 100, 35, '等待中', {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#4caf50'
    }).setOrigin(0.5);
  };

  proto.createPlayersArea = function(width, height) {
    var areaY = 85;
    var areaH = 260;

    var areaBg = this.add.graphics();
    areaBg.fillStyle(0x000000, 0.3);
    areaBg.fillRoundedRect(15, areaY, width - 30, areaH, 10);
    areaBg.lineStyle(2, 0x4a4a8a, 0.6);
    areaBg.strokeRoundedRect(15, areaY, width - 30, areaH, 10);

    var title = this.add.text(30, areaY + 20, '👥 玩家列表', {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ff9800'
    }).setOrigin(0, 0.5);

    this.playersContainer = this.add.container(0, areaY + 45);
  };

  proto.createChatArea = function(width, height) {
    var areaY = 355;
    var areaH = 160;

    var areaBg = this.add.graphics();
    areaBg.fillStyle(0x000000, 0.3);
    areaBg.fillRoundedRect(15, areaY, width - 30, areaH, 10);
    areaBg.lineStyle(2, 0x4a4a8a, 0.6);
    areaBg.strokeRoundedRect(15, areaY, width - 30, areaH, 10);

    var title = this.add.text(30, areaY + 20, '💬 房间聊天', {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#2196f3'
    }).setOrigin(0, 0.5);

    this.chatContainer = this.add.container(25, areaY + 40);

    this.chatInputBg = this.add.graphics();
    this.chatInputBg.fillStyle(0x0a0a1a, 0.8);
    this.chatInputBg.fillRoundedRect(25, areaY + areaH - 35, width - 120, 28, 6);
    this.chatInputBg.lineStyle(1, 0x4a4a8a, 0.8);
    this.chatInputBg.strokeRoundedRect(25, areaY + areaH - 35, width - 120, 28, 6);

    this.chatInputTxt = this.add.text(35, areaY + areaH - 21, '点击发送消息...', {
      fontSize: '12px',
      color: '#888888'
    }).setOrigin(0, 0.5);

    var sendBtn = this.createSmallButton(width - 70, areaY + areaH - 21, 60, 28, '发送', 0x2196f3, function() {
      self.showChatInputDialog();
    });

    this.addChatMessage({ playerName: '系统', message: '欢迎来到房间!', isSystem: true });
  };

  proto.createBottomBar = function(width, height) {
    var self = this;
    var barY = height - 50;

    var barBg = this.add.graphics();
    barBg.fillStyle(0x1a1a3e, 0.95);
    barBg.fillRect(0, height - 70, width, 70);
    barBg.lineStyle(2, 0xffd700, 0.6);
    barBg.lineBetween(0, height - 70, width, height - 70);

    this.readyBtn = this.createMainButton(width / 2 - 110, barY, 160, 50, '准备', 0x4caf50, function() {
      self.toggleReady();
    });

    this.startBtn = this.createMainButton(width / 2 + 110, barY, 160, 50, '开始比赛', 0xff9800, function() {
      self.startRace();
    });
    this.startBtn.setVisible(false);

    this.leaveBtn = this.createSmallButton(80, barY, 80, 40, '离开房间', 0xf44336, function() {
      self.leaveRoom();
    });
  };

  proto.refreshRoom = function() {
    if (!this.room) return;

    this.roomTitle.setText(this.room.name || '房间');
    this.roomSubtitle.setText('赛道 ' + this.room.track + ' | ' + this.room.playerCount + '/' + this.room.maxPlayers + ' 人');

    var statusMap = {
      'waiting': { text: '等待中', color: '#4caf50' },
      'racing': { text: '比赛中', color: '#ff9800' },
      'finished': { text: '已结束', color: '#9c27b0' }
    };
    var status = statusMap[this.room.status] || { text: this.room.status, color: '#ffffff' };
    this.statusText.setText(status.text);
    this.statusText.setColor(status.color);

    this.refreshPlayers();
    this.updateButtons();
  };

  proto.refreshPlayers = function() {
    if (!this.playersContainer || !this.room) return;

    this.playersContainer.removeAll(true);
    this.playerCards = [];

    var width = this.scale.width;
    var players = this.room.players || [];

    if (players.length === 0) {
      var empty = this.add.text(width / 2, 50, '暂无玩家', {
        fontSize: '14px',
        color: '#888888'
      }).setOrigin(0.5);
      this.playersContainer.add(empty);
      return;
    }

    var cardW = (width - 60) / 2;
    var cardH = 90;
    var cols = 2;

    for (var i = 0; i < players.length; i++) {
      var player = players[i];
      var col = i % cols;
      var row = Math.floor(i / cols);
      var x = 30 + cardW / 2 + col * (cardW + 10);
      var y = 10 + cardH / 2 + row * (cardH + 10);

      var card = this.createPlayerCard(x, y, cardW - 10, cardH, player);
      this.playersContainer.add(card);
      this.playerCards.push(card);
    }
  };

  proto.createPlayerCard = function(x, y, w, h, player) {
    var container = this.add.container(x, y);
    container.setSize(w, h);

    var isHost = this.room && player.id === this.room.hostId;
    var isLocal = player.id === this.mpManager.getLocalPlayerId();

    var bg = this.add.graphics();
    var borderColor = isLocal ? 0xffd700 : (player.disconnected ? 0x666666 : 0x4a4a8a);
    bg.fillStyle(0x1a1a3a, 0.9);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    bg.lineStyle(isLocal ? 3 : 2, borderColor, isLocal ? 0.9 : 0.6);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    container.add(bg);

    var avatarBg = this.add.graphics();
    avatarBg.fillStyle(this._hexToNumber(player.carColor) || 0x666666, 1);
    avatarBg.fillCircle(-w / 2 + 35, 0, 22);
    avatarBg.lineStyle(2, 0xffffff, 0.5);
    avatarBg.strokeCircle(-w / 2 + 35, 0, 22);
    container.add(avatarBg);

    var avatarIcon = this.add.text(-w / 2 + 35, 0, '🚗', {
      fontSize: '20px'
    }).setOrigin(0.5);
    container.add(avatarIcon);

    var nameTxt = this.add.text(-w / 2 + 65, -15, player.name, {
      fontSize: '14px',
      fontWeight: 'bold',
      color: player.disconnected ? '#666666' : '#ffffff'
    }).setOrigin(0, 0.5);
    container.add(nameTxt);

    if (isHost) {
      var hostBadge = this.add.text(-w / 2 + 65, 8, '👑 房主', {
        fontSize: '11px',
        color: '#ffd700'
      }).setOrigin(0, 0.5);
      container.add(hostBadge);
    } else if (isLocal) {
      var youBadge = this.add.text(-w / 2 + 65, 8, ' (你)', {
        fontSize: '11px',
        color: '#4caf50'
      }).setOrigin(0, 0.5);
      container.add(youBadge);
    }

    if (player.disconnected) {
      var dcTxt = this.add.text(-w / 2 + 65, 8, '❌ 已断开', {
        fontSize: '11px',
        color: '#f44336'
      }).setOrigin(0, 0.5);
      container.add(dcTxt);
    }

    var readyStatus = player.ready ? '✅ 已准备' : '⏳ 未准备';
    var readyColor = player.ready ? '#4caf50' : '#ff9800';
    var readyTxt = this.add.text(w / 2 - 10, 0, readyStatus, {
      fontSize: '12px',
      fontWeight: 'bold',
      color: readyColor
    }).setOrigin(1, 0.5);
    container.add(readyTxt);

    return container;
  };

  proto._hexToNumber = function(hex) {
    if (!hex) return 0x666666;
    return parseInt(hex.replace('#', ''), 16);
  };

  proto.updateButtons = function() {
    if (!this.room) return;

    var isHost = this.mpManager.isHost();
    var isRacing = this.room.status === 'racing';

    var localPlayer = null;
    for (var i = 0; i < this.room.players.length; i++) {
      if (this.room.players[i].id === this.mpManager.getLocalPlayerId()) {
        localPlayer = this.room.players[i];
        break;
      }
    }

    if (localPlayer) {
      this.isReady = localPlayer.ready;
    }

    if (this.readyBtn) {
      this.readyBtn.setVisible(!isRacing && !isHost);
      if (this.isReady) {
        this.readyBtn._txt.setText('取消准备');
        this.readyBtn._gfx.clear();
        this.readyBtn._gfx.fillStyle(0xf44336, 0.95);
        this.readyBtn._gfx.fillRoundedRect(-80, -25, 160, 50, 10);
        this.readyBtn._gfx.lineStyle(2, 0xffffff, 0.3);
        this.readyBtn._gfx.strokeRoundedRect(-80, -25, 160, 50, 10);
      } else {
        this.readyBtn._txt.setText('准备');
        this.readyBtn._gfx.clear();
        this.readyBtn._gfx.fillStyle(0x4caf50, 0.95);
        this.readyBtn._gfx.fillRoundedRect(-80, -25, 160, 50, 10);
        this.readyBtn._gfx.lineStyle(2, 0xffffff, 0.3);
        this.readyBtn._gfx.strokeRoundedRect(-80, -25, 160, 50, 10);
      }
    }

    if (this.startBtn) {
      this.startBtn.setVisible(isHost && !isRacing);
      var readyCount = 0;
      var totalPlayers = 0;
      for (var j = 0; j < this.room.players.length; j++) {
        if (!this.room.players[j].disconnected) {
          totalPlayers++;
          if (this.room.players[j].ready) readyCount++;
        }
      }
      var canStart = totalPlayers >= 1 && readyCount >= 1;
      if (this.startBtn._gfx) {
        this.startBtn._gfx.clear();
        this.startBtn._gfx.fillStyle(canStart ? 0xff9800 : 0x666666, 0.95);
        this.startBtn._gfx.fillRoundedRect(-80, -25, 160, 50, 10);
        this.startBtn._gfx.lineStyle(2, 0xffffff, 0.3);
        this.startBtn._gfx.strokeRoundedRect(-80, -25, 160, 50, 10);
      }
    }
  };

  proto.toggleReady = function() {
    if (!this.room || this.room.status !== 'waiting') return;
    this.isReady = !this.isReady;
    this.mpManager.setReady(this.isReady);
  };

  proto.startRace = function() {
    if (!this.mpManager.isHost()) {
      this.showToast('只有房主可以开始比赛');
      return;
    }
    this.mpManager.startRace();
  };

  proto.startGame = function() {
    var track = this.room ? this.room.track : 1;
    this.scene.start('GameScene', {
      level: track,
      multiplayerMode: true,
      multiplayerRoom: this.room
    });
  };

  proto.leaveRoom = function() {
    var self = this;
    this.showConfirmDialog('确认离开房间?', function() {
      self.mpManager.leaveRoom();
    });
  };

  proto.addChatMessage = function(msg) {
    this.chatMessages.push(msg);
    if (this.chatMessages.length > 20) {
      this.chatMessages.shift();
    }
    this.refreshChatMessages();
  };

  proto.refreshChatMessages = function() {
    if (!this.chatContainer) return;
    this.chatContainer.removeAll(true);

    var width = this.scale.width;
    var startY = 0;

    for (var i = 0; i < this.chatMessages.length; i++) {
      var msg = this.chatMessages[i];
      var y = startY + i * 22;

      var color = msg.isSystem ? '#9c27b0' : '#2196f3';
      var prefix = msg.isSystem ? '[系统] ' : ('[' + msg.playerName + '] ');

      var txt = this.add.text(10, y, prefix + msg.message, {
        fontSize: '12px',
        color: color,
        wordWrap: { width: width - 80 }
      }).setOrigin(0, 0);

      this.chatContainer.add(txt);
    }
  };

  proto.showChatInputDialog = function() {
    var self = this;
    var width = this.scale.width;
    var height = this.scale.height;

    var overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(9000);

    var panelW = 320;
    var panelH = 180;
    var panelX = width / 2;
    var panelY = height / 2;

    var panel = this.add.graphics();
    panel.fillStyle(0x1a1a3a, 0.98);
    panel.fillRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 16);
    panel.lineStyle(3, 0x2196f3, 1);
    panel.strokeRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 16);
    panel.setDepth(9001);

    var title = this.add.text(panelX, panelY - panelH / 2 + 35, '发送消息', {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#2196f3'
    }).setOrigin(0.5).setDepth(9002);

    var inputBg = this.add.graphics();
    inputBg.fillStyle(0x0a0a1a, 0.8);
    inputBg.fillRoundedRect(panelX - panelW / 2 + 25, panelY - 20, panelW - 50, 40, 8);
    inputBg.lineStyle(2, 0x4a4a8a, 0.8);
    inputBg.strokeRoundedRect(panelX - panelW / 2 + 25, panelY - 20, panelW - 50, 40, 8);
    inputBg.setDepth(9001);

    var chatText = '';
    var inputTxt = this.add.text(panelX - panelW / 2 + 35, panelY, '在这里输入...', {
      fontSize: '14px',
      color: '#888888'
    }).setOrigin(0, 0.5).setDepth(9002);

    function close() {
      overlay.destroy();
      panel.destroy();
      title.destroy();
      inputBg.destroy();
      inputTxt.destroy();
      if (sendBtn) sendBtn.destroy();
      if (cancelBtn) cancelBtn.destroy();
    }

    var sendBtn = this.createMainButton(panelX - 70, panelY + panelH / 2 - 35, 100, 40, '发送', 0x4caf50, function() {
      if (chatText.trim()) {
        self.mpManager.sendChat(chatText.trim());
      }
      close();
    });
    sendBtn.setDepth(9002);

    var cancelBtn = this.createMainButton(panelX + 70, panelY + panelH / 2 - 35, 100, 40, '取消', 0x757575, function() {
      close();
    });
    cancelBtn.setDepth(9002);
  };

  proto.createMainButton = function(x, y, w, h, label, color, onClick) {
    var container = this.add.container(x, y);
    container.setSize(w, h);

    var gfx = this.add.graphics();
    gfx.fillStyle(color, 0.95);
    gfx.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    gfx.lineStyle(2, 0xffffff, 0.3);
    gfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);

    var txt = this.add.text(0, 0, label, {
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    container.add([gfx, txt]);
    container._gfx = gfx;
    container._txt = txt;

    container.setInteractive(
      new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
      Phaser.Geom.Rectangle.Contains
    );
    container.on('pointerover', function() { container.setScale(1.05); });
    container.on('pointerout', function() { container.setScale(1); });
    container.on('pointerdown', function() { if (onClick) onClick(); });

    return container;
  };

  proto.createSmallButton = function(x, y, w, h, label, color, onClick) {
    var container = this.add.container(x, y);
    container.setSize(w, h);

    var gfx = this.add.graphics();
    gfx.fillStyle(color, 0.9);
    gfx.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
    gfx.lineStyle(2, 0xffffff, 0.3);
    gfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);

    var txt = this.add.text(0, 0, label, {
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    container.add([gfx, txt]);
    container._gfx = gfx;
    container._txt = txt;

    container.setInteractive(
      new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
      Phaser.Geom.Rectangle.Contains
    );
    container.on('pointerover', function() { container.setScale(1.05); });
    container.on('pointerout', function() { container.setScale(1); });
    container.on('pointerdown', function() { if (onClick) onClick(); });

    return container;
  };

  proto.createBackButton = function(x, y) {
    var self = this;
    var container = this.add.container(x, y);
    container.setSize(80, 36);

    var gfx = this.add.graphics();
    gfx.fillStyle(0x607d8b, 0.9);
    gfx.fillRoundedRect(-40, -18, 80, 36, 10);
    gfx.lineStyle(2, 0xffffff, 0.4);
    gfx.strokeRoundedRect(-40, -18, 80, 36, 10);

    var txt = this.add.text(0, 0, '← 返回', {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    container.add([gfx, txt]);
    container.setInteractive(
      new Phaser.Geom.Rectangle(-40, -18, 80, 36),
      Phaser.Geom.Rectangle.Contains
    );
    container.on('pointerover', function() { container.setScale(1.05); });
    container.on('pointerout', function() { container.setScale(1); });
    container.on('pointerdown', function() {
      self.leaveRoom();
    });

    return container;
  };

  proto.showConfirmDialog = function(message, onConfirm, onCancel) {
    var self = this;
    var width = this.scale.width;
    var height = this.scale.height;

    var overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(9000);

    var panelW = 300;
    var panelH = 160;

    var panel = this.add.graphics();
    panel.fillStyle(0x222244, 0.98);
    panel.fillRoundedRect(width / 2 - panelW / 2, height / 2 - panelH / 2, panelW, panelH, 16);
    panel.lineStyle(3, 0xff9800, 1);
    panel.strokeRoundedRect(width / 2 - panelW / 2, height / 2 - panelH / 2, panelW, panelH, 16);
    panel.setDepth(9001);

    var msgTxt = this.add.text(width / 2, height / 2 - 35, message, {
      fontSize: '16px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: panelW - 40 }
    }).setOrigin(0.5).setDepth(9002);

    function close() {
      overlay.destroy();
      panel.destroy();
      msgTxt.destroy();
      if (confirmBtn) confirmBtn.destroy();
      if (cancelBtn) cancelBtn.destroy();
    }

    var confirmBtn = this.createMainButton(width / 2 - 75, height / 2 + 40, 110, 40, '确认', 0x4caf50, function() {
      close();
      if (onConfirm) onConfirm();
    });
    confirmBtn.setDepth(9002);

    var cancelBtn = this.createMainButton(width / 2 + 75, height / 2 + 40, 110, 40, '取消', 0x757575, function() {
      close();
      if (onCancel) onCancel();
    });
    cancelBtn.setDepth(9002);
  };

  proto.showToast = function(message) {
    var width = this.scale.width;
    var height = this.scale.height;

    var bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.85);
    bg.fillRoundedRect(width / 2 - 120, height / 2 - 28, 240, 56, 12);
    bg.lineStyle(2, 0x4caf50, 1);
    bg.strokeRoundedRect(width / 2 - 120, height / 2 - 28, 240, 56, 12);
    bg.setDepth(9998);

    var txt = this.add.text(width / 2, height / 2, message, {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(9999);

    this.tweens.add({
      targets: [bg, txt],
      alpha: { from: 0, to: 1 },
      scale: { from: 0.8, to: 1 },
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: (function(bg, txt) {
        return function() {
          setTimeout(function() {
            if (bg) bg.destroy();
            if (txt) txt.destroy();
          }, 1500);
        };
      })(bg, txt)
    });
  };

  window.MountainRacer = MountainRacer;
})();
