import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import PlayerFSM from './player.fsm'

export default class PlayerController {
  constructor(scene, camera, mixers) {
    this._scene = scene
    this._camera = camera
    this._mixers = mixers

    this._animations = {}

    this._input = new PlayerControllerInput()
    this._stateMachine = new PlayerFSM(this._animations)

    this._Init()
  }

  _Init = () => {
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

      const mixer = new THREE.AnimationMixer(this._target.scene)
      this._mixers.push(mixer)

      this._animations = this._target.animations.map(clip => {
        this._animations[clip.name.toLowerCase()] = mixer.clipAction(clip)
      })

      this._scene.add(this._target.scene)
    })
  }

  Update = timeElapsed => {
    if (!this._target) return

    this._stateMachine.Update(timeElapsed, this._input)

    // TODO move it
  }
}

class PlayerControllerInput {
  constructor() {
    this._keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      shift: false,
    }

    document.addEventListener('keydown', this._KeyDown, false)
    document.addEventListener('keyup', this._KeyUp, false)
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
}
