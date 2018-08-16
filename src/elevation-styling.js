/*
 * Copyright © 2017-2018 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three'

import vertexShader from './shaders/vertex.glsl'
import fragmentShader from './shaders/fragment.glsl'

const stylingOptionsDefaults = {
  colorSteps: [
    {
      color: new THREE.Vector3(0, 0, 0),
      altitude: -300
    },
    {
      color: new THREE.Vector3(1, 1, 1),
      altitude: 8848
    }
  ],
  texture: null,
  textureIntensity: 0.4,
  lightVector: new THREE.Vector3(1.0, 0.0, 0.5),
  opacity: 1
}

export class ElevationMaterial extends THREE.ShaderMaterial {
  constructor (decodedTile, stylingOptions) {
    const options = Object.assign({}, stylingOptionsDefaults, stylingOptions)
    const sortedColorSteps = options.colorSteps.slice().sort((a, b) => a.altitude >= b.altitude)
    const colors = sortedColorSteps.map(item => item.color)
    const altitudes = sortedColorSteps.map(item => item.altitude)
    const uniforms = {}

    uniforms.useOctNormal = {value: ElevationMaterial.containsOctNormals(decodedTile)}
    uniforms.colorSteps = {value: colors}
    uniforms.altitudeSteps = {value: altitudes}
    uniforms.textureIntensity = {value: options.textureIntensity}
    uniforms.hasTexture = {value: options.texture === null ? 0 : 1}
    uniforms.texture = {value: options.texture}
    uniforms.lightVector = {value: options.lightVector}
    uniforms.opacity = {value: options.opacity}

    super({
      vertexShader: vertexShader(),
      fragmentShader: fragmentShader({
        COLOR_STEPS_COUNT: sortedColorSteps.length
      }),
      uniforms
    })
  }

  static containsOctNormals (decodedTile) {
    const geometry = decodedTile.geometries[0]
    return geometry.vertexAttributes.find(this.isOctNormalAttribute) !== undefined
  }

  static isOctNormalAttribute (attribute) {
    return attribute.name === 'octNormal'
  }
}
