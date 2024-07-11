import * as net from "net";

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
  socket.on("close", () => {
    console.log("Client disconnected");
    socket.end();
  });
  socket.on("connect", () => {
    console.log("Client connected");
  });
  socket.on("data", (data) => {
    console.log("Data received from client: ", data.toString());
    socket.write(Buffer.from(`HTTP/1.1 200 OK\r\n\r\n`));
    socket.emit("close");
  });
});

server.listen(4221, "localhost");
