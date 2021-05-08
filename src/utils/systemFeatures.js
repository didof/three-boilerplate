import * as THREE from 'three'

export const buildPausePanel = app => {
  const geometry = new THREE.PlaneBufferGeometry(2, 2)

  const material = new THREE.ShaderMaterial({
    wireframe: false,
    transparent: true,
    uniforms: {
      u_alpha: { value: 0.0 },
    },
    vertexShader: `
      void main()
      {
        gl_Position =  vec4(position, 1.0);
      }
    `,
    fragmentShader: `
    uniform float u_alpha;
    
    void main()
    {
      gl_FragColor = vec4(0.0, 0.0, 0.0, u_alpha);
    }
    `,
  })
  const pausePanel = new THREE.Mesh(geometry, material)

  app.pausePanelOpacity = material.uniforms.u_alpha

  return pausePanel
}
