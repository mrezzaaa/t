var iconloaded = false;
var overlay ;
var layer ;
var watcher;
var trafficlayer ;
var toggleTraffic =false;
var position = [];
var markers = [];
var fcm = "";
var usermarker;
var config = {
    apiKey: "AIzaSyBd7mfA2fhuVL0X23OPk9_a6rCHh0aGLG8",
    authDomain: "logisthink-160709.firebaseapp.com",
    databaseURL: "https://logisthink-160709.firebaseio.com",
    projectId: "logisthink-160709",
    storageBucket: "logisthink-160709.appspot.com",
    messagingSenderId: "572717046295"
  };
  firebase.initializeApp(config);
const messaging = firebase.messaging();
moment.locale('id');
var maptheme = [
    {
        "featureType": "all",
        "elementType": "all",
        "stylers": [
            {
                "invert_lightness": true
            },
            {
                "saturation": 10
            },
            {
                "lightness": 30
            },
            {
                "gamma": 0.5
            },
            {
                "hue": "#435158"
            }
        ]
    },
    {
        "featureType": "road.arterial",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "saturation": "-21"
            },
            {
                "color": "#0b646e"
            }
        ]
    },
    {
        "featureType": "road.arterial",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "lightness": "100"
            }
        ]
    },
    {
        "featureType": "road.local",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "lightness": "21"
            }
        ]
    },
    {
        "featureType": "road.local",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "lightness": "32"
            }
        ]
    }
];
var car = "M17.402,0H5.643C2.526,0,0,3.467,0,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759c3.116,0,5.644-2.527,5.644-5.644 V6.584C23.044,3.467,20.518,0,17.402,0z M22.057,14.188v11.665l-2.729,0.351v-4.806L22.057,14.188z M20.625,10.773 c-1.016,3.9-2.219,8.51-2.219,8.51H4.638l-2.222-8.51C2.417,10.773,11.3,7.755,20.625,10.773z M3.748,21.713v4.492l-2.73-0.349 V14.502L3.748,21.713z M1.018,37.938V27.579l2.73,0.343v8.196L1.018,37.938z M2.575,40.882l2.218-3.336h13.771l2.219,3.336H2.575z M19.328,35.805v-7.872l2.729-0.355v10.048L19.328,35.805z";
moment.locale('id');
var map;
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
    $mdThemingProvider.theme('dark-grey').primaryPalette("grey").backgroundPalette('grey').dark();
    $mdThemingProvider.theme('dark-orange').backgroundPalette('orange');
    $mdThemingProvider.theme('dark-purple').backgroundPalette('deep-purple').dark();
    $mdThemingProvider.theme('dark-blue').backgroundPalette('blue').dark();

});
var menu = "hide";
app.controller("driverController",function($scope,$mdDialog,$mdToast,$rootScope,$timeout,$mdBottomSheet){

  $scope.socketing = function(){
    socket.emit("newchat",{channel:getCookie('providerid')+":"+getCookie("driverid")},function(err,res){
      $scope.channelid = res.channelid;
      setCookie("channelid",$scope.channelid,7);
      socket.emit("join:channel",{channel:getCookie('driverid'),name:getCookie('drivername'),channelid:getCookie("channelid")},function(err,result){
        console.log("Join channel",err,result);
      });
    });

  };

  ///////// declare here
  var order = [];
  var pickup = [];
  var delivery = [];
  var usermarker;
  var icon = {
    path: car,
    scale: .7,
    strokeColor: 'black',
    strokeWeight: .50,
    fillOpacity: 1,
    fillColor: '#ffffff',
    offset: '0%',
    rotation: 0,
    id:"pulse",
    anchor: new google.maps.Point(10, 25) // orig 10,50 back of car, 10,0 front of car, 10,25 center of car

  };
  // var icon = {
  //   url:"images/engkel.png#mobil",
  //   scaledSize:new google.maps.Size(16,32),
  //   anchor:new google.maps.Point(0,16),
  //
  // }

  ///////////////
  socket.on("vehicle:update",function(data){
    console.log("Data vehicle updated !",data);
    setCookie("vehicleid",data.licenseplate,7);
  });
  $scope.switchList= function(){
    if($scope.userconnection == 'online'){
    socket.emit("assignment:get:list",{driver_id:getCookie("driverid")},function(err,result){
      $timeout(function(){
          delete result["$$hashKey"];
          result.forEach(function(ress){
            ress.pickup_date = moment.unix(ress.pickup_date).format("LLLL");
            ress.pickup_late = moment.unix(ress.pickup_late).format("LLLL");
          });
        $rootScope.joblist = result;
        $rootScope.$digest();
      },1000);
      $(".tasklist").css({"display":"block"});
      $(".map-container").css({"display":"none"});
    });
    }
    else{
      $rootScope.joblist = null;
      $mdToast.show(
        $mdToast.simple("You must be online to get joblist").position("top").hideDelay(3000)
      );
    }

  };


  /// Chat section
  $scope.openChat = function(){
    console.log("Open chat");
    socket.emit("newchat",{channel:getCookie('providerid')+":"+getCookie('driverid')},function(err,results){
      $scope.channelid = results.channelid;
      console.log($scope.channelid);
    });
    $mdDialog.show({
      controller: 'driverController',
      templateUrl: 'chat',
      parent: angular.element(document.body),
      clickOutsideToClose:true,
      fullscreen: true // Only for -xs, -sm breakpoints.
    });
    var room = getCookie('providerid')+":"+getCookie('driverid');
    socket.emit("getConversation",room,function(err,res){
      var list = "";
      res.forEach(function(data){
        if(data.from == getCookie('drivername')){
          list += '<md-list-item class="right-list chatbubble"><p>'+data.message+'</p><small style="font-size:10px;display:block;position:absolute;bottom:0px;">'+data.timestamp+'</small></md-list-item>';
        }
        else{
          list += '<md-list-item class="left-list chatbubble"><p>'+data.message+'</p><small style="font-size:10px;display:block;position:absolute;bottom:0px;">'+data.timestamp+'</small></md-list-item>';
        }
      });
      $(".chatcontent").html(list);
      $(".chatcontent").scrollTop(99999);
    });
  };

  $scope.sendMsg = function(){
    var msg = $scope.msgbox;
    if(msg == ""){
    }
    else{
      var timestamp = new Date();
      var list = '';
      var data = {channelid:getCookie("channelid"),channel:getCookie('providerid')+":"+getCookie("driverid"),from:getCookie('drivername'),message:msg,timestamp: new moment().format('LLLL')};
      socket.emit("sendchat",data,function(err,res){
        if(err){

        }
        else{
        list += '<md-list-item class="right-list chatbubble"><p>'+data.message+'</p><small style="font-size:10px;display:block;position:absolute;bottom:0px;">'+data.timestamp+'</small></md-list-item>';
        $(".chatcontent").append(list);
        $(".msgbox").val("");
        $(".chatcontent").scrollTop(99999);

        }
      });
    }
  };



  $scope.closeChat = function(){
    $mdDialog.hide();
  };

  $scope.fromdriver = true;
  /// End Chat section
  $scope.switchMap = function(){
    $(".tasklist").css({"display":"none"});
    $(".map-container").css({"display":"block"});
  };
  $scope.showDarkTheme = true;
  var laststatus = getCookie("userconnection");
  if(laststatus == 'online'){
    $scope.userconnection = "online";
    if(usermarker !=null){
      usermarker.setMap(map);
    }

  }
  else if (laststatus =="onduty") {
    $scope.userconnection = "online";
    if(usermarker !=null){
      usermarker.setMap(map);
    }
  }
  else{
      $scope.userconnection = "offline";
      if(usermarker !=null){
        usermarker.setMap(null);
      }
  }
  $scope.getOrder = function(job){
    $rootScope.job = job;
    $timeout(function(){
    $mdBottomSheet.show({
        templateUrl:"acceptjob",
        controller:"driverController",
        clickOutsideToClose:false
      });

    },400);
    };
  $scope.dismiss = function(){
    $mdBottomSheet.hide();
  };
  $scope.acceptJob = function(job){
    delete job["$$hashKey"];
    job.delivery_status = "on the way pickup";
    job.pickup_status = "on the way pickup";
    job.pickup_date = moment(job.pickup_date,"LLLL").unix();
    job.pickup_late = moment(job.pickup_late,"LLLL").unix();
    job.vehicle_id = getCookie("vehicleid");
    job.driver_name = getCookie("drivername");
    setCookie("userconnection","onduty");
    var data = {driver_id:getCookie("driverid"),"data":job};
    console.log("JOb data:",job);
    socket.emit("assignment:update",data,function(err,response){
      if(err){
        console.log(response);
      }
      else{
        console.log("resonse:",response);

        socket.emit("assignment:get:list",{driver_id:getCookie("driverid")},function(err,result){
          $timeout(function(){
            $rootScope.joblist = result;
            $rootScope.$digest();
          },1000);
          console.log($rootScope.joblist);
          $(".tasklist").css({"display":"block"});
          $(".map-container").css({"display":"none"});
        });
      }
    });
    $mdBottomSheet.hide();
  };
  $scope.acceptDelivery = function (job){
            delete job["$$hashKey"];
            job.delivery_status = "in-delivery";
            job.pickup_status = "completed";
            job.pickup_date = moment(job.pickup_date,"LLLL").unix();
            job.pickup_late = moment(job.pickup_late,"LLLL").unix();
            job.vehicle_id = getCookie("vehicleid");
            job.driver_name = getCookie("drivername");
            setCookie("userconnection","onduty");
            var data = {driver_id:getCookie("driverid"),"data":job};
            socket.emit("assignment:update",data,function(err,response){
              if(err){
                console.log(response);
              }
              else{
                console.log("resonse:",response);

                socket.emit("assignment:get:list",{driver_id:getCookie("driverid")},function(err,result){
                  $timeout(function(){
                    $rootScope.joblist = result;
                    $rootScope.$digest();
                  },1000);
                  console.log($rootScope.joblist);
                  $(".tasklist").css({"display":"block"});
                  $(".map-container").css({"display":"none"});
                });
              }
          });
          $mdBottomSheet.hide();
  };
  $scope.completeDelivery =  function(job){
            delete job["$$hashKey"];
            job.delivery_status = "completed";
            job.pickup_status = "completed";
            job.pickup_date = moment(job.pickup_date,"LLLL").unix();
            job.pickup_late = moment(job.pickup_late,"LLLL").unix();
            job.vehicle_id = getCookie("vehicleid");
            job.driver_name = getCookie("drivername");
            setCookie("userconnection","online");
            var data = {driver_id:getCookie("driverid"),"data":job};
            socket.emit("assignment:update",data,function(err,response){
              if(err){
                console.log(response);
              }
              else{
                console.log("resonse:",response);

                socket.emit("assignment:get:list",{driver_id:getCookie("driverid")},function(err,result){
                  $timeout(function(){
                    $rootScope.joblist = result;
                    $rootScope.$digest();
                  },1000);
                  console.log($rootScope.joblist);
                  $(".tasklist").css({"display":"block"});
                  $(".map-container").css({"display":"none"});
                });
              }
          });
          $mdBottomSheet.hide();
        };
  $scope.retur = function(job){
            $mdDialog.show(
              $mdDialog.prompt()
                .title("Keterangan retur/kembalikan barang")
                .textContent("Alasan barang di kembalikan :")
                .ariaLabel("alasan retur atau kembali")
                .placeholder("Alasan anda:")
                .ok("Submit")
                .cancel("Batalkan")
            ).then(function(reason){
              $scope.delivery_detail = reason;
              console.log(reason);
              setCookie("userconnection","online")
              delete job["$$hashKey"];
              job.delivery_status = "retur";
              job.pickup_status = "completed";
              job.pickup_date = moment(job.pickup_date,"LLLL").unix();
              job.pickup_late = moment(job.pickup_late,"LLLL").unix();
              job.vehicle_id = getCookie("vehicleid");
              job.driver_name = getCookie("drivername");
              job.delivery_detail = reason;
              var data = {driver_id:getCookie("driverid"),"data":job};
              socket.emit("assignment:update",data,function(err,response){
                if(err){
                  console.log(response);
                }
                else{
                  console.log("resonse:",response);

                  socket.emit("assignment:get:list",{driver_id:getCookie("driverid")},function(err,result){
                    $timeout(function(){
                      $rootScope.joblist = result;
                      $rootScope.$digest();
                    },1000);
                    console.log($rootScope.joblist);
                    $(".tasklist").css({"display":"block"});
                    $(".map-container").css({"display":"none"});
                  });
                }
            });
            $mdBottomSheet.hide();
            });


  };
  $scope.$watch("userconnection",function(newval,oldval){
      if(newval == 'online'){
        $scope.switchList();
        $scope.userconnection="online";
        if(usermarker != null){
          usermarker.setMap(map);
        }
        setCookie("userconnection","online",7);
        var lat ;
        var lng ;
        var time ;
        navigator.geolocation.getCurrentPosition(function(pos){
          lat = parseFloat(pos.coords.latitude);
          lng = parseFloat(pos.coords.longitude);
          time = parseInt(pos.timestamp);
          var newdata = {
            "id":getCookie("driverid").toString(),
            "fcm":fcm,
            "name":getCookie("drivername"),
            "status":$scope.userconnection,
            "lat": lat,
            "lng": lng,
            "provider_id":getCookie("providerid"),
            "vehicle_id":getCookie("vehicleid"),
            "timestamp":time
          };
          socket.emit("driver:location",newdata,function(err,result){

          });
        },function(err){
          console.log("Error geolocation ",err);
        },{enableHighAccuracy:true,timeout:60000,maximumAge:0});

         watcher = navigator.geolocation.getCurrentPosition(handleLocation,handleLocationError,{enableHighAccuracy:true,timeout:60000,maximumAge:0});
      }
      else if(newval =="onduty"){
        setCookie("userconnection","onduty",7);
        $scope.userconnection="online";
        watcher = navigator.geolocation.getCurrentPosition(handleLocation,handleLocationError,{enableHighAccuracy:true,timeout:60000,maximumAge:0});
      }
      else{
        setCookie("userconnection","offline",7);
        //// do with list page
        if(usermarker != null){
          usermarker.setMap(null);
        }
        $scope.userconnection = "offline";
        var lat ;
        var lng ;
        var time ;
        navigator.geolocation.getCurrentPosition(function(pos){
          lat = parseFloat(pos.coords.latitude);
          lng = parseFloat(pos.coords.longitude);
          time = parseInt(pos.timestamp);
          var newdata = {
            "id":getCookie("driverid").toString(),
            "name":getCookie("drivername"),
            "fcm":fcm,
            "status":$scope.userconnection,
            "lat": lat,
            "lng": lng,
            "provider_id":getCookie("providerid"),
            "vehicle_id":getCookie("vehicleid"),
            "timestamp":time
          };
          socket.emit("driver:location",newdata,function(err,result){
            console.console.log(result);
          });
        },function(err){
          console.log("Error ",err);
        },{enableHighAccuracy:true,timeout:60000,maximumAge:"infinity"});

        navigator.geolocation.clearWatch(watcher);
        $rootScope.joblist = null;
  }
  $scope.viewOnMap = function(lat,lng,job,str){
    $mdBottomSheet.hide();
    if(lat == undefined && lng == undefined){
      $mdToast.show($mdToast.simple().textContent("Tidak ada data latitude & longitude ").position("top right").hideDelay(4000));
    }
    else{
        $scope.switchMap();
        markers.forEach(function(mark){
          mark.setMap(null);
        });
        markers=[];
        var latlng = new google.maps.LatLng(parseFloat(lat),parseFloat(lng));
        if(str == "pickup"){
          var marker = new google.maps.Marker({
            position:latlng,
            map:map,
            icon:{
              url:"pickup.png",
              scaledSize: new google.maps.Size(64,64)
            }
          });

          var info = '<h3 style="color:black;"><b>Pickup</b> </h3>';
          info += '<small style="color:black;"><b>Alamat: </b>'+job.pickup_address+'</small><br/>';
          info += '<small style="color:black;"><b>Pengirim: </b>'+job.pickup_receiver_name+'</small><br/>';
          info += '<small style="color:black;"><b>Instruksi: </b>'+job.pickup_instruction+'</small><br/>';
          info += '<small style="color:black;"><b>Detail: </b>'+job.pickup_detail+'</small><br/>';
        }
        else{
          var marker = new google.maps.Marker({
            position:latlng,
            map:map,
            icon:{
              url:"delivered.png",
              scaledSize: new google.maps.Size(64,64)
            }
          });
          var info = '<h3 style="color:black;"><b>Pengiriman:</b> '+job.delivery_sku+'</h3>';
          info += '<small style="color:black;"><b>Alamat: </b>'+job.delivery_address+'</small><br/>';
          info += '<small style="color:black;"><b>Penerima: </b>'+job.delivery_receiver_name+'</small><br/>';
          info += '<small style="color:black;"><b>Instruksi: </b>'+job.delivery_instruction+'</small><br/>';
        }

        map.setCenter(latlng);
        markers.push(marker);
        var infowindow = new google.maps.InfoWindow({
            content:info
        });
        google.maps.event.addListener(marker,"click",function(){
            infowindow.open(map,this);
        });
      }
  };
  $scope.logout = function(){
      deleteCookie();
      checkCookie();
  };
});

    var driverid = getCookie("driverid");
    socket.emit("driver:assignment",driverid,function(err,response){
        if(err){
          console.warn(response);
        }
        else{
          console.debug(response);
        }
    });
    socket.on("job:assigned",function(data){
      var toast = $mdToast.simple()
                  .textContent("New job with ID:"+data.order_id+" assigned to you")
                  .action("Open")
                  .highlightAction(true)
                  .highlightClass("md-accent")
                  .position("top").hideDelay(4000);
      $rootScope.joblist.push(data);
      // console.log($scope.jobs);
      $mdToast.show(toast).then(function(response){
        if(response=="ok"){
            return $scope.switchList();
        }

      });
    });
    function handleLocation(position){
      var oldpos =[position.coords.latitude , position.coords.longitude];
      var numDeltas = 1000;
      var delay = 100; //milliseconds
      var i = 0;
      var deltaLat;
      var deltaLng;
      $scope.geolatlng = position.coords.latitude+" , "+position.coords.longitude || "N/A";
      $scope.geostatus = "ON";
      $scope.geoaccuracy = parseFloat(position.coords.accuracy).toFixed(2) +" m" || "N/A";
      $scope.geospeed  = parseFloat(position.coords.speed * 3.6).toFixed(2) +" Km/h" || "N/A";
      $scope.geoaltitude = parseFloat(position.coords.altitude).toFixed(2)+" m" || "N/A";
      $scope.geoheading = parseFloat(position.coords.heading).toFixed(1)+"deg" || "N/A";
      $scope.$digest();
      try{
        usermarker.setMap(null);
      }
      catch(err){

      }

      var latlng = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
      usermarker = new google.maps.Marker({
        position:latlng,
        map:map,
        icon:icon
      });
      // usermarker= new CustomMarker(latlng,map,{marker_id:getCookie("driverid"),status:"userlocation",icon:icon});
      map.setZoom(15);
      map.panTo(latlng);
      watcher = navigator.geolocation.watchPosition(function(currPos){

          var newlatlng = new google.maps.LatLng(currPos.coords.latitude,currPos.coords.longitude);
          var newpos = [currPos.coords.latitude,currPos.coords.longitude];
          $scope.geolatlng = newpos[0]+" , "+newpos[1] || "N/A";
          $scope.geostatus = "ON";
          $scope.geoaccuracy = parseFloat(currPos.coords.accuracy).toFixed(2) +" m" || "N/A";
          $scope.geospeed  = parseFloat(currPos.coords.speed * 3.6 ).toFixed(2)+" Km/h"|| "N/A";
          $scope.geoaltitude = parseFloat(currPos.coords.altitude).toFixed(2) +" m" || "N/A";

          $scope.$digest();
          var newdata = {
            "id":getCookie("driverid").toString(),
            "name":getCookie("drivername"),
            "fcm":fcm,
            "lat":currPos.coords.latitude,
            "lng":currPos.coords.longitude,
            "status":getCookie("userconnection"),
            "provider_id":getCookie("providerid"),
            "vehicle_id":getCookie("vehicleid"),
            "timestamp":currPos.timestamp
          };
          socket.emit("driver:location",newdata,function(err,result){
            console.console.log(result);
          });
          var from = new google.maps.LatLng(oldpos[0],oldpos[1]);
          var to = new google.maps.LatLng(newpos[0],newpos[1]);

          map.setCenter(newlatlng);
          transition(newpos);
          function transition(result){
              i = 0;
              var from = new google.maps.LatLng(oldpos[0],oldpos[1]);
              var to = new google.maps.LatLng(result[0],result[1]);
              var heading =  google.maps.geometry.spherical.computeHeading(from, to);
              usermarker.icon.rotation = heading;
              $scope.geoheading = heading.toFixed(2)+"deg" || "N/A";
              usermarker.setIcon(usermarker.icon);
              deltaLat = (result[0] - oldpos[0])/numDeltas;
              deltaLng = (result[1] - oldpos[1])/numDeltas;
              moveMarker();
          }

          function moveMarker(){
              oldpos[0] += deltaLat;
              oldpos[1] += deltaLng;
              var latlng = new google.maps.LatLng(oldpos[0], oldpos[1]);
              usermarker.setPosition(latlng);
              if(i!=numDeltas){
                  i++;
                  setTimeout(moveMarker, delay);
              }
              if(i==numDeltas){
                oldpos =newpos;
                return oldpos;

              }
          }
          },function(err){
            console.log("Error geolocation watcher ",err);
            $scope.geostatus = "ERROR";
          },{enableHighAccuracy:true,timeout:600000,maximumAge:"infinity"});

    }
    function handleLocationError(error){
      switch(error.code) {
      case error.PERMISSION_DENIED:
      $scope.geostatus = "ERROR";
      $scope.geolatlng = "PERMISSION_DENIED";
      $scope.$digest();
        console.log("User denied the request for Geolocation.");
        var toast = $mdToast.simple()
        .textContent("Please allow location sharing on your browser")
        .action("HELP")
        .highlightAction(true)
        .highlightClass("md-warn")
        .position("top right");
        $mdToast.show(toast).then(function(response){

          var win = window.open("https://support.google.com/chrome/answer/142065?hl=en","_blank");
          if(win){
            win.focus();
          }
          else{
            alert("Please allow popup for this page :)");
          }
        });
        break;
      case error.POSITION_UNAVAILABLE:
        console.log("Location information is unavailable.");
        $scope.geostatus = "ERROR";
        $scope.geolatlng = "POSITION_UNAVAILABLE";
        $scope.$digest();
        var toast = $mdToast.simple()
        .textContent("Failed to retrieve your location")
        .action("Refresh")
        .highlightAction(true)
        .highlightClass("md-warn")
        .position("top")
        .hideDelay(5000);
        $mdToast.show(toast).then(function(response){
          if(response == "ok"){
            location.reload();
          }
        });
        break;
      case error.TIMEOUT:
        console.log("The request to get user location timed out.");
        $scope.geostatus = "ERROR";
        $scope.geolatlng = "TIMEOUT";
        $scope.$digest();
        var toast = $mdToast.simple()
        .textContent("Too long to get your location")
        .action("Refresh")
        .highlightAction(true)
        .highlightClass("md-warn")
        .position("top")
        .hideDelay(5000);
        $mdToast.show(toast).then(function(response){
          if(response == "ok"){
            location.reload();
          }
        });
        break;
      case error.UNKNOWN_ERROR:
        console.log("An unknown error occurred.");
        $scope.geostatus = "ERROR";
        $scope.geolatlng = "UNKNOWN_ERROR";
        $scope.$digest();
        var toast = $mdToast.simple()
        .textContent("Unknown error :( ")
        .action("Refresh")
        .highlightAction(true)
        .highlightClass("md-warn")
        .position("top")
        .hideDelay(5000);
        $mdToast.show(toast).then(function(response){
          if(response == "ok"){
            location.reload();
          }
        });
        break;
      }
    }
});


