import * as THREE from 'three'
import { debugLight } from '../debug'

export const buildDirectionalLight = (scene, debug = false) => {
  const light = new THREE.DirectionalLight(0xffffff, 5)
  light.position.set(0.25, 3, 4)
  light.castShadow = true
  light.shadow.mapSize.width = 2048
  light.shadow.mapSize.height = 2048
  light.shadow.camera.near = 0.5
  light.shadow.camera.far = 10
  light.shadow.camera.left = 10
  light.shadow.camera.right = -10
  light.shadow.camera.top = 10
  light.shadow.camera.bottom = -10
  if (debug) debugLight(scene)(light)

  scene.add(light)

  return light
}
