# Harp.gl Terrain Datasource Example

This module contains an example usage of the [Terrain Datasource](https://github.com/heremaps/harp-terrain-datasource) with multiple data providers.

## Data Providers

* [Cesium World Terrain](https://cesium.com/content/cesium-world-terrain/)
* [Grand Teton sample tiles](https://github.com/nik-garmash/grand-teton-tiles) generated using [TIN Terrain](https://github.com/heremaps/tin-terrain)
* [Mapzen Terrain Tiles](https://mapzen.com/documentation/terrain-tiles/)

## HERE Credentials

In order to use some of the HERE Services, such as Map Tile API, you would need to register
and generate credentials.

First, you need to become a [HERE Developer](https://www.here.xyz/getting-started/).

For Map Tile API, in order to get Satellite Images, you need to generate a pair of `app_id`
and `app_code`, that you can do directly from your Developer Dashboard, see a step-by-step guide
[here](https://www.here.xyz/getting-started/).

These credentials need to be passed to the Service in order to retrieve tiles, please see the
examples to check how it is done.

## Cesium Credentials

In order to use the Cesium services, you need a [Cesium ion](https://cesium.com/ion) token. It is used to fetch Cesium World Terrain tiles.

## Run The App

```bash
APP_ID=… APP_CODE=… CESIUM_USER_ACCESS_TOKEN=… yarn start
```

* `APP_ID` and `APP_CODE` are the HERE Developer credentials.

* `CESIUM_USER_ACCESS_TOKEN` is the Cesium credential.

## License

See the [LICENSE](../LICENSE) file in the root of this project for license details about using `harp-terrain-datasource`.

For other use cases not listed in the license terms, please [contact us](https://developer.here.com/contact-us).
Copyright © 2017-2019 HERE Europe B.V.