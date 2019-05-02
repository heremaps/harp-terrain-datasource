# API Reference

```javascript
import { TerrainDataSource } from '@here/harp-terrain-datasource'

new TerrainDataSource(TerrainDataSourceOptions)
```

##### TerrainDataSourceOptions

- `concurrentDecoderScriptUrl`: string  
  URL from which to fetch decoder worker script. See [Getting Started Guide](./GettingStartedGuide.md) on how to setup worker.
- `concurrentDecoderServiceName`: string  
  Arbitrary string to identify the decoder.
- `fetchTile`: (tileKey: [TileKey](https://heremaps.github.io/harp.gl/doc/classes/_here_harp_geoutils.tilekey.html)) → Promise<ArrayBuffer\>  
  Fetches a tile using provided tileKey.
- `tilingScheme`: [TilingScheme](https://heremaps.github.io/harp.gl/doc/classes/_here_harp_geoutils.tilingscheme.html)  
  Tiling scheme used by the data source. See [predefined tiling schemes](https://github.com/heremaps/harp.gl/tree/master/%40here/harp-geoutils/lib/tiling) by harp.gl.
- `getTileMaterial?`: (tile: [Tile](https://heremaps.github.io/harp.gl/doc/classes/_here_harp_mapview.tile.html), decodedTile: [DecodedTile](https://heremaps.github.io/harp.gl/doc/interfaces/_here_harp_datasource_protocol.decodedtile.html)) → Promise<[THREE.Material](https://threejs.org/docs/index.html#api/materials/Material)\>  
  Constructs material of a tile. Can be used also to fetch texture using the tile key.  
  Default: [ElevationMaterial](#elevation-material)
- `decoderOptions?`: [PNGDecoderOptions](#PNGDecoderOptions)
- `getDisplayZoomLevel?`: (level: number) → number  
  Generates custom zoom level for the data source depending on map's zoom.
- `getCustomObjects?`:(terrainTile: [TerrainTile](https://github.com/heremaps/harp-terrain-datasource/blob/master/src/terrain-tile.js)) → Promise | void  
  Allows you to add custom objects on top of the terrain.

##### PNGDecoderOptions

* `widthSegments?`: number  
  Amount of width segments of [Plane Buffer Geometry](https://threejs.org/docs/index.html#api/geometries/PlaneBufferGeometry) which will be created for each tile.  
  Default: 63
* `heightSegments?`: number  
  Default: 63

### Elevation Material

Terrain Datasource comes with three.js material for elevation based styling. You can specify different colors for different altitudes.

```js
import { ElevationMaterial } from '@here/harp-terrain-datasource/src/terrain-tile'

new ElevationMaterial(ElevationMaterialOptions)
```

##### ElevationMaterialOptions

* `colorStreps`: [[ColorStep](#colorstep)]  
  Defines how colors specific altitudes of your terrain.
* `texture?`: [THREE.Texture](https://threejs.org/docs/index.html#api/en/textures/Texture)
* `textureIntensity?`: number  
  Defines how to mix texture color (if present) and elevation based color. Ratio in the [0, 1] range, 1 means only texture color, 0 — only elevation based color.
* `lightVector?`: [THREE.Vector3](https://threejs.org/docs/index.html#api/en/math/Vector3)  
  Direction of the light, used to shade the terrain.
  Default: `new THREE.Vector3(1.0, 0.0, 0.5)`

##### ColorStep

* `altitude`: number  
  Altitude where to apply color.
* `color`: [THREE.Vector3](https://threejs.org/docs/index.html#api/en/math/Vector3)  
  Color of the specified altitude. Defined as a vector with RGB components.

See also TypeScript typings in [../src/index.d.ts](../src/index.d.ts)