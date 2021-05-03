export const getCubeTexture = folderName => {
  return ['px', 'nx', 'py', 'ny', 'pz', 'nz'].map(
    direction => `/textures/environmentMaps/${folderName}/${direction}.jpg`
  )
}
