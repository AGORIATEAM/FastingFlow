const { withEntitlementsPlist } = require('expo/config-plugins');

/**
 * Removes the aps-environment (Push Notifications) entitlement added by
 * expo-notifications. Free personal Apple teams cannot sign it, and the app
 * only uses LOCAL notifications, which do not require it.
 * Delete this plugin from app.json when moving to a paid team + real push.
 *
 * IMPORTANT: config-plugin mods run LIFO (last added runs first), so this
 * plugin must be listed BEFORE expo-notifications in app.json for its
 * delete to run AFTER their add.
 */
module.exports = function withNoPushEntitlement(config) {
  if (config.ios && config.ios.entitlements) {
    delete config.ios.entitlements['aps-environment'];
  }
  return withEntitlementsPlist(config, (c) => {
    delete c.modResults['aps-environment'];
    return c;
  });
};
