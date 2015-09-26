/**
 * Canvas profiler
 * http://active.tutsplus.com/tutorials/animation/html5-canvas-optimization-a-practical-example/
 */
profiler = {
    context: false,
    speedLog: [],
    frameCount: 0,
    frameStartTime: 0,
    fpsLog: [],
    paintCountLog: [],
    lastPaintCount: 0,
    target: 15,
    x: 0,
    y: 0,
    graphScale: 0.25,

    start: function (context, target, x, y, graphScale) {
        if (window.mozPaintCount) {
            profiler.lastPaintCount = window.mozPaintCount;
        }

        profiler.context = context;
        profiler.x = x;
        profiler.y = y;
        profiler.graphScale = graphScale;
        profiler.target = target;
        setTimeout(profiler.getStats, 1000);
    },

    tick: function () {
        var now = new Date().getTime();
        if (profiler.frameStartTime) {
            profiler.speedLog.push(now - profiler.frameStartTime);
        }
        profiler.frameStartTime = now;
        profiler.frameCount++;
        profiler.drawStats();
    },

    getStats: function () {
        if (window.mozPaintCount) { //this property is specific to firefox, and tracks how many times the browser has rendered the window since the document was loaded
            profiler.paintCountLog.push(window.mozPaintCount - profiler.lastPaintCount);
            profiler.lastPaintCount = window.mozPaintCount;
        }

        profiler.fpsLog.push(profiler.frameCount);
        profiler.frameCount = 0;
    },

    drawStats: function (average) {
        var x = profiler.x, y = profiler.y;

        profiler.context.save();
        profiler.context.font = "normal 10px monospace";
        profiler.context.textAlign = 'left';
        profiler.context.textBaseLine = 'top';
        profiler.context.fillStyle = 'black';
        profiler.context.fillRect(x, y - 10, 120, 85);

        //draw the x and y axis lines of the graph
        y += 30;
        x += 10;
        profiler.context.beginPath();
        profiler.context.strokeStyle = '#888';
        profiler.context.lineWidth = 1.5;
        profiler.context.moveTo(x, y);
        profiler.context.lineTo(x + 100, y);
        profiler.context.stroke();
        profiler.context.moveTo(x, y);
        profiler.context.lineTo(x, y - 25);
        profiler.context.stroke();

        // draw the last 50 speedLog entries on the graph
        profiler.context.strokeStyle = '#00ffff';
        profiler.context.fillStyle = '#00ffff';
        profiler.context.lineWidth = 0.3;
        var imax = profiler.speedLog.length;
        var i = ( profiler.speedLog.length > 50 ) ? profiler.speedLog.length - 50 : 0
        profiler.context.beginPath();
        for (var j = 0; i < imax; i++, j += 2) {
            profiler.context.moveTo(x + j, y);
            profiler.context.lineTo(x + j, y - profiler.speedLog[i] * profiler.graphScale);
            profiler.context.stroke();
        }

        // the red line, marking the desired maximum rendering time
        profiler.context.beginPath();
        profiler.context.strokeStyle = '#FF0000';
        profiler.context.lineWidth = 1;
        var target = y - profiler.target * profiler.graphScale;
        profiler.context.moveTo(x, target);
        profiler.context.lineTo(x + 100, target);
        profiler.context.stroke();

        // current/average speedLog items
        y += 12;
        if (average) {
            var speed = 0;
            for (i in profiler.speedLog) {
                speed += profiler.speedLog[i];
            }
            speed = Math.floor(speed / profiler.speedLog.length * 10) / 10;
        } else {
            speed = profiler.speedLog[profiler.speedLog.length - 1];
        }
        profiler.context.fillText('Render Time: ' + speed, x, y);

        // canvas fps
        profiler.context.fillStyle = '#00ff00';
        y += 12;
        if (average) {
            fps = 0;
            for (i in profiler.fpsLog) {
                fps += profiler.fpsLog[i];
            }
            fps = Math.floor(fps / profiler.fpsLog.length * 10) / 10;
        } else {
            fps = profiler.fpsLog[profiler.fpsLog.length - 1];
        }
        profiler.context.fillText(' Canvas FPS: ' + fps, x, y);

        // browser frames per second (fps), using window.mozPaintCount (firefox only)
        if (window.mozPaintCount) {
            y += 12;
            if (average) {
                fps = 0;
                for (i in profiler.paintCountLog) {
                    fps += profiler.paintCountLog[i];
                }
                fps = Math.floor(fps / profiler.paintCountLog.length * 10) / 10;
            } else {
                fps = profiler.paintCountLog[profiler.paintCountLog.length - 1];
            }
            profiler.context.fillText('Browser FPS: ' + fps, x, y);
        }

        profiler.context.restore();
    }
}