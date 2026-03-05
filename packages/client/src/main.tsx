import '@gravity-ui/uikit/styles/fonts.css';
import '@gravity-ui/uikit/styles/styles.css';
import { startServiceWorker } from './utils/ServiceWorker';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { routes } from './routes';
import { ThemeProvider } from '@gravity-ui/uikit';
import './index.css';
import { FC, PropsWithChildren, useEffect } from 'react';
import { useDispatch, useSelector } from './store';
import { selectTheme, setTheme } from './slices/themeSlice';
import type { Theme } from './api/type';

const ThemedApp: FC<PropsWithChildren> = ({ children }) => {
  const theme = useSelector(selectTheme);
  const dispatch = useDispatch();

  // On mount: restore theme from localStorage (unauth users or non-SSR dev mode).
  // Auth users in SSR get their theme from window.APP_INITIAL_STATE before hydration.
  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored) dispatch(setTheme(stored));
  }, [dispatch]);

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

const router = createBrowserRouter(routes);

ReactDOM.hydrateRoot(
  document.getElementById('root') as HTMLElement,
  <Provider store={store}>
    <ThemedApp>
      <RouterProvider router={router} />
    </ThemedApp>
  </Provider>
);

startServiceWorker();
