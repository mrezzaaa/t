
function CustomMarker(latlng,map,args){
  this.latlng = latlng;
	this.args = args;
	this.setMap(map);
}
CustomMarker.prototype = new google.maps.OverlayView();

CustomMarker.prototype.draw = function() {

	var self = this;
  var img = this.img;
	var div = this.div;
  var circle = this.circle;
	if (!div) {
    // <svg height="100" width="100">
    //   <circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" />
    // </svg>
		div = this.div = document.createElement('div');
		div.className = 'marker';
		div.style.position = 'absolute';
		div.style.cursor = 'pointer';
		div.style.width = '12px';
		div.style.height = '12px';
    div.style.margin = "-5px";
    $(div).css({"border-radius":"100%"});
    if(this.args.icon !=null){
      var img = document.createElement("img");
      img.setAttribute("src",this.args.icon.url);
      img.style.width = "16px";
      img.style.height = "32px";
      img.style.position = "absolute";
      img.style.margin = "-5px";
      img.className = 'marker';
      img.style.transform = "rotate("+this.args.icon.rotation+"deg)";
      this.div.appendChild(img);
    }
    if(this.args.marker_id == "My Location"){
      $(div).css("background","white");
      $(div).css({"border":"3px solid blue"});
      $(div).removeClass("pulseoffline pulseonduty");
      $(div).addClass("pulseposition");
    }
    if(this.args.status == "online"){
      $(div).removeClass("pulseoffline pulseonduty");
      $(div).addClass("pulse");
      $(div).css({"border":"none"});
    }
    else if(this.args.status=='userlocation'){
      $(div).addClass("pulseposition");
      $(div).css({"border":"3px solid red"});
    }
    else if(this.args.status=='onduty'){
      $(div).removeClass("pulseoffline pulse");
      $(div).addClass("pulseonduty");
    }
    else{
      $(div).removeClass("pulse pulseonduty");
      $(div).addClass("pulseoffline");
      $(div).css({"border":"none"});
    }

    // circle = this.circle = document.createElement("circle");
    // circle.setAttribute("cx","50");
    // circle.setAttribute("cy","50");
    // circle.setAttribute("r","40");
    // circle.setAttribute("stroke","black");
    // circle.setAttribute("stroke-width","3");
    // circle.setAttribute("fill","skyblue");
    // this.div.appendChild(circle);
		if (typeof(self.args.marker_id) !== 'undefined') {
			div.dataset.marker_id = self.args.marker_id;
		}

		google.maps.event.addDomListener(div, "click", function(event) {
			google.maps.event.trigger(self, "click");
		});

		var panes = this.getPanes();
		panes.overlayImage.appendChild(div);
	}

	var point = this.getProjection().fromLatLngToDivPixel(this.latlng);

	if (point) {
		div.style.left = point.x + 'px';
		div.style.top = point.y + 'px';
	}
};

CustomMarker.prototype.remove = function() {
	if (this.div) {
		this.div.parentNode.removeChild(this.div);
		this.div = null;
	}
};
var numDeltas = 50;
var delay = 10; //milliseconds
var j = 0;
var deltaLat;
var deltaLng;
var position =[];
CustomMarker.prototype.setPosition = function(latlng){
    this.latlng = latlng;
    this.setMap(map);
}
CustomMarker.prototype.setStatus = function(str){
  this.args.status=str;
  // this.setMap(map);
}

CustomMarker.prototype.setIcon = function(icon){
  this.args.icon = icon;
  this.setMap(map);
}
CustomMarker.prototype.getPosition = function() {
	return this.latlng;
};

// function transition(result){
//       i = 0;
//       deltaLat = (result[0] - position[0])/numDeltas;
//       deltaLng = (result[1] - position[1])/numDeltas;
//       moveMarker();
//   }
//
//   function moveMarker(){
//       position[0] += deltaLat;
//       position[1] += deltaLng;
//       var latlng = new google.maps.LatLng(position[0], position[1]);
//       marker.setPosition(latlng);
//       if(i!=numDeltas){
//           i++;
//           setTimeout(moveMarker, delay);
//       }
//   }
