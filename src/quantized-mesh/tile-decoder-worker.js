/*
 * Copyright © 2017-2020 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkerServiceManager, TileDecoderService } from '@here/harp-mapview-decoder/index-worker'
import { QUANTIZED_MESH_TILE_DECODER_ID, QuantizedMeshTileDecoder } from './tile-decoder'

WorkerServiceManager.getInstance().register({
  serviceType: QUANTIZED_MESH_TILE_DECODER_ID,
  factory: (serviceId) => {
    return TileDecoderService.start(serviceId, new QuantizedMeshTileDecoder())
  }
})
