"use strict";
var mysql = require('mysql');
var pool  = mysql.createPool({
    connectionLimit : 10, //important
    host     : '',
    user     : '',
    password : '',
    database : '',
    debug    :  false
});


class mysqli{
  connect(callback){
    pool.getConnection(function(err,connection){
      if(err){
        console.log(err);
        return callback(true,err);
      }
      else{
        return callback(null,connection);
      }
    });
  }

  getDataWhere(table,where,callback){
    this.connect(function(err,connection){
          connection.query("Select * from "+table+" "+where+" ",function(err,rows,fields){

            if(!err){
              connection.release();
              return callback(null,rows);
            }
            else{
              connection.release();
              return callback(true,err);
            }

          });
    });
  }

  updateDataWhere(table,newdata,where,callback){
    this.connect(function(err,connection){
        connection.query("update "+table+" set "+newdata+" "+where,function(err,result,fields){
          if(err){
            connection.release();
            return callback(true,err);
          }
          else{
            connection.release();
            return callback(null,result);
          }
        });
    });
  }

  getAllData(table,callback){
    this.connect(function(err,connection){
      connection.query("Select * from "+table+"  ",function(err,rows,fields){
        if(!err){
          connection.release();
          return callback(null,rows);
        }
        else{
          connection.release();
          return callback(true,err);
        }
      });
    });

  }

  insertToTable(table,data,callback){
    this.connect(function(err,connection){
        connection.query("insert into "+table+" set ?",data,function(err,rows){
          if(err){
            connection.release();
            return callback(true,err);
          }
          else{
            connection.release();
            return callback(null,rows);
          }
        });
      });
  }

  deleteFromTable(table,data,callback){
    this.connect(function(err,connection){
        connection.query("delete from "+table+" where id= ?",data.id,function(err,rows){
          if(err){
            connection.release();
            return callback(true,err);
          }
          else{
            connection.release();
            return callback(null,rows);
          }
        });
      });
  }
  getDataWithJoin(tableName,joins,callback){
    if(joins.length > 0){
      var joinstr = "";
      for(var i= 0;i< joins.length;i++){
        joinstr += "JOIN `"+joins[i].fromtable+"` on `"+joins[i].fromtable+"`.`"+joins[i].fromcolumn+"` = `"+joins[i].targettable+"`.`"+joins[i].targetcolumn+"` ";
      }
      this.connect(function(err,connection){
          connection.query("select * from `"+tableName+"` "+joinstr+" where `"+joins[0].wheretable+"`.`"+joins[0].wherecolumn+"`='"+joins[0].wheredata+"'",function(err,rows){
            if(err){
              connection.release();
              return callback(true,err);
            }
            else{
              connection.release();
              return callback(null,rows);
            }
          });
        });

    }
    else{
      this.connect(function(err,connection){
          connection.query("select * from `"+tableName+"`",function(err,rows){
            connection.release();
              return callback(null,rows);
          });
        });
    }
  }


}
module.exports = mysqli;
