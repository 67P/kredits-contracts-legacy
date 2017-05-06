#!/bin/bash

path=$(readlink "$0")
DIR=$( cd "$( dirname "$path}" )" && pwd )
CONFIGDIR="$DIR/config"
CONFIGPATH=$CONFIGDIR/parity-dev-chain.json

if [ ! -f $CONFIGPATH ]; then
  cp $CONFIGPATH.example $CONFIGPATH
fi

echo "Hello and Welcome to working on Kredits"

set +e
whichParity=$( which parity )
if [ "$?" -ne 0 ]; then
  echo "parity not found. Is parity installed and in your PATH?";
  exit 1
fi
set -e

echo "trying to be smart and configuring a local KreditsChain with an account for you"

parityAccounts=$($whichParity account list --chain=$CONFIGPATH)
if [ "$parityAccounts" == "[]" ]; then
  echo "seems you do not have any parity accounts for the KreditsChain"

  echo "press ENTER to continue and create a new parity account"
  read continue
  echo "settig up a new account with password: $(cat $CONFIGDIR/parity-dev-password)"
  account=$($whichParity account new --password=$CONFIGDIR/parity-dev-password --chain=$CONFIGPATH)
  echo "created parity account: $account"
else
  tmp=${parityAccounts##*[}
  account="${tmp%%[,|\]]*}"
fi
echo "using account $account; giving you some KreditsChain ether"

replace="s/\".*\":{\"balance\"/\"$account\":{\"balance\"/g"
sed -i -e "s/\".*\":{\"balance\"/\"$account\":{\"balance\"/g" $CONFIGPATH

set -x
$whichParity --chain=$CONFIGPATH \
             --force-ui \
             --reseal-min-period 0 \
             --unlock=$account \
             --password=$CONFIGDIR/parity-dev-password \
             $@
set +x

echo "thanks for hacking on Kredits <3!"
