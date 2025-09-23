const { defineConfig } = require('@electron-forge/cli');

module.exports = defineConfig({
  packagerConfig: {
    name: 'JYZE.AI Desktop',
    executableName: 'jyze-desktop',
    icon: './assets/icon',
    extraResource: [
      './dist'
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'jyze_desktop'
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin']
    },
    {
      name: '@electron-forge/maker-deb',
      config: {}
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {}
    }
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'jyze-ai',
          name: 'desktop-app'
        }
      }
    }
  ]
});
