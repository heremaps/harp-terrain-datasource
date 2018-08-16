/*
 * Copyright © 2017-2018 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileDataSource } from '@here/harp-mapview-decoder'
import * as THREE from 'three'

import { TerrainTileFactory } from './terrain-tile'
import { TerrainDataProvider } from './terrain-data-provider'

export class TerrainDataSource extends TileDataSource {
  constructor (options) {
    if (options.tilingScheme === undefined) {
      throw new Error('No "tilingScheme" option provided.')
    }

    if (options.concurrentDecoderServiceName === undefined) {
      throw new Error(
        'No "concurrentDecoderServiceName" option provided. ' +
        'It should be an ID of one of the supported decoders.'
      )
    }

    if (options.concurrentDecoderScriptUrl === undefined) {
      throw new Error(
        'No "concurrentDecoderScriptUrl" option provided. ' +
        'It should be URL of a decoder worker used to decode tiles.'
      )
    }

    const tileFactory = new TerrainTileFactory(
      options.getTileMaterial
    )

    super(tileFactory, {
      id: 'terrain',
      tilingScheme: options.tilingScheme,
      dataProvider: new TerrainDataProvider(options.fetchTile),
      useWorker: true,
      concurrentDecoderServiceName: options.concurrentDecoderServiceName,
      concurrentDecoderScriptUrl: options.concurrentDecoderScriptUrl
    })

    if (options.decoderOptions !== undefined) {
      this.decoder.connect().then(() => {
        this.decoder.configure(options.decoderOptions)
      })
    }
  }

  connect () {
    return this.decoder.connect()
  }

  ready () {
    return true
  }

  shouldPreloadTiles () {
    return true
  }

  getDisplayZoomLevel (level) {
    return THREE.Math.clamp(level + 2, 8, 14)
  }
}
