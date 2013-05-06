#!/bin/bash
CWD=`dirname $0`
TS=$(date +%d-%m-%Y_%H:%M)
TITLE="Multeor Server"
LOG=/var/log/multeor/multeor.log

if [[ $EUID -eq 0 ]]; then
    sudo -u multeor $0 $1
    exit
fi

case "$1" in
    start)
        echo "Starting $TITLE"
	/usr/local/bin/node $CWD/multeor.js >> $LOG &
    ;;
    stop)
        echo "Stopping $TITLE"
        killall -q node
    ;;
    restart)
       	$0 stop
       	$0 start
    ;;
    *)
        echo "Usage: $0 {start|stop|restart}"
    ;;
esac

