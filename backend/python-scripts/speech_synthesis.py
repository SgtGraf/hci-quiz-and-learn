from openai import OpenAI
from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv()  # take environment variables from .env.

def text_to_speech(text, audio_path):
    # Path to save the audio file
    output_file_path = Path(audio_path)

    client = OpenAI(
        api_key=os.environ.get("OPENAI_API_KEY"),  # This is the default and can be omitted
    )

    try:
        # Generate audio using OpenAI's API
        response = client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=text,
        )

        # The audio content is in the response.content (raw audio bytes)
        audio_content = response.content

        # Save the audio content to a file
        with open(output_file_path, "wb") as audio_file:
            audio_file.write(audio_content)

    except Exception as e:
        print(f"An error occurred: {e}")
