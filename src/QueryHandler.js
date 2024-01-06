const Connection = require("./Connection");
const { Parser } = require("node-sql-parser");
const parser = new Parser();

const QueryHandler = (query) => {
  const connections = Connection.getConnections();

  connections.forEach(async (con) => {
    await con.query("USE maindb");
    const [res] = await con.query(query);
    console.log(res);
  });
  const config = require("../serverconfig");

  let asts = parser.astify(query);
  if (!Array.isArray(asts)) asts = [asts];

  for (let ast of asts) {
  }
};

module.exports = QueryHandler;
