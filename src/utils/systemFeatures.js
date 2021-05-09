import * as THREE from 'three'

export const buildPausePanel = app => {
  const geometry = new THREE.PlaneBufferGeometry(2, 2)

  const material = new THREE.ShaderMaterial({
    wireframe: false,
    transparent: true,
    uniforms: {
      u_alpha: { value: 1.0 },
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

export const buildJoystick = () => {
  const buildJoystickTorus = material => {
    const geometry = new THREE.TorusBufferGeometry(4, 0.7, 8, 10)
    const mesh = new THREE.Mesh(geometry, material)

    return mesh
  }

  const buildJoystickIcosahedron = material => {
    const geometry = new THREE.IcosahedronGeometry(2.3, 0)
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.z = 1.5

    return mesh
  }

  const material = new THREE.MeshStandardMaterial({
    color: 0xffa500,
    roughness: 0.7,
  })

  const joystick = new THREE.Object3D()
  const torus = buildJoystickTorus(material)
  const icosahedron = buildJoystickIcosahedron(material)

  joystick.scale.set(0.05, 0.05, 0.05)
  const x = -(window.innerWidth / 1000 + 0.1)

  joystick.position.set(x, -0.4, -1)
  joystick.rotation.y = Math.PI * 0.15

  joystick.add(torus, icosahedron)

  return joystick
}

/**
 * Idea for tomorrow:
 *
 * Instead of using torus, just use the icosahedron. It stays still, but draggin make it rotate on the place in the given direction
 *
 * Idea 2:
 *
 * Apply a drag event listener on all canvas
 */
