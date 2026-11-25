from .schemas import FeaturePayload


def normalize_features(features: FeaturePayload) -> dict[str, object]:
    """Create a serializable, validated feature dictionary without personal secrets."""

    return features.model_dump()
