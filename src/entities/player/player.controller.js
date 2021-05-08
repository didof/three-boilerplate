import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import PlayerFSM from './player.fsm'
import globalConfig from '../../config'

export default class PlayerController {
  constructor(scene, camera, config) {
    this._scene = scene
    this._camera = camera

    this._animations = {}

    this._input = new PlayerControllerInput(config.isMobile)
    this._stateMachine = new PlayerFSM(this._animations)

    this._LoadModel()
    this._InitVectors()
  }

  get Position() {
    return this._position
  }

  get Rotation() {
    if (!this._target) {
      return new THREE.Quaternion()
    }
    return this._target.scene.quaternion
  }

  _InitVectors = () => {
    this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0)
    this._acceleration = new THREE.Vector3(1, 0.25, 50.0)
    this._velocity = new THREE.Vector3(0, 0, 0)
    this._position = new THREE.Vector3()
  }

  _LoadModel = () => {
    const loaderManager = new THREE.LoadingManager()
    loaderManager.onLoad = () => {
      this._stateMachine.SetState('survey')
    }
    const loader = new GLTFLoader(loaderManager)
    loader.load('/models/gltf/Fox/glTF/Fox.gltf', model => {
      this._target = model

      this._target.scene.scale.set(0.025, 0.025, 0.025)
      this._target.scene.traverse(c => {
        if (c.isMesh) {
          c.castShadow = true
          c.receiveShadow = true
        }
      })

      this._InitMixerAnimations()

      this._scene.add(this._target.scene)
    })
  }

  _InitMixerAnimations = () => {
    this._mixer = new THREE.AnimationMixer(this._target.scene)

    this._animations = this._target.animations.map(clip => {
      const name = clip.name.toLowerCase()
      this._animations[name] = this._mixer.clipAction(clip)
    })
  }

  Update = deltaTime => {
    if (!this._target) return

    /**
     * Update Animations
     */
    this._stateMachine.Update(deltaTime, this._input)

    /**
     * Update Position
     */
    const entity = this._target.scene
    const keys = this._input._keys

    const frameDecceleration = new THREE.Vector3(
      this._velocity.x * this._decceleration.x,
      this._velocity.y * this._decceleration.y,
      this._velocity.z * this._decceleration.z
    )

    frameDecceleration.multiplyScalar(deltaTime)
    frameDecceleration.z =
      Math.sign(frameDecceleration.z) *
      Math.min(Math.abs(frameDecceleration.z), Math.abs(this._velocity.z))
    this._velocity.add(frameDecceleration)

    const acceleration = this._acceleration.clone()

    if (keys.shift) {
      acceleration.multiplyScalar(2.0)
    }
    if (keys.forward) {
      this._velocity.z += acceleration.z * deltaTime
    }
    if (keys.backward) {
      this._velocity.z -= acceleration.z * deltaTime
    }

    const oldPosition = new THREE.Vector3()
    oldPosition.copy(entity.position)

    const forward = new THREE.Vector3(0, 0, 1)
    forward.applyQuaternion(entity.quaternion)
    forward.normalize()

    forward.multiplyScalar(this._velocity.z * deltaTime)

    const _Q = new THREE.Quaternion()
    const _A = new THREE.Vector3()
    const _R = entity.quaternion.clone()

    if (keys.left) {
      _A.set(0, 1, 0)
      _Q.setFromAxisAngle(_A, 4.0 * Math.PI * deltaTime * this._acceleration.y)
      _R.multiply(_Q)
    }
    if (keys.right) {
      _A.set(0, 1, 0)
      _Q.setFromAxisAngle(_A, 4.0 * -Math.PI * deltaTime * this._acceleration.y)
      _R.multiply(_Q)
    }

    entity.quaternion.copy(_R)

    const sideways = new THREE.Vector3(1, 0, 0)
    sideways.applyQuaternion(entity.quaternion)
    sideways.normalize()

    sideways.multiplyScalar(this._velocity.x * deltaTime)

    entity.position.add(sideways)
    entity.position.add(forward)

    oldPosition.copy(entity.position)

    this._position.copy(entity.position)

    this._mixer.update(deltaTime)
  }
}

class PlayerControllerInput {
  constructor(isMobile) {
    this._keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      shift: false,
    }

    const useKeyboardEventListeners = () => {
      document.addEventListener('keydown', this._KeyDown, false)
      document.addEventListener('keyup', this._KeyUp, false)
    }

    const useTouchEventListeners = () => {
      document.addEventListener('touchmove', this._TouchMove, false)
      document.addEventListener('touchend', this._TouchEnd, false)
    }

    if (isMobile) {
      useTouchEventListeners()
      if (globalConfig.controls.enableKeyboardOnMobile)
        useKeyboardEventListeners()
    } else {
      useKeyboardEventListeners()
    }
  }

  _KeyDown = ({ keyCode }) => {
    switch (keyCode) {
      case 87: // w
        this._keys.forward = true
        break
      case 83: // s
        this._keys.backward = true
        break
      case 65: // a
        this._keys.left = true
        break
      case 68: // d
        this._keys.right = true
        break
      case 16: // SHIFT
        this._keys.shift = true
        break
    }
  }

  _KeyUp = ({ keyCode }) => {
    switch (keyCode) {
      case 87: // w
        this._keys.forward = false
        break
      case 83: // s
        this._keys.backward = false
        break
      case 65: // a
        this._keys.left = false
        break
      case 68: // d
        this._keys.right = false
        break
      case 16: // SHIFT
        this._keys.shift = false
        break
    }
  }

  _TouchMove = ({ changedTouches }) => {
    const { clientX, clientY } = changedTouches[0]
    if (this._previousClientX) {
      if (clientX > this._previousClientX) {
        this._keys.right = true
      } else {
        this._keys.left = true
      }
    }
    if (this._previousClientY) {
      if (clientY > this._previousClientY) {
        this._keys.backward = true
      } else {
        this._keys.forward = true
        if (clientY <= 100) this._keys.shift = true
      }
    }

    this._previousClientX = clientX
    this._previousClientY = clientY
  }

  _TouchEnd = () => {
    Object.keys(this._keys).forEach(key => {
      this._keys[key] = false
    })
    this._previousClientX = null
    this._previousClientY = null
  }
}
