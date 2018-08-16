/*
 * Copyright © 2017-2018 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

import UPNG from 'upng-js'

export const DEM_ENCODINGS = {
  float32: 'float32',
  terrarium: 'terrarium'
}

const DEFAULT_WIDTH_SEGMENTS = 63
const DEFAULT_HEIGHT_SEGMENTS = 63
const DEFAULT_DEM_ENCODING = DEM_ENCODINGS.terrarium

export const PNG_TILE_DECODER_ID = 'png-tile-decoder'

export class PNGTileDecoder {
  connect () {
    return Promise.resolve()
  }

  configure (options) {
    // Data source calls .setTheme() when initialized
    // which triggers configure() call without options
    if (options === undefined) {
      return
    }

    this.options = Object.assign({
      widthSegments: DEFAULT_WIDTH_SEGMENTS,
      heightSegments: DEFAULT_HEIGHT_SEGMENTS,
      demEncoding: DEFAULT_DEM_ENCODING
    }, options)

    this.indexArray = this.constructIndexArray(
      this.options.widthSegments,
      this.options.heightSegments
    )
  }

  getVerticesCount () {
    const width = this.options.widthSegments + 1
    const height = this.options.heightSegments + 1
    return {
      width,
      height,
      total: width * height
    }
  }

  validateImg (img) {
    const { width, height } = this.getVerticesCount()

    if (
      img.width % width !== 0 ||
      img.height % height !== 0
    ) {
      throw new Error(
        'Number of vertices in the plane must be ' +
        'multiple of number of pixels in DEM tile in both dimensions.\n' +
        `DEM tile: ${img.width}x${img.height} pixels\n` +
        `Plane geometry: ${width}x${height} vertices`
      )
    }
  }

  decodeFloat32Pixel (img, pixelIndex) {
    const BYTES_PER_PIXEL = 4
    const startByte = pixelIndex * BYTES_PER_PIXEL
    const pixel = Uint8Array.from(
      img.data.slice(startByte, startByte + BYTES_PER_PIXEL)
    )
    const view = new DataView(pixel.buffer)

    return view.getFloat32(0, true)
  }

  decodeTerrariumPixel (img, pixelIndex) {
    const BYTES_PER_PIXEL = 3
    const startByte = pixelIndex * BYTES_PER_PIXEL
    const pixel = Uint8Array.from(
      img.data.slice(startByte, startByte + BYTES_PER_PIXEL)
    )
    const view = new DataView(pixel.buffer)

    const red = view.getUint8(0)
    const green = view.getUint8(1)
    const blue = view.getUint8(2)

    return (red * 256 + green + blue / 256) - 32768
  }

  readHeightsFromImg (img) {
    const pixelsCount = img.width * img.height
    const heights = new Float32Array(pixelsCount)
    let maxHeight = 0
    let minHeight = 0

    let pixelDecodingFn

    switch (this.options.demEncoding) {
      case DEM_ENCODINGS.float32: {
        pixelDecodingFn = (img, i) => this.decodeFloat32Pixel(img, i)
        break
      }
      case DEM_ENCODINGS.terrarium: {
        pixelDecodingFn = (img, i) => this.decodeTerrariumPixel(img, i)
        break
      }
      default: {
        throw new Error(`"${this.options.demEncoding}" is unsupported DEM encoding`)
      }
    }

    for (let i = 0; i < pixelsCount; i++) {
      const height = pixelDecodingFn(img, i)

      heights[i] = height

      if (height > maxHeight) {
        maxHeight = height
      }

      if (height < minHeight) {
        minHeight = height
      }
    }

    return { heights, minHeight, maxHeight }
  }

  calculateSegmentVertexIndices (segmentIndex, widthSegments) {
    const calculateTopLeft = (i, ws) => Math.floor(i / ws) + i

    const topLeft = calculateTopLeft(segmentIndex, widthSegments)
    const topRight = topLeft + 1
    const bottomLeft = calculateTopLeft(segmentIndex + widthSegments, widthSegments)
    const bottomRight = bottomLeft + 1

    return { topLeft, topRight, bottomLeft, bottomRight }
  }

  constructIndexArray (widthSegments, heightSegments) {
    const segmentsCount = widthSegments * heightSegments
    const vertexCount = this.getVerticesCount().total
    const trianglesCount = segmentsCount * 2
    const indexArray = vertexCount > Math.pow(2, 16)
      ? new Uint32Array(trianglesCount * 3)
      : new Uint16Array(trianglesCount * 3)
    const indicesPerSegment = 6

    for (let i = 0, ii = 0; i < segmentsCount; i++, ii += indicesPerSegment) {
      const segmentVertexIndices = this.calculateSegmentVertexIndices(i, widthSegments)

      // Left triangle
      indexArray[ii] = segmentVertexIndices.topLeft
      indexArray[ii + 1] = segmentVertexIndices.bottomLeft
      indexArray[ii + 2] = segmentVertexIndices.topRight
      // Right triangle
      indexArray[ii + 3] = segmentVertexIndices.bottomLeft
      indexArray[ii + 4] = segmentVertexIndices.bottomRight
      indexArray[ii + 5] = segmentVertexIndices.topRight
    }

    return indexArray
  }

  constructPositionArray (img, heights, minHeight, maxHeight) {
    const vertexCount = this.getVerticesCount()
    const elementsPerVertex = 3
    const positionArray = new Float32Array(vertexCount.total * elementsPerVertex)
    const widthScale = img.width / vertexCount.width
    const heightScale = img.height / vertexCount.height

    for (let vertexIndex = 0; vertexIndex < vertexCount.total; vertexIndex++) {
      const vertexX = vertexIndex % vertexCount.width
      const vertexY = Math.floor(vertexIndex / vertexCount.width)
      const heightX = vertexX * widthScale
      const heightY = vertexY * heightScale
      const heightIndex = heightY * img.width + heightX

      // X, Y and Z are converted to [0, 1] space.
      // Y is inverted as in THREE.js Y axis goes bottom-up.
      const x = vertexX / (vertexCount.width - 1)
      const y = 1 - vertexY / (vertexCount.height - 1)
      let z = 0
      if (maxHeight - minHeight !== 0) {
        z = (heights[heightIndex] - minHeight) / (maxHeight - minHeight)
      }

      positionArray[elementsPerVertex * vertexIndex] = x
      positionArray[elementsPerVertex * vertexIndex + 1] = y
      positionArray[elementsPerVertex * vertexIndex + 2] = z
    }

    return positionArray
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
    const img = UPNG.decode(data)

    this.validateImg(img)

    const { heights, minHeight, maxHeight } = this.readHeightsFromImg(img)
    const positionArray = this.constructPositionArray(img, heights, minHeight, maxHeight)
    const uvArray = this.constructUvArray(positionArray)
    const decodedTile = {
      techniques: [],
      geometries: [
        {
          index: {
            name: 'index',
            type: 'uint16',
            buffer: this.indexArray,
            itemCount: 1
          },
          vertexAttributes: [
            {
              name: 'position',
              type: 'float',
              buffer: positionArray,
              itemCount: 3,
              metadata: { minHeight, maxHeight }
            },
            {
              name: 'uv',
              type: 'float',
              buffer: uvArray,
              itemCount: 2
            }
          ]
        }
      ]
    }

    return Promise.resolve(decodedTile)
  }
}
