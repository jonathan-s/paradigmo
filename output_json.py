import csv
import json
import os


def questions_to_json():
    """
    Converts the questions to json format so that it can be handled by app.
    """
    # Path to the CSV file
    csv_path = "questions.csv"

    # Path to output JSON file
    output_dir = "src"
    output_path = os.path.join(output_dir, "questions.json")

    # Ensure the output directory exists
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # Read CSV and convert to list of dictionaries
    questions = []

    try:
        with open(csv_path, "r", encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                # Extract only the required fields
                question = {
                    "pergunta": row["pergunta"],
                    "type": row["type"],
                    "theme": row["theme"],
                    "short": True if int(row["short"]) == 1 else False,
                }
                questions.append(question)

        # Write to JSON file
        with open(output_path, "w", encoding="utf-8") as jsonfile:
            json.dump(questions, jsonfile, ensure_ascii=False, indent=2)

        print(f"Successfully converted CSV to JSON. Output saved to {output_path}")
        print(f"Total questions processed: {len(questions)}")

    except Exception as e:
        print(f"Error occurred: {str(e)}")


def calculate_compass_scores(entity_answers, all_questions_list, question_multipliers):
    """Calculates Economic, Social, and Political scores (-1 to 1) using multipliers."""
    scores = {"Economic": 0.0, "Social": 0.0, "Political": 0.0}
    econ_end = min(len(all_questions_list), NUM_ECONOMIC_QUESTIONS)
    social_end = min(
        len(all_questions_list), NUM_ECONOMIC_QUESTIONS + NUM_SOCIAL_QUESTIONS
    )
    political_end = min(len(all_questions_list), EXPECTED_TOTAL_QUESTIONS)
    axis_definitions = {
        "economic": all_questions_list[0:econ_end],
        "social": all_questions_list[NUM_ECONOMIC_QUESTIONS:social_end],
        "political": all_questions_list[
            NUM_ECONOMIC_QUESTIONS + NUM_SOCIAL_QUESTIONS : political_end
        ],
    }
    for axis_name, question_texts in axis_definitions.items():
        if question_texts:
            valid_answers = entity_answers.reindex(question_texts).dropna()
            num_answered = len(valid_answers)
            if num_answered > 0:
                relevant_multipliers = question_multipliers.reindex(valid_answers.index)
                weighted_score_sum = (valid_answers * relevant_multipliers).sum()
                normalized_score = weighted_score_sum / (num_answered * 2.0)
                scores[axis_name] = max(-1.0, min(1.0, normalized_score))
    return scores["Economic"], scores["Social"], scores["Political"]


def convert_numeric_columns():
    # Path to the CSV file
    csv_path = "questions.csv"

    # Path to output JSON file
    output_dir = "src"
    output_path = os.path.join(output_dir, "party_opinion.json")

    # Ensure the output directory exists
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # Non-numeric columns to exclude
    non_numeric_columns = ["pergunta", "type", "theme"]

    # Dictionary to store numeric data
    numeric_data = {}

    try:
        with open(csv_path, "r", encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)

            # Get all columns from the header
            columns = [
                col for col in reader.fieldnames if col not in non_numeric_columns
            ]

            # Initialize empty lists for all numeric columns
            for col in columns:
                numeric_data[col] = []

            # Process each row
            for row in reader:
                for col in columns:
                    try:
                        # Try to convert to integer, handle "NaN" as null
                        value = row[col]
                        if value == "NaN":
                            numeric_data[col].append(None)
                        else:
                            numeric_data[col].append(int(value))
                    except (ValueError, TypeError):
                        # If conversion fails, keep as is
                        numeric_data[col].append(row[col])

        # Write to JSON file
        with open(output_path, "w", encoding="utf-8") as jsonfile:
            json.dump(numeric_data, jsonfile, ensure_ascii=False)

    except Exception as e:
        print(f"Error occurred: {str(e)}")


def convert_party_info():
    """
    Convert the party info including the economic and social dimension.
    """

    # Path to the CSV file
    csv_path = "party_info.csv"

    # Path to output JSON file
    output_dir = "src"
    output_path = os.path.join(output_dir, "party_info.json")

    # Ensure the output directory exists
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # Dictionary to store party data
    party_data = {}

    try:
        with open(csv_path, "r", encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)

            # Process each row
            for row in reader:
                party_key = row["party_key"]
                party_data[party_key] = {
                    "fullname": row["fullname"],
                    "leaning": row["leaning"],
                    "blurb": row["party_blurb"],
                }

        # Write to JSON file
        with open(output_path, "w", encoding="utf-8") as jsonfile:
            json.dump(party_data, jsonfile, ensure_ascii=False, indent=2)

        print(
            f"Successfully converted party info to JSON. Output saved to {output_path}"
        )
        print(f"Total parties processed: {len(party_data)}")

    except Exception as e:
        print(f"Error occurred: {str(e)}")


if __name__ == "__main__":
    questions_to_json()
    convert_numeric_columns()
    print("Successfully converted numeric columns to JSON.")
    convert_party_info()
