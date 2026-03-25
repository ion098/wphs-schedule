#!/bin/sh

# Install minhtml
wget https://github.com/wilsonzlin/minify-html/releases/download/v0.18.1/minhtml-0.18.1-x86_64-unknown-linux-gnu -O minhtml
chmod +x ./minhtml

# To minify service_worker.js, we need to define `caches` as a global.
EXTERNS=$(mktemp)
cat <<EOF > $EXTERNS
/**
 * @type {CacheStorage}
 */
var caches;
EOF

yarn dlx google-closure-compiler -O ADVANCED script/main.js | sponge script/main.js &
yarn dlx google-closure-compiler -O ADVANCED service_worker.js --externs $EXTERNS | sponge service_worker.js &
./minhtml index.html --minify-css | sponge index.html &

wait

rm -rf ./minhtml