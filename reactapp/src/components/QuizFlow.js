import React, { useState, useEffect } from "react";
import { fetchPredefinedQuizzes } from "../utils/api";
import { submitAnswer } from "../utils/api";
import "./QuizFlow.css";

const QuizFlow = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState("");
    const [feedback, setFeedback] = useState(null);

    useEffect(() => {
        const loadQuizzes = async () => {
            const fetchedQuizzes = await fetchPredefinedQuizzes();
            console.log("Fetched Quizzes:", fetchedQuizzes);
            if (fetchedQuizzes) {
                setQuizzes(fetchedQuizzes);
                // Play audio for the first question
                playAudio(fetchedQuizzes[0].audio);
            }
        };
        loadQuizzes();
    }, []);

    const playAudio = (audioPath) => {
        const audio = new Audio(audioPath);
        audio.play();
    };

    const handleAnswerSubmit = async () => {
        if (!quizzes || quizzes.length === 0) {
            alert('No quizzes available!');
            return;
        }
    
        const currentQuestion = quizzes[currentQuestionIndex];
        if (!currentQuestion) {
            alert('Current question is undefined!');
            return;
        }
    
        if (!userAnswer || userAnswer.trim() === '') {
            alert('Please enter an answer before submitting!');
            return;
        }
    
        try {
            const response = await submitAnswer({
                question: currentQuestion.question,
                userAnswer: userAnswer.trim(),
            });
    
            const isCorrect = response.correct;
            setFeedback(isCorrect ? 'Correct!' : 'Incorrect!');
    
            setTimeout(() => {
                setFeedback(null);
                setUserAnswer('');
                if (currentQuestionIndex < quizzes.length - 1) {
                    setCurrentQuestionIndex(currentQuestionIndex + 1);
                } else {
                    alert('You have completed the quiz!');
                }
            }, 1000);
        } catch (error) {
            console.error('Error submitting answer:', error);
            alert('Error submitting answer. Please try again.');
        }
    };           

    return (
        <div className="quiz-container">
            <h1 className="quiz-header">Quiz Questions</h1>
            {quizzes.length > 0 ? (
                <div className="quiz-card">
                    <h2 className="quiz-question">{quizzes[currentQuestionIndex]}</h2>
                    <input
                        className="quiz-input"
                        type="text"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Your answer"
                    />
                    <button className="quiz-submit" onClick={handleAnswerSubmit}>
                        Submit
                    </button>
                    {feedback && (
                        <p
                            className={`quiz-feedback ${
                                feedback === "Correct!" ? "correct" : "incorrect"
                            }`}
                        >
                            {feedback}
                        </p>
                    )}
                </div>
            ) : (
                <p>Loading questions...</p>
            )}
        </div>
    );
};

export default QuizFlow;