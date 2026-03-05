import { HttpClient } from '../utils/httpClient';
import type { APIError, Theme, ThemeResponse } from './type';

export default class ThemeApi {
  constructor(private httpClient: HttpClient) {}

  async getTheme(): Promise<ThemeResponse | APIError> {
    return this.httpClient.get<ThemeResponse>('/theme');
  }

  async setTheme(theme: Theme): Promise<ThemeResponse | APIError> {
    return this.httpClient.put<ThemeResponse>('/theme', { theme });
  }
}
