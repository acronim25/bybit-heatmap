"""Tests for BybitVolumeMonitor core logic."""

import pytest
import json
import os
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta


class TestProcessVolumeData:
    """Tests for ticker data processing and filtering."""

    def test_filters_only_usdt_pairs(self, monitor, sample_tickers):
        result = monitor.process_volume_data(sample_tickers)
        assert 'BTCUSDT' in result
        assert 'ETHUSDT' in result
        assert 'SOLUSDT' in result
        assert 'BTCUSDC' not in result

    def test_calculates_volume_usd(self, monitor, sample_tickers):
        result = monitor.process_volume_data(sample_tickers)
        # BTC: 50000 volume * 50000 price = 2,500,000,000
        assert result['BTCUSDT']['volume_usd'] == 50000 * 50000

    def test_converts_price_change_to_percent(self, monitor, sample_tickers):
        result = monitor.process_volume_data(sample_tickers)
        # 0.05 * 100 = 5.0%
        assert result['BTCUSDT']['change_24h'] == pytest.approx(5.0)
        # -0.03 * 100 = -3.0%
        assert result['ETHUSDT']['change_24h'] == pytest.approx(-3.0)

    def test_strips_usdt_from_symbol_name(self, monitor, sample_tickers):
        result = monitor.process_volume_data(sample_tickers)
        assert result['BTCUSDT']['symbol'] == 'BTC'
        assert result['ETHUSDT']['symbol'] == 'ETH'

    def test_handles_empty_ticker_list(self, monitor):
        result = monitor.process_volume_data([])
        assert result == {}

    def test_handles_missing_fields_gracefully(self, monitor):
        tickers = [{'symbol': 'BADUSDT'}]
        result = monitor.process_volume_data(tickers)
        assert result['BADUSDT']['volume'] == 0.0
        assert result['BADUSDT']['price'] == 0.0

    def test_handles_none_open_interest(self, monitor):
        tickers = [{
            'symbol': 'TESTUSDT',
            'volume24h': '100',
            'turnover24h': '1000',
            'lastPrice': '10',
            'price24hPcnt': '0.01',
            'highPrice24h': '11',
            'lowPrice24h': '9',
            'openInterest': None,
            'fundingRate': None,
        }]
        result = monitor.process_volume_data(tickers)
        assert result['TESTUSDT']['open_interest'] == 0.0
        assert result['TESTUSDT']['funding_rate'] == 0.0


class TestSpikeDetection:
    """Tests for volume spike detection logic."""

    def test_no_spike_when_no_history(self, monitor):
        is_spike, multiplier = monitor.detect_spike('NEWCOIN', 1000000)
        assert is_spike is False
        assert multiplier == 1.0

    def test_no_spike_below_threshold(self, monitor):
        monitor.volume_history['BTCUSDT'] = {'baseline': 1000000}
        is_spike, multiplier = monitor.detect_spike('BTCUSDT', 2000000)
        assert is_spike is False
        assert multiplier == pytest.approx(2.0)

    def test_spike_at_threshold(self, monitor):
        monitor.volume_history['BTCUSDT'] = {'baseline': 1000000}
        is_spike, multiplier = monitor.detect_spike('BTCUSDT', 3000000)
        assert is_spike is True
        assert multiplier == pytest.approx(3.0)

    def test_spike_above_threshold(self, monitor):
        monitor.volume_history['BTCUSDT'] = {'baseline': 1000000}
        is_spike, multiplier = monitor.detect_spike('BTCUSDT', 5000000)
        assert is_spike is True
        assert multiplier == pytest.approx(5.0)

    def test_no_spike_when_baseline_is_zero(self, monitor):
        monitor.volume_history['BTCUSDT'] = {'baseline': 0}
        is_spike, multiplier = monitor.detect_spike('BTCUSDT', 5000000)
        assert is_spike is False
        assert multiplier == 1.0

    def test_custom_threshold(self, monitor):
        monitor.spike_threshold = 5.0
        monitor.volume_history['BTCUSDT'] = {'baseline': 1000000}
        # 3x is below 5x threshold
        is_spike, _ = monitor.detect_spike('BTCUSDT', 3000000)
        assert is_spike is False
        # 5x meets threshold
        is_spike, _ = monitor.detect_spike('BTCUSDT', 5000000)
        assert is_spike is True


