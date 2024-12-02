const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

// Base URL for API routes
const BASE_URL = 'http://localhost:5000';

const callWhisperRoute = async (audioFilePath) => {
    const formData = new FormData();
    formData.append('audio', fs.createReadStream(audioFilePath));

    const response = await axios.post(`${BASE_URL}/api/whisper/transcribe`, formData, {
        headers: { ...formData.getHeaders() },
    });

    return response.data.transcription;
};

const callChatRoute = async (question, userAnswer, realAnswer) => {
    const response = await axios.post(`${BASE_URL}/api/chat`, {
        question,
        user_answer: userAnswer,
        real_answer: realAnswer,
    });

    return response.data.response;
};

const callTTSRoute = async (text) => {
    console.log('Sending text to TTS:', text);
    await axios.post(`${BASE_URL}/api/tts/generate`, { text });
    console.log('TTS generation succeeded.');
};

const processAudio = async (req, res) => {
    const { question, realAnswer } = req.body;
    const audioFilePath = req.file?.path;

    if (!question || !realAnswer || !audioFilePath) {
        return res.status(400).json({ error: 'Missing required fields: audio, question, or realAnswer.' });
    }

    try {
        console.log('Starting Whisper transcription...');
        const transcription = await callWhisperRoute(audioFilePath);
        console.log('Transcription complete:', transcription);

        console.log('Starting Chat processing...');
        const chatOutput = await callChatRoute(question, transcription, realAnswer);
        console.log('Chat processing complete:', chatOutput);

        console.log('Starting TTS generation...');
        await callTTSRoute(chatOutput);

        res.status(200).json({ message: 'Processing complete' });
    } catch (error) {
        console.error('Error in processing pipeline:', error.message);
        res.status(500).json({ error: error.message });
    } finally {
        if (audioFilePath) {
            console.log(`Cleaning up uploaded file: ${audioFilePath}`);
            fs.unlink(audioFilePath, (err) => {
                if (err) console.error(`Failed to delete file: ${audioFilePath}`);
            });
        }
    }
};

module.exports = { processAudio };
