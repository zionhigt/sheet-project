import { getUID } from "../tools/helper.js";
import { a12vect, vect2a1, parseNotation } from "/lib/a1notation.js"

class Cell {
    static getCell(width) {
        width = width.toString() + "px";
        return $('<div class="cell">').css({"width": width, "min-width": width, "max-width": width});
    }
}

class Row {
    constructor(is_index=false) {
        this.context = {
            editable: true,
        };
        this._$e = null;
        this._length = 0;
        if (!is_index) {
            this.index = $('<div class="cell index">');

        } else {
            this.index = false;
        }

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

    extends(n, cellWidth, data) {
        for (let col = 0; col < n; col++) {
            const $cel = this.cell(cellWidth)
            const rowAddress = this.$e.data("address")
            if (rowAddress) {
                $cel.data("address", vect2a1([Number.parseInt(rowAddress), this._length + col]))
            }
            if (data && Array.isArray(data) && data.length > col) {
                $cel.text(data[col]);
            }
            this.$e.append($cel);
        }
        this._length += n;
        return this;
    }

    cell(width) {
        const cell = Cell.getCell(width);
        this.cells.push(cell);
        if (this.context.editable) {
            cell.on("click", function(event) {
                $(document).trigger("onCellClicked", [{
                    $e: cell,
                    onEdit: function(sheet) {
                        const $input = $('<span class="cell-input" type="text">');
                        $input.attr("contenteditable", true)
                        // GET query literal
                        let entrie = sheet.getByReference(cell.data("address"));
                        $input.text(entrie.val);
                        cell.empty();
                        $input.on("keydown", function(event) {
                            if (event.key === 'Enter' || event.keyCode === 13) {
                                $(this).trigger("blur");
                            }
                        })
                        $input.on("click", function(event) {
                            event.stopPropagation();
                        });
                        $input.on("blur", function() {
                            const value = $(this).text();
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

    show(length, cellWidth, data) {
        this.$e.empty();
        for (let col = 0; col < length; col++) {
            const $cel = this.cell(cellWidth);
            const rowAddress = this.$e.data("address")
            if (rowAddress) {
                $cel.data("address", vect2a1([Number.parseInt(rowAddress), col]))
            }
            if (data && Array.isArray(data) && data.length > col) {
                $cel.text(data[col]);
            }
            this.$e.append($cel);
        }
        this.$e.prepend(this.index);
        this._length = length;
        return this;
    }
}

class CellHeader extends Row {
    show (length, cellWidth) {
        const data = [];
        for (let col = 0; col < length; col++) {
            const notation = vect2a1([0, col]);
            const [a, n] = parseNotation(notation);
            data.push(a);
        }
        super.show(length, cellWidth, data);
        this?.index.addClass("layout-corner");
    }

    extends(n, cellWidth) {
        for (let col = 0; col < n; col++) {
            const $cel = this.cell(cellWidth)
            const notation = vect2a1([0, this._length + col]);
            const [a, n] = parseNotation(notation);
            $cel.text(a);
            this.$e.append($cel);
        }
        this._length += n;
        return this;
    }
}

class Layout {
    constructor() {
        this._parentNode = null;
        this.uid = null;
        this._header = null;
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

    row(index, length, cellWidth) {
        const $row = $('<div class="row">');
        const row = new Row();
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

    addCol(n=1) {
        const $cells = this.lastRow.find(".cell:not(.index)");
        const $firstCell = $($cells[0]);
        const cellWidth = $firstCell.outerWidth();
        if (this._header) {
            this._header.extends(n, cellWidth);
        }
        for (let row of this._rows) {
            row.extends(n, cellWidth);
        }

    }

    addRows(n=1) {
        const $this = this.parentNode;
        const $list = $this.find(".rows");
        const $cells = this.lastRow.find(".cell:not(.index)");
        const $firstCell = $($cells[0]);
        const length = this._rows.length;
        let i = 1;
        while (i <= n) {
            const row = this.row(
                    length + (i++),
                    $cells.length,
                    $firstCell.outerWidth(),
                );
            $list.append(row.$e);
            this._rows.push(row);
        }

    }

    getCellByAddress(addr) {
        const [i, j] = a12vect(addr);
        return this._rows[i - 1].cells[j];
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
        const cellHeader = new CellHeader();
        this._header = cellHeader;
        const $a1Header = $("main.body").find(".col-name");
        cellHeader.attach($a1Header);
        cellHeader
        .withContext({
            editable: false,
        })
        .show(nbCol, cellWidth);

        let length = 0;
        let i = 1;
        while (length < $this.parents("main.body").outerHeight()) {
            const row = this.row(i++, nbCol, cellWidth);
            this._rows.push(row);
            $list.append(row.$e);
            length += row.$e.outerHeight();
        }
        this.extends(5);
        this.addRows(5);

    }

    onRequestExtends(e, n) {
        if (n && !Number.isNaN(Number.parseInt(n))) {
            this.extends(n);
        }
    }
    
    renderCell(entrie) {
        let $cell = null;
        if (entrie.address) {
            $cell = this.getCellByAddress(entrie.address);

        }
        if ($cell) {
            $cell.html(entrie.display());
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
        $(document).on("onCellClicked", function(event, cell) {
            cell.onEdit(sheet);
        })
    }
}

export function layout(uid) {
    if (uid) {
        if (layout._cache.hasOwProperty(uid)) return layout._cache[uid];
        console.warn("Layout UID (uid) is unknown. A new layout will be generated.")
    }
    const l = new Layout();
    l.attach($("#container"));
    l.setUid(getUID());
    layout._cache[l.uid] = l;
    return l;
}

layout._cache = {};