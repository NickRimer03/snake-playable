import resize from 'Lib/resize/v0.2/resize'
import GameObjectsFactory from 'Lib/factory/v0.2/factory'
import {setDimensions, setPosition} from 'Lib/utils'

export default class TutorialState extends Phaser.State {
  constructor(settings, level, t) {
    super()
    this.settings = settings
    this.level = level
    this.t = t
  }

  create() {
    this.factory = new GameObjectsFactory(this, this.t)
    this.factory.createGameObjects(this.level)

    this.containers = this.factory.objects.containers
    this.sprites = this.factory.objects.sprites
    this.texts = this.factory.objects.texts

    const {snake} = this.sprites
    const animation = snake.animations.add('snake', Phaser.Animation.generateFrameNames('snake-', 0, 61, '.png'))

    animation.play(30).onComplete.addOnce(() => {
      const animations = []
      const {col1, col2, row1, row2} = this.texts

      this.game.add.tween(this.containers.match)
        .to({alpha: 1}, Phaser.Timer.HALF, Phaser.Easing.Linear.None, true)

      for (const obj of [col1, col2, row1, row2]) {
        animations.push(new Promise((resolve) => {
          this.game.add.tween(obj.scale)
            .to({x: 2.5, y: 2.5}, Phaser.Timer.QUARTER, Phaser.Easing.Linear.None, true)
            .repeat(2)
            .yoyo(true)
            .onComplete
            .addOnce(resolve)
        }))
      }

      Promise.all(animations).then(() => {
        const fadeAnimations = []
        const {col1, col2, row1, row2} = this.texts
        const {swipe, match, cta} = this.containers
        const {logo} = this.sprites

        this.game.time.events.add(Phaser.Timer.SECOND * 3, () => {
          fadeAnimations.push(new Promise((resolve) => {
            this.camera.fade()
            this.camera.onFadeComplete.addOnce(resolve)
          }))

          for (const obj of [col1, col2, row1, row2, swipe, match, cta, logo]) {
            fadeAnimations.push(new Promise((resolve) => {
              this.game.add.tween(obj)
                .to({alpha: 0}, Phaser.Timer.HALF, Phaser.Easing.Linear.None, true)
                .onComplete
                .addOnce(resolve)
            }))
          }

          Promise.all(fadeAnimations).then(() => {
            this.state.start(this.game.constants.States.GAME_STATE)
          })
        })
      })
    })

    this.resize()
  }

  adjustObject(setDim, setPos, object, data) {
    [object.width, object.height] = setDim(data ?? object)
    object.position.set(...setPos(data ?? object))
  }

  resize(w, h) {
    const [width, height, , factorUI, isLandscape] = resize(this, w, h, this.factory.objects.cameraSettings)

    const setDim = setDimensions.bind(null, factorUI)
    const setPos = setPosition.bind(null, width, height, factorUI, isLandscape)
    const adjObj = this.adjustObject.bind(this, setDim, setPos)

    const {logo} = this.sprites
    const {cta, swipe, match} = this.containers

    for (const obj of [logo, cta, swipe, match]) {
      adjObj(obj)
    }
  }

  shutdown() {
    this.containers.uiLayer.destroy()
    this.factory.clearGameObject()
  }
}
