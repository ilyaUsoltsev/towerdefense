import { FC } from 'react';
import { useDispatch, useSelector } from '../../store';
import { GameStats } from './components/GameStats';
import { WaveInfo } from './components/WaveInfo';
import Game from './Game';
import GameMenu from './GameMenu';
import { Button } from '@gravity-ui/uikit';
import { gameSetStartWaves } from '../../slices/gameSlice';

const GameScreen: FC = () => {
  const dispatch = useDispatch();
  const money = useSelector(state => state.game.money);
  const lives = useSelector(state => state.game.hp);
  const waveNumber = useSelector(state => state.game.waveNumber);
  const wavesStarted = useSelector(state => state.game.wavesStarted);

  return (
    <>
      <div className="flex gap-2">
        <div>
          <GameStats waveNumber={waveNumber} lives={lives} money={money} />
          <Game />
          {!wavesStarted && (
            <div className="flex justify-center w-full">
              <Button
                onClick={() => dispatch(gameSetStartWaves(!wavesStarted))}
                size="xl"
                view="action">
                Send Waves
              </Button>
            </div>
          )}
        </div>
        <GameMenu />
      </div>

      {waveNumber !== null && <WaveInfo waveNumber={waveNumber} />}
    </>
  );
};

export default GameScreen;
