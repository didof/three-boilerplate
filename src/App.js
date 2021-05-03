import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import gui, {
  debugObj,
  debugToneMappingType,
  debugToneMappingExposure,
} from './debug'
import { buildDirectionalLight } from './utils/lights'

const defaultConfig = {
  canvas: {
    width: window.innerWidth,
    height: window.innerHeight,
  },
}

export default class App {
  constructor({ canvas } = defaultConfig) {
    this.sizes = {
      width: canvas.width || window.innerWidth,
      height: canvas.height || window.innerHeight,
    }

    this.previousTime = 0

    /**
     * Loaders
     */
    this.textureLoader = new THREE.TextureLoader()
    this.cubeTextureLoader = new THREE.CubeTextureLoader()

    this.mixer = {
      update() {},
    }

    this.Initialize(canvas.querySelector)

    this._LoadAnimatedModel()

    window.addEventListener('resize', this.resizeEvent)
  }

  _LoadAnimatedModel() {
    const loader = new FBXLoader()
    loader.setPath('/models/fbx/characters/')
    loader.load('paladin.fbx', fbx => {
      fbx.scale.setScalar(0.01)
      fbx.traverse(c => {
        c.castShadow = true
      })
      this.mixer = new THREE.AnimationMixer(fbx)

      const anim = new FBXLoader()
      anim.setPath('/models/fbx/animations/')
      anim.load('walk.fbx', anim => {
        const walk = this.mixer.clipAction(anim.animations[0])
        walk.play()
      })
      this.scene.add(fbx)
    })
  }

  Initialize = selector => {
    const canvas = document.querySelector(selector || 'canvas.webgl')

    /**
     * Renderer
     */
    this.InitRenderer({ canvas })

    /**
     * Scene
     */
    this.InitScene({
      skyboxFolderName: 'openFields',
    })
    this.updateAllMaterials()

    /**
     * Light
     */
    buildDirectionalLight(this.scene)

    /**
     * Floor
     */
    const floor = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(10, 10),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    )
    floor.rotation.x = -Math.PI * 0.5
    floor.receiveShadow = true
    this.scene.add(floor)

    /**
     * Camera
     */

    this.InitCamera()

    /**
     * Controls
     */
    this.InitControls({ canvas })
  }

  InitScene = ({ skyboxFolderName }) => {
    this.scene = new THREE.Scene()

    /**
     * Set Skybox
     */
    const cubeTextures = ['px', 'nx', 'py', 'ny', 'pz', 'nz'].map(
      direction =>
        `/textures/environmentMaps/${skyboxFolderName}/${direction}.jpg`
    )

    const environmentMap = this.cubeTextureLoader.load(cubeTextures)
    environmentMap.encoding = THREE.sRGBEncoding
    this.scene.background = environmentMap
    this.scene.environment = environmentMap
  }

  InitCamera = () => {
    const fov = 75
    const aspect = this.sizes.width / this.sizes.height
    const near = 0.1
    const far = 100
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
    this.camera.position.set(2, 2, 3)
    this.scene.add(this.camera)
  }

  InitControls = ({ canvas }) => {
    this.controls = new OrbitControls(this.camera, canvas)
    this.controls.target.set(0, 0, 0)
    this.controls.enableDamping = true
  }

  InitRenderer = ({ canvas }) => {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
    })
    this.renderer.physicallyCorrectLights = true
    this.renderer.outputEncoding = THREE.sRGBEncoding

    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    debugToneMappingType(this.renderer, this.updateAllMaterials)
    this.renderer.toneMappingExposure = 2
    debugToneMappingExposure(this.renderer)

    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    this.updateRendererSize()
  }

  updateRendererSize = () => {
    this.renderer.setSize(this.sizes.width, this.sizes.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  resizeEvent = () => {
    // Update sizes
    this.sizes.width = window.innerWidth
    this.sizes.height = window.innerHeight

    // Update camera
    this.camera.aspect = this.sizes.width / this.sizes.height
    this.camera.updateProjectionMatrix()

    // Update renderer
    this.updateRendererSize()
  }

  updateAllMaterials = () => {
    this.scene.traverse(child => {
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

  Tick = () => {
    const elapsedTime = this.clock.getElapsedTime()
    const deltaTime = elapsedTime - this.previousTime
    this.previousTime = elapsedTime

    this.mixer.update(deltaTime)

    this.controls.update()

    this.renderer.render(this.scene, this.camera)

    window.requestAnimationFrame(this.Tick)
  }

  Start() {
    this.clock = new THREE.Clock()
    this.Tick()
  }
}
