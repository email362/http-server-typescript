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
    const [head, body] = request.split("\r\n\r\n");
    const [status, ...headers] = head.split("\r\n");
    const [method, path, version] = status.split(" ");
    if (path === "/") {
      socket.write(OK);
    } else if (/\/echo\/?/.test(path)) {
      const echoStr = path.split("/").pop() as string;
      const status = Buffer.from(`HTTP/1.1 200 OK\r\n`);
      const response = Buffer.from(echoStr);
      const headers = Buffer.from(
        `Content-Type: text/plain\r\nContent-Length: ${response.length}\r\n\r\n`
      );
      socket.write(Buffer.concat([status, headers, response]));
    } else {
      socket.write(NOT_FOUND);
    }
    socket.end();
  });
});

server.listen(4221, "localhost");
