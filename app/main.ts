import * as net from "net";
import fs from "node:fs";
import { argv } from "process";

// response status type
type StatusString =
  | "HTTP/1.1 200 OK\r\n"
  | "HTTP/1.1 404 Not Found\r\n"
  | "HTTP/1.1 201 Created\r\n";

// response headers type
type Headers = {
  "Content-Type"?: string;
  "Content-Length"?: string;
  "User-Agent"?: string;
};

// request type
type Request = {
  status: string;
  headers: Headers;
  body: string;
  method: string;
  path: string;
  version: string;
};

// response type
type Response = {
  status: StatusString;
  headers: Headers;
  body: string;
};

enum Path {
  ROOT = "",
  ECHO = "echo",
  USER_AGENT = "user-agent",
  FILE = "files",
}

enum StatusLine {
  OK = "HTTP/1.1 200 OK\r\n",
  NOT_FOUND = "HTTP/1.1 404 Not Found\r\n",
  CREATED = "HTTP/1.1 201 Created\r\n",
}

function getFile(pathToFile: string) {
  try {
    const file = fs.readFileSync(pathToFile);
    return file;
  } catch (e) {
    return new Error("File not found");
  }
}

function createFile(fileName: string, content: string) {
  try {
    fs.writeFileSync(fileName, content);
    return content;
  } catch (e) {
    return new Error("File not created");
  }
}

function parsedRequest(request: Buffer): Request {
  const data = request.toString();
  const [head, body] = data.split("\r\n\r\n");
  const [status, ...headers] = head.split("\r\n");
  const headersMap = headers.reduce((acc, header) => {
    const [key, value] = header.split(": ");
    return { ...acc, [key]: value };
  }, {});
  const [method, path, version] = status.split(" ");
  return {
    status,
    headers: headersMap,
    body,
    method,
    path,
    version,
  };
}

function createResponse({ status, headers = {}, body = "" }: Response): Buffer {
  return Buffer.concat([
    Buffer.from(status),
    Buffer.from(
      Object.entries(headers)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\r\n")
    ),
    Buffer.from("\r\n\r\n"),
    Buffer.from(body),
  ]);
}

const filePathPrefix = argv.includes("--directory")
  ? argv[argv.indexOf("--directory") + 1]
  : "";

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

const OK = Buffer.from(`HTTP/1.1 200 OK\r\n\r\n`);
const NOT_FOUND = Buffer.from(`HTTP/1.1 404 Not Found\r\n\r\n`);

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
  console.log("Client connected");
  socket.on("data", (data) => {
    const { status, headers, body, path, method } = parsedRequest(data);
    const [, basePath, query] = path.split("/");
    let response = createResponse({
      status: StatusLine.NOT_FOUND,
      headers: {},
      body: "",
    });
    switch (basePath) {
      case Path.ROOT:
        response = createResponse({
          status: StatusLine.OK,
          headers: {},
          body: "",
        });
        socket.write(response);
        break;
      case Path.ECHO:
        const echoStr = query;
        const resHeaders = {
          "Content-Type": "text/plain",
          "Content-Length": echoStr.length.toString(),
        };
        response = createResponse({
          status: StatusLine.OK,
          headers: resHeaders,
          body: echoStr,
        });
        socket.write(response);
        break;
      case Path.USER_AGENT:
        const hasUserAgent = "User-Agent" in headers;
        if (hasUserAgent) {
          const userAgent = headers["User-Agent"] ? headers["User-Agent"] : "";
          const resHeaders = {
            "Content-Type": "text/plain",
            "Content-Length": userAgent?.length.toString(),
          };
          response = createResponse({
            status: StatusLine.OK,
            headers: resHeaders,
            body: userAgent,
          });
          socket.write(response);
        } else {
          socket.write(response);
        }
        break;
      case Path.FILE:
        const filePath = `${filePathPrefix}/${query}`;
        try {
          const file =
            method === "GET" ? getFile(filePath) : createFile(filePath, body);
          if (file instanceof Error) {
            throw new Error("File not found");
          }
          const resHeaders = {
            "Content-Type": "application/octet-stream",
            "Content-Length": file.length.toString(),
          };
          response = createResponse({
            status: method === "GET" ? StatusLine.OK : StatusLine.CREATED,
            headers: resHeaders,
            body: file.toString(),
          });
        } catch (e) {
          response = createResponse({
            status: StatusLine.NOT_FOUND,
            headers: {},
            body: "",
          });
        }
        socket.write(response);
        break;
      default:
        socket.write(response);
    }
    socket.end();
  });
});

server.listen(4221, "localhost");
