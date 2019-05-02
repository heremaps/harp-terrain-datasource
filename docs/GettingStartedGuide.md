# Getting Started Guide

Following these instructions you can create from scratch a minimal application using `harp.gl` and Terrain Datasource to render [Cesium World Terrain](https://cesium.com/content/cesium-world-terrain/).

#### Prerequisites

Before you can run the examples you will need to obtain a [Cesium ion](https://cesium.com/ion/) access token to be able to download terrain data.

#### HTML

*index.html*

```html
<style>
  #map {
    width: 100%;
	height: 100%;
  }
</style>

<canvas id="map"></canvas>

<script type="text/javascript" src="./dist/three/build/three.js"></script>
<script type="text/javascript" src="./dist/app.bundle.js"></script>
```

Later you'll configure webpack to populate `./dist` folder. harp.gl modules rely on three.js in the global scope, so we put it right in `index.html`.

#### JavaScript

Create `./src/app.js` and import dependencies.

*./src/app.js*

```javascript
import * as THREE from 'three'
import { MapView } from '@here/harp-mapview'
import { GeoCoordinates, hereTilingScheme } from '@here/harp-geoutils'
import { MapControls } from '@here/harp-map-controls'
import { TerrainDataSource } from '@here/harp-terrain-datasource'
import { QUANTIZED_MESH_TILE_DECODER_ID } from '@here/harp-terrain-datasource/src/quantized-mesh/tile-decoder'
```

> Cesium World Terrain uses equirectangular tiling scheme, which is what `hereTilingSchene` is based on.

Cesium ion requires you to fetch an endpoint token using your user access token, add a function which does that.

```javascript
const CESIUM_USER_ACCESS_TOKEN = '__REPLACE_WITH_YOUR_CESIUM_ION_TOKEN__'

function fetchWorldTerrainToken () {
  const url = `https://api.cesium.com/v1/assets/1/endpoint?access_token=${ CESIUM_USER_ACCESS_TOKEN }`

  return window.fetch(url)
    .then(res => res.json())
    .then(endpoint => endpoint.accessToken)
    .catch(err => console.log(err))
}
```

> Assign your Cesium ion token to the `CESIUM_USER_ACCESS_TOKEN` constant.

Now add function which takes a tile key as an argument and fetches tile for a given key.

```javascript
function fetchTile (tileKey, worldTerrainToken) {
  const column = tileKey.column
  const row = tileKey.row
  const level = tileKey.level - 1

  const url = `https://assets.cesium.com/1/${ level }/${ column }/${ row }.terrain?v=1.1.0`
  const qmContentType = 'application/vnd.quantized-mesh,application/octet-stream;q=0.9'

  return window.fetch(url, {
    headers: {
      'Accept': `${ qmContentType };access_token=${ worldTerrainToken }`
    }
  })
    .then(res => {
      if (res.status !== 200) {
        throw new Error(`Unable to load tile ${ url }`)
      }

      return res.arrayBuffer()
    })
    .catch(err => {
      console.log(err)
    })
}
```
Using tile key, the function creates URL to request corresponding tile from Cesium server. It also adds necessary headers including access token you requested in the previous function. 

> HERE Tiling Scheme has one additional parent level compared to regular equirectengular scheme. Thus  `const level = tileKey.level - 1`  is needed.

Create another function which initializes harp.gl map view.

```javascript
function initializeMapView (canvas) {
  const mapView = new MapView({ 
    canvas,
    maxVisibleDataSourceTiles: 200,
	tileCacheSize: 400
  })

  new MapControls(mapView)

  mapView.resize(window.innerWidth, window.innerHeight)

  window.addEventListener('resize', () => {
    mapView.resize(window.innerWidth, window.innerHeight)
  })

  return mapView
}
```

The canvas DOM element is the only argument for this function. `new MapControls(mapView)` adds user-interactions to a map, so you can pan, zoom and tilt.

The last function creates a Terrain Datasource. 

```javascript
function createDataSource (worldTerrainToken) {
  return new TerrainDataSource({
    concurrentDecoderServiceName: QUANTIZED_MESH_TILE_DECODER_ID,
    concurrentDecoderScriptUrl: './dist/tile-decoder.bundle.js',
    tilingScheme: hereTilingScheme,
    fetchTile: (tileKey) => fetchTile(tileKey, worldTerrainToken),
    getTileMaterial: () => {
      return Promise.resolve(new THREE.MeshNormalMaterial())
    }
  })
}
```

Note that function takes Cesium endpoint token as the only argument and passes it to the `fetchTile` function which you created earlier.

You can use any three.js material for the tiles, in this case it's  `MeshNormalMaterial` which colors the mesh depending on a vertex normal direction.

`concurrentDecoderServiceName` takes the quantized mesh decoder id you imported in the first step.

`concurrentDecoderScriptUrl` option specifies URL where to fetch a decoder code from, it will be run in a worker. You're going to create decoder later.

See [API Reference](APIReference.md) for the full Datasource specs.

Now assemble together all the functions you've written.

```javascript
fetchWorldTerrainToken().then(worldTerrainToken => {
  const mapView = initializeMapView(document.getElementById('map'))
  const terrainDataSource = createDataSource(worldTerrainToken)
  
  mapView.addDataSource(terrainDataSource)

  mapView.setCameraGeolocationAndZoom(
    new GeoCoordinates(43.818897519592596, -110.76214288570348),
    13
  )
  mapView.camera.rotateX(THREE.Math.degToRad(45))
})
```

`  mapView.setCameraGeolocationAndZoom()` places camera on a specific point and sets zoom level and `mapView.camera.rotateX()` rotates it by a given degree.

You're done with `./src/app.js`, now create `./src/tile-decoder-worker.js` which will be bundled into `./dist/tile-decoder.bundle.js`.

*./src/tile-decoder-worker.js*

```javascript
importScripts('three/build/three.js')
require('@here/harp-terrain-datasource/src/quantized-mesh/tile-decoder-worker')
```

harp.gl modules require three.js in the global space, thus `importScripts('three/build/three.js')`. Second line imports all needed code to setup a quantized mesh decoder worker and it must be `require()` , not `import`, in order to be loaded after three.js.

#### Webpack Configuration

Last step is to bundle files you've just created with webpack. Create `./webpack.config.js`.

*./webpack.config.js*

```javascript
const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = [
  {
    target: 'webworker',
    entry: './src/tile-decoder-worker.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'tile-decoder.bundle.js'
    },
    devServer: {
      contentBase: path.join(__dirname, './'),
      publicPath: '/dist/'
    },
    externals: {
      three: "THREE"
    },
    devtool: 'source-map'
  },
  {
    entry: './src/app.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'app.bundle.js'
    },
    devServer: {
      contentBase: path.join(__dirname, './'),
      publicPath: '/dist/'
    },
    devtool: 'source-map',
    externals: {
      three: "THREE"
    },
    plugins: [
      new CopyWebpackPlugin([
        { from: './node_modules/three', to: './three' }
      ])
    ]
  }
]
```

The configuration has two modules, one for the decoder worker and one for the main app. Bundled files will end up in `./dist` folder along with three.js build which is copied from `node_modules/three` using `CopyWebpackPlugin`.

Webpack dev server serves statics from root app directory and bundles under `/dist/` path.

#### Run The App

If you've done everything correct, you can start dev server and see the app running on `http://localhost:8080`.

```bash
npx webpack-dev-server -d
```

In case of issues, check `./example` folder which contain source of a similar example application. It also has example of a PNG data source in the [Mapzen Terrarium](https://mapzen.com/documentation/terrain-tiles/formats/#terrarium) format and custom elevation based styling.