import Layout from "./layout/index.js";
import { renderer } from "./sheet/sheet.js";

import { init } from "./components/index.js";

class FileStorage {
    static downloadLink(name, data) {
        const content = JSON.stringify(data || []);
        const blob = new Blob([content], {
            type: "application/json;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        return $("<a>", {
            "href": url,
            "target": "_blank",
            "download": name,
        })
        .text("Télécharger");
    }

    static openFileLink(callback) {
        const $input = $("<input>", {
            type: "file",
            // hidden: true,
        })
        return $input.on("change", function(event) {
            const file = event.target.files[0];
            if (!file) return;
            function onReadError(e) {
                console.log(e);
                alert("Impossible de lire le fichier !");
            }
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const jso = JSON.parse(e.target.result);
                    if (callback && typeof callback == "function") {
                        callback.apply($input, [jso]);
                    }
                } catch(e) {
                    return onReadError(e);
                }
            }
            reader.onerror = onReadError;
            reader.readAsText(file);
        });
    }
}

function main() {
    if (jQuery) {
        init(jQuery);
    }
    const layout = Layout(FileStorage)
    renderer(layout)
}
main();