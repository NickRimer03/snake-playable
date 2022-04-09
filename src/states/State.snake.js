import resize from 'Lib/resize/v0.2/resize'
import GameObjectsFactory from 'Lib/factory/v0.2/factory'
import {onCtaActionExported, setDimensions, setPosition} from 'Lib/utils'
import {getDirection} from '../utils'

export default class GameState extends Phaser.State {
  constructor(settings, level, t) {
    super()
    this.settings = settings
    this.level = level
    this.t = t
    //
    this.shakeAnimation = null
    this.play = false
    this.rollingBack = false
    this.fieldDim = 5
    this.cellDim = 80
    this.old = {x: 0, y: 0}
    this.moves = []
    this.missedMoves = []
    this.errors = 0
    this.valid = {
      x: [1, 2, 4, 5, 3],
      y: [4, 4, 3, 2, 2],
    }
    // FOR QUICK TESTS
    // this.valid = {
    //   x: [1, 1, 1, 1, 5],
    //   y: [5, 1, 1, 1, 1],
    // }
    this.cellFrames = {
      EMPTY      : 'point_normal.png',
      EMPTY_HOVER: 'point_hover.png',
      HEAD       : 'head_normal.png',
      HEAD_HOVER : 'head_hover.png',
      STRAIGHT   : 'body_straight.png',
      CORNER     : 'body_corner.png',
    }
    this.headAngles = {
      DOWN : 0,
      LEFT : 90,
      UP   : -180,
      RIGHT: -90,
    }
    this.cornerAngles = {
      DOWN_RIGHT: 0,
      LEFT_UP   : 0,
      UP_RIGHT  : 90,
      LEFT_DOWN : 90,
      UP_LEFT   : -180,
      RIGHT_DOWN: -180,
      DOWN_LEFT : -90,
      RIGHT_UP  : -90,
    }
    this.straightAngles = {
      DOWN : 0,
      UP   : 0,
      LEFT : 90,
      RIGHT: 90,
    }
    Object.freeze(this.cellFrames)
    Object.freeze(this.headAngles)
    Object.freeze(this.cornerAngles)
    Object.freeze(this.straightAngles)
  }

  create() {
    this.factory = new GameObjectsFactory(this, this.t)
    this.factory.createGameObjects(this.level)

    this.containers = this.factory.objects.containers
    this.sprites = this.factory.objects.sprites
    this.texts = this.factory.objects.texts
    this.events = this.factory.objects.events

    this.events.ctaClick.add(onCtaActionExported)

    this.drawField()

    this.resize()

    this.game.input.onUp.add(this.releaseHead.bind(this))

    this.fadeInScene()
  }

  fadeInScene() {
    const {logo} = this.sprites
    const {cta, field, drag} = this.containers

    this.camera.fadeIn()

    for (const obj of [logo, cta, field, drag]) {
      this.game.add.tween(obj)
        .to({alpha: 1}, Phaser.Timer.HALF, Phaser.Easing.Linear.None, true)
    }
  }

  get head() {
    return Object.values(this.sprites).find(({frameName}) => [this.cellFrames.HEAD_HOVER, this.cellFrames.HEAD].includes(frameName))
  }

  set head(frame) {
    this.head.frameName = frame
  }

  get dot() {
    return Object.values(this.sprites).find(({frameName}) => frameName === this.cellFrames.EMPTY_HOVER)
  }

  set dot(frame) {
    this.dot.frameName = frame
  }

  releaseHead() {
    this.play = false

    this.head && (this.head = this.cellFrames.HEAD)
    this.dot && (this.dot = this.cellFrames.EMPTY)
  }

  cellClick(cell) {
    if (cell.frameName === this.cellFrames.HEAD) {
      this.play = true
      cell.frameName = this.cellFrames.HEAD_HOVER
    }
  }

  cellOver(cell) {
    const {x, y} = cell.data
    const {obstacles, data} = this.findObstacles(x, y)

    if (this.play && cell.frameName === this.cellFrames.EMPTY && !obstacles) {
      cell.frameName = this.cellFrames.EMPTY_HOVER

      if (data) {
        const {frames, direction} = data;

        ['LEFT', 'UP'].includes(direction) && frames.reverse()
        frames.push(cell)

        this.dot.frameName = this.cellFrames.EMPTY

        for (let i = 0; i < frames.length; i += 1) {
          const frame = frames[i]
          frame.frameName = this.cellFrames.EMPTY_HOVER
          const {x: fx, y: fy} = frame.data

          this.moveTo(fx, fy)
          this.old.x = fx
          this.old.y = fy
        }
      } else {
        this.moveTo(x, y)
      }
    }
  }

