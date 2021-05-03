import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
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

    this.playerMixer = {
      update() {},
    }

    this.fbxModelLoader = new FBXLoader()
    this.fbxAnimationsLoader = new FBXLoader()

    this.Initialize(canvas.querySelector)

    window.addEventListener('resize', this.resizeEvent)
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

    buildDirectionalLight(this.scene)

    const test = new THREE.Mesh(
      new THREE.SphereBufferGeometry(1, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 'white',
        metalness: 1,
        roughness: 0,
      })
    )
    test.castShadow = true
    test.receiveShadow = true
    gui.add(test.material, 'metalness', 0, 1, 0.01)
    gui.add(test.material, 'roughness', 0, 1, 0.01)
    // this.scene.add(test)

    const floor = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(10, 10),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    )
    floor.rotation.x = -Math.PI * 0.5
    floor.position.set(0, -2, 0)
    floor.receiveShadow = true
    this.scene.add(floor)

    this.InitCamera()

    this.InitControls({ canvas })

    this.updateAllMaterials()

    /**
     * Knight
     */
    this.fbxModelLoader.load('/models/fbx/knight.fbx', fbx => {
      fbx.scale.setScalar(0.01)
      fbx.traverse(child => {
        child.castShadow = true
      })

      this.fbxAnimationsLoader.load('/models/fbx/Idle.fbx', anim => {
        this.mixer = new THREE.AnimationMixer(fbx)
        this.walk = this.mixer.clipAction(fbx.animations[1])
        this.walk.play()
      })
      this.scene.add(fbx)
    })
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
    this.camera.position.set(0.25, -0.25, 4)
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

    this.playerMixer.update(deltaTime)

    // Update controls
    this.controls.update()

    // Render
    this.renderer.render(this.scene, this.camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(this.Tick)
  }

  Start() {
    this.clock = new THREE.Clock()
    this.Tick()
  }
}
