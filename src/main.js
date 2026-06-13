import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

const container = document.getElementById('game-container');

function getGameSize() {
  const maxW = 800;
  const maxH = 600;
  const ratio = maxW / maxH;

  let w = window.innerWidth;
  let h = window.innerHeight;

  if (w > maxW) w = maxW;
  if (h > maxH) h = maxH;

  const windowRatio = w / h;
  if (windowRatio > ratio) {
    w = h * ratio;
  } else {
    h = w / ratio;
  }

  return { width: Math.floor(w), height: Math.floor(h) };
}

const initialSize = getGameSize();

const config = {
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
  scene: [MenuScene, GameScene, GameOverScene],
  render: {
    pixelArt: false,
    antialias: true
  },
  input: {
    activePointers: 3
  }
};

const game = new Phaser.Game(config);
window.__mountainRacerGame = game;

window.addEventListener('resize', () => {
  const size = getGameSize();
  if (container) {
    container.style.width = size.width + 'px';
    container.style.height = size.height + 'px';
  }
});

window.addEventListener('error', (e) => {
  console.error('Game error:', e.message);
});
