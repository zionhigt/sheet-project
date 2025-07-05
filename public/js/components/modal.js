export default function($) {
    $.fn.modal = function(name, callback) {
        const $modal = $(this);
        $modal.addClass("modal");

        const $body = $("body");
        const [X, Y] = [$body.width(), $body.height()];
        const width  = Math.floor(X * 0.4)
        const height  = Math.floor(Y * 0.2)
        $modal.css({
            width: width + "px",
            position: "absolute",
            margin: "auto",
            top: Math.floor((Y - height) / 2) + "px",
            left: Math.floor((X - width) / 2) + "px",
            "z-index": "5000",
        })

        this.pop = function(arg="show") {
            if (arg == "show") {
                $("body").addClass("overed");
                $modal.addClass("show");
            } else {
                $("body").removeClass("overed");
                $modal.removeClass("show");
            }
        }

        const self = this;
        $modal.append([
            $("<div>", { class: "modal-header" })
            .append("<h2>").text(name),
            $("<div>", { class: "modal-body" }),
            $("<div>", { class: "modal-footer" })
            .append(
                $("<button>")
                .on("click", function(event) {
                    event.preventDefault();
                    self.pop("hidden");
                })
                .text("close")
            )
        ])

        $("body").append($modal);
        if (callback && typeof callback == "function") {
            callback.apply(this);
        }
        return this;
    }
}