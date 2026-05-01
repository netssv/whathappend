/**
 * @module modules/commands/util/btc.js
 * @description Hidden easter egg command to fetch current Bitcoin price.
 */

import { ANSI } from "../../formatter.js";

export async function cmdBTC() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const res = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT", {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!res.ok) throw new Error("API error");
        
        const data = await res.json();
        const priceNum = parseFloat(data.price);
        const price = priceNum.toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits: 2});
        
        let o = `\n  ${ANSI.bold}${ANSI.yellow}₿ Bitcoin (BTC)${ANSI.reset}\n`;
        o += `  ${ANSI.bold}${ANSI.green}$${price} USDT${ANSI.reset}\n\n`;
        o += `  ${ANSI.dim}Source: Binance API${ANSI.reset}\n`;
        
        return o;
    } catch (e) {
        return `\n  ${ANSI.red}Unable to fetch BTC price: ${e.message}${ANSI.reset}\n`;
    }
}
