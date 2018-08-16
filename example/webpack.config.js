/*
 * Copyright © 2017-2018 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

const path = require('path')
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')

if (process.env.APP_ID === undefined || process.env.APP_CODE === undefined) {
  throw new Error(
    'APP_ID or APP_CODE environment variable is missing.\n' +
    'Those are HERE Developer credentials, get them at https://developer.here.com.'
  )
}

if (process.env.CESIUM_USER_ACCESS_TOKEN === undefined) {
  throw new Error(
    'CESIUM_USER_ACCESS_TOKEN environment variable is missing.\n' +
    'Get the token at https://cesium.com/ion.'
  )
}

module.exports = [
  {
    target: 'webworker',
    entry: './src/quantized-mesh-decoder-worker.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'quantized-mesh-decoder.bundle.js'
    },
    devServer: {
      contentBase: path.join(__dirname, './'),
      publicPath: '/dist/'
    },
    externals: {
      three: 'THREE'
    },
    devtool: 'source-map'
  },
  {
    target: 'webworker',
    entry: './src/png-decoder-worker.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'png-decoder.bundle.js'
    },
    devServer: {
      contentBase: path.join(__dirname, './'),
      publicPath: '/dist/'
    },
    devtool: 'source-map'
  },
  {
    devServer: {
      contentBase: path.join(__dirname, './'),
      publicPath: '/dist/'
    },
    devtool: 'source-map',
    entry: './src/app.js',
    externals: {
      three: 'THREE'
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'app.bundle.js'
    },
    plugins: [
      new CopyWebpackPlugin([
        { from: './src/assets', to: './assets' },
        { from: './node_modules/three', to: './three' }
      ]),
      new webpack.DefinePlugin({
        'process.env.APP_ID': JSON.stringify(process.env.APP_ID),
        'process.env.APP_CODE': JSON.stringify(process.env.APP_CODE),
        'process.env.CESIUM_USER_ACCESS_TOKEN': JSON.stringify(process.env.CESIUM_USER_ACCESS_TOKEN)
      })
    ]
  }
]
