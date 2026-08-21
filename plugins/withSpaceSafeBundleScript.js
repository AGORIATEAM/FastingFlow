const { withXcodeProject } = require('expo/config-plugins');

/**
 * The RN template's "Bundle React Native code and images" phase executes an
 * unquoted backtick substitution — it word-splits on the space in
 * "PROJET DEV" and fails. Capture into a var and execute it quoted.
 */
module.exports = function withSpaceSafeBundleScript(config) {
  return withXcodeProject(config, (c) => {
    const phases = c.modResults.hash.project.objects.PBXShellScriptBuildPhase || {};
    for (const key of Object.keys(phases)) {
      const phase = phases[key];
      if (
        phase &&
        typeof phase === 'object' &&
        typeof phase.shellScript === 'string' &&
        phase.shellScript.includes('react-native-xcode.sh')
      ) {
        phase.shellScript = phase.shellScript.replace(
          /`([^`]*react-native-xcode\.sh[^`]*)`/,
          'RN_XCODE=$($1)\\n\\"$RN_XCODE\\"'
        );
      }
    }
    return c;
  });
};
