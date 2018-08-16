/*
 * Copyright © 2017-2018 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

export default function fetchCesiumWorldTerrainTile (tileKey, worldTerrainToken) {
  const column = tileKey.column
  const row = tileKey.row
  const level = tileKey.level - 1

  const url = `https://assets.cesium.com/1/${level}/${column}/${row}.terrain?extensions=octvertexnormals&v=1.1.0`
  const qmContentType = 'application/vnd.quantized-mesh,application/octet-stream;q=0.9'

  return window.fetch(url, {
    headers: {
      'Accept': `${qmContentType};access_token=${worldTerrainToken};`
    }
  })
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
