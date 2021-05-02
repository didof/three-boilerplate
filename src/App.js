import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
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

    /**
     * Loaders
     */
    this.textureLoader = new THREE.TextureLoader()
    this.cubeTextureLoader = new THREE.CubeTextureLoader()

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

    buildDirectionalLight(this.scene, true)

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
    this.scene.add(test)

    const floor = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(10, 10),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    )
    floor.rotation.x = -Math.PI * 0.5
    floor.position.set(0, -2, 0)
    floor.receiveShadow = true
    this.scene.add(floor)

    /**
     * Camera
     */
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.sizes.width / this.sizes.height,
      0.1,
      100
    )
    this.camera.position.set(0.25, -0.25, 4)
    this.scene.add(this.camera)

    this.controls = new OrbitControls(this.camera, canvas)
    this.controls.target.set(0, 0, 0)
    this.controls.enableDamping = true

    this.updateAllMaterials()
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

  InitRenderer = ({ canvas }) => {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
    })
    this.renderer.physicallyCorrectLights = true
    this.renderer.outputEncoding = THREE.sRGBEncoding

    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 2
    debugToneMappingType(this.renderer, this.updateAllMaterials)
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
    const et = this.clock.getElapsedTime()

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
