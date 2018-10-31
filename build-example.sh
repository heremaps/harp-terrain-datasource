#!/usr/bin/env bash

set -e
set -v

cd example
npm i
npm run build

cp ./index.html ../
cp -R ./dist ../

