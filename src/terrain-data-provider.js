/*
 * Copyright © 2017-2018 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

export class TerrainDataProvider {
  constructor (fetchTile) {
    if (fetchTile === undefined) {
      throw new Error('"fetchTile()" method was not provided')
    }

    this.fetchTile = fetchTile
  }

  connect () {
    return Promise.resolve()
  }

  ready () {
    return true
  }

  getTile (tileKey) {
    return this.fetchTile(tileKey)
  }
}
