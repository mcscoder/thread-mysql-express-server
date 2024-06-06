import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "mcs",
  database: "thread_db",
});

export default db;
