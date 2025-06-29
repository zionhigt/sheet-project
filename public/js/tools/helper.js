export function getUID(length=16) {
    const alphabet = "abcdefghijklmnopqrstuvwxyz123456789!$_-&";
    let res = "";
    while (res.length < length) {
        const i = Math.floor(Math.random() * alphabet.length);
        res += (alphabet[i][Math.random() < 0.5 ? "toLowerCase" : "toUpperCase"]())
    }

    return res;
}

export function parseNumber(n) {
    n = n.toString();
    if (n.includes(".")) {
        return Number.parseFloat(n);
    } else {
        return Number.parseInt(n);
    }
}