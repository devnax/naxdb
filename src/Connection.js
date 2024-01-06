const connections = new Map();
const mysql = require("./MysqlProxy/mysql");

module.exports = {
  initial: async () => {
    const config = require("../serverconfig");

    for (let host of config.hosts) {
      if (connections.has(host.host)) {
        continue;
      }
      try {
        const pool = mysql.createPool({
          connectionLimit: 10,
          host: host.host,
          user: host.user,
          password: host.password,
          waitForConnections: true,
          queueLimit: 0,
          charset: "utf8mb4",
          dateStrings: true,
          supportBigNumbers: true,
        });
        const promisePool = pool.promise();
        connections.set(host.host, promisePool);
      } catch (error) {
        console.log(error);
      }
    }
  },

  getConnections: () => connections,
  close: () => {
    connections.forEach((con) => {
      con.end();
    });
    connections.clear();
  },
};
