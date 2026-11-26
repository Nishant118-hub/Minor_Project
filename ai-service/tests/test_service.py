import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

import pandas as pd
from fastapi import HTTPException
from pydantic import ValidationError

from app.api.routes import predict_risk
from app.main import health_check
from app.recommendation_engine import recommend_training
from app.config import settings
from app.risk_model import (
    ml_model_available,
    predict_ml_risk,
    predict_rule_based_risk,
    train_model_from_csv,
    train_synthetic_model,
)
from app.schemas import AvailableTrainingModule, FeaturePayload
from app.schemas import MetaverseAnalysisRequest
from app.metaverse_engine import analyze_metaverse


class AiServiceContractTests(unittest.TestCase):
    def test_metaverse_analysis_covers_synopsis_topics_and_scenarios(self):
        result = analyze_metaverse(MetaverseAnalysisRequest(
            environment="VR",
            deepfakeConfidence=0.92,
            packetAnomalyScore=0.88,
            twinIntegrityScore=0.2,
            walletAnomalyScore=0.95,
            federatedRoundVariance=0.9,
        ))

        topics = {finding["topic"] for finding in result["findings"]}
        self.assertIn("Biometric continuous authentication", topics)
        self.assertIn("Deepfake and avatar impersonation", topics)
        self.assertIn("Metaverse intrusion detection", topics)
        self.assertIn("Digital-twin integrity", topics)
        self.assertIn("NFT, wallet, and smart-contract security", topics)
        self.assertIn("Federated edge learning", topics)
        self.assertEqual(len(result["attackScenarios"]), 3)
        self.assertGreaterEqual(result["overallRisk"], 0)
        self.assertLessEqual(result["overallRisk"], 100)

    def make_features(self, **overrides):
        values = {
            "click_rate": 0.05,
            "report_rate": 0.80,
            "credential_submission_rate": 0.0,
            "average_response_time": 900,
            "average_quiz_score": 90,
            "training_completion_rate": 0.90,
            "phishing_attempts": 2,
            "successful_reports": 2,
            "simulation_classifications": 0,
            "simulation_classification_accuracy": 0,
            "department": "Engineering",
            "seniority": "MID",
            "category_outcomes": {},
            "weak_areas": [],
        }
        values.update(overrides)
        return FeaturePayload(**values)

    def test_health_contract(self):
        response = health_check()

        self.assertEqual(response["service"], "ai-service")
        self.assertEqual(response["status"], "ok")

    def test_low_risk_profile_is_scored_low(self):
        prediction = predict_rule_based_risk(self.make_features())

        self.assertEqual(prediction.riskTier, "LOW")
        self.assertGreaterEqual(prediction.riskScore, 0)
        self.assertLess(prediction.riskScore, 35)
        self.assertEqual(prediction.model, "RULE_BASED_V1")

    def test_high_risk_profile_exposes_explainable_weak_areas(self):
        prediction = predict_rule_based_risk(
            self.make_features(
                click_rate=0.80,
                report_rate=0.05,
                credential_submission_rate=0.40,
                average_response_time=120,
                average_quiz_score=40,
                training_completion_rate=0.20,
                phishing_attempts=4,
                successful_reports=0,
                weak_areas=["fake_invoice"],
            )
        )

        self.assertEqual(prediction.riskTier, "HIGH")
        self.assertIn("Credential Safety", prediction.weakAreas)
        self.assertIn("Link Verification", prediction.weakAreas)
        self.assertIn("Invoice Phishing", prediction.weakAreas)
        self.assertGreater(prediction.contributingFactors["credentialSubmissionRisk"], 0)

    def test_recommendations_prioritize_matching_modules_without_duplicates(self):
        features = self.make_features(
            click_rate=0.50,
            credential_submission_rate=0.25,
            phishing_attempts=3,
            report_rate=0.10,
            weak_areas=["fake_invoice"],
        )
        modules = [
            AvailableTrainingModule(moduleId="credential", title="Credential Safety", category="Phishing", tags=["credential"]),
            AvailableTrainingModule(moduleId="invoice", title="Invoice Fraud", category="Phishing", tags=["invoice"]),
            AvailableTrainingModule(moduleId="reporting", title="How to Report Phishing", category="Phishing", tags=["report phishing"]),
        ]

        response = recommend_training(features, modules)
        ids = [item.moduleId for item in response.recommendations]

        self.assertEqual(response.riskTier, "MEDIUM")
        self.assertEqual(len(ids), len(set(ids)))
        self.assertEqual(ids[:2], ["credential", "invoice"])
        self.assertIn("reporting", ids)

    def test_feature_bounds_reject_invalid_rates(self):
        with self.assertRaises(ValidationError):
            self.make_features(click_rate=1.1)

        with self.assertRaises(ValidationError):
            self.make_features(average_quiz_score=-1)

    def test_simulation_classification_accuracy_adds_risk_and_training_recommendation(self):
        features = self.make_features(
            simulation_classifications=5,
            simulation_classification_accuracy=0.2,
        )
        prediction = predict_rule_based_risk(features)
        response = recommend_training(
            features,
            [AvailableTrainingModule(moduleId="verification", title="Phishing Message Verification", category="Awareness")],
        )

        self.assertEqual(prediction.contributingFactors["simulationClassificationRisk"], 4)
        self.assertEqual(prediction.weakAreas, ["Simulation Classification"])
        self.assertEqual([item.moduleId for item in response.recommendations], ["verification"])

    def test_csv_training_requires_examples_for_every_tier(self):
        row = {
            "click_rate": 0.1,
            "report_rate": 0.8,
            "credential_submission_rate": 0.0,
            "average_response_time": 900,
            "average_quiz_score": 90,
            "training_completion_rate": 0.9,
            "phishing_attempts": 10,
            "successful_reports": 8,
            "simulation_classifications": 0,
            "simulation_classification_accuracy": 0,
            "department": "Engineering",
            "seniority": "MID",
            "risk_tier": "LOW",
        }
        with TemporaryDirectory() as directory:
            csv_path = Path(directory) / "risk_training.csv"
            pd.DataFrame([row] * 60).to_csv(csv_path, index=False)
            with self.assertRaisesRegex(ValueError, "at least 10 labeled examples for each risk tier"):
                train_model_from_csv(csv_path)

    def test_human_labeled_csv_trains_a_production_eligible_model(self):
        rows = []
        profiles = {
            "LOW": (0.1, 0.8, 0.0, 900, 90, 0.9, 10, 8, 5, 0.9),
            "MEDIUM": (0.4, 0.4, 0.1, 600, 70, 0.6, 10, 4, 5, 0.6),
            "HIGH": (0.8, 0.05, 0.4, 120, 45, 0.2, 10, 0, 5, 0.2),
        }
        for tier, values in profiles.items():
            for _ in range(30):
                rows.append(dict(zip(
                    (
                        "click_rate", "report_rate", "credential_submission_rate",
                        "average_response_time", "average_quiz_score", "training_completion_rate",
                        "phishing_attempts", "successful_reports", "simulation_classifications",
                        "simulation_classification_accuracy",
                    ),
                    values,
                ), department="Engineering", seniority="MID", risk_tier=tier))

        with TemporaryDirectory() as directory:
            csv_path = Path(directory) / "risk_training.csv"
            model_path = Path(directory) / "risk_model.joblib"
            pd.DataFrame(rows).to_csv(csv_path, index=False)
            with patch.object(settings, "model_path", str(model_path)):
                result = train_model_from_csv(csv_path, seed=42)
                prediction = predict_ml_risk(
                    self.make_features(
                        simulation_classifications=5,
                        simulation_classification_accuracy=0.2,
                    )
                )
                self.assertTrue(ml_model_available())

        self.assertEqual(result["trainingSource"], "human_labeled_csv")
        self.assertEqual(result["classCounts"], {"LOW": 30, "MEDIUM": 30, "HIGH": 30})
        self.assertEqual(prediction.model, "ML_RANDOM_FOREST_HUMAN_LABELED_V1")
        self.assertIn(prediction.riskTier, {"LOW", "MEDIUM", "HIGH"})

    def test_random_forest_trains_reports_metrics_and_predicts(self):
        with TemporaryDirectory() as directory:
            model_path = str(Path(directory) / "risk_model.joblib")
            synthetic_path = str(Path(directory) / "risk_model.synthetic.joblib")
            with patch.object(settings, "model_path", model_path), patch.object(settings, "synthetic_model_path", synthetic_path):
                result = train_synthetic_model(samples=600, seed=42)
                self.assertFalse(ml_model_available())
                self.assertTrue(Path(synthetic_path).is_file())
                with self.assertRaises(HTTPException) as error:
                    predict_risk(self.make_features(), use_ml_model=True)
                self.assertEqual(error.exception.status_code, 503)

        self.assertEqual(result['model'], 'ML_RANDOM_FOREST_V1')
        self.assertEqual(result["trainingSource"], "synthetic_demo")
        for metric in ('validationAccuracy', 'validationPrecision', 'validationRecall', 'validationF1'):
            self.assertGreaterEqual(result[metric], 0)
            self.assertLessEqual(result[metric], 1)


if __name__ == "__main__":
    unittest.main()