  cellOut(cell) {
    const {x, y} = cell.data

    if (this.play && cell.frameName === this.cellFrames.EMPTY_HOVER) {
      cell.frameName = this.cellFrames.EMPTY
    }

    if (this.head === cell) {
      [this.old.x, this.old.y] = [x, y]
    }
  }

  moveTo(x, y) {
    const {x: ox, y: oy} = this.old
    const direction = getDirection(x, y, ox, oy)
    const {head: previous, dot: current} = this
    const {angle: headAngle} = this.head;

    [this.head, previous.angle, current.angle] = this.step(direction, previous.angle)
    this.dot = this.cellFrames.HEAD_HOVER

    this.recordMove(ox, oy, headAngle)

    this.placeCross(direction, this.head.x, this.head.y, this.moves.length - 1)

    this.changeText()

    this.checkFinish()
  }

  changeText() {
    // const a = this.moves.concat([{x: (this.head.x - this.cellDim / 2) / this.cellDim, y: (this.head.y - this.cellDim / 2) / this.cellDim}])
    const {x, y} = this.head.data
    const a = this.moves.concat([{x, y}])
    const z = a.reduce((p, c) => {
      const u = {...p}

      u.x[c.x] = p.x[c.x] ? p.x[c.x] + 1 : 1
      u.y[c.y] = p.y[c.y] ? p.y[c.y] + 1 : 1

      return u
    }, {x: [], y: []})

    for (let i = 0; i < this.fieldDim; i += 1) {
      const colText = this.texts[`col_text_${i}`]
      const rowText = this.texts[`row_text_${i}`]
      const comparison = [String(z.x[i]), String(z.y[i])]

      for (const [index, text] of [colText, rowText].entries()) {
        if (text.text === comparison[index]) {
          text.fill = '#ffffff'
          text.alive = true
        } else {
          text.fill = '#ff0000'
          text.alive = false
        }
      }
    }
  }

  step(direction, previousAngle) {
    if (direction === 'DOWN') {
      if (previousAngle === this.headAngles.RIGHT) {
        return [this.cellFrames.CORNER, this.cornerAngles.RIGHT_DOWN, this.headAngles.DOWN]
      }
      if (previousAngle === this.headAngles.DOWN) {
        return [this.cellFrames.STRAIGHT, this.straightAngles.DOWN, this.headAngles.DOWN]
      }
      // LEFT-DOWN
      return [this.cellFrames.CORNER, this.cornerAngles.LEFT_DOWN, this.headAngles.DOWN]
    }

    if (direction === 'RIGHT') {
      if (previousAngle === this.headAngles.DOWN) {
        return [this.cellFrames.CORNER, this.cornerAngles.DOWN_RIGHT, this.headAngles.RIGHT]
      }
      if (previousAngle === this.headAngles.RIGHT) {
        return [this.cellFrames.STRAIGHT, this.straightAngles.RIGHT, this.headAngles.RIGHT]
      }
      // UP-RIGHT
      return [this.cellFrames.CORNER, this.cornerAngles.UP_RIGHT, this.headAngles.RIGHT]
    }

    if (direction === 'UP') {
      if (previousAngle === this.headAngles.RIGHT) {
        return [this.cellFrames.CORNER, this.cornerAngles.RIGHT_UP, this.headAngles.UP]
      }
      if (previousAngle === this.headAngles.UP) {
        return [this.cellFrames.STRAIGHT, this.straightAngles.UP, this.headAngles.UP]
      }
      // LEFT-UP
      return [this.cellFrames.CORNER, this.cornerAngles.LEFT_UP, this.headAngles.UP]
    }

    // LEFT
    if (previousAngle === this.headAngles.DOWN) {
      return [this.cellFrames.CORNER, this.cornerAngles.DOWN_LEFT, this.headAngles.LEFT]
    }
    if (previousAngle === this.headAngles.LEFT) {
      return [this.cellFrames.STRAIGHT, this.straightAngles.LEFT, this.headAngles.LEFT]
    }
    // UP-LEFT
    return [this.cellFrames.CORNER, this.cornerAngles.UP_LEFT, this.headAngles.LEFT]
  }

  getCrossPosition(direction, x, y) {
    const halfCell = this.cellDim / 2

    if (direction === 'DOWN') {
      return [x, y - halfCell]
    }
    if (direction === 'RIGHT') {
      return [x - halfCell, y]
    }
    if (direction === 'LEFT') {
      return [x + halfCell, y]
    }
    // UP
    return [x, y + halfCell]
  }

