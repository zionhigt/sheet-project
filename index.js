import { a12vect, vect2a1, alpha2dec, parseNotation } from "./src/lib/a1notation.js"
import express from "express";

const app = express();
app.use("/lib", express.static("./src/lib"));
app.use("/", express.static("./public"));

app.listen(3000);