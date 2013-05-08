#!/bin/bash
CWD=`dirname $0`
TS=$(date +%d-%m-%Y_%H:%M)
TITLE="Multeor"
LOG=/var/log/multeor/multeor.log

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
JSPATH="$DIR/public/static/javascript"

if [[ $EUID -eq 0 ]]; then
    sudo -u multeor $0 $1
    exit
fi

case "$1" in
    start)
        echo "Starting $TITLE..."
	/usr/local/bin/node $CWD/server.js >> $LOG &
    ;;
    stop)
        echo "Stopping $TITLE..."
        killall -q node
    ;;
    restart)
       	$0 stop
       	$0 start
    ;;
    build)
        echo "Building $TITLE..."
        /usr/bin/java -jar $JSPATH/google-closure-javascript.jar --js $JSPATH/viewer/*.js --js_output_file=$JSPATH/viewer.min.js
        /usr/bin/java -jar $JSPATH/google-closure-javascript.jar --js $JSPATH/controller/*.js --js_output_file=$JSPATH/controller.min.js
        /usr/bin/java -jar $JSPATH/google-closure-javascript.jar --js $JSPATH/title-screen/*.js --js_output_file=$JSPATH/title-screen.min.js
        /var/lib/gems/1.8/bin/compass compile $DIR
    ;;
    *)
        echo "Usage: $0 {start|stop|restart|build}"
    ;;
esac

