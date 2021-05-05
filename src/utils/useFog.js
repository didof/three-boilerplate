import * as THREE from 'three'
import config from '../config'
import { debugFog } from '../debug'

const useFog = scene => {
  const { enabled, debug, color, near, far, isExp2 } = config.fog

  if (!enabled) return

  const FogClass = isExp2 ? THREE.FogExp2 : THREE.Fog

  scene.fog = new FogClass(color, near, far)

  if (debug) debugFog(scene)
}

export default useFog
