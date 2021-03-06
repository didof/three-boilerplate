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
import { buildPausePanel } from './utils/systemFeatures'

import { isMobileDevice, isLandscape } from './utils/mobileDevice'

import config from './config'

export default class App {
  constructor() {
    this._canvas = document.querySelector(config.canvas.querySelector)
    this._tmpLoading = document.querySelector('.loading')

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

    this._InitLoaders(() => {
      this._InitListeners()
    })
    this._Init()
  }

  /**
   * Initializers
   */
  _Init = () => {
    this._app.paused = true
    this._SetConfigurationBasedOnDevice()

    this._InitRenderer()
    this._InitScene()
    this._InitCamera()
    // this._InitControls()

    this._InitSystemFeatures()

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

  _InitSystemFeatures = () => {
    const pausePanel = buildPausePanel(this._app)

    this._scene.add(pausePanel)
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

  _InitLoaders = cb => {
    this.loadingManager = new THREE.LoadingManager(
      () => {
        cb()
        document.body.removeChild(this._tmpLoading)
        this._app.paused = false
      },
      (_, itemsLoaded, itemsTotal) => {
        const progressRatio = itemsLoaded / itemsTotal
        this._tmpLoading.innerHTML = 'Loading... ' + progressRatio * 100 + '%'
      }
    )
    this.textureLoader = new THREE.TextureLoader(this.loadingManager)
    this.cubeTextureLoader = new THREE.CubeTextureLoader(this.loadingManager)
  }

  _InitListeners = () => {
    this._OnResize()
    this._OnKeyPress()
    this._OnOrientationChange()
  }

  _InitCharacter = () => {
    this._player = new PlayerController(
      this._scene,
      this._camera,
      this.loadingManager,
      this._config
    )
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
      () => {
        this._app.paused = !isLandscape()
      },
      false
    )
  }

  _OnKeyPress = () => {
    window.addEventListener('keydown', ({ keyCode }) => {
      switch (keyCode) {
        case 80: // p
        case 27: // esc
          if (isLandscape()) this._app.paused = !this._app.paused
          break
        case 85: // u
          this._ToggleFullscreen()
          break
      }
    })
  }

  /**
   * Utility
   */
  _ToggleFullscreen = () => {
    if (this._config.isMobile) return

    const fullscreenElement =
      document.fullscreenElement || document.webkitFullscreenElement
    if (!fullscreenElement) {
      if (this._canvas.requestFullscreen) {
        this._canvas.requestFullscreen()
      } else if (canvas.webkitRequestFullscreen) {
        this._canvas.webkitRequestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen()
      }
    }
  }

  _GetTimes = () => {
    const elapsedTime = this.clock.getElapsedTime()
    const deltaTime = elapsedTime - this._previousTime
    this._previousTime = elapsedTime

    return deltaTime
  }

  _PlayTick = () => {
    if (this._app.paused) {
      this._PauseTick()
      return
    }

    const deltaTime = this._GetTimes()

    // this._controls.update()

    this._thirdPersonCamera.Update(deltaTime)

    this._player.Update(deltaTime)

    this.renderer.render(this._scene, this._camera)

    window.requestAnimationFrame(this._PlayTick)
  }

  _PauseTick = () => {
    const opacity = this._app.pausePanelOpacity
    if (!this._app.paused) {
      if (opacity.value < 0.1) {
        this._PlayTick()
        return
      }
    }

    if (this._app.paused && opacity.value < config.pause.opacity) {
      opacity.value += 0.1
    } else if (!this._app.paused && opacity.value > 0.0) {
      opacity.value -= 0.1
    }

    this.renderer.render(this._scene, this._camera)

    window.requestAnimationFrame(this._PauseTick)
  }

  Start() {
    this.clock = new THREE.Clock()

    this._PlayTick()
  }
}
