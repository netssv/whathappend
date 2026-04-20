import {ANSI, insights, resolveTargetDomain, cmdUsage, cmdError, workerError } from "../../formatter.js";

// ===================================================================
//  ping — HTTP HEAD Latency
// ===================================================================

export async function cmdPing(args) {
    const info = {};
    const domain = resolveTargetDomain(args[0], info);
    if (!domain) return cmdUsage("ping", "<domain>");

    const resp = await chrome.runtime.sendMessage({command:"ping",payload:{domain}});
    if (!resp) return workerError();
    if (resp.error) return cmdError(resp.error);

    const {results} = resp.data;
    let o = "";
    o += `> ping ${domain}\n`;

    o += `PING ${domain} (HTTP/S HEAD)\n`;
    const targetIsIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(domain) || /^[a-f0-9:]+$/i.test(domain);
    if (targetIsIP) {
        o += `${ANSI.dim}Note: This checks port 80/443. IPs without a web server will timeout.${ANSI.reset}\n`;
    }
    let alive=0, times=[];
    for (const r of results) {
        if (r.alive) { alive++; times.push(r.time); o+=`${ANSI.green}seq=${r.seq} time=${r.time}ms${ANSI.reset}\n`; }
        else o+=`${ANSI.red}seq=${r.seq} timeout${ANSI.reset}\n`;
    }
    const loss = Math.round(((results.length-alive)/results.length)*100);
    o += `\n${ANSI.dim}--- ${domain} ping statistics ---${ANSI.reset}\n`;
    o += `${ANSI.white}${results.length} packets, ${alive} received, ${loss}% loss${ANSI.reset}\n`;

    const ins = [];
    if (times.length) {
        const min=Math.min(...times), max=Math.max(...times), avg=Math.round(times.reduce((a,b)=>a+b,0)/times.length);
        o += `${ANSI.white}rtt min/avg/max = ${min}/${avg}/${max} ms${ANSI.reset}`;
        if (avg<100) ins.push({level:"PASS",text:`Fast (${avg}ms).`});
        else if (avg<500) ins.push({level:"WARN",text:`Moderate latency (${avg}ms).`});
        else ins.push({level:"CRIT",text:`High latency (${avg}ms).`});
        if (loss>0) ins.push({level:"WARN",text:`${loss}% packet loss.`});
    }

    o += insights(ins);
    return o;
}
