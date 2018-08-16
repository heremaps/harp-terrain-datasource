/*
 * Copyright © 2017-2018 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

const {WorkerServiceManager, TileDecoderService} = require('@here/harp-mapview-decoder/index-worker')
const {PNG_TILE_DECODER_ID} = require('./tile-decoder')
const {PNGTileDecoder} = require('./tile-decoder')

WorkerServiceManager.getInstance().register({
  serviceType: PNG_TILE_DECODER_ID,
  factory: (serviceId) => {
    return TileDecoderService.start(serviceId, new PNGTileDecoder())
  }
})
