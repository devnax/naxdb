const { debug } = require("./debug");
const auth = require("../mysql2/lib/auth_41.js");

const processResult = (cl_conn, db_result) => {
  if (!Array.isArray(db_result)) {
    // sanity check: should never occur
    cl_conn.writeEof();
  } else {
    const [rows, fields] = db_result;

    if (Array.isArray(rows)) {
      cl_conn.writeTextResult(rows, fields);
    } else {
      cl_conn.writeOk(rows);
    }
  }
};

const handle_events = function ({ server, onQuery, db }) {
  let id = 0;

  server.on("connection", (cl_conn) => {
    let db_conn = null;

    const db_getConnection = () => {
      return db_conn
        ? Promise.resolve(db_conn)
        : db
            .getConnection()
            .then((conn) => {
              db_conn = conn;
            })
            .catch((err) => {
              db_conn = null;
            })
            .then(() => {
              return db_conn;
            });
    };

    cl_conn.serverHandshake({
      protocolVersion: 10,
      serverVersion: "mysql-proxy",
      connectionId: id++,
      statusFlags: 2,
      characterSet: 8,
      capabilityFlags: 0xffffff,
      authCallback: (params, cb) => {
        const isValid = auth.verifyToken(
          params.authPluginData1,
          params.authPluginData2,
          params.authToken,
          auth.doubleSha1("12345678")
        );
        if (isValid) {
          cb(null);
          cl_conn.sequenceId = 0;
        } else {
          // for list of codes lib/constants/errors.js
          cb(null, { message: "wrong password dude", code: 1045 });
        }
      },
    });

    cl_conn.on("ping", async () => {
      cl_conn.writeOk();
      cl_conn.sequenceId = 0;
    });

    cl_conn.on("query", function (query) {
      db_getConnection()
        .then(() => {
          return onQuery(query, db_conn);
        })
        .then((db_result) => {
          cl_conn.sequenceId = 1;
          processResult(cl_conn, db_result);
        })
        .catch((err) => {
          cl_conn.sequenceId = 0;
          cl_conn.writeError({ code: 1064, message: err.message });
        });
    });

    cl_conn.on("init_db", (schemaName) => {
      cl_conn.emit("query", `USE ${schemaName};`);
    });

    cl_conn.on("field_list", (table, fields) => {
      cl_conn.writeEof();
    });

    cl_conn.on("end", () => {
      if (db_conn) {
        db.releaseConnection(db_conn);
        db_conn = null;
      }
    });

    cl_conn.on("error", (err) => {
      if (db_conn) {
        db.releaseConnection(db_conn);
        db_conn = null;
      }

      if (err && err.code)
        debug("[ERROR]", `Client connection closed (${err.code})`);
    });
  });
};

module.exports = handle_events;
