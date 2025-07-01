import { parser } from "../parser/index.js";
import { context as ctx } from "./context.js";
import { a12vect, vect2a1 } from "/lib/a1notation.js";
import { parseNumber } from "../tools/helper.js";

function initLayout(layout) {
    layout.show();
    const $mainBody = $("main.body");
    const $cell = layout.lastRow.find(".cell:first-child");
    let lastScroll = [0, 0] //[x, y]
    const $container = $mainBody.find("#container");
    $mainBody.on("scroll", function(e) {
        const top = $(this).scrollTop();
        const left = $(this).scrollLeft();

        let axisXEnabled = left != lastScroll[0];
        let axisYEnabled = top != lastScroll[1];
        if (axisYEnabled) {
            const deltaTop = Math.ceil($container.height() - $mainBody.height())
            if (deltaTop - top < $cell.height()) {
                console.log("ADDING 2 rows")
                layout.addRows(2);
            }
        }

        if (axisXEnabled) {
            const deltaLeft = Math.ceil($container.width() - $mainBody.width())
            if (deltaLeft - left < $cell.width()) {
                console.log("ADDING 2 columns")
                layout.extends(2);
            }
            $(".indexes").css("transform", `translateX(${left}px)`)

        }

        lastScroll = [left, top];
    })
}

class Entrie {
    constructor(address, value) {
        this.address = address;
        this._value = value;
        this._pointerAddresses = []
    }

    get value() {
        return this.display();
    }

    get val() {
        return this._value;
    }

    display() {
        if (this._value === false) return ""
        const query = this.query(this._value);
        const res = query.exec();
        if (query.onError) {
            console.log(query.error)
            return $("<span>").text("#ERROR").attr("title", query.error.message)
        }
        return res;
    }

    /**
     * 
     * @param {*} target 
     * @returns boolean
     * 
     * Laisser moi te conter une histoire !
     */
    depends(target) {
        // Imagine un monde où tout le monde échange un seul bien : le Truc.
        // A peut acheter un Truc à B uniquement si B (et ses clients, récursivement)
        // n’ont pas besoin d’acheter un Truc à A. Sinon, la boucle est bouclée :
        // chacun attend que l’autre lui fournisse ce qu’il attend déjà. Dépendance circulaire.

        return this._pointerAddresses.some(
            item => target === item || item.depends(target)
        );
    }

    query(value=this._value) {
        const self = this;
        class Query {
            constructor(literal) {
                this.literal = literal;
                this.ast = parser(literal);
                this.onError = false;
                this.error = null;
            }

            onFail(err) {
                this.onError = true;
                this.error = err;
            }

            subscribeChange(entrie) {
                if (entrie.depends(self)) throw new Error("Circular dependencies " + entrie.address)
                if (self._pointerAddresses.includes(entrie)) return;
                $(document).on("cell:change", (event, ent) => {
                    if (ent.address.toLowerCase() !== entrie.address.toLowerCase()) return;
                    $(document).trigger("cell:change", [self]);
                })
                console.log("Subscribe " + self.address + " is listening " + entrie.address + " for change.")
                self._pointerAddresses.push(entrie);
            }

            execStatement(statment) {
                // const parseNumber = this.parseNumber;
                // const execStatement = function(statment) {
                    
                // }.bind(this)
                if (statment instanceof Query) return statment.exec();
                const execBinary = function(statment) {
                    switch (statment.operator.type) {
                        case "+":
                        case "++":
                            return parseNumber(this.exec(statment.left)) + parseNumber(this.exec(statment.right));
                        case "-":
                        case "--":
                            return parseNumber(this.exec(statment.left)) - parseNumber(this.exec(statment.right));
                        case "*":
                            return parseNumber(this.exec(statment.left)) * parseNumber(this.exec(statment.right));
                        case "/":
                            return parseNumber(this.exec(statment.left)) / parseNumber(this.exec(statment.right));
                        case "&":
                            return this.exec(statment.left).toString() + this.exec(statment.right).toString();
                        case "&&":
                            return this.exec(statment.left) && this.exec(statment.right);
                        case "||":
                            return this.exec(statment.left) || this.exec(statment.right);
                        case "==":
                            return this.exec(statment.left) == this.exec(statment.right);
                        case ">":
                            return this.exec(statment.left) > this.exec(statment.right);
                        case "<":
                            return this.exec(statment.left) < this.exec(statment.right);
                        case "<=":
                            return this.exec(statment.left) <= this.exec(statment.right);
                        case ">=":
                            return this.exec(statment.left) >= this.exec(statment.right);
                    }
                }.bind(this)
                const execFunction = function(statment) {
                    let args = this.exec(statment.value.args);
                    const name = statment.value.name.value.toLowerCase();
                    if (
                        datasheet &&
                        datasheet.context &&
                        datasheet.context.hasOwnProperty(name) &&
                        typeof datasheet.context[name] === "function"
                    ) {
                        if (!Array.isArray(args)) {
                            args = [args];
                        }
                        const runtimeEnvironement = {
                            ...datasheet.context,
                            currentStatment: statment
                        }
                        return datasheet.context[name].apply(runtimeEnvironement, args, statment);
                    } else {
                        throw new Error("Function : " + name + " is undefined");
                    }
                }.bind(this)

                const resolveReference = function(statment) {
                    const entrie = datasheet.getByReference(statment.value.value);
                    this.subscribeChange(entrie);
                    const query = entrie.query();
                    const result = query.exec();
                    if (query.onError) {
                        query.error.message = "Error at :" + entrie.address + " |> " + query.error.message
                        throw query.error;
                    }
                    return result;
                }.bind(this)

                const resolveRange = function(statment) {
                    let entries = datasheet.getByRange(
                        statment.value.start.value.value,
                        statment.value.end.value.value,
                    )
                    const result = [];
                    for (let item of entries) {
                        if (item || (Array.isArray(item) && item.length > 0)) {
                            result.push(item.query().exec());
                            this.subscribeChange.bind(this)
                        }
                    }
                    
                    return result;
                }.bind(this)
                
                try {
                    switch (statment.type.toLowerCase()) {
                        case "statment":
                            if (statment?.value) return this.exec(statment.value)
                        case "binary":
                            return execBinary(statment)
                        case "function":
                            return execFunction(statment)
                        case "integer":
                            return Number.parseInt(statment.value)
                        case "string":
                            return statment.value
                        case "float":
                            return Number.parseFloat(statment.value)
                        case "reference":
                            return resolveReference(statment)
                        case "range":
                            return resolveRange(statment)
                        default:
                            return statment?.value || this.literal
                    }
                } catch(err) {
                    return this.onFail(err);
                }
            }

            exec(ast=this.ast) {
                if (ast && !Array.isArray(ast)) return this.execStatement(ast);
                const result = [];
                (ast || []).forEach((item) => {
                    result.push(this.execStatement(item));
                })
                switch (result.length) {
                    case 0:
                        return "";
                    case 1:
                        return result[0];
                    default:
                        return result;
                }
            }
        }

        return new Query(value);
    }