///////////////////////////////// Driver controller END


$(document).ready(function(){
  socket.on("unread",function(datas){
    var data = datas.data;
    if(data.from != getCookie('drivername')){
      var list = '';
      list += '<md-list-item class="left-list chatbubble"><p>'+data.message+'</p><small style="font-size:10px;display:block;position:absolute;bottom:0px;">'+data.timestamp+'</small></md-list-item>';
      $(".chatcontent").append(list);
      $(".chatcontent").scrollTop(99999);
      list = '';
      console.log("Appended ",datas);
    }
  });
  $("md-content").show();
  checkCookie();
  $("#map").show();
  trafficlayer = new google.maps.TrafficLayer();
  $("#traffic").on("click",function(){
      if(toggleTraffic == true){
          trafficlayer.setMap(null);
          toggleTraffic = false;
      }
      else{
          traffic = new google.maps.TrafficLayer();
          trafficlayer.setMap(map);
          toggleTraffic = true;
      }
  });

  var noSleep = new NoSleep();
  var wakeLockEnabled = false;
  var toggleEl = document.querySelector("#light");

  toggleEl.addEventListener('click', function() {
    if (!wakeLockEnabled) {
      noSleep.enable(); // keep the screen on!
      wakeLockEnabled = true;
      toggleEl.value = "Wake Lock Enabled";
      $("#light md-icon").html("brightness_high");
    } else {
      noSleep.disable(); // let the screen turn off.
      wakeLockEnabled = false;
      toggleEl.value = "Wake Lock Disabled";
      $("#light md-icon").html("brightness_low");
    }
  }, false);


  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
       .register('./driver-sw.js')
       .then(function() { console.log('Service Worker Registered'); });
     }
/////////////////////////// FCM initializeApp

      messaging.requestPermission()
      .then(function(currentToken){
        console.log("Permission Granted");
      })
      .catch(function(err){
        console.log("FCM error:",err);
      });

	messaging.getToken()
  .then(function(token){
    console.log(token);
    if(token){
      fcm = token;
    }
    else{
      fcm = "";
    }
  })
  .catch(function(err){
    console.log(err);
  });


////////////////// END FCM HANDLER

});


