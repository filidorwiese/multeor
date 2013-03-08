var House = function(url){
    var self = this;
    this.props = {
            image: false,
            width: 0,
            height: 0,
            loaded: false,
            x: 500,
            y: 0,
            z: 100
        };
    
    var image = new Image();
    image.src = url;
    image.onload = function(){
        self.props.image = this;
        self.props.width = this.width;
        self.props.height = this.height;
        self.props.loaded = true;
    };
    image.onerror = function(){
        throw 'image not found';
    };

    // TODO: verdiepingen plaatjes inladen
}

House.prototype.draw = function(context) {
    if (this.props.loaded) {
        context.drawImage(this.props.image, this.props.x, this.props.y);

        // TODO: teken open floors
        // rect met kleur spook ter grootte van verdieping
        // plaatje verdieping erover heen
    }
};
