(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.MultiplayerResultScene = function() {
    Phaser.Scene.call(this, { key: 'MultiplayerResultScene' });
  };

  MountainRacer.MultiplayerResultScene.prototype = Object.create(Phaser.Scene.prototype);
  MountainRacer.MultiplayerResultScene.prototype.constructor = MountainRacer.MultiplayerResultScene;

  var proto = MountainRacer.MultiplayerResultScene.prototype;

  proto.init = function(data) {
    this.dataManager = MountainRacer.DataManager.getInstance();
    this.dataManager.init();
    this.mpManager = this.dataManager.getMultiplayerManager();
    this.leaderboard = this.dataManager.getMultiplayerLeaderboard();
    this.results = data && data.results ? data.results : [];
    this.myTime = data && data.myTime ? data.myTime : 0;
    this.myRank = data && data.myRank ? data.myRank : 0;
    this.track = data && data.track ? data.track : 1;
    this.resultAlreadyRecorded = !!(data && data.resultAlreadyRecorded);
    this.raceId = data && data.raceId ? data.raceId : null;
  };

  proto.create = function() {
    var width = this.scale.width;
    var height = this.scale.height;

    this.createBackground(width, height);
    this.createTitle(width, height);
    this.createResultsPanel(width, height);
    this.createMyStats(width, height);
    this.createButtons(width, height);

    this.recordResult();
    this.playCelebration();
  };

  proto.createBackground = function(width, height) {
    var bg = this.add.graphics();
    bg.fillGradientStyle(0x0d1117, 0x0d1117, 0x161b22, 0x161b22);
    bg.fillRect(0, 0, width, height);

    for (var i = 0; i < 40; i++) {
      var star = this.add.graphics();
      star.fillStyle(0xffd700, 0.1 + Math.random() * 0.5);
      star.fillCircle(
        Math.random() * width,
        Math.random() * height,
        1 + Math.random() * 2
      );
    }
  };

  proto.createTitle = function(width, height) {
    var titleY = 60;

    var icon = this.myRank === 1 ? '🏆' : (this.myRank <= 3 ? '🎖️' : '🏁');
    var titleText = this.myRank === 1 ? '冠军!' : ('第 ' + this.myRank + ' 名');
    var titleColor = this.myRank === 1 ? '#ffd700' : (this.myRank <= 3 ? '#c0c0c0' : '#ff9800');

    var titleShadow = this.add.text(width / 2 + 3, titleY + 3, icon + ' ' + titleText, {
      fontSize: '42px',
      fontWeight: 'bold',
      color: '#000000'
    }).setOrigin(0.5).setAlpha(0.3);

    var title = this.add.text(width / 2, titleY, icon + ' ' + titleText, {
      fontSize: '42px',
      fontWeight: 'bold',
      color: titleColor,
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.tweens.add({
      targets: [title, titleShadow],
      scale: { from: 0.5, to: 1 },
      duration: 500,
      ease: 'Back.easeOut'
    });

    var subtitle = this.add.text(width / 2, titleY + 50, '比赛结束', {
      fontSize: '18px',
      color: '#aaaaaa'
    }).setOrigin(0.5);
  };

  proto.createResultsPanel = function(width, height) {
    var panelY = 130;
    var panelH = 280;

    var panelBg = this.add.graphics();
    panelBg.fillStyle(0x000000, 0.4);
    panelBg.fillRoundedRect(20, panelY, width - 40, panelH, 12);
    panelBg.lineStyle(2, 0x4a4a8a, 0.8);
    panelBg.strokeRoundedRect(20, panelY, width - 40, panelH, 12);

    var header = this.add.text(width / 2, panelY + 25, '🏁 比赛排名', {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#ff9800'
    }).setOrigin(0.5);

    var listY = panelY + 55;
    var itemH = 40;
    var maxItems = Math.min(this.results.length, 6);

    for (var i = 0; i < maxItems; i++) {
      var result = this.results[i];
      var y = listY + i * (itemH + 4);
      this.createResultItem(width / 2, y, width - 60, itemH, result, i + 1);
    }
  };

  proto.createResultItem = function(x, y, w, h, result, rank) {
    var container = this.add.container(x, y);
    container.setSize(w, h);

    var isMe = result.playerId === this.mpManager.getLocalPlayerId();

    var bg = this.add.graphics();
    var rankColor = 0x2a2a5a;
    if (rank === 1) rankColor = 0xffd700;
    else if (rank === 2) rankColor = 0xc0c0c0;
    else if (rank === 3) rankColor = 0xcd7f32;

    bg.fillStyle(0x1a1a3a, 0.9);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    bg.lineStyle(isMe ? 3 : 2, isMe ? 0x4caf50 : rankColor, isMe ? 0.9 : 0.6);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    container.add(bg);

    var rankIcon = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank;
    var rankTxt = this.add.text(-w / 2 + 20, 0, rankIcon, {
      fontSize: rank <= 3 ? '20px' : '14px',
      fontWeight: 'bold',
      color: rank <= 3 ? '#ffffff' : '#888888'
    }).setOrigin(0, 0.5);
    container.add(rankTxt);

    var nameTxt = this.add.text(-w / 2 + 55, 0, result.playerName + (isMe ? ' (你)' : ''), {
      fontSize: '14px',
      fontWeight: 'bold',
      color: isMe ? '#4caf50' : '#ffffff'
    }).setOrigin(0, 0.5);
    container.add(nameTxt);

    var timeTxt = this.add.text(w / 2 - 15, 0, this.leaderboard.formatTime(result.time), {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#ffd700'
    }).setOrigin(1, 0.5);
    container.add(timeTxt);

    this.tweens.add({
      targets: container,
      alpha: { from: 0, to: 1 },
      x: { from: x - 50, to: x },
      duration: 300,
      delay: i * 100,
      ease: 'Back.easeOut'
    });
  };

  proto.createMyStats = function(width, height) {
    var statsY = 430;

    var statsBg = this.add.graphics();
    statsBg.fillStyle(0x1a1a3a, 0.9);
    statsBg.fillRoundedRect(20, statsY, width - 40, 70, 12);
    statsBg.lineStyle(2, 0xffd700, 0.6);
    statsBg.strokeRoundedRect(20, statsY, width - 40, 70, 12);

    var myBest = this.leaderboard.getMyBestTime(this.track);
    var isNewBest = myBest && this.myTime <= myBest;

    var timeLabel = this.add.text(width / 2 - 100, statsY + 25, '我的用时', {
      fontSize: '12px',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    var timeValue = this.add.text(width / 2 - 100, statsY + 48, this.leaderboard.formatTime(this.myTime), {
      fontSize: '18px',
      fontWeight: 'bold',
      color: isNewBest ? '#4caf50' : '#ffd700'
    }).setOrigin(0.5);

    if (isNewBest) {
      var newBestTxt = this.add.text(width / 2 - 100, statsY + 10, '🌟 新纪录!', {
        fontSize: '11px',
        fontWeight: 'bold',
        color: '#4caf50'
      }).setOrigin(0.5);
    }

    var rankLabel = this.add.text(width / 2, statsY + 25, '本场排名', {
      fontSize: '12px',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    var rankValue = this.add.text(width / 2, statsY + 48, '第 ' + this.myRank + ' 名', {
      fontSize: '18px',
      fontWeight: 'bold',
      color: this.myRank === 1 ? '#ffd700' : '#ffffff'
    }).setOrigin(0.5);

    var trackLabel = this.add.text(width / 2 + 100, statsY + 25, '赛道', {
      fontSize: '12px',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    var trackValue = this.add.text(width / 2 + 100, statsY + 48, '赛道 ' + this.track, {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#2196f3'
    }).setOrigin(0.5);
  };

  proto.createButtons = function(width, height) {
    var self = this;
    var btnY = height - 60;

    var againBtn = this.createMainButton(width / 2 - 100, btnY, 160, 50, '🔄 再来一局', 0x4caf50, function() {
      self.playAgain();
    });

    var lobbyBtn = this.createMainButton(width / 2 + 100, btnY, 160, 50, '🏠 返回大厅', 0xff9800, function() {
      self.backToLobby();
    });
  };

  proto.playAgain = function() {
    this.scene.start('MultiplayerRoomScene');
  };

  proto.backToLobby = function() {
    this.mpManager.leaveRoom();
    this.scene.start('MultiplayerLobbyScene');
  };

  proto.recordResult = function() {
    if (this.resultAlreadyRecorded) return;
    this.leaderboard.recordRaceResult(this.track, this.myRank, this.myTime, this.raceId);
  };

  proto.playCelebration = function() {
    var width = this.scale.width;
    var height = this.scale.height;

    if (this.myRank === 1) {
      for (var i = 0; i < 20; i++) {
        var particle = this.add.text(
          Phaser.Math.Between(50, width - 50),
          height + 50,
          ['🎉', '✨', '⭐', '🌟', '💫'][Phaser.Math.Between(0, 4)],
          { fontSize: Phaser.Math.Between(16, 32) + 'px' }
        ).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
          targets: particle,
          y: Phaser.Math.Between(100, 400),
          alpha: { from: 0, to: 1, yoyo: true },
          duration: Phaser.Math.Between(1000, 2000),
          delay: Phaser.Math.Between(0, 500),
          ease: 'Back.easeOut',
          onComplete: (function(p) {
            return function() {
              if (p) p.destroy();
            };
          })(particle)
        });
      }
    }
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

  window.MountainRacer = MountainRacer;
})();
