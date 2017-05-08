#!/bin/bash

DIR=$(dirname `realpath $0`)
ROOT_DIR="$DIR/.."

echo "Copying development contract data from $ROOT_DIR/lib/dev to $ROOT_DIR/lib"

set +xe
cp $ROOT_DIR/lib/dev/*.js $ROOT_DIR/lib
set -e

echo ""
echo "Done. Do not forget to commit and release a new version of the package"