class TestAlertCooldown:
    """Tests for alert cooldown logic."""

    def test_should_alert_when_no_history(self, monitor):
        assert monitor.should_alert('BTCUSDT') is True

    def test_should_alert_after_cooldown(self, monitor):
        past_time = datetime.now() - timedelta(minutes=31)
        monitor.alerts_history['BTCUSDT'] = {
            'timestamp': past_time.isoformat()
        }
        assert monitor.should_alert('BTCUSDT') is True

    def test_should_not_alert_during_cooldown(self, monitor):
        recent_time = datetime.now() - timedelta(minutes=10)
        monitor.alerts_history['BTCUSDT'] = {
            'timestamp': recent_time.isoformat()
        }
        assert monitor.should_alert('BTCUSDT') is False

    def test_should_alert_at_exact_cooldown_boundary(self, monitor):
        # At exactly 30 minutes, cooldown should have expired
        boundary_time = datetime.now() - timedelta(minutes=30, seconds=1)
        monitor.alerts_history['BTCUSDT'] = {
            'timestamp': boundary_time.isoformat()
        }
        assert monitor.should_alert('BTCUSDT') is True

    def test_should_alert_when_entry_is_none(self, monitor):
        monitor.alerts_history['BTCUSDT'] = None
        assert monitor.should_alert('BTCUSDT') is True


class TestBaselineUpdate:
    """Tests for volume baseline calculation."""

    def test_creates_new_baseline_for_unknown_symbol(self, monitor):
        data = {'volume_usd': 1000000, 'price': 50000, 'change_24h': 5.0}
        monitor.update_baseline('NEWCOIN', data)
        assert 'NEWCOIN' in monitor.volume_history
        assert monitor.volume_history['NEWCOIN']['baseline'] == 1000000

    def test_baseline_uses_median_with_enough_data(self, monitor):
        now = datetime.now()
        monitor.volume_history['BTCUSDT'] = {
            'volumes': [
                {'volume': 100, 'timestamp': (now - timedelta(hours=1)).isoformat()},
                {'volume': 200, 'timestamp': (now - timedelta(minutes=30)).isoformat()},
            ],
            'baseline': 100,
            'last_updated': now.isoformat()
        }
        # Adding 3rd data point triggers median calculation
        data = {'volume_usd': 300, 'price': 50000, 'change_24h': 5.0}
        monitor.update_baseline('BTCUSDT', data)
        # Median of [100, 200, 300] = 200
        assert monitor.volume_history['BTCUSDT']['baseline'] == 200

    def test_prunes_old_data_beyond_24h(self, monitor):
        now = datetime.now()
        monitor.volume_history['BTCUSDT'] = {
            'volumes': [
                {'volume': 100, 'timestamp': (now - timedelta(hours=25)).isoformat()},
                {'volume': 200, 'timestamp': (now - timedelta(hours=1)).isoformat()},
            ],
            'baseline': 100,
            'last_updated': now.isoformat()
        }
        data = {'volume_usd': 300, 'price': 50000, 'change_24h': 5.0}
        monitor.update_baseline('BTCUSDT', data)
        # Old entry should be pruned, only 2 remain (not enough for median)
        volumes = monitor.volume_history['BTCUSDT']['volumes']
        timestamps = [v['timestamp'] for v in volumes]
        for ts in timestamps:
            assert datetime.fromisoformat(ts) > now - timedelta(hours=24)

    def test_detailed_history_capped_at_100(self, monitor):
        monitor.volume_history_detailed['BTCUSDT'] = [
            {'volume': i, 'price': 50000, 'change': 1.0,
             'timestamp': datetime.now().isoformat()}
            for i in range(100)
        ]
        data = {'volume_usd': 999, 'price': 50000, 'change_24h': 5.0}
        monitor.update_baseline('BTCUSDT', data)
        assert len(monitor.volume_history_detailed['BTCUSDT']) == 100


