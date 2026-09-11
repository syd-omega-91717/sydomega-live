#!/usr/bin/env python3
"""
Ω SYD OMEGA 91717 — MONITORING CONFIGURATION VALIDATOR

Validates monitoring configuration, alert thresholds, and rate limiting policies.
Runs as part of CI/CD to ensure monitoring infrastructure is correctly configured.

Usage: python3 scripts/validate-monitoring.py [--strict]
"""

import json
import sys
from pathlib import Path

def load_monitoring_config():
    """Load monitoring configuration."""
    config_path = Path(__file__).parent.parent / 'monitoring-config.json'
    if not config_path.exists():
        print(f"ERROR: monitoring-config.json not found at {config_path}")
        return None

    with open(config_path, 'r') as f:
        return json.load(f)

def validate_thresholds(config):
    """Validate alert thresholds are correctly ordered."""
    issues = []

    for metric, thresholds in config['monitoring']['alertThresholds'].items():
        good = thresholds.get('good', float('inf'))
        warning = thresholds.get('warning', float('inf'))
        critical = thresholds.get('critical', float('inf'))

        # For metrics where higher is worse (latency, error rate)
        if metric in ['lcp', 'fid', 'ttfb', 'pageLoadTime', 'apiLatency', 'errorRate']:
            if not (good <= warning <= critical):
                issues.append(f"❌ {metric}: bad threshold order (good={good}, warning={warning}, critical={critical})")

        # For metrics where higher is better (cache hit rate)
        elif metric in ['cacheHitRate']:
            if not (good >= warning >= critical):
                issues.append(f"❌ {metric}: bad threshold order (good={good}, warning={warning}, critical={critical})")

    return issues

def validate_rate_limiting(config):
    """Validate rate limiting policies."""
    issues = []

    policies = config.get('rateLimit', {}).get('policies', [])

    for policy in policies:
        name = policy.get('name', 'unnamed')
        limit = policy.get('limit', 0)
        window = policy.get('window', 0)

        if limit <= 0:
            issues.append(f"❌ Rate limit '{name}': limit must be > 0 (got {limit})")

        if window <= 0:
            issues.append(f"❌ Rate limit '{name}': window must be > 0 (got {window})")

        if policy.get('type') not in ['sliding_window', 'concurrent', 'token_bucket']:
            issues.append(f"⚠️  Rate limit '{name}': unknown type '{policy.get('type')}'")

    return issues

def validate_alerts(config):
    """Validate alert configuration."""
    issues = []

    alerts = config['monitoring'].get('alerts', {})
    channels = alerts.get('channels', [])

    if not channels:
        issues.append("⚠️  No alert channels configured")

    for channel in channels:
        channel_type = channel.get('type', 'unknown')

        if channel_type == 'webhook':
            url = channel.get('url', '')
            if not url:
                issues.append("❌ Webhook alert missing URL")
            elif not url.startswith(('http://', 'https://', '/')):
                issues.append(f"❌ Webhook URL invalid: {url}")

    return issues

def main():
    """Validate monitoring configuration."""
    config = load_monitoring_config()
    if not config:
        return 1

    print("🔍 Validating Ω monitoring configuration...")

    all_issues = []

    # Validate thresholds
    threshold_issues = validate_thresholds(config)
    all_issues.extend(threshold_issues)

    # Validate rate limiting
    ratelimit_issues = validate_rate_limiting(config)
    all_issues.extend(ratelimit_issues)

    # Validate alerts
    alert_issues = validate_alerts(config)
    all_issues.extend(alert_issues)

    # Report results
    if all_issues:
        print("\nFindings:")
        for issue in all_issues:
            print(f"  {issue}")

        critical_count = sum(1 for i in all_issues if i.startswith("❌"))
        warning_count = sum(1 for i in all_issues if i.startswith("⚠️"))

        print(f"\nSummary: {critical_count} critical, {warning_count} warnings")
        return 1 if critical_count > 0 else 0
    else:
        print("✅ All monitoring validations passed")
        print(f"   Thresholds: {len(config['monitoring']['alertThresholds'])} metrics configured")
        print(f"   Rate limits: {len(config['rateLimit']['policies'])} policies configured")
        print(f"   Channels: {len(config['monitoring']['alerts']['channels'])} alert channels configured")
        return 0

if __name__ == '__main__':
    sys.exit(main())
