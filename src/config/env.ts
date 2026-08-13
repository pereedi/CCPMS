import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || '5000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  JWT_SECRET: process.env.JWT_SECRET || 'ccpms_secret_jwt_key_2026_antigravity',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'ccpms_refresh_secret_key_2026_antigravity',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Was "https://connect.kingsch.at/api" — missing the "/developer" segment,
  // so GET `${KINGSCHAT_API_URL}/user/profile` was hitting a path that
  // doesn't exist per the KingsChat dev docs.
  KINGSCHAT_API_URL: process.env.KINGSCHAT_API_URL || 'https://connect.kingsch.at/developer/api',
  KINGSCHAT_OAUTH_TOKEN_URL: process.env.KINGSCHAT_OAUTH_TOKEN_URL || 'https://connect.kingsch.at/developer/api/oauth2/token',

  // Required by the KC docs for every request (profile fetch AND token exchange).
  // Get this from your project's page in the KingsChat developer portal.
  KINGSCHAT_API_KEY: process.env.KINGSCHAT_API_KEY || '',
  KINGSCHAT_CLIENT_ID: process.env.KINGSCHAT_CLIENT_ID || '',

  DEV_MOCK_KINGSCHAT: process.env.DEV_MOCK_KINGSCHAT === 'true',
};