# 📈 Shifu Signal

A free signal helper for real crypto coins. It uses free live prices from Binance, with no login, API key or subscription. It runs entirely in the browser, so hosting on GitHub Pages costs nothing, forever.

## How to use (3 taps)

1. Tap a **coin** (BTC, ETH, …).
2. Tap the **trade time** (1, 5 or 15 min) and type the Quotex payout % for that coin.
3. Tap **GET SIGNAL**.

You'll see:
- **▲ UP / ▼ DOWN / ⏸ WAIT**. On WAIT, don't trade.
- **Real win rate**: how this exact setup did on the last ~1000 candles.
- **Win rate you NEED**: the break-even win rate for your payout (85% payout → 54.1%).
- A **✅ / ⛔ box**. On ⛔, don't trade.
- **My signal history**: every signal is checked automatically after it expires and marked WIN/LOSS, so you see the live accuracy yourself.

Tap **বাংলা** at the top for Bangla.

## What it can't do

- **It can't predict OTC pairs** ("USD/DZD (OTC)" and the like). Quotex generates OTC prices itself and doesn't publish them anywhere. No outside tool can see them, so any app that claims to predict OTC is guessing.
- **No one predicts 1-minute moves at 90%+.** Tested on live data, these indicators land around 45-57% depending on the coin and the moment. That's close to a coin flip. The app shows that number openly instead of hiding it.

## Put it online for free (one time, ~2 minutes)

1. Make the GitHub repo **public** (Settings → General → Danger Zone → Change visibility). Free GitHub Pages needs a public repo.
2. Settings → **Pages** → Source: **GitHub Actions**.
3. Merge into `main`. The included workflow publishes it at
   `https://<your-username>.github.io/<repo-name>/`.
4. On the phone, open that link → browser menu → **Add to Home screen**. It now works like an app.

## Run it locally

Open `index.html` in any browser. That's all.

## How the signal works

`engine.js` scores the last closed candle with five classic indicators:
EMA 9/21 trend, RSI 14 (oversold/overbought), MACD histogram momentum, Bollinger Bands (20, 2) and the last candle's direction.
It fires UP/DOWN only when several of them agree, and WAIT otherwise. The same function is replayed over history to produce the "real win rate".

---
Not financial advice. Binary options are high-risk and banned for retail traders in many countries.
