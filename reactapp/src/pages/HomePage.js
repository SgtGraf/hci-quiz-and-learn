import React, { useState, useEffect } from "react";
import { Container } from "react-bootstrap";

const HomePage = () => {
    const [data, setData] = useState(null); // State to store API data
    const [loading, setLoading] = useState(true); // State to show loading
    const [error, setError] = useState(null); // State for errors
    const [showQuestions, setShowQuestions] = useState(false)

    const [audioSrc, setAudioSrc] = useState(null); // To store the audio URL

    useEffect(() => {
        // Fetch data from an API
        fetch("http://127.0.0.1:7990/api/questions") // Replace with your API endpoint
        .then((response) => {
            if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
            }
            let jsonData = response.json()
            return jsonData;
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

    useEffect(() => {
        // Fetch the audio file from the API
        const fetchAudio = async () => {
          try {
            const response = await fetch("http://127.0.0.1:7990/api/tts_stream"); // Replace with your API endpoint
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const blob = await response.blob(); // Convert the response to a Blob
            const url = URL.createObjectURL(blob); // Create an object URL for the audio
            setAudioSrc(url); // Set the URL as the audio source
          } catch (err) {
            setError(err.message);
            console.error("Error fetching audio:", err);
          }
        };
    
        fetchAudio();
      }, []);

    // Conditional rendering
    // if (loading) return <p>Loading...</p>;
    // if (error) return <p>Error: {error}</p>;

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
                {data.map((item, index) => (
                    <li key={index}>{JSON.stringify(item)}</li>
                ))}
                </ul>
            )}
            <h1>Audio Stream via REST API</h1>
            {error ? (
                <p>Error: {error}</p>
            ) : audioSrc ? (
                <audio controls autoPlay>
                <source src={audioSrc} type="audio/mpeg" />
                Your browser does not support the audio element.
                </audio>
            ) : (
                <p>Loading audio...</p>
            )}
        </Container>
    );
};

export default HomePage;