  recordMove(x, y, angle) {
    this.moves.push({x, y, angle})
  }

  placeCross(direction, x, y, id) {
    const [cx, cy] = this.getCrossPosition(direction, x, y)

    const cross = this.game.make.image(cx, cy, 'main', 'cross_normal.png')

    cross.anchor.set(0.5)
    cross.inputEnabled = true
    cross.data = {id}

    cross.events.onInputOver.add(this.crossOver.bind(this))
    cross.events.onInputOut.add(this.crossOut.bind(this))
    cross.events.onInputDown.add(this.crossDown.bind(this))
    cross.events.onInputUp.add(this.crossUp.bind(this))

    this.sprites[`cross_${id}`] = cross
    this.containers.cells.add(cross)
  }

  crossOver(cross) {
    if (cross.input.pointerDown()) {
      cross.frameName = 'cross_hover.png'
    }
  }

  crossOut(cross) {
    if (cross.input.pointerDown()) {
      cross.frameName = 'cross_normal.png'
    }
  }

  crossDown(cross) {
    cross.frameName = 'cross_hover.png'
  }

  crossUp(cross) {
    cross.frameName = 'cross_normal.png'

    if (!this.rollingBack && cross.input.pointerOver()) {
      this.rollingBack = true
      this.stepBack(cross.data.id)
    }
  }

  stepBack(id) {
    this.timer = this.game.time.events.add(Phaser.Timer.SECOND * 0.05, () => {
      const {x, y, angle} = this.moves.pop()
      const cell = this.sprites[`cell_${x}_${y}`]
      const {head} = this

      head.frameName = this.cellFrames.EMPTY
      head.angle = 0

      cell.frameName = this.cellFrames.HEAD
      cell.angle = angle

      this.sprites[`cross_${this.moves.length}`].destroy()

      if (this.moves.length > id) {
        this.stepBack(id)
      } else {
        this.rollingBack = false
      }

      this.changeText()
    })
    this.timer.timer.start()
  }

  findObstacles(x, y) {
    const {x: ox, y: oy} = this.old
    let v
    let ov
    let name

    if (y === oy) {
      [v, ov] = [x, ox]
      name = `cell_X_${y}`
    } else if (x === ox) {
      [v, ov] = [y, oy]
      name = `cell_${x}_X`
    } else {
      return {obstacles: true}
    }

    const min = Math.min(v, ov)
    const max = Math.max(v, ov)

    if (max - min === 1) {
      return {obstacles: false}
    }

    const frames = []
    const direction = getDirection(x, y, ox, oy)

    for (let i = min + 1; i < max; i += 1) {
      frames.push(this.sprites[name.replace('X', String(i))])
    }

    return {
      obstacles: frames.some(({frameName}) => frameName !== this.cellFrames.EMPTY),
      data     : {
        frames,
        direction,
      },
    }
  }

  checkFinish() {
    const {x, y} = this.head.data

    if (x === this.fieldDim - 1 && y === this.fieldDim - 1) {
      const wrongTexts = Object.entries(this.texts).filter(([, text]) => !text.alive)

      if (wrongTexts.length > 0) {
        if (this.errors > 0) {
          this.disableInput()
        }

        const textAnimations = []

        for (const [, text] of wrongTexts) {
          textAnimations.push(new Promise((resolve) => {
            this.game.add.tween(text.scale)
              .to({x: 2, y: 2}, Phaser.Timer.QUARTER, Phaser.Easing.Linear.None, true)
              .yoyo(true)
              .repeat(2)
              .onComplete
              .addOnce(resolve)
          }))
        }

        Promise.all(textAnimations).then(() => {
          this.errors > 0 && this.sceneEnd('fail')
          this.errors += 1
        })
      } else {
        this.win()
      }
    }
  }

  win() {
    this.disableInput()

    const {x, y} = this.containers.field.position
    const {width, height} = this.containers.field
    const [ex, ey] = [x + width / 2, y + height / 2]
    this.emitter = this.game.add.emitter(ex, ey, 200)

    this.shake(x, y)

    this.emitter.makeParticles('main', ['head_normal.png', 'point_normal.png', 'point_hover.png', 'body_straight.png', 'body_corner.png'])
    this.emitter.minParticleSpeed.set(-400, -400)
    this.emitter.maxParticleSpeed.set(400, 400)
    this.emitter.setScale(this.factor, this.factor, this.factor, this.factor)
    this.emitter.start(false, 5000, 20)

    this.containers.uiLayer.add(this.emitter)
    this.containers.uiLayer.bringToTop(this.containers.field)

    this.game.time.events.add(Phaser.Timer.SECOND * 3, this.sceneEnd.bind(this)).timer.start()
  }

