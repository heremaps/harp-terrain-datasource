/*
 * Copyright © 2017-2018 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

export default function fetchSampleTile (tileKey) {
  const column = tileKey.column
  const row = tileKey.rowCount() - tileKey.row - 1
  const level = tileKey.level

  const url = `https://nikgarmash.com/grand-teton-tiles/tiles/${level}/${column}/${row}.terrain`

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
