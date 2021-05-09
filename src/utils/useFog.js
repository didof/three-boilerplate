import * as THREE from 'three'
import config from '../config'
import { debugFog } from '../debug'

const useFog = scene => {
  const { enabled, debug, color, near, far } = config.fog

  if (!enabled) return

  scene.fog = new THREE.Fog(color, near, far)

  if (config.debug) debugFog(scene)
}

export default useFog
