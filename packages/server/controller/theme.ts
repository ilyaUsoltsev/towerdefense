import type { Request, Response } from 'express';
import { UserPreference } from '../models';
import { THEME_VALUES, type Theme } from '../types/theme';
import type { AuthRequest } from '../types/auth';

const DEFAULT_THEME: Theme = 'light';

export const themeController = {
  async getTheme(req: Request, res: Response) {
    try {
      const userid = (req as AuthRequest).user?.id;
      if (!userid) {
        return res.status(200).json({ theme: DEFAULT_THEME });
      }
      const preference = await UserPreference.findOne({ where: { userid } });
      return res
        .status(200)
        .json({ theme: preference?.theme ?? DEFAULT_THEME });
    } catch (error: any) {
      return res
        .status(500)
        .json({ error: 'Ошибка получения темы', details: error.message });
    }
  },

  async setTheme(req: Request, res: Response) {
    try {
      const { theme } = req.body;
      if (!theme || typeof theme !== 'string') {
        return res
          .status(400)
          .json({ error: 'Поле theme обязательно и должно быть строкой' });
      }
      const normalizedTheme = theme.trim().toLowerCase() as Theme;
      if (!THEME_VALUES.includes(normalizedTheme)) {
        return res
          .status(400)
          .json({ error: 'Недопустимое значение темы', allowed: THEME_VALUES });
      }
      const userid = (req as AuthRequest).user?.id;
      if (!userid) {
        return res.status(200).json({ theme: normalizedTheme });
      }
      await UserPreference.upsert({ userid, theme: normalizedTheme });
      return res.status(200).json({ theme: normalizedTheme });
    } catch (error: any) {
      return res
        .status(500)
        .json({ error: 'Ошибка сохранения темы', details: error.message });
    }
  },
};
