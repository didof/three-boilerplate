import * as THREE from 'three'
import * as dat from 'dat.gui'
import config from './config'

const gui = new dat.GUI()

const folders = {}

export const debugObj = {
  lights: {},
  envMapIntensity: 1,
  fog: true,
}

export const debugToneMappingType = (renderer, updateAllMaterials) => {
  if (!config.debug) return

  if (!folders.toneMapping) {
    folders.toneMapping = gui.addFolder('tone mapping')
  }

  folders.toneMapping
    .add(renderer, 'toneMapping', {
      No: THREE.NoToneMapping,
      Linear: THREE.LinearToneMapping,
      Reinhard: THREE.ReinhardToneMapping,
      Cineon: THREE.CineonToneMapping,
      ACESFilmic: THREE.ACESFilmicToneMapping,
    })
    .name('type')
    .onFinishChange(() => {
      renderer.toneMapping = Number(renderer.toneMapping)
      updateAllMaterials()
    })
}

export const debugToneMappingExposure = renderer => {
  if (!config.debug) return

  if (!folders.toneMapping) {
    folders.toneMapping = gui.addFolder('tone mapping')
  }

  folders.toneMapping
    .add(renderer, 'toneMappingExposure', 0, 10, 0.01)
    .name('exposure')
}

export const debugLight = scene => {
  const types = {
    PointLight: THREE.PointLightHelper,
    DirectionalLight: THREE.DirectionalLightHelper,
    SportLight: THREE.SpotLightHelper,
    HemisphereLight: THREE.HemisphereLightHelper,
  }

  return light => {
    const { uuid: lightUuid, type } = light

    const lightHelper = new types[type](light)
    scene.add(lightHelper)

    const shadowCamera = new THREE.CameraHelper(light.shadow.camera)
    scene.add(shadowCamera)

    if (!folders.lights) {
      folders.lights = gui.addFolder('lights')
    }

    const lightFolder = folders.lights.addFolder(type)

    lightFolder.add(light, 'intensity', 0, 10, 0.1)
    lightFolder.add(light, 'castShadow')

    const positionFolder = lightFolder.addFolder('position')
    positionFolder.add(light.position, 'x')
    positionFolder.add(light.position, 'y')
    positionFolder.add(light.position, 'z')
  }
}

export const debugFog = scene => {
  const activeFog = scene.fog
  gui.add(debugObj, 'fog').onChange(() => {
    scene.fog = debugObj.fog ? activeFog : null
  })
}

export default gui
