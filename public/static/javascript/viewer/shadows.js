'use strict';

var Shadows = function(player) {
    var self = this;
    self.props = {
        player: player.props
    };
};

Shadows.prototype.draw = function(context) {
    if (this.props.player.lastMoves.length > 9) {
        var offsetX = -50 * (this.props.player.z - this.props.player.minZ) / (this.props.player.maxZ - this.props.player.minZ);
        var offsetZ = this.props.player.minZ;
        var offsetY = (this.props.player.z * 1.5) - (offsetZ * 1.5);
        var alpha = .1;
        if (offsetY < 5) { return; }

        var tailX = 0 + offsetX;
        var tailY = this.props.player.lastMoves[0][1] + offsetY;
        var control1X = this.props.player.lastMoves[6][0] + offsetX;
        var control1Y = this.props.player.lastMoves[6][1] + offsetY;
        var control2X = this.props.player.lastMoves[7][0] + offsetX;
        var control2Y = this.props.player.lastMoves[7][1] + offsetY;
        var headX = 100 + this.props.player.lastMoves[9][0] + offsetX;
        var headY = this.props.player.lastMoves[9][1] + offsetY;
        context.lineWidth = offsetZ;

        var lingrad2 = context.createLinearGradient(0,0, (headX - context.lineWidth / 2),0);
        lingrad2.addColorStop(1, 'rgba(36,42,48,' + alpha + ')');
        lingrad2.addColorStop(0, 'rgba(36,42,48,0)');
        context.strokeStyle = lingrad2;
        context.lineCap = 'round';

        context.beginPath();
        context.moveTo(tailX, tailY);
        context.bezierCurveTo(control1X, control1Y, control2X, control2Y, headX, headY);
        context.stroke();
    }
};
