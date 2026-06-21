/**
 * Gets or creates a persistent device ID stored in localStorage to uniquely
 * identify this user across page reloads.
 */
export function getPersistentDeviceId(): string {
  let deviceId = localStorage.getItem('driptrip_device_id');
  if (!deviceId) {
    // Generate a secure random pseudo-UUID
    deviceId = 'device-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('driptrip_device_id', deviceId);
  }
  return deviceId;
}
