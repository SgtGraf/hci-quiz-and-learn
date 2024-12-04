import openai

def speech_to_text(audio_path):
    audio_file_path = audio_path

    try:
        with open(audio_file_path, "rb") as audio_file:
            response = openai.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file
            )

        transcription = response.text

        print(transcription)

    except Exception as e:
        print(f"An error occurred: {e}")