import CannonManager from './managers/cannonManager';
import MapManager from './managers/mapManager';
import PathManager from './managers/pathManager';
import { eventBus } from './utils/eventBus';
import EnemyManager from './managers/enemyManager';
import Player from './entities/player';
import { GameConfig } from '../constants/game-config';
import { assetsManager } from './managers/assetsManager';
import { SoundLib, StopSound } from '../../../audio/audio';

class GameEngine {
  mapManager!: MapManager;
  cannonManager!: CannonManager;
  pathManager!: PathManager;
  private context: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private enemyManager!: EnemyManager;
  private animationFrameId: number | null = null;
  private player!: Player;
  private lastFrameTime = 0;
  private readonly targetFPS = 60;
  private readonly frameInterval = 1000 / this.targetFPS;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d')!;
  }

  async initialize() {
    this.player = new Player();
    await assetsManager.loadAll();
    SoundLib('backgroundMusic');
    this.mapManager = new MapManager(this.context, this.player);
    this.cannonManager = new CannonManager(this.context, this.player);
    this.pathManager = new PathManager(
      this.context,
      this.mapManager.getStartTile(),
      this.mapManager.getFinishTile(),
      this.player
    );

    await this.pathManager.setCollisionMap(this.mapManager.collisionMap);

    this.enemyManager = new EnemyManager(
      this.context,
      this.pathManager,
      this.mapManager.getStartTile(),
      this.player
    );

    // Инициализируем менеджеры после создания всех зависимостей
    this.mapManager.initialize();
    this.cannonManager.initialize();
    this.pathManager.initialize();
    this.enemyManager.initialize();

    // Начать спавн врагов
    // TODO: Запускать спавн с началом игры
    this.enemyManager.startSpawning();

    this.canvas.width = this.mapManager.mapWidth * this.mapManager.tileSize;
    this.canvas.height = this.mapManager.mapHeight * this.mapManager.tileSize;
    eventBus.emit('redux:gameInitialize', {
      hp: GameConfig.hp,
      money: GameConfig.initialMoney,
    });
  }

  async start() {
    try {
      await this.initialize();
      this.loop(0);
    } catch (error) {
      console.error('Failed to start the game engine:', error);
    }
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    StopSound('backgroundMusic');
    this.cannonManager.removeEventListeners();
    this.mapManager.removeEventListeners();
    this.enemyManager.removeEventListeners();
    this.pathManager.removeEventListeners();
    eventBus.clear();
  }

  sellCannon(cannonId: string) {
    const { cannon, sellValue } = this.cannonManager.sellCannon(cannonId);
    if (cannon) {
      this.player.addMoney(sellValue);
      const collisionMap = this.mapManager.collisionMap;
      collisionMap[cannon.position.y][cannon.position.x] = 0; // Free the tile
      this.pathManager.setCollisionMap(this.mapManager.collisionMap);
    }
    return this.player.getMoney();
  }

  setWavesStarted(wavesStarted: boolean) {
    this.enemyManager.wavesStarted = wavesStarted;
  }

  upgradeCannon(cannonId: string): number | null {
    const cannon = this.cannonManager.getCannonById(cannonId);
    if (!cannon) {
      return null;
    }
    // Проверяем, хватает ли денег у игрока на улучшение.
    if (this.player.haveEnoughMoney(cannon.getUpgradeCost()) === false) {
      return null;
    }
    // Проверяем, достигла ли пушка максимального уровня.
    if (cannon.level >= GameConfig.maxCannonLevel) {
      return null;
    }

    // Вычитаем деньги игрока за улучшение и обновляем
    this.player.subtractMoney(cannon.getUpgradeCost());
    cannon.upgrade();

    return this.player.getMoney();
  }

  private loop = (timestamp: number) => {
    this.animationFrameId = requestAnimationFrame(this.loop);

    // Поправка на FPS, скорость может меняться в зависимости от FPS
    const deltaTime = timestamp - this.lastFrameTime;
    if (deltaTime >= this.frameInterval) {
      this.lastFrameTime = timestamp - (deltaTime % this.frameInterval);
      this.render(timestamp, deltaTime);
    }
  };

  private render(timestamp: number, deltaTime: number) {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.mapManager.renderGameField();
    this.mapManager.renderWalls();
    this.mapManager.renderStart();
    this.mapManager.renderFinish();
    this.pathManager.renderPathStartFinish();
    this.enemyManager.update(timestamp, deltaTime);
    this.cannonManager.update(this.enemyManager.getEnemies(), timestamp);
    this.cannonManager
      .getProjectileManager()
      .update(this.enemyManager.getEnemies());
    this.cannonManager.render();
    this.cannonManager.getProjectileManager().render();
    this.enemyManager.render();
    this.mapManager.renderCursorTile();
  }
}

export default GameEngine;
