import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  debugObj,
  debugToneMappingType,
  debugToneMappingExposure,
} from './debug'
import { buildDirectionalLight } from './utils/lights'
import { getCubeTexture } from './utils/textures'
import { buildFloor } from './utils/testObjects'
import useFog from './utils/useFog'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import config from './config'

export default class App {
  constructor() {
    this._canvas = document.querySelector(config.canvas.querySelector)

    this.sizes = {
      width: config.canvas.width,
      height: config.canvas.height,
    }

    this.previousTime = 0

    this._InitLoaders()
    this._Init()

    this._mixers = []

    this._player = new PlayerController(this._scene, this._camera, this._mixers)

    this._InitListeners()
  }

  /**
   * Initializers
   */
  _Init = () => {
    this._InitRenderer()
    this._InitScene()
    this._InitCamera()
    this._InitControls()

    buildDirectionalLight(this._scene)
    buildFloor(this._scene)
  }

  _InitScene = () => {
    this._scene = new THREE.Scene()

    /**
     * Set Skybox
     */
    const cubeTextures = getCubeTexture(config.skybox.folderName)

    const environmentMap = this.cubeTextureLoader.load(cubeTextures)
    environmentMap.encoding = THREE.sRGBEncoding
    this._scene.background = environmentMap
    this._scene.environment = environmentMap

    /**
     * Fog
     */
    useFog(this._scene)

    this._updateAllMaterials()
  }

  _InitCamera = () => {
    const fov = config.camera.fov
    const aspect = this.sizes.width / this.sizes.height
    const near = config.camera.near
    const far = config.camera.far

    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far)

    const { x, y, z } = config.camera.position
    this._camera.position.set(x, y, z)

    this._scene.add(this._camera)
  }

  _InitControls = () => {
    this._controls = new OrbitControls(this._camera, this._canvas)
    this._controls.target.set(0, 0, 0)
    this._controls.enableDamping = true
  }

  _InitRenderer = () => {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this._canvas,
      antialias: true,
    })

    // TODO gui
    this.renderer.physicallyCorrectLights = true

    // TODO gui
    this.renderer.outputEncoding = THREE.sRGBEncoding

    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    debugToneMappingType(this.renderer, this._updateAllMaterials)
    this.renderer.toneMappingExposure = 2
    debugToneMappingExposure(this.renderer)

    this.renderer.shadowMap.enabled = true

    // TODO gui
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    this._updateRendererSize()
  }

  _InitLoaders = () => {
    this.textureLoader = new THREE.TextureLoader()
    this.cubeTextureLoader = new THREE.CubeTextureLoader()
  }

  _InitListeners = () => {
    window.addEventListener('resize', this._onResizeEventTrigger)
  }

  /**
   * Updaters
   */
  _updateRendererSize = () => {
    this.renderer.setSize(this.sizes.width, this.sizes.height)
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, config.renderer.pixelRatioLimit)
    )
  }

  _updateAllMaterials = () => {
    this._scene.traverse(child => {
      if (
        child instanceof THREE.Mesh &&
        child.material instanceof THREE.MeshStandardMaterial
      ) {
        child.material.envMapIntensity = debugObj.envMapIntensity
        child.material.needsUpdate = true
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }

  /**
   * Events Responses
   */
  _onResizeEventTrigger = () => {
    this.sizes.width = window.innerWidth
    this.sizes.height = window.innerHeight

    this._camera.aspect = this.sizes.width / this.sizes.height
    this._camera.updateProjectionMatrix()

    this._updateRendererSize()
  }

  /**
   * Utility
   */
  _GetTimes = () => {
    const elapsedTime = this.clock.getElapsedTime()
    const deltaTime = elapsedTime - this.previousTime
    this.previousTime = elapsedTime

    return [deltaTime, elapsedTime]
  }

  _Tick = () => {
    const [deltaTime, elapsedTime] = this._GetTimes()

    this._mixers.forEach(m => {
      m.update(deltaTime)
    })

    this._controls.update()

    this._player.Update(elapsedTime)

    this.renderer.render(this._scene, this._camera)

    window.requestAnimationFrame(this._Tick)
  }

  Start() {
    this.clock = new THREE.Clock()

    this._Tick()
  }
}

class PlayerController {
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

    // if (this._input._keys.forward) {
    //   this._animations[1].play()
    //   this._target.scene.position.z += 0.1
    // } else {
    //   this._animations[1].stop()
    // }
  }
}

class PlayerControllerInput {
  constructor() {
    this._keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
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
    }
  }
}

class FiniteStateMachine {
  constructor() {
    this._states = {}
    this._currentState = null
  }

  _AddState = (name, state, animation) => {
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

class PlayerFSM extends FiniteStateMachine {
  constructor(animations) {
    super()

    this._animations = animations

    this._Init()
  }

  _Init = () => {
    this._AddState('survey', SurveyState)
    this._AddState('walk', WalkState)
  }
}

class State {
  constructor(parent) {
    this._parent = parent
  }

  Enter() {}
  Exit() {}
  Update() {}
}

class SurveyState extends State {
  constructor(parent) {
    super()
    this._parent = parent
    this._animation = parent._animations['survey']
  }

  get Name() {
    return 'survey'
  }

  Enter(prevState) {
    console.log('[SurveyState] Enter from ' + (prevState ? prevState.Name : ''))

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
    if (input._keys.forward) {
      this._parent.SetState('walk')
    }
  }
}

class WalkState extends State {
  constructor(parent) {
    super()
    this._parent = parent
    this._animation = parent._animations['walk']
  }

  get Name() {
    return 'walk'
  }

  Enter(prevState) {
    console.log('[WalkState] Enter from ' + (prevState ? prevState.Name : ''))

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

  Update(elapsedTime, input) {
    if (!input._keys.forward) {
      this._parent.SetState('survey')
    }
  }
}
