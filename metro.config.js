const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Resolve Hermes dependency conflicts
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Fix Hermes parser version conflicts
config.resolver.alias = {
  'hermes-parser': require.resolve('hermes-parser'),
  'hermes-estree': require.resolve('hermes-estree'),
};

module.exports = config;