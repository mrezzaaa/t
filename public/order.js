const env = "production"
var server = env == "production" ? "https://logisthink.insthink.co.id:85" : "https://local.logisthink.id:85"
var socket = io.connect(server);
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
  $scope.openLeftMenu = function() {
    $mdSidenav('left').toggle();
      if(menu == "hide"){
            $(".contentholder").css({"left":"320px"});
            $("md-tab-content").css({"margin-right":"320px"});
            menu = "show";
        }
        else{
            $(".contentholder").css({"left":"0px"});
             $("md-tab-content").css({"margin-right":"0px"});
            menu = "hide";
        }
  };
});

app.controller("AppData",function($scope){

});
app.controller("TrackOrder",function($scope,$mdToast){

//////////////////////////////////////
  $scope.updateOrder = function(){
    var orderid = $scope.orderid;
    var userid = $scope.userid;
    var lat = $scope.lat;
    var lng = $scope.lng;
    var vhc = $scope.vehicleid;
    var provider = $scope.provider;
    var data = {
      order_id:orderid,
      driver_id:userid,
      lat:lat,
      lng:lng,
      vehicle_id:vhc,
      provider_id:provider
    };
    socket.emit("report:location:update",data,function(err,result){
        if(err){
          $mdToast.show(
            $mdToast.simple().textContent("Failed to update").position("right bottom").hideDelay(3000)
          );
        }
        else{
          $mdToast.show(
            $mdToast.simple().textContent("Location Updated").position("bottom right").hideDelay(3000)
          );
        }
    });
  };

//////////////////////////////////////
  $scope.newOrder = function(){
    var orderid = $scope.orderid;
    var userid = $scope.userid;
    var lat = $scope.lat;
    var lng = $scope.lng;
    var vhc = $scope.vehicleid;
    var provider = $scope.provider;
    var data = {
      order_id:orderid,
      driver_id:userid,
      lat:lat,
      lng:lng,
      vehicle_id:vhc,
      provider_id:provider
    };
      socket.emit("report:location:insert",data,function(err,result){

      });
  };
/////////////////////////////////
  $scope.clearData = function(){
    socket.emit("clear:tracking",function(err,result){
      if(err){
        console.log("ERROR" ,result);
      }
      else{
        $mdToast.show(
          $mdToast.simple().textContent("Data Cleared").position("bottom right").hideDelay(3000)
        );
        $scope.orders = [];
        $scope.$digest();
      }
    });
  };
/////////////////////////////////
  $scope.init = function(){
    socket.emit("request:tracking");
    socket.on("tracking:data",function(data){
      $scope.orders = data;
      $scope.$digest();
      });
  };
  $scope.init();
/////////////////////////////////
  $scope.locate = function(){
    navigator.geolocation.getCurrentPosition(function(position){
      $scope.lat = position.coords.latitude;
      $scope.lng = position.coords.longitude;
      $scope.$digest();
    });
  };
  /////////////////////////////////
  $scope.cardClick = function(data) {
    $scope.orderid = data.order_id;
    $scope.userid = data.driver_id;
    $scope.lat = data.lat;
    $scope.lng = data.lng;
    $scope.vehicleid = data.vehicle_id;
    $scope.provider = data.provider_id;

  };







});///////app controller


$(document).ready(function(){
  socket.on("connect",function(){
    console.log("Connected to socket server");
  });
});
