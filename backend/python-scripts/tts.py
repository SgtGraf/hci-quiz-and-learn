import sys
import os
from dotenv import load_dotenv
import warnings
from pathlib import Path
from openai import OpenAI

load_dotenv()

# API Key
api_key = os.getenv("OPENAI_API_KEY")

def generate_tts(input_text):
    client = OpenAI(api_key=api_key)
    speech_file_path = Path(__file__).parent / "speech.mp3"

    try:
        response = client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=input_text
        )

        with open(speech_file_path, "wb") as audio_file:
            for chunk in response.iter_bytes():
                audio_file.write(chunk)

        return str(speech_file_path)
    except Exception as e:
        raise RuntimeError(f"TTS generation failed: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)  # Exit with an error if input text is missing

    input_text = sys.argv[1]

    try:
        generate_tts(input_text)
        sys.exit(0)  # Exit with success
    except Exception as e:
        print(f"TTS generation error: {e}", file=sys.stderr)
        sys.exit(1)  # Exit with an error code