    emitChange() {
        $(document).trigger("cell:change", [this]);
    }

    update(value) {
        this._value = value;
        this.emitChange();
        return this;
    }
}



export function renderer(layout) {
    initLayout(layout);
    const sheet = {
        name: "default",
        data: [],
        makeEntrie(address, value) {
            return new Entrie(address, value);
        },
        push(address, value) {
            let entrie = this.getByReference(address);
            if (value !== false) {
                entrie.update(value);
            }
            layout.renderCell(entrie);
        },
        getByReference(address) {
            let entrie = this.data.find((item) => (item.address || "").toLowerCase() == (address || "").toLowerCase());
            if (!entrie) {
                const $cell = layout.getCellByAddress(address)
                entrie = this.makeEntrie(address, $cell.text());
                this.data.push(entrie);
            }
            return entrie;
        },
        getByRange(start, end) {
            start = a12vect(start);
            end = a12vect(end);
            const rangeAddrs = [];
            for (let x = start[0]; x <= end[0]; x++ ) {
                for (let y = start[1]; y <= end[1]; y++ ) {
                    rangeAddrs.push(vect2a1([x, y]))
                }
            }
            return rangeAddrs.map((item) => {
                return this.getByReference(item);
            })
        }
    };

    const context = ctx(sheet);
    sheet.context = context;
    window.datasheet = sheet;

    // // TEST DATA
    // sheet.getByReference("B3").update(2);
    // sheet.getByReference("C3").update("=:B3 ++");
    // sheet.getByReference("B4").update(5);
    // sheet.getByReference("C4").update("=:B4 --");
    // sheet.getByReference("B5").update("=:B3 + :B4");
    // sheet.getByReference("D5").update("=:B3 & :B4");
    // sheet.getByReference("D6").update("=sum(:B3:C5)");

    // // TEST vlookup
    // sheet.getByReference("B11").update("TOTO");
    // sheet.getByReference("C11").update("26");
    // sheet.getByReference("B12").update("TITI");
    // sheet.getByReference("C12").update("14");
    // sheet.getByReference("B13").update("TATA");
    // sheet.getByReference("C13").update("8");
    // sheet.getByReference("D13").update("=vlookup('TOTO', :B11:C14, 2)");

    // // TEST conditional
    // sheet.getByReference("B14").update(0);
    // sheet.getByReference("C14").update(1);
    // sheet.getByReference("B15").update("=if(:B14, 'YES', 'NO')");
    // sheet.getByReference("C15").update("=if(:C14, 'YES', 'NO')");
    // sheet.getByReference("B16").update("=if(:B14 || :C14, 'YES', 'NO')");
    // sheet.getByReference("C16").update("=if(:B14 && :C14, 'YES', 'NO')");

    // TEST recursion
    sheet.getByReference("F7").update("=:F8 + 1");
    sheet.getByReference("F8").update("=:G7 * 2");
    sheet.getByReference("G7").update("=:F7");

    layout.bindSheet(sheet);
    layout.renderSheet();
}

class Record {
    constructor(data) {
        this.ls = null;
    }

    toJSON() {
        return {
            _ls: this._ls,
            data: JSON.stringify(data),
        }
    }
}
class LocalStorageConnector {
    constructor(key) {
        this.mainKey = key;
        this.data = [];
    }

    save(data) {
        const record = new Record(data);
        record.ls = new Date();
        localStorage.setItem(this.key, record);
    }
}

export function storage(type="ls", options) {
    switch (type) {
        case "ls":
            return new LocalStorageConnector();
        default:
            return new LocalStorageConnector();
    }
}