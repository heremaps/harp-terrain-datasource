# Harp.gl Terrain Datasource Example

Example usage of the [Terrain Datasource](https://github.com/heremaps/harp-terrain-datasource) with multiple data providers.

## Data Providers

* [Cesium World Terrain](https://cesium.com/content/cesium-world-terrain/)
* [Grand Teton sample tiles](https://github.com/nik-garmash/grand-teton-tiles) generated using [TIN Terrain](https://github.com/heremaps/tin-terrain)
* [Mapzen Terrain Tiles](https://mapzen.com/documentation/terrain-tiles/)

## Run The App

```bash
APP_ID=… APP_CODE=… CESIUM_USER_ACCESS_TOKEN=… npm start
```

* `APP_ID` and `APP_CODE` are HERE Developer credentials, you can get them at [HERE Developer Portal](https://developer.here.com). They are needed for the application to fetch satellite imagery and drape it on top of the terrain.

* `CESIUM_USER_ACCESS_TOKEN` is a [Cesium ion](https://cesium.com/ion) token. It is used to fetch Cesium World Terrain tiles.

Copyright © 2018 HERE Europe B.V.



### 
