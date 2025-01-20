// Fetch predefined quizzes
const API_BASE_URL = "http://127.0.0.1:7990";

export async function fetchPredefinedQuizzes() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/questions`);
        if (!response.ok) {
            throw new Error("Failed to fetch predefined quizzes");
        }
        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}

export const submitAnswer = async ({ question, userAnswer }) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/submit-answer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ question, userAnswer }),
        });

        if (!response.ok) {
            throw new Error("Failed to submit answer");
        }

        return await response.json();
    } catch (error) {
        console.error("Error submitting answer:", error);
        return null;
    }
};


// Submit answers for evaluation
export async function evaluateAnswer(questionId, userAnswer) {
  try {
      const response = await fetch(`${API_BASE_URL}/api/evaluate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId, answer: userAnswer }),
      });
      if (!response.ok) {
          throw new Error("Failed to evaluate answer");
      }
      return await response.json();
  } catch (error) {
      console.error(error);
      return null;
  }
}