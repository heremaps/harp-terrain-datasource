/*
 * Copyright © 2017-2019 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

import { datasetList } from './constants'

const state = {
  currentDataset: datasetList[0],
  isAttributionPopupVisible: false
}

const attributionTrigger = document.querySelector('.attribution-trigger')
const attributionPopup = document.querySelector('.attribution-popup')
const cesiumAttribution = document.querySelector('.cesium-attribution')
//const nextzenAttribution = document.querySelector('.nextzen-attribution')
const sampleAttribution = document.querySelector('.sample-attribution')
const cesiumIonLogo = document.querySelector('.cesium-ion-logo')

attributionTrigger.addEventListener('click', onAttributionTriggerClick)
window.addEventListener('message', onWindowMessage)

updateUi(state)

function onAttributionTriggerClick () {
  state.isAttributionPopupVisible = !state.isAttributionPopupVisible

  updateUi(state)
}

function onWindowMessage (event) {
  if (typeof event.data !== 'object' || event.data.type !== 'dataset-change') {
    return
  }

  state.currentDataset = event.data.dataset
  updateUi(state)
}

function updateUi (state) {
  attributionTrigger.classList.toggle('active', state.isAttributionPopupVisible)
  attributionPopup.style.display = state.isAttributionPopupVisible ? 'block' : 'none'
  sampleAttribution.style.display = state.currentDataset === datasetList[0] ? 'block' : 'none'
  cesiumAttribution.style.display = state.currentDataset === datasetList[1] ? 'block' : 'none'
  //nextzenAttribution.style.display = state.currentDataset === datasetList[2] ? 'block' : 'none'

  cesiumIonLogo.style.display = state.currentDataset === datasetList[1] ? 'block' : 'none'
}
