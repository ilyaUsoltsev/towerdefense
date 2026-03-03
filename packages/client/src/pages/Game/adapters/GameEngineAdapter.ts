import type { Store } from '@reduxjs/toolkit';

import { RootState } from '../../../store';
import GameEngine from '../core/gameEngine';

import {
  gameSelectEntity,
  gameInitializeState,
  gameSetHp,
  gameSetMoney,
  gameSetWaveNumber,
  gameClearSellCommand,
  gameClearUpgradeCommand,
  gameOver,
} from '../../../slices/gameSlice';
import { eventBus } from '../core/utils/eventBus';
import { CannonType } from '../constants/cannons-config';
import { GameConfig } from '../constants/game-config';
import { NotificationService } from '../../../utils/NotificationService';

/**
 * Этот адаптер синхронизирует состояние между GameEngine и Redux store.
 * Он слушает события из GameEngine и диспатчит соответствующие действия Redux.
 * Он также слушает изменения в хранилище Redux и обновляет состояние GameEngine соответственно.
 */
export class GameEngineAdapter {
  private unsubSink: (() => void)[] = [];
  private prevSelectedCannon: CannonType | null = null;
  private prevWavesStarted = false;
  private isCleanedUp = false;
  constructor(
    private gameEngine: GameEngine,
    private store: Store<RootState>
  ) {}

  // Этот метод обеспечивает синхронизацию от движка к Redux
  // Все события должны начинаться с "redux:"
  init() {
    const unsubInit = eventBus.on('redux:gameInitialize', ({ hp, money }) => {
      this.store.dispatch(
        gameInitializeState({
          hp,
          money,
        })
      );
    });
    this.unsubSink.push(unsubInit);

    const waveStartedUnsub = eventBus.on(
      'redux:waveStarted',
      ({ waveNumber }) => {
        this.store.dispatch(gameSetWaveNumber(waveNumber));
      }
    );
    this.unsubSink.push(waveStartedUnsub);

    const unsubHp = eventBus.on('redux:setPlayerHp', ({ hp }) => {
      this.store.dispatch(gameSetHp(hp));
    });
    this.unsubSink.push(unsubHp);

    const unsubMoney = eventBus.on('redux:setMoney', ({ money }) => {
      this.store.dispatch(gameSetMoney(money));
    });
    this.unsubSink.push(unsubMoney);

    const unsubCannonClick = eventBus.on('redux:selectedCannon', position => {
      const cannon =
        this.gameEngine.cannonManager.getCannonAtPosition(position);
      if (cannon) {
        this.store.dispatch(gameSelectEntity(cannon.toState()));
      }
    });
    this.unsubSink.push(unsubCannonClick);

    const unsubGameOver = eventBus.on('redux:gameOver', ({ isWin, score }) => {
      this.store.dispatch(gameOver({ isWin, score }));
    });
    this.unsubSink.push(unsubGameOver);

    if (NotificationService.isSupported()) {
      const unsubHpNotif = eventBus.on('redux:setPlayerHp', ({ hp }) => {
        if (hp <= GameConfig.lowHpThreshold && hp > 0) {
          NotificationService.notify({ type: 'low-hp', hp });
        }
      });
      this.unsubSink.push(unsubHpNotif);

      const unsubGameOverNotif = eventBus.on('redux:gameOver', ({ isWin }) => {
        NotificationService.notify({ type: 'game-over', isWin });
      });
      this.unsubSink.push(unsubGameOverNotif);
    }
  }

  // Этот метод обеспечивает синхронизацию от Redux к движку
  syncState(state: RootState) {
    // Обработка команды продажи
    if (state.game.pendingSellCannonId) {
      this.store.dispatch(gameClearSellCommand());
      const moneyBalance = this.gameEngine.sellCannon(
        state.game.pendingSellCannonId
      );
      this.store.dispatch(gameSelectEntity(null));
      this.store.dispatch(gameSetMoney(moneyBalance));
    }

    // Обработка команды апгрейда
    if (state.game.pendingUpgradeCannonId) {
      this.store.dispatch(gameClearUpgradeCommand());
      const success = this.gameEngine.upgradeCannon(
        state.game.pendingUpgradeCannonId
      );
      if (success !== null) {
        const cannon = this.gameEngine.cannonManager.getCannonById(
          state.game.pendingUpgradeCannonId
        );
        if (cannon) {
          this.store.dispatch(gameSelectEntity(cannon.toState()));
          this.store.dispatch(gameSetMoney(success));
        }
      }
    }

    // selectedCannon может быть null, чтобы отменить размещение, поэтому мы передаем его напрямую
    if (this.prevSelectedCannon !== state.game.selectedCannon) {
      this.prevSelectedCannon = state.game.selectedCannon;
      this.gameEngine.mapManager.setPlacingCannonType(
        state.game.selectedCannon
      );
    }

    if (this.prevWavesStarted !== state.game.wavesStarted) {
      this.gameEngine.setWavesStarted(state.game.wavesStarted);
    }
  }

  removeSubscriptions() {
    // Защита от повторной очистки
    if (this.isCleanedUp) {
      return;
    }
    this.isCleanedUp = true;
    this.unsubSink.forEach(unsub => unsub());
    this.unsubSink.length = 0;
  }
}
