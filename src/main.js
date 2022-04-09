import i18n          from 'i18n-js'
import bootstrap     from 'Lib/bootstrap'
import PreloadState  from 'Lib/states/preload'
import config        from './config'
import gameLevel     from './levels/level.game.json'
import tutorialLevel from './levels/level.tutorial.json'
import GameState     from './states/State.snake'
import TutorialState from './states/State.tutorial'
import strings       from './i18n'

import './fonts.css'

i18n.translations = strings

config.states = [
  {
    key        : config.constants.States.PRELOAD,
    constructor: new PreloadState(config.gameResources, config.preloadSettings),
  },
  {
    key        : config.constants.States.GAME,
    constructor: new TutorialState(config.gameSettings, tutorialLevel, i18n.t),
  },
  {
    key        : config.constants.States.GAME_STATE,
    constructor: new GameState(config.gameSettings, gameLevel, i18n.t),
  },
]

bootstrap(config)
