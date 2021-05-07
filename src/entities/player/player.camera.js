import * as THREE from 'three'

export default class ThirdPersonCamera {
  constructor(camera, player) {
    this._camera = camera
    this._player = player

    this._currentPosition = new THREE.Vector3()
    this._currentLookAt = new THREE.Vector3()

    this._playerPosition = -1

    document.addEventListener('contextmenu', this._OnRightClick, false)
  }

  _OnRightClick = event => {
    event.preventDefault()
    switch (this._playerPosition) {
      case -1:
        this._playerPosition = 0
        break
      case 0:
        this._playerPosition = +1
        break
      case +1:
        this._playerPosition = -1
        break
    }
  }

  _CalculateIdealOffset = () => {
    const x = 7 * this._playerPosition
    const idealOffset = new THREE.Vector3(x, 3, -7)
    idealOffset.applyQuaternion(this._player.Rotation)
    idealOffset.add(this._player.Position)
    return idealOffset
  }

  _CalculateIdealLookat() {
    const idealLookat = new THREE.Vector3(0, 5, 20)
    idealLookat.applyQuaternion(this._player.Rotation)
    idealLookat.add(this._player.Position)
    return idealLookat
  }

  Update = deltaTime => {
    const idealOffset = this._CalculateIdealOffset()
    const idealLookat = this._CalculateIdealLookat()

    this._currentPosition.lerp(idealOffset, deltaTime)
    this._currentLookAt.lerp(idealLookat, deltaTime)

    this._camera.position.copy(this._currentPosition)
    this._camera.lookAt(this._currentLookAt)
  }
}
