import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Tile } from '../pages/Game/core/utils/types';
import { CannonType } from '../pages/Game/constants/cannons-config';
import { isUpgradable } from './utils/is-upgradable';
import { GAME_STATE } from '../constants/GAME_STATE';

export interface SelectedEntity {
  type: CannonType;
  id: string;
  position: Tile;
  level: number;
  damage: number;
  range: number;
  fireRate: number;
  upgradeCost: number;
}

interface ResultGame {
  isWin: boolean;
  score: number;
}

export interface UserState {
  gameState: GAME_STATE;
  result: ResultGame;
  hp: number;
  money: number;
  selectedEntity: SelectedEntity | null;
  blockingPath: boolean;
  selectedCannon: CannonType | null;
  waveNumber: number | null;
  pendingSellCannonId: string | null;
  pendingUpgradeCannonId: string | null;
  isFullscreen: boolean;
  wavesStarted: boolean;
}

const initialState: UserState = {
  gameState: GAME_STATE.START,
  result: {
    isWin: false,
    score: 0,
  },
  hp: 0, // инициализируется при старте игры
  money: 0, // инициализируется при старте игры
  selectedEntity: null,
  selectedCannon: null,
  blockingPath: false,
  waveNumber: null,
  pendingSellCannonId: null,
  pendingUpgradeCannonId: null,
  isFullscreen: false,
  wavesStarted: false,
};

export const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    gameInitializeState: (
      state,
      action: PayloadAction<{ hp: number; money: number }>
    ) => {
      state.hp = action.payload.hp;
      state.money = action.payload.money;
    },
    gameSetMoney: (state, action: PayloadAction<number>) => {
      state.money = action.payload;
    },
    gameSelectEntity: (state, action: PayloadAction<SelectedEntity | null>) => {
      state.selectedCannon = null;
      state.selectedEntity = action.payload;
    },
    gameSellSelectedEntity: state => {
      if (state.selectedEntity) {
        state.pendingSellCannonId = state.selectedEntity.id;
      }
      state.selectedCannon = null;
    },
    gameSetBlockingPath: (state, action: PayloadAction<boolean>) => {
      state.blockingPath = action.payload;
    },
    gameSetHp: (state, action: PayloadAction<number>) => {
      state.hp = action.payload;
    },
    gameUpgradeSelectedEntity: state => {
      if (!state.selectedEntity) {
        return;
      }

      if (isUpgradable(state.money, state.selectedEntity)) {
        state.pendingUpgradeCannonId = state.selectedEntity.id;
      }
    },
    gameSelectCannon: (state, action: PayloadAction<CannonType | null>) => {
      state.selectedEntity = null;
      state.selectedCannon = action.payload;
    },
    gameSetWaveNumber: (state, action: PayloadAction<number>) => {
      state.waveNumber = action.payload;
    },
    gameClearSellCommand: state => {
      state.pendingSellCannonId = null;
    },
    gameClearUpgradeCommand: state => {
      state.pendingUpgradeCannonId = null;
    },
    gameSetState: (state, action: PayloadAction<GAME_STATE>) => {
      state.gameState = action.payload;
    },
    gameOver: (state, action: PayloadAction<ResultGame>) => {
      state.result = action.payload;
      state.gameState = GAME_STATE.END;
      state.wavesStarted = false;
      state.waveNumber = null;
    },
    gameSetFullscreen: (state, action: PayloadAction<boolean>) => {
      state.isFullscreen = action.payload;
    },
    gameSetStartWaves: (state, action: PayloadAction<boolean>) => {
      state.wavesStarted = action.payload;
    },
  },
});

export const {
  gameInitializeState,
  gameSetMoney,
  gameSelectEntity,
  gameSetBlockingPath,
  gameSetHp,
  gameSellSelectedEntity,
  gameUpgradeSelectedEntity,
  gameSelectCannon,
  gameSetWaveNumber,
  gameClearSellCommand,
  gameClearUpgradeCommand,
  gameSetState,
  gameOver,
  gameSetFullscreen,
  gameSetStartWaves,
} = gameSlice.actions;

export const selectIsFullscreen = (state: { game: UserState }) =>
  state.game.isFullscreen;

export default gameSlice.reducer;
