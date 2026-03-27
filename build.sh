#!/bin/bash

# Build the project using Parcel
yarn install
yarn run parcel build index.html

# Run postprocessing on the generated index.html to remove all sets of 4 spaces and newlines
perl -i -0777 -pe 's/ {4}//g; s/\r?\n//g' dist/index.html