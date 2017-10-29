var originatorEv = null;
socket.on("connect",function(){
  console.log("Connected");
});
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
app.controller("MyController",function($scope){

});

app.controller("driverController",function($scope,$mdDialog,$mdToast,$rootScope){
  $rootScope.drivers = [];
  socket.emit("request:driver:mysql",function(err,result){
      result.forEach(function(data){
        $rootScope.drivers.push(data);
      });
      $scope.$digest();
  });

  $scope.editDriver = function(driver,$event){
    console.log(driver);
    originatorEv= $event;
    var html = '';
    html += '<md-input-container>';
    html += '<label>Nama</label>';
    html += '<input ng-model="nama" type="text">';
    html += '</md-input-container>';
    $mdDialog.show({
        targetEvent :originatorEv,
        template :html,
        clickOutsideToClose:true,
        controller: "driverController",
        bindToController :true,
        escapeToClose:true,
      });

      originatorEv = null;
  };
  $scope.deleteDriver = function(data,$event){
    var confirm = $mdDialog.confirm()
    .title("Konfirmasi hapus data")
    .textContent("Jika supir "+data.name+" dihapus,maka driver tersebut tidak bisa menjalankan tugas dan di lacak secara realtime")
    .ariaLabel("Hapus data "+data.name)
    .targetEvent($event)
    .ok("Hapus")
    .cancel("Batalkan");
    $mdDialog.show(confirm).then(function(){
      socket.emit("driver:deletedriver",data,function(err,result){
        if(err){
          console.log(result);

        }
        else{
          console.log("deleting driver:"+data.name,result);
          var index = $rootScope.drivers.indexOf(data);
          $rootScope.drivers.splice(index,1);
          $rootScope.$digest();
          $mdToast.show(
            $mdToast.simple()
            .textContent("Driver "+data.name+" berhasil dihapus !")
            .position("top right")
            .hideDelay(5000)
          );
        }
      });
    },function(){
      $mdToast.show(
        $mdToast.simple()
        .textContent("Driver "+data.name+" batal dihapus !")
        .position("top right")
        .hideDelay(5000)
      );
    });
  };


});


app.controller("driverAdministration",function($scope,$mdDialog,$mdToast){
  $scope.addDriver = function($event){
    $mdDialog.show({
      controller:"dialogController",
      templateUrl : "driverform",
      fullscreen:true,
      clickOutsideToClose:true,
      escapeToClose:true,
      targetEvent:$event
    });
  };
});

app.controller("dialogController",function($scope,$mdDialog,$mdToast,$rootScope){
  $scope.closeDialog = function(){
    $mdDialog.hide();
  };
  $scope.saveDriver = function(){
    var date = new Date();
    var data = {
      no:"",
      id:parseInt(Math.random(100,1000)*1000).toString(),
      name:$scope.name,
      password:$scope.password,
      address :$scope.address,
      phone:$scope.phone.toString(),
      registered_date:$scope.driverjoineddate,
      type:$scope.type,
      provider_id:"demo",
      created_date:date
    };


    socket.emit("driver:addnew",data,function(err,result){
      if(result.affectedRows == 1){
        $mdToast.show(
          $mdToast.simple().textContent("Supir baru "+$scope.name+" telah ditambahkan").position("right bottom").hideDelay(3000)
        );
        $mdDialog.hide();
        $rootScope.drivers.push(data);
        $rootScope.$digest();


      }
      else{
        $mdToast.show(
          $mdToast.simple().textContent("Gagal menambahkan supir :(").position("right bottom").hideDelay(3000)
        );
        $mdDialog.hide();
      }
    });
  };
});
