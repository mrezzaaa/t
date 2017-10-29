var express = require("express");
var helmet = require("helmet");
var app = express();
var p3p = require("p3p");
var r = require("rethinkdb");
var http = require("http");
var dbms = require("./mysqli");
var dbrs = require("./db");
var request = require("request");
var FCM = require("fcm-node");
var serverkey = "AAAAhViYmhc:APA91bHQdFyGXslC-TelDZzUAXMLsQCI1Df-oz41twSdjPIsC-cTeQ7DOmSrfYjv3rAGh0UcLOSoOBMuhF9E3aAhrX1qXEf0fOgqWjSZKwTIfXaqCXj535VTJYvNo8K_lkM4snUixP1p";
var fcm = new FCM(serverkey);
const https = require('https');
const fs = require('fs');
// var google = require('googleapis');
// var urlshortener = google.urlshortener('v1');
var GAPI = "AIzaSyBAvE45P0o02LXQfy6fSQUoluxgWQYPaCE";

// var fcm = require('fcm-node');
var env = "production";
// var env = "development";
var options ;
if(env == "production"){
   options = {
    key: fs.readFileSync('ssl/key_name.key'),
    cert: fs.readFileSync('ssl/__logisthink_id.crt'),
    ca : fs.readFileSync('ssl/__logisthink_id.ca-bundle')
  };
}
else{
   options = {
    key: fs.readFileSync('ssl/server.key'),
    cert: fs.readFileSync('ssl/server.crt')
  };
}


// SMS Gateway API
var Nexmo = require('nexmo');
var nexmoOpt = {
            // If true, log information to the console
            debug: true,
            // append info the the User-Agent sent to Nexmo
            // e.g. pass 'my-app' for /nexmo-node/1.0.0/4.2.7/my-app
            // appendToUserAgent: string,
            // Set a custom logger
            logger: {
              log: function() {},
              info: function() {},
              warn: function() {}
            }
          };
var nexmo = new Nexmo({
    apiKey: "35f6869f",
    apiSecret: "aed0a8bff8772462",
    applicationId: "Logisthink",
    privateKey: env == "production" ? fs.readFileSync("ssl/private.key"):fs.readFileSync("ssl/server.key"),
  }, nexmoOpt);



//  End sms gateway

var port = 85;
app.set('views', __dirname + '/tmp');
app.set('view engine', "pug");
app.engine('pug', require('pug').__express);
app.get("/", p3p(p3p.recommended),function(req, res){
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    res.removeHeader('Transfer-Encoding');
    res.removeHeader('X-Powered-By');
    res.render("index");
});
// app.use(function(req,res,next){
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next();
// });

