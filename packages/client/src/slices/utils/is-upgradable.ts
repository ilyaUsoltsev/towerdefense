import { GameConfig } from '../../pages/Game/constants/game-config';
import { SelectedEntity } from '../gameSlice';

export const isUpgradable = (
  money: number,
  selectedEntity: SelectedEntity
): boolean => {
  return (
    money >= selectedEntity.upgradeCost &&
    selectedEntity.level < GameConfig.maxCannonLevel &&
    selectedEntity.upgradeCost > 0
  );
};
