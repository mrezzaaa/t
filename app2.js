        function renderToMap(drivers){

            positions.push(new google.maps.LatLng(drivers.lat, drivers.long));


                var curMarker = new google.maps.Marker({
                    map: map,
                    position: new google.maps.LatLng(drivers.lat, drivers.long),
                    icon:"https://maps.google.com/mapfiles/kml/shapes/truck.png",
                    visible: false
                });
                map.panTo(new google.maps.LatLng(drivers.lat,drivers.long));
                markers.push(curMarker);
            
    
        }
        
        function displayMarker(markers, index, delay) {    
            if (index > 0)
                markers[index - 1].setVisible(false);
            else {
                markers[markers.length - 1].setVisible(false);
            }

            markers[index].setVisible(true);
            if (index < markers.length - 1) {
                setTimeout(function () {
                    displayMarker(markers, index + 1, delay);
                }, delay);
            } else {
                displayMarker(markers, 0, delay);
            }
        }

        
    });
    
    
      

});



 function buildMap() {
     var infoWindow = new google.maps.InfoWindow();
        map = new google.maps.Map(document.getElementById('map'), 
            {
        zoom: 15,
        center: new google.maps.LatLng(-6.248596, 106.843298),
        mapTypeId: google.maps.MapTypeId.ROADMAP
        });
     
        completeMap();
    searchBox.addListener('places_changed', function() {
          var places = searchBox.getPlaces();

          if (places.length == 0) {
            return;
          }

          // Clear out the old markers.
          
          markers.forEach(function(marker) {
           
          });
 
          markers = [];

          // For each place, get the icon, name and location.
          var bounds = new google.maps.LatLngBounds();
          places.forEach(function(place) {
            if (!place.geometry) {
              console.log("Returned place contains no geometry");
              return;
            }
           
            var icon = {
              url: place.icon,
              size: new google.maps.Size(71, 71),
              origin: new google.maps.Point(0, 0),
              anchor: new google.maps.Point(17, 34),
              scaledSize: new google.maps.Size(25, 25)
            };

            // Create a marker for each place.
            markers.push(new google.maps.Marker({
              map: map,
              icon: icon,
              title: place.name,
              position: place.geometry.location
            }).addListener("click",function(){
                var infowindow = new google.maps.InfoWindow({
                    content:place.name
                });
                infowindow.open(map,this);
            }));
//            
            if (place.geometry.viewport) {
              // Only geocodes have viewport.
              bounds.union(place.geometry.viewport);
            } else {
              bounds.extend(place.geometry.location);
            }
          });
          map.fitBounds(bounds);
           
        
        });
      

     
     var mapdiv = $("#map");
        google.maps.event.addListener(map, 'click', function(event) {
            var latlng = {lat:parseFloat(event.latLng.lat()),lng:parseFloat(event.latLng.lng())};
            console.log("Map clicked:",latlng);
            geocoders(latlng);
        });
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            console.log("Located at:",pos);
            infoWindow.setPosition(pos);
            infoWindow.setContent('Location found.');
            map.setCenter(pos);
          }, function() {
            handleLocationError(true, infoWindow, map.getCenter());
          });
        } else {
          // Browser doesn't support Geolocation
          handleLocationError(false, infoWindow, map.getCenter());
        }
      }
function locating(){
    var traffic = new google.maps.TrafficLayer();
    navigator.geolocation.getCurrentPosition(function(position){
        var cord = {lat: position.coords.latitude,lng:position.coords.longitude};
        var marker = new google.maps.Marker({
            position:cord,
            map:map,
            title:"Located"
            
        });
        var infowindow = new google.maps.InfoWindow({
          content: "Your location"
        });
        marker.addListener("click",function(){
            infowindow.open(map,marker);
        });
        traffic.setMap(map);
        map.setCenter(cord);
        console.log("Located at",position.coords);
        
    });
}

function geocoders(position){
    var geocoder = new google.maps.Geocoder();
    var latlng = {lat:position.lat,lng:position.lng};
    var content ="";
    geocoder.geocode({location:latlng},function(res,stat){
        if(stat =="OK"){
            console.log(res);
         res.forEach(function(data){
            if(data.types[2] == "point_of_interest"){
                content ="";
                content +='<strong>'+data.address_components[0].long_name+'</strong>';
            }
            else if(data.geometry.location_type =="ROOFTOP"){
                content += data.formatted_address + "<br/>";
            }
            var marker = new google.maps.Marker({
                position:latlng,
                map:map,
                title:data.address_components[0].long_name
            });
            var infowindow = new google.maps.InfoWindow({
                content :content
            });
            marker.addListener("click",function(){
               infowindow.open(map,marker); 
            });
            
         });
        }
    });
}
function handleLocationError(browserHasGeolocation, infoWindow, pos) {
        infoWindow.setPosition(pos);
        infoWindow.setContent(browserHasGeolocation ?
                              'Error: The Geolocation service failed.' :
                              'Error: Your browser doesn\'t support geolocation.');
      }


function completeMap(){
    
    var input = document.getElementById("address");
    var searchBox = new google.maps.places.SearchBox(input);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
    map.addListener('bounds_changed', function() {
        searchBox.setBounds(map.getBounds());
    });
    searchBox.addListener("places_changed",function(){
       var places = searchBox.getPlaces();
        if(places.length == 0) return;
        var bounds = new google.maps.LatLngBounds();
       
        places.forEach(function(place){
            if(!place.geometry) console.log("No geometry");
            markers.push(new google.maps.Marker({
                position:place.geometry.location,
                map:map,
                title:place.name
            }).addListener("click",function(){
                var infowindow = new google.maps.InfoWindow({
                    content : place.name 
                });
                infowindow.open(map,this);
            }));
            if (place.geometry.viewport) {
              // Only geocodes have viewport.
              bounds.union(place.geometry.viewport);
            } else {
              bounds.extend(place.geometry.location);
            }
        });
        map.fitBounds(bounds);
    });
}



