import React, { useState } from "react";

const QuestionCard = ({ question, onSubmit }) => {
  const [userAnswer, setUserAnswer] = useState("");

  const handleSubmit = () => {
    onSubmit(question, userAnswer);
    setUserAnswer("");
  };

  return (
    <div className="card my-3">
      <div className="card-body">
        <h5 className="card-title">{question}</h5>
        <input
          type="text"
          className="form-control"
          placeholder="Enter your answer"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
        />
        <button
          className="btn btn-primary mt-2"
          onClick={handleSubmit}
        >
          Submit Answer
        </button>
      </div>
    </div>
  );
};

export default QuestionCard;
