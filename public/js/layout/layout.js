import { getUID } from "../tools/helper.js";
import { a12vect, vect2a1, parseNotation, dec2alpha } from "/lib/a1notation.js"

class Cell {
    static getCell(width) {
        width = width.toString() + "px";
        return $('<div class="cell">').css({"width": width, "min-width": width, "max-width": width});
    }
}

class Row {
    constructor(master, is_index=false) {
        this.master = master;
        this.context = {
            editable: true,
        };
        this._$e = null;
        this._length = 0;
        this.index = $('<div class="cell index">').on(
            "click",
            event => {
                this.$e.toggleClass("selected")
            }
        );
        this._cells = [];
    }

    get cells() {
        return this._cells;
    }

    get $e() {
        if (this._$e == null) throw new Error("Row must be attached to an $element. Please call attach(JQuery) method");
        return this._$e;
    }

    withContext(ctx) {
        this.context = {
            ...this.context,
            ...ctx,

        }

        return this;
    }

    attach($e) {
        this._$e = $e;
    }

    extends(n, header, data) {
        for (let col = 0; col < n; col++) {
            const rowAddress = this.$e.data("address")
            const a = dec2alpha(this._length + col);
            const $headerCell = header.find('.cell[data-address="'+ a +'"]');
            const $cel = this.cell($headerCell.outerWidth());
            if ($headerCell.attr("data-selected") == 1) $cel.addClass("selected");
            if (rowAddress) {
                $cel.attr("data-address", vect2a1([Number.parseInt(rowAddress), this._length + col]));
            }
            if (data && Array.isArray(data) && data.length > col) {
                $cel.text(data[col]);
            }
            const eventName = "header:" + a + ":change:width";
            // $(document).on(eventName, function(event, width) {
            //     $cel.trigger(eventName, [width]);
            // })
            $cel.on(eventName, function(event, width) {
                width = width.toString() + "px";
                $cel.css({"width": width, "min-width": width, "max-width": width});
            })
            this.$e.append($cel);
            this.master.onCellCreated($cel);
        }
        this._length += n;
        return this;
    }

    cell(width) {
        const cell = Cell.getCell(width);
        this.cells.push(cell);
        if (this.context.editable) {
            cell.on("click", function(event) {
                if ($(this).hasClass("index")) return;
                $(document).trigger("onCellClicked", [{
                    $e: cell,
                    onEdit: function(sheet) {
                        const $input = $('<input class="cell-input" type="text">');
                        $input.attr("contenteditable", true)
                        // GET query literal
                        let entrie = sheet.getByReference(cell.data("address"));
                        $input.val(entrie.val);
                        $input.on("blur", function() {
                            const value = $(this).val();
                            if (value != entrie.val) {
                                entrie.update(value);
                            }
                            cell.html(entrie.value);
                            $(this).remove();
                        });
                        cell.append($input);
                        $input.focus();            
                    }
                }])
            });
        }
        return cell;
    }

    show(length, header, data) {
        this.$e.empty();
        this.extends(length, header, data);
        this.$e.prepend(this.index);
        return this;
    }
}

class CellHeader extends Row {
    show (length, cellWidth) {
        const data = [];
        for (let col = 0; col < length; col++) {
            const notation = vect2a1([0, col]);
            const [a, n] = parseNotation(notation);
            data.push({
                "text": a,
                "data-address": a,
                "data-selected": 0,
            });
        }
        super.show(length, {outerWidth: cellWidth}, data);
        this?.index.addClass("layout-corner");
    }

    getColumns(A) {
        const result = [];
        $(".cell").each(function(i, item) {
            const $item = $(item);
            if ($item.parent(".col-name").length > 0 || $item.hasClass("index") || $item.length == 0) return;
            const [a, n] = parseNotation($item.attr("data-address"));
            if (a == A) {
                result.push($item);
            }
        })
        return result;
    }

    extends(n, cellWidth, data) {
        for (let col = 0; col < n; col++) {
            const $cel = this.cell(cellWidth)
            const notation = vect2a1([0, this._length + col]);
            const [a, n] = parseNotation(notation);
            let text = a;
            let attr = {"data-address": a, "data-selected": 0};
            if (data && data?.length && data.length > col) {
                text = data[col];
                if (typeof text != "string") {
                    if (text?.text) {
                        attr = {...text}
                        delete attr.text;
                        text = text.text;
                    }
                }
            }
            $cel.text(text);
            $cel.attr(attr);
            this.$e.append($cel);
            $cel.columnResizer({start: $cel.outerWidth()}, ({ dx }) => { })
            $cel.on("click", event => {
                const $columns = this.getColumns(a);
                let selected = $cel.attr("data-selected") || 0;
                selected = Number.parseInt(selected);
                $cel.attr("data-selected", Math.abs(selected - 1).toString());
                if (!selected) {
                    $columns.map(function(item) {
                        return item.addClass("selected");
                    })
                } else {
                    $columns.map(function(item) {
                        return item.removeClass("selected");
                    })
                }
            });
            $cel.on("resize", function(event) {
                const address = $(this).attr("data-address");
                $('.cell[data-address^="' + address + '"]')
                .trigger("header:"+ address +":change:width", [$(this).outerWidth()]);
            })
        }
        this._length += n;
        return this;
    }
}

