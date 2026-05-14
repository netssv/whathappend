import { COMMAND_MANIFEST } from "../modules/data/command-manifest.js";
console.log(Object.keys(COMMAND_MANIFEST).length);
console.log(Object.values(COMMAND_MANIFEST).map(c => c.category).filter((v, i, a) => a.indexOf(v) === i));
