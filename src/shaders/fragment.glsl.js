// Copyright © 2017-2018 HERE Europe B.V.
// Licensed under Apache 2.0, see full license in LICENSE
// SPDX-License-Identifier: Apache-2.0

const fragmentShader = vars => `
#define COLOR_STEPS_COUNT ${vars.COLOR_STEPS_COUNT}

varying float vAltitude;
varying vec2 vUv;
varying vec3 vNormal;

uniform vec3 colorSteps[COLOR_STEPS_COUNT];
uniform float altitudeSteps[COLOR_STEPS_COUNT];

uniform sampler2D texture;
uniform int hasTexture;
uniform float textureIntensity;
uniform vec3 lightVector;
uniform float opacity;

#include <fog_pars_fragment>

void main() {
  vec3 altitudeColor;
  float lowestAltitude = altitudeSteps[0];
  float highestAlttitude = altitudeSteps[COLOR_STEPS_COUNT - 1];
  vec3 lowestAltitudeColor = colorSteps[0];
  vec3 highestAltitudeColor = colorSteps[COLOR_STEPS_COUNT - 1];

  if (vAltitude < lowestAltitude) {
    altitudeColor = lowestAltitudeColor;
  }

  if (vAltitude > highestAlttitude) {
    altitudeColor = highestAltitudeColor;
  }

  for(int i = 0; i < COLOR_STEPS_COUNT - 1; i++) {
    if (vAltitude > altitudeSteps[i] && vAltitude <= altitudeSteps[i + 1]) {
      altitudeColor = mix(
        colorSteps[i],
        colorSteps[i + 1],
        (vAltitude - altitudeSteps[i]) / (altitudeSteps[i + 1] - altitudeSteps[i])
      );
    }
  }

  if (hasTexture == 1) {
    vec4 texColor = texture2D(texture, vUv);

    gl_FragColor = vec4(mix(altitudeColor.xyz, texColor.xyz, textureIntensity), 1.0);
  } else {
    vec3 color = altitudeColor * clamp(dot(vNormal, normalize(lightVector)), 0.3, 1.0); 
  
    gl_FragColor = vec4(color, opacity);
  }
  
  #include <fog_fragment>
}
`

export default fragmentShader
