import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { SERVER_HOST } from '../constants';
import { HttpClient } from '../utils/httpClient';
import ThemeApi from '../api/theme';
import { isApiError } from '../api/isApiError';
import type { Theme, ThemeResponse } from '../api/type';

const THEME_STORAGE_KEY = 'theme';
const DEFAULT_THEME: Theme = 'light';

const httpClient = new HttpClient({ baseUrl: `${SERVER_HOST}/api` });
const themeApi = new ThemeApi(httpClient);

export interface ThemeState {
  theme: Theme;
}

const initialState: ThemeState = { theme: DEFAULT_THEME };

export const fetchThemeThunk = createAsyncThunk(
  'theme/fetch',
  async (_, { rejectWithValue }) => {
    const result = await themeApi.getTheme();
    if (isApiError(result)) return rejectWithValue(result);
    return (result as ThemeResponse).theme;
  }
);

export const setThemeThunk = createAsyncThunk(
  'theme/set',
  async (theme: Theme, { rejectWithValue }) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
    const result = await themeApi.setTheme(theme);
    if (isApiError(result)) return rejectWithValue(result);
    return (result as ThemeResponse).theme;
  }
);

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchThemeThunk.fulfilled, (state, action) => {
        state.theme = action.payload;
      })
      .addCase(setThemeThunk.pending, (state, action) => {
        state.theme = action.meta.arg; // optimistic update
      })
      .addCase(setThemeThunk.fulfilled, (state, action) => {
        state.theme = action.payload;
      });
  },
});

export const { setTheme } = themeSlice.actions;
export const selectTheme = (state: RootState) => state.theme.theme;
export default themeSlice.reducer;
