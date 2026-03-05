import EasyStar from 'easystarjs';
import { Tile } from '../utils/types';
import { eventBus } from '../utils/eventBus';
import { GameConfig } from '../../constants/game-config';
import Player from '../entities/player';
import { CannonType } from '../../constants/cannons-config';
import { assetsManager } from './assetsManager';

class PathManager {
  context: CanvasRenderingContext2D;
  startTile: Tile;
  endTile: Tile;
  tileSize: number;
  statFinishPath: Tile[] = [];
  private easyStar: EasyStar.js;
  private unsubscribe: (() => void) | null = null;
  private player: Player;

  constructor(
    context: CanvasRenderingContext2D,
    start: Tile,
    end: Tile,
    player: Player
  ) {
    this.context = context;
    this.startTile = start;
    this.endTile = end;
    this.player = player;
    this.easyStar = new EasyStar.js();
    this.easyStar.disableCornerCutting();
    this.easyStar.setAcceptableTiles([0]);
    this.tileSize = GameConfig.tileSize;
  }

  initialize(): void {
    this.addEventListeners();
  }

  public async setCollisionMap(collisionMap: number[][]) {
    this.easyStar.setGrid(collisionMap);
    const path = await this.getPath(this.startTile, this.endTile);
    this.statFinishPath = path;
    eventBus.emit('pathManager:pathUpdated', path);
    return path;
  }

  public getStartFinishPath(): Tile[] {
    return this.statFinishPath;
  }

  public async getPath(start?: Tile, end?: Tile): Promise<Tile[]> {
    return await this.findPath(start ?? this.startTile, end ?? this.endTile);
  }

  public removeEventListeners() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  public renderPathStartFinish() {
    const image = assetsManager.get('/path.png');

    // Debug: отрисовка пути от старта до финиша
    // this.statFinishPath.forEach(tile => {
    //   if (tile.x !== 0 && tile.x !== 24) {
    //     this.context.drawImage(
    //       image,
    //       tile.x * this.tileSize,
    //       tile.y * this.tileSize,
    //       this.tileSize,
    //       this.tileSize
    //     );
    //   }
    // });
  }

  private async trySetCollisionMap(
    tile: Tile,
    collisionMap: number[][],
    cannonType: CannonType
  ) {
    collisionMap[tile.y][tile.x] = 1;
    this.easyStar.setGrid(collisionMap);
    try {
      await this.getPath(this.startTile, this.endTile);
      this.setCollisionMap(collisionMap);
      eventBus.emit('mapManager:cannonPlaced', { tile, cannonType });
      return true;
    } catch {
      // No path exists, revert the change
      alert('Cannot place cannon here! It would block all paths.');
      collisionMap[tile.y][tile.x] = 0;
      return false;
    }
  }

  private addEventListeners() {
    this.unsubscribe = eventBus.on('mapManager:tryAddCannon', payload => {
      this.trySetCollisionMap(
        payload.cannonTile,
        payload.collisionMap,
        payload.cannonType
      );
    });
  }

  private async findPath(startPoint: Tile, endPoint: Tile): Promise<Tile[]> {
    return new Promise((resolve, reject) => {
      this.easyStar.findPath(
        startPoint.x,
        startPoint.y,
        endPoint.x,
        endPoint.y,
        path => {
          if (path === null) {
            reject(new Error('No path found'));
          } else {
            // Convert to Point objects
            const pointPath = path.map(p => ({ x: p.x, y: p.y, id: 'path' }));
            resolve(pointPath);
          }
        }
      );
      this.easyStar.calculate();
    });
  }
}

export default PathManager;
