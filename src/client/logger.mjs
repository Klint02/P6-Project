export default class logger {
    constructor (db) {
        
        this.db = db;
   
    }

    migrate_db(db_name) {
        const tables = [
            "CREATE TABLE logs (timestamp TIMESTAMP, type VARCHAR(10), message TEXT)"
        ]
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
                    //MySQL will be run out of order unless this is a promise
                    let table_deletion_promise = new Promise(function(query_resolve, query_reject) {
                        value.forEach(sql_string => {
                            db.query(sql_string, function(err, result) {
                                if (err) throw err;
                                console.log(`[LOG] ran sql "${sql_string}"`);
                            });                        
                        });
                        query_resolve("done");
                    });
                    
                    table_deletion_promise.then(
                        function(value) {
                            tables.forEach((sql_string) => {
                                db.query(sql_string, function (err) {
                                    if (err) throw err;
                                    console.log(`[LOG] Created Table with ${sql_string}`);
                        
                                });
                            })
                        }
                    )

                } else {
                    console.log(value);
                    //MySQL does not need to be a promise here, because the database is empty
                    tables.forEach((sql_string) => {
                        db.query(sql_string, function (err) {
                            if (err) throw err;
                            console.log(`[LOG] Created Table with ${sql_string}`);
                
                        });
                    })
                }

            }
        )
    }

    log(type, msg) {
        var sql = "INSERT INTO logs (timestamp, type, message) VALUES (?, ?, ?)" ;
        const timestamp = new Date(Date.now()).toISOString().slice(0, 19).replace('T', ' ');
        try {
            this.db.query(sql, [timestamp, type, msg], function (err) {
                if (err) console.log(err);
            });
        } catch (error) {
            console.log("[ERROR] Failed to insert log into database ")
            console.log(error)
        }
        
    }

    async generic_SQL(statement, values) {
        let db = this.db;
        let query_promise = new Promise(function(query_resolve, query_reject) {
            if (values === undefined) {
                db.query(statement, function (err, result) {
                    if (err) throw err;
                    query_resolve(result);
                });
            } else {
                db.query(statement, values, function (err, result) {
                    if (err) throw err;
                    query_resolve(result);
                });
            }
        });
        let result = await query_promise;
        return result;
    }
}