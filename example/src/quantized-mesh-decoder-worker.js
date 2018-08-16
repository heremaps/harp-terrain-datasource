/*
 * Copyright © 2017-2018 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-env worker */
importScripts('three/build/three.js')

// Must be require(), not import, to be loaded after importScript()
require('@here/harp-terrain-datasource/src/quantized-mesh/tile-decoder-worker')
