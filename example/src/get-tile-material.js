/*
 * Copyright © 2017-2018 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three'
import { mercatorTilingScheme } from '@here/harp-geoutils'
import { ElevationMaterial } from '@here/harp-terrain-datasource/src/terrain-tile'

import config from './config'
import {
  datasetList,
  stylesList
} from './constants'

const textureLoader = new THREE.TextureLoader()
textureLoader.crossOrigin = ''

function getTileTextureUrl (tile) {
  const textureTileKey = mercatorTilingScheme.getTileKey(tile.geoBox.center, tile.tileKey.level)
  const shard = Math.round(Math.random() * 3) + 1

  return `https://${shard}.aerial.maps.api.here.com/maptile/2.1/basetile/newest/satellite.day/${textureTileKey.level}/${textureTileKey.column}/${textureTileKey.rowCount() - textureTileKey.row - 1}/512/png?app_id=${config.APP_ID}&app_code=${config.APP_CODE}`
}

function fetchTileTexture (tile) {
  const textureUrl = getTileTextureUrl(tile)

  return new Promise((resolve, reject) => {
    textureLoader.load(textureUrl, resolve, undefined, reject)
  })
}

const defaultColorSteps = [
  {
    color: new THREE.Vector3(0.670588235, 0.850980392, 0.91372549),
    altitude: 700
  },
  {
    color: new THREE.Vector3(0.109803922, 0.564705882, 0.6),
    altitude: 1500
  },
  {
    color: new THREE.Vector3(0.403921569, 0.662745098, 0.811764706),
    altitude: 2000
  },
  {
    color: new THREE.Vector3(0.741176471, 0.788235294, 0.882352941),
    altitude: 2800
  },
  {
    color: new THREE.Vector3(1, 1, 1),
    altitude: 3000
  }
]

const defaultLighting = new THREE.Vector3(0.7, 0, 0.5)
const cesiumLighting = new THREE.Vector3(0, 0, 1)

export default function getTileMaterial (mapTile, decodedTile, options) {
  switch (options.style) {
    // Elevation Styling
    case stylesList[0]: {
      return Promise.resolve(new ElevationMaterial(
        decodedTile,
        {
          colorSteps: defaultColorSteps,
          lightVector: options.dataset === datasetList[1]
            ? cesiumLighting
            : defaultLighting
        }
      ))
    }

    // Texture
    case stylesList[1]: {
      return fetchTileTexture(mapTile).then((texture) => {
        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter
        texture.generateMipmaps = false
        texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping

        return new THREE.MeshBasicMaterial({
          map: texture
        })
      })
    }

    // Wireframe
    case stylesList[2]: {
      return Promise.resolve(new THREE.MeshBasicMaterial({
        color: 0x000000,
        wireframe: true
      }))
    }
  }
}
