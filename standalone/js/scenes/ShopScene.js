(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.ShopScene = function() {
    Phaser.Scene.call(this, { key: 'ShopScene' });
  };

  MountainRacer.ShopScene.prototype = Object.create(Phaser.Scene.prototype);
  MountainRacer.ShopScene.prototype.constructor = MountainRacer.ShopScene;

  var proto = MountainRacer.ShopScene.prototype;

  proto.init = function() {
    this.dataManager = MountainRacer.DataManager.getInstance();
    this.dataManager.init();
    this.garageMgr = this.dataManager.getGarageManager();
    this.shopMgr = this.dataManager.getShopManager();
    this.currentTab = 'daily';
    this.dailyItemCards = [];
    this.limitedPackCards = [];
  };

  proto.create = function() {
    var width = this.scale.width;
    var height = this.scale.height;

    this.createBackground(width, height);
    this.createTopBar(width, height);
    this.createTabBar(width, height);
    this.createContentArea(width, height);
    this.createBackButton(width, height);
    this.refreshAll();

    var self = this;
    this.dataManager.on('coinsChanged', function() { self.refreshCoins(); });
    this.dataManager.on('dailyShopRefreshed', function() { self.refreshDailyShop(); });
    this.dataManager.on('itemPurchased', function() { self.showPurchaseToast('购买成功!'); self.refreshAll(); });
    this.dataManager.on('dailyPackClaimed', function() { self.showPurchaseToast('领取成功!'); self.refreshAll(); });
    this.dataManager.on('limitedPackPurchased', function() { self.showPurchaseToast('礼包购买成功!'); self.refreshAll(); });
    this.dataManager.on('coinPackagePurchased', function(data) { self.showPurchaseToast('获得 ' + data.coins + ' 金币!'); self.refreshAll(); });
    this.dataManager.on('luckyBoxOpened', function(data) { self.showLuckyBoxResults(data.results); });

    this.refreshTimer = this.time.addEvent({
      delay: 1000,
      callback: function() { self.updateTimers(); },
      loop: true
    });
  };

  proto.createBackground = function(width, height) {
    var bg = this.add.graphics();
    bg.fillGradientStyle(0x0f0c29, 0x0f0c29, 0x302b63, 0x302b63);
    bg.fillRect(0, 0, width, height);

    for (var i = 0; i < 12; i++) {
      var star = this.add.text(
        Phaser.Math.Between(30, width - 30),
        Phaser.Math.Between(80, height - 80),
        '✦',
        { fontSize: Phaser.Math.Between(10, 24) + 'px', color: '#ffffff' }
      ).setAlpha(0.05 + Math.random() * 0.1).setOrigin(0.5);
      this.tweens.add({
        targets: star,
        alpha: { from: 0.02, to: 0.15 },
        duration: 2000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  };

  proto.createTopBar = function(width, height) {
    var topBar = this.add.graphics();
    topBar.fillStyle(0x000000, 0.75);
    topBar.fillRect(0, 0, width, 60);
    topBar.lineStyle(2, 0xff9800, 0.8);
    topBar.lineBetween(0, 60, width, 60);

    this.add.text(width / 2, 30, '🏪 商店', {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#ff9800',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.coinsContainer = this.add.container(width - 30, 30);
    var coinBg = this.add.graphics();
    coinBg.fillStyle(0xffd700, 0.2);
    coinBg.lineStyle(2, 0xffd700, 0.85);
    coinBg.fillRoundedRect(-130, -22, 130, 44, 10);
    coinBg.strokeRoundedRect(-130, -22, 130, 44, 10);
    this.coinsText = this.add.text(-8, 0, '💰 0', {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#ffd700'
    }).setOrigin(0, 0.5);
    this.coinsContainer.add([coinBg, this.coinsText]);
  };

  proto.createTabBar = function(width, height) {
    var tabs = [
      { id: 'daily', label: '每日特惠', icon: '🎯' },
      { id: 'coins', label: '金币充值', icon: '💰' },
      { id: 'limited', label: '限时礼包', icon: '⏰' },
      { id: 'dailyPack', label: '每日福利', icon: '🎁' }
    ];

    var tabY = 85;
    var tabW = (width - 40) / tabs.length - 6;
    var tabH = 44;
    var startX = 20 + tabW / 2;
    var gap = 8;

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
    this.refreshContent();
  };

  proto.createContentArea = function(width, height) {
    this.contentAreaY = 130;
    this.contentAreaH = height - this.contentAreaY - 70;
    this.contentArea = this.add.container(0, 0);
  };

  proto.clearContent = function() {
    this.contentArea.removeAll(true);
    this.dailyItemCards = [];
    this.limitedPackCards = [];
    this.timerTexts = [];
  };

  proto.refreshContent = function() {
    this.clearContent();
    var width = this.scale.width;
    if (this.currentTab === 'daily') this.renderDailyShop(width);
    else if (this.currentTab === 'coins') this.renderCoinPackages(width);
    else if (this.currentTab === 'limited') this.renderLimitedPacks(width);
    else if (this.currentTab === 'dailyPack') this.renderDailyPacks(width);
  };

  proto.renderDailyShop = function(width) {
    var items = this.shopMgr.getDailyShop();
    var refreshInfo = this.shopMgr.canRefreshDailyShop();
    var nextRefresh = this.shopMgr.getNextRefreshTime();

    var headerY = this.contentAreaY + 5;
    var header = this.add.graphics();
    header.fillStyle(0x000000, 0.35);
    header.fillRoundedRect(15, headerY, width - 30, 44, 8);
    this.contentArea.add(header);

    this.add.text(30, headerY + 22, '🎯 每日特惠', {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ff9800'
    }).setOrigin(0, 0.5).setScrollFactor(0);

    this.refreshTimerText = this.add.text(width - 140, headerY + 22,
      '刷新: ' + this.formatTime(nextRefresh.remainingMs), {
        fontSize: '13px',
        color: '#ffffff'
      }).setOrigin(0, 0.5);
    this.contentArea.add(this.refreshTimerText);

    var refreshBtn = this.createRefreshButton(width - 50, headerY + 22, refreshInfo);
    this.contentArea.add(refreshBtn);

    var cols = 3;
    var cardW = (width - 50) / cols;
    var cardH = 150;
    var startY = headerY + 60;

    for (var i = 0; i < items.length; i++) {
      var col = i % cols;
      var row = Math.floor(i / cols);
      var x = 20 + cardW / 2 + col * cardW;
      var y = startY + cardH / 2 + row * (cardH + 10);
      var card = this.createDailyItemCard(x, y, cardW - 6, cardH, items[i]);
      this.contentArea.add(card);
      this.dailyItemCards.push(card);
    }
  };

  proto.createRefreshButton = function(x, y, info) {
    var self = this;
    var container = this.add.container(x, y);
    container.setSize(70, 34);

    var gfx = this.add.graphics();
    var canFree = info.freeLeft > 0;
    var color = canFree ? 0x4caf50 : 0xff9800;
    gfx.fillStyle(color, 0.9);
    gfx.fillRoundedRect(-35, -17, 70, 34, 8);
    gfx.lineStyle(2, 0xffffff, 0.4);
    gfx.strokeRoundedRect(-35, -17, 70, 34, 8);

    var label = canFree ? ('免费(' + info.freeLeft + ')') : '刷新';
    if (!canFree) label = '🔄 100';
    var txt = this.add.text(0, 0, label, {
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    container.add([gfx, txt]);
    container.setInteractive(
      new Phaser.Geom.Rectangle(-35, -17, 70, 34),
      Phaser.Geom.Rectangle.Contains
    );
    container.on('pointerover', function() { container.setScale(1.05); });
    container.on('pointerout', function() { container.setScale(1); });
    container.on('pointerdown', function() {
      var result = self.shopMgr.refreshDailyShop(canFree);
      if (result.success) {
        self.showPurchaseToast(canFree ? '已免费刷新!' : '刷新成功!');
        self.refreshContent();
      } else {
        if (result.reason === 'insufficient_coins') {
          self.showPurchaseToast('金币不足! 还差 ' + result.needed + ' 💰');
        } else {
          self.showPurchaseToast('刷新失败!');
        }
      }
    });

    return container;
  };

  proto.createDailyItemCard = function(x, y, w, h, item) {
    var self = this;
    var container = this.add.container(x, y);
    container.setSize(w, h);

    var rarity = MountainRacer.ShopConfig.getRarityColor(item.rarity);

    var bg = this.add.graphics();
    bg.fillStyle(0x1a1a3a, 0.9);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    bg.lineStyle(2, rarity.hex, 0.8);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    container.add(bg);

    var icon = this.add.text(0, -h / 2 + 28, item.icon, {
      fontSize: '32px'
    }).setOrigin(0.5);
    container.add(icon);

    var nameTxt = this.add.text(0, -h / 2 + 58, item.name, {
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(nameTxt);

    var rarityTxt = this.add.text(0, -h / 2 + 75, rarity.name, {
      fontSize: '10px',
      fontWeight: 'bold',
      color: '#' + rarity.hex.toString(16).padStart(6, '0')
    }).setOrigin(0.5);
    container.add(rarityTxt);

    var invCount = this.shopMgr.getItemCount(item.id);
    if (invCount > 0) {
      var invTxt = this.add.text(w / 2 - 6, -h / 2 + 10, 'x' + invCount, {
        fontSize: '11px',
        fontWeight: 'bold',
        color: '#4caf50'
      }).setOrigin(1, 0.5);
      container.add(invTxt);
    }

    if (item.discount > 0) {
      var discBg = this.add.graphics();
      discBg.fillStyle(0xf44336, 0.9);
      discBg.fillRoundedRect(-w / 2 + 4, -h / 2 + 4, 40, 18, 4);
      container.add(discBg);
      var discTxt = this.add.text(-w / 2 + 24, -h / 2 + 13, '-' + item.discount + '%', {
        fontSize: '11px',
        fontWeight: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);
      container.add(discTxt);
    }

    if (item.hot) {
      var hotTxt = this.add.text(w / 2 - 4, -h / 2 + 13, '🔥', {
        fontSize: '14px'
      }).setOrigin(1, 0.5);
      container.add(hotTxt);
    }

    var priceY = h / 2 - 42;
    if (item.discount > 0) {
      var origPrice = this.add.text(0, priceY - 8, item.originalPrice + '💰', {
        fontSize: '11px',
        color: '#888888'
      }).setOrigin(0.5);
      container.add(origPrice);
      var line = this.add.graphics();
      var origW = ('' + item.originalPrice).length * 7 + 16;
      line.lineStyle(1.5, 0x888888, 1);
      line.lineBetween(-origW / 2, priceY - 8, origW / 2, priceY - 8);
      container.add(line);
    }

    var priceTxt = this.add.text(0, priceY + (item.discount > 0 ? 10 : 0), item.price + ' 💰', {
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#ffd700'
    }).setOrigin(0.5);
    container.add(priceTxt);

    var btnY = h / 2 - 16;
    var btnW = w - 20;
    var btnH = 28;
    var buyBtn = this.add.graphics();
    var coins = this.garageMgr.getCoins();
    var canBuy = coins >= item.price;
    buyBtn.fillStyle(canBuy ? 0x4caf50 : 0x666666, 0.95);
    buyBtn.fillRoundedRect(-btnW / 2, btnY - btnH / 2, btnW, btnH, 6);
    buyBtn.lineStyle(2, 0xffffff, 0.3);
    buyBtn.strokeRoundedRect(-btnW / 2, btnY - btnH / 2, btnW, btnH, 6);
    container.add(buyBtn);

    var buyTxt = this.add.text(0, btnY, canBuy ? '购买' : '金币不足', {
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(buyTxt);

    container._item = item;
    container._buyBtn = buyBtn;
    container._buyTxt = buyTxt;
    container._btnW = btnW;
    container._btnH = btnH;
    container._btnY = btnY;

    if (canBuy) {
      container.setInteractive(
        new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
        Phaser.Geom.Rectangle.Contains
      );
      container.on('pointerover', function() { container.setScale(1.03); });
      container.on('pointerout', function() { container.setScale(1); });
      container.on('pointerdown', function() {
        self.purchaseItem(this._item);
      });
    }

    return container;
  };

  proto.purchaseItem = function(item) {
    var self = this;
    if (item.id === 'lucky_box') {
      this.showConfirmDialog('确认购买 ' + item.name + '?', function() {
        var result = self.shopMgr.purchaseConsumable(item.id, 1);
        if (result.success) {
          setTimeout(function() {
            var openResult = self.shopMgr.openLuckyBox(1);
          }, 300);
        } else {
          if (result.reason === 'insufficient') {
            self.showPurchaseToast('金币不足! 还差 ' + (result.needed || 0) + ' 💰');
          } else {
            self.showPurchaseToast('购买失败!');
          }
        }
      });
    } else {
      this.showConfirmDialog('确认购买 ' + item.name + '? (' + item.price + ' 💰)', function() {
        var result = self.shopMgr.purchaseConsumable(item.id, 1);
        if (!result.success) {
          if (result.reason === 'insufficient') {
            self.showPurchaseToast('金币不足! 还差 ' + (result.needed || 0) + ' 💰');
          } else {
            self.showPurchaseToast('购买失败!');
          }
        }
      });
    }
  };

  proto.renderCoinPackages = function(width) {
    var packs = MountainRacer.ShopConfig.getCoinPackages();
    var packList = Object.values(packs);

    var headerY = this.contentAreaY + 5;
    var header = this.add.graphics();
    header.fillStyle(0x000000, 0.35);
    header.fillRoundedRect(15, headerY, width - 30, 40, 8);
    this.contentArea.add(header);

    this.add.text(30, headerY + 20, '💰 金币充值', {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffd700'
    }).setOrigin(0, 0.5);

    var cardW = width - 40;
    var cardH = 72;
    var startY = headerY + 55;

    for (var i = 0; i < packList.length; i++) {
      var y = startY + i * (cardH + 8);
      var card = this.createCoinPackageCard(width / 2, y, cardW, cardH, packList[i]);
      this.contentArea.add(card);
    }
  };

  proto.createCoinPackageCard = function(x, y, w, h, pack) {
    var self = this;
    var container = this.add.container(x, y);
    container.setSize(w, h);

    var rarity = MountainRacer.ShopConfig.getRarityColor(pack.rarity);

    var bg = this.add.graphics();
    bg.fillStyle(0x1a1a3a, 0.9);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
    bg.lineStyle(2.5, rarity.hex, 0.85);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
    container.add(bg);

    var icon = this.add.text(-w / 2 + 40, 0, pack.icon, {
      fontSize: '30px'
    }).setOrigin(0.5);
    container.add(icon);

    var nameTxt = this.add.text(-w / 2 + 80, -h / 2 + 22, pack.name, {
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0, 0.5);
    container.add(nameTxt);

    var descTxt = this.add.text(-w / 2 + 80, -h / 2 + 44, pack.description, {
      fontSize: '12px',
      color: '#aaaaaa'
    }).setOrigin(0, 0.5);
    container.add(descTxt);

    if (pack.hot) {
      var hotBg = this.add.graphics();
      hotBg.fillStyle(0xf44336, 0.95);
      hotBg.fillRoundedRect(-w / 2 + 80, 8, 36, 18, 4);
      container.add(hotBg);
      var hotTxt = this.add.text(-w / 2 + 98, 17, 'HOT', {
        fontSize: '10px',
        fontWeight: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);
      container.add(hotTxt);
    }

    var btnW = 90;
    var btnH = 38;
    var buyBtn = this.add.graphics();
    buyBtn.fillGradientStyle(rarity.hex, rarity.hex, 0x333333, 0x333333);
    buyBtn.fillRoundedRect(w / 2 - btnW - 10, -btnH / 2, btnW, btnH, 8);
    buyBtn.lineStyle(2, 0xffffff, 0.4);
    buyBtn.strokeRoundedRect(w / 2 - btnW - 10, -btnH / 2, btnW, btnH, 8);
    container.add(buyBtn);

    var priceTxt = this.add.text(w / 2 - btnW / 2 - 10, -5, '¥' + pack.realPrice, {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(priceTxt);

    var subTxt = this.add.text(w / 2 - btnW / 2 - 10, 13, '立即购买', {
      fontSize: '10px',
      color: '#dddddd'
    }).setOrigin(0.5);
    container.add(subTxt);

    container.setInteractive(
      new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
      Phaser.Geom.Rectangle.Contains
    );
    container.on('pointerover', function() { container.setScale(1.015); });
    container.on('pointerout', function() { container.setScale(1); });
    container.on('pointerdown', function() {
      self.showConfirmDialog('确认购买 ' + pack.name + '? (¥' + pack.realPrice + ')', function() {
        var result = self.shopMgr.purchaseCoinPackage(pack.id);
      });
    });

    return container;
  };

  proto.renderLimitedPacks = function(width) {
    var packs = this.shopMgr.getAvailableLimitedPacks();

    var headerY = this.contentAreaY + 5;
    var header = this.add.graphics();
    header.fillStyle(0x000000, 0.35);
    header.fillRoundedRect(15, headerY, width - 30, 40, 8);
    this.contentArea.add(header);

    this.add.text(30, headerY + 20, '⏰ 限时礼包', {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#e91e63'
    }).setOrigin(0, 0.5);

    if (packs.length === 0) {
      var empty = this.add.text(width / 2, this.contentAreaY + 120,
        '暂无可用礼包\n敬请期待!', {
          fontSize: '18px',
          color: '#888888',
          align: 'center'
        }).setOrigin(0.5);
      this.contentArea.add(empty);
      return;
    }

    var cardW = width - 40;
    var cardH = 110;
    var startY = headerY + 55;
    this.timerTexts = [];

    for (var i = 0; i < packs.length; i++) {
      var y = startY + i * (cardH + 10);
      var card = this.createLimitedPackCard(width / 2, y, cardW, cardH, packs[i]);
      this.contentArea.add(card);
      this.limitedPackCards.push(card);
    }
  };

  proto.createLimitedPackCard = function(x, y, w, h, pack) {
    var self = this;
    var container = this.add.container(x, y);
    container.setSize(w, h);

    var rarity = MountainRacer.ShopConfig.getRarityColor(pack.rarity);

    var bg = this.add.graphics();
    bg.fillGradientStyle(0x2d1b4e, 0x2d1b4e, 0x1a1a3a, 0x1a1a3a);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    bg.lineStyle(3, rarity.hex, 0.9);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
    container.add(bg);

    var icon = this.add.text(-w / 2 + 45, -h / 2 + 35, pack.icon, {
      fontSize: '36px'
    }).setOrigin(0.5);
    container.add(icon);

    var nameTxt = this.add.text(-w / 2 + 85, -h / 2 + 25, pack.name, {
      fontSize: '17px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0, 0.5);
    container.add(nameTxt);

    var descTxt = this.add.text(-w / 2 + 85, -h / 2 + 50, pack.description, {
      fontSize: '12px',
      color: '#cccccc'
    }).setOrigin(0, 0.5);
    container.add(descTxt);

    if (pack.discount > 0) {
      var discBg = this.add.graphics();
      discBg.fillStyle(0xf44336, 0.95);
      discBg.fillRoundedRect(-w / 2 + 85, -h / 2 + 65, 44, 20, 5);
      container.add(discBg);
      var discTxt = this.add.text(-w / 2 + 107, -h / 2 + 75, '-' + pack.discount + '%', {
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);
      container.add(discTxt);
    }

    if (pack.hot) {
      var hotBg = this.add.graphics();
      hotBg.fillStyle(0xff5722, 0.95);
      hotBg.fillRoundedRect(-w / 2 + 135, -h / 2 + 65, 40, 20, 5);
      container.add(hotBg);
      var hotTxt = this.add.text(-w / 2 + 155, -h / 2 + 75, '热卖', {
        fontSize: '11px',
        fontWeight: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);
      container.add(hotTxt);
    }

    var limitTxt = this.add.text(-w / 2 + 85, h / 2 - 12,
      '剩余: ' + pack.remaining + ' / ' + (pack.maxPurchase || 99), {
        fontSize: '11px',
        color: '#aaaaaa'
      }).setOrigin(0, 0.5);
    container.add(limitTxt);

    var timeTxt = this.add.text(w / 2 - 130, -h / 2 + 20,
      '⏱ ' + this.formatTime((pack.durationHours || 24) * 3600 * 1000), {
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#ff5722'
      }).setOrigin(0, 0.5);
    container.add(timeTxt);
    this.timerTexts.push({ txt: timeTxt, pack: pack });

    var btnW = 100;
    var btnH = 44;
    var btnX = w / 2 - btnW - 12;
    var btnY = 5;
    var canBuy = pack.canPurchase;
    var priceLabel = pack.currency === 'coins' ? (pack.price + ' 💰') : ('¥' + pack.price);

    var buyBtn = this.add.graphics();
    if (canBuy) {
      buyBtn.fillGradientStyle(rarity.hex, rarity.hex, 0x222222, 0x222222);
    } else {
      buyBtn.fillStyle(0x555555, 0.8);
    }
    buyBtn.fillRoundedRect(btnX, btnY - btnH / 2, btnW, btnH, 10);
    buyBtn.lineStyle(2, 0xffffff, 0.35);
    buyBtn.strokeRoundedRect(btnX, btnY - btnH / 2, btnW, btnH, 10);
    container.add(buyBtn);

    if (pack.discount > 0 && pack.currency !== 'coins') {
      var origPriceTxt = this.add.text(btnX + btnW / 2, btnY - btnH / 2 - 6, '¥' + pack.originalPrice, {
        fontSize: '10px',
        color: '#888888'
      }).setOrigin(0.5);
      container.add(origPriceTxt);
      var line = this.add.graphics();
      line.lineStyle(1.5, 0x888888, 1);
      line.lineBetween(btnX + 15, btnY - btnH / 2 - 6, btnX + btnW - 15, btnY - btnH / 2 - 6);
      container.add(line);
    }

    var priceTxt = this.add.text(btnX + btnW / 2, btnY - 2, priceLabel, {
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(priceTxt);

    var buyTxt = this.add.text(btnX + btnW / 2, btnY + 15, canBuy ? '立即购买' : '已售罄', {
      fontSize: '11px',
      color: '#dddddd'
    }).setOrigin(0.5);
    container.add(buyTxt);

    container._pack = pack;
    container._canBuy = canBuy;
    container._btnX = btnX;
    container._btnY = btnY;
    container._btnW = btnW;
    container._btnH = btnH;

    if (canBuy) {
      container.setInteractive(
        new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
        Phaser.Geom.Rectangle.Contains
      );
      container.on('pointerover', function() { container.setScale(1.015); });
      container.on('pointerout', function() { container.setScale(1); });
      container.on('pointerdown', function() {
        self.purchaseLimitedPack(this._pack);
      });
    }

    return container;
  };

  proto.purchaseLimitedPack = function(pack) {
    var self = this;
    var priceLabel = pack.currency === 'coins' ? (' (' + pack.price + ' 💰)') : '';
    this.showConfirmDialog('确认购买 ' + pack.name + '?' + priceLabel, function() {
      var result = self.shopMgr.purchaseLimitedPack(pack.id);
      if (!result.success) {
        var msg = '购买失败!';
        if (result.reason === 'insufficient') {
          msg = '金币不足! 还差 ' + (result.needed || 0) + ' 💰';
        } else if (result.reason === 'max_purchased') {
          msg = '已达购买上限!';
        } else if (result.reason === 'not_available') {
          msg = '礼包已过期!';
        }
        self.showPurchaseToast(msg);
      }
    });
  };

  proto.renderDailyPacks = function(width) {
    var packs = MountainRacer.ShopConfig.getDailyPacks();

    var headerY = this.contentAreaY + 5;
    var header = this.add.graphics();
    header.fillStyle(0x000000, 0.35);
    header.fillRoundedRect(15, headerY, width - 30, 40, 8);
    this.contentArea.add(header);

    this.add.text(30, headerY + 20, '🎁 每日福利', {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#4caf50'
    }).setOrigin(0, 0.5);

    var cardW = width - 40;
    var cardH = 100;
    var startY = headerY + 55;
    this.dailyPackTimerTexts = [];

    for (var i = 0; i < packs.length; i++) {
      var y = startY + i * (cardH + 10);
      var card = this.createDailyPackCard(width / 2, y, cardW, cardH, packs[i]);
      this.contentArea.add(card);
    }
  };

  proto.createDailyPackCard = function(x, y, w, h, pack) {
    var self = this;
    var container = this.add.container(x, y);
    container.setSize(w, h);

    var bg = this.add.graphics();
    bg.fillStyle(0x1a3a1a, 0.85);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    bg.lineStyle(2.5, 0x4caf50, 0.8);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
    container.add(bg);

    var icon = this.add.text(-w / 2 + 45, 0, pack.icon, {
      fontSize: '34px'
    }).setOrigin(0.5);
    container.add(icon);

    var nameTxt = this.add.text(-w / 2 + 85, -h / 2 + 28, pack.name, {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0, 0.5);
    container.add(nameTxt);

    var descTxt = this.add.text(-w / 2 + 85, -h / 2 + 52, pack.description, {
      fontSize: '12px',
      color: '#bbbbbb'
    }).setOrigin(0, 0.5);
    container.add(descTxt);

    if (pack.requireAd) {
      var adTxt = this.add.text(-w / 2 + 85, -h / 2 + 75, '📺 观看广告领取', {
        fontSize: '11px',
        color: '#81d4fa'
      }).setOrigin(0, 0.5);
      container.add(adTxt);
    }

    var canClaimInfo = this.shopMgr.canClaimDailyPack(pack.id);
    var canClaim = canClaimInfo.canClaim;

    var timerTxt = this.add.text(w / 2 - 120, -h / 2 + 20, '', {
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#ff9800'
    }).setOrigin(0, 0.5);
    container.add(timerTxt);
    if (this.dailyPackTimerTexts) this.dailyPackTimerTexts.push({ txt: timerTxt, packId: pack.id });

    var btnW = 100;
    var btnH = 44;
    var btnX = w / 2 - btnW - 12;
    var btnY = 5;

    var claimBtn = this.add.graphics();
    claimBtn.fillStyle(canClaim ? 0x4caf50 : 0x555555, 0.95);
    claimBtn.fillRoundedRect(btnX, btnY - btnH / 2, btnW, btnH, 10);
    claimBtn.lineStyle(2, 0xffffff, 0.35);
    claimBtn.strokeRoundedRect(btnX, btnY - btnH / 2, btnW, btnH, 10);
    container.add(claimBtn);

    var claimTxt = this.add.text(btnX + btnW / 2, btnY, canClaim ? '立即领取' : '已领取', {
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(claimTxt);

    container._pack = pack;
    container._canClaim = canClaim;

    if (canClaim) {
      container.setInteractive(
        new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
        Phaser.Geom.Rectangle.Contains
      );
      container.on('pointerover', function() { container.setScale(1.02); });
      container.on('pointerout', function() { container.setScale(1); });
      container.on('pointerdown', function() {
        var result = self.shopMgr.claimDailyPack(pack.id);
        if (!result.success) self.showPurchaseToast('领取失败!');
      });
    }

    return container;
  };

  proto.updateTimers = function() {
    var nextRefresh = this.shopMgr.getNextRefreshTime();
    if (this.refreshTimerText) {
      this.refreshTimerText.setText('刷新: ' + this.formatTime(nextRefresh.remainingMs));
    }

    if (this.timerTexts) {
      for (var i = 0; i < this.timerTexts.length; i++) {
        var t = this.timerTexts[i];
        if (t && t.txt && t.pack) {
          var duration = (t.pack.durationHours || 24) * 3600 * 1000;
          t.txt.setText('⏱ ' + this.formatTime(Math.max(0, duration)));
        }
      }
    }

    if (this.dailyPackTimerTexts) {
      for (var j = 0; j < this.dailyPackTimerTexts.length; j++) {
        var dt = this.dailyPackTimerTexts[j];
        if (dt && dt.txt) {
          var info = this.shopMgr.canClaimDailyPack(dt.packId);
          if (!info.canClaim && info.remainingMs) {
            dt.txt.setText('⏱ ' + this.formatTime(info.remainingMs));
          } else {
            dt.txt.setText('');
          }
        }
      }
    }
  };

  proto.formatTime = function(ms) {
    if (ms <= 0) return '00:00:00';
    var totalSec = Math.floor(ms / 1000);
    var h = Math.floor(totalSec / 3600);
    var m = Math.floor((totalSec % 3600) / 60);
    var s = totalSec % 60;
    return h.toString().padStart(2, '0') + ':' +
           m.toString().padStart(2, '0') + ':' +
           s.toString().padStart(2, '0');
  };

  proto.createBackButton = function(width, height) {
    var self = this;
    var container = this.add.container(50, height - 35);
    container.setSize(100, 40);

    var gfx = this.add.graphics();
    gfx.fillStyle(0x607d8b, 0.9);
    gfx.fillRoundedRect(-50, -20, 100, 40, 10);
    gfx.lineStyle(2, 0xffffff, 0.4);
    gfx.strokeRoundedRect(-50, -20, 100, 40, 10);

    var txt = this.add.text(0, 0, '← 返回', {
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    container.add([gfx, txt]);
    container.setInteractive(
      new Phaser.Geom.Rectangle(-50, -20, 100, 40),
      Phaser.Geom.Rectangle.Contains
    );
    container.on('pointerover', function() { container.setScale(1.05); });
    container.on('pointerout', function() { container.setScale(1); });
    container.on('pointerdown', function() {
      self.scene.start('MenuScene');
    });
  };

  proto.refreshCoins = function() {
    var coins = this.garageMgr.getCoins();
    if (this.coinsText) this.coinsText.setText('💰 ' + coins);
  };

  proto.refreshAll = function() {
    this.refreshCoins();
    this.refreshContent();
  };

  proto.refreshDailyShop = function() {
    if (this.currentTab === 'daily') this.refreshContent();
  };

  proto.showPurchaseToast = function(message) {
    var width = this.scale.width;
    var height = this.scale.height;

    var bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.85);
    bg.fillRoundedRect(width / 2 - 120, height / 2 - 28, 240, 56, 12);
    bg.lineStyle(2, 0x4caf50, 1);
    bg.strokeRoundedRect(width / 2 - 120, height / 2 - 28, 240, 56, 12);
    bg.setDepth(9998);

    var txt = this.add.text(width / 2, height / 2, message, {
      fontSize: '18px',
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
          }, 1200);
        };
      })(bg, txt)
    });
  };

  proto.showConfirmDialog = function(message, onConfirm, onCancel) {
    var self = this;
    var width = this.scale.width;
    var height = this.scale.height;

    var overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(9000);

    var panelW = 320;
    var panelH = 180;

    var panel = this.add.graphics();
    panel.fillStyle(0x222244, 0.98);
    panel.fillRoundedRect(width / 2 - panelW / 2, height / 2 - panelH / 2, panelW, panelH, 16);
    panel.lineStyle(3, 0xff9800, 1);
    panel.strokeRoundedRect(width / 2 - panelW / 2, height / 2 - panelH / 2, panelW, panelH, 16);
    panel.setDepth(9001);

    var msgTxt = this.add.text(width / 2, height / 2 - 40, message, {
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

    var confirmBtn = this.createDialogButton(width / 2 - 85, height / 2 + 40, 140, 44, '确认', 0x4caf50, function() {
      close();
      if (onConfirm) onConfirm();
    });

    var cancelBtn = this.createDialogButton(width / 2 + 85, height / 2 + 40, 140, 44, '取消', 0x757575, function() {
      close();
      if (onCancel) onCancel();
    });
  };

  proto.createDialogButton = function(x, y, w, h, label, color, onClick) {
    var self = this;
    var container = this.add.container(x, y);
    container.setSize(w, h);
    container.setDepth(9002);

    var gfx = this.add.graphics();
    gfx.fillStyle(color, 0.95);
    gfx.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    gfx.lineStyle(2, 0xffffff, 0.4);
    gfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);

    var txt = this.add.text(0, 0, label, {
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    container.add([gfx, txt]);
    container.setInteractive(
      new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
      Phaser.Geom.Rectangle.Contains
    );
    container.on('pointerover', function() { container.setScale(1.05); });
    container.on('pointerout', function() { container.setScale(1); });
    container.on('pointerdown', function() { onClick(); });

    return container;
  };

  proto.showLuckyBoxResults = function(results) {
    var self = this;
    var width = this.scale.width;
    var height = this.scale.height;

    var overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(9500);

    var panelW = 360;
    var panelH = 240;

    var panel = this.add.graphics();
    panel.fillStyle(0x1a1a3a, 0.98);
    panel.fillRoundedRect(width / 2 - panelW / 2, height / 2 - panelH / 2, panelW, panelH, 18);
    panel.lineStyle(3, 0xff9800, 1);
    panel.strokeRoundedRect(width / 2 - panelW / 2, height / 2 - panelH / 2, panelW, panelH, 18);
    panel.setDepth(9501);

    var title = this.add.text(width / 2, height / 2 - panelH / 2 + 35, '🎁 幸运宝箱', {
      fontSize: '22px',
      fontWeight: 'bold',
      color: '#ffd700'
    }).setOrigin(0.5).setDepth(9502);

    var resultY = height / 2 - 10;
    var elements = [overlay, panel, title];

    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      var y = resultY + i * 36;
      var itemIcon = this.add.text(width / 2 - 80, y, r.icon, {
        fontSize: '28px'
      }).setOrigin(0.5).setDepth(9502);
      var itemName = this.add.text(width / 2 - 40, y, r.name, {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#ffffff'
      }).setOrigin(0, 0.5).setDepth(9502);
      elements.push(itemIcon, itemName);
    }

    var okBtn = this.createDialogButton(width / 2, height / 2 + panelH / 2 - 35, 160, 44, '太棒了!', 0xff9800, function() {
      for (var e = 0; e < elements.length; e++) {
        if (elements[e]) elements[e].destroy();
      }
      if (okBtn) okBtn.destroy();
      self.refreshAll();
    });
  };

  window.MountainRacer = MountainRacer;
})();
