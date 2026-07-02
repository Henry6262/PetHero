const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const bunStoreRoot = path.resolve(workspaceRoot, 'node_modules/.bun');

config.watchFolders = [workspaceRoot, bunStoreRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Bun stores packages under node_modules/.bun/<pkg>@<version>/node_modules/<pkg>.
// Metro needs to be able to resolve peer deps from those deep paths.
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_conditionNames = ['require', 'default', 'browser'];

// Allow .glb 3D model assets to be bundled.
config.resolver.assetExts.push('glb');

module.exports = config;
