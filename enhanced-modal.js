/**
 * Enhanced Modal for Bybit Heatmap Pro
 * Rich coin data display with glassmorphism styling
 */

// ==========================================
// COIN NAME MAPPING
// ==========================================
const coinNames = {
    'BTC': 'Bitcoin', 'ETH': 'Ethereum', 'XRP': 'Ripple', 'SOL': 'Solana',
    'BNB': 'BNB', 'DOGE': 'Dogecoin', 'USDC': 'USD Coin', 'ADA': 'Cardano',
    'TRX': 'TRON', 'AVAX': 'Avalanche', 'LINK': 'Chainlink', 'XLM': 'Stellar',
    'TON': 'Toncoin', 'DOT': 'Polkadot', 'SUI': 'Sui', 'SHIB': 'Shiba Inu',
    'LTC': 'Litecoin', 'BCH': 'Bitcoin Cash', 'UNI': 'Uniswap', 'LEO': 'LEO Token',
    'PEPE': 'Pepe', 'NEAR': 'NEAR Protocol', 'APT': 'Aptos', 'ICP': 'Internet Computer',
    'POL': 'Polygon', 'CRO': 'Cronos', 'ETC': 'Ethereum Classic', 'VET': 'VeChain',
    'HBAR': 'Hedera', 'FIL': 'Filecoin', 'ALGO': 'Algorand', 'ARB': 'Arbitrum',
    'KAS': 'Kaspa', 'FET': 'Fetch.ai', 'TIA': 'Celestia', 'OP': 'Optimism',
    'STX': 'Stacks', 'IMX': 'Immutable', 'INJ': 'Injective', 'WLD': 'Worldcoin',
    'ATOM': 'Cosmos', 'OM': 'MANTRA', 'RNDR': 'Render', 'GRT': 'The Graph',
    'BONK': 'Bonk', 'MKR': 'Maker', 'FLOW': 'Flow', 'SEI': 'Sei',
    'LDO': 'Lido DAO', 'JUP': 'Jupiter', 'SAND': 'The Sandbox', 'MANA': 'Decentraland',
    'XTZ': 'Tezos', 'THETA': 'Theta Network', 'PYTH': 'Pyth Network', 'AXS': 'Axie Infinity',
    'KAVA': 'Kava', 'ROSE': 'Oasis Network', 'ENJ': 'Enjin Coin', 'ZIL': 'Zilliqa',
    'RUNE': 'THORChain', 'AAVE': 'Aave', 'FTM': 'Fantom', 'NEO': 'Neo',
    'QNT': 'Quant', 'GALA': 'Gala', 'DYDX': 'dYdX', 'ARKM': 'Arkham',
    'CHZ': 'Chiliz', 'CRV': 'Curve DAO', 'COMP': 'Compound', 'SUSHI': 'SushiSwap',
    'YFI': 'Yearn Finance', '1INCH': '1inch', 'SNX': 'Synthetix', 'GMT': 'GMT',
    'LUNA': 'Terra', 'UST': 'TerraUSD'
};

const coinIcons = {
    'BTC': '₿', 'ETH': 'Ξ', 'XRP': '✕', 'SOL': '◎',
    'BNB': '⬡', 'DOGE': 'Ð', 'ADA': '₳', 'TRX': '▲',
    'DOT': '●', 'LINK': '⬡', 'MATIC': '◈', 'AVAX': '▲',
    'UNI': '🦄', 'LTC': 'Ł', 'ATOM': '⚛', 'XLM': '✴',
    'NEAR': '◉', 'ALGO': '▲', 'VET': '⧖', 'ICP': '◉',
    'FIL': '◉', 'APT': '▲', 'SAND': '◆', 'MANA': '◈',
    'THETA': 'θ', 'XTZ': '◉', 'AXS': '◈', 'GRT': '◉',
    'FTM': '◉', 'ENJ': '◉', 'MKR': '◉', 'KAVA': '◉',
    'CHZ': '⚡', 'BAT': '◉', 'SNX': '◉', 'YFI': '◉',
    'COMP': '◉', 'AAVE': '◉', 'SUSHI': '◉', 'CRV': '◉',
    '1INCH': '◉', 'DYDX': '◉', 'GALA': '◉', 'ZIL': '◉',
    'QNT': '◉', 'NEO': '◉', 'ROSE': '◉', 'GMT': '◉'
};

let currentCoin = null;
let sparklineData = [];

// ==========================================
// SPARKLINE GENERATOR
// ==========================================
function generateSparkline(change24h) {
    const points = 24;
    const data = [];
    let value = 100;
    const trend = change24h / 100;
    
    for (let i = 0; i < points; i++) {
        const randomness = (Math.random() - 0.5) * 4;
        const trendComponent = trend * (i / points) * 10;
        value = value + randomness + trendComponent * 0.5;
        data.push(value);
    }
    
    // Normalize to fit in 0-80 range
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    return data.map((v, i) => ({
        x: (i / (points - 1)) * 400,
        y: 70 - ((v - min) / range) * 50
    }));
}

