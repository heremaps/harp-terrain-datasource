/*
 * Copyright © 2017-2018 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three'

import { ElevationMaterial } from './elevation-styling'
import { Tile } from '@here/harp-mapview'
import { TileFactory } from '@here/harp-mapview-decoder'

export class TerrainTileFactory extends TileFactory {
  constructor (getTileMaterial) {
    super(TerrainTile)
    this.getTileMaterial = getTileMaterial
  }

  create (dataSource, tileKey) {
    return new TerrainTile(dataSource, tileKey, this.getTileMaterial)
  }
}

class TerrainTile extends Tile {
  constructor (dataSource, tileKey, getTileMaterial) {
    super(dataSource, tileKey)

    this.getTileMaterial = getTileMaterial
  }

  generateTileMaterial (decodedTile) {
    return this.getTileMaterial
      ? this.getTileMaterial(this, decodedTile)
      : Promise.resolve(new ElevationMaterial(decodedTile))
  }

  getTileSize (tileKey, projection, tilingScheme) {
    const boundingBox = new THREE.Box3()
    const size = new THREE.Vector3()
    const geoBox = tilingScheme.getGeoBox(tileKey)

    projection.projectBox(geoBox, boundingBox)
    boundingBox.getSize(size)

    return size
  }

  scaleVertices (positionArray, tileHeader, tileSize) {
    const xScale = tileSize.x
    const yScale = tileSize.y
    const zScale = tileHeader.maxHeight - tileHeader.minHeight
    const scaledPositionArray = new Float32Array(positionArray.length)

    for (let i = 0; i < positionArray.length; i += 3) {
      scaledPositionArray[i] = positionArray[i] * xScale - tileSize.x / 2
      scaledPositionArray[i + 1] = positionArray[i + 1] * yScale - tileSize.y / 2
      scaledPositionArray[i + 2] = positionArray[i + 2] * zScale + tileHeader.minHeight
    }

    return scaledPositionArray
  }

  createObjects (decodedTile, objects) {
    this.generateTileMaterial(decodedTile).then((material) =>
      this.createTileObjects(material, decodedTile, objects)
    )
  }

  createTileObjects (material, decodedTile, objects) {
    const tileSize = this.getTileSize(
      this.tileKey,
      this.projection,
      this.dataSource.getTilingScheme()
    )
    const srcGeometry = decodedTile.geometries[0]
    const tileGeometry = new THREE.BufferGeometry()
    const tileMesh = new THREE.Mesh(tileGeometry, material)

    srcGeometry.vertexAttributes.forEach((attr) => {
      const buffer =
        attr.name === 'position'
          ? this.scaleVertices(attr.buffer, attr.metadata, tileSize)
          : attr.buffer

      tileGeometry.addAttribute(attr.name, new THREE.BufferAttribute(buffer, attr.itemCount))
    })

    if (srcGeometry.index !== undefined) {
      tileGeometry.setIndex(new THREE.BufferAttribute(srcGeometry.index.buffer, 1))
    }

    if (!tileGeometry.attributes.normal && !tileGeometry.attributes.octNormal) {
      tileGeometry.computeVertexNormals()
    }

    this.registerTileObject(tileMesh)

    objects.push(tileMesh)

    this.dataSource.requestUpdate()
  }
}

export { ElevationMaterial }
