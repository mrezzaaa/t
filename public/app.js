var iconloaded = false;
var overlay =[];
var layer ;
var layers = [];
var infowindow= [];
var popup = [];
var position = [];
moment.locale('id');
var maptheme = [{"featureType":"all","elementType":"all","stylers":[{"invert_lightness":true},{"saturation":10},{"lightness":30},{"gamma":0.5},{"hue":"#435158"}]},{"featureType":"road.arterial","elementType":"geometry.fill","stylers":[{"saturation":"-21"},{"color":"#035f69"}]}];
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
    $mdThemingProvider.theme('dark-orange').primaryPalette("orange").accentPalette("deep-orange").backgroundPalette('orange').dark();
    $mdThemingProvider.theme('dark-purple').backgroundPalette('deep-purple').dark();
    $mdThemingProvider.theme('dark-blue').primaryPalette("blue").backgroundPalette('blue').dark();

});
app.directive('ngRightClick', function($parse) {
  // console.log("Right click");
    return function(scope, element, attrs) {
        var fn = $parse(attrs.ngRightClick);
        element.bind('contextmenu', function(event) {
            scope.$apply(function() {
                event.preventDefault();
                fn(scope, {$event:event});
            });
        });
    };
});

app.controller('MyController', function($scope,$rootScope,$mdToast,$mdDialog,$mdSidenav,$timeout) {

    $scope.showDarkTheme = true;
    $scope.currentNavItem = 'page1';
    var order = [];
    var pickup = [];
    var delivery = [];
    socket.on("disconnect",function(){
      $mdToast.show(
        $mdToast.simple().textContent("Connection lost...").action("reload").highlightAction(true).highlightClass("md-warn")
        .position("top").hideDelay(60000)
      ).then(function(response){
        if(response == "ok"){
          return location.reload();
        }
        // console.log(response);
      });
    });
    $scope.goto = function(page){
      switch(page){
        case 'page1':
          $("div.manage").hide();
          $("div.main").show();
        break;
        case 'page2':
          $("div.manage").show();
          $("div.main").hide();
          var orderdata = [];
          moment.locale("id");
          socket.emit("order:get",getCookie("providerid"),function(err,response){
            response.forEach(function(res){
              socket.emit("order:pickup",res,function(err,picks){
                picks.pickup[0].early_time = moment.unix(picks.pickup[0].early_time).format("LLLL");
                picks.pickup[0].latest_hour = moment.unix(picks.pickup[0].latest_hour).format("LLLL");

                socket.emit("order:destination",res,function(err,deliv){
                  orderdata.push({
                    "order":res,
                    "pickup":picks.pickup,
                    "delivery":deliv.delivery
                  });
                });
              });
            });
          });
          $scope.allorder = orderdata;
          // console.log($scope.allorder);
        break;
      }
    };
    $scope.goto('page1');
    $scope.updateVehicle = function(driver,$event){
      $rootScope.driverupdate = driver;
      // console.log("Update vehicle for "+driver.name);
      $mdDialog.show({
        targetEvent :$event,
        templateUrl :"updateVehicle",
        clickOutsideToClose:true,
        bindToController : true,
        controller: "dialogController",
        fullscreen:true,
        escapeToClose:true

      });
    };
    $scope.ongoing = 0;
    socket.on("updated:list:order",function(data){
      // console.log("updated",data);
      $scope.jobs.forEach(function(job){
        if(job.order.id == data.data.order_id){
          // console.log("Got order id "+data.data.order_id,job);
          job.order.status = data.data.order_status;
          job.delivery[0].status = data.data.delivery_status;
          job.pickup[0].status = data.data.pickup_status;
        }
        $scope.$digest();
      });
    });
    socket.emit("order:get",getCookie("providerid"),function(err,result){
                if(err){
                  // console.log(result);
                }
                else{
                  if(result == null){
                    $mdToast.show(
                      $mdToast.simple().textContent("Failed to retrieve some data :(").action("reload").highlightAction(true).highlightClass("md-warn")
                      .position("top").hideDelay(4000)
                    ).then(function(response){
                      if(response == "ok"){
                        return location.reload();
                      }
                      // console.log(response);
                    });
                  }
                  else{
                    order = [];
                    $scope.jobs = [];
                    $scope.ongoing =0;

                        result.forEach(function(data){
                          pickup = [];
                          delivery =[];

                          if(data.status != 'completed'){
                            $scope.ongoing++;
                          }
                          socket.emit("order:pickup",data,function(err,pickupdata){
                            pickupdata.pickup.forEach(function(p){
                              p.early_time = moment(p.early_time * 1000).format('lll');
                              p.latest_hour = moment(p.latest_hour * 1000).format('lll');
                            });
                            socket.emit("order:destination",data,function(err,deliverdata){

                              order.push({
                                "order":data,
                                "pickup":pickupdata.pickup,
                                "delivery":deliverdata.delivery
                              });
                            });
                          });
                        });
                  }
                  // console.log(order)
                  $scope.jobs = order;
                  // console.log($rootScope.jobs);
                  $timeout(function(){
                    $scope.$digest();
                  },400);
                }
      });
    socket.emit("driver:all",{provider_id:getCookie("providerid")}, (err,result) =>{
			$rootScope.drivers = result;
			result.forEach(function(data){
				data.timespace = moment(data.timestamp * 1000).fromNow();
				if(data.timespace.match("days ago") || data.timespace.match("hari yang lalu")){
					data.status = data.timespace.match("hari yang lalu") ? "offline" : "online";
				}
			});
		});
    $scope.socketing = function(){
      // console.log("Socketing");
      var icon = {
        path: car,
        scale: .7,
        strokeColor: 'black',
        strokeWeight: .8,
        fillOpacity: 1,
        fillColor: '#fff',
        offset: '0%',
        rotation: 0,
        id:"pulse",
        anchor: new google.maps.Point(10, 25) // orig 10,50 back of car, 10,0 front of car, 10,25 center of car
      };
      socket.on("connect",function(conn){
        setInterval(()=>{
    			socket.emit("order:get",getCookie("providerid"),(er,result) =>{
    				order = [];
    				$rootScope.jobs =[];
    				$scope.ongoing = 0;
    				result.forEach( (data) => {
    					if(data.status != "completed"){
    						$scope.ongoing++;
    					}
              data.pickup_date = moment(data.pickup_date * 1000).format('lll');
    					socket.emit("order:pickup",data,(err,pickupdata) => {
    						socket.emit("order:destination",data, (errr,deliverdata) =>{
    								order.push({
    									"order" : data,
    									"pickup": pickupdata.pickup,
    									"delivery": deliverdata.delivery
    								});
    						});
    					});
    				});
    				$rootScope.jobs = order;
    				});
    			socket.emit("driver:all",{provider_id:getCookie("providerid")}, (err,result) =>{
    				$rootScope.drivers = result;
    				result.forEach(function(data){
    					data.timespace = moment(data.timestamp * 1000).fromNow();
    					if(data.timespace.match("days ago") || data.timespace.match("hari yang lalu")){
    						data.status = data.timespace.match("hari yang lalu") ? "offline" : "online";
    					}
    					var latlng = {lat:parseFloat(data.lat),lng:parseFloat(data.lng)};
    					var mylat = new google.maps.LatLng(latlng.lat,latlng.lng);
    					var newpos = [data.lat,data.lng];
    					if(iconloaded == false){
    						// var icon = "truck-top.svg";
    						// overlay = new CustomMarker(mylat,map,{marker_id:data.name});
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
    						layer = new CustomMarker(mylat,map,{"marker_id":data.driver_id,"status":data.status});
    						layers[data.name] = layer;
    						position[data.driver_id] = [data.lat,data.lng];
    								popup[data.driver_id] = '<div><b>'+data.name+'</b><br/>';
    								popup[data.driver_id] += '<i class="material-icons mapicon">local_shipping</i> :'+data.vehicle_id+'<br/>';
    								popup[data.driver_id] += '<i class="material-icons mapicon">visibility</i> : '+data.status+'<br/>';
    								popup[data.driver_id] += '<i class="material-icons mapicon">location_city</i> : '+data.provider_id  +'<br/>';
    								popup[data.driver_id] += '<i class="material-icons mapicon">person_pin_circle</i> : '+data.lat+','+data.lng+'<br/>';
    								infowindow[data.driver_id] = new google.maps.InfoWindow({
    									content:popup[data.driver_id]
    								});
    						google.maps.event.addListener(overlay[data.name],"click",function(){
    									map.panTo(overlay[data.name].position);
    									map.setZoom(15);
    									infowindow[data.driver_id].close();
    									infowindow[data.driver_id].open(map,this);
    						});
    					}
    					else{
    						popup[data.driver_id] = '<div><b>'+data.name+'</b><br/>';
    						popup[data.driver_id] += '<i class="material-icons mapicon">local_shipping</i> :'+data.vehicle_id+'<br/>';
    						popup[data.driver_id] += '<i class="material-icons mapicon">visibility</i> : '+data.status+'<br/>';
    						popup[data.driver_id] += '<i class="material-icons mapicon">location_city</i> : '+data.provider_id  +'<br/>';
    						popup[data.driver_id] += '<i class="material-icons mapicon">person_pin_circle</i> : '+data.lat+','+data.lng+'<br/>';
    						infowindow[data.driver_id].setContent(popup[data.driver_id]);
    						var numDeltas = 100;
    						var delay = 1; //milliseconds
    						var i = 0;
    						var deltaLat;
    						var deltaLng;
    						function transition(result){
    								i = 0;
    								var from = new google.maps.LatLng(position[data.driver_id][0],position[data.driver_id][1]);
    								var to = new google.maps.LatLng(result[0],result[1]);
    								var heading =  google.maps.geometry.spherical.computeHeading(from, to);
    								$("div.marker[data-marker_id='"+data.driver_id+"']").removeClass("pulse pulseonduty pulseoffline pulse"+data.status);
    								$("div.marker[data-marker_id='"+data.driver_id+"']").addClass(data.status=="online"?"pulse":"pulse"+data.status);
    								overlay[data.name].icon.rotation = heading;
    								overlay[data.name].setIcon(overlay[data.name].icon);
    								deltaLat = (result[0] - position[data.driver_id][0])/numDeltas;
    								deltaLng = (result[1] - position[data.driver_id][1])/numDeltas;
    								moveMarker(overlay);
    						}
    						function moveMarker(){
    								position[data.driver_id][0] += deltaLat;
    								position[data.driver_id][1] += deltaLng;
    								var latlng = new google.maps.LatLng(position[data.driver_id][0], position[data.driver_id][1]);
    								overlay[data.name].setPosition(latlng);
    								layers[data.name].setPosition(latlng);
    								layers[data.name].setStatus(data.status);
    								if(i!=numDeltas){
    										i++;
    										setTimeout(moveMarker, delay);
    								}
    								if(i==numDeltas){
    									position[data.driver_id] =[data.lat, data.lng];
    									return position;

    								}
    						}

    						transition(newpos);
    					}
    				});
    				iconloaded = true;
    			});
    				$rootScope.$digest();
    				$scope.$digest();

    		},3000);
      });
    };
    ///////////////////////////////////////
    $rootScope.toggleFullScreen=  function(){
      var el = document.documentElement
      , rfs = // for newer Webkit and Firefox
             el.requestFullScreen
          || el.webkitRequestFullScreen
          || el.mozRequestFullScreen
          || el.msRequestFullscreen;
        if(typeof rfs!="undefined" && rfs){
              rfs.call(el);
            } else if(typeof window.ActiveXObject!="undefined"){
              // for Internet Explorer
              var wscript = new ActiveXObject("WScript.Shell");
              if (wscript!=null) {
                 wscript.SendKeys("{F11}");
              }
              else{
                wscript.SendKeys("{ESC}");
              }
        }

      };

  ////////////////////////////////////////////////
  $scope.assignTo = (job,$event) =>{
    $rootScope.assignJob = job;
    $rootScope.drivers = $rootScope.drivers;
    // console.log(window.location.pathname);
    $mdDialog.show({
      targetEvent : $event,
      templateUrl : window.location.pathname+"assignform/",
      clickOutsideToClose :true,
      controller : "dialogController",
      fullscreen: true,
      escapeToClose :true
    });
  };
  ////////////////////////////////////////////////
  $scope.closeDialog =function(){
    $mdDialog.hide();
  };
  ////////////////////////////////////////////////

    $rootScope.goToDriver = function(driver){
      $mdToast.show(
        $mdToast.simple().textContent("Moving to driver "+driver.name+" Coordinates:"+driver.lat+","+driver.lng).position("right top").hideDelay(3000)
      );
      map.panTo(new google.maps.LatLng(driver.lat,driver.lng));
      map.setZoom(15);

    };
    google.maps.event.addListener(map,"rightclick",function(event){
      var lat = event.latLng.lat();
      var lng = event.latLng.lng();
      var latlng = {lat:lat,lng:lng};
      var geocoder = new google.maps.Geocoder;
      geocoder.geocode({location:latlng},function(results, status){
        if(status == "OK"){
          if(results[0]){
            $mdToast.show(
              $mdToast.simple().textContent(results[0].formatted_address).position("right bottom").hideDelay(3000)
            );
          }
          else{
            $mdToast.show(
              $mdToast.simple().textContent("Failed reverse geocoding").position("right bottom").hideDelay(3000)
            );
          }
        }
        else{
          $mdToast.show(
            $mdToast.simple().textContent("Geocoder Failed :"+status).position("right bottom").hideDelay(3000)
          );
        }
      });

    });
  /////////////////////////////////////////////////
  $scope.logout = function(){
      deleteCookie();
      checkCookie();
  }


    ///// Chat control
    $scope.chatDriver = function(driver,event){
      // console.log("Starting chat with ",driver);
      var channel = {"channel": getCookie("providerid")+":"+driver.driver_id};
      $scope.roomactive = driver.name;
      $rootScope.channel = getCookie("providerid")+":"+driver.driver_id;
      $scope.conversation = "";
      $scope.openConversation();
      socket.emit("newchat",channel,function(err,result){
        if(err){
          console.warn(err,result);
        }
        else{
          console.error(err,result);
          $scope.channelid = result.channelid;
        }
      });
      $scope.chatPanel();
    };
    $scope.chatPanel = function(){
      $scope.room = null;
      setTimeout(function(){
        $scope.unread = null;
        $scope.unreadfrom = null;
      },3000);
      $mdSidenav("right").toggle();
      var pid = getCookie("providerid");
      var pin = getCookie("providername");
      socket.emit("getChannel",pid,function(result){
        result.forEach(function(data){
          $scope.room = [];
          socket.emit("getUserData",data.channel.split(":")[1],function(res){
            socket.emit("getLastChat",data.channel,function(err,last){
              last.forEach(function(msg){
                $scope.room.push({"room":res.name,channel:data.channel,channelid:data.id,lastchat: typeof msg.message == "undefined" ? "" : msg.message});
              });
            });

          });

        });

      });
    };

    $scope.getConversation=  function(room,name,channelid){
      $scope.openConversation();
      $scope.conversation = null;
      $rootScope.channel = room;
      $rootScope.roomactive = name;
      $("chatcontent li").remove();
      $scope.channelid= channelid;
      // console.log("$scope.channelid",$scope.channelid);
      socket.emit("getConversation",room,function(err,result){
        var li = '';
        result.forEach(function(msg){

          if(msg.from == getCookie("providername")){
            li +='<li class="chats chatright">'+msg.message+'<br/></li>';
          }
          else{
            li +='<li class="chats chatleft">'+msg.message+'<br/></li>';
          }
        });
        $scope.conversation = "";
        $("chatcontent").append(li);
        $("chatcontent").scrollTop(9999);
      });

    };

    $scope.sendChat = function(){
      moment.locale("id");
      var msg = $scope.composed;
      var cid = $scope.channelid;
      if(typeof cid == "undefined" || cid ==null){
        socket.emit("newchat",$rootScope.channel,function(err,res){
          cid = res.channelid;
        });
      }
      if(msg != ""){
          var data = {
            channelid :cid,
            from : getCookie("providername"),
            channel : $rootScope.channel,
            message : msg,
            timestamp : new moment().format('LLLL')
          };
          socket.emit("sendchat",data,function(err,result){
            if(err){
              console.warn(result);
            }
            else{
              var li ='<li class="chats chatright">'+msg+'<br/></li>';
              $("chatcontent").append(li);
              $("chatcontent").scrollTop(9999);
              li = null;
            }
          });
          $scope.room.forEach(function(channelroom){
            if(channelroom.channel == $rootScope.channel){
              channelroom.lastchat = msg;
            }
          });
          $scope.composed = "";
        }
    };
    $scope.closeConversation = function(){
      $("conversation").hide("highlight",{direction:"bottom"},400);
      $("chatcontent").html("");
    };

    $scope.openConversation = function(){
      $("conversation").show();
    };

    $scope.clearChat = function(channel,name){
      // console.log("deleting chatroom "+channel);
      var confirm = $mdDialog.confirm()
          .title('Menghapus obrolan')
          .textContent('Apakah anda yakin ingin mengkhiri obrolan dengan '+name+' ? Obrolan akan di hapus selamanya')
          .ariaLabel('Lucky day')
          // .targetEvent(ev)
          .ok('Hapus')
          .cancel('Batalkan');

    $mdDialog.show(confirm).then(function() {
      socket.emit("leave:channel",function(result){
        // console.log("Leave channel ",result);
        if(result.msg == "ok"){

        }
      });
      setTimeout(function(){
          socket.emit("clearchat",{"channel" : channel},function(err,result){
              $scope.chatPanel();
              $scope.closeConversation();
          });

      },1000);
      setTimeout(function(){
        socket.emit("join:channel:provider",{channel:getCookie("providerid"),name:getCookie("providername")},function(err,response){
          // console.log(response);
          $rootScope.unread = null;
        });
      },2000);
    }, function() {
      $mdToast.show($mdToast.simple().textContent("Menghapus chat dengan "+name +" dibatalkan").position("left top").hideDelay(5000));
    });
    };

    socket.on("unread",function(data){
      $scope.unread = data.unread;
      $scope.unreadfrom = data.from;
      var msg = data.data;
      // console.log(data);
      if($rootScope.channel == msg.channel){
        var li ='<li class="chats chatleft">'+msg.message+'<br/></li>';
        $("chatcontent").append(li);
        $("chatcontent").scrollTop(9999);
        li = null;
      }
    });
    $scope.orderDetail = function(data,$event){
      $rootScope.odetail = data;
      data.delivery.forEach(function(d){
        d.verification_delivered_time = moment(parseInt(d.verification_delivered_time) * 1000).format('lll');
      });
      data.pickup.forEach(function(p){
        p.verification_accept_job_time = moment(parseInt(p.verification_accept_job_time) * 1000).format('lll');
        if(p.verification_pickup_time == null){
          p.verification_pickup_time = p.verification_pickup_time == null  ? "No data": moment(parseInt(p.verification_pickup_time) * 1000).format('lll');
        }
        else if(typeof p.verification_pickup_time =="undefined"){
          p.verification_pickup_time = typeof p.verification_pickup_time =="undefined" ? "No data": moment(parseInt(p.verification_pickup_time) * 1000).format('lll');
        }
        else{
          p.verification_pickup_time = moment(parseInt(p.verification_pickup_time) * 1000).format('lll');
        }
      });
      console.log($rootScope.odetail);
      $mdDialog.show({
        targetEvent :$event,
        templateUrl : "orderdetail",
        clickOutsideToClose :true,
        controller:"dialogController",
        fullscreen:true,
        escapeToClose:true
      });
    };


});
app.controller("AppData",function($scope){
  socket.emit("join:channel:provider",{channel:getCookie("providerid"),name:getCookie("providername")},function(err,response){
    // console.log(response);
    $rootScope.unread = null;
  });
  socket.on("channel",function(message){
    $scope.srvmsg = message;
    // console.log("Message:",message);
  });

});
app.controller("dialogController",function($scope,$mdDialog,$mdToast,$rootScope,$timeout){
  $rootScope.selectedDriver = "";
  $scope.jobtoassign = $rootScope.assignJob;
  $scope.odetail = $rootScope.odetail;
  console.log("Dialogcontrol,",$scope.odetail);
  $scope.closeDialog = (dialog) =>{
    $mdDialog.hide();
  };
  $scope.loadDriver = () =>{
    return $timeout( () =>{
      $scope.drivers = typeof $scope.drivers == "undefined" ? $rootScope.drivers : $scope.drivers;
    },800);
  };
  $scope.loadVehicle = () =>{
    $scope.driverupdate = $rootScope.driverupdate;
    socket.emit("get:allvehicle",getCookie("providerid"),function(err,response){
      if(err){
        $mdToast.show($mdToast.simple().textContent("Gagal mendapatkan data mobil").position("left top").hideDelay(5000));
      }
      else{
        return $timeout(function(){
          $scope.vehicles = response;
        },400);
      }
    });
  };
  $scope.assignVehicle = () =>{
    var vid = $scope.selectedVehicle.split('_')[0];
    var plate = $scope.selectedVehicle.split('_')[1];
    var data ={
      driver_id : $scope.driverupdate.driver_id,
      vehicle_id : vid,
      licenseplate : plate
    };
    socket.emit("update:driver:vehicle",data,function(err,res){
      if(err){
        $mdToast.show($mdToast.simple().textContent("Error"+res).position("left top").hideDelay(7000));
      }
      else{
        $mdDialog.hide();
        $mdToast.show($mdToast.simple().textContent(res.message).position("left top").hideDelay(2000)).then(function(){
          location.reload();
        });
      }
    });
  };
  $scope.assignDriver = () =>{
    var job = $scope.jobtoassign;
    var order = job.order;
    var pickup = job.pickup[0];
    var status = "scheduled";
    var driver = JSON.parse($scope.selectedDriver);
    console.log("Driver",driver,job);
    if(job.delivery.length > 1){
          job.delivery.forEach(function(destination){
              data = {
                order_id:order.id,
                order_nod:order.nod,
                delivery_id:order.delivery_id,
                operational_cost:order.operational_cost,
                total_distance:order.total_distance,
                driver_id:driver.driver_id,
                driver_name:driver.name,
                driver_fee :order.driver_fee,
                estimated_price:order.estimated_price,
                vehicle_id:driver.vehicle_id,
                vehicle_type:order.vehicle_type,
                pickup_date :order.pickup_date,
                pickup_id:order.pickup_id,
                pickup_address:pickup.address,
                pickup_lat : pickup.lat,
                pickup_lng :pickup.lng,
                pickup_detail:pickup.address_detail,
                pickup_instruction:pickup.instruction,
                pickup_receiver_name:pickup.name,
                pickup_recever_email:pickup.email,
                pickup_receiver_phone:pickup.contact,
                pickup_place_name:pickup.place_name,
                pickup_time:moment(pickup.early_time,'lll').unix(),
                pickup_late:moment(pickup.latest_hour,'lll').unix(),
                pickup_status:status,
                delivery_id:destination.id,
                delivery_address:destination.address,
                delivery_lat:destination.lat,
                delivery_lng:destination.lng,
                delivery_instruction:destination.instruction,
                delivery_receiver_name : destination.name,
                delivery_receiver_email:destination.email,
                delivery_receiver_phone:destination.contact,
                delivery_sku :destination.sku_driver,
                delivery_status:status
              };
              socket.emit("assignment:to:driver",data,function(err,response){
                if(err){
                  // console.log(response);
                }
                else{
                  $mdDialog.hide();
                  $mdToast.show($mdToast.simple().textContent("Assignment telah di berikan kepada "+driver.name).position("top").hideDelay(3000));
                }
              });

          });
    }
    else{
      var destination = job.delivery[0];
      data = {
        order_id:order.id,
        order_nod:order.nod,
        delivery_id:order.delivery_id,
        operational_cost:order.operational_cost,
        total_distance:order.total_distance,
        driver_id:driver.driver_id,
        driver_name:driver.name,
        driver_fee :order.driver_fee,
        estimated_price:order.estimated_price,
        vehicle_id:driver.vehicle_id,
        vehicle_type:order.vehicle_type,
        pickup_date :order.pickup_date,
        pickup_id:order.pickup_id,
        pickup_address:pickup.address,
        pickup_lat : pickup.lat,
        pickup_lng :pickup.lng,
        pickup_detail:pickup.address_detail,
        pickup_instruction:pickup.instruction,
        pickup_receiver_name:pickup.name,
        pickup_recever_email:pickup.email,
        pickup_receiver_phone:pickup.contact,
        pickup_place_name:pickup.place_name,
        pickup_time:moment(pickup.early_time,'lll').unix(),
        pickup_late:moment(pickup.latest_hour,'lll').unix(),
        pickup_status:status,
        delivery_id:destination.id,
        delivery_address:destination.address,
        delivery_lat:destination.lat,
        delivery_lng:destination.lng,
        delivery_instruction:destination.instruction,
        delivery_receiver_name : destination.name,
        delivery_receiver_email:destination.email,
        delivery_receiver_phone:destination.contact,
        delivery_sku :destination.sku_driver,
        delivery_status:status
      };
      socket.emit("assignment:to:driver",data,function(err,response){
        if(err){
          console.error(response);
        }
        else{
          $mdDialog.hide();
          // console.log(response);
          $mdToast.show($mdToast.simple().textContent("Assignment telah di berikan kepada "+driver.name).position("top").hideDelay(3000));
        }
      });

    }
  };
  setTimeout(function(){
    $scope.$digest();
  },400);
});



