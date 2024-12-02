import whisper

model = whisper.load_model("small")

def transcribe_audio(audio_path):
    try:
        result = model.transcribe(audio_path)
        return result["text"]
    except Exception as e:
        return str(e)

if __name__ == "__main__":
    import sys
    import json

    if len(sys.argv) < 2:
        print(json.dumps({"error": "Audio file path not provided"}))
        sys.exit(1)

    audio_file_path = sys.argv[1]
    transcription = transcribe_audio(audio_file_path)
    print(json.dumps({"transcription": transcription}))
