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
import PlayerController from './entities/player/fsm/player.controller'

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

    this._InitListeners()
  }

  /**
   * Initializers
   */
  _Init = () => {
    this._InitRenderer()
    this._InitScene()
    this._InitCamera()
    // this._InitControls()

    this._InitCharacter()

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

  _InitCharacter = () => {
    this._player = new PlayerController(this._scene, this._camera)
    this._thirdPersonCamera = new ThirdPersonCamera(this._camera, this._player)
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

    return deltaTime
  }

  _Tick = () => {
    const deltaTime = this._GetTimes()

    // this._controls.update()

    this._thirdPersonCamera.Update(deltaTime)

    this._player.Update(deltaTime)

    this.renderer.render(this._scene, this._camera)

    window.requestAnimationFrame(this._Tick)
  }

  Start() {
    this.clock = new THREE.Clock()

    this._Tick()
  }
}

class ThirdPersonCamera {
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
