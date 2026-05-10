import { charToIndex } from "./modules/commands/util/menu-input.js";

function getResultCmd(val, results) {
    const idx = parseInt(val) - 1;
    return (idx >= 0 && idx < results.length) ? results[idx].cmd : null;
}

function test(e, lower) {
    const isPrintable = (e) => e.length === 1 && e >= " " && e !== "\x7f";
    const actionIdx = charToIndex(lower);
    
    console.log(`e: ${JSON.stringify(e)}, lower: ${JSON.stringify(lower)}`);
    console.log(`actionIdx: ${actionIdx}`);
    console.log(`isPrintable: ${isPrintable(e)}`);
    
    if ((e >= "1" && e <= "9") || (actionIdx !== -1 && !isPrintable(e))) {
        const cmd = getResultCmd(lower, [{cmd: "ip"}]);
        console.log(`cmd: ${cmd}`);
    } else {
        console.log("Did not enter block");
    }
}

test("1", "1"); // Keyboard press 1
test("\x1b[<0;5;12M", "1"); // Mouse click 1
