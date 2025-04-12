import csv
import json
import os


def convert_csv_to_json():
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
                }
                questions.append(question)

        # Write to JSON file
        with open(output_path, "w", encoding="utf-8") as jsonfile:
            json.dump(questions, jsonfile, ensure_ascii=False, indent=2)

        print(f"Successfully converted CSV to JSON. Output saved to {output_path}")
        print(f"Total questions processed: {len(questions)}")

    except Exception as e:
        print(f"Error occurred: {str(e)}")


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

        print(
            f"Successfully converted numeric columns to JSON. Output saved to {output_path}"
        )
        print(f"Total columns processed: {len(columns)}")

    except Exception as e:
        print(f"Error occurred: {str(e)}")


def convert_party_info():
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
    convert_csv_to_json()
    convert_numeric_columns()
    convert_party_info()
