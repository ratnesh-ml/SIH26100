"""Factory for Statutory Registry Providers."""

import os
from typing import Optional

from pipeline.registry_adapters.base import RegistryProvider
from pipeline.registry_adapters.mock_adapter import MockRegistryProvider

_REGISTRY_INSTANCE: Optional[RegistryProvider] = None


def get_registry_provider(
    provider_type: Optional[str] = None,
    simulate_latency: Optional[bool] = None,
) -> RegistryProvider:
    """Resolve and cache configured RegistryProvider (mock for MVP, real in future)."""
    global _REGISTRY_INSTANCE
    selected = (provider_type or os.getenv("REGISTRY_PROVIDER", "mock")).lower()

    if selected == "mock":
        # Check env for latency simulation toggle (defaults to True for demo)
        sim_lat = simulate_latency if simulate_latency is not None else (
            os.getenv("SIMULATE_REGISTRY_LATENCY", "true").lower() in ("true", "1", "yes")
        )
        return MockRegistryProvider(simulate_latency=sim_lat)

    # Future real registry providers will be added here behind the same interface
    return MockRegistryProvider(simulate_latency=False)
