var Player = function(){
    this.props = {
        x: 280,
        y: 230,
        z: 0,
        color: [],
        lastMoves: []
    };
}

Player.prototype.draw = function(context) {
    if (this.props.lastMoves.length > 9) {
        var tailX = 0;
        var tailY = this.props.lastMoves[0][1];
        var control1X = this.props.lastMoves[6][0];
        var control1Y = this.props.lastMoves[6][1];
        var control2X = this.props.lastMoves[7][0];
        var control2Y = this.props.lastMoves[7][1];
        var headX = 100 + this.props.lastMoves[9][0];
        var headY = this.props.lastMoves[9][1];
        context.lineWidth = this.props.z;
        
        var lingrad2 = context.createLinearGradient(0,0, (headX - context.lineWidth / 2),0);
        lingrad2.addColorStop(1, 'rgba(' + this.props.color[0] + ',' + this.props.color[1] + ',' + this.props.color[2] + ',0.8)');
        lingrad2.addColorStop(0, 'rgba(0,0,0,0)');
        context.strokeStyle = lingrad2;
        //context.strokeStyle = 'rgba('+this.props.color[0]+','+this.props.color[1]+','+this.props.color[2]+', 1)';
        context.lineCap = 'round';

        context.beginPath();
        context.moveTo(tailX, tailY);
        context.bezierCurveTo(control1X, control1Y, control2X, control2Y, headX, headY);
        context.stroke();

        // TODO: emotie sprite inladen, tekenen en schalen
    }    
};
