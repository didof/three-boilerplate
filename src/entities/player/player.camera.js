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
        console.log('[ThirdPersonCamera] player position on the center')
        this._playerPosition = 0
        break
      case 0:
        console.log('[ThirdPersonCamera] player position on the right')
        this._playerPosition = +1
        break
      case +1:
        console.log('[ThirdPersonCamera] player position on the left')
        this._playerPosition = -1
        break
    }
  }

  _CalculateIdealOffset = () => {
    const x = 5 * this._playerPosition
    const idealOffset = new THREE.Vector3(x, 3, -7)
    idealOffset.applyQuaternion(this._player.Rotation)
    idealOffset.add(this._player.Position)
    return idealOffset
  }

  _CalculateIdealLookat() {
    const idealLookat = new THREE.Vector3(5, 3, 25)
    idealLookat.applyQuaternion(this._player.Rotation)
    idealLookat.add(this._player.Position)
    return idealLookat
  }

  Update = deltaTime => {
    const idealOffset = this._CalculateIdealOffset()
    const idealLookat = this._CalculateIdealLookat()

    const t = 1 - Math.pow(0.001, deltaTime)

    this._currentPosition.lerp(idealOffset, deltaTime * 1.5)
    this._currentLookAt.lerp(idealLookat, deltaTime * 1.5)

    this._camera.position.copy(this._currentPosition)
    this._camera.lookAt(this._currentLookAt)
  }
}
