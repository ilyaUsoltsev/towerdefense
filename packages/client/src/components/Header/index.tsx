import { ArrowRightFromSquare, Person } from '@gravity-ui/icons';
import { Avatar } from '@gravity-ui/uikit';
import { FC } from 'react';
import { Link } from 'react-router-dom';

import { selectUser } from '../../slices/userSlice';
import { useSelector } from '../../store';

import { useAuth } from '../../hooks/useAuth';

import { ROUTE } from '../../constants/ROUTE';

import ThemeToggle from '../ThemeToggle';

import styles from './Header.module.css';

const Header: FC = () => {
  const user = useSelector(selectUser);
  const { logout } = useAuth();

  return (
    <div className={styles.headerWrapper}>
      <Link to={ROUTE.USER} className={styles.userLink}>
        <div className={styles.avatarWrapper}>
          <Avatar icon={Person} aria-label="avatar" size="l" theme="brand" />
          <p>{user?.display_name}</p>
        </div>
      </Link>

      <div className={styles.actions}>
        <ThemeToggle />
        <button className={styles.iconButton} onClick={logout}>
          <ArrowRightFromSquare />
        </button>
      </div>
    </div>
  );
};

export default Header;
