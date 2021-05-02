import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'

const gui = new dat.GUI()

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

    window.addEventListener('resize', this.ResizeEvent)
  }

  Initialize = selector => {
    const canvas = document.querySelector(selector || 'canvas.webgl')

    /**
     * Renderer
     */
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
    })
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.setRendererConfig()

    /**
     * Scene
     */
    this.InitScene({
      skyboxFolderName: 'openFields',
    })

    const test = new THREE.Mesh(
      new THREE.BoxBufferGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 'red' })
    )
    this.scene.add(test)

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
    this.controls.enableDamping = true
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

  setRendererConfig = () => {
    this.renderer.setSize(this.sizes.width, this.sizes.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  ResizeEvent = () => {
    // Update sizes
    this.sizes.width = window.innerWidth
    this.sizes.height = window.innerHeight

    // Update camera
    this.camera.aspect = this.sizes.width / this.sizes.height
    this.camera.updateProjectionMatrix()

    // Update renderer
    this.setRendererConfig()
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
