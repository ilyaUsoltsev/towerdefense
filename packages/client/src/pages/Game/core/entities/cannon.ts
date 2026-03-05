import { Point, Tile } from '../utils/types';
import Enemy from './enemy';
import { GameConfig } from '../../constants/game-config';
import ProjectileManager from '../managers/projectileManager';
import {
  CannonProps,
  CannonsConfig,
  CannonType,
} from '../../constants/cannons-config';
import { Effect, EffectsConfig } from '../../constants/effects-config';
import { SelectedEntity } from '../../../../slices/gameSlice';
import { assetsManager } from '../managers/assetsManager';
import { SoundLib } from '../../../../audio/audio';

class Cannon {
  id: string;
  position: Tile;
  range: number;
  tileSize: number;
  fireRate: number;
  projectileSpeed: number;
  explosionRadius: number;
  damage: number;
  lastFireTime = 0;
  level = 1;
  cost: number;
  cannonType: CannonType;
  cannonConfig: CannonProps;
  upgradeCost: number;
  selected = false;
  effect: Effect | null;
  private projectileManager: ProjectileManager;

  constructor(
    position: Tile,
    cannonType: CannonType,
    projectileManager: ProjectileManager
  ) {
    // Уникальный идентификатор для каждой пушки, можно заменить на UUID при необходимости
    this.id = `${cannonType}-${Math.random()}`;
    this.tileSize = GameConfig.tileSize;
    this.cannonConfig = CannonsConfig[cannonType];
    this.position = position;
    this.range = this.cannonConfig.range;
    this.cost = this.cannonConfig.cost;
    this.damage = this.cannonConfig.damage;
    this.fireRate = this.cannonConfig.fireRate;
    this.projectileSpeed = this.cannonConfig.projectileSpeed;
    this.explosionRadius = this.cannonConfig.explosionRadius;
    this.upgradeCost = this.cannonConfig.upgradeCost;
    this.effect = EffectsConfig[cannonType];
    this.projectileManager = projectileManager;
    this.cannonType = cannonType;
  }

  upgrade(): void {
    this.level += 1;
    this.damage = Math.floor(this.damage * 1.2);
    this.range = Math.floor(this.range * 1.1);
    this.fireRate = this.fireRate / 1.1;
    this.projectileSpeed = this.projectileSpeed * 1.1;
    SoundLib('upgrade');
  }

  getSellValue(): number {
    return Math.floor(this.cost * GameConfig.sellValue * this.level);
  }

  getUpgradeCost(): number {
    return Math.floor(this.upgradeCost * this.level);
  }

  getCenter(): Point {
    return {
      x: this.position.x * this.tileSize + this.tileSize / 2,
      y: this.position.y * this.tileSize + this.tileSize / 2,
    };
  }

  isEnemyInRange(enemy: Enemy): boolean {
    const enemyPos = enemy.getPosition();
    const cannonCenter = this.getCenter();
    const dx = enemyPos.x - cannonCenter.x;
    const dy = enemyPos.y - cannonCenter.y;
    const distanceSquared = dx * dx + dy * dy;
    return distanceSquared <= this.range * this.range;
  }

  canFire(currentTime: number): boolean {
    return currentTime - this.lastFireTime >= this.fireRate;
  }

  shootAt(target: Point, currentTime: number): void {
    if (!this.canFire(currentTime)) {
      return;
    }

    const cannonCenter = this.getCenter();
    this.projectileManager.createProjectile(cannonCenter, target, this);
    this.lastFireTime = currentTime;
  }

  update(enemies: Enemy[], currentTime: number): void {
    for (const enemy of enemies) {
      if (
        this.isEnemyInRange(enemy) &&
        !enemy.hasReachedEnd() &&
        this.canFire(currentTime)
      ) {
        this.shootAt(enemy.getPosition(), currentTime);
        break;
      }
    }
  }

  toState(): SelectedEntity {
    return {
      type: this.cannonType,
      id: this.id,
      position: this.position,
      level: this.level,
      damage: this.damage,
      range: this.range,
      fireRate: this.fireRate,
      upgradeCost: this.getUpgradeCost(),
    };
  }

  render(context: CanvasRenderingContext2D): void {
    const center = this.getCenter();

    const image = assetsManager.get(this.cannonConfig.imagePath);
    if (image.complete) {
      context.drawImage(
        image,
        this.position.x * this.tileSize,
        this.position.y * this.tileSize,
        this.tileSize,
        this.tileSize
      );
    }
    if (this.selected) {
      context.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      context.beginPath();
      context.arc(center.x, center.y, this.range, 0, 2 * Math.PI);
      context.stroke();
    }
  }
}

export default Cannon;
