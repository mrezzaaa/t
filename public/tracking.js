var map ;
var markers = [];
var startPos = [];
var delay = 10;
var oldpos = [];
var popup = [];
var infowindow= [];
var overlay =[];
var layer ;
var layers = [];

var car = "M17.402,0H5.643C2.526,0,0,3.467,0,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759c3.116,0,5.644-2.527,5.644-5.644 V6.584C23.044,3.467,20.518,0,17.402,0z M22.057,14.188v11.665l-2.729,0.351v-4.806L22.057,14.188z M20.625,10.773 c-1.016,3.9-2.219,8.51-2.219,8.51H4.638l-2.222-8.51C2.417,10.773,11.3,7.755,20.625,10.773z M3.748,21.713v4.492l-2.73-0.349 V14.502L3.748,21.713z M1.018,37.938V27.579l2.73,0.343v8.196L1.018,37.938z M2.575,40.882l2.218-3.336h13.771l2.219,3.336H2.575z M19.328,35.805v-7.872l2.729-0.355v10.048L19.328,35.805z";
var markerloaded = false;
var marker ;
var toggleTraffic = false;

var app = angular.module("Logisthink",['ngMaterial']).config(function($mdThemingProvider) {
  var white = $mdThemingProvider.extendPalette("red",{
    "50":"ffffff",
    "contrastDefaultColor":"dark"
  });
  $mdThemingProvider.definePalette("white",white);
  $mdThemingProvider.theme('default')
    .primaryPalette('red',{
      "hue-1":"50"
    })
    .accentPalette('pink');
});
var menu = "hide";
app.controller('MyController', function($scope,$mdSidenav) {

});
app.controller("AppData",function($scope){

});


app.controller("SheetController",function($scope,$rootScope,$mdDialog,$mdBottomSheet,$mdToast){
  console.log("Sheet control");
});