var markers = new Array();
var map,directionDisplay,directionService,stepDisplay ;
var searchBox,traffic,toggleTraffic;
var speed = 60; // km/h
var delay = 10;
var moving = new Array();
var startPos = [];
var originId ,destinationId;
var travelmode = "DRIVING";
var polylines=  [];
var turns = [];
var car = "M17.402,0H5.643C2.526,0,0,3.467,0,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759c3.116,0,5.644-2.527,5.644-5.644 V6.584C23.044,3.467,20.518,0,17.402,0z M22.057,14.188v11.665l-2.729,0.351v-4.806L22.057,14.188z M20.625,10.773 c-1.016,3.9-2.219,8.51-2.219,8.51H4.638l-2.222-8.51C2.417,10.773,11.3,7.755,20.625,10.773z M3.748,21.713v4.492l-2.73-0.349 V14.502L3.748,21.713z M1.018,37.938V27.579l2.73,0.343v8.196L1.018,37.938z M2.575,40.882l2.218-3.336h13.771l2.219,3.336H2.575z M19.328,35.805v-7.872l2.729-0.355v10.048L19.328,35.805z";


$(document).ready(function(){
  // if ('serviceWorker' in navigator) {
  //       navigator.serviceWorker
  //          .register('./sw.js')
  //          .then(function() { console.log('Service Worker Registered'); });
  // }
  $("conversation").hide();

    checkCookie();
    var html = '';
    var drivers= [];
    var positions = [];

    var lat = -6.249577;
    var long = 106.842778;
    $(".online-panel").on("click",function(){
        $(".online-list").slideToggle("slow");
    });
    $(".offline-panel").on("click",function(){
        $(".offline-list").slideToggle("slow");
    });
    $("#moving").on("click",function(){
        if(moving.length == 0){
           alert("Add point on map first");
           return;
        }
        else{
            startPos = moving[0];
            var latlng = {lat:moving[0][0],lng:moving[0][1]};
            var marker = new google.maps.Marker({
                position:latlng,
                map:map,
                icon:{
                    url:"icons/truck-red.png",
                    size: new google.maps.Size(60,80),
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(12,35),
                    scaledSize: new google.maps.Size(30,35)
                },
            });
            markers.push(marker);
            animateMarker(marker,moving,speed);
            // console.log("Moving ");
        }
    });



    $("#clear").on("click",function(){
        moving = [];
        neutralize();
        // console.log("Cleared");
    });
    $("#locate").on("click",function(){
        locating();
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
    var mapcanvas = document.getElementById('map');
    map = new google.maps.Map(mapcanvas,{
        zoom:8,
        center:new google.maps.LatLng(-6.248596, 106.843298),
        mapTypeId:google.maps.MapTypeId.ROADMAP,
        styles:maptheme
    });
    initSearchBox();
    new AutocompleteDirectionsHandler(map);
    // google.maps.event.addListener(map,"click",function(event){
    //     var latlng = {lat:parseFloat(event.latLng.lat()),lng:parseFloat(event.latLng.lng())};
    //     moving.push([parseFloat(event.latLng.lat()),parseFloat(event.latLng.lng())]);
    //     addMarker(latlng);
    // });

}

function locating(){
    console.log("Locatingg....");
    // $("#content").html("Locating...");
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

        map.setZoom(14);
        map.setCenter(coords);
        $("#content").html("Located");
        console.log("located");
        //markers.push(custom);
    });

}

function initSearchBox(){
    var trafficswitch = document.getElementById("traffic");
    var legend = document.getElementById("legends");
    var searchorder = document.getElementById("searchorder");
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(searchorder);
    map.controls[google.maps.ControlPosition.RIGHT_CENTER].push(legend);
    map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(trafficswitch);
    // map.addListener("bounds_changed",function(){
    //     searchBox.setBounds(map.getBounds());
    // });
    // searchBox.addListener("places_changed",function(){
    //     neutralize();
    //     var places = searchBox.getPlaces();
    //     if(places.length == 0) return;
    //     var bounds = new google.maps.LatLngBounds();
    //     places.forEach(function(place){
    //       console.log("Place:",place);
    //       console.log("Jalan:",place.formatted_address);
    //       console.log("Tempat",place.name);
    //         place.address_components.forEach(function(alamat){
    //           console.log("LEVEL:",alamat);
    //         });
    //         console.log(place.icon);
    //         addPlaceToMap(place);
    //         if(!place.geometry)console.log("No geometry");
    //         if(place.geometry.viewport){
    //             bounds.union(place.geometry.viewport);
    //         }
    //         else{
    //             bounds.extends(place.geometry.location);
    //         }
    //         map.fitBounds(bounds);
    //     });
    // });
}

function addPlaceToMap(place){
    if(!place.geometry)console.log("No Geometry");
    markers.push(new google.maps.Marker({
        position:place.geometry.location,
        map: map,
        draggable:true,
        title:place.name
    }).addListener("click",function(){
        var infowindow = new google.maps.InfoWindow({
            content:place.name
        });
        infowindow.open(map,this);
    }));
}

function addMarker(coords){
    markers.push(new google.maps.Marker({
        position:coords,
        map:map
    }));
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
    for(var j in polylines){
        try{
            polylines[j].setMap(null);
        }
        catch(err){
            polylines[j].f.setMap(null);
        }
    }
    for(var k in turns){
        try{
            turns[k].setMap(null);
        }
        catch(err){
            turns[k].f.setMap(null);
        }
    }
    polylines = [];
    turns = [] ;
    markers = [];

}

function animateMarker(marker, coords, km_h){
    var target = 0;
    var km_h = km_h || 50;
    coords.push([startPos[0], startPos[1]]);

    function goToPoint()
    {
        var lat = marker.position.lat();
        var lng = marker.position.lng();
        var step = (km_h * 1000 * delay) / 3600000; // in meters

        var dest = new google.maps.LatLng(
        coords[target][0], coords[target][1]);

        var distance =
        google.maps.geometry.spherical.computeDistanceBetween(
        dest, marker.position); // in meters

        var numStep = distance / step;
        var i = 0;
        var deltaLat = (coords[target][0] - lat) / numStep;
        var deltaLng = (coords[target][1] - lng) / numStep;

        function moveMarker()
        {
            lat += deltaLat;
            lng += deltaLng;
            i += step;

            if (i < distance)
            {
                marker.setPosition(new google.maps.LatLng(lat, lng));
                setTimeout(moveMarker, delay);
            }
            else
            {   marker.setPosition(dest);
                target++;
                if (target == coords.length){ target = 0; }

                setTimeout(goToPoint, delay);
            }
        }
        moveMarker();
    }
    goToPoint();
}

function AutocompleteDirectionsHandler(map) {
        this.map = map;
        this.originPlaceId = null;
        this.destinationPlaceId = null;
        this.travelMode = 'DRIVING';
        // var originInput = document.getElementById('from');
        // var destinationInput = document.getElementById('destination');
        var locateMe = document.getElementById("locate");
        var moving = document.getElementById("moving");
        var reset = document.getElementById("clear");
        this.directionsService = new google.maps.DirectionsService;
        this.directionsDisplay = new google.maps.DirectionsRenderer;
        this.directionsDisplay.setMap(map);
        //
        // var originAutocomplete = new google.maps.places.Autocomplete(
        //                             originInput, {placeIdOnly: true}
        //                         );
        // var destinationAutocomplete = new google.maps.places.Autocomplete(
        //                                 destinationInput, {placeIdOnly: true}
        //                                 );
        // this.setupPlaceChangedListener(originAutocomplete, 'ORIG');
        // this.setupPlaceChangedListener(destinationAutocomplete, 'DEST');
        // this.map.controls[google.maps.ControlPosition.TOP_CENTER].push(originInput);
        // this.map.controls[google.maps.ControlPosition.TOP_CENTER].push(destinationInput);
        this.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(locateMe);
        this.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(moving);
        this.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(reset);
}
AutocompleteDirectionsHandler.prototype.setupClickListener = function(id, mode) {
          var radioButton = document.getElementById(id);
          var me = this;
          radioButton.addEventListener('click', function() {
            me.travelMode = mode;
            me.route();
          });
        };

  AutocompleteDirectionsHandler.prototype.setupPlaceChangedListener = function(autocomplete, mode) {
          var me = this;
          autocomplete.bindTo('bounds', this.map);
          autocomplete.addListener('place_changed', function() {
            var place = autocomplete.getPlace();
            if (!place.place_id) {
              window.alert("Please select an option from the dropdown list.");
              return;
            }
            if (mode === 'ORIG') {
              me.originPlaceId = place.place_id;
            } else {
              me.destinationPlaceId = place.place_id;
            }
            me.route();
          });

        };

  AutocompleteDirectionsHandler.prototype.route = function() {
          if (!this.originPlaceId || !this.destinationPlaceId) {
            return;
          }
          var me = this;

          this.directionsService.route({
              origin: {'placeId': this.originPlaceId},
              destination: {'placeId': this.destinationPlaceId},
              travelMode: this.travelMode,
              provideRouteAlternatives:true,
              unitSystem :google.maps.UnitSystem.METRIC,
          }, function(response, status) {
              var bounds = new google.maps.LatLngBounds();
              turns= [];
              if (status === 'OK') {
                  for(var j in  polylines ) {
                      polylines[j].setMap(null);

                  }
                  for(var i = 0 ; i < response.routes.length ; i++){
  //                    me.directionsDisplay.setDirections(response);
  //                        new google.maps.DirectionsRenderer({
  //                        map: map,
  //                        directions: response,
  //                        routeIndex: i
  //                    });
                      if(i== 0){
                          // console.log(response.routes[i].legs);
                          response.routes[i].legs[i].steps.forEach(function(step){
                              step.lat_lngs.forEach(function(latlng){
                                 turns.push([latlng.lat(),latlng.lng()]);


                              });
                          });


                          var color = "#ff56f0";
                          var line = drawPolyline(response.routes[i].overview_path, color,6);
                          polylines.push(line);
                          google.maps.event.addListener(line,"bounds_changed",function(){
                              bounds = line.getBounds(bounds);
                          });
                          // console.log(line);
                          google.maps.event.addListener(line, 'click', function() {
                              // detect which route was clicked on
                              var index = polylines.indexOf(this);
                              highlightRoute(index);
                          });
                          var latlng = {lat:turns[0][0],lng:turns[0][1]};
                          var marker = new google.maps.Marker({
                              position:latlng,
                              map:map,
                              icon:{
                                  url:"icons/truck.png",
                                  size: new google.maps.Size(60,80),
                                  origin: new google.maps.Point(0, 0),
                                  anchor: new google.maps.Point(12,35),
                                  scaledSize: new google.maps.Size(30,35)
                              },
                          });
                          markers.push(marker);
                          animateMarker(marker,turns,100);
                      }
                      else{
                          var color = "#9c9c9e";
                          var line = drawPolyline(response.routes[i].overview_path, color,4);
                          polylines.push(line);
                          google.maps.event.addListener(line,"bounds_changed",function(){
                              bounds = line.getBounds(bounds);
                          });
                          google.maps.event.addListener(line, 'click', function() {
                              // detect which route was clicked on
                              var index = polylines.indexOf(this);
                              highlightRoute(index);
                          });
                      }

                  }

              }
              else {
                  window.alert('Directions request failed due to ' + status);
              }
          });
      };

function highlightRoute(index) {
            for(var j in  polylines ) {
                if(j==index) {
                    var color = '#ff56f0';
                }
                else {
                    var color = '#9c9c9e';
                }
                // console.log(polylines[index]);
                polylines[j].setOptions({strokeColor: color});
            }
}

function drawPolyline(path, color,stroke) {

            var line = new google.maps.Polyline({
                path: path,
                strokeColor: color,
                strokeOpacity: stroke > 3 ? 0.8 : 0.7,
                strokeWeight: stroke
            });
            line.setMap(map);
            return line;
}

function checkCookie() {
    var pid = getCookie("providerid");
    var user = getCookie("providername");
    if (user != "" && pid != "" ) {
        setCookie("providerid",pid,7);
        setCookie("providername",user,7);
        console.debug("cookies renewed");
    }
    else{
      window.location = "login";
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
	document.cookie = "providerid=";
  document.cookie = "providername=";
}
