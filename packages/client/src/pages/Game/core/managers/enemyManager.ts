import Enemy from '../entities/enemy';
import { GameConfig } from '../../constants/game-config';
import PathManager from './pathManager';
import { Tile } from '../utils/types';
import { eventBus } from '../utils/eventBus';
import Player from '../entities/player';
import { wavesConfig } from '../../constants/waves-config';
import { SoundLib, StopSound } from '../../../../audio/audio';

class EnemyManager {
  enemies: Enemy[] = [];
  pathManager: PathManager;
  startTile: Tile;
  player: Player;
  context: CanvasRenderingContext2D;
  lastSpawnTime: number;
  isSpawning: boolean;
  waveIndex = 0;
  currentWaveEnemiesSpawned = 0;
  wavesStarted = false;
  private unsubscribe: (() => void) | null = null;

  constructor(
    context: CanvasRenderingContext2D,
    pathManager: PathManager,
    startTile: Tile,
    player: Player
  ) {
    this.context = context;
    this.pathManager = pathManager;
    this.startTile = startTile;
    this.player = player;
    this.lastSpawnTime = 0;
    this.isSpawning = false;
  }

  initialize(): void {
    this.addEventListeners();
  }

  addEnemy(waveIndex: number): void {
    const enemyType = wavesConfig[waveIndex].enemyType;
    const hp = wavesConfig[waveIndex].hp;
    const reward = wavesConfig[waveIndex].reward;
    const enemy = new Enemy(
      this.startTile,
      this.pathManager,
      enemyType,
      hp,
      reward
    );
    this.enemies.push(enemy);
    SoundLib('spawn');
  }

  startSpawning(): void {
    this.isSpawning = true;
  }

  stopSpawning(): void {
    this.isSpawning = false;
  }

  update(currentTime: number, deltaTime: number): void {
    // Создание врагов в зависимости от времени и волны
    this.handleWave(currentTime);

    // Update all enemies and filter out destroyed/finished ones in a single pass
    const remainingEnemies: Enemy[] = [];

    for (const enemy of this.enemies) {
      enemy.update(deltaTime);

      if (enemy.hasReachedEnd()) {
        this.handleEnemyReachedEnd();
      } else if (enemy.destroyed()) {
        this.handleEnemyDestroyed(enemy);
      } else {
        // Enemy is still active, keep it
        remainingEnemies.push(enemy);
      }
    }

    this.enemies = remainingEnemies;

    // Проверка на завершение игры
    if (
      !this.isSpawning &&
      this.enemies.length === 0 &&
      this.waveIndex >= wavesConfig.length
    ) {
      // Игра завершена, все волны пройдены
      // console.log('Game Over: All waves completed!');
      eventBus.emit('redux:gameOver', {
        isWin: true,
        score: this.player.getScore(),
      });
      StopSound('backgroundMusic');
      SoundLib('win');
    }
  }

  render(): void {
    this.enemies.forEach(enemy => {
      enemy.render(this.context);
    });
  }

  getEnemies(): Enemy[] {
    return this.enemies;
  }

  getEnemyCount(): number {
    return this.enemies.length;
  }

  clearAll(): void {
    this.enemies = [];
  }

  removeEventListeners(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  // Часть логики update. Запускается каждый кадр для управления волнами врагов
  private handleWave(currentTime: number) {
    if (!this.wavesStarted) {
      return;
    }
    const allWavesCompleted = this.waveIndex >= wavesConfig.length;
    if (allWavesCompleted) {
      // Остановка игры, все волны завершены
      this.isSpawning = false;
    } else {
      // Проверка на переход к следующей волне
      const currentWaveEnemyCount = wavesConfig[this.waveIndex].count;
      if (this.currentWaveEnemiesSpawned >= currentWaveEnemyCount) {
        this.waveIndex++;
        this.currentWaveEnemiesSpawned = 0;
        this.lastSpawnTime = currentTime + GameConfig.waveDelay; // Задержка перед следующей волной
      }

      if (this.waveIndex >= wavesConfig.length) {
        return; // Все волны завершены
      }

      const spawnInterval = wavesConfig[this.waveIndex].spawnInterval;
      if (
        this.isSpawning &&
        currentTime - this.lastSpawnTime >= spawnInterval
      ) {
        if (this.currentWaveEnemiesSpawned === 0) {
          // Начало новой волны
          eventBus.emit('redux:waveStarted', { waveNumber: this.waveIndex });
        }
        this.addEnemy(this.waveIndex);
        this.currentWaveEnemiesSpawned++;
        this.lastSpawnTime = currentTime;
      }
    }
  }

  private handleEnemyDestroyed(enemy: Enemy) {
    SoundLib('enemy-death');
    this.player.addMoney(enemy.reward);
    this.player.addScore(enemy.maxHealth);
  }

  private handleEnemyReachedEnd() {
    SoundLib('despawn');
    this.player.takeDamage();
  }

  private addEventListeners() {
    this.unsubscribe = eventBus.on('pathManager:pathUpdated', async () => {
      const pathUpdatePromises = this.enemies.map(async enemy => {
        const currentPositionTile: Tile = {
          x: Math.floor(enemy.currentPosition.x / GameConfig.tileSize),
          y: Math.floor(enemy.currentPosition.y / GameConfig.tileSize),
          id: 'current',
        };
        const newPathForEnemy = await this.pathManager.getPath(
          currentPositionTile
        );
        enemy.setPath(newPathForEnemy);
        enemy.currentIndex = 0;
      });

      try {
        await Promise.all(pathUpdatePromises);
      } catch (error) {
        console.error('Error updating enemy paths:', error);
      }
    });
  }
}

export default EnemyManager;
