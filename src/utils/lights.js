import * as THREE from 'three'
import { debugLight } from '../debug'
import config from '../config'

export const buildDirectionalLight = scene => {
  const light = new THREE.DirectionalLight(0xffffff, 5)
  light.position.set(-32, 30, -20)
  light.castShadow = true
  light.shadow.mapSize.width = 4096
  light.shadow.mapSize.height = 4096
  light.shadow.camera.near = 0.5
  light.shadow.camera.far = 100
  light.shadow.camera.left = 50
  light.shadow.camera.right = -50
  light.shadow.camera.top = 50
  light.shadow.camera.bottom = -50
  if (config.lights.debug) debugLight(scene)(light)

  scene.add(light)

  return light
}

export const buildAmbientLight = scene => {
  const light = new THREE.AmbientLight(0xffffff, 1)

  scene.add(light)

  return light
}
