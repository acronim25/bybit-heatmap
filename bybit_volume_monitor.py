#!/usr/bin/env python3
# Bybit Volume Spike Detector PRO
# Monitorizează volumul tuturor monedelor și alertează la creșteri anormale
# Version 2.0 - Cu export CSV și grafice îmbunătățite
# Author: Guap 💰

import requests
import json
import time
import os
import csv
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import statistics

class BybitVolumeMonitor:
    def __init__(self, webhook_url: str = None, spike_threshold: float = 3.0):
        """
        Inițializează monitorul de volum PRO
        
        Args:
            webhook_url: URL pentru Discord webhook
            spike_threshold: Multiplicator pentru alertă (default 3.0 = triplare)
        """
        self.webhook_url = webhook_url
        self.spike_threshold = spike_threshold
        self.data_file = "volume_baseline.json"
        self.alerts_file = "alerts_history.json"
        self.volume_history_file = "volume_history.json"
        self.api_url = "https://api.bybit.com/v5/market/tickers"
        self.klines_url = "https://api.bybit.com/v5/market/kline"
        
        # Perioada pentru calculul baseline (ore)
        self.baseline_hours = 24
        # Verificare la fiecare (minute)
        self.check_interval = 5
        # Cooldown pentru alerte (minute) - să nu spamăm
        self.alert_cooldown = 30
        
        self.load_data()
        self.load_alerts()
        self.load_volume_history()
    
    def load_data(self):
        """Încarcă datele volumului istoric"""
        if os.path.exists(self.data_file):
            with open(self.data_file, 'r') as f:
                self.volume_history = json.load(f)
        else:
            self.volume_history = {}
    
    def save_data(self):
        """Salvează datele volumului"""
        with open(self.data_file, 'w') as f:
            json.dump(self.volume_history, f, indent=2)
    
    def load_alerts(self):
        """Încarcă istoricul alertelor"""
        if os.path.exists(self.alerts_file):
            with open(self.alerts_file, 'r') as f:
                self.alerts_history = json.load(f)
        else:
            self.alerts_history = {}
    
    def save_alerts(self):
        """Salvează istoricul alertelor"""
        with open(self.alerts_file, 'w') as f:
            json.dump(self.alerts_history, f, indent=2)
    
    def load_volume_history(self):
        """Încarcă istoricul volumului pentru fiecare monedă"""
        if os.path.exists(self.volume_history_file):
            with open(self.volume_history_file, 'r') as f:
                self.volume_history_detailed = json.load(f)
        else:
            self.volume_history_detailed = {}
    
    def save_volume_history(self):
        """Salvează istoricul volumului"""
        with open(self.volume_history_file, 'w') as f:
            json.dump(self.volume_history_detailed, f, indent=2)
    
    def get_all_tickers(self) -> List[Dict]:
        """Obține toate monedele de pe Bybit"""
        try:
            response = requests.get(
                f"{self.api_url}?category=linear",
                timeout=10
            )
            data = response.json()
            
            if data.get('retCode') == 0:
                return data['result']['list']
            return []
        except Exception as e:
            print(f"❌ Eroare API: {e}")
            return []
    
    def get_kline_data(self, symbol: str, interval: str = "60", limit: int = 24) -> List[Dict]:
        """Obține date istorice de preț/volum pentru o monedă"""
        try:
            response = requests.get(
                f"{self.klines_url}?category=linear&symbol={symbol}&interval={interval}&limit={limit}",
                timeout=10
            )
            data = response.json()
            
            if data.get('retCode') == 0:
                return data['result']['list']
            return []
        except Exception as e:
            print(f"❌ Eroare Kline API pentru {symbol}: {e}")
            return []
    
    def process_volume_data(self, tickers: List[Dict]) -> Dict[str, Dict]:
        """Procesează datele de volum"""
        current_data = {}
        
        for ticker in tickers:
            symbol = ticker.get('symbol', '')
            
            # Doar perpetuale USDT
            if not symbol.endswith('USDT'):
                continue
            
            try:
                volume_24h = float(ticker.get('volume24h', 0))
                turnover_24h = float(ticker.get('turnover24h', 0))
                price = float(ticker.get('lastPrice', 0))
                change_24h = float(ticker.get('price24hPcnt', 0)) * 100
                
                # Volum în USD
                volume_usd = volume_24h * price
                
                current_data[symbol] = {
                    'symbol': symbol.replace('USDT', ''),
                    'full_symbol': symbol,
                    'volume': volume_24h,
                    'volume_usd': volume_usd,
                    'turnover': turnover_24h,
                    'price': price,
                    'change_24h': change_24h,
                    'high_24h': float(ticker.get('highPrice24h', 0)),
                    'low_24h': float(ticker.get('lowPrice24h', 0)),
                    'open_interest': float(ticker.get('openInterest', 0) or 0) * price,
                    'funding_rate': float(ticker.get('fundingRate', 0) or 0) * 100,
                    'timestamp': datetime.now().isoformat()
                }
            except Exception as e:
                continue
        
        return current_data
    
    def update_baseline(self, symbol: str, volume_data: Dict):
        """Actualizează baseline-ul pentru o monedă"""
        if symbol not in self.volume_history:
            self.volume_history[symbol] = {
                'volumes': [],
                'baseline': volume_data['volume_usd'],
                'last_updated': datetime.now().isoformat()
            }
        
        history = self.volume_history[symbol]
        
        # Adaugă volumul curent
        history['volumes'].append({
            'volume': volume_data['volume_usd'],
            'timestamp': datetime.now().isoformat()
        })
        
        # Păstrează doar ultimele 24h de date
        cutoff = datetime.now() - timedelta(hours=self.baseline_hours)
        history['volumes'] = [
            v for v in history['volumes']
            if datetime.fromisoformat(v['timestamp']) > cutoff
        ]
        
        # Calculează noua medie (baseline)
        if len(history['volumes']) >= 3:
            volumes = [v['volume'] for v in history['volumes']]
            # Folosim mediana pentru a elimina outlier-ii
            history['baseline'] = statistics.median(volumes)
        
        history['last_updated'] = datetime.now().isoformat()
        
        # Update detailed history
        if symbol not in self.volume_history_detailed:
            self.volume_history_detailed[symbol] = []
        
        self.volume_history_detailed[symbol].append({
            'volume': volume_data['volume_usd'],
            'price': volume_data['price'],
            'change': volume_data['change_24h'],
            'timestamp': datetime.now().isoformat()
        })
        
        # Keep only last 100 entries
        if len(self.volume_history_detailed[symbol]) > 100:
            self.volume_history_detailed[symbol] = self.volume_history_detailed[symbol][-100:]
    
    def detect_spike(self, symbol: str, current_volume: float) -> Tuple[bool, float]:
        """
        Detectează dacă volumul a crescut anormal
        
        Returns:
            (is_spike, multiplier)
        """
        if symbol not in self.volume_history:
            return False, 1.0
        
        baseline = self.volume_history[symbol].get('baseline', current_volume)
        
        if baseline == 0:
            return False, 1.0
        
        multiplier = current_volume / baseline
        
        # Spike detectat dacă multiplicatorul depășește threshold
        is_spike = multiplier >= self.spike_threshold
        
        return is_spike, multiplier
    
    def should_alert(self, symbol: str) -> bool:
        """Verifică dacă trebuie trimisă alertă (cooldown)"""
        if symbol not in self.alerts_history:
            return True
        
        last_alert = self.alerts_history.get(symbol)
        if not last_alert:
            return True
        
        last_time = datetime.fromisoformat(last_alert['timestamp'])
        cooldown_end = last_time + timedelta(minutes=self.alert_cooldown)
        
        return datetime.now() > cooldown_end
    
    def format_number(self, num: float) -> str:
        """Formatează numerele mari"""
        if num >= 1e9:
            return f"{num/1e9:.2f}B"
        if num >= 1e6:
            return f"{num/1e6:.2f}M"
        if num >= 1e3:
            return f"{num/1e3:.2f}K"
        return f"{num:.2f}"
    
    def export_to_csv(self, data: Dict[str, Dict], filename: Optional[str] = None):
        """Exportă datele curente în CSV"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
            filename = f"bybit_volume_data_{timestamp}.csv"
        
        headers = ['Symbol', 'Price', 'Change_24h', 'Volume_24h', 'Volume_USD', 
                   'High_24h', 'Low_24h', 'Open_Interest', 'Funding_Rate', 'Timestamp']
        
        with open(filename, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(headers)
            
            for symbol, d in sorted(data.items(), key=lambda x: x[1]['volume_usd'], reverse=True):
                writer.writerow([
                    d['symbol'],
                    d['price'],
                    d['change_24h'],
                    d['volume'],
                    d['volume_usd'],
                    d['high_24h'],
                    d['low_24h'],
                    d['open_interest'],
                    d['funding_rate'],
                    d['timestamp']
                ])
        
        print(f"📁 Date exportate în: {filename}")
        return filename
    
    def send_discord_alert(self, symbol: str, current_vol: float, 
                          baseline: float, multiplier: float, change_24h: float):
        """Trimite alertă pe Discord"""
        if not self.webhook_url:
            return False
        
        # Determină culoarea în funcție de direcție
        color = 0x00ff00 if change_24h >= 0 else 0xff0000
        
        emoji = "🚀" if multiplier >= 5 else "📈" if multiplier >= 3 else "⚠️"
        
        message = {
            "embeds": [{
                "title": f"{emoji} VOLUM SPIKE DETECTAT",
                "description": f"**{symbol}** are o creștere masivă de volum!",
                "color": color,
                "timestamp": datetime.now().isoformat(),
                "fields": [
                    {
                        "name": "📊 Multiplicator",
                        "value": f"**{multiplier:.2f}x** (baseline)",
                        "inline": True
                    },
                    {
                        "name": "💰 Volum Curent",
                        "value": f"${self.format_number(current_vol)}",
                        "inline": True
                    },
                    {
                        "name": "📈 Volum Normal",
                        "value": f"${self.format_number(baseline)}",
                        "inline": True
                    },
                    {
                        "name": "💹 Preț 24h",
                        "value": f"{change_24h:+.2f}%",
                        "inline": True
                    },
                    {
                        "name": "🔗 Link Bybit",
                        "value": f"[Deschide în Bybit](https://www.bybit.com/trade/usdt/{symbol})",
                        "inline": False
                    }
                ],
                "footer": {
                    "text": "Bybit Volume Monitor PRO | Guap 💰"
                }
            }]
        }
        
        try:
            response = requests.post(self.webhook_url, json=message, timeout=10)
            return response.status_code == 204
        except Exception as e:
            print(f"❌ Eroare Discord: {e}")
            return False
    
    def print_status(self, checked: int, spikes: int):
        """Printează status în terminal"""
        now = datetime.now().strftime("%H:%M:%S")
        status_icon = "🟢" if spikes == 0 else "🔴"
        print(f"[{now}] {status_icon} Verificate: {checked} monede | 🚨 Spikes: {spikes}")
    
    def run(self):
        """Rulează monitorizarea în loop"""
        print("=" * 60)
        print("🚀 Bybit Volume Spike Monitor PRO pornit!")
        print("=" * 60)
        print(f"⏰ Verificare la fiecare {self.check_interval} minute")
        print(f"📊 Threshold: {self.spike_threshold}x (creștere de {(self.spike_threshold-1)*100:.0f}%)")
        print(f"🔔 Cooldown alerte: {self.alert_cooldown} minute")
        print(f"📁 Export CSV disponibil (apasă 'e' pentru export)")
        print("=" * 60)
        
        # Prima rulare - colectăm date baseline
        print("\n📥 Colectez date baseline (prima rulare)...")
        tickers = self.get_all_tickers()
        current_data = self.process_volume_data(tickers)
        
        for symbol, data in current_data.items():
            self.update_baseline(symbol, data)
        
        self.save_data()
        self.save_volume_history()
        print(f"✅ Baseline setat pentru {len(current_data)} monede\n")
        
        last_export_time = datetime.now()
        
        # Loop principal
        while True:
            try:
                print(f"\n🔍 Verificare nouă... ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')})")
                
                # Obține date curente
                tickers = self.get_all_tickers()
                current_data = self.process_volume_data(tickers)
                
                spikes_detected = 0
                
                for symbol, data in current_data.items():
                    # Actualizează baseline
                    self.update_baseline(symbol, data)
                    
                    # Detectează spike
                    is_spike, multiplier = self.detect_spike(symbol, data['volume_usd'])
                    
                    if is_spike and self.should_alert(symbol):
                        spikes_detected += 1
                        
                        baseline = self.volume_history[symbol]['baseline']
                        
                        print(f"🚨 SPIKE: {symbol} - {multiplier:.2f}x volum! ({data['change_24h']:+.2f}%)")
                        
                        # Trimite alertă
                        if self.send_discord_alert(symbol, data['volume_usd'], 
                                                   baseline, multiplier, data['change_24h']):
                            # Salvează alerta
                            self.alerts_history[symbol] = {
                                'timestamp': datetime.now().isoformat(),
                                'multiplier': multiplier,
                                'volume': data['volume_usd'],
                                'change': data['change_24h']
                            }
                            self.save_alerts()
                
                self.save_data()
                self.save_volume_history()
                self.print_status(len(current_data), spikes_detected)
                
                # Auto-export la fiecare oră
                if (datetime.now() - last_export_time).total_seconds() >= 3600:
                    self.export_to_csv(current_data)
                    last_export_time = datetime.now()
                
                # Așteaptă până la următoarea verificare
                print(f"😴 Dorm {self.check_interval} minute... (apasă Ctrl+C pentru oprire)")
                time.sleep(self.check_interval * 60)
                
            except KeyboardInterrupt:
                print("\n" + "=" * 60)
                print("👋 Oprit de utilizator")
                print("=" * 60)
                print("\nOpțiuni:")
                print("  [e] Export CSV")
                print("  [q] Ieșire")
                print("  [Enter] Continuă")
                
                try:
                    choice = input("\nAlegere: ").strip().lower()
                    if choice == 'e':
                        self.export_to_csv(current_data)
                    elif choice == 'q':
                        break
                except:
                    break
                    
            except Exception as e:
                print(f"\n❌ Eroare: {e}")
                time.sleep(60)

if __name__ == "__main__":
    import sys
    
    # Configuration
    webhook = os.environ.get("DISCORD_WEBHOOK", None)
    threshold = float(os.environ.get("SPIKE_THRESHOLD", "3.0"))
    
    # Sau argumente din linia de comandă
    if len(sys.argv) > 1:
        webhook = sys.argv[1]
    if len(sys.argv) > 2:
        threshold = float(sys.argv[2])
    
    monitor = BybitVolumeMonitor(webhook_url=webhook, spike_threshold=threshold)
    monitor.run()
