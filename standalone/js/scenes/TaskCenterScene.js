(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.TaskCenterScene = function() {
    Phaser.Scene.call(this, { key: 'TaskCenterScene' });
  };

  MountainRacer.TaskCenterScene.prototype = Object.create(Phaser.Scene.prototype);
  MountainRacer.TaskCenterScene.prototype.constructor = MountainRacer.TaskCenterScene;

  var proto = MountainRacer.TaskCenterScene.prototype;

  proto.init = function(data) {
    this.dataManager = MountainRacer.DataManager.getInstance();
    this.dataManager.init();
    this.taskCenter = this.dataManager.getTaskCenterManager();
    this.currentTab = 'daily';
    this.elements = [];
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
    this.dataManager.on('dailyRewardClaimed', function() {
      if (self.currentTab === 'daily') {
        self.refreshContent();
      }
      self.updateHeader();
    });

    this.dataManager.on('stageRewardClaimed', function() {
      if (self.currentTab === 'stages') {
        self.refreshContent();
      }
      self.updateHeader();
    });

    this.dataManager.on('achievementsUnlocked', function() {
      if (self.currentTab === 'achievements') {
        self.refreshContent();
      }
      self.updateHeader();
    });
  };

  proto.createBackground = function(width, height) {
    var bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e);
    bg.fillRect(0, 0, width, height);

    for (var i = 0; i < 20; i++) {
      var star = this.add.graphics();
      star.fillStyle(0xffffff, 0.3 + Math.random() * 0.5);
      star.fillCircle(
        Math.random() * width,
        Math.random() * height,
        1 + Math.random() * 2
      );
    }
  };

  proto.createHeader = function(width, height) {
    var headerBg = this.add.graphics();
    headerBg.fillStyle(0x0f3460, 0.95);
    headerBg.fillRect(0, 0, width, 80);
    headerBg.lineStyle(2, 0xe94560, 0.8);
    headerBg.lineBetween(0, 80, width, 80);
    this.elements.push(headerBg);

    var backBtn = this.createBackButton(50, 40);
    this.elements.push(backBtn);

    var title = this.add.text(width / 2, 40, '📋 任务中心', {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.elements.push(title);

    this.summaryContainer = this.add.container(width - 120, 40);
    this.updateHeader();
    this.elements.push(this.summaryContainer);
  };

  proto.updateHeader = function() {
    if (!this.summaryContainer) return;
    this.summaryContainer.removeAll(true);

    var summary = this.taskCenter.getSummary();
    var hasClaimable = summary.totalClaimable > 0;

    var badgeBg = this.add.graphics();
    badgeBg.fillStyle(hasClaimable ? 0xe94560 : 0x533483, 0.9);
    badgeBg.fillRoundedRect(-60, -20, 120, 40, 20);
    badgeBg.lineStyle(2, hasClaimable ? 0xff6b6b : 0x7b2cbf, 0.8);
    badgeBg.strokeRoundedRect(-60, -20, 120, 40, 20);
    this.summaryContainer.add(badgeBg);

    var badgeText = this.add.text(0, 0, '🎁 ' + summary.totalClaimable, {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.summaryContainer.add(badgeText);

    if (hasClaimable) {
      this.tweens.add({
        targets: [badgeBg, badgeText],
        scale: 1.05,
        duration: 800,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      });
    }
  };

  proto.createBackButton = function(x, y) {
    var container = this.add.container(x, y);
    container.setSize(60, 40);

    var bg = this.add.graphics();
    bg.fillStyle(0x533483, 0.9);
    bg.fillRoundedRect(-30, -20, 60, 40, 10);
    bg.lineStyle(2, 0x7b2cbf, 0.8);
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
      { id: 'daily', label: '每日挑战', icon: '📅' },
      { id: 'achievements', label: '成就', icon: '🏆' },
      { id: 'stages', label: '阶段奖励', icon: '🎁' }
    ];

    var tabY = 110;
    var tabWidth = (width - 40) / tabs.length;
    this.tabButtons = {};

    for (var i = 0; i < tabs.length; i++) {
      var tab = tabs[i];
      var x = 20 + tabWidth * i + tabWidth / 2;
      var btn = this.createTabButton(x, tabY, tabWidth - 10, tab, tab.id === this.currentTab);
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
        bg.fillStyle(0xe94560, 0.95);
        bg.fillRoundedRect(-width / 2, -25, width, 50, 12);
        bg.lineStyle(3, 0xff6b6b, 1);
        bg.strokeRoundedRect(-width / 2, -25, width, 50, 12);
      } else {
        bg.fillStyle(0x533483, 0.7);
        bg.fillRoundedRect(-width / 2, -25, width, 50, 12);
        bg.lineStyle(2, 0x7b2cbf, 0.6);
        bg.strokeRoundedRect(-width / 2, -25, width, 50, 12);
      }
    };

    updateVisual(isActive);
    container.add(bg);

    var icon = this.add.text(-width / 4, 0, tabData.icon, {
      fontSize: '20px'
    }).setOrigin(0.5);
    container.add(icon);

    var label = this.add.text(width / 8, 0, tabData.label, {
      fontSize: '15px',
      fontWeight: 'bold',
      color: isActive ? '#ffffff' : '#cccccc'
    }).setOrigin(0, 0.5);
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
    container.on('pointerout', function() {
      container.setScale(1);
    });
    container.on('pointerdown', function() {
      self.switchTab(tabData.id);
    });

    container.updateActive = function(active) {
      updateVisual(active);
      label.setColor(active ? '#ffffff' : '#cccccc');
    };

    return container;
  };

  proto.switchTab = function(tabId) {
    if (this.currentTab === tabId) return;

    this.currentTab = tabId;

    var ids = Object.keys(this.tabButtons);
    for (var i = 0; i < ids.length; i++) {
      this.tabButtons[ids[i]].updateActive(ids[i] === tabId);
    }

    this.loadTabContent(tabId);
  };

  proto.createContentArea = function(width, height) {
    this.contentY = 150;
    this.contentHeight = height - this.contentY - 30;
    this.contentArea = this.add.container(0, this.contentY);
    this.elements.push(this.contentArea);
  };

  proto.loadTabContent = function(tabId) {
    this.contentArea.removeAll(true);

    switch (tabId) {
      case 'daily':
        this.loadDailyChallenges();
        break;
      case 'achievements':
        this.loadAchievements();
        break;
      case 'stages':
        this.loadStageRewards();
        break;
    }
  };

  proto.refreshContent = function() {
    this.loadTabContent(this.currentTab);
  };

  proto.loadDailyChallenges = function() {
    var width = this.scale.width;
    var challenges = this.taskCenter.getDailyChallenges(true);

    var today = new Date();
    var dateStr = today.getFullYear() + '年' + (today.getMonth() + 1) + '月' + today.getDate() + '日';
    var dateText = this.add.text(width / 2, 10, '📅 ' + dateStr + ' 每日挑战', {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#ffd700'
    }).setOrigin(0.5);
    this.contentArea.add(dateText);

    var refreshBtn = this.createRefreshButton(width - 50, 10);
    this.contentArea.add(refreshBtn);

    var cardY = 50;
    var cardGap = 120;

    for (var i = 0; i < challenges.length; i++) {
      var card = this.createDailyChallengeCard(challenges[i], width / 2, cardY + i * cardGap, width - 40);
      this.contentArea.add(card);
    }

    if (challenges.length === 0) {
      var emptyText = this.add.text(width / 2, 150, '暂无每日挑战', {
        fontSize: '20px',
        color: '#888888'
      }).setOrigin(0.5);
      this.contentArea.add(emptyText);
    }
  };

  proto.createRefreshButton = function(x, y) {
    var container = this.add.container(x, y);
    container.setSize(40, 40);

    var bg = this.add.graphics();
    bg.fillStyle(0x4caf50, 0.9);
    bg.fillRoundedRect(-20, -20, 40, 40, 20);
    bg.lineStyle(2, 0x81c784, 0.8);
    bg.strokeRoundedRect(-20, -20, 40, 40, 20);
    container.add(bg);

    var icon = this.add.text(0, 0, '🔄', {
      fontSize: '20px'
    }).setOrigin(0.5);
    container.add(icon);

    var self = this;
    container.setInteractive(
      new Phaser.Geom.Rectangle(-20, -20, 40, 40),
      Phaser.Geom.Rectangle.Contains
    );
    container.on('pointerover', function() { container.setScale(1.1); });
    container.on('pointerout', function() { container.setScale(1); });
    container.on('pointerdown', function() {
      self.tweens.add({
        targets: icon,
        angle: 360,
        duration: 500,
        ease: 'Linear'
      });
      self.taskCenter.refreshAll();
      setTimeout(function() {
        self.refreshContent();
        self.updateHeader();
      }, 600);
    });

    return container;
  };

  proto.createDailyChallengeCard = function(challenge, x, y, width) {
    var container = this.add.container(x, y);
    container.setSize(width, 100);

    var isCompleteAll = challenge.claimedTiers.length >= challenge.maxTier;
    var cardColor = isCompleteAll ? 0x2e7d32 : 0x1a237e;
    var borderColor = isCompleteAll ? 0x66bb6a : 0x3949ab;

    var bg = this.add.graphics();
    bg.fillStyle(cardColor, 0.85);
    bg.fillRoundedRect(-width / 2, -50, width, 100, 15);
    bg.lineStyle(2, borderColor, 0.9);
    bg.strokeRoundedRect(-width / 2, -50, width, 100, 15);
    container.add(bg);

    var iconBg = this.add.graphics();
    iconBg.fillStyle(0xffffff, 0.15);
    iconBg.fillCircle(-width / 2 + 50, 0, 35);
    container.add(iconBg);

    var icon = this.add.text(-width / 2 + 50, 0, challenge.icon, {
      fontSize: '32px'
    }).setOrigin(0.5);
    container.add(icon);

    var title = this.add.text(-width / 2 + 100, -25, challenge.title, {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0, 0.5);
    container.add(title);

    var desc = this.add.text(-width / 2 + 100, 0, challenge.description, {
      fontSize: '14px',
      color: '#cccccc'
    }).setOrigin(0, 0.5);
    container.add(desc);

    var tierY = 25;
    for (var t = 0; t < challenge.targets.length; t++) {
      var target = challenge.targets[t];
      var isComplete = challenge.progress >= target;
      var isClaimed = challenge.claimedTiers.indexOf(t) !== -1;
      var reward = challenge.rewards[t];

      var tierX = -width / 2 + 100 + t * 110;

      var tierBg = this.add.graphics();
      if (isClaimed) {
        tierBg.fillStyle(0x4caf50, 0.8);
      } else if (isComplete) {
        tierBg.fillStyle(0xff9800, 0.9);
      } else {
        tierBg.fillStyle(0x333333, 0.6);
      }
      tierBg.fillRoundedRect(tierX, tierY - 12, 100, 24, 12);
      container.add(tierBg);

      var tierText = this.add.text(tierX + 50, tierY,
        '🎯' + target + (isClaimed ? ' ✅' : (isComplete ? ' 领取' : '')), {
        fontSize: '12px',
        fontWeight: 'bold',
        color: isClaimed ? '#ffffff' : (isComplete ? '#ffffff' : '#888888')
      }).setOrigin(0.5);
      container.add(tierText);

      var rewardText = this.add.text(tierX + 50, tierY + 18,
        '💰' + reward.coins + ' ⚡' + (reward.seasonXP || 0), {
        fontSize: '10px',
        color: isClaimed ? '#81c784' : (isComplete ? '#ffb74d' : '#666666')
      }).setOrigin(0.5);
      container.add(rewardText);

      if (isComplete && !isClaimed) {
        tierBg.setInteractive(
          new Phaser.Geom.Rectangle(tierX, tierY - 12, 100, 24),
          Phaser.Geom.Rectangle.Contains
        );
        var self = this;
        tierBg.on('pointerover', function() { this.setScale(1.05); });
        tierBg.on('pointerout', function() { this.setScale(1); });
        (function(challengeId, tierIdx) {
          tierBg.on('pointerdown', function() {
            var result = self.taskCenter.claimDailyReward(challengeId, tierIdx);
            if (result.success) {
              self.showRewardPopup(result.reward, result.challenge.title + ' 第' + (tierIdx + 1) + '阶段');
            }
          });
        })(challenge.id, t);
      }
    }

    var progressWidth = width - 150;
    var progressX = width / 2 - progressWidth / 2;
    var progBg = this.add.graphics();
    progBg.fillStyle(0x000000, 0.4);
    progBg.fillRoundedRect(progressX, -38, progressWidth, 8, 4);
    container.add(progBg);

    var maxTarget = challenge.targets[challenge.targets.length - 1];
    var progressPercent = Math.min(100, (challenge.progress / maxTarget) * 100);
    var progFill = this.add.graphics();
    progFill.fillGradientStyle(0xff9800, 0xf57c00, 0xff9800, 0xf57c00);
    progFill.fillRoundedRect(progressX, -38, (progressPercent / 100) * progressWidth, 8, 4);
    container.add(progFill);

    var progText = this.add.text(width / 2 - progressWidth / 2 + progressWidth / 2, -38,
      challenge.progress + ' / ' + maxTarget + ' (' + Math.floor(progressPercent) + '%)', {
      fontSize: '11px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(progText);

    return container;
  };

  proto.loadAchievements = function() {
    var width = this.scale.width;
    var achievements = this.taskCenter.getAchievements();

    var unlocked = achievements.filter(function(a) { return a.unlocked; }).length;
    var total = achievements.length;

    var headerBg = this.add.graphics();
    headerBg.fillStyle(0x533483, 0.6);
    headerBg.fillRoundedRect(20, 0, width - 40, 50, 12);
    this.contentArea.add(headerBg);

    var progressText = this.add.text(width / 2, 25,
      '🏆 成就进度: ' + unlocked + ' / ' + total + ' (' + Math.floor((unlocked / total) * 100) + '%)', {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#ffd700'
    }).setOrigin(0.5);
    this.contentArea.add(progressText);

    var categories = ['legendary', 'epic', 'rare', 'common'];
    var categoryLabels = {
      legendary: '🌟 传说',
      epic: '💜 史诗',
      rare: '💙 稀有',
      common: '⚪ 普通'
    };

    var y = 70;
    var categoryGap = 15;

    for (var c = 0; c < categories.length; c++) {
      var rarity = categories[c];
      var rarityAchievements = achievements.filter(function(a) { return a.rarity === rarity; });

      if (rarityAchievements.length === 0) continue;

      var catLabel = this.add.text(30, y, categoryLabels[rarity], {
        fontSize: '16px',
        fontWeight: 'bold',
        color: MountainRacer.TaskCenterConfig.getRarityConfig(rarity).color
      }).setOrigin(0, 0.5);
      this.contentArea.add(catLabel);
      y += 35;

      for (var a = 0; a < rarityAchievements.length; a++) {
        var ach = rarityAchievements[a];
        var card = this.createAchievementCard(ach, width / 2, y, width - 60);
        this.contentArea.add(card);
        y += 85;
      }

      y += categoryGap;
    }
  };

  proto.createAchievementCard = function(achievement, x, y, width) {
    var container = this.add.container(x, y);
    container.setSize(width, 75);

    var rarityConfig = MountainRacer.TaskCenterConfig.getRarityConfig(achievement.rarity);
    var isUnlocked = achievement.unlocked;

    var bg = this.add.graphics();
    if (isUnlocked) {
      bg.fillStyle(0x2e7d32, 0.7);
      bg.lineStyle(2, rarityConfig.color, 1);
    } else {
      bg.fillStyle(0x424242, 0.6);
      bg.lineStyle(2, 0x616161, 0.6);
    }
    bg.fillRoundedRect(-width / 2, -35, width, 70, 12);
    bg.strokeRoundedRect(-width / 2, -35, width, 70, 12);
    container.add(bg);

    var iconBg = this.add.graphics();
    iconBg.fillStyle(isUnlocked ? rarityConfig.color : 0x616161, isUnlocked ? 0.3 : 0.2);
    iconBg.fillCircle(-width / 2 + 45, 0, 28);
    container.add(iconBg);

    var icon = this.add.text(-width / 2 + 45, 0, isUnlocked ? achievement.icon : '🔒', {
      fontSize: '28px'
    }).setOrigin(0.5);
    container.add(icon);

    var title = this.add.text(-width / 2 + 90, -18, achievement.title, {
      fontSize: '16px',
      fontWeight: 'bold',
      color: isUnlocked ? '#ffffff' : '#888888'
    }).setOrigin(0, 0.5);
    container.add(title);

    var rarityBadge = this.add.text(width / 2 - 90, -18, rarityConfig.name, {
      fontSize: '12px',
      fontWeight: 'bold',
      color: rarityConfig.color
    }).setOrigin(1, 0.5);
    container.add(rarityBadge);

    var desc = this.add.text(-width / 2 + 90, 5, achievement.description, {
      fontSize: '13px',
      color: isUnlocked ? '#cccccc' : '#666666'
    }).setOrigin(0, 0.5);
    container.add(desc);

    if (!isUnlocked) {
      var progressWidth = width - 200;
      var progressX = -width / 2 + 90;
      var progBg = this.add.graphics();
      progBg.fillStyle(0x000000, 0.4);
      progBg.fillRoundedRect(progressX, 20, progressWidth, 8, 4);
      container.add(progBg);

      var progFill = this.add.graphics();
      progFill.fillStyle(0x2196f3, 0.8);
      progFill.fillRoundedRect(progressX, 20, (achievement.percent / 100) * progressWidth, 8, 4);
      container.add(progFill);

      var progText = this.add.text(progressX + progressWidth / 2, 24,
        achievement.progress + ' / ' + achievement.target + ' (' + achievement.percent + '%)', {
        fontSize: '10px',
        fontWeight: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);
      container.add(progText);
    } else {
      var reward = achievement.reward;
      if (reward) {
        var rewardText = this.add.text(-width / 2 + 90, 22,
          '奖励: 💰' + (reward.coins || 0) + (reward.seasonXP ? ' ⚡' + reward.seasonXP : ''), {
          fontSize: '12px',
          color: '#81c784'
        }).setOrigin(0, 0.5);
        container.add(rewardText);
      }
    }

    return container;
  };

  proto.loadStageRewards = function() {
    var width = this.scale.width;
    var stages = this.taskCenter.getStageRewards();

    var currentProgress = stages.length > 0 ? stages[0].currentProgress : 0;
    var headerText = this.add.text(width / 2, 20,
      '🎁 阶段奖励  |  已完成任务: ' + currentProgress, {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#ffd700'
    }).setOrigin(0.5);
    this.contentArea.add(headerText);

    var progressWidth = width - 100;
    var progressX = width / 2 - progressWidth / 2;
    var progBg = this.add.graphics();
    progBg.fillStyle(0x000000, 0.4);
    progBg.fillRoundedRect(progressX, 50, progressWidth, 16, 8);
    this.contentArea.add(progBg);

    var maxRequired = stages[stages.length - 1].requiredTasks;
    var overallPercent = Math.min(100, (currentProgress / maxRequired) * 100);
    var progFill = this.add.graphics();
    progFill.fillGradientStyle(0xff6b35, 0xe65100, 0xff6b35, 0xe65100);
    progFill.fillRoundedRect(progressX, 50, (overallPercent / 100) * progressWidth, 16, 8);
    this.contentArea.add(progFill);

    for (var s = 0; s < stages.length; s++) {
      var stage = stages[s];
      var markerX = progressX + (stage.requiredTasks / maxRequired) * progressWidth;
      var marker = this.add.graphics();
      if (stage.claimed) {
        marker.fillStyle(0x4caf50, 1);
      } else if (stage.canClaim) {
        marker.fillStyle(0xff9800, 1);
      } else {
        marker.fillStyle(0x666666, 0.8);
      }
      marker.fillCircle(markerX, 58, 8);
      this.contentArea.add(marker);

      var markerLabel = this.add.text(markerX, 78, stage.requiredTasks, {
        fontSize: '11px',
        fontWeight: 'bold',
        color: stage.claimed ? '#4caf50' : (stage.canClaim ? '#ff9800' : '#888888')
      }).setOrigin(0.5);
      this.contentArea.add(markerLabel);
    }

    var cardY = 115;
    var cardGap = 90;

    for (var i = 0; i < stages.length; i++) {
      var card = this.createStageRewardCard(stages[i], width / 2, cardY + i * cardGap, width - 40);
      this.contentArea.add(card);
    }
  };

  proto.createStageRewardCard = function(stage, x, y, width) {
    var container = this.add.container(x, y);
    container.setSize(width, 80);

    var bg = this.add.graphics();
    if (stage.claimed) {
      bg.fillStyle(0x2e7d32, 0.7);
      bg.lineStyle(2, 0x66bb6a, 0.9);
    } else if (stage.canClaim) {
      bg.fillStyle(0xff6f00, 0.85);
      bg.lineStyle(3, 0xffb74d, 1);
    } else {
      bg.fillStyle(0x424242, 0.6);
      bg.lineStyle(2, 0x616161, 0.6);
    }
    bg.fillRoundedRect(-width / 2, -38, width, 76, 15);
    bg.strokeRoundedRect(-width / 2, -38, width, 76, 15);
    container.add(bg);

    if (stage.canClaim && !stage.claimed) {
      this.tweens.add({
        targets: bg,
        scale: 1.02,
        duration: 1000,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      });
    }

    var iconBg = this.add.graphics();
    iconBg.fillStyle(stage.claimed ? 0x66bb6a : (stage.canClaim ? 0xffb74d : 0x616161), 0.3);
    iconBg.fillCircle(-width / 2 + 50, 0, 30);
    container.add(iconBg);

    var icon = this.add.text(-width / 2 + 50, 0, stage.claimed ? '✅' : stage.icon, {
      fontSize: '30px'
    }).setOrigin(0.5);
    container.add(icon);

    var title = this.add.text(-width / 2 + 100, -18, stage.name, {
      fontSize: '18px',
      fontWeight: 'bold',
      color: stage.claimed ? '#a5d6a7' : (stage.canClaim ? '#ffffff' : '#888888')
    }).setOrigin(0, 0.5);
    container.add(title);

    var desc = this.add.text(-width / 2 + 100, 5, stage.description, {
      fontSize: '13px',
      color: stage.claimed ? '#81c784' : (stage.canClaim ? '#cccccc' : '#666666')
    }).setOrigin(0, 0.5);
    container.add(desc);

    var reward = stage.reward;
    var rewardStr = '';
    if (reward.coins) rewardStr += '💰' + reward.coins + ' ';
    if (reward.seasonXP) rewardStr += '⚡' + reward.seasonXP + ' ';
    if (reward.parts) rewardStr += '🔧' + reward.parts.length + ' ';
    if (reward.cars) rewardStr += '🚗' + reward.cars.length;

    var rewardText = this.add.text(-width / 2 + 100, 25, rewardStr, {
      fontSize: '13px',
      fontWeight: 'bold',
      color: stage.claimed ? '#81c784' : '#ffd700'
    }).setOrigin(0, 0.5);
    container.add(rewardText);

    var progressText = this.add.text(width / 2 - 100, -18,
      stage.currentProgress + ' / ' + stage.requiredTasks, {
      fontSize: '14px',
      fontWeight: 'bold',
      color: stage.claimed ? '#81c784' : (stage.canClaim ? '#ffd700' : '#888888')
    }).setOrigin(1, 0.5);
    container.add(progressText);

    if (stage.canClaim && !stage.claimed) {
      var claimBtn = this.createClaimButton(width / 2 - 30, 15, stage.id);
      container.add(claimBtn);
    } else if (stage.claimed) {
      var claimedText = this.add.text(width / 2 - 30, 15, '已领取', {
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#81c784'
      }).setOrigin(0.5);
      container.add(claimedText);
    } else {
      var lockedText = this.add.text(width / 2 - 30, 15, '未达成', {
        fontSize: '14px',
        color: '#888888'
      }).setOrigin(0.5);
      container.add(lockedText);
    }

    return container;
  };

  proto.createClaimButton = function(x, y, stageId) {
    var container = this.add.container(x, y);
    container.setSize(80, 36);

    var bg = this.add.graphics();
    bg.fillStyle(0x4caf50, 0.95);
    bg.fillRoundedRect(-40, -18, 80, 36, 18);
    bg.lineStyle(2, 0x81c784, 1);
    bg.strokeRoundedRect(-40, -18, 80, 36, 18);
    container.add(bg);

    var text = this.add.text(0, 0, '领取', {
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(text);

    var self = this;
    container.setInteractive(
      new Phaser.Geom.Rectangle(-40, -18, 80, 36),
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
          var result = self.taskCenter.claimStageReward(stageId);
          if (result.success) {
            self.showRewardPopup(result.reward, result.stage.name);
          }
        }
      });
    });

    return container;
  };

  proto.showRewardPopup = function(reward, sourceName) {
    var width = this.scale.width;
    var height = this.scale.height;

    var overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(1000);
    overlay.setScrollFactor(0);

    var panelW = 320;
    var panelH = 280;
    var panelX = width / 2;
    var panelY = height / 2;

    var panel = this.add.graphics();
    panel.fillStyle(0xffffff, 0.98);
    panel.fillRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 20);
    panel.lineStyle(4, 0xffd700, 1);
    panel.strokeRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 20);
    panel.setDepth(1001);
    panel.setScrollFactor(0);

    var title = this.add.text(panelX, panelY - panelH / 2 + 40, '🎉 恭喜获得奖励！', {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#333333'
    }).setOrigin(0.5).setDepth(1002).setScrollFactor(0);

    var source = this.add.text(panelX, panelY - panelH / 2 + 70, sourceName, {
      fontSize: '14px',
      color: '#666666'
    }).setOrigin(0.5).setDepth(1002).setScrollFactor(0);

    var rewardY = panelY;
    if (reward.coins) {
      var coinText = this.add.text(panelX, rewardY - 20, '💰 ' + reward.coins + ' 金币', {
        fontSize: '22px',
        fontWeight: 'bold',
        color: '#ffd700'
      }).setOrigin(0.5).setDepth(1002).setScrollFactor(0);
      rewardY += 35;
    }
    if (reward.seasonXP) {
      var xpText = this.add.text(panelX, rewardY - 20, '⚡ ' + reward.seasonXP + ' 赛季经验', {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#4a90d9'
      }).setOrigin(0.5).setDepth(1002).setScrollFactor(0);
      rewardY += 35;
    }
    if (reward.parts && reward.parts.length > 0) {
      var partsText = this.add.text(panelX, rewardY - 20, '🔧 ' + reward.parts.length + ' 件配件', {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#9c27b0'
      }).setOrigin(0.5).setDepth(1002).setScrollFactor(0);
      rewardY += 35;
    }
    if (reward.cars && reward.cars.length > 0) {
      var carsText = this.add.text(panelX, rewardY - 20, '🚗 ' + reward.cars.length + ' 辆汽车', {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#f44336'
      }).setOrigin(0.5).setDepth(1002).setScrollFactor(0);
    }

    var self = this;
    var closeBtn = this.add.text(panelX, panelY + panelH / 2 - 40, '确定', {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#ffffff',
      backgroundColor: '#4caf50',
      padding: { left: 40, right: 40, top: 10, bottom: 10 }
    }).setOrigin(0.5).setDepth(1002).setScrollFactor(0);

    closeBtn.setInteractive();
    closeBtn.on('pointerdown', function() {
      overlay.destroy();
      panel.destroy();
      title.destroy();
      source.destroy();
      if (reward.coins) coinText.destroy();
      if (reward.seasonXP) xpText.destroy();
      if (reward.parts && reward.parts.length > 0) partsText.destroy();
      if (reward.cars && reward.cars.length > 0) carsText.destroy();
      closeBtn.destroy();
    });

    this.tweens.add({
      targets: [panel, title, source],
      scale: { from: 0.8, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 300,
      ease: 'Back.easeOut'
    });
  };

  window.MountainRacer = MountainRacer;
})();
