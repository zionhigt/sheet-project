export function getUID(length=16) {
    const alphabet = "abcdefghijklmnopqrstuvwxyz123456789!$_-&";
    let res = "";
    while (res.length < length) {
        const i = Math.floor(Math.random() * alphabet.length);
        res += (alphabet[i][Math.random() < 0.5 ? "toLowerCase" : "toUpperCase"]())
    }

    return res;
}