class Layout {
    constructor(storage) {
        this.storage = storage;
        this._parentNode = null;
        this.uid = null;
        this._header = new CellHeader();
        this._rows = [];
        this.sheet = null;
        $(document).on("cell:change", (event, entrie) => {
            this.renderCell(entrie);
        })
    }

    setUid(uid) {
        this.uid = uid;
    }

    get parentNode() {
        if (!this._parentNode) {
            this._parentNode = $("body");
        }
        return this._parentNode;
    }

    get lastRow() {
        const $this = this.parentNode;
        const $list = $this.find(".rows");
        const $rows = $list.find(".row");
        return $($rows[$rows.length - 1]);
    }

    get header() {
        return this._header.$e;
    }

    attach(parent) {
        this._parentNode = parent;
        return this;
    }

    cell(width) {
        return Cell.getCell(width);
    }

    addCol(n=1) {
        const $cells = this.lastRow.find(".cell:not(.index)");
        const $firstCell = $($cells[0]);
        const cellWidth = $firstCell.outerWidth();
        if (this._header) {
            this._header.extends(n, 50);
        }
        for (let row of this._rows) {
            row.extends(n, this.header);
        }

    }

    addRows(n=1) {
        const $this = this.parentNode;
        const $list = $this.find(".rows");
        const $cells = this.lastRow.find(".cell:not(.index)");
        const $firstCell = $($cells[0]);
        const length = this._rows.length;
        let i = 0;
        while (i < n) {
            const row = this.row(
                    length + (i++),
                    $cells.length,
                    this.header,
                );
            $list.append(row.$e);
            this._rows.push(row);
        }
    }

    row(index, length, cellWidth) {
        const $row = $('<div class="row">');
        const row = new Row(this);
        row.attach($row);
        row.$e.data("address", index);
        row
        .withContext({
            editable: true,
        })
        .show(length, cellWidth);
        row.index.text(index);
        return row;
    }

    getCellByAddress(addr) {
        const [i, j] = a12vect(addr);
        const row =  this._rows.find(function(item) {
            return item.$e.data("address") == i
        })
        const cell = row?._cells.find(function(item) {
            return item.data("address") == addr;
        })
        return cell
    }

    extends(n) {
        this.addCol(n);
    }

    show() {
        const $this = this.parentNode;
        const $list = $this.find(".rows");
        $list.empty();

        const cellWidth = 100;
        const nbCol = Math.floor(innerWidth / cellWidth) + 5;
        const $a1Header = $("main.body").find(".col-name");
        this._header.attach($a1Header);
        this._header
        .withContext({
            editable: false,
        })
        .show(nbCol, cellWidth);
        let length = 0;
        let i = 1;
        while (length < $this.parents("main.body").outerHeight()) {
            const row = this.row(i++, nbCol, this.header);
            this._rows.push(row);
            $list.append(row.$e);
            length += row.$e.outerHeight();
        }

    }

    onRequestExtends(e, n) {
        if (n && !Number.isNaN(Number.parseInt(n))) {
            this.extends(n);
        }
    }

    onCellCreated($cell) {
        const address = $cell.data("address");
        const entrie = this.sheet?.get(address);
        if (entrie) this.renderCell(entrie, $cell);
    }
    
    renderCell(entrie, $cell) {
        if (!$cell && entrie.address) {
            $cell = this.getCellByAddress(entrie.address);
        }
        if ($cell) {
            const value = entrie.display();
            $cell.html(value);
        }
    }

    renderSheet() {
        console.log("REQUESTED : RENDER SHEET")
        for (let item of this.sheet.data) {
            try {
                this.renderCell(item);
            } catch (err) {
                continue;
            }
        }
    }

    bindSheet(sheet) {
        this.sheet = sheet;
        const self = this;
        $(document).on("onCellClicked", function(event, cell) {
            cell.onEdit(sheet);
        })
        const $file = $("#file");
        $file.on("click", function(event) {
            const $drop = $($file.attr("href"));
            $drop.empty();
            const modal = $("<div>").modal("Choisir un fichier", function() {
                const $fileLink = self.storage.openFileLink(function(data) {
                    if (self.sheet.data.length > 0) {
                        const _do = confirm("En chargant ce fichier vous allez perdre vos données non sauvgardés. Continuer ?");
                        if (!_do) return;
                    }
                    self.sheet.loadData(data.name, data.data);
                    self.renderSheet();
                    modal.pop("hidden");
                    $drop.removeClass("show");
                })
                $(this).find(".modal-body").append($fileLink);
            });
            $drop.append([
                self.storage.downloadLink("sheet", self.sheet),
                $("<hr>"),
                $("<a>", {href: "#!"})
                .on('click', function(event) {
                    event.preventDefault();
                    modal.pop();
                })
                .text("Ouvrir")
            ])
            event.preventDefault();
            $drop.toggleClass("show");
        })
    }
}

export function layout(storage, uid) {
    if (uid) {
        if (layout._cache.hasOwProperty(uid)) return layout._cache[uid];
        console.warn("Layout UID (uid) is unknown. A new layout will be generated.")
    }
    const l = new Layout(storage);
    l.attach($("#container"));
    l.setUid(getUID());
    layout._cache[l.uid] = l;
    return l;
}

layout._cache = {};