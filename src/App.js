import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  debugObj,
  debugToneMappingType,
  debugToneMappingExposure,
} from './debug'
import { buildDirectionalLight, buildAmbientLight } from './utils/lights'
import { getCubeTexture } from './utils/textures'
import { buildFloor } from './utils/testObjects'
import useFog from './utils/useFog'
import PlayerController from './entities/player/player.controller'
import ThirdPersonCamera from './entities/player/player.camera'

import { isMobileDevice, isLandscape } from './utils/mobileDevice'

import config from './config'

export default class App {
  constructor() {
    this._canvas = document.querySelector(config.canvas.querySelector)

    this.sizes = {
      width: config.canvas.width,
      height: config.canvas.height,
    }

    this._config = {
      isMobile: null,
    }

    this._app = {
      paused: false,
    }

    this._previousTime = 0

    this._InitLoaders()
    this._Init()
    this._InitListeners()
  }

  /**
   * Initializers
   */
  _Init = () => {
    this._SetConfigurationBasedOnDevice()

    this._InitRenderer()
    this._InitScene()
    this._InitCamera()
    // this._InitControls()

    this._InitCharacter()

    buildDirectionalLight(this._scene)
    buildAmbientLight(this._scene)
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

  _SetConfigurationBasedOnDevice = () => {
    this._config.isMobile = isMobileDevice()
    if (this._config.isMobile) {
      this._app.paused = !isLandscape()
    }
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

  // _InitControls = () => {
  //   this._controls = new OrbitControls(this._camera, this._canvas)
  //   this._controls.target.set(0, 0, 0)
  //   this._controls.enableDamping = true
  // }

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
    this._OnResize()
    this._OnKeyPress()
    if (this._config.isMobile) this._OnOrientationChange()
  }

  _InitCharacter = () => {
    this._player = new PlayerController(this._scene, this._camera, this._config)
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
  _OnResize = () => {
    window.addEventListener(
      'resize',
      () => {
        this.sizes.width = window.innerWidth
        this.sizes.height = window.innerHeight

        this._camera.aspect = this.sizes.width / this.sizes.height
        this._camera.updateProjectionMatrix()

        this._updateRendererSize()
      },
      false
    )
  }

  _OnOrientationChange = () => {
    if (!this._config.isMobile) return

    window.addEventListener(
      'orientationchange',
      event => {
        this._app.paused = !isLandscape()
      },
      false
    )
  }

  _OnKeyPress = () => {
    window.addEventListener('keydown', event => {
      switch (event.keyCode) {
        case 80: // p
          if (isLandscape()) this._app.paused = !this._app.paused
          break
      }
    })
  }

  /**
   * Utility
   */
  _GetTimes = () => {
    const elapsedTime = this.clock.getElapsedTime()
    const deltaTime = elapsedTime - this._previousTime
    this._previousTime = elapsedTime

    return deltaTime
  }

  _Tick = () => {
    console.log(this._app.paused)
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
