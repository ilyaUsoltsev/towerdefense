import { Button, Card } from '@gravity-ui/uikit';
import { useDispatch, useSelector } from '../../store';
import {
  gameSellSelectedEntity,
  gameSelectCannon,
  gameUpgradeSelectedEntity,
} from '../../slices/gameSlice';
import {
  CannonsConfig,
  CannonType,
  CannonTypes,
} from './constants/cannons-config';
import { EffectsConfig } from './constants/effects-config';
import { getFireFreq } from './utils/get-fire-freq';
import { isUpgradable } from '../../slices/utils/is-upgradable';
import { SoundLib } from '../../audio/audio';

const GameMenu = () => {
  const selectedEntity = useSelector(state => state.game.selectedEntity);
  const gameSelectedCannon = useSelector(state => state.game.selectedCannon);
  const money = useSelector(state => state.game.money);
  const dispatch = useDispatch();

  const sellSelectedEntity = () => {
    dispatch(gameSellSelectedEntity());
  };

  const upgradeSelectedEntity = () => {
    dispatch(gameUpgradeSelectedEntity());
  };

  const chooseCannon = (type: CannonType) => {
    dispatch(gameSelectCannon(type));
  };

  return (
    <div className="flex-col gap-2" style={{ width: '200px' }}>
      <div className="flex gap-2">
        {CannonTypes.map(cannonType => (
          <span
            key={cannonType}
            className="cursor-pointer"
            onClick={() => {
              chooseCannon(cannonType);
              SoundLib('click');
            }}>
            <img
              src={CannonsConfig[cannonType].imagePath}
              alt={cannonType}
              width={30}
            />
          </span>
        ))}
      </div>
      {!!gameSelectedCannon && (
        <Card className="p-2 flex-col gap-2">
          <p>{CannonsConfig[gameSelectedCannon].name}</p>
          <p>Урон: {CannonsConfig[gameSelectedCannon].damage}</p>
          <p>
            Эффект:{' '}
            {EffectsConfig[gameSelectedCannon]
              ? EffectsConfig[gameSelectedCannon]?.name
              : 'Нет'}
          </p>
          <p>Дальность: {CannonsConfig[gameSelectedCannon].range}</p>
          <p>
            Частота:&nbsp;
            {getFireFreq(CannonsConfig[gameSelectedCannon].fireRate)} Гц
          </p>
          <p>Стоимость: {CannonsConfig[gameSelectedCannon].cost}</p>
        </Card>
      )}

      {selectedEntity && (
        <Card className="p-2 flex-col gap-2">
          {/* <p>ID: {selectedEntity.id}</p> */}
          <p>Type: {selectedEntity.type}</p>
          <p>Level: {selectedEntity.level}</p>
          <p>Damage: {Math.round(selectedEntity.damage)}</p>
          <p>Range: {Math.round(selectedEntity.range)}</p>
          <p>
            Frequency:&nbsp;
            {getFireFreq(selectedEntity.fireRate)} Гц
          </p>
          <p>Upgrade Cost: {selectedEntity.upgradeCost}</p>
          <Button
            view="action"
            onClick={upgradeSelectedEntity}
            disabled={!isUpgradable(money, selectedEntity)}>
            Upgrade
          </Button>
          <Button view="outlined" onClick={sellSelectedEntity}>
            Sell
          </Button>
        </Card>
      )}
    </div>
  );
};

export default GameMenu;
