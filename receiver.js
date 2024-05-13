const amqp = require("amqplib");

async function receiveMessage() {
  try {
    // Buat koneksi ke RabbitMQ
    const connection = await amqp.connect("amqp://guest:guest@localhost:5672");
    const channel = await connection.createChannel();

    const queue = "video_publish";

    await channel.assertQueue(queue, {
      durable: false,
    });

    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);

    // Mulai mengonsumsi pesan dari antrian
    channel.consume(
      queue,
      function (msg) {
        const message = msg.content.toString();
        console.log(" [x] Received (Receiver 1) %s", message);
      },
      {
        noAck: true, // Set noAck menjadi true agar RabbitMQ menghapus pesan dari antrian setelah berhasil dikonsumsi
      }
    );
  } catch (error) {
    console.error("Error connecting to RabbitMQ:", error);
  }
}

// Panggil fungsi receiveMessage untuk mulai menerima pesan dari RabbitMQ
receiveMessage();
