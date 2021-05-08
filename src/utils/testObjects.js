import * as THREE from 'three'

export const buildFloor = scene => {
  const floor = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(1000, 1000),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  )

  floor.rotation.x = -Math.PI * 0.5
  floor.receiveShadow = true

  scene.add(floor)
}
