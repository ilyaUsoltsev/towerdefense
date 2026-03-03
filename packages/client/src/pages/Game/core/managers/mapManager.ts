import { CannonsConfig, CannonType } from '../../constants/cannons-config';
import { eventBus } from '../utils/eventBus';
import mapData from '../utils/map.json';
import Player from '../entities/player';
import { Point, Tile } from '../utils/types';
import { TileType } from '../utils/constants';
import { assetsManager, ImagePath } from './assetsManager';

class MapManager {
  context: CanvasRenderingContext2D;
  mapData: typeof mapData;
  tileSize: number;
  mapWidth: number;
  mapHeight: number;
  collisionMap: number[][];
  cursorTile: Point | null = null;
  placingCannonType: CannonType | null = null;
  readonly mapDataCache = new Map<string, Tile[]>();
  private boundClickOnMap: (event: MouseEvent) => void;
  private boundMouseMoveOnMap: (event: MouseEvent) => void;
  private player: Player;

  constructor(context: CanvasRenderingContext2D, player: Player) {
    this.mapData = mapData;
    this.tileSize = mapData.tileSize;
    this.mapWidth = mapData.mapWidth;
    this.mapHeight = mapData.mapHeight;
    this.context = context;
    this.player = player;
    this.collisionMap = this.createCollisionGrid();
    this.boundClickOnMap = this.clickOnMap.bind(this);
    this.boundMouseMoveOnMap = this.mouseMoveOnMap.bind(this);
  }

  initialize(): void {
    this.addEventListeners();
  }

  getStartTile(): Tile {
    const tiles = this.getTiles('Start');
    if (tiles.length === 0) {
      throw new Error('Start tile not found in map data');
    }
    return tiles[0];
  }

  getFinishTile(): Tile {
    const tiles = this.getTiles('Finish');
    if (tiles.length === 0) {
      throw new Error('Finish tile not found in map data');
    }
    return tiles[0];
  }

  renderGameField() {
    this.renderTiles(this.getTiles('Game'), ['/mapBase.png'], 'lightblue');
  }

  renderWalls() {
    this.renderTiles(this.getTiles('Walls'), ['/mapBorder.png'], 'gray');
  }

  renderStart() {
    this.renderTiles(this.getTiles('Start'), ['/gameStart.png'], 'green');
  }

  renderFinish() {
    this.renderTiles(this.getTiles('Finish'), ['/gameFinish.png'], 'red');
  }

  renderCursorTile() {
    this._renderCursorTile();
  }

  getTiles(tileName: string): Tile[] {
    if (this.mapDataCache.has(tileName)) {
      return this.mapDataCache.get(tileName)!;
    }
    const walls = this.mapData.layers.find(layer => layer.name === tileName);
    const result = walls ? walls.tiles : [];
    this.mapDataCache.set(tileName, result);
    return result;
  }

  setPlacingCannonType(cannonType: CannonType | null) {
    this.placingCannonType = cannonType;
  }

  removeEventListeners() {
    this.context.canvas.removeEventListener('click', this.boundClickOnMap);
    this.context.canvas.removeEventListener(
      'mousemove',
      this.boundMouseMoveOnMap
    );
  }

  private addEventListeners() {
    this.context.canvas.addEventListener('click', this.boundClickOnMap);
    this.context.canvas.addEventListener('mousemove', this.boundMouseMoveOnMap);
  }

  private mouseMoveOnMap(event: MouseEvent): void {
    if (!this.placingCannonType) {
      this.cursorTile = null;
      return;
    }
    const { x: tileX, y: tileY } = this.getTileFromMouse(event);
    if (
      // TODO: this is not efficient, we could find boundary tiles once and store them
      this.collisionMap[tileY]?.[tileX] === 0 &&
      this.getTiles('Game').some(tile => tile.x === tileX && tile.y === tileY)
    ) {
      this.cursorTile = { x: tileX, y: tileY };
    } else {
      this.cursorTile = null;
    }
  }

  private clickOnMap(event: MouseEvent): void {
    this.cursorTile = null; // Clear cursor on click
    const { x: tileX, y: tileY } = this.getTileFromMouse(event);

    const startTile = this.getStartTile();

    if (tileX === startTile.x && tileY === startTile.y) {
      return; // Prevent placing cannon on start tile, a* will fail
    }

    if (this.collisionMap[tileY]?.[tileX] === TileType.Cannon) {
      // There's a cannon here, emit selection event
      eventBus.emit('redux:selectedCannon', { x: tileX, y: tileY });
      return;
    }

    if (!this.placingCannonType) {
      return;
    }

    if (
      !this.player.haveEnoughMoney(CannonsConfig[this.placingCannonType].cost)
    ) {
      alert('Not enough money to place cannon');
      return;
    }

    if (this.collisionMap[tileY]?.[tileX] === TileType.Empty) {
      const cannonTile = { x: tileX, y: tileY, id: 'cannon' };
      this.collisionMap[tileY][tileX] = TileType.Cannon;
      eventBus.emit('mapManager:tryAddCannon', {
        cannonTile,
        collisionMap: this.collisionMap,
        cannonType: this.placingCannonType,
      });
    }
  }

  private getTileFromMouse(event: MouseEvent): Tile {
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const tileX = Math.floor(x / this.tileSize);
    const tileY = Math.floor(y / this.tileSize);

    return { x: tileX, y: tileY };
  }

  private drawImage(img: HTMLImageElement, x: number, y: number) {
    this.context.drawImage(
      img,
      x * this.tileSize,
      y * this.tileSize,
      this.tileSize,
      this.tileSize
    );
  }

  private renderTiles(
    tiles: Tile[],
    images: ImagePath[],
    fallbackColor: string
  ) {
    const image = assetsManager.get(images[0]);
    if (image.complete) {
      tiles.forEach(tile => {
        this.drawImage(image, tile.x, tile.y);
      });
    } else {
      this.context.fillStyle = fallbackColor;
      tiles.forEach(tile => {
        this.context.fillRect(
          tile.x * this.tileSize,
          tile.y * this.tileSize,
          this.tileSize,
          this.tileSize
        );
      });
    }
  }

  private _renderCursorTile() {
    if (this.cursorTile) {
      const image = assetsManager.get('/pointer.png');
      this.drawImage(image, this.cursorTile.x, this.cursorTile.y);
    }
  }

  private createCollisionGrid(): number[][] {
    //  Empty grid initialization with zeroes
    const grid: number[][] = [];
    for (let y = 0; y < this.mapData.mapHeight; y++) {
      grid[y] = new Array(this.mapData.mapWidth).fill(0);
    }

    // Mark collision tiles as 1
    const collisionLayer = this.mapData.layers.find(
      layer => layer.name === 'Walls'
    );
    if (collisionLayer) {
      collisionLayer.tiles.forEach(tile => {
        grid[tile.y][tile.x] = TileType.Wall;
      });
    }

    return grid;
  }
}

export default MapManager;
