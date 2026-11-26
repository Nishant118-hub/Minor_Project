from fastapi import APIRouter, HTTPException, Query, status

from ..feature_engineering import normalize_features
from ..recommendation_engine import recommend_training
from ..risk_model import ml_model_available, predict_ml_risk, predict_rule_based_risk, train_synthetic_model
from ..schemas import FeaturePayload, ModelTrainingResponse, RecommendationRequest, RecommendationResponse, SyntheticTrainingRequest
from ..schemas import MetaverseAnalysisRequest
from ..metaverse_engine import analyze_metaverse

router = APIRouter(tags=["AI service"])


@router.post("/analyze-metaverse")
def analyze_metaverse_endpoint(request: MetaverseAnalysisRequest) -> dict[str, object]:
    """Analyze bounded metaverse security signals with explainable defensive rules."""
    return analyze_metaverse(request)


@router.post("/extract-features")
def extract_features(features: FeaturePayload) -> dict[str, object]:
    """Validate and normalize aggregate behavior data from the internal backend."""
    return {"features": normalize_features(features)}


@router.post("/predict-risk")
def predict_risk(features: FeaturePayload, use_ml_model: bool = Query(default=False)):
    """Return a transparent risk score from aggregate awareness behavior."""
    if use_ml_model:
        if not ml_model_available():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="No current human-labeled model is available. Train locally with train_from_csv.py or use the rule-based model.",
            )
        return predict_ml_risk(features)
    return predict_rule_based_risk(features)


@router.post("/recommend-training")
def recommend_training_endpoint(request: RecommendationRequest) -> RecommendationResponse:
    """Recommend existing modules from aggregate risk features and weak areas."""
    return recommend_training(request.features, request.available_modules)


@router.post("/train-model")
def train_model(request: SyntheticTrainingRequest) -> ModelTrainingResponse:
    """Train a development-only synthetic classifier without replacing the production model."""
    return ModelTrainingResponse(**train_synthetic_model(samples=request.samples, seed=request.seed))
