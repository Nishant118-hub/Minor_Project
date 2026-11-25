import argparse
import json
from pathlib import Path

from app.risk_model import train_model_from_csv


def main() -> None:
    parser = argparse.ArgumentParser(description="Train the local risk model from a human-labeled CSV.")
    parser.add_argument("csv_path", type=Path, help="Path to a privacy-safe aggregate training CSV.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for the validation split.")
    arguments = parser.parse_args()

    try:
        result = train_model_from_csv(arguments.csv_path, seed=arguments.seed)
    except (FileNotFoundError, ValueError) as error:
        parser.error(str(error))
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
