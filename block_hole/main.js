// A global object that can listen to property changes
window.wallpaperPropertyListener = {
    applyUserProperties: function(properties) {
        // Variables
        var vid = document.getElementById('bgvideo');
        var ovr = document.getElementById('overlay');
        var SpeedValue;
        var SpeedChckValue;
        var ColorValue;
        var ColorChckValue;
        //videospeed checkbox
        if (properties.videospeedchck){
            SpeedChckValue=properties.videospeedchck.value;
            if (SpeedChckValue==false){
                vid.playbackRate = 1;
            }
        }
        //videospeed slider
        if (properties.videospeed){
            SpeedValue = properties.videospeed.value;
            vid.playbackRate = SpeedValue;
        }
        //color checkbox
        if(properties.colorchck){
            ColorChckValue=properties.colorchck.value;
            if (ColorChckValue==false){
                ovr.style.backgroundColor='rgba(255,255,255,.0)';
            }
        }
        //color selector
        if(properties.color){
            if(ColorChckValue==true){
                ColorValue=properties.color.value.split(' ');
            ColorValue=ColorValue.map(function(c) {
                return Math.ceil(c * 255);
            });
            ovr.style.backgroundColor='rgba('+ColorValue+',.06)';
            }
        }
    }
};
