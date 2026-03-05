import React from 'react';
import ReactDOM from 'react-dom/server';
import { Provider } from 'react-redux';
import { ServerStyleSheet } from 'styled-components';
import { Helmet } from 'react-helmet';
import { Request as ExpressRequest } from 'express';
import {
  createStaticHandler,
  createStaticRouter,
  StaticRouterProvider,
} from 'react-router-dom/server';
import { matchRoutes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '@gravity-ui/uikit';

import {
  createContext,
  createFetchRequest,
  createUrl,
} from './entry-server.utils';
import { reducer } from './store';
import { routes } from './routes';
import './index.css';
import { setPageHasBeenInitializedOnServer } from './slices/ssrSlice';
import { setTheme } from './slices/themeSlice';
import { SERVER_HOST } from './constants';

export const render = async (req: ExpressRequest) => {
  const { query, dataRoutes } = createStaticHandler(routes);
  const fetchRequest = createFetchRequest(req);
  const context = await query(fetchRequest);

  if (context instanceof Response) {
    throw context;
  }

  const store = configureStore({
    reducer,
  });

  const url = createUrl(req);

  const foundRoutes = matchRoutes(routes, url);
  if (!foundRoutes) {
    throw new Error('Страница не найдена!');
  }

  const [
    {
      route: { fetchData },
    },
  ] = foundRoutes;

  try {
    await fetchData!({
      dispatch: store.dispatch,
      state: store.getState(),
      ctx: createContext(req),
    });
  } catch (e) {
    console.log('Инициализация страницы произошла с ошибкой', e);
  }

  store.dispatch(setPageHasBeenInitializedOnServer(true));

  try {
    const themeRes = await fetch(`${SERVER_HOST}/api/theme`, {
      headers: { cookie: req.headers.cookie ?? '' },
    });
    if (themeRes.ok) {
      const { theme } = await themeRes.json();
      store.dispatch(setTheme(theme));
    }
  } catch {
    // default theme used
  }

  const router = createStaticRouter(dataRoutes, context);
  const sheet = new ServerStyleSheet();
  try {
    const html = ReactDOM.renderToString(
      sheet.collectStyles(
        <Provider store={store}>
          <ThemeProvider theme={store.getState().theme.theme}>
            <StaticRouterProvider router={router} context={context} />
          </ThemeProvider>
        </Provider>
      )
    );
    const styleTags = sheet.getStyleTags();

    const helmet = Helmet.renderStatic();

    return {
      html,
      helmet,
      styleTags,
      initialState: store.getState(),
    };
  } finally {
    sheet.seal();
  }
};
