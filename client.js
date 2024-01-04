const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "localhost",
  port: 8888,
  password: "12345678",
  user: "root",
});

// Test the connection
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }
  connection.query("SELECT * FROM users", (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
    } else {
      console.log(results);
    }
  });
});
