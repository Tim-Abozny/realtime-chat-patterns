const express = require("express");
const cors = require("cors");
const events = require("events");

const PORT = 5000;

const emitter = new events.EventEmitter();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/connect", (req, res) => {
    res.writeHead(200, {
        "Connection": "keep-alive",
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
    })

    const onMessage = (message) => {
        res.write(`data: ${JSON.stringify(message)} \n\n`);

    }

    emitter.on("newMessage", onMessage);

    req.on("close", () => {
        emitter.off("newMessage", onMessage);
    });
});

app.post("/new-messages", (req, res) => {
    const message = req.body;
    emitter.emit("newMessage", message);

    res.status(200).end() 
});

app.listen(PORT, () => console.log(`server started on port ${PORT}`))
