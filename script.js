const API_KEY = "a271fe25425e4e1f8394cb83d322a50f";

function calculateRSI(closes) {
    if (closes.length < 15) return 50;

    let gain = 0, loss = 0;

    for (let i = 0; i < 14; i++) {
        let diff = closes[i] - closes[i + 1];
        if (diff > 0) gain += diff;
        else loss -= diff;
    }

    let rs = gain / (loss || 1);
    return 100 - (100 / (1 + rs));
}

function EMA(data, period) {
    if (data.length < period) return data[data.length - 1];

    let k = 2 / (period + 1);
    let ema = data[data.length - 1];

    for (let i = data.length - 2; i >= 0; i--) {
        ema = data[i] * k + ema * (1 - k);
    }
    return ema;
}

function volatility(closes) {
    if (closes.length < 10) return 0;

    let sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += Math.abs(closes[i] - closes[i + 1]);
    }
    return sum / 10;
}

async function getSignal() {

    const pair = document.getElementById("pair").value;
    const tf = document.getElementById("timeframe").value;

    const url = `https://api.twelvedata.com/time_series?symbol=${pair}&interval=${tf}&outputsize=50&apikey=${API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.values) {
        document.getElementById("signal").innerText = "API Error";
        return;
    }

    const closes = data.values.map(v => parseFloat(v.close)).reverse();

    const rsi = calculateRSI(closes.slice(0, 15));
    const emaFast = EMA(closes.slice(-10), 5);
    const emaSlow = EMA(closes.slice(-20), 10);
    const vol = volatility(closes);

    let confirmations = 0;
    let signal = "NO TRADE";

    if (emaFast > emaSlow) confirmations++;
    if (emaFast < emaSlow) confirmations--;

    if (rsi < 30) confirmations++;
    if (rsi > 70) confirmations--;

    if (vol > 0.0005) confirmations += 0.5;

    if (confirmations >= 2) signal = "BUY (UP)";
    else if (confirmations <= -2) signal = "SELL (DOWN)";

    document.getElementById("signal").innerText = signal;

    document.getElementById("output").innerText =
        "RSI: " + rsi.toFixed(2) + "\n" +
        "EMA Fast: " + emaFast.toFixed(5) + "\n" +
        "EMA Slow: " + emaSlow.toFixed(5) + "\n" +
        "Volatility: " + vol.toFixed(5) + "\n" +
        "Confirmations: " + confirmations;
}
