exports.process = function (command, onResult) {
    
    var end = function (result) {
        try {
            if (db) db.detach();
            onResult(result);
        }
        catch (e) {
        }
    }
    
    var onError = function (message) {
        end({ success: false, notice: message });
    }
    
    try {
        var connect = function () {
            Firebird.attach(options, function (error, db1) {
                db = db1;
                if (error) onError(error.message);
                else onConnect();
            });
        }
        
        var query = function (queryString) {
            db.query(queryString, undefined, function (error, recordset) {
                if (error) onError(error.message);
                else onQuery(recordset);
            });
        }
        
        var onConnect = function () {
            if (command.queryString) query(command.queryString);
            else end({ success: true });
        }
        
        var onQuery = function (recordset) {
            var columns = [];
            var rows = [];
            var isColumnsFill = false;
            for (var recordIndex in recordset) {
                var row = [];
                for (var columnName in recordset[recordIndex]) {
                    if (!isColumnsFill) columns.push(columnName);
                    if (recordset[recordIndex][columnName] instanceof Uint8Array) {
                        var value = "";
                        for (var index = 0; index < recordset[recordIndex][columnName].length; index++) {
                            value += String.fromCharCode(recordset[recordIndex][columnName][index]);
                        }
                        recordset[recordIndex][columnName] = value;
                    }
                    row.push(recordset[recordIndex][columnName]);
                }
                isColumnsFill = true;
                rows.push(row);
            }
            
            end({ success: true, columns: columns, rows: rows });
        }
        
        var getConnectionStringInfo = function (connectionString) {
            var info = { host: "localhost", port: "3050" };
            
            for (var propertyIndex in connectionString.split(";")) {
                var property = connectionString.split(";")[propertyIndex];
                if (property) {
                    var match = property.split("=");
                    if (match && match.length >= 2) {
                        match[0] = match[0].trim().toLowerCase();
                        match[1] = match[1].trim();
                        
                        switch (match[0]) {
                            case "server":
                            case "host":
                            case "location":
                                info["host"] = match[1];
                                break;

                            case "port":
                                info["port"] = match[1];
                                break;

                            case "database":
                            case "data source":
                                info["database"] = match[1];
                                break;

                            case "uid":
                            case "user":
                            case "user id":
                                info["userId"] = match[1];
                                break;

                            case "pwd":
                            case "password":
                                info["password"] = match[1];
                                break;

                            case "charset":
                                info["charset"] = match[1];
                                break;
                        }
                    }
                }
            }
            
            return info;
        };
        
        var Firebird = require('node-firebird');
        command.connectionStringInfo = getConnectionStringInfo(command.connectionString);
        
        var options = {
            host: command.connectionStringInfo.host,
            port: command.connectionStringInfo.port,
            database: command.connectionStringInfo.database,
            user: command.connectionStringInfo.userId,
            password: command.connectionStringInfo.password,
            charset: command.connectionStringInfo.charset,
        };

        connect();
        var db;
        
    }
    catch (e) {
        onError(e.stack);
    }
}