  sceneEnd(state = 'win') {
    const animations = []
    const {finishBadge} = this.sprites

    finishBadge.frameName = `${state}.png`
    this.texts.winFail.setText(this.t(`state.${state}`, {locale: __LOCALE__}))

    this.game.add.tween(this.containers.drag)
      .to({alpha: 0}, Phaser.Timer.HALF, Phaser.Easing.Linear.None, true)

    for (const obj of [this.emitter, this.containers.field]) {
      if (obj) {
        animations.push(new Promise((resolve) => {
          this.game.add.tween(obj)
            .to({alpha: 0}, Phaser.Timer.SECOND, Phaser.Easing.Linear.None, true)
            .onComplete
            .addOnce(resolve)
        }))
      }
    }

    Promise.all(animations).then(() => {
      for (const obj of [finishBadge, this.containers.winFail]) {
        this.game.add.tween(obj)
          .to({alpha: 1}, Phaser.Timer.HALF, Phaser.Easing.Linear.None, true)
      }
    })
  }

  disableInput() {
    for (const [, obj] of Object.entries(this.sprites).filter(([key]) => key.includes('cell') || key.includes('cross'))) {
      obj.input.enabled = false
    }
  }

  shake(x, y) {
    const {field} = this.containers
    const k = 5

    this.shakeAnimation = this.game.add.tween(field.position)
      .to({x: x + Phaser.Math.random(-k, k), y: y + Phaser.Math.random(-k, k)}, Phaser.Timer.SECOND * 0.1, Phaser.Easing.Linear.None, true)
    this.shakeAnimation.onComplete
      .addOnce(() => {
        !this.resized && this.shake(x, y)
      })
  }

  drawField() {
    const textStyle = {font: 'PT Serif Bold', fontSize: 20, fill: '#ffffff'}

    for (let j = 0; j < this.fieldDim; j += 1) {
      for (let i = 0; i < this.fieldDim; i += 1) {
        const x = this.cellDim * i + this.cellDim / 2
        const y = this.cellDim * j + this.cellDim / 2
        const cellName = `cell_${i}_${j}`
        const frame = (i === 0 && j === 0) ? this.cellFrames.HEAD : this.cellFrames.EMPTY

        const image = this.game.make.image(x, y, 'main', frame)
        image.anchor.set(0.5)
        image.data = {x: i, y: j}
        image.inputEnabled = true

        image.events.onInputDown.add(this.cellClick.bind(this))
        image.events.onInputOver.add(this.cellOver.bind(this))
        image.events.onInputOut.add(this.cellOut.bind(this))

        this.sprites[cellName] = image
        this.containers.cells.add(image)
      }

      const colTextName = `col_text_${j}`
      const colText = this.game.add.text(this.cellDim * j + this.cellDim / 2, -20, String(this.valid.x[j]), textStyle)
      colText.anchor.set(0.5)
      this.texts[colTextName] = colText

      const rowTextName = `row_text_${j}`
      const rowText = this.game.add.text(-20, this.cellDim * j + this.cellDim / 2, String(this.valid.y[j]), textStyle)
      rowText.anchor.set(0.5)
      this.texts[rowTextName] = rowText

      this.containers.cells.add(colText)
      this.containers.cells.add(rowText)
    }

    this.changeText()
  }

  adjustObject(setDim, setPos, object, data) {
    [object.width, object.height] = setDim(data ?? object)
    object.position.set(...setPos(data ?? object))
  }

  resize(w, h) {
    const [width, height, , factorUI, isLandscape] = resize(this, w, h, this.factory.objects.cameraSettings)
    this.factor = factorUI
    this.isLandscape = isLandscape

    const setDim = setDimensions.bind(null, factorUI)
    const setPos = setPosition.bind(null, width, height, factorUI, isLandscape)
    const adjObj = this.adjustObject.bind(this, setDim, setPos)

    const {logo, finishBadge} = this.sprites
    const {cta, field, drag, winFail} = this.containers

    this.shakeAnimation && this.shakeAnimation.stop()

    for (const obj of [logo, finishBadge, cta, field, drag, winFail]) {
      adjObj(obj)
    }

    if (this.emitter) {
      const {x, y} = field.position
      const {width: fw, height: fh} = field
      this.emitter.width *= factorUI
      this.emitter.height *= factorUI

      this.emitter.setScale(this.factor, this.factor, this.factor, this.factor)
      this.shake(x, y);
      [this.emitter.emitX, this.emitter.emitY] = [x + fw / 2, y + fh / 2]
    }
  }
}
