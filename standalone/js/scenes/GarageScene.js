(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.GarageScene = function() {
    Phaser.Scene.call(this, { key: 'GarageScene' });
  };

  MountainRacer.GarageScene.prototype = Object.create(Phaser.Scene.prototype);
  MountainRacer.GarageScene.prototype.constructor = MountainRacer.GarageScene;

  var proto = MountainRacer.GarageScene.prototype;

  proto.init = function() {
    this.dataManager = MountainRacer.DataManager.getInstance();
    this.dataManager.init();
    this.garageMgr = this.dataManager.getGarageManager();
    this.unlockMgr = this.dataManager.getUnlockManager();
    this.currentCategory = 'engine';
    this.selectedPartId = null;
  };

  proto.create = function() {
    var width = this.scale.width;
    var height = this.scale.height;

    this.createBackground(width, height);
    this.createTopBar(width, height);
    this.createCarPreview(width, height);
    this.createCategoryTabs(width, height);
    this.createPartsPanel(width, height);
    this.createStatsPanel(width, height);
    this.createLevelRequirements(width, height);
    this.createBackButton(width, height);
    this.refreshAll();

    var self = this;
    this.dataManager.on('coinsChanged', function() { self.refreshCoins(); });
    this.dataManager.on('partUnlocked', function() { self.refreshAll(); });
    this.dataManager.on('partEquipped', function() { self.refreshAll(); });
    this.dataManager.on('carPurchased', function() { self.refreshAll(); });
    this.dataManager.on('carSelected', function() { self.refreshAll(); });
  };

  proto.createBackground = function(width, height) {
    var bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e);
    bg.fillRect(0, 0, width, height);

    for (var i = 0; i < 8; i++) {
      var gear = this.add.text(
        Phaser.Math.Between(50, width - 50),
        Phaser.Math.Between(50, height - 50),
        '⚙️',
        { fontSize: '30px' }
      ).setAlpha(0.05 + Math.random() * 0.08).setOrigin(0.5);
      this.tweens.add({
        targets: gear,
        angle: 360,
        duration: 8000 + Math.random() * 6000,
        repeat: -1,
        ease: 'Linear'
      });
    }
  };

  proto.createTopBar = function(width, height) {
    var topBar = this.add.graphics();
    topBar.fillStyle(0x000000, 0.7);
    topBar.fillRect(0, 0, width, 60);
    topBar.lineStyle(2, 0x4a90d9, 0.8);
    topBar.lineBetween(0, 60, width, 60);

    this.add.text(width / 2, 30, '🔧 改装工坊', {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#4a90d9',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.coinsContainer = this.add.container(width - 30, 30);
    var coinBg = this.add.graphics();
    coinBg.fillStyle(0xffd700, 0.2);
    coinBg.lineStyle(2, 0xffd700, 0.8);
    coinBg.fillRoundedRect(-110, -22, 110, 44, 10);
    coinBg.strokeRoundedRect(-110, -22, 110, 44, 10);
    this.coinsText = this.add.text(-8, 0, '💰 0', {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#ffd700'
    }).setOrigin(0, 0.5);
    this.coinsContainer.add([coinBg, this.coinsText]);
  };

  proto.createCarPreview = function(width, height) {
    var previewX = 200;
    var previewY = 140;
    var previewW = 360;
    var previewH = 180;

    var container = this.add.container(previewX, previewY);

    var bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.5);
    bg.fillRoundedRect(-previewW / 2, -previewH / 2, previewW, previewH, 16);
    bg.lineStyle(2, 0x4a90d9, 0.5);
    bg.strokeRoundedRect(-previewW / 2, -previewH / 2, previewW, previewH, 16);

    var carId = this.garageMgr.getCurrentCarId();
    var carConfig = MountainRacer.PartsConfig.getCarConfig(carId);
    var custom = this.garageMgr.getCarCustomization(carId);
    var carColor = custom.color || (carConfig ? carConfig.color : '#ff4500');

    var carBody = this.add.graphics();
    var colorNum = Phaser.Display.Color.HexStringToColor(carColor).color;
    carBody.fillStyle(colorNum, 1);
    carBody.fillRoundedRect(-120, 20, 240, 60, 12);
    carBody.fillRoundedRect(-50, -20, 110, 50, 8);
    carBody.fillStyle(0x87ceeb, 0.7);
    carBody.fillRoundedRect(-40, -12, 90, 30, 6);
    carBody.lineStyle(3, 0x222222, 1);
    carBody.strokeRoundedRect(-120, 20, 240, 60, 12);

    var wheelFL = this.add.graphics();
    wheelFL.fillStyle(0x1a1a1a, 1);
    wheelFL.fillCircle(-80, 85, 22);
    wheelFL.fillStyle(0x555555, 1);
    wheelFL.fillCircle(-80, 85, 14);
    wheelFL.fillStyle(0xaaaaaa, 1);
    wheelFL.fillCircle(-80, 85, 5);

    var wheelFR = this.add.graphics();
    wheelFR.fillStyle(0x1a1a1a, 1);
    wheelFR.fillCircle(80, 85, 22);
    wheelFR.fillStyle(0x555555, 1);
    wheelFR.fillCircle(80, 85, 14);
    wheelFR.fillStyle(0xaaaaaa, 1);
    wheelFR.fillCircle(80, 85, 5);

    this.carNameText = this.add.text(0, -previewH / 2 + 25, '', {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.powerRatingText = this.add.text(0, previewH / 2 - 20, '', {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffd700'
    }).setOrigin(0.5);

    container.add([bg, carBody, wheelFL, wheelFR, this.carNameText, this.powerRatingText]);
    this.carPreviewContainer = container;
    this.carPreviewBody = carBody;
  };

  proto.createCategoryTabs = function(width, height) {
    var categories = MountainRacer.PartsConfig.getCategories();
    var catKeys = ['engine', 'tires', 'suspension', 'brakes', 'body', 'nitro'];
    var tabY = 350;
    var tabWidth = 105;
    var tabHeight = 50;
    var spacing = 8;
    var totalW = tabWidth * catKeys.length + spacing * (catKeys.length - 1);
    var startX = (width - totalW) / 2 + tabWidth / 2;

    this.categoryTabs = [];
    var self = this;

    for (var i = 0; i < catKeys.length; i++) {
      var cat = catKeys[i];
      var catCfg = categories[cat];
      var x = startX + i * (tabWidth + spacing);
      var container = this.add.container(x, tabY);
      container.setSize(tabWidth, tabHeight);

      var gfx = this.add.graphics();
      var isActive = cat === this.currentCategory;
      gfx.fillStyle(isActive ? 0x4a90d9 : 0x2a2a4a, isActive ? 0.95 : 0.8);
      gfx.fillRoundedRect(-tabWidth / 2, -tabHeight / 2, tabWidth, tabHeight, 10);
      gfx.lineStyle(2, isActive ? 0x6ab0ff : 0x3a3a5a, 1);
      gfx.strokeRoundedRect(-tabWidth / 2, -tabHeight / 2, tabWidth, tabHeight, 10);

      var icon = this.add.text(0, -8, catCfg.icon, { fontSize: '22px' }).setOrigin(0.5);
      var label = this.add.text(0, 14, catCfg.label, {
        fontSize: '13px',
        fontWeight: 'bold',
        color: isActive ? '#ffffff' : '#aab'
      }).setOrigin(0.5);

      container.add([gfx, icon, label]);
      container._category = cat;
      container._gfx = gfx;
      container._label = label;
      container._icon = icon;

      container.setInteractive(
        new Phaser.Geom.Rectangle(-tabWidth / 2, -tabHeight / 2, tabWidth, tabHeight),
        Phaser.Geom.Rectangle.Contains
      );

      container.on('pointerdown', (function(c) {
        return function() { self.selectCategory(c); };
      })(cat));

      this.categoryTabs.push(container);
    }
  };

  proto.selectCategory = function(category) {
    if (this.currentCategory === category) return;
    this.currentCategory = category;
    this.selectedPartId = null;
    for (var i = 0; i < this.categoryTabs.length; i++) {
      var tab = this.categoryTabs[i];
      var isActive = tab._category === category;
      tab._gfx.clear();
      tab._gfx.fillStyle(isActive ? 0x4a90d9 : 0x2a2a4a, isActive ? 0.95 : 0.8);
      tab._gfx.fillRoundedRect(-52.5, -25, 105, 50, 10);
      tab._gfx.lineStyle(2, isActive ? 0x6ab0ff : 0x3a3a5a, 1);
      tab._gfx.strokeRoundedRect(-52.5, -25, 105, 50, 10);
      tab._label.setColor(isActive ? '#ffffff' : '#aab');
    }
    this.refreshPartsPanel();
    this.refreshStatsPanel();
  };

  proto.createPartsPanel = function(width, height) {
    var panelX = width / 2;
    var panelY = 500;
    var panelW = 760;
    var panelH = 200;

    var container = this.add.container(panelX, panelY);

    var bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.6);
    bg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 14);
    bg.lineStyle(2, 0x3a3a5a, 0.8);
    bg.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 14);

    this.partsPanelBg = bg;
    this.partsContainer = this.add.container(0, 0);
    container.add([this.partsContainer]);
    this.partsPanel = container;
  };

  proto.refreshPartsPanel = function() {
    this.partsContainer.removeAll(true);
    var category = this.currentCategory;
    var allParts = MountainRacer.PartsConfig.getAllPartsByCategory(category);
    var partIds = Object.keys(allParts);
    var equipped = this.garageMgr.getEquippedPart(category);
    var unlocked = this.garageMgr.getUnlockedParts();

    var cardW = 140;
    var cardH = 170;
    var spacing = 16;
    var count = partIds.length;
    var totalW = count * cardW + (count - 1) * spacing;
    var startX = -totalW / 2 + cardW / 2;

    var self = this;

    for (var i = 0; i < partIds.length; i++) {
      var pid = partIds[i];
      var pcfg = allParts[pid];
      var x = startX + i * (cardW + spacing);
      var isUnlocked = unlocked.indexOf(pid) !== -1;
      var isEquipped = equipped === pid;
      var canBuy = !isUnlocked && this.garageMgr.canUnlockPart(pid).canUnlock;
      var levelLocked = !isUnlocked && !this.unlockMgr.isLevelUnlocked(pcfg.unlockLevel);

      var cardContainer = this.add.container(x, -5);
      cardContainer.setSize(cardW, cardH);

      var gfx = this.add.graphics();
      var tierColors = { 0: 0x555555, 1: 0x777777, 2: 0x4caf50, 3: 0x2196f3, 4: 0x9c27b0, 5: 0xff9800 };
      var tierColor = tierColors[pcfg.tier] || 0x555555;
      gfx.fillStyle(isEquipped ? 0x1a3a1a : 0x1a1a3a, isEquipped ? 0.95 : 0.9);
      gfx.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 10);
      gfx.lineStyle(3, isEquipped ? 0x4caf50 : (levelLocked ? 0x555555 : tierColor), isEquipped ? 1 : 0.8);
      gfx.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 10);

      var tierLabel = '';
      for (var t = 0; t < pcfg.tier; t++) tierLabel += '★';
      var tierTxt = this.add.text(0, -cardH / 2 + 18, tierLabel || '—', {
        fontSize: '12px',
        color: tierColor === 0x555555 ? '#888888' : '#ffd700'
      }).setOrigin(0.5);

      var nameTxt = this.add.text(0, -cardH / 2 + 40, pcfg.name, {
        fontSize: '14px',
        fontWeight: 'bold',
        color: isUnlocked ? '#ffffff' : '#888888',
        wordWrap: { width: cardW - 10 }
      }).setOrigin(0.5);

      var statsTxt = this.getPartStatsText(category, pcfg);
      var statsDisplay = this.add.text(0, -cardH / 2 + 72, statsTxt, {
        fontSize: '11px',
        color: isUnlocked ? '#6ab0ff' : '#666666',
        align: 'center',
        wordWrap: { width: cardW - 14 }
      }).setOrigin(0.5, 0);

      var statusY = cardH / 2 - 28;
      if (isEquipped) {
        var eqBg = this.add.graphics();
        eqBg.fillStyle(0x4caf50, 0.9);
        eqBg.fillRoundedRect(-50, statusY - 14, 100, 28, 6);
        var eqTxt = this.add.text(0, statusY, '✓ 已装备', {
          fontSize: '13px',
          fontWeight: 'bold',
          color: '#ffffff'
        }).setOrigin(0.5);
        cardContainer.add([eqBg, eqTxt]);
      } else if (isUnlocked) {
        var equipBg = this.add.graphics();
        equipBg.fillStyle(0x2196f3, canBuy ? 0.9 : 0.5);
        equipBg.fillRoundedRect(-50, statusY - 14, 100, 28, 6);
        var equipTxt = this.add.text(0, statusY, '装备', {
          fontSize: '13px',
          fontWeight: 'bold',
          color: '#ffffff'
        }).setOrigin(0.5);
        cardContainer.add([equipBg, equipTxt]);
      } else if (levelLocked) {
        var lockBg = this.add.graphics();
        lockBg.fillStyle(0x555555, 0.8);
        lockBg.fillRoundedRect(-58, statusY - 14, 116, 28, 6);
        var lockTxt = this.add.text(0, statusY, '🔒 需通第' + pcfg.unlockLevel + '关', {
          fontSize: '10px',
          fontWeight: 'bold',
          color: '#cccccc'
        }).setOrigin(0.5);
        cardContainer.add([lockBg, lockTxt]);
      } else {
        var priceBg = this.add.graphics();
        var coins = this.garageMgr.getCoins();
        var canAfford = coins >= pcfg.price;
        priceBg.fillStyle(canAfford ? 0xff9800 : 0xf44336, 0.9);
        priceBg.fillRoundedRect(-55, statusY - 14, 110, 28, 6);
        var priceTxt = this.add.text(0, statusY, '💰 ' + pcfg.price, {
          fontSize: '13px',
          fontWeight: 'bold',
          color: '#ffffff'
        }).setOrigin(0.5);
        cardContainer.add([priceBg, priceTxt]);
      }

      cardContainer.add([gfx, tierTxt, nameTxt, statsDisplay]);
      cardContainer._partId = pid;
      cardContainer._isUnlocked = isUnlocked;
      cardContainer._isEquipped = isEquipped;

      cardContainer.setInteractive(
        new Phaser.Geom.Rectangle(-cardW / 2, -cardH / 2, cardW, cardH),
        Phaser.Geom.Rectangle.Contains
      );

      cardContainer.on('pointerdown', (function(pid2, isUnl, isEq) {
        return function() { self.handlePartClick(pid2, isUnl, isEq); };
      })(pid, isUnlocked, isEquipped));

      this.partsContainer.add(cardContainer);
    }
  };

  proto.getPartStatsText = function(category, pcfg) {
    var s = pcfg.stats;
    if (category === 'engine') {
      return '加速: ' + s.acceleration + '\n极速: ' + s.maxSpeed + '\n动力: ' + s.power;
    }
    if (category === 'tires') {
      return '抓地: x' + s.grip.toFixed(2) + '\n稳定: ' + s.stability;
    }
    if (category === 'suspension') {
      return '硬度: ' + s.stiffness.toFixed(2) + '\n稳定: ' + s.stability + '\n落地: +' + Math.floor(s.landingBonus * 100) + '%';
    }
    if (category === 'brakes') {
      return '制动: ' + s.brakePower + '\n响应: x' + s.response.toFixed(2);
    }
    if (category === 'body') {
      return '减伤: ' + Math.floor(s.damageReduction * 100) + '%\n防翻: +' + Math.floor(s.rollResist * 100) + '%\n护甲: ' + s.armor;
    }
    if (category === 'nitro') {
      if (s.nitroCount === 0) return '不装备氮气';
      return '加速: +' + Math.floor(s.nitroBoost * 100) + '%\n持续: ' + s.nitroDuration + 's\n数量: ' + s.nitroCount + '瓶';
    }
    return '';
  };

  proto.handlePartClick = function(partId, isUnlocked, isEquipped) {
    if (isEquipped) return;
    var category = this.currentCategory;
    if (isUnlocked) {
      var result = this.garageMgr.equipPart(category, partId);
      if (result.success) {
        this.showToast('✅ 装备成功: ' + result.config.name);
      } else {
        this.showToast('❌ 装备失败: ' + result.reason);
      }
    } else {
      var canUnlock = this.garageMgr.canUnlockPart(partId);
      if (!canUnlock.canUnlock) {
        if (canUnlock.reason === 'insufficient_coins') {
          this.showToast('💰 金币不足，还差 ' + canUnlock.needed);
        } else if (canUnlock.reason === 'level_locked') {
          this.showToast('🔒 需通关第 ' + canUnlock.requiredLevel + ' 关');
        }
        return;
      }
      var unlockResult = this.garageMgr.unlockPart(partId);
      if (unlockResult.success) {
        this.showToast('🎉 购买成功: ' + unlockResult.config.name);
      } else {
        this.showToast('❌ 购买失败');
      }
    }
  };

  proto.createStatsPanel = function(width, height) {
    var panelX = 640;
    var panelY = 140;
    var panelW = 280;
    var panelH = 180;

    var container = this.add.container(panelX, panelY);

    var bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.6);
    bg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 14);
    bg.lineStyle(2, 0x3a3a5a, 0.8);
    bg.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 14);

    var title = this.add.text(0, -panelH / 2 + 22, '📊 性能指标', {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#4a90d9'
    }).setOrigin(0.5);

    this.statsItems = this.add.container(0, 5);
    container.add([bg, title, this.statsItems]);
    this.statsPanel = container;
  };

  proto.refreshStatsPanel = function() {
    this.statsItems.removeAll(true);
    var stats = this.garageMgr.calculateCarStats();
    if (!stats) return;

    var items = [
      { label: '最高速度', value: stats.maxSpeed, max: 1100, color: '#2196f3', icon: '🚀' },
      { label: '加速性能', value: stats.acceleration, max: 650, color: '#4caf50', icon: '⚡' },
      { label: '刹车制动', value: stats.brakePower, max: 900, color: '#f44336', icon: '🛑' },
      { label: '抓地稳定', value: Math.floor(stats.grip * 100), max: 150, color: '#9c27b0', icon: '🛞' },
      { label: '护甲生命', value: stats.baseHealth, max: 170, color: '#e91e63', icon: '❤️' }
    ];

    var barW = 180;
    var barH = 14;
    var startY = -50;
    var spacing = 30;

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var y = startY + i * spacing;
      var pct = Math.min(1, item.value / item.max);

      var labelTxt = this.add.text(-130, y, item.icon + ' ' + item.label, {
        fontSize: '12px',
        color: '#cccccc'
      }).setOrigin(0, 0.5);

      var valueTxt = this.add.text(130, y, item.value.toString(), {
        fontSize: '12px',
        fontWeight: 'bold',
        color: item.color
      }).setOrigin(1, 0.5);

      var barBg = this.add.graphics();
      barBg.fillStyle(0x333344, 1);
      barBg.fillRoundedRect(-90, y - 5, barW, barH, 4);

      var barFill = this.add.graphics();
      var colorNum = Phaser.Display.Color.HexStringToColor(item.color).color;
      barFill.fillStyle(colorNum, 0.95);
      barFill.fillRoundedRect(-90, y - 5, Math.max(4, barW * pct), barH, 4);

      this.statsItems.add([labelTxt, valueTxt, barBg, barFill]);
    }
  };

  proto.createLevelRequirements = function(width, height) {
    var panelX = width / 2;
    var panelY = 600;
    var panelW = 760;
    var panelH = 50;

    var container = this.add.container(panelX, panelY);
    var bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.5);
    bg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 10);
    bg.lineStyle(1, 0x3a3a5a, 0.6);
    bg.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 10);

    this.requirementsContainer = this.add.container(0, 0);
    container.add([bg, this.requirementsContainer]);
    this.levelReqPanel = container;
  };

  proto.refreshLevelRequirements = function() {
    this.requirementsContainer.removeAll(true);
    var currentPower = this.garageMgr.getCurrentPerformanceRating();
    var levels = [1, 2, 3];
    var spacing = 240;
    var startX = -((levels.length - 1) * spacing) / 2;

    for (var i = 0; i < levels.length; i++) {
      var lvl = levels[i];
      var x = startX + i * spacing;
      var req = this.garageMgr.getLevelRequirement(lvl);
      var hint = this.garageMgr.getLevelEntryHint(lvl);
      var isUnlocked = this.unlockMgr.isLevelUnlocked(lvl);
      var meetsPower = currentPower >= req.minPower;

      var color = isUnlocked && meetsPower ? '#4caf50' : (isUnlocked ? '#ff9800' : '#888888');
      var statusIcon = isUnlocked ? (meetsPower ? '✅' : '⚠️') : '🔒';

      var lvlTxt = this.add.text(x, -8, '关卡 ' + lvl + ' ' + statusIcon, {
        fontSize: '14px',
        fontWeight: 'bold',
        color: color
      }).setOrigin(0.5);

      var reqTxt = this.add.text(x, 12,
        (req.minPower > 0 ? ('战力 ' + currentPower + '/' + req.minPower) : '无战力要求'),
        {
          fontSize: '11px',
          color: meetsPower ? '#4caf50' : (req.minPower > 0 ? '#ff6b35' : '#aaaaaa')
        }
      ).setOrigin(0.5);

      this.requirementsContainer.add([lvlTxt, reqTxt]);
    }
  };

  proto.createBackButton = function(width, height) {
    var x = 60;
    var y = 30;

    var container = this.add.container(x, y);
    container.setSize(120, 40);

    var gfx = this.add.graphics();
    gfx.fillStyle(0xf44336, 0.85);
    gfx.fillRoundedRect(-60, -20, 120, 40, 10);
    gfx.lineStyle(2, 0xff6b6b, 0.9);
    gfx.strokeRoundedRect(-60, -20, 120, 40, 10);

    var txt = this.add.text(0, 0, '← 返回菜单', {
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    container.add([gfx, txt]);

    var self = this;
    container.setInteractive(
      new Phaser.Geom.Rectangle(-60, -20, 120, 40),
      Phaser.Geom.Rectangle.Contains
    );
    container.on('pointerover', function() {
      self.tweens.add({ targets: this, scale: 1.05, duration: 120 });
    });
    container.on('pointerout', function() {
      self.tweens.add({ targets: this, scale: 1.0, duration: 120 });
    });
    container.on('pointerdown', function() {
      self.scene.start('MenuScene');
    });
  };

  proto.refreshCoins = function() {
    var coins = this.garageMgr.getCoins();
    this.coinsText.setText('💰 ' + coins);
  };

  proto.refreshCarPreview = function() {
    var carId = this.garageMgr.getCurrentCarId();
    var carConfig = MountainRacer.PartsConfig.getCarConfig(carId);
    var rating = this.garageMgr.getCurrentPerformanceRating();
    this.carNameText.setText((carConfig ? carConfig.name : '赛车'));
    this.powerRatingText.setText('⚡ 战力评分: ' + rating);
  };

  proto.refreshAll = function() {
    this.refreshCoins();
    this.refreshCarPreview();
    this.refreshPartsPanel();
    this.refreshStatsPanel();
    this.refreshLevelRequirements();
  };

  proto.showToast = function(message) {
    var width = this.scale.width;
    var toast = this.add.container(width / 2, 80);
    var gfx = this.add.graphics();
    gfx.fillStyle(0x000000, 0.85);
    var padding = 24;
    var tempTxt = this.add.text(0, 0, message, {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffffff'
    });
    var w = tempTxt.width + padding * 2;
    var h = 44;
    gfx.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    gfx.lineStyle(2, 0x4a90d9, 0.8);
    gfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    tempTxt.setOrigin(0.5);
    toast.add([gfx, tempTxt]);
    toast.setDepth(9999);
    toast.setAlpha(0);
    var self = this;
    this.tweens.add({
      targets: toast,
      alpha: 1,
      y: 100,
      duration: 200,
      ease: 'Power2',
      onComplete: function() {
        self.tweens.add({
          targets: toast,
          alpha: 0,
          y: 80,
          duration: 300,
          delay: 1500,
          ease: 'Power2',
          onComplete: function() { toast.destroy(); }
        });
      }
    });
  };

  window.MountainRacer = MountainRacer;
})();
