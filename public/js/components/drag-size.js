export default function ($) {
    $.fn.columnResizer = function (options, callback) {
        return this.each(function () {
            const $column = $(this);
            const $el = $("<div>", {
                class: "header-grabber",
            })
            $(this).append($el);
            let isDragging = false;
            let startX = 0;
            let offsetX = 0;
            let columnX = $column.width();

            $el.on('mousedown', function (e) {
                isDragging = true;
                startX = e.clientX;
                offsetX = $el.position().left;
                e.preventDefault();
            });

            $(document).on('mousemove', function (e) {
                if (!isDragging) return;
                const dx = e.clientX - startX;
                $column.css({ width: columnX + dx })
                $column.trigger("resize");
            });

            $(document).on('mouseup', function () {
                isDragging = false;
                columnX = $column.width();
            });
        });
    };
}