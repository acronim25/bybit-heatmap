/**
 * API response validation — protects against Bybit API format changes
 */

export function validateTickerResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Response is not an object');
  }
  if (data.retCode !== 0) {
    throw new ValidationError(`API error: ${data.retMsg || 'Unknown'} (code: ${data.retCode})`);
  }
  if (!data.result?.list || !Array.isArray(data.result.list)) {
    throw new ValidationError('Missing result.list array');
  }
  return data.result.list;
}

export function validateTicker(raw) {
  const symbol = raw?.symbol;
  if (!symbol || typeof symbol !== 'string' || !symbol.endsWith('USDT')) {
    return null;
  }

  const price = safeFloat(raw.lastPrice);
  if (price <= 0) return null;

  return {
    symbol: symbol.replace('USDT', ''),
    fullSymbol: symbol,
    price,
    change24h: safeFloat(raw.price24hPcnt) * 100,
    volume24h: safeFloat(raw.volume24h),
    turnover24h: safeFloat(raw.turnover24h),
    high24h: safeFloat(raw.highPrice24h),
    low24h: safeFloat(raw.lowPrice24h),
    openInterest: safeFloat(raw.openInterest) * price,
    fundingRate: safeFloat(raw.fundingRate) * 100,
    prevOpenInterest: null, // will be computed from history
  };
}

function safeFloat(val) {
  if (val === null || val === undefined || val === '') return 0;
  const num = parseFloat(val);
  return isFinite(num) ? num : 0;
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}