app.get("/login",p3p(p3p.recommended),function(req,res){
  res.render("login");
});
app.get("/order",p3p(p3p.recommended),function(req,res){
  res.render("order");
});
app.get("/driverform",p3p(p3p.recommended),function(req,res){
  res.render("driverform");
});
app.get("/assignform",p3p(p3p.recommended),function(req,res){
  res.render("assignform");
});
app.get("/orderdetail",p3p(p3p.recommended),function(req,res){
  res.render("orderdetail");
});
app.get("/updateVehicle",p3p(p3p.recommended),function(req,res){
  res.render("updateVehicle");
});
app.get("/acceptjob",p3p(p3p.recommended),function(req,res){
  res.render("acceptjob");
});
app.get("/chat",p3p(p3p.recommended),function(req,res){
  res.render("chat");
});
app.get("/driver",p3p(p3p.recommended),function(req,res){
  res.render("driver");
});
app.get("/driverlogin",p3p(p3p.recommended),function(req,res){
  res.render("driverlogin");
});
app.get("/as-driver",p3p(p3p.recommended),function(req,res){
  res.render("as-driver");
});
app.get("/tracking/:id",p3p(p3p.recommended),function(req,res){
  res.render("tracking");
});
app.get('/robots.txt', function (req, res) {
    res.type('text/plain');
    res.send("User-agent: *\nDisallow: /");
});
app.use(helmet({
  frameguard: {
    action: 'deny'
  }
}))
app.disable("x-powered-by");
app.use(express.static(__dirname + '/public'));
//var io = require("socket.io").listen(app.listen(port));
var io = require("socket.io").listen(https.createServer(options,app).listen(port));
io.set("origins","*:*");
console.log("Listening with HTTPS on port "+port);
var mysqli = new dbms();
var rdb = new dbrs();
var socketList = [];
io.on("connection",function(socket){
    // initiate array connection
    socketList.push(socket.id);
    socketList[socket.id] = {id:socket.id,cursor:null,conn:null};
    socket.on("disconnect",function(socks){
      //handle disconnect event,terminate stream cursor
      console.log("SocketList disconnected",socketList[socket.id].id);
      if(socketList[socket.id].cursor){
        socketList[socket.id].cursor.close();
        socketList[socket.id].conn.close();
        delete socketList[socket.id];
        console.log("Cursor and conn closed , also removed for socketList["+socket.id+"]");
      }
      else{
        console.log("Error closing cursor,maybe cursor has no data");
      }
    });

    //provider section
    socket.on("join:channel:provider",function(namespace,callback){
      socket.join(namespace.channel);
      if(io.sockets.adapter.sids[socket.id][namespace.channel]){
        console.log("[Provider] Attaching connection room "+namespace.channel);
        rdb.streamData("chats","^"+namespace.channel,function(err,result,cursor,conn){
          socketList[socket.id] = {id:socket.id,cursor:cursor,conn:conn};
          if(result.new_val){
            var name = namespace.name;
            if(result.new_val.from != name){
              var to = result.new_val.channel;
              to = to.split(":")[0];
              io.to(socketList[socket.id].id).emit("unread",{"unread":"1",x:to,from:result.new_val.from,data:result.new_val});
            }
          }
        });
      }
    });
    socket.on("operator:login",function(data,callback){
      var respon;
      var where = " where email='"+data.email+"' and password='"+data.password+"'";
      var where2 = " where email='"+data.email+"'" ;
      var found ;
      mysqli.getDataWhere("provider",where,function(err,result){
        if(err){
          return callback(true,{"status":"ERROR","message":result});
        }
        else{
          try{
              if(result[0].id != null || result[0].id != undefined){
                return callback(null,{
                  "status":"OK",
                  "message":"success",
                  "providerid":result[0].id,
                  "name":result[0].name
                });
                }
          }
        catch(err){
          mysqli.getDataWhere("provider",where2,function(err,results){
              if(results.length > 0){
                return callback(null,{
                  "status":"FAILED",
                  "message":"Password salah",
                  "providerid":null,
                  "name":null
                });
              }
              else{
                return callback(null,{
                  "status":"FAILED",
                  "message":"User tidak ditemukan",
                  "providerid":null,
                  "name":null,
                });
              }
            });
          }
        }
      });
    });
    socket.on("assignment:update",function(data,callback){
      // console.log("data update:",data);
      var d = new Date();
      var cy = d.getFullYear();
      var cm = d.getMonth();
      var cd = d.getDate();
      var ch = ("00"+d.getHours()).slice(-2);
      var cms = ("00"+d.getMinutes()).slice(-2);
      var cs = ("00"+d.getSeconds()).slice(-2);
      var time = cy+"-"+cm+"-"+cd+" "+ch+":"+cms+":"+cs;
      if(data.driver_id != null){
        var filter = {"order_id":data.data.order_id};
        rdb.updateData("order",data.data,filter,function(err,result){
          if(err){
            return callback(true,result);
          }
          else{
            var where = " where id='"+data.data.order_id+"'";
            var where2 =" where id='"+data.data.delivery_id+"'";
            var where3 =" where id='"+data.data.pickup_id+"'";
            if(data.data.delivery_status == "in-delivery"){
              var surl = "";
              var opt = {
                url:"https://www.googleapis.com/urlshortener/v1/url?fields=id%2Ckind%2ClongUrl%2Cstatus&key="+GAPI,
                method:"POST",
                json:{
                  "longUrl": "https://operator.logisthink.id/tracking/"+data.data.order_id
                },
                headers:{
                  "Content-Type":"application/json"
                }
              };
              var index = data.data.delivery_receiver_phone.indexOf("0");
              if(index == 0){
                var rcpt = data.data.delivery_receiver_phone.substr("0",index)+"62"+data.data.delivery_receiver_phone.substr(index+1,data.data.delivery_receiver_phone.length);
              }
              else{
                var rcpt = data.data.delivery_receiver_phone;
              }
              request(opt,function(err,res,body){
                if (res && (res.statusCode === 200 || res.statusCode === 201)) {
                  console.log("Body",body);
                  surl = body.id;
                  // nexmo.message.sendSms("Logisthink",rcpt,"Pesanan anda siap dikirimkan hari ini.Terima kasih sudah mempercayakan belanja di Mitra 10 Bogor.Klik link berikut untuk melacak pesanan anda "+surl,nexmoOpt,function(cb){
                  //     console.log("Sms sent");
                  // });
                }
                else if(err){
                  console.log("Error GAPI Shortener:",err);
                }
                else{
                  console.log("Res",res);
                }
              });
              // var url = "https://api.clxcommunications.com/xms/v1/insthinkin12/batches";
              // var index = data.data.delivery_receiver_phone.indexOf("0");
              // if(index == 0){
              //   var rcpt = [data.data.delivery_receiver_phone.substr("0",index)+"+62"+data.data.delivery_receiver_phone.substr(index+1,data.data.delivery_receiver_phone.length)];
              // }
              // else{
              //   var rcpt = [data.data.delivery_receiver_phone];
              // }
              //
              // var msg = "Kiriman paket sedang menuju tempat anda. Buka link https://goo.gl/dLJK5F untuk melacak langsung. Masukan order id: "+data.data.order_id;
              // var opt = {
              //   url:url,
              //   method:"POST",
              //   json:{
              //     from:"Logisthink",
              //     to:rcpt,
              //     body:msg
              //   },
              //   headers:{
              //     "Content-Type":"application/json",
              //     "Authorization":"Bearer ed3880f70e5d4154b156c6f69cb701fc"
              //   }
              // };
              // request(opt,function(err,res,body){
              //   if (res && (res.statusCode === 200 || res.statusCode === 201)) {
              //     // console.log("Body",body,res);
              //   }
              //   else if(err){
              //     console.log("Error CMX:",err);
              //   }
              //   else{
              //     // console.log("Res",res);
              //   }
              //
              // });
            }

            mysqli.updateDataWhere("`order`","status='"+data.data.order_status+"',driver_id='"+data.driver_id+"',vehicle_id='"+data.data.vehicle_id+"' , verification_accept_job_time='"+data.data.verification_accept_job_time+"',update_date='"+time+"' ",where,function(err,result){
                  if(err){
                    return callback(true,result);
                  }
            });
            mysqli.updateDataWhere("pickup_detail","verification_pickup_time='"+data.data.verification_pickup_time+"',update_date='"+time+"' ",where3,function(err,result){
                  if(err){
                    return callback(true,result);
                  }
            });
            if(data.data.delivery_status == 'completed'){
            mysqli.updateDataWhere("delivery_detail","status='"+data.data.delivery_status+"' ,pod_image='"+data.data.delivery_detail.image+"', pod_by='"+data.data.delivery_detail.received_by+"' ,verification_delivered_time='"+data.data.verification_delivered_time+"' , update_date='"+time+"'",where2,function(err,result){
                  if(err){
                    return callback(true,result);
                  }
            });
            io.to(data.data.order_id.split("-")[0]).emit("updated:list:order",data);
            return callback(null,{"status":"success"});
            }
          else{
            mysqli.updateDataWhere("delivery_detail","status='"+data.data.delivery_status+"' ,pod_image='"+data.data.delivery_status+"', pod_by='"+data.data.delivery_status+"' , verification_delivered_time='"+data.data.verification_delivered_time+"',update_date='"+time+"'",where2,function(err,result){
                  if(err){
                    return callback(true,result);
                  }
            });
            io.to(data.data.order_id.split("-")[0]).emit("updated:list:order",data);
            return callback(null,{"status":"success"});
          }
            }
        });

      }
      else{
          return callback(true,{"status":"No driver id"});
      }
    });
    socket.on("assignment:get:list",function(data,callback){
      var filter = {driver_id:data.driver_id};
      rdb.getFilteredData("order",filter,function(err,result){
        if(err){
          return callback(true,result);
        }
        else{
          return callback(null,result);
        }
      });
    });
    socket.on("update:driver:vehicle",function(data,callback){
      var where = " where id='"+data.driver_id+"'";

      mysqli.updateDataWhere("driver","vehicle_id='"+data.vehicle_id+"'",where,function(err,result){
        if(err){
          return callback(true,err);
        }
        else{
          rdb.updateData("driver",{vehicle_id:data.licenseplate},{driver_id:data.driver_id},function(err,res){
            if(err){
              return callback(true,err);
            }
            else{
              io.to(data.driver_id).emit("vehicle:update",data);
              return callback(null,{"message":"Driver "+data.driver_id+" updated with vehicle "+data.licenseplate});
            }
          });
        }
      });
    });
    socket.on("get:allvehicle",function(data,callback){
      var where = " where provider_id='"+data+"' ";
      mysqli.getDataWhere("vehicle",where,function(err,result){
        if(err){
          return callback(true,err);
        }
        else{
          return callback(null,result);
        }
      });
    });
    socket.on("assignment:to:driver",function(data,callback){
      if(data.driver_id == null){
          return callback(true,{status:"No driver_id received"});
      }
      else{
          rdb.insertToTable("order",data,function(err,result){
            if(err){
              return callback(true,result);
            }
            else{
              // rdb.updateData("driver",{"status":"onduty"},{"driver_id":data.driver_id},function(err,result){
                if(err){
                  console.log("Failed setting status onduty for driver_id:"+data.driver_id);
                  return callback(true,{"status":"Assignment Failed"});
                }
                else{
                  rdb.getFilteredData("driver",{driver_id:data.driver_id},function(err,results){
                    console.log("Results :",results);
                    results = results[0];
                    var notification={
                        "data":{
                          "body":data.pickup_address.split(",")[data.pickup_address.split(",").length -4 ]+" -> " + data.delivery_address.split(",")[data.delivery_address.split(",").length -4 ],
                          "title":"Pengiriman baru",
                          "icon":"icon-app-alpha.png",
                          "badge":"icon-app-alpha.png",
                          "click_action":"/",
                          "actions":"buka"
                        },
                        notification:{
                          title:"Pengiriman baru",
                          body:data.pickup_address.split(",")[data.pickup_address.split(",").length -4 ]+" -> " + data.delivery_address.split(",")[data.delivery_address.split(",").length -4 ],
                          sound:"default",
                          click_action:"FCM_PLUGIN_ACTIVITY"
                        },
                        icon:"icon-app-alpha.png",
                        priority:"high",
                        restricted_package_name:"",
                        collapse_key:"Collapse key",
                        to:results.fcm,
                        registration_id:results.fcm
                      }


                    fcm.send(notification,function(err,response){
                      if(err){
                        console.log("FCM failed :",err);
                      }
                      else{
                        console.log("FCM OK:",response);
                        console.log("Notification sent to "+results.name);
                        console.log("With FCM:"+results.fcm);
                      }
                    });
                  });
                  console.log("Driver id:"+data.driver_id+ " has been set to onduty");
                }
              // });
              return callback(null,{status:"Assignment complete"});
            }
          });

          io.to(data.driver_id).emit("job:assigned",data);

      }
    });
    socket.on("order:destination",function(data,callback){
      var join1 = [{
        fromtable:"delivery_detail",
        fromcolumn:"order_id",
        targettable :"order",
        targetcolumn:"id",
        wheretable:"order",
        wherecolumn:"id",
        wheredata:data.id
      }];
      var pickup = [];
      mysqli.getDataWithJoin("order",join1,function(err,result){
        pickup = {"delivery":result};
        return callback(null,pickup);
      });
    });
    socket.on("order:tracking",function(data,callback){
      var where = " where `id`='"+data.orderid+"'";
      var driverid = null;
      mysqli.getDataWhere("`order`",where,function(err,result){
        if(err){
          return callback(true,result);
        }
        else{
          if( typeof result[0] != "undefined") {
            if(result[0].status == "completed"){
                return callback(null,{"status":"completed"});
            }
            else{
              driverid = result[0].driver_id;
              rdb.getFilteredData("driver",{"driver_id":driverid},function(err,results){
                rdb.getFilteredData("order",{"order_id":data.orderid},function(err,order){
                callback(null,results,result,{orderdata:order});

                });
              });
              rdb.streamData("driver",{"driver_id":driverid},function(err,res){
                socket.emit("tracking:data",res.new_val);
              });
            }
          }
          else{
            if(typeof result[0] =="undefined"){
                return callback(null,{"status":"Not Found"});
            }
            else{
              driverid = result[0].driver_id;
              rdb.getFilteredData("driver",{"driver_id":driverid},function(err,results){
                rdb.getFilteredData("order",{"order_id":data.orderid},function(err,order){
                callback(null,results,result,{orderdata:order});

                });
              });
              rdb.streamData("driver",{"driver_id":driverid},function(err,res){
                socket.emit("tracking:data",res.new_val);
              });
            }
          }


        }
      });
    });
    socket.on("order:pickup",function(data,callback){
      var join1 = [{
        fromtable:"pickup_detail",
        fromcolumn:"order_id",
        targettable :"order",
        targetcolumn:"id",
        wheretable:"order",
        wherecolumn:"id",
        wheredata:data.id
      }];
      var pickup = [];
      mysqli.getDataWithJoin("order",join1,function(err,result){
        pickup = {"pickup":result};
        return callback(null,pickup);
      });
    });
    socket.on("order:get",function(id,callback){
          mysqli.getDataWhere("`order`"," where provider_id='"+id+"'" ,function(err,result){
            if(err){
              return callback(true,result);
            }
            else{
              var filter = {"provider_id":id};
              return callback(null,result);
            }
          });
    });
    socket.on("driver:all",function(data,callback){
      var filter = {"provider_id": data.provider_id};
      rdb.getFilteredData("driver",filter,function(err,data){
        if(err){
          return callback(true,err);
        }
        else{
          callback(null,data);
          // rdb.streamAllData("driver",function(err,result){
          //     socket.emit("driver:data",result.old_val,result.new_val);
          // });
        }
      });
    });
    socket.on("clear:tracking",function(callback){
        rdb.clearData("tracking",function(err,result){
          if(err){
            callback(true,result);
          }
          else{
            callback(null,result);
          }
        });
    });
    socket.on("track:driver",function(data,callback){
      var filter = {"vehicle_id":data.vehicle_id};
      rdb.getFilteredData("driver",filter,function(err,result){
        if(err){
          return callback(true,result);
        }
        else{
          rdb.streamData("driver",filter,function(err,res){
            socket.emit("tracking:data",res);
          });
           callback(null,result);

        }
      });
    });
    socket.on("request:tracking",function(data){
      if(data == null){
        rdb.getAllData("tracking",function(err,result){
          //console.log(result);
          socket.emit("tracking:data",result);
        });
      }
      else{
        var filter = {order_id:data.order_id};
        rdb.streamData("tracking",filter,function(err,result){
          socket.emit("tracking:data",result);
        });
      }

    });
    socket.on("report:order:insert",function(data,callback){
      // kalo ada orderan baru dari client masukin ke mysql & rethinkdb
      rdb.insertToTable("order",data,function(err,res){
        if(err){
          return callback(true,err);
        }
        else{
          return callback(null,res);
        }
      });

    });

    //end provider section


    // chat section
    socket.on("newchat",function(channel,callback){
      rdb.getFilteredData("channel",channel,function(err,results){
        console.log("Querying channel "+channel.channel);
        if(Object.keys(results).length === 0){
          console.log("No channel "+channel.channel);
          rdb.insertToTable("channel",channel,function(err,result){
            console.log("Creating channel "+channel.channel);
            if(err){
              console.log("Failed create channel "+channel.channel);
              return callback(true,{error:"Failed to create new channel"});
            }
            else{
              console.log("Success create channel "+channel.channel,result);
              return callback(null,{"success":"New channel has been created",channelid:result.generated_keys[0]});
            }
          });
        }
        else{
          console.log("Channel exist "+channel.channel);
          return callback(null,{"success":"Channel is exist","channelid":results[0].id});
        }
      });
    });
    socket.on("getChannel",function(channel,callback){
        rdb.getFilteredFunctionData("channel","channel",channel,function(err,result){
          return callback(result);
        });
    });
    socket.on("getUserData",function(id,callback){
      mysqli.getDataWhere("driver"," where id ='"+id+"' ",function(err,result){
        var data;
        result.forEach(function(user){
          data = {
            id:user.id,
            name:user.name,
            phone:user.phone,
            providerid:user.provider_id
          };
        });
        return callback(data);
      });
    });
    socket.on("getLastChat",function(channel,callback){
      rdb.getOrderedData("chats",{channel:channel},"-timestamp",1,function(err,result){
        return callback(err,result);
      });
    });
    socket.on("getConversation",function(channel,callback){
      rdb.getFilteredData("chats",{channel:channel},function(err,result){
        return callback(err,result);
      });
    });
    socket.on("sendchat",function(data,callback){
      rdb.insertToTable("chats",data,function(err,result){
        if(err){
          return callback(true,result);
        }
        else{
          return callback(null,result);
        }
      });
    });
    socket.on("clearchat",function(data,callback){
      rdb.clearData("chats",data,function(err,result){
        if(err){
          console.log("error delete");
          return callback(true,err);
        }
        else{
          console.log("success delete");
          return callback(null,result);
        }
      });
    });

    // end chat section

    // driver section
    socket.on("driver:getdetail",function(data,callback){
      var where = " where id='"+data.driverid+"' ";
      mysqli.getDataWhere("driver",where,function(err,result){
        if(err){
          return callback(true,{status:"error",message:"Failed get driver detail"});
        }
        else{
          var driver = result[0];
          delete driver.password;
          delete driver.provider_id;
          delete driver.secret_key;
          delete driver.registered_date;
          delete driver.address;
          delete driver.type;
          delete driver.created_date;
          delete driver.update_date;
          delete driver.delete_date;

          return callback(null,result[0]);
        }
      });
    });
    socket.on("driver:login",function(data,callback){
      var respon;
      var where = "  where phone='"+data.phone+"' and password='"+data.password+"' ";
      var where2 = " where phone='"+data.phone+"'" ;
      var found ;
      mysqli.getDataWhere("driver",where,function(err,result){
        if(err){
          return callback(true,{"status":"ERROR","message":result});
        }
        else{
          try{
              if(result[0].id != null || result[0].id != undefined){
                var wherevehicle = " where id='"+result[0].vehicle_id+"'";
                mysqli.getDataWhere("vehicle",wherevehicle,function(err,vehicle){

                  return callback(null,{
                    "status":"OK",
                    "message":"success",
                    "driverid":result[0].id,
                    "imageurl":result[0].img_url,
                    "drivername":result[0].name,
                    "provider_id":result[0].provider_id,
                      "vehicle_id":Object.keys(vehicle).length == 0 ? "Mobil belum di assign" : vehicle[0].licenseplate
                  });
                });
                }
          }
        catch(err){
          mysqli.getDataWhere("provider",where2,function(err,results){
              if(results.length > 0){
                return callback(null,{
                  "status":"FAILED",
                  "message":"Password salah",
                  "providerid":null,
                  "name":null
                });
              }
              else{
                return callback(null,{
                  "status":"FAILED",
                  "message":"User tidak ditemukan",
                  "providerid":null,
                  "name":null,
                });
              }
            });
          }
        }
      });
    });
    socket.on("join:channel",function(namespace,callback){
      if(!io.sockets.adapter.sids[socket.id][namespace.channel]){
        socket.join(namespace.channel);
        console.log("[Driver] Attaching connection room "+namespace.channel);
        rdb.streamData("chats","^"+namespace.channel,function(err,result,cursor,conn){
          socketList[socket.id] = {id:socket.id,cursor:cursor,conn:conn};
          if(result.new_val){
            var name = namespace.name;
            if(result.new_val.from != name){
              var to = result.new_val.channel;
              console.log("Sending to [DRIVER] "+socket.id);
              io.to(socketList[socket.id].id).emit("unread",{"unread":"1",x:to,from:result.new_val.from,data:result.new_val});

            }
          }
        });
      }
      else{
        console.log("[Driver] Namespace already exist");
      }
      console.log("Sids ",socketList[socket.id]);
    });
    socket.on("driver:assignment",function(room,callback){

        if(socket.join(room)){
          return callback(null,{status:"successfully joining you to room "+room});
        }
        else{
          return callback(true,{status:"Failed to joining to room"});
        }

    });
    socket.on("driver:location",function(data,callback){
        var filter = {"driver_id":data.id};
        rdb.getFilteredData("driver",filter,function(err,result){
          if(result.length == 0){

            var newdata = {
              "driver_id":data.id,
              "name":data.name,
              "fcm":data.fcm == "undefined" ? "-":data.fcm,
              "lat":data.lat,
              "lng":data.lng,
              "status":data.status,
              "provider_id":data.provider_id,
              "vehicle_id":data.vehicle_id,
              "timestamp":data.timestamp
            };
            console.log("inserting new driver");
            rdb.insertToTable("driver",newdata,function(err,result){
              if(err){
                // console.log("inserting new driver error");
                //  callback(true,result);
              }
              else{
                // console.log("inserting new driver success");
                //  callback(null,result);
              }
            });
          }
          else{
            var newdata = {
              "driver_id":data.id,
              "name":data.name,
              "fcm":data.fcm == "undefined" ? "" :data.fcm,
              "lat":data.lat,
              "lng":data.lng,
              "status":data.status,
              "provider_id":data.provider_id == "undefined" ? "" : data.provider_id,
              "vehicle_id":data.vehicle_id,
              "timestamp":data.timestamp
            };
            rdb.updateData("driver",newdata,filter,function(err,result){
                if(err){
                  // console.log("updating driver location error");
                  //  callback(true,result);
                }
                else{
                  //  console.log("updating driver location success");
                  //  callback(null,result);
                }
            });
          }
        });
    });
    socket.on("driver:deletedriver",function(data,callback){
      mysqli.deleteFromTable("driver",data,function(err,result){
        if(err){
          console.log(result);
          return callback(true,result);
        }
        else{
          return callback(null,result);
        }
      });
    });
    socket.on("driver:addnew",function(data,callback){
      mysqli.insertToTable("driver",data,function(err,result){
        if(err){
          console.log(result);
          return callback(true,result);
        }
        else{
          return callback(null,result);
        }
      });
    });
    socket.on("request:driver:mysql",function(callback){
      mysqli.getAllData("driver",function(err,data){
        if(err){
          return callback(true,data);
        }
        else{
          return callback(null,data);
        }
      });
    });
    socket.on("report:order:update",function(data,callback){
      //rubah data ke mysql jadi berdasarkan status dari driver , diambil / ontheway / delivered / on progress
      rdb.updateData("order",data,filter,function(err,result){
        if(err){
          return callback(true,err);
        }
        else{
          return callback(null,result);
        }
      });


      //rubah juga data di rethinkdb berdasarkan status dari driver
    });
    socket.on("report:order:insert",function(data,callback){
      //insert ke mysql


      //insert ke rethink
      rdb.insertToTable("order",data,function(err,result){
        if(err){
          return callback(true,err);
        }
        else {
          return callback(null,result);
        }
      });

    });
    socket.on("report:location:update",function(data,callback){
      //kondisi ketika supir sudah pernah ke tracking,tinggal update location position,order
      var filter = {order_id:data.order_id};
      rdb.updateData("tracking",data,filter,function(err,result){
        if(err){
          return callback(true,err);
        }
        else {
          return callback(null,result);
        }
      });
    });
    socket.on("report:location:insert",function(data,callback){
      //kondisi ketika supir baru belom pernah ke tracking
      rdb.insertToTable("tracking",data,function(err,result){
        if(err){
          return callback(true,err);
        }
        else {
          return callback(null,result);
        }
      });
    });
    // end driver section


});



var hasOwnProperty = Object.prototype.hasOwnProperty;

function isEmpty(obj) {

    // null and undefined are "empty"
    if (obj == null) return true;

    // Assume if it has a length property with a non-zero value
    // that that property is correct.
    if (obj.length > 0)    return false;
    if (obj.length === 0)  return true;

    // If it isn't an object at this point
    // it is empty, but it can't be anything *but* empty
    // Is it empty?  Depends on your application.
    if (typeof obj !== "object") return true;

    // Otherwise, does it have any properties of its own?
    // Note that this doesn't handle
    // toString and valueOf enumeration bugs in IE < 9
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }

    return true;
}

/*
socket ready list:
  socket.on("report:location:insert")
  socket.on("report:location:update")
  socket.on("report:order:insert")
  socket.on("report:order:update")
  socket.on("request:tracking")
  socket.emit("tracking:data")

*/
