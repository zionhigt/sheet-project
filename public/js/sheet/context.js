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
        const args = [...arguments];
        return args.slice(1, args.length).join(args[0]);
    },
}

export function context(sheet) {
    return _context.bindSheet(sheet);
}