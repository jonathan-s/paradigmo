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


if __name__ == "__main__":
    convert_csv_to_json()
