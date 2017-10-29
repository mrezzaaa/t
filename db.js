"use strict";
var r = require('rethinkdb');
var async = require("async");
var host = "";
var port = 28015;
var password = "";
var db = "";
class dbs {
  setupDb(){
          var self = this;
          async.waterfall([
              function(callback){ ///Create new connection to DB server
                  self.connectToDbServer(function(err,connection){
                      if(err){
                          console.log(err);
                          return callback(true,"Failed connect to DB server");
                      }
                      else{
                          callback(null,connection);
                      }
                  });
              },
              function(connection,callback){ // If connected , Connect to DB . If DB not exist,create one.
                  r.dbCreate(dbs).run(connection,function(err,result){
                      if(err){
                          console.log("Database already set...");
                      }
                      else{
                          console.log("Creating new database logisthink");
                      }
                      callback(null,connection);
                  });
              },
              function(connection,callback){ /// If table not exist , create one
                  r.db(dbs).tableCreate("tracking").run(connection,function(err,result){
                      connection.close();
                      if(err){
                          console.log("Table already set... ");
                      }
                      else{
                          console.log("Table tracking created");
                      }
                      callback(null,"Database has been set");
                  });
              }

          ],function(err,data){
              console.log(data);
          });
      }

    connectToDbServer(callback){
        r.connect({
            host:host,
            port:port,
            password:password
        },function(err,connection){
            return callback(err,connection);
        });
    }

    connectToDb(callback){

        r.connect({
            host:host,
            port:port,
            password:password,
            db:db
        },function(err,connection){
            return callback(err,connection);
        });
    }

    insertToTable(tableName,data,callback){
        this.connectToDb(function(err,conn){
          r.table(tableName).insert(data).run(conn,function(err,result){
            if(err){
              return callback(true,err);
            }
            else{
              return callback(null,result);
            }
          });
        });
    }

    getAllData(tableName,callback){
      this.connectToDb(function(err,conn){
        r.table(tableName).run(conn,function(err,result){
          conn.close();
            if(err){
              return callback(true,err);
            }
            else{

              result.toArray(function(err,rows){
                  return callback(null,rows);
              });

            }
        });
      });
    }
    getFilteredFunctionData(tableName,field,filter,callback){
      this.connectToDb(function(err,conn){
        r.table(tableName).filter(function(str){
          return str(field).match(filter)
        }).run(conn,function(err,result){
          conn.close();
          if(err){
            return callback(true,err);
          }
          else{
            result.toArray(function(err,rows){
              return callback(null,rows);
            });
          }
        });
      });
    }
    getFilteredData(tableName,filter,callback){
      this.connectToDb(function(err,conn){
        r.table(tableName).filter(filter).run(conn,function(err,result){
          conn.close();
          if(err){
            return callback(true,err);
          }
          else{
            result.toArray(function(err,rows){
              return callback(null,rows);
            });
          }
        });
      });
    }

    getOrderedData(tableName,filter,order,limit,callback){
      this.connectToDb(function(err,conn){
        r.table(tableName).filter(filter).orderBy(order).limit(limit).run(conn,function(err,result){
          conn.close();
          if(err){
            return callback(true,err);
          }
          else{
            result.toArray(function(err,rows){
              return callback(null,rows);
            });
          }
        });
      });
    }

    updateData(tableName,data,filter,callback){
      this.connectToDb(function(err,conn){
        r.table(tableName).filter(filter).update(data).run(conn,function(err,result){
          conn.close();
            if(err){
              return callback(true,err);
            }
            else{
                return callback(null,result);
            }
        });
      });
    }
    streamData(tableName,filter,callback){
      this.connectToDb(function(err,conn){
        r.table(tableName).filter(filter).changes().run(conn,function(err,cursor){
          if(err){
            return callback(true,err);
          }
          else{
            cursor.each(function(err,rows){
              return callback(null,rows,cursor,conn);
            });
          }
        });
      });
    }

    streamAllData(tableName,callback){
      this.connectToDb(function(err,conn){
        r.table(tableName).changes().run(conn,function(err,cursor){
          if(err){
            return callback(true,err);
          }
          else{
            cursor.each(function(err,data){
              return callback(null,data);
            });
          }
        });
      });
    }

    clearData(tableName,filter,callback){
      this.connectToDb(function(err,conn){
        r.table(tableName).filter(filter).delete().run(conn,function(err,result){
          conn.close();
          if(err){
            return callback(true,err);
          }
          else{
            return callback(null,result);
          }
        });
      });
    }





}

module.exports = dbs;
