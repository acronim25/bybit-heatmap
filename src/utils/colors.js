/**
 * Color utilities for bubbles and UI elements
 */

const COIN_NAMES = {
  BTC: 'Bitcoin', ETH: 'Ethereum', XRP: 'Ripple', SOL: 'Solana',
  BNB: 'BNB', DOGE: 'Dogecoin', ADA: 'Cardano', TRX: 'TRON',
  AVAX: 'Avalanche', LINK: 'Chainlink', XLM: 'Stellar', TON: 'Toncoin',
  DOT: 'Polkadot', SUI: 'Sui', SHIB: 'Shiba Inu', LTC: 'Litecoin',
  BCH: 'Bitcoin Cash', UNI: 'Uniswap', PEPE: 'Pepe', NEAR: 'NEAR Protocol',
  APT: 'Aptos', ICP: 'Internet Computer', POL: 'Polygon', ETC: 'Ethereum Classic',
  VET: 'VeChain', HBAR: 'Hedera', FIL: 'Filecoin', ALGO: 'Algorand',
  ARB: 'Arbitrum', KAS: 'Kaspa', FET: 'Fetch.ai', TIA: 'Celestia',
  OP: 'Optimism', STX: 'Stacks', IMX: 'Immutable', INJ: 'Injective',
  WLD: 'Worldcoin', ATOM: 'Cosmos', OM: 'MANTRA', RNDR: 'Render',
  GRT: 'The Graph', BONK: 'Bonk', MKR: 'Maker', FLOW: 'Flow',
  SEI: 'Sei', LDO: 'Lido DAO', JUP: 'Jupiter', SAND: 'The Sandbox',
  MANA: 'Decentraland', AAVE: 'Aave', FTM: 'Fantom', RUNE: 'THORChain',
  GALA: 'Gala', DYDX: 'dYdX', CRV: 'Curve DAO', COMP: 'Compound',
};

export const MAJOR_COINS = new Set([
  'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'AVAX', 'DOT', 'LINK', 'MATIC'
]);

export function getCoinName(symbol) {
  return COIN_NAMES[symbol] || symbol;
}

export function getBubbleColor(change, theme) {
  const positive = change >= 0;
  if (theme === 'dark') {
    return positive
      ? { primary: '#3fb950', glow: 'rgba(63,185,80,.35)', text: '#3fb950' }
      : { primary: '#f85149', glow: 'rgba(248,81,73,.35)', text: '#f85149' };
  }
  return positive
    ? { primary: '#1a7f37', glow: 'rgba(26,127,55,.2)', text: '#1a7f37' }
    : { primary: '#cf222e', glow: 'rgba(207,34,46,.2)', text: '#cf222e' };
}

export function calculateBubbleSize(volume, maxVolume, minSize = 45, maxSize = 110) {
  const ratio = Math.log10(volume + 1) / Math.log10(maxVolume + 1);
  return minSize + (maxSize - minSize) * ratio;
}
