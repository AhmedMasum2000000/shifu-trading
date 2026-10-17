// Signal engine: technical indicators + honest backtest.
// Works in the browser (window.Engine) and in Node (module.exports).
(function (root) {
  function ema(values, period) {
    const k = 2 / (period + 1);
    const out = [];
    let prev = values[0];
    for (let i = 0; i < values.length; i++) {
      prev = i === 0 ? values[0] : values[i] * k + prev * (1 - k);
      out.push(prev);
    }
    return out;
  }

  function rsi(values, period = 14) {
    const out = new Array(values.length).fill(50);
    let gain = 0, loss = 0;
    for (let i = 1; i < values.length; i++) {
      const d = values[i] - values[i - 1];
      const g = Math.max(d, 0), l = Math.max(-d, 0);
      if (i <= period) {
        gain += g / period; loss += l / period;
      } else {
        gain = (gain * (period - 1) + g) / period;
        loss = (loss * (period - 1) + l) / period;
      }
      if (i >= period) out[i] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
    }
    return out;
  }

  function bollinger(values, period = 20, mult = 2) {
    const mid = [], up = [], low = [];
    for (let i = 0; i < values.length; i++) {
      const s = values.slice(Math.max(0, i - period + 1), i + 1);
      const m = s.reduce((a, b) => a + b, 0) / s.length;
      const sd = Math.sqrt(s.reduce((a, b) => a + (b - m) ** 2, 0) / s.length);
      mid.push(m); up.push(m + mult * sd); low.push(m - mult * sd);
    }
    return { mid, up, low };
  }

  // Precompute every indicator once for a candle list.
  function indicators(candles) {
    const c = candles.map(x => x.close);
    const e9 = ema(c, 9), e21 = ema(c, 21);
    const macdLine = ema(c, 12).map((v, i) => v - ema(c, 26)[i]);
    const sig = ema(macdLine, 9);
    const hist = macdLine.map((v, i) => v - sig[i]);
    return { c, e9, e21, r: rsi(c, 14), bb: bollinger(c, 20, 2), hist };
  }

  // Score the candle at index i. Positive = UP, negative = DOWN.
  // Returns { dir: 'UP'|'DOWN'|'WAIT', strength: 0..100, reasons: [] }
  function signalAt(ind, candles, i) {
    if (i < 30) return { dir: 'WAIT', strength: 0, reasons: [] };
    let score = 0;
    const reasons = [];
    const { c, e9, e21, r, bb, hist } = ind;

    // 1. Trend (EMA 9 vs EMA 21)
    if (e9[i] > e21[i]) { score += 1; reasons.push('trendUp'); }
    else { score -= 1; reasons.push('trendDown'); }

    // 2. RSI extremes (mean reversion)
    if (r[i] < 30) { score += 1.5; reasons.push('rsiLow'); }
    else if (r[i] > 70) { score -= 1.5; reasons.push('rsiHigh'); }

    // 3. MACD momentum turning
    if (hist[i] > 0 && hist[i] > hist[i - 1]) { score += 1; reasons.push('macdUp'); }
    else if (hist[i] < 0 && hist[i] < hist[i - 1]) { score -= 1; reasons.push('macdDown'); }

    // 4. Bollinger band touch (mean reversion)
    if (c[i] <= bb.low[i]) { score += 1.5; reasons.push('bbLow'); }
    else if (c[i] >= bb.up[i]) { score -= 1.5; reasons.push('bbHigh'); }

    // 5. Last candle body direction
    const k = candles[i];
    if (k.close > k.open) score += 0.5; else if (k.close < k.open) score -= 0.5;

    const strength = Math.min(100, Math.round(Math.abs(score) / 5.5 * 100));
    // Only fire when several things agree.
    const dir = Math.abs(score) >= 2.5 ? (score > 0 ? 'UP' : 'DOWN') : 'WAIT';
    return { dir, strength, reasons };
  }

  // Replay the strategy over history: signal on candle i, result = candle i+1 close vs candle i close.
  function backtest(candles) {
    const ind = indicators(candles);
    let wins = 0, losses = 0;
    for (let i = 30; i < candles.length - 1; i++) {
      const s = signalAt(ind, candles, i);
      if (s.dir === 'WAIT') continue;
      const next = candles[i + 1].close, now = candles[i].close;
      if (next === now) continue; // tie = refund on most brokers
      const up = next > now;
      if ((s.dir === 'UP') === up) wins++; else losses++;
    }
    const total = wins + losses;
    return { wins, losses, total, rate: total ? wins / total : 0 };
  }

  // Win rate needed to break even: payout 0.92 => 1 / 1.92 = 52.1%
  function breakEven(payoutPct) {
    return 1 / (1 + payoutPct / 100);
  }

  function latest(candles) {
    const ind = indicators(candles);
    // Use the last CLOSED candle (the final one from the API is still forming).
    return signalAt(ind, candles, candles.length - 2);
  }

  const api = { ema, rsi, bollinger, indicators, signalAt, backtest, breakEven, latest };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Engine = api;
})(this);
