const config = {
  canvas: {
    querySelector: 'canvas.webgl',
    width: window.innerWidth,
    height: window.innerHeight,
  },
  skybox: {
    folderName: 'veniceStreet',
  },
  camera: {
    fov: 75,
    near: 0.1,
    far: 10,
    position: {
      x: 2,
      y: 2,
      z: 3,
    },
  },
  renderer: {
    pixelRatioLimit: 2,
  },
  fog: {
    enabled: true,
    debug: true,
    color: 0xaaaaaa,
    near: 2,
    far: 5,
    isExp2: false,
  },
}

export default config
