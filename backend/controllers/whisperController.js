const { spawn } = require('child_process');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

exports.transcribeAudio = (req, res) => {
    const audioPath = req.file.path;
    const wavPath = `${audioPath}.wav`; // Ensure the output file is different

    // Convert audio to WAV format
    ffmpeg(audioPath)
        .toFormat('wav')
        .on('end', () => {
            // Call the Python script after conversion
            const python = spawn('python', [path.join(__dirname, '../python-scripts/transcribe.py'), wavPath]);

            let result = '';
            python.stdout.on('data', (data) => {
                result += data.toString();
            });

            python.stderr.on('data', (data) => {
                console.error(`Error: ${data}`);
            });

            python.on('close', (code) => {
                // Clean up files
                fs.unlinkSync(audioPath); // Delete original file
                fs.unlinkSync(wavPath);  // Delete converted WAV file

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
        })
        .on('error', (err) => {
            console.error(`FFmpeg Error: ${err.message}`);
            res.status(500).json({ error: 'Error converting audio to WAV format' });
        })
        .save(wavPath); // Save the WAV file
};
