// rabbitmqPublisher.js

const amqp = require("amqplib");

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

    // setTimeout(function () {
    //   channel.close();
    //   connection.close();
    //   process.exit(0);
    // }, 500);
  } catch (error) {
    console.error("Error connecting to RabbitMQ:", error);
  }
}

module.exports = publishMessage;