function renderSparkline(data, isPositive) {
    const path = document.getElementById('sparkline-path');
    const fill = document.getElementById('sparkline-fill');
    const dot = document.getElementById('sparkline-dot');
    
    if (!data.length) return;
    
    const linePath = data.map((p, i) => 
        (i === 0 ? 'M' : 'L') + ` ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
    ).join('');
    
    const fillPath = linePath + 
        ` L ${data[data.length-1].x} 80 L ${data[0].x} 80 Z`;
    
    path.setAttribute('d', linePath);
    fill.setAttribute('d', fillPath);
    dot.setAttribute('cx', data[data.length-1].x);
    dot.setAttribute('cy', data[data.length-1].y);
    
    const color = isPositive ? 'var(--accent-green)' : 'var(--accent-red)';
    path.style.stroke = color;
    fill.style.fill = color;
    dot.style.fill = color;
}

// ==========================================
// FORMATTING HELPERS
// ==========================================
function formatCurrency(value) {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
}

function formatPrice(price) {
    if (price >= 1000) {
        return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else if (price >= 1) {
        return '$' + price.toFixed(2);
    } else {
        return '$' + price.toFixed(4);
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

// ==========================================
// MODAL FUNCTIONS
// ==========================================
function showModal(coin) {
    currentCoin = coin;
    
    // Header
    document.getElementById('modal-symbol').textContent = coin.symbol;
    document.getElementById('modal-name').textContent = coinNames[coin.symbol] || coin.symbol;
    document.getElementById('modal-icon').textContent = coinIcons[coin.symbol] || coin.symbol.charAt(0);
    
    // Price
    document.getElementById('modal-price').textContent = formatPrice(coin.price);
    
    // Change with arrow
    const isPositive = coin.change24h >= 0;
    const changeEl = document.getElementById('modal-change');
    const arrowEl = document.getElementById('modal-arrow');
    const changeTextEl = document.getElementById('modal-change-text');
    
    changeEl.className = 'modal-change ' + (isPositive ? 'positive' : 'negative');
    arrowEl.textContent = isPositive ? '▲' : '▼';
    changeTextEl.textContent = (isPositive ? '+' : '') + coin.change24h.toFixed(2) + '%';
    
    // Stats (mock data based on real patterns)
    const volume = coin.volume24h || coin.price * 1000000;
    const mcap = coin.price * (Math.random() * 10 + 1) * 1e6;
    const high24 = coin.price * (1 + Math.abs(coin.change24h) / 200);
    const low24 = coin.price * (1 - Math.abs(coin.change24h) / 200);
    const oi = volume * (0.1 + Math.random() * 0.3);
    const funding = (Math.random() - 0.5) * 0.01;
    
    document.getElementById('stat-mcap').textContent = formatCurrency(mcap);
    document.getElementById('stat-volume').textContent = formatCurrency(volume);
    document.getElementById('stat-high').textContent = formatPrice(high24);
    document.getElementById('stat-low').textContent = formatPrice(low24);
    document.getElementById('stat-oi').textContent = formatCurrency(oi);
    document.getElementById('stat-funding').textContent = (funding >= 0 ? '+' : '') + (funding * 100).toFixed(4) + '%';
    document.getElementById('stat-funding').style.color = funding >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
    
    // Sparkline
    sparklineData = generateSparkline(coin.change24h);
    renderSparkline(sparklineData, isPositive);
    
    document.getElementById('modal').classList.add('active');
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

// ==========================================
// ACTION BUTTONS
// ==========================================
function openBybit() {
    if (currentCoin) {
        window.open(`https://www.bybit.com/trade/usdt/${currentCoin.symbol}USDT`, '_blank');
    }
}

function copyPrice() {
    if (currentCoin) {
        const text = `${currentCoin.symbol}: ${formatPrice(currentCoin.price)} (${currentCoin.change24h >= 0 ? '+' : ''}${currentCoin.change24h.toFixed(2)}%)`;
        navigator.clipboard.writeText(text).then(() => {
            showToast('Price copied to clipboard!');
        }).catch(() => {
            showToast('Failed to copy');
        });
    }
}

function shareCoin() {
    if (currentCoin) {
        const shareData = {
            title: `${currentCoin.symbol} - ${coinNames[currentCoin.symbol] || currentCoin.symbol}`,
            text: `${currentCoin.symbol} is trading at ${formatPrice(currentCoin.price)} (${currentCoin.change24h >= 0 ? '+' : ''}${currentCoin.change24h.toFixed(2)}% 24h)`,
            url: `https://www.bybit.com/trade/usdt/${currentCoin.symbol}USDT`
        };
        
        if (navigator.share) {
            navigator.share(shareData).catch(() => {});
        } else {
            copyPrice();
        }
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Close modal on backdrop click
    document.getElementById('modal').addEventListener('click', (e) => {
        if (e.target.id === 'modal') closeModal();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showModal,
        closeModal,
        openBybit,
        copyPrice,
        shareCoin,
        formatPrice,
        formatCurrency
    };
}