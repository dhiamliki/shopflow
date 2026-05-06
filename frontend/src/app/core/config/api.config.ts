import { environment } from '../../../environments/environment';

export const API_BASE_URL = environment.apiBaseUrl;

export const STORAGE_KEYS = {
  session: 'shopflow.session'
} as const;
