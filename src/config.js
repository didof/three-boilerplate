const config = {
  canvas: {
    querySelector: 'canvas.webgl',
    width: window.innerWidth,
    height: window.innerHeight,
  },
  skybox: {
    folderName: 'openFields',
  },
  camera: {
    fov: 75,
    near: 0.1,
    far: 100,
    position: {
      x: 1,
      y: 2,
      z: 2,
    },
  },
  renderer: {
    pixelRatioLimit: 2,
  },
  fog: {
    enabled: false,
    debug: true,
    color: 0xaaaaaa,
    near: 2,
    far: 10,
    isExp2: false,
  },
}

export default config
