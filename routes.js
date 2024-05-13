const express = require("express");
const router = express.Router();
const mysqlConnection = require("./mysqlConnection"); // Impor koneksi MySQL
const publishMessage = require("./rabbitmqPublisher"); // Import publishMessage function

// GET /
router.get("/", (req, res) => {
  res.send("Hello World!");
});

// POST /videos
router.post("/videos", (req, res) => {
  const { title, description, publisher } = req.body;

  // Validasi data
  if (!title || !description || !publisher) {
    return res.status(400).json({ message: "Semua field harus diisi" });
  }

  // Cek apakah penerbit sudah ada di database
  mysqlConnection.query(
    "SELECT id FROM publisher WHERE name = ?",
    [publisher],
    (err, results) => {
      if (err) {
        console.error("Error checking publisher:", err);
        return res.status(500).json({
          message: "Terjadi kesalahan dalam memeriksa penerbit",
          error: err.message,
        });
      }

      if (results.length === 0) {
        // Jika penerbit belum ada, tambahkan ke database
        mysqlConnection.beginTransaction(function (err) {
          if (err) {
            console.error("Error beginning transaction:", err);
            return res
              .status(500)
              .json({ message: "Terjadi kesalahan dalam transaksi" });
          }

          mysqlConnection.query(
            "INSERT INTO videos (title, description, publisher) VALUES (?, ?, ?)",
            [title, description, publisher],
            (err, result) => {
              if (err) {
                console.error("Error creating video:", err);
                mysqlConnection.rollback(function () {
                  console.error("Rollback transaction due to error:", err);
                  return res.status(500).json({
                    message: "Terjadi kesalahan dalam membuat videos",
                    error: err.message,
                  });
                });
              }

              const newVideoId = result.insertId;
              const newVideo = {
                id: newVideoId,
                title,
                description,
                publisher,
              };

              // Insert new publisher into publisher table
              mysqlConnection.query(
                "INSERT INTO publisher (name) VALUES (?)",
                [publisher],
                (err, result) => {
                  if (err) {
                    console.error("Error creating publisher:", err);
                    mysqlConnection.rollback(function () {
                      console.error("Rollback transaction due to error:", err);
                      return res.status(500).json({
                        message: "Terjadi kesalahan dalam membuat publisher",
                        error: err.message,
                      });
                    });
                  }

                  mysqlConnection.commit(function (err) {
                    if (err) {
                      console.error("Error committing transaction:", err);
                      mysqlConnection.rollback(function () {
                        console.error(
                          "Rollback transaction due to error:",
                          err
                        );
                        return res.status(500).json({
                          message: "Terjadi kesalahan dalam transaksi",
                          error: err.message,
                        });
                      });
                    }
                    console.log("Transaction committed successfully.");
                    publishMessage(JSON.stringify(newVideo));
                    res.status(201).json(newVideo);
                  });
                }
              );
            }
          );
        });
      } else {
        // Jika penerbit sudah ada, langsung tambahkan video ke database
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

            const newVideoId = result.insertId;
            const newVideo = { id: newVideoId, title, description, publisher };
            publishMessage(JSON.stringify(newVideo));
            res.status(201).json(newVideo);
          }
        );
      }
    }
  );
});

// GET /videos/:id
router.post("/videos", (req, res) => {
  const { title, description, publisher } = req.body;

  // Validasi data
  if (!title || !description || !publisher) {
    return res.status(400).json({ message: "Semua field harus diisi" });
  }

  mysqlConnection.beginTransaction(function (err) {
    if (err) {
      console.error("Error beginning transaction:", err);
      return res
        .status(500)
        .json({ message: "Terjadi kesalahan dalam transaksi" });
    }

    mysqlConnection.query(
      "INSERT INTO videos (title, description, publisher) VALUES (?, ?, ?)",
      [title, description, publisher],
      (err, result) => {
        if (err) {
          console.error("Error creating video:", err);
          mysqlConnection.rollback(function () {
            console.error("Rollback transaction due to error:", err);
            return res.status(500).json({
              message: "Terjadi kesalahan dalam membuat videos",
              error: err.message,
            });
          });
        }

        const newVideoId = result.insertId;
        const newVideo = { id: newVideoId, title, description, publisher };

        // Insert new publisher into publisher table
        mysqlConnection.query(
          "INSERT INTO publisher (name) VALUES (?)",
          [publisher],
          (err, result) => {
            if (err) {
              console.error("Error creating publisher:", err);
              mysqlConnection.rollback(function () {
                console.error("Rollback transaction due to error:", err);
                return res.status(500).json({
                  message: "Terjadi kesalahan dalam membuat publisher",
                  error: err.message,
                });
              });
            }

            mysqlConnection.commit(function (err) {
              if (err) {
                console.error("Error committing transaction:", err);
                mysqlConnection.rollback(function () {
                  console.error("Rollback transaction due to error:", err);
                  return res.status(500).json({
                    message: "Terjadi kesalahan dalam transaksi",
                    error: err.message,
                  });
                });
              }
              console.log("Transaction committed successfully.");
              publishMessage(JSON.stringify(newVideo));
              res.status(201).json(newVideo);
            });
          }
        );
      }
    );
  });
});

// PUT /videos/:id
router.put("/videos/:id", (req, res) => {
  const videoId = req.params.id;
  const { title, description, publisher } = req.body;

  if (!title || !description || !publisher) {
    return res.status(400).json({ message: "Semua field harus diisi" });
  }

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

// DELETE /videos/:id
router.delete("/videos/:id", (req, res) => {
  const videoId = req.params.id;

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

// GET /publisher
router.get("/publisher", (req, res) => {
  mysqlConnection.query("SELECT * FROM publisher", (err, results) => {
    if (err) {
      console.error("Error fetching publishers:", err);
      return res
        .status(500)
        .json({ message: "Terjadi kesalahan dalam mengambil publisher" });
    }
    res.json(results);
  });
});

module.exports = router;
