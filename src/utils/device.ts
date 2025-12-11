/**
 * Device Utilities
 * Collects device information for authentication requests
 */

import { DeviceInfo } from '../types/auth.types';

/**
 * Generate device ID (stored in localStorage)
 */
const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('device_id');
  
  if (!deviceId) {
    // Generate a unique device ID
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('device_id', deviceId);
  }
  
  return deviceId;
};

/**
 * Get user agent
 */
const getUserAgent = (): string => {
  return navigator.userAgent;
};

/**
 * Get platform
 */
const getPlatform = (): string => {
  const userAgent = navigator.userAgent;
  
  if (/android/i.test(userAgent)) return 'Android';
  if (/iPad|iPhone|iPod/.test(userAgent)) return 'iOS';
  if (/Win/.test(userAgent)) return 'Windows';
  if (/Mac/.test(userAgent)) return 'macOS';
  if (/Linux/.test(userAgent)) return 'Linux';
  
  return 'Unknown';
};

/**
 * Get browser
 */
const getBrowser = (): string => {
  const userAgent = navigator.userAgent;
  
  if (userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Edg') === -1) return 'Chrome';
  if (userAgent.indexOf('Firefox') > -1) return 'Firefox';
  if (userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1) return 'Safari';
  if (userAgent.indexOf('Edg') > -1) return 'Edge';
  if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) return 'Opera';
  
  return 'Unknown';
};

/**
 * Get device information
 */
export const getDeviceInfo = (): DeviceInfo => {
  return {
    deviceId: getDeviceId(),
    userAgent: getUserAgent(),
    platform: getPlatform(),
    browser: getBrowser(),
    // IP address would be fetched from backend or a service
    // ipAddress: await fetchIpAddress(),
  };
};

