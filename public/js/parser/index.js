function lexer(value) {
    value = value.toString();
    let cursor = 0;
    const tokens = [];
    while (cursor < value.length) {
        let token = value[cursor++];

        switch (token) {
            // HANDLE double sign
            case '+':
            case '-':
            case "&":
            case "|":
            case "=":
                if (value[cursor] == token) {
                    tokens.push({
                        type: token + token,
                    });
                    cursor++;
                    break;
                }
            case ":":
            case ')':
            case '(':
            case ',':
            case '*':
            case '/':
                tokens.push({
                    type: token,
                });
                break;
            case "'":
            case '"':
                string();
                break;
            default:
                if (isAlpha(token)) {
                    alnum();
                };
                if (isNum(token)) {
                    number();
                }
        }
    }
    return tokens;
    function isNum(c) {
        return c && c >= "0" && c <= "9";
    }
    function isAlpha(c) {
        return c && c.toUpperCase() >= "A" && c.toUpperCase() <= "Z";
    }
    function isAlNum(c) {
        return isAlpha(c) || isNum(c);
    }

    function number() {
        let start = cursor - 1;
        let type = "INTEGER";
        while (value[cursor] && isNum(value[cursor])) {
            cursor ++;
            if (value[cursor] == ".") {
                cursor ++;
                type = "FLOAT";

            }
        }
        tokens.push({
            type,
            value: value.slice(start, cursor),
        })
    }
    function string() {
        const start = cursor;
        let type = "STRING";
        while (value[cursor] != value[start - 1]) {
            if (cursor >= value.length) throw new Error("Unclosed String " + value[start - 1] + "...")
            cursor ++;
        }
        tokens.push({
            type,
            value: value.slice(start, cursor++),
        })
    }

    function alnum() {
        const start = cursor - 1;
        while (isAlNum(value[cursor])) {
            cursor ++;
        }

        tokens.push({
            type: "literal",
            value: value.slice(start, cursor),
        })
    }
}

export function parser(value) {
    const tokens = lexer(value);
    const ast = [];
    let cursor = 0;
    while (cursor < tokens.length) {
        ast.push(statment());
    }
    return ast;

    function statment() {
        let token = expression();
        if (token?.type == "=") {
            return {
                type: "statment",
                value: expression(),
            };
        } else {
            return {
                type: "literal",
                value: value,
            }
        }
    }

    function expression() {
        return linearExpression();
    }

    function linearExpression() {
        let left = factorExpression();
        let incressSigns = ["++", "--"];
        while (["++", "+", "--", "-", "&", "||", "=="].includes(tokens[cursor]?.type)) {
            left = {
                type: "binary",
                left: left,
                operator: tokens[cursor ++],
                right: incressSigns.includes(tokens[cursor - 1]?.type) ? {type: "INTEGER", value:1} : factorExpression(),
            }
        }
        return left;
    }

    function factorExpression() {
        let left = functionExpression();
        while (["*", "/", "&&"].includes(tokens[cursor]?.type)) {
            left = {
                type: "binary",
                left: left,
                operator: tokens[cursor ++],
                right: functionExpression(),
            }
        }
        return left;
    }

    function functionExpression() {
        let token = range();
        if (token?.type == "literal" && tokens[cursor]?.type == "(") {
            cursor++;
            const args = [expression()];
            if (tokens[cursor]?.type == ")") {
                    cursor ++;
            } else {
                while (tokens[cursor]?.type == ",") {
                    if (!cursor >= tokens.length) throw new Error("PARSING ERROR : unclosed parenthesis");
                    cursor ++
                    args.push(expression());
                    if (tokens[cursor]?.type == ")") {
                        cursor ++;
                        break;
                    };
                }
            }
            return {
                type: "function",
                value: {
                    name: token,
                    args,
                },
            };
        }
        return token;
    }

    function range() {
        let token = reference();
        if (token?.type === "reference" && tokens[cursor]?.type === ":") {
            token = {
                type: "range",
                value: {
                    start: token,
                    end: reference(),
                }
            }
        }
        return token;
    }

    function reference() {
        let token = literal();
        if (token?.type == ":") {
            return {
                type: "reference",
                value: literal(),
            };
        }
        return token;
    }

    function literal() {
        let token = tokens[cursor ++];
        if (token?.type == " ") {
            return tokens[cursor ++];
        }

        if (token?.type === "(") {
            token = expression();
            if (tokens[cursor]?.type !== ")") {
                throw new Error("Unclosed (...")
            }
            cursor ++;
        }
        return token;
    }

}

export function exec(node, context) {

}