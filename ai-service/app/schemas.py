from pydantic import BaseModel, Field


class FeaturePayload(BaseModel):
    """Non-sensitive behavioral aggregates provided by the Node.js backend."""

    click_rate: float = Field(ge=0, le=1)
    report_rate: float = Field(ge=0, le=1)
    credential_submission_rate: float = Field(ge=0, le=1)
    average_response_time: float = Field(ge=0)
    average_quiz_score: float = Field(ge=0, le=100)
    training_completion_rate: float = Field(ge=0, le=1)
    phishing_attempts: int = Field(ge=0)
    successful_reports: int = Field(ge=0)
    simulation_classifications: int = Field(default=0, ge=0)
    simulation_classification_accuracy: float = Field(default=0, ge=0, le=1)
    department: str = Field(default="", max_length=100)
    seniority: str = Field(default="", max_length=50)
    category_outcomes: dict[str, dict[str, int]] = Field(default_factory=dict)
    weak_areas: list[str] = Field(default_factory=list)


class AvailableTrainingModule(BaseModel):
    moduleId: str = Field(min_length=1, max_length=100)
    title: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=100)
    difficulty: str = Field(default="BEGINNER", max_length=30)
    tags: list[str] = Field(default_factory=list)


class RecommendationRequest(BaseModel):
    features: FeaturePayload
    available_modules: list[AvailableTrainingModule] = Field(default_factory=list, max_length=200)


class TrainingRecommendation(BaseModel):
    moduleId: str
    title: str
    reason: str
    priority: str


class RecommendationResponse(BaseModel):
    riskTier: str
    recommendations: list[TrainingRecommendation]


class RiskPrediction(BaseModel):
    riskScore: float = Field(ge=0, le=100)
    riskTier: str
    weakAreas: list[str]
    contributingFactors: dict[str, float]
    model: str = "RULE_BASED_V1"


class SyntheticTrainingRequest(BaseModel):
    samples: int = Field(default=1000, ge=300, le=10000)
    seed: int = Field(default=42, ge=0, le=2_147_483_647)


class ModelTrainingResponse(BaseModel):
    model: str
    trainingSource: str
    samples: int
    validationAccuracy: float = Field(ge=0, le=1)
    validationPrecision: float = Field(ge=0, le=1)
    validationRecall: float = Field(ge=0, le=1)
    validationF1: float = Field(ge=0, le=1)
    modelPath: str


class ServiceUnavailableResponse(BaseModel):
    detail: str