app.controller("Tracking",function($scope,$rootScope,$mdDialog,$mdBottomSheet,$mdToast){
  $scope.orderid = window.location.pathname.split("/")[2];
  $scope.apps = function(){
    $mdBottomSheet.show({
      template: `
                <md-bottom-sheet class="md-list md-has-header">
                <img ng-src="https://disinilo.com/directory/wp-content/uploads/2015/05/MITA10-LOGO.jpg" style="width:30%;position: absolute;right: 10px;top: 10px;"/>
                <md-subheader ng-cloak>Detail Driver</md-subheader>
                <md-list ng-cloak>
                    <md-list-item class="md-3-line">
                      <img ng-src="{{driverdetail.more.img_url}}" class="md-avatar" />
                      <div class="md-list-item-text" layout="column">
                        <h3>{{driverdetail.detail.name}}</h3>
                        <small>
                          <a href="tel:{{driverdetail.more.phone}}">{{driverdetail.more.phone}}</a>
                        </small>
                        <small>
                          {{driverdetail.detail.status}} - {{driverdetail.detail.timestamp}}
                        </small>
                      </div>
                    </md-list-item>
                </md-list>
                <md-subheader ng-cloak>Detail Kendaraan</md-subheader>
                <md-list ng-cloak>
                  <md-list-item class="md-3-line">
                    <md-icon class="material-icons" style="font-size:40px; ">local_shipping</md-icon>
                    <div class="md-list-item-text">
                      <h3> {{detail.vehicle_id}}</h3>
                      <h4> {{detail.vehicle_type}}</h4>
                      <h4> Job diterima :{{ detail.verification_accept_job_time}}</h4>
                    </div>
                  </md-list-item>
                </md-list>

                <label> Powered by &copy; <a href="http://insthink.co.id/">Insthink</a></label>
              </md-bottom-sheet>
                `,
      controller: 'SheetController'
    });
  };

  $scope.locating =  function(){
    navigator.geolocation.getCurrentPosition(function(position){
        var coords = {lat:position.coords.latitude,lng:position.coords.longitude};
        var infowindow = new google.maps.InfoWindow({
            content : "Your Location"
        });
        var icon = "https://material.io/icons/static/images/icons-180x180.png";
        icon = {
                url :icon,
                size: new google.maps.Size(32, 32),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(8,16),
                scaledSize: new google.maps.Size(32,32)
            };
            var mylat = new google.maps.LatLng(coords.lat,coords.lng);

            var custom = new CustomMarker(mylat,map,{marker_id:"My Location",status:"userposition"});
            google.maps.event.addListener(custom,"click",function(){
              infowindow.open(map,custom);
            });
            // console.log(custom);
        // var marker = new google.maps.Marker({
        //     position:coords,
        //     map:map,
        //     icon:icon,
        //     optimized:false,
        //     title:"Your location"
        // }).addListener("click",function(){
        //     infowindow.open(map,marker);
        // });
       var overlay = new google.maps.OverlayView();
        overlay.draw  = function(){
            this.getPanes().markerLayer.id = "markerLayer";

          //  var shadow = document.createElement("div");
          //  shadow.setAttribute("class","shadow");
          //  var pulse = document.createElement("div");
          //  pulse.setAttribute("class","pulse");
          //  var pinw = document.createElement("div");
          //  pinw.setAttribute("class","pin-wrap");
          //  var pin = document.createElement("div");
          //  pin.setAttribute("class","pin");
          //  var div = document.createElement("div");
          //  div.appendChild(shadow);
          //  div.appendChild(pulse);
          //  div.appendChild(pinw);
          //  div.appendChild(pin);
          //  this.getPanes().markerLayer.appendChild(div);

        };


        overlay.setMap(map);

        map.setZoom(15);
        map.setCenter(coords);
        $("#content").html("Located");
        console.log("located");
        //markers.push(custom);
    });

  };
  $scope.track = function(){
    var infowindow = new google.maps.InfoWindow;
   var data = {orderid:$scope.orderid};
   socket.emit("order:tracking",data,function(err,result,result2,result3){
     if(err){
       if(Object.keys(result).length == 0){
          return $mdDialog.show(
              $mdDialog.alert()
             .title("Error")
             .textContent("Tracking untuk order id:"+$scope.orderid+ " sudah tidak dapat dilacak,mungkin paket sudah sampai/gagal dikirim oleh vendor")
             .clickOutsideToClose(false)
             .ariaLabel("Error")
             .ok("Close")
         );

       }
     }
     else{

       if(Object.keys(result).length == 0){
          return $mdDialog.show(
           $mdDialog.alert()
             .title("Error")
             .textContent("Tracking untuk order id: "+$scope.orderid+ " sudah tidak dapat dilacak,mungkin paket sudah sampai/gagal dikirim oleh vendor")
             .clickOutsideToClose(false)
             .ariaLabel("Error")
             .ok("Close")
         );

       }
       else if(result.status == "completed"){
         return $mdDialog.show(
          $mdDialog.alert()
            .title("Oops !")
            .textContent("Barang yang sudah sampai tidak dapat di lacak lagi")
            .clickOutsideToClose(false)
            .ariaLabel("Error")
            .ok("Close")
        );
       }
       else if(result.status =="Not Found"){
         return $mdDialog.show(
          $mdDialog.alert()
            .title(result.status)
            .textContent("Tampaknya order id yang anda masukan tidak terdaftar pada sistem kami.Mohon cek kembali")
            .clickOutsideToClose(false)
            .ariaLabel("Error")
            .ok("Close")
        );
       }

       $rootScope.detail = result2[0];
       $rootScope.detail.verification_accept_job_time = moment($rootScope.detail.verification_accept_job_time * 1000).format('lll');
       socket.emit("driver:getdetail",{driverid:result[0].driver_id},function(err,response){
         if(err){
           $mdToast.show(
             $mdToast.simple()
             .textContent("Gagal mendapatkan driver detail")
             .position("top right")
             .hideDelay(5000)
           );
         }
         else{

           $rootScope.driverdetail = {detail:result[0],more: response};
           $rootScope.driverdetail.detail.timestamp = moment(data.timestamp * 1000).fromNow();

         }
       });
       $rootScope.orderdata = result3.orderdata;
       var x= 0;
       result3.orderdata.forEach(function(d){
          x++;
          var latlng = new google.maps.LatLng(d.delivery_lat,d.delivery_lng);
          var marker = new google.maps.Marker({
            position:latlng,
            map:map,
            label:{
              text: x.toString(),
              color:"white",
              fontWeight:"800",
              fontSize:"14"
            }
          });
          var info = new google.maps.InfoWindow({
            content :`<label>`+d.delivery_address+`</label>`
          });
          google.maps.event.addListener(marker,"click",function(){
            info.open(map,this);
          });
       });
       var data = result[0];
       if(markerloaded == false){
         var icon = {
           path: car,
           scale: .7,
           strokeColor: '#333',
           strokeWeight: 1,
           fillOpacity: 1,
           fillColor: '#fff',
           offset: '0%',
           rotation: 0,
           id:"pulse",
           anchor: new google.maps.Point(10, 25) // orig 10,50 back of car, 10,0 front of car, 10,25 center of car
         };
         var latlng = new google.maps.LatLng(result[0].lat,result[0].lng);

         overlay[data.name]=new google.maps.Marker({
           position :latlng,
           map:map,
           icon:icon,
           label:{
             text:data.vehicle_id,
             color:"tomato",
             fontWeight:"800",
             fontSize:"10"
           },
           status:data.status
         });
         layer = new CustomMarker(latlng,map,{"marker_id":data.vehicle_id,"status":data.status});
         layers[data.name] = layer;
         position[data.vehicle_id] = [data.lat,data.lng];
          neutralize();
          markerloaded = true;
          oldpos = [data.lat,data.lng];
          map.setZoom(15);
          map.setCenter(latlng);
          markers.push(marker);
          var info = '<b>'+data.name+'</b> - ';
          info += '<b>'+data.vehicle_id+'</b><br/>';
          info += '<small>'+data.status+'</small>';
          infowindow[data.vehicle_id] = new google.maps.InfoWindow({
            content:popup[data.vehicle_id]
          });
     }
   }



   });
   moment.locale('id');
   socket.on("tracking:data",function(data){
     var numDeltas = 1000;
     var delay = 100; //milliseconds
     var i = 0;
     var deltaLat;
     var deltaLng;
     var newpos = [data.lat,data.lng];
      $rootScope.driverdetail.detail = data;
      $rootScope.driverdetail.detail.timestamp = moment(data.timestamp * 1000).fromNow();
     var latlng = {lat:parseFloat(data.lat),lng:parseFloat(data.lng)};
     var mylat = new google.maps.LatLng(latlng.lat,latlng.lng);
     var newpos = [data.lat,data.lng];

     // console.log(map.getZoom());
     if(markerloaded == false){
       // var icon = "truck-top.svg";
       // overlay = new CustomMarker(mylat,map,{marker_id:data.name});
       position[data.vehicle_id] = [data.lat,data.lng];
       overlay[data.name]=new google.maps.Marker({
         position :latlng,
         map:map,
         icon:icon,
         label:{
           text:data.vehicle_id,
           color:"darkgray",
           fontWeight:"800",
           fontSize:"10"
         },
         status:data.status
       });
       layer = new CustomMarker(mylat,map,{"marker_id":data.vehicle_id,"status":data.status});
       layers[data.name] = layer;
      //  map.setZoom(15);
      //  map.setCenter(latlng);
       position[data.vehicle_id] = [data.lat,data.lng];
           popup[data.vehicle_id] = '<div><b>'+data.name+'</b><br/>';
           popup[data.vehicle_id] += '<i class="material-icons mapicon">local_shipping</i> :'+data.vehicle_id+'<br/>';
           popup[data.vehicle_id] += '<i class="material-icons mapicon">visibility</i> : '+data.status+'<br/>';
           popup[data.vehicle_id] += '<i class="material-icons mapicon">location_city</i> : '+data.provider_id  +'<br/>';
           popup[data.vehicle_id] += '<i class="material-icons mapicon">person_pin_circle</i> : '+data.lat+','+data.lng+'<br/>';
           infowindow[data.vehicle_id] = new google.maps.InfoWindow({
             content:popup[data.vehicle_id]
           });
       google.maps.event.addListener(overlay[data.name],"click",function(){
            //  map.panTo(overlay[data.name].position);
            //  map.setZoom(15);
             infowindow[data.vehicle_id].close();
             infowindow[data.vehicle_id].open(map,this);
       });
       markerloaded = true;

     }
     else{
       popup[data.vehicle_id] = '<div><b>'+data.name+'</b><br/>';
       popup[data.vehicle_id] += '<i class="material-icons mapicon">local_shipping</i> :'+data.vehicle_id+'<br/>';
       popup[data.vehicle_id] += '<i class="material-icons mapicon">visibility</i> : '+data.status+'<br/>';
       popup[data.vehicle_id] += '<i class="material-icons mapicon">location_city</i> : '+data.provider_id  +'<br/>';
       popup[data.vehicle_id] += '<i class="material-icons mapicon">person_pin_circle</i> : '+data.lat+','+data.lng+'<br/>';
       infowindow[data.vehicle_id].setContent(popup[data.vehicle_id]);
       var numDeltas = 100;
       var delay = 1; //milliseconds
       var i = 0;
       var deltaLat;
       var deltaLng;
       function transition(result){
           i = 0;
           var from = new google.maps.LatLng(position[data.vehicle_id][0],position[data.vehicle_id][1]);
           var to = new google.maps.LatLng(result[0],result[1]);
           var heading =  google.maps.geometry.spherical.computeHeading(from, to);
           $("div.marker[data-marker_id='"+data.vehicle_id+"']").removeClass("pulse pulseonduty pulseoffline");
           $("div.marker[data-marker_id='"+data.vehicle_id+"']").addClass(data.status=="online"?"pulse":"pulse"+data.status);
           if(heading == 0){

           }
           else{
             overlay[data.name].icon.rotation = heading;
             var latlng = new google.maps.LatLng(position[data.vehicle_id][0], position[data.vehicle_id][1]);
            //  map.setZoom(15);
            //  map.setCenter(latlng);
           }
           overlay[data.name].setIcon(overlay[data.name].icon);
           deltaLat = (result[0] - position[data.vehicle_id][0])/numDeltas;
           deltaLng = (result[1] - position[data.vehicle_id][1])/numDeltas;
           moveMarker(overlay);
       }

       function moveMarker(){
           position[data.vehicle_id][0] += deltaLat;
           position[data.vehicle_id][1] += deltaLng;
           var latlng = new google.maps.LatLng(position[data.vehicle_id][0], position[data.vehicle_id][1]);
           overlay[data.name].setPosition(latlng);
           layers[data.name].setPosition(latlng);
           layers[data.name].setStatus(data.status);

           if(i!=numDeltas){
               i++;
               setTimeout(moveMarker, delay);
           }
           if(i==numDeltas){
             position[data.vehicle_id] =[data.lat, data.lng];
             return position;

           }
       }



       transition(newpos);



     }


   });
 };
 $scope.checkEnter = function($event){
   var keyCode = $event.which || $event.keyCode;
   if (keyCode === 13) {
       $scope.track($event);
   }

 };
});

$(document).ready(function(){
  socket.on("connect",function(){

  });
  $("#traffic").on("click",function(){
      if(toggleTraffic == true){
          traffic.setMap(null);
          toggleTraffic = false;
      }
      else{
          traffic = new google.maps.TrafficLayer();
          traffic.setMap(map);
          toggleTraffic = true;
      }
  });



});


function buildMap(){
    var mapcanvas = document.getElementById("map");
    map = new google.maps.Map(mapcanvas,{
              zoom:7,
              center:new google.maps.LatLng(-6.248596, 106.843298),
              mapTypeId:google.maps.MapTypeId.ROADMAP
            });
  var trafficbutton = document.getElementById("traffic");
  var apps = document.getElementById("apps");
  var locate = document.getElementById("locate");
  map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(trafficbutton);
  map.controls[google.maps.ControlPosition.LEFT_TOP].push(apps);
  map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(locate);

}

function neutralize(){
    for(var i=0;i<markers.length;i++){
        try{
            markers[i].f.setMap(null);
        }
        catch(err){
            markers[i].setMap(null);
        }
    }
    markers = [];
}
