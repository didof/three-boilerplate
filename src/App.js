import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import {
  debugObj,
  debugToneMappingType,
  debugToneMappingExposure,
} from './debug'
import { buildDirectionalLight } from './utils/lights'
import { getCubeTexture } from './utils/textures'
import { buildFloor } from './utils/testObjects'

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

    this.mixer = {
      update() {},
    }

    this._LoadAnimatedModel()
    this._InitListeners()
  }

  _LoadAnimatedModel() {
    const loader = new FBXLoader()
    loader.load('/models/fbx/characters/paladin.fbx', fbx => {
      fbx.scale.setScalar(0.01)
      fbx.traverse(c => {
        c.castShadow = true
      })
      this.mixer = new THREE.AnimationMixer(fbx)

      loader.load('/models/fbx/animations/idle.fbx', anim => {
        const idle = this.mixer.clipAction(anim.animations[0])
        idle.play()
      })
      this._scene.add(fbx)
    })
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

  _Tick = () => {
    const elapsedTime = this.clock.getElapsedTime()
    const deltaTime = elapsedTime - this.previousTime
    this.previousTime = elapsedTime

    this.mixer.update(deltaTime)

    this._controls.update()

    this.renderer.render(this._scene, this._camera)

    window.requestAnimationFrame(this._Tick)
  }

  Start() {
    this.clock = new THREE.Clock()

    this._Tick()
  }
}
