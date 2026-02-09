// Load environment variables for web builds
require('dotenv').config();

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;
