import math
from pathlib import Path

import pandas as pd

from .config import settings
from .models import RiskTier
from .schemas import FeaturePayload, RiskPrediction
from .training_data import generate_synthetic_training_data

NUMERIC_FEATURES = [
    "click_rate",
    "report_rate",
    "credential_submission_rate",
    "average_response_time",
    "average_quiz_score",
    "training_completion_rate",
    "phishing_attempts",
    "successful_reports",
    "simulation_classifications",
    "simulation_classification_accuracy",
]
CATEGORICAL_FEATURES = ["department", "seniority"]
MODEL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES


def _clamp(value: float) -> float:
    return min(1.0, max(0.0, value))


def _display_category(category: str) -> str:
    labels = {
        "fake_invoice": "Invoice Phishing",
        "urgent_ceo_request": "Urgent Requests",
        "credential_harvest": "Credential Safety",
        "password_reset": "Password Reset Messages",
        "delivery_notification": "Delivery Notifications",
        "general_phishing": "General Phishing",
    }
    return labels.get(category, category.replace("_", " ").title())


def predict_rule_based_risk(features: FeaturePayload) -> RiskPrediction:
    """Score aggregate behavior using explicit, auditable awareness-training rules."""

    click_risk = _clamp(features.click_rate) * 27.5
    credential_risk = _clamp(features.credential_submission_rate) * 27.5
    reporting_risk = (1 - _clamp(features.report_rate)) * 15
    quiz_risk = (1 - _clamp(features.average_quiz_score / 100)) * 10
    completion_risk = (1 - _clamp(features.training_completion_rate)) * 10
    classification_risk = (
        (1 - _clamp(features.simulation_classification_accuracy)) * 5
        if features.simulation_classifications > 0
        else 0.0
    )
    rapid_response_risk = 0.0
    if features.phishing_attempts > 0 and features.average_response_time < 300:
        rapid_response_risk = 5.0

    score = round(
        click_risk
        + credential_risk
        + reporting_risk
        + quiz_risk
        + completion_risk
        + classification_risk
        + rapid_response_risk,
        2,
    )
    tier = RiskTier.LOW if score < 35 else RiskTier.MEDIUM if score < 65 else RiskTier.HIGH

    weak_areas: list[str] = []
    if features.credential_submission_rate > 0:
        weak_areas.append("Credential Safety")
    if features.click_rate >= 0.15:
        weak_areas.append("Link Verification")
    if features.phishing_attempts > 0 and features.report_rate < 0.30:
        weak_areas.append("How to Report Phishing")
    if features.average_quiz_score < 70:
        weak_areas.append("Phishing Fundamentals")
    if features.training_completion_rate < 0.70:
        weak_areas.append("Training Completion")
    if features.simulation_classifications > 0 and features.simulation_classification_accuracy < 0.70:
        weak_areas.append("Simulation Classification")
    weak_areas.extend(_display_category(category) for category in features.weak_areas)
    weak_areas = list(dict.fromkeys(weak_areas))

    return RiskPrediction(
        riskScore=score,
        riskTier=tier.value,
        weakAreas=weak_areas,
        contributingFactors={
            "clickRisk": round(click_risk, 2),
            "credentialSubmissionRisk": round(credential_risk, 2),
            "lowReportingRisk": round(reporting_risk, 2),
            "quizPerformanceRisk": round(quiz_risk, 2),
            "trainingCompletionRisk": round(completion_risk, 2),
            "simulationClassificationRisk": round(classification_risk, 2),
            "rapidResponseRisk": round(rapid_response_risk, 2),
        },
    )


def risk_model_status() -> str:
    return "rule_based_v1"


def _model_file() -> Path:
    return Path(settings.model_path)


