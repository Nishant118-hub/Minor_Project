from .risk_model import predict_rule_based_risk
from .schemas import AvailableTrainingModule, FeaturePayload, RecommendationResponse, TrainingRecommendation


def _module_text(module: AvailableTrainingModule) -> str:
    return " ".join([module.title, module.category, *module.tags]).lower()


def _matches(module: AvailableTrainingModule, keywords: tuple[str, ...], beginner_only: bool = False) -> bool:
    if beginner_only and module.difficulty.upper() != "BEGINNER":
        return False
    return any(keyword in _module_text(module) for keyword in keywords)


def _first_match(modules: list[AvailableTrainingModule], keywords: tuple[str, ...], beginner_only: bool = False) -> AvailableTrainingModule | None:
    return next((module for module in modules if _matches(module, keywords, beginner_only)), None)


def recommend_training(features: FeaturePayload, modules: list[AvailableTrainingModule]) -> RecommendationResponse:
    """Select existing training modules using explainable behavior-to-topic rules."""

    prediction = predict_rule_based_risk(features)
    recommendations: list[TrainingRecommendation] = []
    used_modules: set[str] = set()

    def add(keywords: tuple[str, ...], reason: str, priority: str, beginner_only: bool = False) -> None:
        module = _first_match(modules, keywords, beginner_only)
        if module and module.moduleId not in used_modules:
            used_modules.add(module.moduleId)
            recommendations.append(TrainingRecommendation(moduleId=module.moduleId, title=module.title, reason=reason, priority=priority))

    if features.credential_submission_rate > 0:
        add(("credential", "password", "account verification"), "Simulated credential submission indicates a need for credential-safety practice.", "HIGH")

    category_rules = {
        "fake_invoice": (("invoice",), "Simulated invoice-phishing interaction indicates invoice-fraud awareness is needed."),
        "urgent_ceo_request": (("ceo", "urgent", "executive"), "Urgent-request simulation behavior indicates business-email verification practice is needed."),
        "password_reset": (("password reset", "password"), "Password-reset simulation behavior indicates account-message verification practice is needed."),
        "delivery_notification": (("delivery", "package"), "Delivery-notification simulation behavior indicates delivery-scam awareness is needed."),
        "credential_harvest": (("credential", "account verification"), "Credential-harvest simulation behavior indicates credential-safety practice is needed."),
    }
    for category in features.weak_areas:
        rule = category_rules.get(category)
        if rule:
            add(rule[0], rule[1], "HIGH")

    if features.phishing_attempts > 0 and features.report_rate < 0.30:
        add(("report phishing", "reporting", "report"), "Low reporting activity suggests practicing how to report suspicious messages.", "HIGH")
    if features.simulation_classifications > 0 and features.simulation_classification_accuracy < 0.70:
        add(
            ("phishing", "verification", "report"),
            "Incorrect in-app simulation classifications indicate a need for more message-verification practice.",
            "HIGH",
        )
    if features.average_quiz_score < 70:
        add(("phishing", "fundamental", "basics"), "Quiz performance suggests revisiting foundational phishing-awareness material.", "MEDIUM", beginner_only=True)
    if features.training_completion_rate < 0.70:
        add(("phishing", "security awareness", "fundamental"), "Training completion is below the target level.", "MEDIUM", beginner_only=True)
    if not recommendations and prediction.riskTier != "LOW":
        add(("phishing", "security"), "Your current risk tier benefits from continued awareness training.", "MEDIUM")
    if not recommendations and modules:
        module = next((item for item in modules if item.difficulty.upper() == "BEGINNER"), modules[0])
        recommendations.append(TrainingRecommendation(moduleId=module.moduleId, title=module.title, reason="Continue regular security-awareness learning to maintain a strong baseline.", priority="LOW"))

    return RecommendationResponse(riskTier=prediction.riskTier, recommendations=recommendations[:5])


def recommendation_engine_status() -> str:
    return "rule_based_v1"
