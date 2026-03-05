import { Moon, Sun } from '@gravity-ui/icons';
import { FC } from 'react';
import { useDispatch, useSelector } from '../../store';
import { selectTheme, setThemeThunk } from '../../slices/themeSlice';
import styles from './ThemeToggle.module.css';

const ThemeToggle: FC = () => {
  const dispatch = useDispatch();
  const theme = useSelector(selectTheme);

  const toggle = () => {
    dispatch(setThemeThunk(theme === 'light' ? 'dark' : 'light'));
  };

  return (
    <button
      className={styles.button}
      onClick={toggle}
      aria-label="Toggle theme">
      {theme === 'light' ? <Moon /> : <Sun />}
    </button>
  );
};

export default ThemeToggle;
