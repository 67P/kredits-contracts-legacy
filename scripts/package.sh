#!/bin/bash

DIR=$(dirname `realpath $0`)
ROOT_DIR="$DIR/.."

set +xe
cp $ROOT_DIR/lib/dev/*.js $ROOT_DIR/lib
set -e

echo "Copied development contract data from $ROOT_DIR/lib/dev to $ROOT_DIR/lib"
