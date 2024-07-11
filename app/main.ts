import * as net from "net";

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

const OK = Buffer.from(`HTTP/1.1 200 OK\r\n\r\n`);
const NOT_FOUND = Buffer.from(`HTTP/1.1 404 Not Found\r\n\r\n`);

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
  console.log("Client connected");
  socket.on("data", (data) => {
    const request = data.toString();
    console.log(request.split("\r\n"));
    const [method, path, version] = request.split("\r\n")[0].split(" ");
    if (path === "/") {
      socket.write(OK);
    } else {
      socket.write(NOT_FOUND);
    }
    socket.end();
  });
  // socket.end();
});

server.listen(4221, "localhost");
