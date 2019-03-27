/*
 * Copyright © 2017-2019 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dat from 'dat.gui'
import * as THREE from 'three'
import { MapView } from '@here/harp-mapview'
import {
  GeoCoordinates,
  hereTilingScheme,
  mercatorTilingScheme,
  webMercatorTilingScheme
} from '@here/harp-geoutils'
import { MapControls } from '@here/harp-map-controls'
import { TerrainDataSource } from '@here/harp-terrain-datasource'
import { QUANTIZED_MESH_TILE_DECODER_ID } from '@here/harp-terrain-datasource/src/quantized-mesh/tile-decoder'
import {
  PNG_TILE_DECODER_ID,
  DEM_ENCODINGS
} from '@here/harp-terrain-datasource/src/png/tile-decoder'

import config from './config'
import {
  datasetList,
  stylesList
} from './constants'
import fetchCesiumWorldTerrainTile from './fetch-cesium-tile'
import fetchSampleTile from './fetch-sample-tile'
import getTileMaterial from './get-tile-material'
import fetchNextzenTile from './fetch-nextzen-tile'
import './attribution-ui'

const QUANTIZED_MESH_DECODER_URL = './dist/quantized-mesh-decoder.bundle.js'
const PNG_DECODER_URL = './dist/png-decoder.bundle.js'

function fetchWorldTerrainToken () {
  const url = `https://api.cesium.com/v1/assets/1/endpoint?access_token=${config.CESIUM_USER_ACCESS_TOKEN}`

  return window.fetch(url)
    .then(res => res.json())
    .then(endpoint => endpoint.accessToken)
    .catch(err => console.log(err))
}

function initializeMapView (canvas) {
  const mapView = new MapView({
    minZoomLevel: 8,
    maxZoomLevel: 14,
    canvas,
    maxVisibleDataSourceTiles: 300,
    tileCacheSize: 1000
  })

  /* eslint-disable no-new */
  new MapControls(mapView)
  /* eslint-enable no-new */

  mapView.resize(window.innerWidth, window.innerHeight)

  mapView.zoomLevelBias = 0.5

  window.addEventListener('resize', () => {
    mapView.resize(window.innerWidth, window.innerHeight)
  })

  return mapView
}

function createCesiumWorldTerrainDataSource (worldTerrainToken, options) {
  return new TerrainDataSource({
    concurrentDecoderServiceName: QUANTIZED_MESH_TILE_DECODER_ID,
    concurrentDecoderScriptUrl: QUANTIZED_MESH_DECODER_URL,
    tilingScheme: hereTilingScheme,
    fetchTile: (tileKey) => fetchCesiumWorldTerrainTile(tileKey, worldTerrainToken),
    getTileMaterial: (mapTile, decodedTile) => getTileMaterial(mapTile, decodedTile, options)
  })
}

function createSampleTilesDataSource (options) {
  return new TerrainDataSource({
    concurrentDecoderServiceName: QUANTIZED_MESH_TILE_DECODER_ID,
    concurrentDecoderScriptUrl: QUANTIZED_MESH_DECODER_URL,
    tilingScheme: webMercatorTilingScheme,
    fetchTile: (tileKey) => fetchSampleTile(tileKey),
    getTileMaterial: (mapTile, decodedTile) => getTileMaterial(mapTile, decodedTile, options),
    getDisplayZoomLevel: level => {
      return THREE.Math.clamp(level + 2, 8, 14)
    }
  })
}

function createPNGDataSource (options, decoderOptions) {
  return new TerrainDataSource({
    concurrentDecoderServiceName: PNG_TILE_DECODER_ID,
    concurrentDecoderScriptUrl: PNG_DECODER_URL,
    tilingScheme: mercatorTilingScheme,
    fetchTile: fetchNextzenTile,
    getTileMaterial: (mapTile, decodedTile) => getTileMaterial(mapTile, decodedTile, options),
    decoderOptions
  })
}

fetchWorldTerrainToken().then(worldTerrainToken => {
  const uiOptions = {
    dataset: datasetList[0],
    style: stylesList[0]
  }
  const mapView = initializeMapView(document.getElementById('map'))

  const cesiumWorldTerrainDataSource = createCesiumWorldTerrainDataSource(worldTerrainToken, uiOptions)
  const sampleDataSource = createSampleTilesDataSource(uiOptions)
  const nextzenDataSource = createPNGDataSource(uiOptions, {
    widthSegments: 63,
    heightSegments: 63,
    demEncoding: DEM_ENCODINGS.terrarium
  })

  mapView.addDataSource(cesiumWorldTerrainDataSource)
  mapView.addDataSource(sampleDataSource)
  mapView.addDataSource(nextzenDataSource)

  sampleDataSource.enabled = uiOptions.dataset === datasetList[0]
  cesiumWorldTerrainDataSource.enabled = uiOptions.dataset === datasetList[1]
  nextzenDataSource.enabled = uiOptions.dataset === datasetList[2]

  mapView.setCameraGeolocationAndZoom(
    new GeoCoordinates(43.751997519592596, -110.73214288570348),
    12
  )
  mapView.camera.rotateX(THREE.Math.degToRad(35))

  const gui = new dat.GUI({width: 300})
  const datasetController = gui.add(uiOptions, 'dataset', datasetList)
  const styleController = gui.add(uiOptions, 'style', stylesList)

  function updateTiles () {
    mapView.clearTileCache()
    mapView.update()
  }

  datasetController.onChange(dataset => {
    sampleDataSource.enabled = dataset === datasetList[0]
    cesiumWorldTerrainDataSource.enabled = dataset === datasetList[1]
    nextzenDataSource.enabled = dataset === datasetList[2]

    styleController.setValue(stylesList[0])
    styleController.updateDisplay()

    // Disable texture style for Cesium World Terrain tiles for now
    // as we have only texture tiles in mercator tiling
    // scheme and Cesium tiles are using Equirectangular.
    styleController
      .domElement
      .querySelectorAll('option[value*=Texture]')
      .forEach(option => { option.disabled = dataset === datasetList[1] })

    updateTiles()
    window.postMessage({type: 'dataset-change', dataset}, '*')
  })
  styleController.onChange(updateTiles)
})
