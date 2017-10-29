function newObj(o) {
    var params = Array.prototype.slice.call(arguments,1);
    function F() {}
    F.prototype = o;
    var obj = new F();
    if(params.length) {
        obj.init.apply(obj,params);
    }
    return obj;
}

var OwnMarker = function() {
    var proto  = new google.maps.Marker();

    proto.init = function (data) {
        this.setPosition(new google.maps.LatLng(parseFloat(data.lat), parseFloat(data.lng)));
    }
    return proto;

}();
