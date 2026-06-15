(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.MultiplayerLobbyScene = function() {
    Phaser.Scene.call(this, { key: 'MultiplayerLobbyScene' });
  };

  MountainRacer.MultiplayerLobbyScene.prototype = Object.create(Phaser.Scene.prototype);
  MountainRacer.MultiplayerLobbyScene.prototype.constructor = MountainRacer.MultiplayerLobbyScene;

  var proto = MountainRacer.MultiplayerLobbyScene.prototype;

  proto.init = function() {
    this.dataManager = MountainRacer.DataManager.getInstance();
    this.dataManager.init();
    this.mpManager = this.dataManager.getMultiplayerManager();
    this.leaderboard = this.dataManager.getMultiplayerLeaderboard();
    this.currentTab = 'rooms';
    this.rooms = [];
    this.roomCards = [];
    this.selectedTrack = 1;
    this.playerName = this.mpManager.getPlayerName();
    this.connected = false;
  };

  proto.create = function() {
    var width = this.scale.width;
    var height = this.scale.height;

    this.createBackground(width, height);
    this.createHeader(width, height);
    this.createTabNavigation(width, height);
    this.createContentArea(width, height);
    this.createBottomBar(width, height);
    this.setupEventListeners();

    this.tryConnect();
    this.loadTabContent(this.currentTab);

    var self = this;
    this.refreshTimer = this.time.addEvent({
      delay: 5000,
      callback: function() {
        if (self.connected && self.currentTab === 'rooms') {
          self.mpManager.getRoomList();
        }
      },
      loop: true
    });
  };

  proto.setupEventListeners = function() {
    var self = this;

    this.mpManager.on('connected', function() {
      self.connected = true;
      self.updateConnectionStatus(true);
      if (self.currentTab === 'rooms') {
        self.mpManager.getRoomList();
      }
    });

    this.mpManager.on('disconnected', function() {
      self.connected = false;
      self.updateConnectionStatus(false);
    });

    this.mpManager.on('roomList', function(rooms) {
      self.rooms = rooms || [];
      if (self.currentTab === 'rooms') {
        self.refreshRoomList();
      }
    });

    this.mpManager.on('roomCreated', function(room) {
      self.scene.start('MultiplayerRoomScene');
    });

    this.mpManager.on('joinResult', function(result) {
      if (result.success) {
        self.scene.start('MultiplayerRoomScene');
      } else {
        self.showToast('加入失败: ' + self.getReasonText(result.reason));
      }
    });

    this.leaderboard.on('leaderboardLoaded', function(data) {
      if (self.currentTab === 'leaderboard') {
        self.refreshLeaderboard(data.entries);
      }
    });
  };

  proto.tryConnect = function() {
    var self = this;
    if (!this.mpManager.isConnected()) {
      this.showToast('正在连接服务器...');
      this.mpManager.connect().catch(function() {
        self.showToast('连接失败，请检查服务器');
      });
    } else {
      this.connected = true;
      this.updateConnectionStatus(true);
    }
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

    this.add.text(width / 2, 35, '🏁 多人竞速', {
      fontSize: '26px',
      fontWeight: 'bold',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.connectionStatus = this.add.container(width - 90, 35);
    this.updateConnectionStatus(false);
  };

  proto.updateConnectionStatus = function(connected) {
    if (!this.connectionStatus) return;
    this.connectionStatus.removeAll(true);

    var dot = this.add.graphics();
    dot.fillStyle(connected ? 0x4caf50 : 0xf44336, 1);
    dot.fillCircle(0, 0, 6);

    var txt = this.add.text(12, 0, connected ? '已连接' : '未连接', {
      fontSize: '12px',
      color: connected ? '#4caf50' : '#f44336'
    }).setOrigin(0, 0.5);

    this.connectionStatus.add([dot, txt]);
  };

  proto.createTabNavigation = function(width, height) {
    var tabs = [
      { id: 'rooms', label: '房间列表', icon: '🏠' },
      { id: 'leaderboard', label: '排行榜', icon: '🏆' }
    ];

    var tabY = 90;
    var tabW = (width - 40) / tabs.length - 6;
    var tabH = 44;
    var startX = 20 + tabW / 2;
    var gap = 12;

    this.tabButtons = [];
    var self = this;

    for (var i = 0; i < tabs.length; i++) {
      var tab = tabs[i];
      var x = startX + i * (tabW + gap);
      var container = this.add.container(x, tabY);
      container.setSize(tabW, tabH);

      var gfx = this.add.graphics();
      var isActive = tab.id === this.currentTab;
      gfx.fillStyle(isActive ? 0xff9800 : 0x2a2a5a, isActive ? 0.95 : 0.75);
      gfx.fillRoundedRect(-tabW / 2, -tabH / 2, tabW, tabH, 10);
      gfx.lineStyle(2, isActive ? 0xffb74d : 0x4a4a8a, 1);
      gfx.strokeRoundedRect(-tabW / 2, -tabH / 2, tabW, tabH, 10);

      var txt = this.add.text(0, 0, tab.icon + ' ' + tab.label, {
        fontSize: '14px',
        fontWeight: 'bold',
        color: isActive ? '#ffffff' : '#bbbbbb'
      }).setOrigin(0.5);

      container.add([gfx, txt]);
      container._tabId = tab.id;
      container._gfx = gfx;
      container._txt = txt;
      container._tabW = tabW;
      container._tabH = tabH;

      container.setInteractive(
        new Phaser.Geom.Rectangle(-tabW / 2, -tabH / 2, tabW, tabH),
        Phaser.Geom.Rectangle.Contains
      );
      container.on('pointerdown', function() {
        self.switchTab(this._tabId);
      });

      this.tabButtons.push(container);
    }
  };

  proto.switchTab = function(tabId) {
    this.currentTab = tabId;
    for (var i = 0; i < this.tabButtons.length; i++) {
      var btn = this.tabButtons[i];
      var isActive = btn._tabId === tabId;
      btn._gfx.clear();
      btn._gfx.fillStyle(isActive ? 0xff9800 : 0x2a2a5a, isActive ? 0.95 : 0.75);
      btn._gfx.fillRoundedRect(-btn._tabW / 2, -btn._tabH / 2, btn._tabW, btn._tabH, 10);
      btn._gfx.lineStyle(2, isActive ? 0xffb74d : 0x4a4a8a, 1);
      btn._gfx.strokeRoundedRect(-btn._tabW / 2, -btn._tabH / 2, btn._tabW, btn._tabH, 10);
      btn._txt.setColor(isActive ? '#ffffff' : '#bbbbbb');
    }
    this.loadTabContent(tabId);
  };

  proto.createContentArea = function(width, height) {
    this.contentAreaY = 140;
    this.contentAreaH = height - this.contentAreaY - 90;
    this.contentArea = this.add.container(0, 0);
  };

  proto.createBottomBar = function(width, height) {
    var barY = height - 50;

    var barBg = this.add.graphics();
    barBg.fillStyle(0x1a1a3e, 0.95);
    barBg.fillRect(0, height - 70, width, 70);
    barBg.lineStyle(2, 0xffd700, 0.6);
    barBg.lineBetween(0, height - 70, width, height - 70);

    var createBtn = this.createMainButton(width / 2, barY, 200, 50, '➕ 创建房间', 0xff9800, function() {
      self.showCreateRoomDialog();
    });

    var nameLabel = this.add.text(20, barY, '玩家名: ' + this.playerName, {
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    var editBtn = this.createSmallButton(180, barY, 60, 30, '修改', 0x2196f3, function() {
      self.showEditNameDialog();
    });
  };

  proto.loadTabContent = function(tabId) {
    this.clearContent();
    var width = this.scale.width;
    if (tabId === 'rooms') {
      this.renderRoomList(width);
      if (this.connected) {
        this.mpManager.getRoomList();
      }
    } else if (tabId === 'leaderboard') {
      this.renderLeaderboard(width);
      this.leaderboard.getLeaderboard(this.selectedTrack, 20);
    }
  };

  proto.clearContent = function() {
    this.contentArea.removeAll(true);
    this.roomCards = [];
    this.leaderboardEntries = [];
  };

  proto.renderRoomList = function(width) {
    var headerY = this.contentAreaY + 5;
    var header = this.add.graphics();
    header.fillStyle(0x000000, 0.35);
    header.fillRoundedRect(15, headerY, width - 30, 40, 8);
    this.contentArea.add(header);

    this.add.text(30, headerY + 20, '🏠 房间列表', {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ff9800'
    }).setOrigin(0, 0.5);

    var refreshBtn = this.createSmallButton(width - 50, headerY + 20, 60, 30, '刷新', 0x4caf50, function() {
      self.mpManager.getRoomList();
    });
    this.contentArea.add(refreshBtn);

    this.roomListContainer = this.add.container(0, headerY + 50);
    this.contentArea.add(this.roomListContainer);

    this.refreshRoomList();
  };

  proto.refreshRoomList = function() {
    if (!this.roomListContainer) return;
    this.roomListContainer.removeAll(true);
    this.roomCards = [];

    var width = this.scale.width;

    if (!this.rooms || this.rooms.length === 0) {
      var empty = this.add.text(width / 2, 60, '暂无房间\n点击下方创建房间', {
        fontSize: '16px',
        color: '#888888',
        align: 'center'
      }).setOrigin(0.5);
      this.roomListContainer.add(empty);
      return;
    }

    var cardW = width - 40;
    var cardH = 70;
    var startY = 0;

    var self = this;
    for (var i = 0; i < this.rooms.length; i++) {
      var room = this.rooms[i];
      var y = startY + i * (cardH + 8);
      var card = this.createRoomCard(width / 2, y, cardW, cardH, room);
      this.roomListContainer.add(card);
      this.roomCards.push(card);
    }
  };

  proto.createRoomCard = function(x, y, w, h, room) {
    var self = this;
    var container = this.add.container(x, y);
    container.setSize(w, h);

    var bg = this.add.graphics();
    bg.fillStyle(0x1a1a3a, 0.9);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    bg.lineStyle(2, 0x4a4a8a, 0.8);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    container.add(bg);

    var nameTxt = this.add.text(-w / 2 + 15, -h / 2 + 18, room.name, {
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0, 0.5);
    container.add(nameTxt);

    var hostTxt = this.add.text(-w / 2 + 15, -h / 2 + 42, '房主: ' + (room.hostName || '未知'), {
      fontSize: '12px',
      color: '#aaaaaa'
    }).setOrigin(0, 0.5);
    container.add(hostTxt);

    var trackTxt = this.add.text(w / 2 - 100, -h / 2 + 18, '赛道 ' + room.track, {
      fontSize: '12px',
      color: '#ffd700'
    }).setOrigin(1, 0.5);
    container.add(trackTxt);

    var playersTxt = this.add.text(w / 2 - 100, -h / 2 + 42, '👥 ' + room.playerCount + '/' + room.maxPlayers, {
      fontSize: '12px',
      color: room.playerCount >= room.maxPlayers ? '#f44336' : '#4caf50'
    }).setOrigin(1, 0.5);
    container.add(playersTxt);

    var statusTxt = this.add.text(w / 2 - 20, 0, this.getStatusText(room.status), {
      fontSize: '12px',
      color: room.status === 'waiting' ? '#4caf50' : '#ff9800'
    }).setOrigin(1, 0.5);
    container.add(statusTxt);

    var canJoin = room.status === 'waiting' && room.playerCount < room.maxPlayers && this.connected;
    var joinBtn = this.createSmallButton(w / 2 - 15, 0, 60, 32, canJoin ? '加入' : '已满', canJoin ? 0x4caf50 : 0x666666, function() {
      if (canJoin) {
        self.joinRoom(room.id);
      }
    });
    container.add(joinBtn);

    return container;
  };

  proto.getStatusText = function(status) {
    var statusMap = {
      'waiting': '等待中',
      'racing': '比赛中',
      'finished': '已结束'
    };
    return statusMap[status] || status;
  };

  proto.getReasonText = function(reason) {
    var reasonMap = {
      'room_not_found': '房间不存在',
      'race_in_progress': '比赛正在进行',
      'room_full': '房间已满',
      'not_host': '不是房主',
      'not_enough_players': '玩家不足',
      'invalid_token': '令牌无效'
    };
    return reasonMap[reason] || reason;
  };

  proto.joinRoom = function(roomId) {
    if (!this.connected) {
      this.showToast('未连接服务器');
      return;
    }
    this.mpManager.joinRoom(roomId);
  };

  proto.renderLeaderboard = function(width) {
    var headerY = this.contentAreaY + 5;
    var header = this.add.graphics();
    header.fillStyle(0x000000, 0.35);
    header.fillRoundedRect(15, headerY, width - 30, 40, 8);
    this.contentArea.add(header);

    this.add.text(30, headerY + 20, '🏆 排行榜', {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffd700'
    }).setOrigin(0, 0.5);

    var trackSelectY = headerY + 55;
    var tracks = [
      { id: 1, label: '赛道 1' },
      { id: 2, label: '赛道 2' },
      { id: 3, label: '赛道 3' }
    ];

    var self = this;
    var trackBtnW = (width - 50) / 3;
    this.trackButtons = [];

    for (var i = 0; i < tracks.length; i++) {
      var track = tracks[i];
      var btnX = 25 + trackBtnW / 2 + i * (trackBtnW + 5);
      var btn = this.createTrackSelectButton(btnX, trackSelectY, trackBtnW - 5, 36, track, track.id === this.selectedTrack);
      btn._trackId = track.id;
      btn.on('pointerdown', function() {
        self.selectedTrack = this._trackId;
        self.updateTrackButtons();
        self.leaderboard.getLeaderboard(self.selectedTrack, 20);
      });
      this.contentArea.add(btn);
      this.trackButtons.push(btn);
    }

    this.leaderboardContainer = this.add.container(0, trackSelectY + 50);
    this.contentArea.add(this.leaderboardContainer);

    this.refreshLeaderboard([]);
  };

  proto.createTrackSelectButton = function(x, y, w, h, track, isActive) {
    var container = this.add.container(x, y);
    container.setSize(w, h);

    var gfx = this.add.graphics();
    gfx.fillStyle(isActive ? 0xffd700 : 0x2a2a5a, isActive ? 0.9 : 0.7);
    gfx.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    gfx.lineStyle(2, isActive ? 0xffa500 : 0x4a4a8a, 1);
    gfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);

    var txt = this.add.text(0, 0, track.label, {
      fontSize: '13px',
      fontWeight: 'bold',
      color: isActive ? '#000000' : '#bbbbbb'
    }).setOrigin(0.5);

    container.add([gfx, txt]);
    container._gfx = gfx;
    container._txt = txt;
    container._w = w;
    container._h = h;

    container.setInteractive(
      new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
      Phaser.Geom.Rectangle.Contains
    );

    return container;
  };

  proto.updateTrackButtons = function() {
    if (!this.trackButtons) return;
    for (var i = 0; i < this.trackButtons.length; i++) {
      var btn = this.trackButtons[i];
      var isActive = btn._trackId === this.selectedTrack;
      btn._gfx.clear();
      btn._gfx.fillStyle(isActive ? 0xffd700 : 0x2a2a5a, isActive ? 0.9 : 0.7);
      btn._gfx.fillRoundedRect(-btn._w / 2, -btn._h / 2, btn._w, btn._h, 8);
      btn._gfx.lineStyle(2, isActive ? 0xffa500 : 0x4a4a8a, 1);
      btn._gfx.strokeRoundedRect(-btn._w / 2, -btn._h / 2, btn._w, btn._h, 8);
      btn._txt.setColor(isActive ? '#000000' : '#bbbbbb');
    }
  };

  proto.refreshLeaderboard = function(entries) {
    if (!this.leaderboardContainer) return;
    this.leaderboardContainer.removeAll(true);

    var width = this.scale.width;

    if (!entries || entries.length === 0) {
      var empty = this.add.text(width / 2, 60, '暂无数据', {
        fontSize: '16px',
        color: '#888888'
      }).setOrigin(0.5);
      this.leaderboardContainer.add(empty);
      return;
    }

    var itemH = 44;
    for (var i = 0; i < Math.min(entries.length, 15); i++) {
      var entry = entries[i];
      var y = i * (itemH + 4);
      var item = this.createLeaderboardItem(width / 2, y, width - 40, itemH, entry, i + 1);
      this.leaderboardContainer.add(item);
    }
  };

  proto.createLeaderboardItem = function(x, y, w, h, entry, rank) {
    var container = this.add.container(x, y);
    container.setSize(w, h);

    var bg = this.add.graphics();
    var rankColor = 0x2a2a5a;
    if (rank === 1) rankColor = 0xffd700;
    else if (rank === 2) rankColor = 0xc0c0c0;
    else if (rank === 3) rankColor = 0xcd7f32;

    bg.fillStyle(0x1a1a3a, 0.9);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    bg.lineStyle(2, rankColor, rank <= 3 ? 0.8 : 0.4);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    container.add(bg);

    var rankIcon = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank;
    var rankTxt = this.add.text(-w / 2 + 20, 0, rankIcon, {
      fontSize: rank <= 3 ? '22px' : '16px',
      fontWeight: 'bold',
      color: rank <= 3 ? '#ffffff' : '#888888'
    }).setOrigin(0, 0.5);
    container.add(rankTxt);

    var nameTxt = this.add.text(-w / 2 + 60, 0, entry.playerName, {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0, 0.5);
    container.add(nameTxt);

    var timeTxt = this.add.text(w / 2 - 15, 0, this.leaderboard.formatTime(entry.time), {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#ffd700'
    }).setOrigin(1, 0.5);
    container.add(timeTxt);

    return container;
  };

  proto.showCreateRoomDialog = function() {
    var self = this;
    var width = this.scale.width;
    var height = this.scale.height;

    var overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(9000);

    var panelW = 340;
    var panelH = 320;
    var panelX = width / 2;
    var panelY = height / 2;

    var panel = this.add.graphics();
    panel.fillStyle(0x1a1a3a, 0.98);
    panel.fillRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 16);
    panel.lineStyle(3, 0xff9800, 1);
    panel.strokeRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 16);
    panel.setDepth(9001);

    var title = this.add.text(panelX, panelY - panelH / 2 + 35, '创建房间', {
      fontSize: '22px',
      fontWeight: 'bold',
      color: '#ffd700'
    }).setOrigin(0.5).setDepth(9002);

    var roomNameLabel = this.add.text(panelX - panelW / 2 + 25, panelY - panelH / 2 + 75, '房间名称', {
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0, 0.5).setDepth(9002);

    this.newRoomName = '我的房间';

    var nameInputBg = this.add.graphics();
    nameInputBg.fillStyle(0x0a0a1a, 0.8);
    nameInputBg.fillRoundedRect(panelX - panelW / 2 + 25, panelY - panelH / 2 + 90, panelW - 50, 40, 8);
    nameInputBg.lineStyle(2, 0x4a4a8a, 0.8);
    nameInputBg.strokeRoundedRect(panelX - panelW / 2 + 25, panelY - panelH / 2 + 90, panelW - 50, 40, 8);
    nameInputBg.setDepth(9001);

    var nameInputTxt = this.add.text(panelX - panelW / 2 + 35, panelY - panelH / 2 + 110, this.newRoomName, {
      fontSize: '15px',
      color: '#ffffff'
    }).setOrigin(0, 0.5).setDepth(9002);

    var trackLabel = this.add.text(panelX - panelW / 2 + 25, panelY - panelH / 2 + 150, '选择赛道', {
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0, 0.5).setDepth(9002);

    var tracks = [1, 2, 3];
    var trackBtns = [];
    var selectedTrack = 1;
    var trackBtnW = (panelW - 60) / 3;

    for (var i = 0; i < tracks.length; i++) {
      var trackId = tracks[i];
      var btnX = panelX - panelW / 2 + 30 + trackBtnW / 2 + i * (trackBtnW + 5);
      var btn = this.createSmallButton(btnX, panelY - panelH / 2 + 190, trackBtnW - 5, 36, '赛道 ' + trackId, trackId === selectedTrack ? 0xffd700 : 0x2a2a5a, (function(tid) {
        return function() {
          selectedTrack = tid;
          for (var j = 0; j < trackBtns.length; j++) {
            var b = trackBtns[j];
            b.setTint(b._trackId === selectedTrack ? 0xffffff : 0xaaaaaa);
          }
        };
      })(trackId));
      btn._trackId = trackId;
      btn.setDepth(9002);
      trackBtns.push(btn);
    }

    var maxPlayersLabel = this.add.text(panelX - panelW / 2 + 25, panelY - panelH / 2 + 230, '最大人数', {
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0, 0.5).setDepth(9002);

    var maxPlayers = 4;
    var maxPlayersTxt = this.add.text(panelX + panelW / 2 - 25, panelY - panelH / 2 + 230, maxPlayers + ' 人', {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#ffd700'
    }).setOrigin(1, 0.5).setDepth(9002);

    function close() {
      overlay.destroy();
      panel.destroy();
      title.destroy();
      roomNameLabel.destroy();
      nameInputBg.destroy();
      nameInputTxt.destroy();
      trackLabel.destroy();
      for (var k = 0; k < trackBtns.length; k++) {
        trackBtns[k].destroy();
      }
      maxPlayersLabel.destroy();
      maxPlayersTxt.destroy();
      if (confirmBtn) confirmBtn.destroy();
      if (cancelBtn) cancelBtn.destroy();
    }

    var confirmBtn = this.createMainButton(panelX - 80, panelY + panelH / 2 - 40, 120, 44, '确认创建', 0x4caf50, function() {
      if (!self.connected) {
        self.showToast('未连接服务器');
        return;
      }
      self.mpManager.createRoom({
        name: self.newRoomName,
        track: selectedTrack,
        maxPlayers: maxPlayers
      });
      close();
    });
    confirmBtn.setDepth(9002);

    var cancelBtn = this.createMainButton(panelX + 80, panelY + panelH / 2 - 40, 120, 44, '取消', 0x757575, function() {
      close();
    });
    cancelBtn.setDepth(9002);
  };

  proto.showEditNameDialog = function() {
    var self = this;
    var width = this.scale.width;
    var height = this.scale.height;

    var overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(9000);

    var panelW = 300;
    var panelH = 200;
    var panelX = width / 2;
    var panelY = height / 2;

    var panel = this.add.graphics();
    panel.fillStyle(0x1a1a3a, 0.98);
    panel.fillRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 16);
    panel.lineStyle(3, 0x2196f3, 1);
    panel.strokeRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 16);
    panel.setDepth(9001);

    var title = this.add.text(panelX, panelY - panelH / 2 + 35, '修改玩家名', {
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

    var nameTxt = this.add.text(panelX - panelW / 2 + 35, panelY, this.playerName, {
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0, 0.5).setDepth(9002);

    function close() {
      overlay.destroy();
      panel.destroy();
      title.destroy();
      inputBg.destroy();
      nameTxt.destroy();
      if (confirmBtn) confirmBtn.destroy();
      if (cancelBtn) cancelBtn.destroy();
    }

    var confirmBtn = this.createMainButton(panelX - 70, panelY + panelH / 2 - 35, 100, 40, '确认', 0x4caf50, function() {
      self.mpManager.setPlayerName(self.playerName);
      close();
    });
    confirmBtn.setDepth(9002);

    var cancelBtn = this.createMainButton(panelX + 70, panelY + panelH / 2 - 35, 100, 40, '取消', 0x757575, function() {
      close();
    });
    cancelBtn.setDepth(9002);
  };

  proto.createMainButton = function(x, y, w, h, label, color, onClick) {
    var self = this;
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
      self.scene.start('MenuScene');
    });

    return container;
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
