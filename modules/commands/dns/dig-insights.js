import { ANSI } from "../../formatter.js";
import { toRegisteredDomain } from "../../formatter.js";
import { resolveProvider } from "../../utils.js";

// ===================================================================
//  digInsights — Actionable analysis for DNS records
// ===================================================================

export async function digInsights(domain, type, data) {
    const ins = [], ans = data.Answer||[];
    if (data.Status===3) { 
        ins.push({level:"CRIT",text:"Domain does not exist (NXDOMAIN)."}); 
        ins.push({level:"INFO",text:`Check status: https://www.isitdownrightnow.com/?url=${encodeURIComponent(domain)}`});
        return ins; 
    }
    if (data.Status===2) { 
        ins.push({level:"CRIT",text:"DNS server failure (SERVFAIL)."}); 
        ins.push({level:"INFO",text:`Check status: https://www.isitdownrightnow.com/?url=${encodeURIComponent(domain)}`});
        return ins; 
    }

    if (type==="MX") return mxInsights(domain, ans, ins);
    if (type==="TXT") return txtInsights(ans, ins);
    if (type==="NS") return await nsInsights(domain, ans, ins);
    if (type==="A"||type==="AAAA") return await aInsights(domain, type, ans, ins);
    if (type==="CNAME") return cnameInsights(domain, ans, ins);
    return ins;
}

function mxInsights(domain, ans, ins) {
    if (ans.length===0) { 
        ins.push({level:"CRIT",text:"No MX records — email delivery will fail."}); 
        ins.push({level:"WARN",text:"Contact forms, password resets won't work."}); 
    }
    else if (ans.length===1) ins.push({level:"WARN",text:"Single mail server. No redundancy."});
    else ins.push({level:"PASS",text:`${ans.length} mail servers. Redundancy OK.`});
    
    const mx = ans.map(r=>(r.data||"").toLowerCase());
    const rootDomain = toRegisteredDomain(domain);
    let thirdParty = false;

    if (mx.some(d=>d.includes("google")||d.includes("gmail"))) { ins.push({level:"INFO",text:"Provider: Google Workspace."}); thirdParty = true; }
    else if (mx.some(d=>d.includes("outlook")||d.includes("microsoft"))) { ins.push({level:"INFO",text:"Provider: Microsoft 365."}); thirdParty = true; }
    else if (mx.some(d=>d.includes("zoho"))) { ins.push({level:"INFO",text:"Provider: Zoho Mail."}); thirdParty = true; }
    else if (mx.some(d=>d.includes("protonmail")||d.includes("proton"))) { ins.push({level:"INFO",text:"Provider: Proton Mail."}); thirdParty = true; }
    
    if (!thirdParty && ans.length > 0) {
        const external = ans.filter(r => toRegisteredDomain((r.data||"").split(" ").pop()) !== rootDomain);
        if (external.length > 0) ins.push({level:"INFO",text:`MX records delegated to third party (${external.length} external).`});
        else ins.push({level:"PASS",text:`MX records handled internally by ${rootDomain}.`});
    }
    
    ins.push({level:"INFO",text:`Test MX health: https://mxtoolbox.com/domain/${domain}`});
    return ins;
}

function txtInsights(ans, ins) {
    const tx = ans.map(r=>(r.data||"").toLowerCase().replace(/"/g,""));
    if (!tx.some(d=>d.startsWith("v=spf1"))) {
        ins.push({level:"WARN",text:"No SPF — vulnerable to email spoofing (attackers can fake your domain)."});
        ins.push({level:"INFO",text:`Check SPF: https://mxtoolbox.com/spf.aspx`});
    } else ins.push({level:"PASS",text:"SPF configured."});
    
    if (!tx.some(d=>d.startsWith("v=dmarc1"))) {
        ins.push({level:"WARN",text:"No DMARC — spoofed emails bypass spam filters."});
        ins.push({level:"INFO",text:`Check DMARC: https://mxtoolbox.com/dmarc.aspx`});
    } else ins.push({level:"PASS",text:"DMARC configured."});
    
    if (ans.length===0) ins.push({level:"WARN",text:"No TXT records at all."});
    ins.push({level:"INFO",text:"Note: DKIM requires a specific selector (e.g. selector._domainkey) and won't appear here."});
    return ins;
}

async function nsInsights(domain, ans, ins) {
    if (ans.length===0) {
        ins.push({level:"CRIT",text:"No NS records — DNS delegation broken (site unreachable)."});
    }
    else if (ans.length===1) ins.push({level:"WARN",text:"Single NS. No DNS redundancy (if it fails, your site goes down)."});
    else ins.push({level:"PASS",text:`${ans.length} nameservers. Redundancy OK.`});
    
    const ns = ans.map(r=>(r.data||"").toLowerCase());
    if (ns.length > 0) {
        const nsProv = await resolveProvider(ns[0].replace(/\.$/, ""));
        if (nsProv) ins.push({level:"INFO",text:`DNS: ${nsProv}.`});
    }
    
    ins.push({level:"INFO",text:`Test DNS health: https://intodns.com/${domain}`});
    return ins;
}

async function aInsights(domain, type, ans, ins) {
    if (ans.length===0) ins.push({level:"WARN",text:`No ${type} records.`});
    else if (ans.length>1) ins.push({level:"INFO",text:`${ans.length} IPs — load balancing or CDN.`});
    // Resolve hosting provider for first IP
    if (ans.length > 0) {
        const firstIP = (ans[0].data || "").trim();
        const prov = await resolveProvider(firstIP);
        if (prov) ins.push({level:"INFO",text:`Hosting: ${prov}`});
    }
    if (ans.length>0&&ans[0].TTL<60)
        ins.push({level:"INFO",text:`Low TTL (${ans[0].TTL}s) — dynamic DNS.`});
        
    ins.push({level:"INFO",text:`Test Global DNS: https://dnschecker.org/#${type}/${domain}`});
    return ins;
}

function cnameInsights(domain, ans, ins) {
    if (ans.length>0) ins.push({level:"INFO",text:`Alias → ${ans[0].data||"?"}`});
    ins.push({level:"INFO",text:`Test Global DNS: https://dnschecker.org/#CNAME/${domain}`});
    return ins;
}
