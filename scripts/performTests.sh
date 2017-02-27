#!/bin/bash

ARG=$D
if [ "$ARG" == "-D" ]; then
    DEBUG=1
fi

HOMEBRIDGE_BINARY="homebridge"
HOMEBRIDGE_SERVER_DIR="../"
HOMEBRIDGE_CONFIG="homebridge-test-config.json"

# You can set variables to own values by the command line when calling 'npm test':
# - 'HBB': Provide the full path to the 'homebridge' binary; otherwise make sure, that 'homebridge' is found by the shell.
# - 'HBS': Full path to the homebridge-server directory used for development.
# - 'HBC': If you have a special config file for homebridge, provide the full path (e.g. for local testing).
# Example:
# $ HBB="/Development/homebridge/bin/homebridge" HBS="/Development/homebridge-server/" HBC="local_conf.json" npm test
if [ $HBB ]; then
    HOMEBRIDGE_BINARY=$HBB
fi

if [ $HBS ]; then
    HOMEBRIDGE_SERVER_DIR=$HBS
fi

if [ $HBC ]; then
    HOMEBRIDGE_CONFIG=$HBC
fi


echo "Starting homebridge with test config..."
# Stop running homebridge instances
if pgrep homebridge; then
    echo "Killing other homebridge instance."
    killall homebridge
fi

TEST_CONFIG_DIR="/tmp/homebridge-server-test"

# Create config directory if not exists
if ! [ -d "$TEST_CONFIG_DIR/" ]; then
    mkdir "$TEST_CONFIG_DIR/"
    echo "Created test config dir: $TEST_CONFIG_DIR/"
fi

# Copy the config.json fixture
cp scripts/$HOMEBRIDGE_CONFIG "$TEST_CONFIG_DIR/config.json"

# Copy the log file fixture
cp scripts/test.log "$TEST_CONFIG_DIR/test.log"

# Set the directory if running on travis
if [ "$TRAVIS_BUILD_DIR" != "" ]; then
    echo "We're running on travis-ci! Setting HOMEBRIDGE_SERVER_DIR to $TRAVIS_BUILD_DIR"
    HOMEBRIDGE_SERVER_DIR=$TRAVIS_BUILD_DIR
fi

# Start homebridge
echo "Starting homebridge: $HOMEBRIDGE_BINARY -U $TEST_CONFIG_DIR -P $HOMEBRIDGE_SERVER_DIR"

if [ $DEBUG ]; then
    echo "... in DEBUG mode..."
    $HOMEBRIDGE_BINARY -U $TEST_CONFIG_DIR -P $HOMEBRIDGE_SERVER_DIR &
else
    echo "... in normal mode..."
    $HOMEBRIDGE_BINARY -U $TEST_CONFIG_DIR -P $HOMEBRIDGE_SERVER_DIR >/dev/null 2>&1 &
fi

# Give homebridge 2 seconds to be ready
echo "Waiting 2 seconds for homebridge to start..."
sleep 2

# Tests
echo "Testing:"
echo "========"

## original test:
## homebridge -U ~/.homebridge -P . > /dev/null 2>&1 & sleep 10; ( curl -Is http://127.0.0.1:8765/remove | head -1 ); kill $!

EXITCODE=0

echo "1) Lint"
echo "   *.js"
eslint ./*.js
EXITCODE=$(expr $EXITCODE + $?)

echo "   api/*.js"
eslint api/*.js
EXITCODE=$(expr $EXITCODE + $?)

echo "   api/routes/*.js"
eslint api/routes/*.js
EXITCODE=$(expr $EXITCODE + $?)

echo "   content/js/*.js"
eslint content/js/*.js
EXITCODE=$(expr $EXITCODE + $?)

echo "   test/*.js"
eslint test/*.js
EXITCODE=$(expr $EXITCODE + $?)


echo "2) mocha"
./node_modules/mocha/bin/mocha
EXITCODE=$(expr $EXITCODE + $?)


# Clean up
# Stop the homebridge instance
killall homebridge
rm -rf $TEST_CONFIG_DIR

exit $EXITCODE
