import csv
import speech_synthesis
import speech_recognition
from flask import jsonify
import os

# Path to the CSV file
csv_file_path = "../data/quizzes/"

def get_quizzes():
    try:
        # List all files in the directory
        files = os.listdir(csv_file_path)
        # Filter out only CSV files
        csv_files = [file for file in files if file.endswith(".csv")]
        # Remove the file extension from the file names
        quiz_names = [os.path.splitext(file)[0] for file in csv_files]
        return jsonify(quiz_names)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def read_csv_file(file_name):
    # Dictionary to store the data
    question_answer = {}
    # Read the CSV file
    try:
        with open(csv_file_path + file_name + ".csv", mode="r", encoding="utf-8") as file:
            csv_reader = csv.DictReader(file, delimiter=";")
            for row in csv_reader:
                # Use the 'question' as the key and 'answer' as the value
                question = row["question"]
                answer = row["answer"]
                question_answer[question] = answer
    except FileNotFoundError:
        print(f"File not found: {csv_file_path}")
    except Exception as e:
        print(f"An error occurred: {e}")
    return question_answer

def get_question_answers(quiz_name = "IT"):
    question_answer = read_csv_file(quiz_name)
    if not question_answer:
        return jsonify({"error": "No questions available"}), 400
    # Convert the dictionary to a list of objects
    formatted_data = [{"question": question, "answer": answer} for question, answer in question_answer.items()]
    return jsonify(formatted_data)

def get_questions(quiz_name = "IT"):
    question_answer = read_csv_file(quiz_name)
    return list(question_answer.keys())

def get_answers(quiz_name = "IT"):
    question_answer = read_csv_file(quiz_name)
    return list(question_answer.values())

if __name__ == '__main__':
    question_answer = read_csv_file("IT")
    for question, answer in question_answer.items():
        speech_synthesis.text_to_speech(question, "question.mp3")
        # Wait for user to answer
        print("The given answer is:")
        speech_recognition.speech_to_text("../data/audio/answer.mp3")