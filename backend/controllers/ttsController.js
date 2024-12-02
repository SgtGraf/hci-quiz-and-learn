const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

exports.synthesizeSpeech = (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: "Text is required" });
    }

    const python = spawn('python', [path.join(__dirname, '../python-scripts/tts.py'), text]);

    python.stderr.on('data', (data) => {
        console.error(`Python script error: ${data}`);
    });

    python.on('close', (code) => {
        if (code !== 0) {
            console.error(`Python script exited with code: ${code}`);
            return res.status(500).json({ error: 'Python script failed' });
        }

        // If the script succeeds, just return a 200 response
        res.status(200).json({ message: 'TTS generation succeeded' });
    });
};
