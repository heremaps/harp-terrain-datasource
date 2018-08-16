/*
 * Copyright © 2017-2018 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Fetches tiles PNGa tiles with elevation encoded as float32 numbers.
 * Tiles are using webMercator tiling scheme
 * @param tileKey
 * @returns {Promise<ArrayBuffer>}
 */
export default function fetchFloat32PNGTile (tileKey) {
  const column = tileKey.column
  const row = tileKey.rowCount() - tileKey.row - 1
  const level = tileKey.level

  const url = `https://tile-server.concept.here.com/ned-sf/heights/${level}/${column}/${row}.png`

  return window.fetch(url)
    .then(res => {
      if (res.status !== 200) {
        throw new Error(`Unable to load tile ${url}`)
      }

      return res.arrayBuffer()
    })
    .catch(err => {
      console.log(err)
    })
}
