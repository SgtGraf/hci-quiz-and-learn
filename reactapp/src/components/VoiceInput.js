import React from "react";

const VoiceInput = ({ onResult }) => {
    const startListening = () => {
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = "en-US";
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            onResult(transcript);
        };
        recognition.onerror = (event) => {
            console.error("Speech recognition error", event);
        };
        recognition.start();
    };

    return (
        <div>
            <button onClick={startListening}>Start Voice Input</button>
        </div>
    );
};

export default VoiceInput;