#!/usr/bin/env bash
CWD=`dirname $0`
TS=$(date +%d-%m-%Y_%H:%M)
TITLE="Multeor"
LOG=$CWD/logs/multeor.log
ERRLOG=$CWD/logs/multeor.error

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
JSPATH="$DIR/public/static/javascript"

case "$1" in
    start)
        echo "Starting $TITLE..."
        /usr/bin/env node $CWD/server.js
    ;;
    stop)
        echo "Stopping $TITLE..."
        $CWD/node_modules/forever/bin/forever stop $CWD/server.js
    ;;
    restart)
        $0 stop
        $0 start
    ;;
    build)
        echo "Building $TITLE..."
        /usr/bin/env java -jar $JSPATH/google-closure-javascript.jar --js $JSPATH/viewer/*.js --js_output_file=$JSPATH/viewer.min.js
        /usr/bin/env java -jar $JSPATH/google-closure-javascript.jar --js $JSPATH/controller/*.js --js_output_file=$JSPATH/controller.min.js
        /usr/bin/env java -jar $JSPATH/google-closure-javascript.jar --js $JSPATH/title-screen/*.js --js_output_file=$JSPATH/title-screen.min.js
        /usr/bin/env java -jar $JSPATH/google-closure-javascript.jar --js $JSPATH/about/*.js --js_output_file=$JSPATH/about.min.js
        /usr/bin/env compass compile $DIR
    ;;
    *)
        echo "Usage: $0 {start|stop|restart|build}"
    ;;
esac

