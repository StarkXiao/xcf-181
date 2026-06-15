(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.TournamentScene = function() {
    Phaser.Scene.call(this, { key: 'TournamentScene' });
  };

  MountainRacer.TournamentScene.prototype = Object.create(Phaser.Scene.prototype);
  MountainRacer.TournamentScene.prototype.constructor = MountainRacer.TournamentScene;

  var proto = MountainRacer.TournamentScene.prototype;

  proto.init = function(data) {
    this.dataManager = MountainRacer.DataManager.getInstance();
    this.dataManager.init();
    this.tournamentMgr = this.dataManager.getTournamentManager();
    this.currentTab = 'available';
    this.elements = [];
    this.scrollOffset = 0;
  };

  proto.create = function() {
    var width = this.scale.width;
    var height = this.scale.height;

    this.createBackground(width, height);
    this.createHeader(width, height);
    this.createTabNavigation(width, height);
    this.createContentArea(width, height);
    this.loadTabContent(this.currentTab);

    var self = this;
    this.dataManager.on('tournamentRegistered', function() {
      if (self.currentTab === 'available' || self.currentTab === 'my') {
        self.refreshContent();
      }
      self.updateHeader();
    });

    this.dataManager.on('tournamentRewardsClaimed', function() {
      if (self.currentTab === 'rewards' || self.currentTab === 'history') {
        self.refreshContent();
      }
      self.updateHeader();
    });

    this.dataManager.on('ticketsConsumed', function() {
      self.updateHeader();
    });

    this.dataManager.on('ticketsPurchased', function() {
      self.updateHeader();
    });

    this.dataManager.on('dailyFreeTicketsClaimed', function() {
      self.updateHeader();
    });

    this.dataManager.on('tournamentResultSubmitted', function() {
      if (self.currentTab === 'my') {
        self.refreshContent();
      }
    });

    this.dataManager.on('tournamentResultsArchived', function() {
      if (self.currentTab === 'history' || self.currentTab === 'rewards') {
        self.refreshContent();
      }
      self.updateHeader();
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
    headerBg.fillRect(0, 0, width, 80);
    headerBg.lineStyle(2, 0xffd700, 0.8);
    headerBg.lineBetween(0, 80, width, 80);
    this.elements.push(headerBg);

    var backBtn = this.createBackButton(50, 40);
    this.elements.push(backBtn);

    var title = this.add.text(width / 2, 40, '🏟️ 赛事大厅', {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.elements.push(title);

    this.ticketContainer = this.add.container(width - 120, 40);
    this.updateHeader();
    this.elements.push(this.ticketContainer);
  };

  proto.updateHeader = function() {
    if (!this.ticketContainer) return;
    this.ticketContainer.removeAll(true);

    var ticketInfo = this.tournamentMgr.getTicketRegenInfo();
    var text = '🎫 ' + ticketInfo.current + '/' + ticketInfo.max;

    var bg = this.add.graphics();
    bg.fillStyle(0xffd700, 0.15);
    bg.fillRoundedRect(-60, -20, 120, 40, 20);
    bg.lineStyle(2, 0xffd700, 0.8);
    bg.strokeRoundedRect(-60, -20, 120, 40, 20);
    this.ticketContainer.add(bg);

    var ticketText = this.add.text(0, 0, text, {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffd700'
    }).setOrigin(0.5);
    this.ticketContainer.add(ticketText);

    var claimable = this.tournamentMgr.getClaimableRewards();
    if (claimable.length > 0) {
      var rewardBadge = this.add.graphics();
      rewardBadge.fillStyle(0xe94560, 0.95);
      rewardBadge.fillCircle(45, -15, 10);
      this.ticketContainer.add(rewardBadge);

      var badgeNum = this.add.text(45, -15, '' + claimable.length, {
        fontSize: '11px',
        fontWeight: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);
      this.ticketContainer.add(badgeNum);
    }
  };

  proto.createBackButton = function(x, y) {
    var container = this.add.container(x, y);
    container.setSize(60, 40);

    var bg = this.add.graphics();
    bg.fillStyle(0x333366, 0.9);
    bg.fillRoundedRect(-30, -20, 60, 40, 10);
    bg.lineStyle(2, 0xffd700, 0.6);
    bg.strokeRoundedRect(-30, -20, 60, 40, 10);
    container.add(bg);

    var text = this.add.text(0, 0, '← 返回', {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(text);

    var self = this;
    container.setInteractive(
      new Phaser.Geom.Rectangle(-30, -20, 60, 40),
      Phaser.Geom.Rectangle.Contains
    );
    container.on('pointerover', function() { container.setScale(1.05); });
    container.on('pointerout', function() { container.setScale(1); });
    container.on('pointerdown', function() {
      self.tweens.add({
        targets: container,
        scale: 0.95,
        duration: 100,
        yoyo: true,
        onComplete: function() {
          self.scene.start('MenuScene');
        }
      });
    });

    return container;
  };

  proto.createTabNavigation = function(width, height) {
    var tabs = [
      { id: 'available', label: '赛事列表', icon: '🏟️' },
      { id: 'my', label: '我的赛事', icon: '📋' },
      { id: 'rewards', label: '领取奖励', icon: '🎁' },
      { id: 'history', label: '历史记录', icon: '📊' }
    ];

    var tabY = 110;
    var tabWidth = (width - 40) / tabs.length;
    this.tabButtons = {};

    for (var i = 0; i < tabs.length; i++) {
      var tab = tabs[i];
      var x = 20 + tabWidth * i + tabWidth / 2;
      var btn = this.createTabButton(x, tabY, tabWidth - 8, tab, tab.id === this.currentTab);
      this.tabButtons[tab.id] = btn;
      this.elements.push(btn);
    }
  };

  proto.createTabButton = function(x, y, width, tabData, isActive) {
    var container = this.add.container(x, y);
    container.setSize(width, 50);
    container.tabId = tabData.id;

    var bg = this.add.graphics();
    container.bg = bg;

    var updateVisual = function(active) {
      bg.clear();
      if (active) {
        bg.fillStyle(0xffd700, 0.3);
        bg.fillRoundedRect(-width / 2, -25, width, 50, 12);
        bg.lineStyle(3, 0xffd700, 1);
        bg.strokeRoundedRect(-width / 2, -25, width, 50, 12);
      } else {
        bg.fillStyle(0x333366, 0.6);
        bg.fillRoundedRect(-width / 2, -25, width, 50, 12);
        bg.lineStyle(2, 0x666699, 0.6);
        bg.strokeRoundedRect(-width / 2, -25, width, 50, 12);
      }
    };

    updateVisual(isActive);
    container.add(bg);

    var label = this.add.text(0, 0, tabData.icon + ' ' + tabData.label, {
      fontSize: '13px',
      fontWeight: 'bold',
      color: isActive ? '#ffd700' : '#aaaacc'
    }).setOrigin(0.5);
    container.label = label;
    container.add(label);

    var self = this;
    container.setInteractive(
      new Phaser.Geom.Rectangle(-width / 2, -25, width, 50),
      Phaser.Geom.Rectangle.Contains
    );
    container.on('pointerover', function() {
      if (!isActive) container.setScale(1.02);
    });
    container.on('pointerout', function() { container.setScale(1); });
    container.on('pointerdown', function() {
      self.switchTab(tabData.id);
    });

    container.updateActive = function(active) {
      updateVisual(active);
      label.setColor(active ? '#ffd700' : '#aaaacc');
    };

    return container;
  };

  proto.switchTab = function(tabId) {
    if (this.currentTab === tabId) return;
    this.currentTab = tabId;
    this.scrollOffset = 0;

    var ids = Object.keys(this.tabButtons);
    for (var i = 0; i < ids.length; i++) {
      this.tabButtons[ids[i]].updateActive(ids[i] === tabId);
    }
    this.loadTabContent(tabId);
  };

  proto.createContentArea = function(width, height) {
    this.contentY = 155;
    this.contentHeight = height - this.contentY - 20;
    this.contentArea = this.add.container(0, this.contentY);
    this.elements.push(this.contentArea);
  };

  proto.loadTabContent = function(tabId) {
    this.contentArea.removeAll(true);
    this.scrollOffset = 0;

    switch (tabId) {
      case 'available':
        this.loadAvailableTournaments();
        break;
      case 'my':
        this.loadMyTournaments();
        break;
      case 'rewards':
        this.loadRewards();
        break;
      case 'history':
        this.loadHistory();
        break;
    }
  };

  proto.refreshContent = function() {
    this.loadTabContent(this.currentTab);
  };

  // ========================================================================
  // Tab: Available Tournaments
  // ========================================================================

  proto.loadAvailableTournaments = function() {
    var width = this.scale.width;
    var tournaments = this.tournamentMgr.getAvailableTournaments();

    if (tournaments.length === 0) {
      this.showEmptyMessage('暂无可用赛事', '赛事将定期刷新，请稍后再来！');
      this.createTicketShop(width);
      return;
    }

    var y = 10;
    for (var i = 0; i < tournaments.length; i++) {
      var card = this.createTournamentCard(width / 2, this.contentY + y, width - 40, tournaments[i]);
      y += 110;
    }

    y += 20;
    this.createTicketShopAt(width, y);
  };

  proto.createTournamentCard = function(x, y, width, tournament) {
    var container = this.add.container(x, y - this.contentY + this.scrollOffset);
    container.setSize(width, 100);

    var bg = this.add.graphics();
    var statusColors = {
      registration: 0x2d5a27,
      active: 0x1a4a6e,
      upcoming: 0x4a3a1a,
      rewards: 0x4a1a4a
    };
    var bgColor = statusColors[tournament.status] || 0x2a2a4a;
    bg.fillStyle(bgColor, 0.85);
    bg.fillRoundedRect(-width / 2, 0, width, 100, 12);
    bg.lineStyle(2, 0xffd700, 0.4);
    bg.strokeRoundedRect(-width / 2, 0, width, 100, 12);
    container.add(bg);

    var icon = this.add.text(-width / 2 + 20, 15, tournament.icon || '🏟️', {
      fontSize: '32px'
    });
    container.add(icon);

    var name = this.add.text(-width / 2 + 65, 12, tournament.name || '', {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#ffffff'
    });
    container.add(name);

    var statusLabels = {
      registration: '🟢 报名中',
      active: '🔵 进行中',
      upcoming: '🟡 即将开始',
      rewards: '🟣 结算中'
    };
    var statusText = this.add.text(-width / 2 + 65, 38, statusLabels[tournament.status] || tournament.status, {
      fontSize: '13px',
      color: '#cccccc'
    });
    container.add(statusText);

    var ticketCost = this.add.text(-width / 2 + 65, 60, '🎫 x' + (tournament.ticketCost || 1), {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#ffd700'
    });
    container.add(ticketCost);

    var participants = this.add.text(-width / 2 + 160, 60, '👥 ' + (tournament.participantCount || 0) +
      (tournament.maxParticipants > 0 ? '/' + tournament.maxParticipants : ''), {
      fontSize: '13px',
      color: '#aaaacc'
    });
    container.add(participants);

    var timeRemaining = this.tournamentMgr.getPhaseTimeRemaining(tournament.id);
    if (timeRemaining && !timeRemaining.isExpired) {
      var timeText = this.add.text(-width / 2 + 65, 80, '⏱ ' + timeRemaining.phaseName + ' ' + timeRemaining.hours + 'h', {
        fontSize: '12px',
        color: '#88aacc'
      });
      container.add(timeText);
    }

    var isRegistered = !!this.tournamentMgr.getRegistration(tournament.id);
    if (isRegistered) {
      var registeredBadge = this.add.text(width / 2 - 70, 15, '✅ 已报名', {
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#4eff4e'
      });
      container.add(registeredBadge);
    } else if (tournament.status === 'registration') {
      var registerBtn = this.createRegisterButton(width / 2 - 55, 50, tournament);
      container.add(registerBtn);
    }

    var self = this;
    container.setInteractive(
      new Phaser.Geom.Rectangle(-width / 2, 0, width, 100),
      Phaser.Geom.Rectangle.Contains
    );
    container.on('pointerover', function() { container.setScale(1.01); });
    container.on('pointerout', function() { container.setScale(1); });

    this.contentArea.add(container);
    return container;
  };

  proto.createRegisterButton = function(x, y, tournament) {
    var container = this.add.container(x, y);
    container.setSize(90, 36);

    var bg = this.add.graphics();
    bg.fillStyle(0xffd700, 0.9);
    bg.fillRoundedRect(-45, -18, 90, 36, 18);
    container.add(bg);

    var text = this.add.text(0, 0, '立即报名', {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#1a1a2e'
    }).setOrigin(0.5);
    container.add(text);

    var self = this;
    container.setInteractive(
      new Phaser.Geom.Rectangle(-45, -18, 90, 36),
      Phaser.Geom.Rectangle.Contains
    );
    container.on('pointerover', function() { container.setScale(1.08); });
    container.on('pointerout', function() { container.setScale(1); });
    container.on('pointerdown', function() {
      self.tweens.add({
        targets: container,
        scale: 0.92,
        duration: 100,
        yoyo: true,
        onComplete: function() {
          self.handleRegister(tournament.id);
        }
      });
    });

    return container;
  };

  proto.handleRegister = function(tournamentId) {
    var result = this.tournamentMgr.registerForTournament(tournamentId);
    if (result.success) {
      this.showNotification('✅ 报名成功！', 0x2d5a27);
    } else {
      var reasonLabels = {
        conditions_not_met: '❌ 不满足报名条件',
        already_registered: '❌ 已经报名',
        not_in_registration_phase: '❌ 不在报名阶段',
        ticket_consumption_failed: '❌ 门票不足',
        tournament_not_found: '❌ 赛事不存在'
      };
      this.showNotification(reasonLabels[result.reason] || '❌ 报名失败', 0x8b0000);
    }
  };

  // ========================================================================
  // Tab: My Tournaments
  // ========================================================================

  proto.loadMyTournaments = function() {
    var width = this.scale.width;
    var registrations = this.tournamentMgr.getActiveRegistrations();

    if (registrations.length === 0) {
      this.showEmptyMessage('暂无参赛赛事', '去赛事列表报名参加比赛吧！');
      return;
    }

    var y = 10;
    for (var i = 0; i < registrations.length; i++) {
      var reg = registrations[i];
      var tournament = this.tournamentMgr.getTournament(reg.tournamentId);
      if (!tournament) continue;

      var card = this.createMyTournamentCard(width / 2, this.contentY + y, width - 40, reg, tournament);
      y += 140;
    }
  };

  proto.createMyTournamentCard = function(x, y, width, registration, tournament) {
    var container = this.add.container(x, y - this.contentY);
    container.setSize(width, 130);

    var bg = this.add.graphics();
    bg.fillStyle(0x1a4a6e, 0.85);
    bg.fillRoundedRect(-width / 2, 0, width, 130, 12);
    bg.lineStyle(2, 0x4488ff, 0.6);
    bg.strokeRoundedRect(-width / 2, 0, width, 130, 12);
    container.add(bg);

    var name = this.add.text(-width / 2 + 20, 12, tournament.icon + ' ' + tournament.name, {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#ffffff'
    });
    container.add(name);

    var phase = this.tournamentMgr.getCurrentPhase(tournament.id);
    var phaseLabel = phase ? phase.name : '已结束';
    var phaseText = this.add.text(-width / 2 + 20, 40, '当前阶段: ' + phaseLabel, {
      fontSize: '14px',
      color: '#88ccff'
    });
    container.add(phaseText);

    var scoreText = this.add.text(-width / 2 + 20, 62, '最高分: ' + (registration.bestScore || 0), {
      fontSize: '14px',
      color: '#ffd700'
    });
    container.add(scoreText);

    if (phase && phase.attempts > 0) {
      var attemptsText = this.add.text(-width / 2 + 20, 84,
        '尝试次数: ' + registration.attemptsUsed + '/' + phase.attempts, {
        fontSize: '13px',
        color: '#aaaacc'
      });
      container.add(attemptsText);
    }

    if (phase && phase.id !== 'registration' && phase.id !== 'rewards') {
      var runBtn = this.createStartRunButton(width / 2 - 60, 105, tournament.id);
      container.add(runBtn);
    }

    this.contentArea.add(container);
    return container;
  };

  proto.createStartRunButton = function(x, y, tournamentId) {
    var container = this.add.container(x, y);
    container.setSize(100, 32);

    var bg = this.add.graphics();
    bg.fillStyle(0x4488ff, 0.9);
    bg.fillRoundedRect(-50, -16, 100, 32, 16);
    container.add(bg);

    var text = this.add.text(0, 0, '🚗 开始比赛', {
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(text);

    var self = this;
    container.setInteractive(
      new Phaser.Geom.Rectangle(-50, -16, 100, 32),
      Phaser.Geom.Rectangle.Contains
    );
    container.on('pointerover', function() { container.setScale(1.06); });
    container.on('pointerout', function() { container.setScale(1); });
    container.on('pointerdown', function() {
      var result = self.tournamentMgr.startTournamentRun(tournamentId);
      if (result.success) {
        self.scene.start('GameScene', { tournamentMode: true, tournamentId: tournamentId });
      } else {
        self.showNotification('❌ ' + result.reason, 0x8b0000);
      }
    });

    return container;
  };

  // ========================================================================
  // Tab: Rewards
  // ========================================================================

  proto.loadRewards = function() {
    var width = this.scale.width;
    var claimable = this.tournamentMgr.getClaimableRewards();

    if (claimable.length === 0) {
      this.showEmptyMessage('暂无可领取奖励', '完成赛事后奖励将出现在这里');
      return;
    }

    var y = 10;
    for (var i = 0; i < claimable.length; i++) {
      var card = this.createRewardCard(width / 2, this.contentY + y, width - 40, claimable[i]);
      y += 140;
    }
  };

  proto.createRewardCard = function(x, y, width, rewardInfo) {
    var container = this.add.container(x, y - this.contentY);
    container.setSize(width, 130);

    var bg = this.add.graphics();
    bg.fillStyle(0x3a1a4a, 0.85);
    bg.fillRoundedRect(-width / 2, 0, width, 130, 12);
    bg.lineStyle(2, 0xff6bff, 0.7);
    bg.strokeRoundedRect(-width / 2, 0, width, 130, 12);
    container.add(bg);

    var name = this.add.text(-width / 2 + 20, 12, '🏆 ' + (rewardInfo.tournamentName || ''), {
      fontSize: '17px',
      fontWeight: 'bold',
      color: '#ffffff'
    });
    container.add(name);

    var rankText = this.add.text(-width / 2 + 20, 38,
      '排名: #' + (rewardInfo.rank || '-') + ' (' + (rewardInfo.rankBucket || '') + ')', {
      fontSize: '15px',
      color: '#ffd700'
    });
    container.add(rankText);

    var reward = rewardInfo.eligibleReward || {};
    var rewardParts = [];
    if (reward.coins) rewardParts.push('💰 ' + reward.coins);
    if (reward.seasonXP) rewardParts.push('⭐ ' + reward.seasonXP + 'XP');
    if (reward.parts && reward.parts.length) rewardParts.push('🔧 x' + reward.parts.length);
    if (reward.cars && reward.cars.length) rewardParts.push('🚗 x' + reward.cars.length);
    if (reward.title) rewardParts.push('🏅 称号');

    var rewardDesc = this.add.text(-width / 2 + 20, 62, rewardParts.join('  '), {
      fontSize: '13px',
      color: '#cccccc'
    });
    container.add(rewardDesc);

    var claimBtn = this.createClaimButton(width / 2 - 55, 100, rewardInfo.tournamentId);
    container.add(claimBtn);

    this.contentArea.add(container);
    return container;
  };

  proto.createClaimButton = function(x, y, tournamentId) {
    var container = this.add.container(x, y);
    container.setSize(100, 36);

    var bg = this.add.graphics();
    bg.fillStyle(0xffd700, 0.95);
    bg.fillRoundedRect(-50, -18, 100, 36, 18);
    container.add(bg);

    var text = this.add.text(0, 0, '🎁 领取', {
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#1a1a2e'
    }).setOrigin(0.5);
    container.add(text);

    var self = this;
    container.setInteractive(
      new Phaser.Geom.Rectangle(-50, -18, 100, 36),
      Phaser.Geom.Rectangle.Contains
    );
    container.on('pointerover', function() { container.setScale(1.08); });
    container.on('pointerout', function() { container.setScale(1); });
    container.on('pointerdown', function() {
      self.tweens.add({
        targets: container,
        scale: 0.92,
        duration: 100,
        yoyo: true,
        onComplete: function() {
          var result = self.tournamentMgr.claimTournamentRewards(tournamentId);
          if (result.success) {
            self.showNotification('🎉 奖励已领取！', 0x2d5a27);
          } else {
            self.showNotification('❌ 领取失败', 0x8b0000);
          }
        }
      });
    });

    return container;
  };

  // ========================================================================
  // Tab: History
  // ========================================================================

  proto.loadHistory = function() {
    var width = this.scale.width;
    var history = this.tournamentMgr.getTournamentHistory(20);

    if (history.length === 0) {
      this.showEmptyMessage('暂无历史记录', '参加赛事后记录将出现在这里');
      return;
    }

    var stats = this.tournamentMgr.getPlayerStats();
    var statsY = 10;
    this.createStatsPanel(width / 2, statsY, width - 40, stats);

    var y = 90;
    for (var i = 0; i < history.length; i++) {
      var card = this.createHistoryCard(width / 2, y, width - 40, history[i]);
      y += 80;
    }
  };

  proto.createStatsPanel = function(x, y, width, stats) {
    var container = this.add.container(x, y);
    container.setSize(width, 70);

    var bg = this.add.graphics();
    bg.fillStyle(0x2a2a4a, 0.85);
    bg.fillRoundedRect(-width / 2, 0, width, 70, 10);
    bg.lineStyle(1, 0xffd700, 0.3);
    bg.strokeRoundedRect(-width / 2, 0, width, 70, 10);
    container.add(bg);

    var statsItems = [
      { label: '参赛次数', value: '' + (stats.totalParticipations || 0) },
      { label: '冠军次数', value: '' + (stats.totalWins || 0) },
      { label: '最佳排名', value: stats.bestRank ? '#' + stats.bestRank : '-' },
      { label: '总赚金币', value: '' + (stats.totalCoinsEarned || 0) }
    ];

    var itemWidth = width / statsItems.length;
    for (var i = 0; i < statsItems.length; i++) {
      var itemX = -width / 2 + itemWidth * i + itemWidth / 2;
      var label = this.add.text(itemX, 22, statsItems[i].label, {
        fontSize: '11px',
        color: '#aaaacc'
      }).setOrigin(0.5);
      container.add(label);

      var value = this.add.text(itemX, 45, statsItems[i].value, {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#ffd700'
      }).setOrigin(0.5);
      container.add(value);
    }

    this.contentArea.add(container);
    return container;
  };

  proto.createHistoryCard = function(x, y, width, entry) {
    var container = this.add.container(x, y);
    container.setSize(width, 70);

    var bg = this.add.graphics();
    bg.fillStyle(0x222244, 0.85);
    bg.fillRoundedRect(-width / 2, 0, width, 70, 10);
    container.add(bg);

    var name = this.add.text(-width / 2 + 15, 10, entry.tournamentName || '', {
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#ffffff'
    });
    container.add(name);

    var rankLabel = entry.rank === 1 ? '🏆' : entry.rank <= 3 ? '🥈🥉' : '📊';
    var rank = this.add.text(-width / 2 + 15, 35, rankLabel + ' 排名 #' + (entry.rank || '-'), {
      fontSize: '13px',
      color: entry.rank === 1 ? '#ffd700' : entry.rank <= 3 ? '#c0c0c0' : '#aaaacc'
    });
    container.add(rank);

    var scoreText = this.add.text(-width / 2 + 15, 52, '最高分: ' + (entry.bestScore || 0), {
      fontSize: '12px',
      color: '#888899'
    });
    container.add(scoreText);

    if (entry.rewardsClaimed) {
      var claimed = this.add.text(width / 2 - 70, 10, '✅ 已领取', {
        fontSize: '12px',
        color: '#4eff4e'
      });
      container.add(claimed);
    }

    this.contentArea.add(container);
    return container;
  };

  // ========================================================================
  // Ticket Shop
  // ========================================================================

  proto.createTicketShop = function(width) {
    this.createTicketShopAt(width, 10);
  };

  proto.createTicketShopAt = function(width, y) {
    var container = this.add.container(width / 2, y);
    container.setSize(width - 40, 120);

    var bg = this.add.graphics();
    bg.fillStyle(0x2a2a1a, 0.85);
    bg.fillRoundedRect(-(width - 40) / 2, 0, width - 40, 120, 12);
    bg.lineStyle(2, 0xffd700, 0.4);
    bg.strokeRoundedRect(-(width - 40) / 2, 0, width - 40, 120, 12);
    container.add(bg);

    var shopTitle = this.add.text(0, 15, '🎫 门票商店', {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffd700'
    }).setOrigin(0.5);
    container.add(shopTitle);

    var ticketInfo = this.tournamentMgr.getTicketRegenInfo();
    var info = this.add.text(0, 40, '当前: ' + ticketInfo.current + '/' + ticketInfo.max +
      (ticketInfo.isFull ? ' (已满)' : ' | ' + ticketInfo.nextRegenMinutes + '分钟后恢复'), {
      fontSize: '13px',
      color: '#cccccc'
    }).setOrigin(0.5);
    container.add(info);

    var self = this;
    var buyBtnX = -70;
    var buyBtn = this.add.container(buyBtnX, 80);
    buyBtn.setSize(120, 32);

    var buyBg = this.add.graphics();
    buyBg.fillStyle(0xffd700, 0.9);
    buyBg.fillRoundedRect(-60, -16, 120, 32, 16);
    buyBtn.add(buyBg);

    var buyText = this.add.text(0, 0, '💰 200金币/张', {
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#1a1a2e'
    }).setOrigin(0.5);
    buyBtn.add(buyText);

    buyBtn.setInteractive(
      new Phaser.Geom.Rectangle(-60, -16, 120, 32),
      Phaser.Geom.Rectangle.Contains
    );
    buyBtn.on('pointerover', function() { buyBtn.setScale(1.06); });
    buyBtn.on('pointerout', function() { buyBtn.setScale(1); });
    buyBtn.on('pointerdown', function() {
      var result = self.tournamentMgr.purchaseTickets(1);
      if (result.success) {
        self.showNotification('✅ 购买成功！+1门票', 0x2d5a27);
      } else {
        self.showNotification('❌ 金币不足', 0x8b0000);
      }
    });
    container.add(buyBtn);

    var freeBtnX = 70;
    var freeBtn = this.add.container(freeBtnX, 80);
    freeBtn.setSize(120, 32);

    var freeBg = this.add.graphics();
    var canClaimFree = !ticketInfo.dailyFreeClaimed;
    freeBg.fillStyle(canClaimFree ? 0x4eff4e : 0x666666, 0.9);
    freeBg.fillRoundedRect(-60, -16, 120, 32, 16);
    freeBtn.add(freeBg);

    var freeText = this.add.text(0, 0, canClaimFree ? '🎁 领取每日' : '✅ 已领取', {
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#1a1a2e'
    }).setOrigin(0.5);
    freeBtn.add(freeText);

    if (canClaimFree) {
      freeBtn.setInteractive(
        new Phaser.Geom.Rectangle(-60, -16, 120, 32),
        Phaser.Geom.Rectangle.Contains
      );
      freeBtn.on('pointerover', function() { freeBtn.setScale(1.06); });
      freeBtn.on('pointerout', function() { freeBtn.setScale(1); });
      freeBtn.on('pointerdown', function() {
        var result = self.tournamentMgr.claimDailyFreeTickets();
        if (result.success) {
          self.showNotification('🎁 +' + result.ticketsAdded + ' 每日门票！', 0x2d5a27);
        } else {
          self.showNotification('❌ 今日已领取', 0x8b0000);
        }
      });
    }
    container.add(freeBtn);

    this.contentArea.add(container);
    return container;
  };

  // ========================================================================
  // Common UI
  // ========================================================================

  proto.showEmptyMessage = function(title, subtitle) {
    var width = this.scale.width;

    var emptyTitle = this.add.text(width / 2, 50, title, {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#aaaacc'
    }).setOrigin(0.5);
    this.contentArea.add(emptyTitle);

    var emptySub = this.add.text(width / 2, 80, subtitle, {
      fontSize: '14px',
      color: '#666688'
    }).setOrigin(0.5);
    this.contentArea.add(emptySub);
  };

  proto.showNotification = function(message, color) {
    var width = this.scale.width;
    var height = this.scale.height;

    var notif = this.add.container(width / 2, height - 60);

    var bg = this.add.graphics();
    bg.fillStyle(color || 0x333366, 0.95);
    bg.fillRoundedRect(-150, -18, 300, 36, 18);
    notif.add(bg);

    var text = this.add.text(0, 0, message, {
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    notif.add(text);

    this.tweens.add({
      targets: notif,
      alpha: 0,
      y: height - 100,
      duration: 2500,
      ease: 'Power2',
      delay: 500
    });
  };

  window.MountainRacer = MountainRacer;
})();