function locate(){
  console.log("Locating..");
  navigator.geolocation.getCurrentPosition(function(pos){
      var lat = pos.coords.latitude;
      var lng = pos.coords.longitude;
      var latlng = new google.maps.LatLng(lat,lng);
      map.panTo(latlng);
      map.setZoom(16);
      console.log(pos);
  },function(error){},{enableHighAccuracy:true,timeout:60000,maximumAge:"infinity"});
}
function buildMap(){
    var mapcanvas = document.getElementById('map');
    map = new google.maps.Map(mapcanvas,{
        zoom:8,
        center:new google.maps.LatLng(-6.248596, 106.843298),
        mapTypeId:google.maps.MapTypeId.ROADMAP,
        styles:maptheme


    });
    initLocate();

}
function initLocate(){
  var locate= document.getElementById("locate");
  var trafficbutton = document.getElementById("traffic");
  var light = document.getElementById("light");
  map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(locate);
  map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(trafficbutton);
  map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(light);
}
function checkCookie() {
    var user = getCookie("driverid");
    if (user != "") {
        setCookie("driverid",user,7);
        console.debug("cookies renewed");
    }
    else{
      window.location="driverlogin";
    }

}

//setCookie("username",val.username,7);
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}
function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length,c.length);
        }
    }
    return "";
}
function deleteCookie(){
	document.cookie = "driverid=";
  document.cookie = "drivername=";
  document.cookie = "providerid=";
  document.cookie = "vehicleid=";
}
