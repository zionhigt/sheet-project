import { a12vect, vect2a1, parseNotation } from "/lib/a1notation.js";
import { parseNumber } from "../tools/helper.js";

const _context = {
    bindSheet(sheet) {
        this.sheet = sheet;
        return this;
    },
    _numericArgs() {
        const args = [];
        for (let arg of arguments) {
            if (!arg || Array.isArray(arg) && arg.length == 0) continue;
            let _arg = parseNumber(arg);
            if (Number.isNaN(_arg)) throw new Error(arg + " is NaN");
            args.push(_arg)
        }
        return args;
    },
    max() {
        return Math.max(...this._numericArgs(...arguments));
    },
    min() {
        return Math.min(...this._numericArgs(...arguments));
    },
    sum() {
        return this._numericArgs(...arguments).reduce(function(acc, item) {
            return acc += item;
        }, 0);
    },
    pow() {
        return Math.pow(...this._numericArgs(...arguments));
    },
    sqrt() {
        return Math.sqrt(...this._numericArgs(...arguments));
    },
    join() {
        let args = [...arguments];
        if (args.length == 2 && Array.isArray(args[1])) {
            args = [
                args[0],
                ...args[1]
            ]
        }
        return args.slice(1, args.length).join(args[0]);
    },
    vlookup(filter, range, resIndex) {
        const args = this.currentStatment.value.args;
        if (!args || args?.length < 3) throw new Error("vlookup(args.length < 3) Some arguments are missing.");
        if (args[1].type !== "range") throw new Error("vlookup(args[1]) not a valid range.");
        let { start, end } = args[1].value;
        start = start.value.value;
        end = end.value.value;
        const groupedEntries = Object.groupBy(
            this.sheet.getByRange(start, end),
            function(item) {
                return parseNotation(item.address)[0];
            }
        )
        if (Number.isNaN(Number.parseInt(resIndex))) throw new Error("Bad Index value !");
        resIndex = Number.parseInt(resIndex);
        if (Object.keys(groupedEntries).length < resIndex) throw new Error("Index " + resIndex + " is out of range");
        const startCol = groupedEntries[parseNotation(start)[0]];
        for (let entrie of startCol) {
            const vect = a12vect(entrie.address);
            const value = entrie.query().exec();
            if (value == filter) {
                return this.sheet.getByReference(
                    vect2a1([vect[0], vect[1] + resIndex - 1])
                ).value || "#NA";
            }
        }
    },
    if(expression, on, off) {
        return expression ? on : off;
    }
}

export function context(sheet) {
    return _context.bindSheet(sheet);
}