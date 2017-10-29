var app = angular.module("Logisthink",['ngMaterial']).config(function($mdThemingProvider) {
$mdThemingProvider.theme('default')
    .primaryPalette('red',{
      "hue-1":"50"
    }).accentPalette('pink');
    $mdThemingProvider.theme('dark-grey').primaryPalette("grey").accentPalette("blue-grey").warnPalette("deep-orange").backgroundPalette('grey').dark();
    $mdThemingProvider.theme('dark-orange').backgroundPalette('orange');
    $mdThemingProvider.theme('dark-purple').backgroundPalette('deep-purple').dark();
    $mdThemingProvider.theme('dark-blue').backgroundPalette('blue').dark();

});

app.controller("LoginController",function($scope,$mdToast,$mdDialog,$timeout){
  $scope.logging = function($event){
    var data = {
      phone:$scope.phone,
      password:MD5($scope.password)
    };
    if($scope.phone == undefined || $scope.password == undefined){
      $mdDialog.show(
        $mdDialog.alert()
        .clickOutsideToClose(true)
        .title('Error')
        .textContent('Pastikan No HP & password tidak kosong')
        .ariaLabel('Login error')
        .ok('OK')
        .targetEvent($event)
      );
    }
    else{
      socket.emit("driver:login",data,function(err,result){
        if(err){
          console.log("Error:",result);
        }
        else{
          if(result == null){
            console.log("No user found");
          }
          else{
            if(result.status == "OK"){
              $mdToast.show(
                $mdToast.simple().textContent("Login Sukses").position("top").hideDelay(3000)
              );
              $timeout(function(){
                setCookie("driverid",result.driverid,7);
                setCookie("drivername",result.drivername,7);
                setCookie("providerid",result.provider_id,7);
                setCookie("vehicleid",result.vehicle_id,7);
                window.location="/as-driver";
              },1500);
            }
            else {
              $mdDialog.show(
                $mdDialog.alert()
                .clickOutsideToClose(true)
                .title(result.status)
                .textContent(result.message)
                .ariaLabel('Login error')
                .ok('OK')
                .targetEvent($event)
              );
            }
          }
        }
      });
    }
  }
  $scope.checkEnter = function($event){
    var keyCode = $event.which || $event.keyCode;
    if (keyCode === 13) {
        $scope.logging($event);
    }

  };






}); /////// End of controller
function checkCookie() {
    var user = getCookie("driverid");
    if (user != "") {
        setCookie("driverid",user,7);
        console.debug("cookies renewed");
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


function deleteCookie(cname){
	document.cookie = "driverid=";
  document.cookie = "drivername=";
  document.cookie = "providerid=";
  document.cookie = "vehicleid=";
}
