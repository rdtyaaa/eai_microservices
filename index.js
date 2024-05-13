const express = require("express");
const app = express();
const port = 3000;
const routes = require("./routes"); // Impor modul routing
const publishMessage = require("./rabbitmqPublisher"); // Impor publisher RabbitMQ

app.use(express.json());

// Gunakan routes
app.use("/", routes);

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
