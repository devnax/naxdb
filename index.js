const createMysqlServer = require("./src/MysqlProxy");
const config = require("./serverconfig");
const QueryHandler = require("./src/QueryHandler");
const Connection = require("./src/Connection");
const PORT = process.env.PORT || 33511;

createMysqlServer(PORT, "localhost", {
  credential: config.credential,
  getQuery: (query, con) => {
    QueryHandler(query);
  },
  onListen: () => {
    Connection.initial();
  },
});
