import csv
import question
from flask_cors import CORS
from flask import Flask, request, jsonify, Response
import os
import whisper
from dotenv import load_dotenv
from openai import OpenAI
import random

# Load environment variables
load_dotenv()

# API Key from .env file
api_key = os.getenv("OPENAI_API_KEY")

# Initialize Flask and Whisper model
app = Flask(__name__)
model = whisper.load_model("base")

# Enable CORS for all routes
CORS(app, resources={r"/*": {"origins": "http://localhost:4200"}})

# Store preloaded filler phrases
filler_phrases = []

def initialize_filler_phrases():
    """Generate 30 filler phrases at quiz initialization."""
    global filler_phrases
    client = OpenAI(api_key=api_key)

    try:
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Generate 30 unique short filler phrases to be used before evaluating a quiz answer. "
                        "The tone should be casual, natural, and encouraging. "
                        "Avoid overused expressions. "
                        "Each phrase must be about 10 words. "
                        "Separate them with a semicolon."

                    )
                }
            ]
        )
        filler_phrases = completion.choices[0].message.content.strip().split("; ")
        print(f"Preloaded {len(filler_phrases)} filler phrases.")

    except Exception as e:
        raise RuntimeError(f"Filler phrase initialization failed: {e}")

def generate_filler_phrase():
    """Pick a random filler phrase from the preloaded list."""
    if not filler_phrases:
        raise RuntimeError("Filler phrases not initialized. Run initialize_filler_phrases() first.")
    return random.choice(filler_phrases)

# Call this once at startup to preload phrases
initialize_filler_phrases()


# Generate TTS Function (Real-time Streaming)
def stream_tts(input_text):
    client = OpenAI(api_key=api_key)

    try:
        response = client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=input_text,
            response_format="opus"  # opus for lower latency
        )
        for chunk in response.iter_bytes():
            yield chunk
    except Exception as e:
        raise RuntimeError(f"TTS generation failed: {e}")


# Chat Evaluation Function
def evaluate_quiz_question(question, user_answer, real_answer, answer_file):
    client = OpenAI(api_key=api_key)

    try:
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are an assistant tasked with evaluating user answers to quiz questions. "
                               "The Real Answer is the solution provided by the quiz, stick to that. "
                               "Provide feedback comparing the user's answer to the correct answer. "
                               "Give points at the end from 1 to 10 in the format 'Points: 1/10' or 'Points: 10/10'."
                               "Talk directly to the user and keep it short."
                               "Don't offer help or more information."
                },
                {
                    "role": "user",
                    "content": f"Question: {question}\nUser Answer: {user_answer}\nReal Answer: {real_answer}"
                }
            ]
        )
        answer = completion.choices[0].message.content.strip()
        point = int(answer.split("Points: ")[1].split("/")[0])

        with open(f"../data/quizzes/{answer_file}", 'a', newline='') as file:
            writer = csv.writer(file, delimiter=';')
            if os.stat(f"../data/quizzes/{answer_file}").st_size == 0:
                print(answer_file, "is empty")
                writer.writerow(["question", "user answer", "real answer", "points"])
            writer.writerow([question, user_answer, real_answer, point])
        return answer
    except Exception as e:
        raise RuntimeError(f"Quiz evaluation failed: {e}")


# API: Fetch Quiz Questions and Answers
@app.route('/api/quizzes', methods=['GET'])
def get_quizzes():
    return question.get_quizzes()

@app.route('/api/question_answers', methods=['GET'])
def get_question_answers():
    quiz = request.args.get('quiz')
    if quiz is None:
        return question.get_questions()
    return question.get_question_answers(quiz)

@app.route('/api/questions', methods=['GET'])
def get_questions():
    quiz = request.args.get('quiz')
    if quiz is None:
        return question.get_questions()
    return question.get_questions(quiz)

@app.route('/api/answers', methods=['GET'])
def get_answers():
    quiz = request.args.get('quiz')
    if quiz is None:
        return question.get_questions()
    return question.get_answers(quiz)


# Audio Transcription Endpoint
@app.route('/api/transcribe', methods=['POST'])
def transcribe_audio():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file uploaded"}), 400

    audio_file = request.files['audio']
    audio_path = os.path.join("uploads", audio_file.filename)
    os.makedirs("uploads", exist_ok=True)
    audio_file.save(audio_path)

    try:
        result = model.transcribe(
            audio_path,
            language="en",
            word_timestamps=False,
            task="transcribe"
        )
        transcription = result["text"]
    except Exception as e:
        transcription = str(e)
    finally:
        os.remove(audio_path)

    return jsonify({"transcription": transcription})


# TTS Streaming Endpoint
@app.route('/api/tts_stream', methods=['POST'])
def tts_stream():
    input_text = request.json.get("text")
    if not input_text:
        return jsonify({"error": "No input text provided"}), 400

    try:
        return Response(
            stream_tts(input_text),
            mimetype="audio/ogg",
            headers={
                "Content-Disposition": "inline; filename=speech.ogg",
                "Transfer-Encoding": "chunked",
                "Access-Control-Allow-Origin": "http://localhost:4200"
            }
        )
    except Exception as e:
        return jsonify({"error": f"TTS generation failed: {e}"}), 500


# API: Filler TTS Streaming (Preloaded Filler Phrase)
@app.route('/api/filler_tts', methods=['GET'])
def filler_tts():
    try:
        filler_phrase = generate_filler_phrase()

        return Response(
            stream_tts(filler_phrase),
            mimetype="audio/ogg",
            headers={
                "Content-Disposition": "inline; filename=filler.ogg",
                "Transfer-Encoding": "chunked",
                "Access-Control-Allow-Origin": "http://localhost:4200"
            }
        )
    except Exception as e:
        return jsonify({"error": f"Filler TTS generation failed: {e}"}), 500


# Chat Evaluation Endpoint
@app.route('/api/evaluate_quiz', methods=['POST'])
def evaluate_quiz():
    data = request.json
    question = data.get("question")
    user_answer = data.get("user_answer")
    real_answer = data.get("real_answer")
    answer_file = data.get("answer_file")

    if not all([question, user_answer, real_answer]):
        return jsonify({"error": "All fields (question, user_answer, real_answer) are required"}), 400

    try:
        evaluation = evaluate_quiz_question(question, user_answer, real_answer, answer_file)
        return jsonify({"evaluation": evaluation})
    except Exception as e:
        return jsonify({"error": f"Evaluation failed: {e}"}), 500


@app.route('/api/get_points', methods=['POST'])
def get_points():
    data = request.json
    file = data.get("file")
    user_points = 0
    total_points = 0
    try:
        with open(f"../data/quizzes/{file}", mode="r", encoding="utf-8") as csvfile:
            csv_reader = csv.DictReader(csvfile, delimiter=";")
            for row in csv_reader:
                user_points += int(row["points"])
                total_points += 10
        os.remove(f"../data/quizzes/{file}")
    except FileNotFoundError:
        return jsonify({"error": f"File not found: {file}"}), 404
    except Exception as e:
        return jsonify({"error": f"An error occurred: {e}"}), 500

    return jsonify({"user_points": user_points, "total_points": total_points})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=7990)
