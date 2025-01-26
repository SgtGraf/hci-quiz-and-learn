import question
from flask_cors import CORS
from flask import Flask, request, jsonify, Response
import os
import whisper
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

# API Key from .env file
api_key = os.getenv("OPENAI_API_KEY")

# Initialize Flask and Whisper model
app = Flask(__name__)
model = whisper.load_model("base")

# Enable CORS for all routes
CORS(app, resources={r"/*": {"origins": "http://localhost:4200"}})


# Generate TTS Function (Real-time Streaming)
def stream_tts(input_text):
    client = OpenAI(api_key=api_key)

    try:
        response = client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=input_text
        )
        for chunk in response.iter_bytes():
            yield chunk
    except Exception as e:
        raise RuntimeError(f"TTS generation failed: {e}")


# Chat Evaluation Function
def evaluate_quiz_question(question, user_answer, real_answer):
    client = OpenAI(api_key=api_key)

    try:
        completion = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "You are an assistant tasked with evaluating user answers to quiz questions. The Real Answer is the solution provided by the quiz, stick to that. Provide feedback comparing the user's answer to the correct answer. Talk directly to the user and straight to the point. Keep it as short as possible."
                },
                {
                    "role": "user",
                    "content": f"Question: {question}\nUser Answer: {user_answer}\nReal Answer: {real_answer}"
                }
            ]
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        raise RuntimeError(f"Quiz evaluation failed: {e}")


# Flask Endpoints
@app.route('/api/question_answers', methods=['GET'])
def get_question_answers():
    return question.get_question_answers()

@app.route('/api/questions', methods=['GET'])
def get_questions():
    return question.get_questions()

@app.route('/api/answers', methods=['GET'])
def get_answers():
    return question.get_answers()


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
            mimetype="audio/mpeg",
            headers={
                "Content-Disposition": "inline; filename=speech.mp3",
                "Transfer-Encoding": "chunked"
            }
        )
    except Exception as e:
        return jsonify({"error": f"TTS generation failed: {e}"}), 500


# Chat Evaluation Endpoint
@app.route('/api/evaluate_quiz', methods=['POST'])
def evaluate_quiz():
    data = request.json
    question = data.get("question")
    user_answer = data.get("user_answer")
    real_answer = data.get("real_answer")

    if not all([question, user_answer, real_answer]):
        return jsonify({"error": "All fields (question, user_answer, real_answer) are required"}), 400

    try:
        evaluation = evaluate_quiz_question(question, user_answer, real_answer)
        return jsonify({"evaluation": evaluation})
    except Exception as e:
        return jsonify({"error": f"Evaluation failed: {e}"}), 500


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=7990)
