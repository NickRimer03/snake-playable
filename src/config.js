export default {
  width : window.innerWidth,
  height: window.innerHeight,

  constants: {
    FF_BASE: 'PT Serif Bold',

    States: {
      BOOT      : 'boot',
      PRELOAD   : 'preload',
      GAME      : 'tutorial',
      GAME_STATE: 'real_game',
    },
    Sprites: {
      MAIN     : 'main',
      PRELOADER: 'preloader',
    },
  },

  fonts: [
    'PT Serif Bold',
  ],

  preloadSettings: {
    textStyle: {
      fontSize       : 36,
      fill           : '#fcd769',
      stroke         : '#fcd769',
      strokeThickness: 0,
      offsetY        : 20,
    },
    background: {
      key  : 'background_preload',
      alpha: 1,
    },
    logo: {
      landscape: {
        scale   : 0.5,
        offsetY : -0.2,
        position: Phaser.CENTER,
      },
      portrait: {
        scale   : 0.8,
        offsetY : -0.075,
        position: Phaser.CENTER,
      },
      '1x1': {
        scale   : 0.5,
        offsetY : -0.1,
        position: Phaser.CENTER,
      },
    },
    preloader: {
      landscape: {
        scale   : 0.6,
        offsetY : 0.2,
        position: Phaser.CENTER,
      },
      portrait: {
        scale   : 1,
        offsetY : 0.15,
        position: Phaser.CENTER,
      },
      '1x1': {
        scale   : 0.8,
        offsetY : 0.2,
        position: Phaser.CENTER,
      },
    },
    preloaderBar : 'bar.png',
    preloaderFill: 'progress-bar.png',
  },

  gameSettings: {},

  finalSettings: {},

  preloadResources: [
    {
      type: 'image',
      key : 'background_preload',
      url : require('Assets/images/uch/snake/background/background.jpg'),
    },
    {
      type: 'image',
      key : 'logo',
      url : require('Assets/images/uch/snake/ui/logo.png'),
    },
    {
      type: 'atlas',
      key : 'preloader',
      url : require('Assets/images/uch/snake/ui/preloader.png'),
      json: require('Assets/images/uch/snake/ui/preloader.json'),
    },
  ],

  gameResources: [
    {
      type: 'atlas',
      key : 'main',
      url : require('Assets/images/uch/atlas/snake_atlas.png'),
      json: require('Assets/images/uch/atlas/snake_atlas.json'),
    },
    {
      type: 'atlas',
      key : 'snake_animation',
      url : require('Assets/images/uch/atlas/snake_animation.png'),
      json: require('Assets/images/uch/atlas/snake_animation.json'),
    },
  ],
}
