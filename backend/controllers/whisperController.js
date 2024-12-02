const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

exports.transcribeAudio = (req, res) => {
    const audioPath = req.file.path;

    // Call the Python script with the MP3 file as input
    const python = spawn('python', [path.join(__dirname, '../python-scripts/transcribe.py'), audioPath]);

    let result = '';
    python.stdout.on('data', (data) => {
        result += data.toString();
    });

    python.stderr.on('data', (data) => {
        console.error(`Error: ${data}`);
    });

    python.on('close', (code) => {
        // Clean up the uploaded file
        fs.unlinkSync(audioPath); // Delete the original MP3 file

        if (code !== 0) {
            return res.status(500).json({ error: 'Python script failed' });
        }

        try {
            const output = JSON.parse(result);
            if (output.error) {
                return res.status(500).json({ error: output.error });
            }
            res.json({ transcription: output.transcription });
        } catch (error) {
            res.status(500).json({ error: 'Invalid JSON response from Python script' });
        }
    });
};
