(function() {
  function getGameSize() {
    var maxW = 800;
    var maxH = 600;
    var ratio = maxW / maxH;

    var w = window.innerWidth;
    var h = window.innerHeight;

    if (w > maxW) w = maxW;
    if (h > maxH) h = maxH;

    var windowRatio = w / h;
    if (windowRatio > ratio) {
      w = h * ratio;
    } else {
      h = w / ratio;
    }

    return { width: Math.floor(w), height: Math.floor(h) };
  }

  function initGame() {
    if (typeof Phaser === 'undefined') {
      var loading = document.getElementById('loading');
      if (loading) {
        loading.innerHTML = '<div style="color:#d32f2f">❌ Phaser 加载失败</div><div style="font-size:14px;margin-top:10px;color:#666">请检查网络连接或下载 phaser.min.js 到 js/ 目录</div>';
      }
      return;
    }

    var loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'none';
    }

    var config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: 'game-container',
      backgroundColor: '#87ceeb',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scene: [
        MountainRacer.MenuScene,
        MountainRacer.GameScene,
        MountainRacer.GameOverScene
      ],
      render: {
        pixelArt: false,
        antialias: true
      },
      input: {
        activePointers: 3
      }
    };

    var game = new Phaser.Game(config);
    window.__game = game;

    window.addEventListener('resize', function() {
      var size = getGameSize();
      var container = document.getElementById('game-container');
      if (container) {
        container.style.width = size.width + 'px';
        container.style.height = size.height + 'px';
      }
    });

    window.addEventListener('error', function(e) {
      console.error('Game error:', e.message);
    });
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initGame, 100);
  } else {
    window.addEventListener('load', initGame);
  }
})();
