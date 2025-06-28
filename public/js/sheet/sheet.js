import { parser } from "../parser/index.js";
import { context as ctx } from "./context.js";

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
        return query.exec();
    }

    query(value=this._value) {
        const self = this;
        class Query {
            constructor(literal) {
                this.literal = literal;
                this.ast = parser(literal);
                this.onError = false;
            }

            subscribeChange(entrie) {
                $(document).on("cell:change", (event, ent) => {
                    if (ent.address.toLowerCase() !== entrie.address.toLowerCase()) return;
                    $(document).trigger("cell:change", [self]);
                })
            }

            parseNumber(n) {
                n = n.toString();
                if (n.includes(".")) {
                    return Number.parseFloat(n);
                } else {
                    return Number.parseInt(n);
                }
            }
            execStatement(statment) {
                const parseNumber = this.parseNumber;
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
                    }
                }.bind(this)
                const execFunction = function(statment) {
                    const args = this.exec(statment.value.args);
                    const name = statment.value.name.value;
                    if (
                        datasheet &&
                        datasheet.context &&
                        datasheet.context.hasOwnProperty(name) &&
                        typeof datasheet.context[name] === "function"
                    ) {
                        return datasheet.context[name].apply(datasheet.context, args);
                    } else {
                        return "UNKNOW Function";
                    }
                }.bind(this)
                const resolveReference = function(statment) {
                    const entrie = datasheet.getByReference(statment.value.value);
                    this.subscribeChange(entrie);
                    return entrie.query().exec();
                }.bind(this)
        
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
                    default:
                        return statment?.value || this.literal
                }
            }

            exec(ast=this.ast) {
                if (ast && !Array.isArray(ast)) return this.execStatement(ast);
                const result = [];
                (ast || []).forEach((item) => {
                    result.push(this.execStatement(item));
                })
                if (result.length == 1) {
                    return result[0];
                }
                return result;
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



export function rederer(layout) {
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
                entrie = this.makeEntrie(address, "");
                this.data.push(entrie);
            }
            return entrie;
        }
    };

    const context = ctx(sheet);
    sheet.context = context;
    window.datasheet = sheet;
    sheet.getByReference("B3").update(2);
    sheet.getByReference("C3").update("=:B3 ++");
    sheet.getByReference("B4").update(5);
    sheet.getByReference("C4").update("=:B4 --");
    sheet.getByReference("B5").update("=:B3 + :B4");
    sheet.getByReference("C5").update("=sum(:C3, :C4)");
    sheet.getByReference("D5").update("=:B3 & :B4");
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