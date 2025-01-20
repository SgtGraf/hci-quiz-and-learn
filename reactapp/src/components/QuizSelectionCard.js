import React from "react";

const QuizSelectionCard = ({ onStart }) => {
  return (
    <div className="card text-center my-4">
      <div className="card-body">
        <h5 className="card-title">Quiz A</h5>
        <p className="card-text">Click the button below to start the quiz.</p>
        <button className="btn btn-primary" onClick={onStart}>
          Start Quiz
        </button>
      </div>
    </div>
  );
};

export default QuizSelectionCard;
