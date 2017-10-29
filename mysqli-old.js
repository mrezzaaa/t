"use strict";
var mysql = require('mysql');
var connection = mysql.createConnection({
  host:"",
  connectionLimit:10,
  user:"",
  password:"",
  database:"",
  connectTimeout: 10000
});

class mysqli{
  getDataWhere(table,where,callback){
    connection.connect();
    connection.query("Select * from "+table+" "+where+" ",function(err,rows,fields){

      if(!err){
        connection.end();
        return callback(null,rows);
      }
      else{
        connection.end();
        return callback(true,err);
      }

    });
  }

  updateDataWhere(table,newdata,where,callback){
    connection.connect();
    connection.query("update "+table+" set "+newdata+" "+where,function(err,result,fields){
      if(err){
        connection.end();
        return callback(true,err);
      }
      else{
        connection.end();
        return callback(null,result);
      }
    });
  }

  getAllData(table,callback){
    connection.connect();
    connection.query("Select * from "+table+"  ",function(err,rows,fields){
      if(!err){
        connection.end();
        return callback(null,rows);
      }
      else{
        connection.end();
        return callback(true,err);
      }
    });

  }

  insertToTable(table,data,callback){
    connection.connect();
    connection.query("insert into "+table+" set ?",data,function(err,rows){
      if(err){
        connection.end();
        return callback(true,err);
      }
      else{
        connection.end();
        return callback(null,rows);
      }
    });
  }

  deleteFromTable(table,data,callback){
    connection.connect();
    connection.query("delete from "+table+" where id= ?",data.id,function(err,rows){
      if(err){
        connection.end();
        return callback(true,err);
      }
      else{
        connection.end();
        return callback(null,rows);
      }
    });
  }
  getDataWithJoin(tableName,joins,callback){
    if(joins.length > 0){
      var joinstr = "";
      for(var i= 0;i< joins.length;i++){
        joinstr += "JOIN `"+joins[i].fromtable+"` on `"+joins[i].fromtable+"`.`"+joins[i].fromcolumn+"` = `"+joins[i].targettable+"`.`"+joins[i].targetcolumn+"` ";
      }
      connection.connect();
      connection.query("select * from `"+tableName+"` "+joinstr+" where `"+joins[0].wheretable+"`.`"+joins[0].wherecolumn+"`='"+joins[0].wheredata+"'",function(err,rows){
        if(err){
          connection.end();
          return callback(true,err);
        }
        else{
          connection.end();
          return callback(null,rows);
        }
      });

    }
    else{
      connection.connect();
      connection.query("select * from `"+tableName+"`",function(err,rows){
        connection.end();
          return callback(null,rows);
      });
    }
  }

}

module.exports = mysqli;
