export interface ParsedDeviceInfo {
  deviceName: string;
  browser: string;
  os: string;
  deviceType: 'DESKTOP' | 'MOBILE' | 'TABLET' | 'OTHER';
}

export function parseUserAgent(uaString?: string | null): ParsedDeviceInfo {
  if (!uaString || typeof uaString !== 'string') {
    return {
      deviceName: 'Unknown Device',
      browser: 'Web Browser',
      os: 'Unknown OS',
      deviceType: 'DESKTOP',
    };
  }

  const ua = uaString.toLowerCase();

  // Detect OS
  let os = 'Unknown OS';
  let deviceType: 'DESKTOP' | 'MOBILE' | 'TABLET' | 'OTHER' = 'DESKTOP';
  let deviceName = 'PC';

  if (ua.includes('windows nt 10.0') || ua.includes('windows nt 11.0')) {
    os = 'Windows 11 / 10';
    deviceName = 'Windows PC';
    deviceType = 'DESKTOP';
  } else if (ua.includes('windows nt')) {
    os = 'Windows';
    deviceName = 'Windows PC';
    deviceType = 'DESKTOP';
  } else if (ua.includes('macintosh') || ua.includes('mac os x')) {
    os = 'macOS';
    deviceName = 'MacBook / Mac';
    deviceType = 'DESKTOP';
  } else if (ua.includes('ipad') || (ua.includes('macintosh') && ua.includes('mobile'))) {
    os = 'iPadOS';
    deviceName = 'Apple iPad';
    deviceType = 'TABLET';
  } else if (ua.includes('iphone')) {
    os = 'iOS';
    deviceName = 'Apple iPhone';
    deviceType = 'MOBILE';
  } else if (ua.includes('android')) {
    os = 'Android';
    deviceType = ua.includes('tablet') ? 'TABLET' : 'MOBILE';
    deviceName = deviceType === 'TABLET' ? 'Android Tablet' : 'Android Device';
  } else if (ua.includes('linux')) {
    os = 'Linux';
    deviceName = 'Linux Workstation';
    deviceType = 'DESKTOP';
  }

  // Detect Browser
  let browser = 'Web Browser';
  if (ua.includes('edg/') || ua.includes('edge/')) {
    browser = 'Microsoft Edge';
  } else if (ua.includes('opr/') || ua.includes('opera/')) {
    browser = 'Opera';
  } else if (ua.includes('samsungbrowser')) {
    browser = 'Samsung Internet';
  } else if (ua.includes('chrome/') && !ua.includes('edg') && !ua.includes('opr')) {
    browser = 'Google Chrome';
  } else if (ua.includes('safari/') && !ua.includes('chrome')) {
    browser = 'Apple Safari';
  } else if (ua.includes('firefox/')) {
    browser = 'Mozilla Firefox';
  }

  return {
    deviceName,
    browser,
    os,
    deviceType,
  };
}

export function formatIpLocation(ip?: string | null, userCityState?: string | null): string {
  if (!ip) return 'Local Network';
  const cleanIp = ip.replace(/^::ffff:/, '');
  if (cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp.startsWith('192.168.') || cleanIp.startsWith('10.')) {
    return userCityState ? `${cleanIp} • ${userCityState}` : `${cleanIp} • Local Host`;
  }
  return userCityState ? `${cleanIp} • ${userCityState}` : cleanIp;
}
