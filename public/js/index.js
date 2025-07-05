import Layout from "./layout/index.js";
import { renderer } from "./sheet/sheet.js";

import { init } from "./components/index.js";


function main() {
    if (jQuery) {
        init(jQuery);
    }
    renderer(Layout())
}
main();