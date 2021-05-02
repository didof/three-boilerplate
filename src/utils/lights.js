import * as THREE from 'three'
import { debugLight } from '../debug'

export const buildDirectionalLight = (scene, debug = false) => {
  const light = new THREE.DirectionalLight(0xffffff, 5)
  light.position.set(0.25, 3, 4)
  light.castShadow = true
  light.shadow.mapSize.width = 512
  light.shadow.mapSize.height = 512
  light.shadow.camera.near = 0.5
  light.shadow.camera.far = 10
  if (debug) debugLight(scene)(light)

  scene.add(light)

  return light
}
