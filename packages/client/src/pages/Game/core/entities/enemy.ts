import { GameConfig } from '../../constants/game-config';
import PathManager from '../managers/pathManager';
import { Tile, Point } from '../utils/types';
import { EnemiesConfig, EnemyType } from '../../constants/enemies-config';
import { Effect } from '../../constants/effects-config';
import { assetsManager, ImagePath } from '../managers/assetsManager';

class Enemy {
  path: Tile[] = [];
  currentPosition: Point;
  baseSpeed: number;
  speed: number;
  immune: boolean;
  imagePath: ImagePath;
  currentIndex: number;
  pathManager: PathManager;
  health: number;
  maxHealth: number;
  isDestroyed: boolean;
  radius: number;
  reward: number;
  activeEffects: Effect[] = [];

  constructor(
    start: Tile,
    pathManager: PathManager,
    type: EnemyType,
    hp: number,
    reward: number
  ) {
    this.pathManager = pathManager;
    this.currentPosition = {
      x: start.x * GameConfig.tileSize + GameConfig.tileSize / 2,
      y: start.y * GameConfig.tileSize + GameConfig.tileSize / 2,
    };
    this.currentIndex = 0;
    this.health = hp;
    this.maxHealth = hp;
    this.immune = EnemiesConfig[type].immune;
    this.imagePath = EnemiesConfig[type].imagePath as ImagePath;
    // Каждый враг получает случайную скорость в диапазоне 90%-110% от базовой скорости
    this.baseSpeed = EnemiesConfig[type].speed * (Math.random() * 0.2 + 0.9);
    this.speed = this.baseSpeed;
    this.radius = EnemiesConfig[type].radius;
    this.reward = reward;
    this.isDestroyed = false;
    this.path = this.pathManager.getStartFinishPath();
  }

  setPath(path: Tile[]) {
    this.path = path;
  }

  moveAlongPath() {
    if (this.path.length === 0) {
      return;
    }

    const nextTile = this.path[this.currentIndex + 1];

    if (this.hasReachedEnd()) {
      return;
    }

    if (!nextTile) return;

    const targetPosition = {
      x: nextTile.x * GameConfig.tileSize + GameConfig.tileSize / 2,
      y: nextTile.y * GameConfig.tileSize + GameConfig.tileSize / 2,
    };

    const dx = targetPosition.x - this.currentPosition.x;
    const dy = targetPosition.y - this.currentPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < this.speed) {
      this.currentPosition = targetPosition;
      this.currentIndex++;
    } else {
      this.currentPosition.x += (dx / distance) * this.speed;
      this.currentPosition.y += (dy / distance) * this.speed;
    }
  }

  getPosition(): Point {
    return this.currentPosition;
  }

  hasReachedEnd(): boolean {
    return this.currentIndex >= this.path.length - 1;
  }

  takeHit(damage: number, effect: Effect | null): void {
    if (this.isDestroyed) return;

    this.health -= damage;
    if (this.health <= 0) {
      this.health = 0;
      this.isDestroyed = true;
      return;
    }

    if (effect && !this.immune) {
      this.takeEffect(effect);
    }
  }

  getHealth(): number {
    return this.health;
  }

  getMaxHealth(): number {
    return this.maxHealth;
  }

  destroyed(): boolean {
    return this.isDestroyed;
  }

  update(deltaTime: number): void {
    this.moveAlongPath();
    this.updateEffects(deltaTime);
  }

  render(context: CanvasRenderingContext2D) {
    // Отрисовка врага
    const image = assetsManager.get(this.imagePath);

    context.drawImage(
      image,
      this.currentPosition.x - this.radius,
      this.currentPosition.y - this.radius,
      this.radius * 2,
      this.radius * 2
    );

    // Отрисовка эффекта (например, ледяной эффект)
    // синяя полупрозрачная оболочка вокруг врага
    const freezeEffect = this.activeEffects.find(e => e.name === 'Freeze');
    if (freezeEffect) {
      context.fillStyle = 'rgba(0, 150, 255, 0.4)';
      context.beginPath();
      context.arc(
        this.currentPosition.x,
        this.currentPosition.y,
        this.radius + 4,
        0,
        2 * Math.PI
      );
      context.fill();
    }

    // Отрисовка полоски здоровья
    const healthBarWidth = GameConfig.healthBar.width;
    const healthBarHeight = GameConfig.healthBar.height;
    const healthBarX = this.currentPosition.x - healthBarWidth / 2;
    const healthBarY = this.currentPosition.y - GameConfig.healthBar.offset;
    const healthPercentage = this.health / this.maxHealth;

    // Фон
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    context.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

    // Здоровье
    context.fillStyle =
      healthPercentage > 0.5
        ? 'green'
        : healthPercentage > 0.25
        ? 'yellow'
        : 'red';
    context.fillRect(
      healthBarX,
      healthBarY,
      healthBarWidth * healthPercentage,
      healthBarHeight
    );

    // Отрисовка пути врага (для дебага)
    // context.strokeStyle = 'rgba(0, 0, 255, 0.3)';
    // context.beginPath();
    // for (let i = this.currentIndex; i < this.path.length; i++) {
    //   const tile = this.path[i];
    //   const x = tile.x * GameConfig.tileSize + GameConfig.tileSize / 2;
    //   const y = tile.y * GameConfig.tileSize + GameConfig.tileSize / 2;
    //   if (i === this.currentIndex) {
    //     context.moveTo(this.currentPosition.x, this.currentPosition.y);
    //   } else {
    //     context.lineTo(x, y);
    //   }
    // }
    // context.stroke();
  }

  private takeEffect(effect: Effect): void {
    const existingEffect = this.activeEffects.find(e => e.name === effect.name);

    if (existingEffect) {
      // Если эффект уже активен, обновляем его длительность
      existingEffect.duration = effect.duration;
    } else {
      this.activeEffects.push({ ...effect });
    }
  }

  private updateEffects(deltaTime: number) {
    let speedMultiplier = 1;

    this.activeEffects.forEach(effect => {
      effect.duration -= deltaTime;

      if (effect.name === 'Freeze') {
        speedMultiplier *= effect.magnitude;
      }
    });
    // удаляем истекшие эффекты
    this.activeEffects = this.activeEffects.filter(
      effect => effect.duration > 0
    );

    this.speed = this.baseSpeed * speedMultiplier;
  }
}

export default Enemy;
