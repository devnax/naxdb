require("./lib/mysql-monkeypatch");

const mysql = require("./mysql2");
const fs = require("fs");
const proxy = require("./proxy");
const handle_events = require("./lib/mysql");

const start_server = function ({
  proxy_port,
  db_host,
  db_port,
  db_user,
  db_password,
  pool,
  hold_connection,
  logs_dir,
  encrypt_fields,
  encrypt_secret,
}) {
  const server = mysql.createServer();

  server.listen(proxy_port, "localhost", function (e) {
    if (e) {
      console.log(`ERROR: MySQL server could not bind to port "${proxy_port}"`);
      process.exit(0);
    } else {
      console.log(`MySQL server is listening on port "${proxy_port}"`);
      const { onQuery, db } = proxy({
        db_host,
        db_port,
        db_user,
        db_password,
        pool,
        hold_connection,
        logs_dir,
        encrypt_fields,
        encrypt_secret,
      });
      handle_events({ server, onQuery, db });
    }
  });
};

start_server({
  proxy_port: 8888,
  proxy_protocol: "mysql",
  db_host: "localhost",
  db_port: 3306,
  db_user: "root",
  db_password: "12345678",
  pool: 10,
  hold_connection: false,
  logs_dir: fs.realpathSync(`${__dirname}/.data/logs`, {
    encoding: "utf8",
  }),
  encrypt_fields: /ENCRYPT_\d+/,
  encrypt_secret: "test",
});