class TestFormatNumber:
    """Tests for number formatting."""

    def test_formats_billions(self, monitor):
        assert monitor.format_number(1_500_000_000) == "1.50B"

    def test_formats_millions(self, monitor):
        assert monitor.format_number(2_500_000) == "2.50M"

    def test_formats_thousands(self, monitor):
        assert monitor.format_number(1_500) == "1.50K"

    def test_formats_small_numbers(self, monitor):
        assert monitor.format_number(42.5) == "42.50"

    def test_formats_zero(self, monitor):
        assert monitor.format_number(0) == "0.00"

    def test_formats_exact_billion(self, monitor):
        assert monitor.format_number(1_000_000_000) == "1.00B"


class TestCSVExport:
    """Tests for CSV export functionality."""

    def test_creates_csv_file(self, monitor, temp_dir):
        data = {
            'BTCUSDT': {
                'symbol': 'BTC', 'price': 50000, 'change_24h': 5.0,
                'volume': 50000, 'volume_usd': 2_500_000_000,
                'high_24h': 51000, 'low_24h': 49000,
                'open_interest': 50_000_000, 'funding_rate': 0.01,
                'timestamp': '2024-01-01T00:00:00'
            }
        }
        filepath = str(temp_dir / "test_export.csv")
        result = monitor.export_to_csv(data, filename=filepath)
        assert os.path.exists(result)

    def test_csv_has_correct_headers(self, monitor, temp_dir):
        import csv
        data = {
            'BTCUSDT': {
                'symbol': 'BTC', 'price': 50000, 'change_24h': 5.0,
                'volume': 50000, 'volume_usd': 2_500_000_000,
                'high_24h': 51000, 'low_24h': 49000,
                'open_interest': 50_000_000, 'funding_rate': 0.01,
                'timestamp': '2024-01-01T00:00:00'
            }
        }
        filepath = str(temp_dir / "test_headers.csv")
        monitor.export_to_csv(data, filename=filepath)

        with open(filepath, 'r') as f:
            reader = csv.reader(f)
            headers = next(reader)

        expected = ['Symbol', 'Price', 'Change_24h', 'Volume_24h', 'Volume_USD',
                    'High_24h', 'Low_24h', 'Open_Interest', 'Funding_Rate', 'Timestamp']
        assert headers == expected

    def test_csv_sorts_by_volume_descending(self, monitor, temp_dir):
        import csv
        data = {
            'SMALL': {
                'symbol': 'SMALL', 'price': 1, 'change_24h': 0,
                'volume': 100, 'volume_usd': 100,
                'high_24h': 1, 'low_24h': 1,
                'open_interest': 0, 'funding_rate': 0,
                'timestamp': '2024-01-01T00:00:00'
            },
            'BIG': {
                'symbol': 'BIG', 'price': 1, 'change_24h': 0,
                'volume': 100, 'volume_usd': 999999,
                'high_24h': 1, 'low_24h': 1,
                'open_interest': 0, 'funding_rate': 0,
                'timestamp': '2024-01-01T00:00:00'
            }
        }
        filepath = str(temp_dir / "test_sort.csv")
        monitor.export_to_csv(data, filename=filepath)

        with open(filepath, 'r') as f:
            reader = csv.reader(f)
            next(reader)  # skip headers
            rows = list(reader)

        assert rows[0][0] == 'BIG'
        assert rows[1][0] == 'SMALL'


