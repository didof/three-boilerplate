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

    this._Initialize(canvas.querySelector)

    window.addEventListener('resize', this._ResizeEvent)
  }

  _Initialize = selector => {
    const canvas = document.querySelector(selector || 'canvas.webgl')

    /**
     * Renderer
     */
    this._renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
    })
    this._renderer.shadowMap.enabled = true
    this._renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this._setRendererConfig()

    /**
     * Scene
     */
    this._scene = new THREE.Scene()

    const test = new THREE.Mesh(
      new THREE.BoxBufferGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 'red' })
    )
    this._scene.add(test)

    /**
     * Camera
     */
    this._camera = new THREE.PerspectiveCamera(
      75,
      this.sizes.width / this.sizes.height,
      0.1,
      100
    )
    this._camera.position.set(0.25, -0.25, 4)
    this._scene.add(this._camera)

    this._controls = new OrbitControls(this._camera, canvas)
    this._controls.enableDamping = true
  }

  _setRendererConfig = () => {
    this._renderer.setSize(this.sizes.width, this.sizes.height)
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  _ResizeEvent = () => {
    // Update sizes
    this.sizes.width = window.innerWidth
    this.sizes.height = window.innerHeight

    // Update camera
    this._camera.aspect = this.sizes.width / this.sizes.height
    this._camera.updateProjectionMatrix()

    // Update renderer
    this._setRendererConfig()
  }

  _Tick = () => {
    const et = this._clock.getElapsedTime()

    // Update controls
    this._controls.update()

    // Render
    this._renderer.render(this._scene, this._camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(this._Tick)
  }

  Start() {
    this._clock = new THREE.Clock()
    this._Tick()
  }
}
