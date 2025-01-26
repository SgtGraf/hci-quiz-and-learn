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

        // Serve the generated speech file
        const speechFilePath = path.join(__dirname, '../python-scripts/speech.mp3');
        if (fs.existsSync(speechFilePath)) {
            res.setHeader('Content-Type', 'audio/mpeg');
            res.sendFile(speechFilePath, (err) => {
                if (err) {
                    console.error(`Error sending speech file: ${err}`);
                    res.status(500).json({ error: 'Error sending speech file' });
                } else {
                    console.log('Speech file sent successfully.');
                }
            });
        } else {
            res.status(500).json({ error: 'Speech file not found' });
        }
    });
};

