import { Component, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
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

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {
    this.loadQuestions();
  }

  loadQuestions() {
    this.http.get<{ question: string; answer: string }[]>('http://127.0.0.1:7990/api/question_answers').subscribe({
      next: (data) => {
        try {
          console.log("Raw JSON Data:", data);
  
          if (!Array.isArray(data) || data.length === 0) {
            throw new Error("No valid questions received.");
          }
  
          this.questions = data.map(item => item.question.trim());
          this.correctAnswers = data.map(item => item.answer.trim());
          this.totalQuestions = this.questions.length;
  
          if (this.totalQuestions > 0) {
            this.currentQuestion = this.questions[0];
            this.correctAnswer = this.correctAnswers[0];
          } else {
            alert("No questions available.");
          }
        } catch (error) {
          console.error("Error parsing JSON data:", error);
          alert("Failed to parse questions. Please contact support.");
        }
      },
      error: (error) => {
        console.error("Error fetching questions:", error);
        alert("Failed to load questions. Please try again.");
      },
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
      real_answer: this.correctAnswer,
    };
  
    this.http.post('http://127.0.0.1:7990/api/evaluate_quiz', payload, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    }).subscribe({
      next: (response: any) => {
        console.log("Evaluation Response:", response);
        alert(response.evaluation); // Display feedback
  
        // Only increment correctCount if the evaluation clearly states the answer is correct
        if (response.evaluation.toLowerCase().includes('your answer is correct')) {
          this.correctCount++;
        }
  
        this.loadNextQuestion();
      },
      error: (error) => {
        console.error("Error submitting answer:", error);
        alert("Failed to submit your answer. Please try again.");
      },
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
      this.userAnswer = spokenText; // Update the userAnswer field

      // Notify Angular to detect changes
      this.cdr.detectChanges();
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