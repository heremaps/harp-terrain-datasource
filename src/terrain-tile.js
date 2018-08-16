/*
 * Copyright © 2017-2019 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three'

import { ElevationMaterial } from './elevation-styling'
import { Tile } from '@here/harp-mapview'
import { TileFactory } from '@here/harp-mapview-decoder'

export class TerrainTileFactory extends TileFactory {
  constructor (options) {
    super(TerrainTile)
    this.options = options
  }

  create (dataSource, tileKey) {
    return new TerrainTile(dataSource, tileKey, this.options)
  }
}

class TerrainTile extends Tile {
  constructor (dataSource, tileKey, options) {
    super(dataSource, tileKey)

    this.getTileMaterial = options.getTileMaterial
    this.getCustomObjects = options.getCustomObjects

    this.decodedTileGeometry = null
    this.scaledPositionArray = null
    this.tileSize = this.getTileSize(
      this.tileKey,
      this.projection,
      this.dataSource.getTilingScheme()
    )
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

  findVertexAttribute (attributeArray, name) {
    return attributeArray.find(attr => attr.name === name)
  }

  createObjects (decodedTile, objects) {
    this.decodedTileGeometry = decodedTile.geometries[0]

    const vertexPosition = this.findVertexAttribute(this.decodedTileGeometry.vertexAttributes, 'position')
    const buffer = vertexPosition.buffer
    const metadata = vertexPosition.metadata

    this.scaledPositionArray = this.scaleVertices(buffer, metadata, this.tileSize)

    this.generateTileMaterial(decodedTile).then((material) =>
      this.createTileObjects(material, decodedTile.geometries[0], objects)
    )
    if (this.getCustomObjects) {
      Promise.resolve(this.getCustomObjects(this))
        .then(() => this.dataSource.requestUpdate())
    }
  }

  createTileObjects (material, decodedTileGeometry, objects) {
    const tileGeometry = new THREE.BufferGeometry()
    const tileMesh = new THREE.Mesh(tileGeometry, material)

    decodedTileGeometry.vertexAttributes.forEach((attr) => {
      const buffer =
        attr.name === 'position'
          ? this.scaledPositionArray
          : attr.buffer

      tileGeometry.addAttribute(attr.name, new THREE.BufferAttribute(buffer, attr.itemCount))
    })

    if (decodedTileGeometry.index !== undefined) {
      tileGeometry.setIndex(new THREE.BufferAttribute(decodedTileGeometry.index.buffer, 1))
    }

    if (!tileGeometry.attributes.normal && !tileGeometry.attributes.octNormal) {
      tileGeometry.computeVertexNormals()
    }

    this.registerTileObject(tileMesh)

    objects.push(tileMesh)

    this.dataSource.requestUpdate()
  }

  calculateLocalDisplacement (geoCoordinates) {
    const worldCoordinates = this.projection.projectPoint(geoCoordinates, new THREE.Vector3())
    const localCoordinates = worldCoordinates.sub(this.center)

    const indexBuffer = this.decodedTileGeometry.index.buffer
    const scaledPositionArray = this.scaledPositionArray
    const displacement = new THREE.Vector3(0, 0, 0)

    for (let i = 0; i < indexBuffer.length; i += 3) {
      const index1 = indexBuffer[i] * 3
      const index2 = indexBuffer[i + 1] * 3
      const index3 = indexBuffer[i + 2] * 3

      const v1 = new THREE.Vector3(scaledPositionArray[index1], scaledPositionArray[index1 + 1], scaledPositionArray[index1 + 2])
      const v2 = new THREE.Vector3(scaledPositionArray[index2], scaledPositionArray[index2 + 1], scaledPositionArray[index2 + 2])
      const v3 = new THREE.Vector3(scaledPositionArray[index3], scaledPositionArray[index3 + 1], scaledPositionArray[index3 + 2])

      const triangle = new THREE.Triangle(v1, v2, v3)
      const planeTriangle = new THREE.Triangle(
        v1.clone().setZ(0),
        v2.clone().setZ(0),
        v3.clone().setZ(0)
      )

      if (planeTriangle.containsPoint(localCoordinates)) {
        const rationVector = planeTriangle.getBarycoord(localCoordinates, new THREE.Vector3())

        const displacementZ = rationVector.x * triangle.a.z + rationVector.y * triangle.b.z + rationVector.z * triangle.c.z

        displacement.set(localCoordinates.x, localCoordinates.y, displacementZ)

        break
      }
    }

    return displacement
  }

  addObject (geoCoordinates, object) {
    if (this.geoBox.contains(geoCoordinates)) {
      object.displacement = this.calculateLocalDisplacement(geoCoordinates)

      this.registerTileObject(object)
      this.objects.push(object)
    }
  }
}

export { ElevationMaterial }
