from openai import OpenAI
from dotenv import load_dotenv
import os
import sys
import json

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")

def evaluate_quiz_question(question, user_answer, real_answer):
    client = OpenAI(api_key=api_key)

    completion = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are an assistant tasked with evaluating user answers to quiz questions. The Real Answer is the solution provided by the quiz, stick to that. Provide feedback comparing the user's answer to the correct answer. Talk directly to the user and straight to the point. Keep it as short as possible"},
            {"role": "user", "content": f"Question: {question}\nUser Answer: {user_answer}\nReal Answer: {real_answer}"}
        ]
    )

    return completion.choices[0].message.content.strip()

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(json.dumps({"error": "Question, User Answer, and Real Answer are required"}))
        sys.exit(1)

    question = sys.argv[1]
    user_answer = sys.argv[2]
    real_answer = sys.argv[3]

    try:
        response = evaluate_quiz_question(question, user_answer, real_answer)
        print(json.dumps({"response": response}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
