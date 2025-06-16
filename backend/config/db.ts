import mysql from "mysql2/promise";

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "3s9k@@r#Gm$R@7Fi",
    database: "ecommerce",
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 3,
});

export default pool;
