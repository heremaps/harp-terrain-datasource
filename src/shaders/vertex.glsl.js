// Copyright © 2017-2019 HERE Europe B.V.
// Licensed under Apache 2.0, see full license in LICENSE
// SPDX-License-Identifier: Apache-2.0

const vertexShader = () => `
varying float vAltitude;
varying vec3 vNormal;
varying vec2 vUv;

attribute vec2 octNormal;

uniform bool useOctNormal;

#include <fog_pars_vertex>

vec2 signNotZero(vec2 v) {
  return vec2((v.x >= 0.0) ? +1.0 : -1.0, (v.y >= 0.0) ? +1.0 : -1.0);
}

vec3 oct_to_float32x3(vec2 e) {
  vec3 v = vec3(e.xy, 1.0 - abs(e.x) - abs(e.y));
  if (v.z < 0.0) {
    v.xy = (1.0 - abs(v.yx)) * signNotZero(v.xy);
  }
  return normalize(v);
}

vec2 snorm_to_float32x2(vec2 s) {
  vec2 v = ((s / 255.0) * 2.0) - 1.0;
  return v;
}

void main() {
  vAltitude = position[2]; // z value

  if (useOctNormal) {
    vec2 floatOctNormal = snorm_to_float32x2(octNormal);
    vec3 decNormal = oct_to_float32x3(floatOctNormal);
    vNormal = decNormal;
  } else {
    vNormal = normal;
  }

  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  
  #include <begin_vertex>
  #include <project_vertex>
  #include <fog_vertex>
}
`

export default vertexShader
