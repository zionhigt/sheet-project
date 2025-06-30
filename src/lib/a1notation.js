/** alpha refrence the math base 26 */

const base = 26;
function dec2alpha(n) {
    n++;
    let chars = '';
    while (n > 0) {
        n --;
        chars += String.fromCharCode((n % base) + "A".charCodeAt());
        n = Math.floor(n / base);
    }
    return chars.split("").reverse().join("");
}

function nAlpha(a) {
    return a.toUpperCase().charCodeAt() - "A".charCodeAt();
}

export function vect2a1(vect) {
    if (vect.length != 2) throw new Error("Vector must have two axes [row, col]")
    const [i, j] = vect;
    return `${dec2alpha(j)}${i}`;

}

export function parseNotation(notation) {
    let cursor = 0;
    const result = [[], []];
    while (cursor < notation.length) {
        const token = notation[cursor ++].toUpperCase();
        if (token >= "A" && token <= "Z") {
            result[0].push(token);
        } else if (token >= "0" && token <= "9") {
            result[1].push(token);
        } else {
            throw new Error("Bad token found : " + token);
        }
    }
    return result.map(function(item) {
        return item.join("");
    });
}

export function a12vect(notation) {
    const [a, n] = parseNotation(notation);
    return [
        Number.parseInt(n),
        alpha2dec(a)
    ]
}

export function alpha2dec(a) {
    const sign = [];
    for (let c of a.split("").reverse()) {
        sign.push(nAlpha(c))
    }

    const r = sign.reduce(function(acc, item, i) {
        return acc += (((item + 1) % base) * Math.pow(base, i));
    }, 0)
    return r - 1;
}