import React, { useState, useEffect } from "react";
import { Container } from "react-bootstrap";

const HomePage = () => {
    const [data, setData] = useState(null); // State to store API data
    const [loading, setLoading] = useState(true); // State to show loading
    const [error, setError] = useState(null); // State for errors
    const [showQuestions, setShowQuestions] = useState(false);

    const [inputText, setInputText] = useState(""); // State for user input
    const [audioSrc, setAudioSrc] = useState(null); // To store the audio URL

    // Fetch Questions on Page Load
    useEffect(() => {
        fetch("http://127.0.0.1:7990/api/questions") // Replace with your API endpoint
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

    // Fetch Audio on User Request
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
                body: JSON.stringify({ text: inputText }), // Send the input text
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            // Create audio URL from the streamed response
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setAudioSrc(url); // Set audio source
        } catch (err) {
            setError(err.message);
            console.error("Error fetching audio:", err);
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
        </Container>
    );
};

export default HomePage;
