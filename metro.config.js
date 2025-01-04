const { getDefaultConfig } = require('@expo/metro-config')

const defaultConfig = getDefaultConfig(__dirname)

const exclusionList = require('metro-config/src/defaults/exclusionList')

defaultConfig.resolver.blacklistRE = exclusionList([/server\/.*/])

module.exports = defaultConfig