def _train_random_forest(
    features: pd.DataFrame,
    labels: pd.Series,
    seed: int,
    model_type: str,
    training_source: str,
    destination: str | Path | None = None,
) -> dict[str, object]:
    import joblib
    from sklearn.compose import ColumnTransformer
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
    from sklearn.model_selection import train_test_split
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import OneHotEncoder

    x_train, x_test, y_train, y_test = train_test_split(
        features, labels, test_size=0.2, random_state=seed, stratify=labels
    )
    preprocessor = ColumnTransformer(
        [
            ("numeric", "passthrough", NUMERIC_FEATURES),
            ("categorical", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
        ]
    )
    pipeline = Pipeline(
        [
            ("preprocessor", preprocessor),
            (
                "classifier",
                RandomForestClassifier(
                    n_estimators=250,
                    min_samples_leaf=2,
                    class_weight="balanced_subsample",
                    random_state=seed,
                    n_jobs=-1,
                ),
            ),
        ]
    )
    pipeline.fit(x_train, y_train)
    model_path = Path(destination) if destination else _model_file()
    model_path.parent.mkdir(parents=True, exist_ok=True)
    predictions = pipeline.predict(x_test)
    metrics = {
        "accuracy": round(float(accuracy_score(y_test, predictions)), 4),
        "precision": round(float(precision_score(y_test, predictions, average="macro", zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, predictions, average="macro", zero_division=0)), 4),
        "f1": round(float(f1_score(y_test, predictions, average="macro", zero_division=0)), 4),
    }
    joblib.dump(
        {
            "pipeline": pipeline,
            "model_type": model_type,
            "training_source": training_source,
            "feature_columns": MODEL_FEATURES,
        },
        model_path,
    )
    return {
        "model": model_type,
        "trainingSource": training_source,
        "samples": len(features),
        "validationAccuracy": metrics["accuracy"],
        "validationPrecision": metrics["precision"],
        "validationRecall": metrics["recall"],
        "validationF1": metrics["f1"],
        "modelPath": str(model_path),
    }


def train_synthetic_model(samples: int = 1000, seed: int = 42) -> dict[str, object]:
    """Train a reproducible demo model from synthetic data; not used for production predictions."""

    features, labels = generate_synthetic_training_data(samples=samples, seed=seed)
    return _train_random_forest(
        features,
        labels,
        seed,
        "ML_RANDOM_FOREST_V1",
        "synthetic_demo",
        destination=settings.synthetic_model_path,
    )


def train_model_from_csv(csv_path: str | Path, seed: int = 42) -> dict[str, object]:
    """Train from a local CSV containing aggregate features and human-reviewed risk tiers."""

    import pandas as pd

    path = Path(csv_path)
    if not path.is_file():
        raise FileNotFoundError(f"Training CSV not found: {path}")
    if path.stat().st_size > 10 * 1024 * 1024:
        raise ValueError("Training CSV must be 10 MB or smaller.")

    frame = pd.read_csv(path)
    frame.columns = [str(column).strip().lower() for column in frame.columns]
    if len(set(frame.columns)) != len(frame.columns):
        raise ValueError("Training CSV contains duplicate column names.")

    forbidden_columns = {
        "name", "email", "employee_id", "user_id", "username", "password", "token", "ip_address"
    }
    if forbidden_columns.intersection(frame.columns):
        raise ValueError("Remove direct identifiers and credentials from the training CSV.")

    required_columns = [*MODEL_FEATURES, "risk_tier"]
    missing_columns = sorted(set(required_columns) - set(frame.columns))
    unexpected_columns = sorted(set(frame.columns) - set(required_columns))
    if missing_columns or unexpected_columns:
        raise ValueError(
            f"Training CSV columns do not match the required schema; missing={missing_columns}, unexpected={unexpected_columns}."
        )
    if len(frame) < 60:
        raise ValueError("Training CSV must contain at least 60 labeled rows.")

    labels = frame["risk_tier"].astype("string").str.strip().str.upper()
    if labels.isna().any() or not set(labels.unique()).issubset({"LOW", "MEDIUM", "HIGH"}):
        raise ValueError("risk_tier values must be LOW, MEDIUM, or HIGH.")
    if any(labels.value_counts().get(tier, 0) < 10 for tier in ("LOW", "MEDIUM", "HIGH")):
        raise ValueError("Include at least 10 labeled examples for each risk tier.")

    for column in NUMERIC_FEATURES:
        frame[column] = pd.to_numeric(frame[column], errors="coerce")
        if frame[column].isna().any() or not all(math.isfinite(value) for value in frame[column]):
            raise ValueError(f"{column} must contain finite numeric values without blanks.")

    bounded_features = {
        "click_rate": (0, 1),
        "report_rate": (0, 1),
        "credential_submission_rate": (0, 1),
        "average_response_time": (0, None),
        "average_quiz_score": (0, 100),
        "training_completion_rate": (0, 1),
        "phishing_attempts": (0, None),
        "successful_reports": (0, None),
        "simulation_classifications": (0, None),
        "simulation_classification_accuracy": (0, 1),
    }
    for column, (minimum, maximum) in bounded_features.items():
        if (frame[column] < minimum).any() or (maximum is not None and (frame[column] > maximum).any()):
            raise ValueError(f"{column} contains values outside its allowed range.")
    for column in ("phishing_attempts", "successful_reports", "simulation_classifications"):
        if (frame[column] % 1 != 0).any():
            raise ValueError(f"{column} must contain whole-number counts.")
    if (frame["successful_reports"] > frame["phishing_attempts"]).any():
        raise ValueError("successful_reports cannot exceed phishing_attempts.")
    if (
        (frame["simulation_classifications"] == 0)
        & (frame["simulation_classification_accuracy"] != 0)
    ).any():
        raise ValueError("Classification accuracy must be 0 when there are no simulation classifications.")

    for column in CATEGORICAL_FEATURES:
        frame[column] = frame[column].astype("string").str.strip()
        if frame[column].isna().any() or frame[column].eq("").any():
            raise ValueError(f"{column} must contain a value for every row.")

    class_counts = {tier: int(labels.value_counts().get(tier, 0)) for tier in ("LOW", "MEDIUM", "HIGH")}
    result = _train_random_forest(
        frame[MODEL_FEATURES],
        labels,
        seed,
        "ML_RANDOM_FOREST_HUMAN_LABELED_V1",
        "human_labeled_csv",
    )
    result["classCounts"] = class_counts
    return result


def ml_model_available() -> bool:
    if not _model_file().is_file():
        return False
    import joblib

    artifact = joblib.load(_model_file())
    if not isinstance(artifact, dict):
        return False
    return (
        artifact.get("training_source") == "human_labeled_csv"
        and artifact.get("feature_columns") == MODEL_FEATURES
    )


def predict_ml_risk(features: FeaturePayload) -> RiskPrediction:
    """Predict with the saved model; caller must check that a real labeled model is available."""

    import joblib

    artifact = joblib.load(_model_file())
    if not isinstance(artifact, dict) or artifact.get("training_source") != "human_labeled_csv":
        raise ValueError("The saved model was not trained from human-labeled data. Train it locally with the labeled CSV.")
    if artifact.get("feature_columns") != MODEL_FEATURES:
        raise ValueError("The saved model feature schema is outdated. Retrain it using the local labeled CSV.")
    pipeline = artifact["pipeline"]
    frame = pd.DataFrame([{name: getattr(features, name) for name in MODEL_FEATURES}])
    probabilities = dict(zip(pipeline.classes_, pipeline.predict_proba(frame)[0]))
    score = round(float(probabilities.get("MEDIUM", 0) * 50 + probabilities.get("HIGH", 0) * 100), 2)
    tier = max(probabilities, key=probabilities.get)
    rule_prediction = predict_rule_based_risk(features)
    return RiskPrediction(
        riskScore=score,
        riskTier=tier,
        weakAreas=rule_prediction.weakAreas,
        contributingFactors={f"probability{label.title()}": round(float(value), 4) for label, value in probabilities.items()},
        model=artifact.get("model_type", "ML_RANDOM_FOREST_V1"),
    )
