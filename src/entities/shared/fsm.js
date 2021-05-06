export default class FiniteStateMachine {
  constructor() {
    this._states = {}
    this._currentState = null
  }

  _AddState = (name, state) => {
    this._states[name] = state
  }

  SetState(name) {
    const prevState = this._currentState

    if (prevState) {
      if (prevState.Name == name) {
        return
      }
      prevState.Exit()
    }

    const state = new this._states[name](this)

    this._currentState = state
    state.Enter(prevState)
  }

  Update(timeElapsed, input) {
    if (!this._currentState) return

    this._currentState.Update(timeElapsed, input)

    // TODO movement across world
  }
}
