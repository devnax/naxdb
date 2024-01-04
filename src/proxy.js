const mysql = require("./mysql");

const proxy = function ({
  db_host,
  db_port,
  db_user,
  db_password,
  pool,
  hold_connection,
}) {
  const db = mysql.createPool({
    host: db_host,
    port: db_port,
    user: db_user,
    password: db_password,
    database: "maindb",
    waitForConnections: true,
    connectionLimit: pool,
    queueLimit: 0,
  });

  const db_getConnection = () => {
    return new Promise((resolve, reject) => {
      if (!hold_connection) {
        resolve(null);
      } else {
        db.getConnection(function (err, conn) {
          if (err) reject(err);
          else resolve(conn);
        });
      }
    });
  };

  const db_releaseConnection = (conn) => {
    if (conn) db.releaseConnection(conn);
  };

  const onQuery = (query, conn) => {
    return new Promise((resolve, reject) => {
      if (!query) {
        reject();
        return;
      }

      (conn || db).query(query, function (err, ...result) {
        if (err) {
          console.warn("[ERROR]", err.message);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  };

  return {
    onQuery,
    db: {
      getConnection: db_getConnection,
      releaseConnection: db_releaseConnection,
    },
  };
};

module.exports = proxy;
