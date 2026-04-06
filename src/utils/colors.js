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

const COIN_ICONS = {
  BTC: '₿', ETH: 'Ξ', XRP: '✕', SOL: '◎', BNB: '⬡', DOGE: 'Ð',
  ADA: '₳', DOT: '●', LINK: '⬡', AVAX: '▲', UNI: '🦄', LTC: 'Ł',
  ATOM: '⚛', XLM: '✴', NEAR: '◉',
};

export const MAJOR_COINS = new Set([
  'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'AVAX', 'DOT', 'LINK', 'MATIC'
]);

export function getCoinName(symbol) {
  return COIN_NAMES[symbol] || symbol;
}

export function getCoinIcon(symbol) {
  return COIN_ICONS[symbol] || symbol.charAt(0);
}

export function getBubbleColor(change, theme) {
  const positive = change >= 0;
  if (theme === 'dark') {
    return positive
      ? { primary: '#00ff41', glow: 'rgba(0,255,65,.6)', text: '#00ff41' }
      : { primary: '#ff0040', glow: 'rgba(255,0,64,.6)', text: '#ff0040' };
  }
  return positive
    ? { primary: '#2a8a4a', glow: 'rgba(42,138,74,.3)', text: '#2a8a4a' }
    : { primary: '#c54a4a', glow: 'rgba(197,74,74,.3)', text: '#c54a4a' };
}

export function calculateBubbleSize(volume, maxVolume, minSize = 45, maxSize = 110) {
  const ratio = Math.log10(volume + 1) / Math.log10(maxVolume + 1);
  return minSize + (maxSize - minSize) * ratio;
}
