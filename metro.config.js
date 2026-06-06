const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Support .mjs / .cjs files used by @noble/* packages
config.resolver.sourceExts.push('mjs', 'cjs');

// @noble/* packages use internal file paths (e.g. crypto.js) that are not
// listed in their package.json "exports" field. Disabling strict exports
// resolution falls back to the legacy file-based resolver, which finds them.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
