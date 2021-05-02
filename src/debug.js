import * as THREE from 'three'
import * as dat from 'dat.gui'
const gui = new dat.GUI()

const folders = {}

export const debugObj = {
  envMapIntensity: 1,
}

export const debugToneMappingType = (renderer, updateAllMaterials) => {
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
  if (!folders.toneMapping) {
    folders.toneMapping = gui.addFolder('tone mapping')
  }

  folders.toneMapping
    .add(renderer, 'toneMappingExposure', 0, 10, 0.01)
    .name('exposure')
}

export default gui
