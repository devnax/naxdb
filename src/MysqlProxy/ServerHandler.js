const auth = require("./mysql/lib/auth_41.js");

const ServerHandler = function (server, config) {
  let id = 0;
  const { credential, getQuery } = config;
  server.on("connection", (client) => {
    client.serverHandshake({
      protocolVersion: 10,
      serverVersion: "mysql-proxy",
      connectionId: id++,
      statusFlags: 2,
      characterSet: 8,
      capabilityFlags: 0xffffff,
      authCallback: (params, cb) => {
        if (!credential) cb(null);
        const isValid = auth.verifyToken(
          params.authPluginData1,
          params.authPluginData2,
          params.authToken,
          auth.doubleSha1(credential.password)
        );

        if (credential.user !== params.user || !isValid) {
          cb(null, { message: "invalid credentials", code: 1045 });
        }
        cb(null);
        client.sequenceId = 0;
      },
    });

    client.on("ping", async () => {
      client.writeOk();
      client.sequenceId = 0;
    });

    client.on("query", function (query) {
      try {
        getQuery && getQuery(query, client);
        client.sequenceId = 1;
      } catch (err) {
        client.sequenceId = 0;
        client.writeError({ code: 1064, message: err.message });
      }
    });

    client.on("init_db", (schemaName) => {
      client.emit("query", `USE ${schemaName};`);
    });

    client.on("field_list", (table, fields) => {
      client.writeEof();
    });

    client.on("end", () => {
      // if (db_conn) {
      //   db.releaseConnection(db_conn);
      //   db_conn = null;
      // }
    });

    client.on("error", (err) => {
      // if (db_conn) {
      //   db.releaseConnection(db_conn);
      //   db_conn = null;
      // }

      if (err && err.code)
        console.warn("[ERROR]", `Client connection closed (${err.code})`);
    });
  });
};

module.exports = ServerHandler;
