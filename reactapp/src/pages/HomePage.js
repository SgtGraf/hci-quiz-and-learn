import React, { useState, useEffect } from "react";
import { Container } from "react-bootstrap";

const HomePage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showQuestions, setShowQuestions] = useState(false);

    const [inputText, setInputText] = useState("");
    const [audioSrc, setAudioSrc] = useState(null);
    const [transcription, setTranscription] = useState("");

    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [recordedAudio, setRecordedAudio] = useState(null);

    // Fetch Questions on Page Load
    useEffect(() => {
        fetch("http://127.0.0.1:7990/api/questions")
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then((data) => {
                setData(data);
                setLoading(false);
            })
            .catch((error) => {
                setError(error.message);
                setLoading(false);
            });
    }, []);

    // Fetch Audio from TTS
    const fetchAudio = async () => {
        if (!inputText) {
            alert("Please enter some text!");
            return;
        }

        try {
            const response = await fetch("http://127.0.0.1:7990/api/tts_stream", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ text: inputText }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setAudioSrc(url);
        } catch (err) {
            setError(err.message);
            console.error("Error fetching audio:", err);
        }
    };

    // Start Recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });

            const recorder = new MediaRecorder(stream);
            setMediaRecorder(recorder);

            const audioChunks = [];
            recorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: "audio/mp3" });
                setRecordedAudio(audioBlob);
                transcribeAudio(audioBlob);
            };

            recorder.start();
            console.log("Recording started...");
        } catch (err) {
            console.error("Error starting recording:", err);
            setError(err.message);
        }
    };

    // Stop Recording
    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
            console.log("Recording stopped...");
        }
    };

    // Transcribe Audio
    const transcribeAudio = async (audioBlob) => {
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.mp3");

        try {
            const response = await fetch("http://127.0.0.1:7990/api/transcribe", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            setTranscription(result.transcription);
        } catch (err) {
            console.error("Error transcribing audio:", err);
            setError(err.message);
        }
    };

    const toggleVisibility = () => {
        setShowQuestions((prev) => !prev);
    };

    return (
        <Container className="text-center my-5">
            <h1>Welcome to the Homepage</h1>
            <p>This is the homepage of the application.</p>
            <button onClick={toggleVisibility}>
                {showQuestions ? "Hide Data" : "Show Data"}
            </button>

            {showQuestions && (
                <ul>
                    {data?.map((item, index) => (
                        <li key={index}>{JSON.stringify(item)}</li>
                    ))}
                </ul>
            )}

            <h1>Text-to-Speech (TTS) Generator</h1>
            <textarea
                placeholder="Enter text for TTS"
                rows="4"
                cols="50"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
            ></textarea>
            <br />
            <button onClick={fetchAudio} disabled={!inputText}>
                Generate Audio
            </button>

            <h2>Audio Playback</h2>
            {error ? (
                <p style={{ color: "red" }}>Error: {error}</p>
            ) : audioSrc ? (
                <audio controls autoPlay>
                    <source src={audioSrc} type="audio/mpeg" />
                    Your browser does not support the audio element.
                </audio>
            ) : (
                <p>No audio generated yet.</p>
            )}

            <h1>Audio Transcription</h1>
            <button onClick={startRecording}>Start Recording</button>
            <button onClick={stopRecording}>Stop Recording</button>


            {transcription && (
                <p>
                    <strong>Transcription:</strong> {transcription}
                </p>
            )}
        </Container>
    );
};

export default HomePage;
