import { eventBus } from '../utils/eventBus';
import { Point, Tile } from '../utils/types';
import Cannon from '../entities/cannon';
import Enemy from '../entities/enemy';
import ProjectileManager from './projectileManager';
import Player from '../entities/player';
import { CannonsConfig, CannonType } from '../../constants/cannons-config';
import { SoundLib } from '../../../../audio/audio';

class CannonManager {
  context: CanvasRenderingContext2D;
  cannons: Map<string, Cannon> = new Map();
  private projectileManager: ProjectileManager;
  private unsubscribeCannonPlaced: (() => void) | null = null;
  private unsubscribeSelectedCannon: (() => void) | null = null;

  private player: Player;

  constructor(context: CanvasRenderingContext2D, player: Player) {
    this.context = context;
    this.projectileManager = new ProjectileManager(context);
    this.player = player;
  }

  initialize(): void {
    this.addEventListeners();
  }

  addCannon(position: Tile, cannonType: CannonType): void {
    const cannon = new Cannon(position, cannonType, this.projectileManager);
    this.cannons.set(cannon.id, cannon);
    SoundLib('place-cannon');
  }

  removeCannonById(id: string): void {
    this.cannons.delete(id);
  }

  update(enemies: Enemy[], timestamp: number): void {
    this.cannons.forEach(cannon => {
      cannon.update(enemies, timestamp);
    });
  }

  render(): void {
    this.cannons.forEach(cannon => {
      cannon.render(this.context);
    });
  }

  getCannons(): Cannon[] {
    return Array.from(this.cannons.values());
  }

  getProjectileManager(): ProjectileManager {
    return this.projectileManager;
  }

  getCannonById(id: string): Cannon | undefined {
    return this.cannons.get(id);
  }

  getCannonAtPosition(tile: Point): Cannon | undefined {
    for (const cannon of this.cannons.values()) {
      if (cannon.position.x === tile.x && cannon.position.y === tile.y) {
        return cannon;
      }
    }
    return undefined;
  }

  sellCannon(id: string): { cannon: Cannon | null; sellValue: number } {
    const cannon = this.getCannonById(id);
    if (!cannon) {
      return { cannon: null, sellValue: 0 };
    }
    const sellValue = cannon.getSellValue();
    this.removeCannonById(id);

    return { cannon, sellValue };
  }

  removeEventListeners(): void {
    if (this.unsubscribeCannonPlaced) {
      this.unsubscribeCannonPlaced();
    }
    if (this.unsubscribeSelectedCannon) {
      this.unsubscribeSelectedCannon();
    }
  }

  private addEventListeners(): void {
    this.unsubscribeCannonPlaced = eventBus.on(
      'mapManager:cannonPlaced',
      ({ tile, cannonType }: { tile: Tile; cannonType: CannonType }) => {
        this.addCannon(tile, cannonType);
        this.player.subtractMoney(CannonsConfig[cannonType].cost);
      }
    );

    this.unsubscribeSelectedCannon = eventBus.on(
      'redux:selectedCannon',
      ({ x, y }: { x: number; y: number }) => {
        for (const c of this.cannons.values()) {
          if (c.position.x === x && c.position.y === y) {
            c.selected = true;
          } else {
            c.selected = false;
          }
        }
      }
    );
  }
}

export default CannonManager;
