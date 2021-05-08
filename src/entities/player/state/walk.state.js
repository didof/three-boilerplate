import State from '../../shared/state'

export default class WalkState extends State {
  constructor(parent) {
    super()
    this._parent = parent
    this._animation = parent._animations['walk']
  }

  get Name() {
    return 'walk'
  }

  Enter(prevState, inverse = false) {
    console.log(`[WalkState] to [${prevState.Name}] inverse: ${inverse}`)

    if (prevState) {
      const prevAction = this._parent._animations[prevState.Name]
      this._animation.enabled = true

      if (prevState.Name === 'run') {
        const ratio =
          this._animation.getClip().duration / prevAction.getClip().duration
        this._animation.time = prevAction.time * ratio
      } else {
        this._animation.time = 0.0
        this._animation.setEffectiveTimeScale(1.0)
        this._animation.setEffectiveWeight(1.0)
      }

      this._animation.crossFadeFrom(prevAction, 0.5, true)
    }

    if (inverse) {
      this._animation.paused = false
      this._animation.timeScale = -1
    }

    this._animation.play()
  }

  Exit() {}

  Update(elapsedTime, input) {
    const { forward, backward, shift } = input._keys

    if (forward || backward) {
      if (shift && !backward) {
        this._parent.SetState('run')
      }
      return
    }

    this._parent.SetState('survey')
  }
}
