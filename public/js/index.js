import { a12vect, vect2a1, alpha2dec, parseNotation } from "/lib/a1notation.js"
import Layout from "./layout/index.js";
import { renderer } from "./sheet/sheet.js";


function main() {
    renderer(Layout())
}
main();