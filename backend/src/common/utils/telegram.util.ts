import * as crypto from 'crypto';

export function validateTelegramInitData(initData: string, botToken: string): boolean {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    if (!hash) return false;

    urlParams.delete('hash');

    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const secretKey = crypto.createHash('sha256').update(botToken).digest();
    const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (hmac !== hash) return false;

    const authDate = urlParams.get('auth_date');
    if (authDate) {
      const authTimestamp = parseInt(authDate, 10);
      const now = Math.floor(Date.now() / 1000);
      const maxAge = 86400;
      if (now - authTimestamp > maxAge) return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function parseTelegramInitData(initData: string): any {
  try {
    const urlParams = new URLSearchParams(initData);
    const user = urlParams.get('user');
    if (user) {
      return JSON.parse(decodeURIComponent(user));
    }
    return null;
  } catch {
    return null;
  }
}