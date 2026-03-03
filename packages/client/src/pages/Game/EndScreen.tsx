import { Button, Card } from '@gravity-ui/uikit';
import { FC } from 'react';
import styles from './Game.module.css';
import { ROUTE } from '../../constants/ROUTE';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from '../../store';
import { gameSetState } from '../../slices/gameSlice';
import { GAME_STATE } from '../../constants/GAME_STATE';

const EndScreen: FC = () => {
  const dispatch = useDispatch();

  const gameResult = useSelector(state => state.game.result);

  const onRepeatGame = () => {
    dispatch(gameSetState(GAME_STATE.LOADING));
  };
  const onClickToMain = () => {
    dispatch(gameSetState(GAME_STATE.START));
  };

  return (
    <Card className={styles.resultCard__wrapper}>
      <h2 className={styles.resultCard__title}>
        {gameResult?.isWin ? 'Victory' : 'Game Over'}
      </h2>
      <img src="/divider.svg" />
      <div className={styles.resultCard__infoBlock}>
        <div className={styles.resultCard__infoRow}>
          <span>Score</span>
          <span className={styles.resultCard__value}>
            {gameResult?.score || 0}
          </span>
        </div>
      </div>
      <div className={styles.resultCard__buttonWrapper}>
        <Button view="action" size="xl" onClick={onRepeatGame}>
          Repeat
        </Button>
        <Link to={ROUTE.ROOT} onClick={onClickToMain}>
          <Button view="action" size="xl">
            Main Menu
          </Button>
        </Link>
      </div>
    </Card>
  );
};

export default EndScreen;
