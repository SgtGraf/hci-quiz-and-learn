import React, { useState } from "react";
import QuizSelectionCard from "../components/QuizSelectionCard";
import QuizFlow from "../components/QuizFlow";

const QuizzesPage = () => {
  const [startQuiz, setStartQuiz] = useState(false);

  return (
    <div>
      <h1>Quizzes</h1>
      {!startQuiz ? (
        <QuizSelectionCard onStart={() => setStartQuiz(true)} />
      ) : (
        <QuizFlow />
      )}
    </div>
  );
};

export default QuizzesPage;
