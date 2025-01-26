import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [
    FormsModule,
    NgIf
  ],
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css'],
})
export class QuizComponent {
  questions: string[] = [];
  correctAnswers: string[] = [];
  currentQuestion: string = '';
  correctAnswer: string = '';
  userAnswer: string = '';
  recognizedText: string = '';
  questionIndex: number = 0;
  correctCount: number = 0; // Counter for correct answers
  totalQuestions: number = 0; // Total number of questions
  quizComplete: boolean = false; // Flag to indicate quiz completion
  percentage: number = 0; // Percentage of correct answers

  constructor(private http: HttpClient) {
    this.loadQuestions();
  }

  loadQuestions() {
    this.http.get<{ [key: string]: string }>('http://127.0.0.1:7990/api/question_answers').subscribe({
      next: (data) => {
        try {
          console.log("Raw JSON Data:", data);

          // Convert the dictionary to an array of question-answer objects
          const parsedData = Object.entries(data).map(([question, answer]) => ({
            question: question.trim(),
            answer: answer.trim()
          }));

          console.log("Parsed Data:", parsedData);

          // Map parsed data to questions and answers
          this.questions = parsedData.map(q => q.question);
          this.correctAnswers = parsedData.map(q => q.answer);
          this.totalQuestions = this.questions.length;

          // Set the first question and answer
          if (this.questions.length > 0) {
            this.currentQuestion = this.questions[0];
            this.correctAnswer = this.correctAnswers[0];
          } else {
            alert("No questions found in the data.");
          }
        } catch (error) {
          console.error("Error parsing JSON data:", error);
          alert("Failed to parse questions. Please contact support.");
        }
      },
      error: (error) => {
        console.error("Error fetching questions:", error);
        alert("Failed to load questions. Please try again.");
      }
    });
  }

  speakQuestion() {
    const utterance = new SpeechSynthesisUtterance(this.currentQuestion);
    utterance.lang = 'en-US';
    utterance.rate = 1;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
  }

  submitAnswer() {
    if (!this.currentQuestion || !this.userAnswer) {
      alert("Please provide an answer before submitting.");
      return;
    }

    // Payload
    const payload = {
      question: this.currentQuestion,
      user_answer: this.userAnswer,
      real_answer: this.correctAnswer
    };

    this.http.post('http://127.0.0.1:7990/api/evaluate_quiz', payload, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    }).subscribe({
      next: (response: any) => {
        console.log("Evaluation Response:", response);
        alert(response.evaluation); // Display feedback

        // Check if the response indicates a correct answer
        if (response.evaluation.toLowerCase().includes('correct')) {
          this.correctCount++;
        }

        this.loadNextQuestion();
      },
      error: (error) => {
        console.error("Error submitting answer:", error);
        alert("Failed to submit your answer. Please try again.");
      }
    });
  }

  startSpeechRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const spokenText = event.results[0][0].transcript;
      console.log("Recognized Speech:", spokenText);
      this.userAnswer = spokenText; // Populate the answer field
    };

    recognition.onerror = (error: any) => {
      console.error("Speech recognition error:", error);
      alert("Speech recognition failed. Please try again.");
    };

    recognition.start();
  }

  loadNextQuestion() {
    this.questionIndex++;
    if (this.questionIndex < this.questions.length) {
      this.currentQuestion = this.questions[this.questionIndex];
      this.correctAnswer = this.correctAnswers[this.questionIndex];
      this.userAnswer = '';
      this.recognizedText = '';
    } else {
      this.calculateResults();
    }
  }

  calculateResults() {
    this.quizComplete = true;
    this.percentage = Math.round((this.correctCount / this.totalQuestions) * 100);
    alert(`Quiz complete! You answered ${this.correctCount} out of ${this.totalQuestions} questions correctly (${this.percentage}%).`);
  }
}