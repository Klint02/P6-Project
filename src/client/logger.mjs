export default class logger {
    constructor (db) {
        
        this.db = db;
        this.hmm = "hmm"
        var sql = "SELECT EXISTS( SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_NAME LIKE 'logs')";
        this.db.query(sql, function(err, result) {
            if (err) {
                throw err;
            } else {
                if (result != 1) {
                    
                }
            }
        });

        
        /*
        this.db.query(sql, function(err, result) {
            if (err) {
                throw err;
            } else {
                if (result != 1) {
                    this.db.query("CREATE TABLE logs (timestamp TIMESTAMP(YYYY-MM-DD hh:mm:ss), message TEXT)"), function (err){
                        if (err) throw err;
                        console.log("Created Table 'logs'");
                    };
                }
            }
          })
          */
          
    }

    migrate_db(db_name) {

        console.log("[LOG] migrating DB");
        let db = this.db;
        let query_promise = new Promise(function(query_resolve, query_reject) {
                    db.query(`SELECT GROUP_CONCAT('DROP TABLE IF EXISTS ', table_name, ';') FROM information_schema.tables WHERE table_schema = '${db_name}'; `, function (err, result) {
            console.log("[LOG] Finding current tables");
            if (result[0]["GROUP_CONCAT('DROP TABLE IF EXISTS ', table_name, ';')"] === null) {
                query_resolve("[LOG] No tables to delete");
            } else {
                query_resolve(result[0]["GROUP_CONCAT('DROP TABLE IF EXISTS ', table_name, ';')"].split(','));
            }
            });
        })

        query_promise.then(
            function(value) { 
                if (typeof(value) != "string") {
                    value.array.forEach(sql_string => {
                        db.query(sql_string, function(err, result) {
                            if (err) throw err;
                        });                        
                    });

                } else {
                    console.log(value);
                }

            }
        )


        
        /*
        .on('result', function() {
            current_tables.forEach(sql_string => {
                console.log("bbababababbaba", sql_string);
                this.db.query(`${sql_string}`, function(error) {
                    console.log(result);
                });
            });
        })
        
        
        
        (sql_string => {
              console.log(sql_string);  
            });
        console.log("[LOG] Dropped all tables");
        */
        /*
        const tables = [
            "CREATE TABLE logs (timestamp TIMESTAMP, message TEXT)"
        ]
        tables.forEach((sql_string) => {
            this.db.query(sql_string, function (err) {
                if (err) throw err;
                console.log("[LOG] Created Table 'logs'");
    
            });
        })
*/
    }

    log (msg) {
        var sql = "INSERT INTO customers (name, address) VALUES ('Company Inc', 'Highway 37')";
    }
}