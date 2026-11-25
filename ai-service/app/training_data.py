import numpy as np
import pandas as pd


def generate_synthetic_training_data(samples: int = 1000, seed: int = 42) -> tuple[pd.DataFrame, pd.Series]:
    """Generate labeled, non-personal behavior aggregates for model development only."""

    rng = np.random.default_rng(seed)
    behavior_profile = rng.choice(["LOW", "MEDIUM", "HIGH"], samples, p=[0.35, 0.40, 0.25])
    click_rate = np.empty(samples)
    report_rate = np.empty(samples)
    credential_submission_rate = np.empty(samples)
    average_response_time = np.empty(samples)
    average_quiz_score = np.empty(samples)
    training_completion_rate = np.empty(samples)
    simulation_classification_accuracy = np.empty(samples)

    profiles = {
        "LOW": {
            "click": (1.2, 8.0), "report": (8.0, 2.0), "credential": (0.0, 0.25),
            "response": (600, 7200), "quiz": (78, 100), "completion": (5.0, 2.0), "classification": (8.0, 2.0)
        },
        "MEDIUM": {
            "click": (2.5, 4.5), "report": (3.0, 3.0), "credential": (0.1, 0.55),
            "response": (180, 3600), "quiz": (55, 90), "completion": (3.0, 3.0), "classification": (5.0, 4.0)
        },
        "HIGH": {
            "click": (5.5, 2.0), "report": (1.5, 6.0), "credential": (0.3, 0.9),
            "response": (30, 1200), "quiz": (35, 75), "completion": (1.5, 4.0), "classification": (2.0, 6.0)
        },
    }
    for profile, parameters in profiles.items():
        selected = behavior_profile == profile
        count = int(selected.sum())
        click_rate[selected] = rng.beta(*parameters["click"], count)
        report_rate[selected] = rng.beta(*parameters["report"], count)
        credential_submission_rate[selected] = click_rate[selected] * rng.uniform(*parameters["credential"], count)
        average_response_time[selected] = rng.uniform(*parameters["response"], count)
        average_quiz_score[selected] = rng.uniform(*parameters["quiz"], count)
        training_completion_rate[selected] = rng.beta(*parameters["completion"], count)
        simulation_classification_accuracy[selected] = rng.beta(*parameters["classification"], count)
    phishing_attempts = rng.integers(1, 20, samples)
    successful_reports = np.minimum(
        phishing_attempts,
        np.round(report_rate * phishing_attempts).astype(int),
    )
    department = rng.choice(["Finance", "Operations", "Engineering", "Human Resources"], samples)
    seniority = rng.choice(["JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE"], samples)
    raw_score = (
        click_rate * 27.5
        + credential_submission_rate * 27.5
        + (1 - report_rate) * 15
        + (1 - average_quiz_score / 100) * 10
        + (1 - training_completion_rate) * 10
        + (1 - simulation_classification_accuracy) * 5
        + ((average_response_time < 300).astype(float) * 5)
        + rng.normal(0, 2, samples)
    )
    labels = np.where(raw_score < 35, "LOW", np.where(raw_score < 65, "MEDIUM", "HIGH"))
    features = pd.DataFrame(
        {
            "click_rate": click_rate,
            "report_rate": report_rate,
            "credential_submission_rate": credential_submission_rate,
            "average_response_time": average_response_time,
            "average_quiz_score": average_quiz_score,
            "training_completion_rate": training_completion_rate,
            "phishing_attempts": phishing_attempts,
            "successful_reports": successful_reports,
            "simulation_classifications": rng.integers(1, 20, samples),
            "simulation_classification_accuracy": simulation_classification_accuracy,
            "department": department,
            "seniority": seniority,
        }
    )
    return features, pd.Series(labels, name="risk_tier")
