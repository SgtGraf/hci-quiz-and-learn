const { spawn } = require('child_process');
const path = require('path');


exports.generateChatResponse = (req, res) => {
    const { question, user_answer, real_answer } = req.body;

    if (!question || !user_answer || !real_answer) {
        return res.status(400).json({ error: "Question, user answer, and real answer are required" });
    }

    const python = spawn('python', [
        path.join(__dirname, '../python-scripts/chat.py'),
        question,
        user_answer,
        real_answer,
    ]);

    let result = '';
    python.stdout.on('data', (data) => {
        result += data.toString();
    });

    python.stderr.on('data', (data) => {
        console.error(`Error: ${data}`);
    });

    python.on('close', (code) => {
        if (code !== 0) {
            return res.status(500).json({ error: 'Python script failed' });
        }

        try {
            const output = JSON.parse(result);
            if (output.error) {
                return res.status(500).json({ error: output.error });
            }
            res.json({ response: output.response });
        } catch (error) {
            res.status(500).json({ error: 'Invalid JSON response from Python script' });
        }
    });
};
