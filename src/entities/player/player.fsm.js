import FiniteStateMachine from '../shared/fsm'
import { SurveyState, WalkState, RunState } from './state'

export default class PlayerFSM extends FiniteStateMachine {
  constructor(animations) {
    super()

    this._animations = animations

    this._Init()
  }

  _Init = () => {
    this._AddState('survey', SurveyState)
    this._AddState('walk', WalkState)
    this._AddState('run', RunState)
  }
}
