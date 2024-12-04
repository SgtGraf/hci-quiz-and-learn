import csv
import speech_synthesis
import speech_recognition

# Path to the CSV file
csv_file_path = "../data/question_answer.csv"

# Dictionary to store the data
question_answer = {}

# Read the CSV file
try:
    with open(csv_file_path, mode="r", encoding="utf-8") as file:
        csv_reader = csv.DictReader(file)
        for row in csv_reader:
            # Use the 'question' as the key and 'answer' as the value
            question = row["question"]
            answer = row["answer"]
            question_answer[question] = answer

except FileNotFoundError:
    print(f"File not found: {csv_file_path}")
except Exception as e:
    print(f"An error occurred: {e}")

for question, answer in question_answer.items():
    speech_synthesis.text_to_speech(question, "question.mp3")
    # Wait for user to answer
    print("The given answer is:")
    speech_recognition.speech_to_text("../data/audio/answer.mp3")