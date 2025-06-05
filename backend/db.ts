import mysql from "mysql2/promise";

const db = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "3s9k@@r#Gm$R@7Fi",
  database: "ecommerce",
  port: 3306,
});

// const [rows] = await conn.execute("SELECT * FROM users");
export default db;
