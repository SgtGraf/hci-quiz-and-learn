const express = require('express');
const { spawn } = require('child_process');
const router = express.Router();
const questionAnswers = require('../data/question_answer.csv'); // Adjust path if needed

// GET route to fetch questions
router.get('/questions', (req, res) => {
    const python = spawn('python3', ['python-scripts/question.py', 'get_questions']);
    let data = '';

    python.stdout.on('data', (chunk) => {
        data += chunk;
    });

    python.stderr.on('data', (err) => {
        console.error('Error:', err.toString());
    });

    python.on('close', (code) => {
        if (code === 0) {
            try {
                const questions = JSON.parse(data);
                res.json(questions);
            } catch (err) {
                res.status(500).json({ error: 'Failed to parse questions from Python script.' });
            }
        } else {
            res.status(500).json({ error: 'Python script execution failed.' });
        }
    });
});

// POST route to compare answers
router.post('/submit-answer', (req, res) => {
    const { question, userAnswer } = req.body;

    if (!question || !userAnswer) {
        return res.status(400).json({ error: 'Question and user answer are required' });
    }

    // Fetch the correct answer from the CSV dictionary
    const correctAnswer = questionAnswers[question];
    if (!correctAnswer) {
        return res.status(404).json({ error: 'Question not found' });
    }

    const isCorrect = correctAnswer.trim().toLowerCase() === userAnswer.trim().toLowerCase();
    res.json({ correct: isCorrect });
});

module.exports = router;