class TestDiscordAlert:
    """Tests for Discord webhook integration."""

    @patch('bybit_volume_monitor.requests.post')
    def test_sends_webhook_when_url_configured(self, mock_post, monitor):
        monitor.webhook_url = "https://discord.com/api/webhooks/test"
        mock_post.return_value = MagicMock(status_code=204)

        result = monitor.send_discord_alert('BTCUSDT', 5000000, 1000000, 5.0, 10.0)
        assert result is True
        mock_post.assert_called_once()

    def test_skips_when_no_webhook_url(self, monitor):
        monitor.webhook_url = None
        result = monitor.send_discord_alert('BTCUSDT', 5000000, 1000000, 5.0, 10.0)
        assert result is False

    @patch('bybit_volume_monitor.requests.post')
    def test_returns_false_on_non_204(self, mock_post, monitor):
        monitor.webhook_url = "https://discord.com/api/webhooks/test"
        mock_post.return_value = MagicMock(status_code=429)

        result = monitor.send_discord_alert('BTCUSDT', 5000000, 1000000, 5.0, 10.0)
        assert result is False

    @patch('bybit_volume_monitor.requests.post', side_effect=Exception("Network error"))
    def test_handles_network_error(self, mock_post, monitor):
        monitor.webhook_url = "https://discord.com/api/webhooks/test"
        result = monitor.send_discord_alert('BTCUSDT', 5000000, 1000000, 5.0, 10.0)
        assert result is False

    @patch('bybit_volume_monitor.requests.post')
    def test_embed_color_green_for_positive_change(self, mock_post, monitor):
        monitor.webhook_url = "https://discord.com/api/webhooks/test"
        mock_post.return_value = MagicMock(status_code=204)

        monitor.send_discord_alert('BTCUSDT', 5000000, 1000000, 5.0, 10.0)
        call_kwargs = mock_post.call_args
        embed = call_kwargs.kwargs['json']['embeds'][0]
        assert embed['color'] == 0x00ff00  # green

    @patch('bybit_volume_monitor.requests.post')
    def test_embed_color_red_for_negative_change(self, mock_post, monitor):
        monitor.webhook_url = "https://discord.com/api/webhooks/test"
        mock_post.return_value = MagicMock(status_code=204)

        monitor.send_discord_alert('BTCUSDT', 5000000, 1000000, 5.0, -5.0)
        call_kwargs = mock_post.call_args
        embed = call_kwargs.kwargs['json']['embeds'][0]
        assert embed['color'] == 0xff0000  # red


class TestDataPersistence:
    """Tests for save/load of JSON data files."""

    def test_save_and_load_volume_data(self, monitor, temp_dir):
        monitor.volume_history = {'BTCUSDT': {'baseline': 1000000, 'volumes': []}}
        monitor.save_data()

        assert os.path.exists(monitor.data_file)
        with open(monitor.data_file, 'r') as f:
            loaded = json.load(f)
        assert loaded['BTCUSDT']['baseline'] == 1000000

    def test_save_and_load_alerts(self, monitor, temp_dir):
        monitor.alerts_history = {'BTCUSDT': {'timestamp': '2024-01-01T00:00:00'}}
        monitor.save_alerts()

        assert os.path.exists(monitor.alerts_file)
        with open(monitor.alerts_file, 'r') as f:
            loaded = json.load(f)
        assert loaded['BTCUSDT']['timestamp'] == '2024-01-01T00:00:00'

    def test_load_data_creates_empty_dict_when_file_missing(self, monitor, temp_dir):
        monitor.data_file = str(temp_dir / "nonexistent.json")
        monitor.load_data()
        assert monitor.volume_history == {}


class TestGetAllTickers:
    """Tests for Bybit API interaction."""

    @patch('bybit_volume_monitor.requests.get')
    def test_returns_tickers_on_success(self, mock_get, monitor):
        mock_get.return_value = MagicMock(
            json=lambda: {
                'retCode': 0,
                'result': {'list': [{'symbol': 'BTCUSDT'}]}
            }
        )
        result = monitor.get_all_tickers()
        assert len(result) == 1
        assert result[0]['symbol'] == 'BTCUSDT'

    @patch('bybit_volume_monitor.requests.get')
    def test_returns_empty_on_api_error(self, mock_get, monitor):
        mock_get.return_value = MagicMock(
            json=lambda: {'retCode': 10001, 'retMsg': 'error'}
        )
        result = monitor.get_all_tickers()
        assert result == []

    @patch('bybit_volume_monitor.requests.get', side_effect=Exception("timeout"))
    def test_returns_empty_on_network_error(self, mock_get, monitor):
        result = monitor.get_all_tickers()
        assert result == []
