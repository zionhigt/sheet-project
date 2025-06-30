import express from "express";

const app = express();
app.use("/lib", express.static("./src/lib"));
app.use("/", express.static("./public"));

app.listen(3000);