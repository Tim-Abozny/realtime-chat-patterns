# Real-Time Client-Server Communication

A study project demonstrating three real-time communication patterns in JavaScript: **Long Polling**, **Server-Sent Events (SSE)**, and **WebSockets**.

Each approach implements a simple chat application with the same UI but a different underlying transport mechanism.

## Table of Contents

- [Project Structure](#project-structure)
- [1. Long Polling](#1-long-polling)
- [2. Server-Sent Events (SSE)](#2-server-sent-events-sse)
- [3. WebSocket](#3-websocket)
- [Comparison](#comparison)
- [Switching Between Modes](#switching-between-modes)
  - [Server](#server)
  - [Client](#client)

---

## Project Structure

```
client/src/
  LongPolling.jsx    — Long Polling client
  EventSourcing.jsx  — SSE client
  WebSock.jsx        — WebSocket client
  App.js             — Entry point (swap components here)

server/
  longpolling.js     — Express server for Long Polling
  eventsource.js     — Express server for SSE
  websocket.js       — ws server for WebSockets
```

---

## 1. Long Polling

The client sends a GET request and the server **holds it open** until new data is available. Once the server responds, the client immediately sends a new request.

```
Client                          Server
  |                                |
  |--- GET /get-messages --------->|
  |                                |  (holds connection open, waiting...)
  |                                |
  |         [someone sends POST /new-messages]
  |                                |
  |<-- 200 { message: "hi" } -----|  (res.json → res.end, connection closed)
  |                                |
  |--- GET /get-messages --------->|  (client immediately reconnects)
  |                                |  (holds connection open again...)
  |                                |
  |         [someone sends POST /new-messages]
  |                                |
  |<-- 200 { message: "bye" } ----|
  |                                |
  |--- GET /get-messages --------->|  (and so on...)
```

---

## 2. Server-Sent Events (SSE)

The client opens **one persistent connection** via `EventSource`. The server keeps it open and pushes data whenever new events occur. Communication is **one-directional** (server to client); sending messages still requires a separate POST request.

```
Client                          Server
  |                                |
  |--- GET /connect -------------->|
  |                                |  writeHead(200, "text/event-stream")
  |<------- SSE headers -----------|
  |                                |  emitter.on("newMessage", onMessage)
  |     (connection stays open)    |
  |                                |
  |--- POST /new-messages -------->|
  |                                |  emitter.emit → onMessage
  |<-- data: {"message":"hi"} ----|  (res.write, connection stays open)
  |                                |
  |--- POST /new-messages -------->|
  |                                |  emitter.emit → onMessage
  |<-- data: {"message":"bye"} ---|  (res.write, connection stays open)
  |                                |
  | [client closes tab]            |
  |-------- close ---------------->|
  |                                |  emitter.off("newMessage", onMessage)
```

---

## 3. WebSocket

A **full-duplex** connection — both client and server can send data at any time through the same channel. No HTTP requests needed after the initial handshake.

```
Client A                    Server                     Client B
  |                           |                           |
  |-- new WebSocket() ------->|                           |
  |<-- onopen ----------------|                           |
  |-- send({event:"connection",                           |
  |    username:"Alice"}) --->|                           |
  |                           |-- broadcastMessage ------>|
  |<-- onmessage -------------|   "Alice connected"       |
  |   "Alice connected"       |                           |
  |                           |                           |
  |-- send({event:"message",  |                           |
  |    message:"hi"}) ------->|                           |
  |                           |-- broadcastMessage ------>|
  |<-- onmessage -------------|   onmessage -->           |
  |   "Alice: hi"             |   "Alice: hi"             |
```

---

## Comparison

| | Long Polling | SSE | WebSocket |
|---|---|---|---|
| Protocol | HTTP | HTTP | WS (over HTTP) |
| Direction | Client → Server (new request each time) | Server → Client (one stream) | Bidirectional |
| Sending messages | POST request | POST request | `socket.send()` |
| Receiving messages | GET → wait → response → new GET | `EventSource` (single channel) | `onmessage` (same channel) |
| Server cleanup | Manual / none | `req.on("close")` + `emitter.off()` | Automatic (`ws` manages `clients` Set) |
| Client cleanup | `AbortController` | `eventSource.close()` | `socket.close()` |

---

## Switching Between Modes

### Server

In `server/package.json`, change the `start` script:

```json
"scripts": {
  "start": "nodemon longpolling.js"
}
```

```json
"scripts": {
  "start": "nodemon eventsource.js"
}
```

```json
"scripts": {
  "start": "nodemon websocket.js"
}
```

Then restart the server with `npm start`.

### Client

In `client/src/App.js`, change the import and component:

**Long Polling:**
```jsx
import LongPolling from './LongPolling';

function App() {
  return (
    <div>
      <LongPolling />
    </div>
  );
}
```

**SSE (Event Sourcing):**
```jsx
import EventSourcing from './EventSourcing';

function App() {
  return (
    <div>
      <EventSourcing />
    </div>
  );
}
```

**WebSocket:**
```jsx
import WebSock from './WebSock';

function App() {
  return (
    <div>
      <WebSock />
    </div>
  );
}
```

Make sure the server and client use matching modes.
