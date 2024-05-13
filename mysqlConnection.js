const mysql = require("mysql");

// Buat koneksi ke database MySQL
const mysqlConnection = mysql.createConnection({
  host: "localhost",
  port: 3310, // Port MySQL Anda
  user: "root", // Username default MySQL
  password: "", // Password default MySQL
  database: "uts_eai",
});

// Tes koneksi
mysqlConnection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL database:", err.stack);
    return;
  }
  console.log("Connected to MySQL database as ID", mysqlConnection.threadId);
});

module.exports = mysqlConnection;
