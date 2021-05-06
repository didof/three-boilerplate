import State from '../../shared/state'

export default class SurveyState extends State {
  constructor(parent) {
    super()
    this._parent = parent
    this._animation = parent._animations['survey']
  }

  get Name() {
    return 'survey'
  }

  Enter(prevState) {
    console.log(`[SurveyState] ${prevState ? `to [${prevState.Name}]` : ''}`)

    if (prevState) {
      const prevAction = this._parent._animations[prevState.Name]
      this._animation.time = 0.0
      this._animation.enabled = true
      this._animation.setEffectiveTimeScale(1.0)
      this._animation.setEffectiveWeight(1.0)
      this._animation.crossFadeFrom(prevAction, 0.5, true)
    }

    this._animation.play()
  }

  Exit() {}

  Update(_, input) {
    const { forward, shift } = input._keys

    if (forward) {
      if (shift) {
        this._parent.SetState('run')
        return
      }
      this._parent.SetState('walk')
    }
  }
}
