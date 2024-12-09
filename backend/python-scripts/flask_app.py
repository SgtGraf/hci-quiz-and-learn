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


# Generate TTS Function (Real-time Streaming)
def stream_tts(input_text):
    client = OpenAI(api_key=api_key)

    try:
        # Call OpenAI API to generate TTS
        response = client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=input_text
        )

        # Yield audio chunks as they are generated
        for chunk in response.iter_bytes():
            yield chunk

    except Exception as e:
        raise RuntimeError(f"TTS generation failed: {e}")


# Flask Endpoints
@app.route('/api/question_answers', methods=['GET'])
def get_question_answers():
    return jsonify({"message": "Placeholder for question_answers"})


@app.route('/api/questions', methods=['GET'])
def get_questions():
    return jsonify({"message": "Placeholder for questions"})


@app.route('/api/answers', methods=['GET'])
def get_answers():
    return jsonify({"message": "Placeholder for answers"})


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
        # Stream audio response
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


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=7990)
