/*
 * Copyright © 2017-2020 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

import decode from '@here/quantized-mesh-decoder'

export const QUANTIZED_MESH_TILE_DECODER_ID = 'quantized-mesh-tile-decoder'

export class QuantizedMeshTileDecoder {
  connect () {
    return Promise.resolve()
  }

  /**
   * Rearranges vertices components in more THREE.js-friendly
   * way [x, y, z, x, y, z, ...] instead of
   * [x, x, x,..., y, y, y,... z, z, z, ...].
   *
   * Also, scales x, y, z to be in [0, 1] range.
   *
   * @param {Uint16Array} vertexData
   * @returns {Float32Array}
   */
  constructPositionArray (vertexData) {
    const elementsPerVertex = 3
    const vertexCount = vertexData.length / 3
    const positionAttributeArray = new Float32Array(vertexData.length)

    const vertexMaxPosition = 32767

    for (let i = 0; i < vertexCount; i++) {
      positionAttributeArray[i * elementsPerVertex] = vertexData[i] / vertexMaxPosition
      positionAttributeArray[i * elementsPerVertex + 1] = vertexData[i + vertexCount] / vertexMaxPosition
      positionAttributeArray[i * elementsPerVertex + 2] = vertexData[i + vertexCount * 2] / vertexMaxPosition
    }

    return positionAttributeArray
  }

  /**
   * Drops z-coordinate of each vertex to make a UV-map.
   *
   * @param {Float32Array} positionArray
   * @returns {Float32Array}
   */
  constructUvArray (positionArray) {
    return positionArray.filter((item, index) => index % 3 < 2)
  }

  decodeTile (data) {
    const decodedTile = decode(data)
    const positionArray = this.constructPositionArray(decodedTile.vertexData)
    const uvArray = this.constructUvArray(positionArray)
    const vertexAttributes = []

    vertexAttributes.push(
      {
        name: 'position',
        type: 'float',
        buffer: positionArray,
        itemCount: 3,
        metadata: decodedTile.header
      },
      {
        name: 'uv',
        type: 'float',
        buffer: uvArray,
        itemCount: 2
      }
    )

    Object.keys(decodedTile.extensions).forEach(key => {
      if (key === 'vertexNormals' && decodedTile.extensions[key].byteLength > 0) {
        const array = new Uint8Array(decodedTile.extensions[key])
        vertexAttributes.push({
          name: 'octNormal',
          type: 'float',
          buffer: array,
          itemCount: 2
        })
      }
    })

    const verityTile = {
      techniques: [],
      geometries: [
        {
          index: {
            name: 'index',
            type: 'uint16',
            buffer: decodedTile.triangleIndices,
            itemCount: 1
          },
          vertexAttributes
        }
      ]
    }

    return Promise.resolve(verityTile)
  }
}
