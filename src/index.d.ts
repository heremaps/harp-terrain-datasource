/*
 * Copyright © 2017-2019 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

import {
	TileKey,
	TilingScheme
} from '@here/geoutils'
import { DecodedTile } from '@here/datasource-protocol'
import { Tile } from '@here/mapview'
import { Material } from 'three'
import { PNG_TILE_DECODER_ID } from './png/tile-decoder'
import { QUANTIZED_MESH_TILE_DECODER_ID } from './quantized-mesh/tile-decoder'

export type TileDecodeId = PNG_TILE_DECODER_ID | QUANTIZED_MESH_TILE_DECODER_ID;

export type DEMEncodingType = 'float32' | 'terrarium';

export interface PNGDecoderOptions {
  widthSegments?: number;
  heightSegments?: number;
  demEncoding?: DEMEncodingType;
}

export interface QuantizedMeshDecoderOptions {}

export interface TerrainDataSourceOptions {
  concurrentDecoderServiceName: TileDecodeId;
  concurrentDecoderScriptUrl: string;
	tilingScheme: TilingScheme;
	fetchTile: (tileKey: TileKey) => Promise<ArrayBuffer>;
	getTileMaterial?: (mapTile: Tile, decodedTile: DecodedTile) => Material;
	decoderOptions?: PNGDecoderOptions | QuantizedMeshDecoderOptions;
	getCustomObjects?: (terrainTile: TerrainTile) => Promise | void;
}

export class TerrainDataSource {
	 constructor(options: TerrainDataSourceOptions);
	 connect(): Promise<void>;
	 ready(): boolean;
	 shouldPreloadTiles(): boolean;
}
