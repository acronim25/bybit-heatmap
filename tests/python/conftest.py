"""Shared fixtures for bybit_volume_monitor tests."""

import pytest
import json
import os
import tempfile
from unittest.mock import patch
from datetime import datetime, timedelta

# Add project root to path
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))


@pytest.fixture
def temp_dir(tmp_path):
    """Provide a temp directory and patch file paths."""
    return tmp_path


@pytest.fixture
def monitor(temp_dir):
    """Create a BybitVolumeMonitor with temp file paths (no real I/O)."""
    from bybit_volume_monitor import BybitVolumeMonitor

    with patch.object(BybitVolumeMonitor, 'load_data'), \
         patch.object(BybitVolumeMonitor, 'load_alerts'), \
         patch.object(BybitVolumeMonitor, 'load_volume_history'):
        m = BybitVolumeMonitor(webhook_url=None, spike_threshold=3.0)

    m.volume_history = {}
    m.alerts_history = {}
    m.volume_history_detailed = {}
    m.data_file = str(temp_dir / "volume_baseline.json")
    m.alerts_file = str(temp_dir / "alerts_history.json")
    m.volume_history_file = str(temp_dir / "volume_history.json")
    return m


@pytest.fixture
def sample_tickers():
    """Sample Bybit API ticker data."""
    return [
        {
            'symbol': 'BTCUSDT',
            'volume24h': '50000',
            'turnover24h': '2500000000',
            'lastPrice': '50000',
            'price24hPcnt': '0.05',
            'highPrice24h': '51000',
            'lowPrice24h': '49000',
            'openInterest': '1000',
            'fundingRate': '0.0001',
        },
        {
            'symbol': 'ETHUSDT',
            'volume24h': '300000',
            'turnover24h': '900000000',
            'lastPrice': '3000',
            'price24hPcnt': '-0.03',
            'highPrice24h': '3100',
            'lowPrice24h': '2900',
            'openInterest': '5000',
            'fundingRate': '0.00005',
        },
        {
            'symbol': 'SOLUSDT',
            'volume24h': '2000000',
            'turnover24h': '200000000',
            'lastPrice': '100',
            'price24hPcnt': '0.10',
            'highPrice24h': '110',
            'lowPrice24h': '90',
            'openInterest': '50000',
            'fundingRate': '-0.0002',
        },
        # Non-USDT pair - should be filtered out
        {
            'symbol': 'BTCUSDC',
            'volume24h': '10000',
            'turnover24h': '500000000',
            'lastPrice': '50000',
            'price24hPcnt': '0.05',
            'highPrice24h': '51000',
            'lowPrice24h': '49000',
            'openInterest': '500',
            'fundingRate': '0.0001',
        },
    ]
