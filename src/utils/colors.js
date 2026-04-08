/**
 * Color utilities — Cyberpunk palette
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

/**
 * Get bubble colors — gradient-based for cyberpunk look
 * Returns: primary stroke, gradient stops, glow color, text color
 */
export function getBubbleColor(change, theme) {
  const positive = change >= 0;
  if (theme === 'dark') {
    return positive
      ? { primary: '#00FFA3', gradStart: '#00FFA3', gradEnd: '#00D9FF', glow: 'rgba(0,255,163,.4)', text: '#00FFA3' }
      : { primary: '#FF6B6B', gradStart: '#FF6B6B', gradEnd: '#FF006E', glow: 'rgba(255,0,110,.4)', text: '#FF6B6B' };
  }
  return positive
    ? { primary: '#00B374', gradStart: '#00B374', gradEnd: '#0096C7', glow: 'rgba(0,179,116,.25)', text: '#00B374' }
    : { primary: '#E0245E', gradStart: '#E0245E', gradEnd: '#C70039', glow: 'rgba(224,36,94,.25)', text: '#E0245E' };
}

export function calculateBubbleSize(volume, maxVolume, minSize = 45, maxSize = 110) {
  const ratio = Math.log10(volume + 1) / Math.log10(maxVolume + 1);
  return minSize + (maxSize - minSize) * ratio;
}
