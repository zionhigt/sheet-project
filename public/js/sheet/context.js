import { a12vect, vect2a1, parseNotation } from "/lib/a1notation.js";

const _context = {
    bindSheet(sheet) {
        this.sheet = sheet;
        return this;
    },
    max() {
        return Math.max(...arguments);
    },
    min() {
        return Math.min(...arguments);
    },
    sum() {
        return [...arguments].reduce(function(acc, item) {
            return acc += item;
        }, 0);
    },
    pow() {
        return Math.pow(...arguments);
    },
    sqrt() {
        return Math.sqrt(...arguments);
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
        let { start, end } = this.currentStatment.value.args[1].value;
        start = start.value.value;
        end = end.value.value;
        const groupedEntries = Object.groupBy(
            this.sheet.getByRange(start, end),
            function(item) {
                return parseNotation(item.address)[0];
            }
        )
        const startCol = groupedEntries[parseNotation(start)[0]];
        for (let entrie of startCol) {
            const vect = a12vect(entrie.address);
            const value = entrie.query().exec();
            if (value == filter) {
                return this.sheet.getByReference(
                    vect2a1([vect[0], vect[1] + resIndex - 1])
                ).value
            }
        }
    }
}

export function context(sheet) {
    return _context.bindSheet(sheet);
}