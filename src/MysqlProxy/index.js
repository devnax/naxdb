require("./mysql-monkeypatch");
const mysql = require("./mysql");
const ServerHandler = require("./ServerHandler");

let _config = {
  credential: {
    user: null,
    password: null,
  },
  onListen: (server) => {},
  getQuery: (sql, client) => {},
};

const createMysqlServer = (port, host, config = _config) => {
  const server = mysql.createServer();
  server._server.on("close", () => {});
  process.on("exit", () => server.close());

  server.listen(port, host || "localhost", function (e) {
    if (e) {
      console.log(`ERROR: MySQL server could not bind to port "${port}"`);
      process.exit(0);
    } else {
      console.log(`MySQL server is listening on port "${port}"`);
      ServerHandler(server, config);
      config.onListen && config.onListen(server);
    }
  });
};

module.exports = createMysqlServer;
