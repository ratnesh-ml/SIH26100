"""External and Mock Registry Adapters Subsystem."""

from pipeline.registry_adapters.base import (
    BaseRegistryProvider,
    RegistryProvider,
    RegistryResult,
)
from pipeline.registry_adapters.factory import get_registry_provider
from pipeline.registry_adapters.mock_adapter import MockRegistryProvider

__all__ = [
    "RegistryProvider",
    "BaseRegistryProvider",
    "RegistryResult",
    "MockRegistryProvider",
    "get_registry_provider",
]
