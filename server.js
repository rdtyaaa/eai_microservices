const express = require("express");
var amqp = require("amqplib");
const mysql = require("mysql");

const app = express();
const port = 3000;

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

async function publishMessage(message) {
  try {
    // Buat koneksi ke RabbitMQ
    const connection = await amqp.connect("amqp://guest:guest@localhost:5672");
    const channel = await connection.createChannel();

    const queue = "video_publish";

    await channel.assertQueue(queue, {
      durable: false,
    });

    channel.sendToQueue(queue, Buffer.from(message));
    console.log(" [x] Sent %s", message);

    // Tutup channel dan koneksi setelah selesai
    // setTimeout(function () {
    //   channel.close();
    //   connection.close();
    //   process.exit(0);
    // }, 500);
  } catch (error) {
    console.error("Error connecting to RabbitMQ:", error);
  }
}

app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});

app.post("/videos", (req, res) => {
  const { title, description, publisher } = req.body;

  // Validasi data
  if (!title || !description || !publisher) {
    return res.status(400).json({ message: "Semua field harus diisi" });
  }

  mysqlConnection.query(
    "INSERT INTO videos (title, description, publisher) VALUES (?, ?, ?)",
    [title, description, publisher],
    (err, result) => {
      if (err) {
        console.error("Error creating video:", err);
        return res.status(500).json({
          message: "Terjadi kesalahan dalam membuat videos",
          error: err.message,
        });
      }

      const newVideo = { id: result.insertId, title, description, publisher };
      const message = JSON.stringify(newVideo);
      publishMessage(message);
      res.status(201).json(newVideo);

      // Publish pesan ke RabbitMQ setelah video berhasil disimpan
    }
  );
});

app.get("/videos/:id", (req, res) => {
  const videoId = req.params.id;

  // Ambil video dari database (misalnya, MySQL)
  mysqlConnection.query(
    "SELECT * FROM videos WHERE id = ?",
    [videoId],
    (err, results) => {
      if (err) {
        console.error("Error fetching video:", err);
        return res
          .status(500)
          .json({ message: "Terjadi kesalahan dalam mengambil video" });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: "Video tidak ditemukan" });
      }
      const video = results[0];
      res.json(video);
    }
  );
});

app.put("/videos/:id", (req, res) => {
  const videoId = req.params.id;
  const { title, description, publisher } = req.body;

  // Validasi data
  if (!title || !description || !publisher) {
    return res.status(400).json({ message: "Semua field harus diisi" });
  }

  // Perbarui video dalam database (misalnya, MySQL)
  mysqlConnection.query(
    "UPDATE videos SET title = ?, description = ?, publisher = ? WHERE id = ?",
    [title, description, publisher, videoId],
    (err, result) => {
      if (err) {
        console.error("Error updating video:", err);
        return res
          .status(500)
          .json({ message: "Terjadi kesalahan dalam memperbarui video" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Video tidak ditemukan" });
      }
      res.json({ message: "Video berhasil diperbarui" });
    }
  );
});

app.delete("/videos/:id", (req, res) => {
  const videoId = req.params.id;

  // Hapus video dari database (misalnya, MySQL)
  mysqlConnection.query(
    "DELETE FROM videos WHERE id = ?",
    [videoId],
    (err, result) => {
      if (err) {
        console.error("Error deleting video:", err);
        return res
          .status(500)
          .json({ message: "Terjadi kesalahan dalam menghapus video" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Video tidak ditemukan" });
      }
      res.json({ message: "Video berhasil dihapus" });
    }
  );
});
