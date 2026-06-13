(function() {
  'use strict';

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
    var container = document.getElementById('game-container');
    var loading = document.getElementById('loading');

    if (loading) {
      loading.remove();
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
        window.MountainRacer.MenuScene,
        window.MountainRacer.GameScene,
        window.MountainRacer.GameOverScene
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

    window.addEventListener('resize', function() {
      var size = getGameSize();
      if (container) {
        container.style.width = size.width + 'px';
        container.style.height = size.height + 'px';
      }
    });
  }

  function checkPhaserLoaded() {
    if (typeof Phaser !== 'undefined' &&
        window.MountainRacer &&
        window.MountainRacer.MenuScene &&
        window.MountainRacer.GameScene &&
        window.MountainRacer.GameOverScene) {
      initGame();
    } else {
      setTimeout(checkPhaserLoaded, 100);
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    checkPhaserLoaded();
  } else {
    document.addEventListener('DOMContentLoaded', checkPhaserLoaded);
  }
})();
