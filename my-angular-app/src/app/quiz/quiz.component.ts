import { Component, ChangeDetectorRef } from '@angular/core';
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
  correctCount: number = 0;
  totalQuestions: number = 0;
  quizComplete: boolean = false;
  percentage: number = 0;
  loading: boolean = false; // To control the spinner visibility
  feedback: string = ''; // To display the evaluation feedback
  nextQuestionPending: boolean = false;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {
    this.loadQuestions();
  }
  
  started = false;
  
  loadQuestions() {
    this.http
      .get<{ question: string; answer: string }[]>(
        'http://127.0.0.1:7990/api/question_answers?quiz=IT'
      )
      .subscribe({
        next: (data) => {
          try {
            console.log('Raw JSON Data:', data);

            if (!Array.isArray(data) || data.length === 0) {
              throw new Error('No valid questions received.');
            }

            this.questions = data.map((item) => item.question.trim());
            this.correctAnswers = data.map((item) => item.answer.trim());
            this.totalQuestions = this.questions.length;

            if (this.totalQuestions > 0) {
              this.currentQuestion = this.questions[0];
              this.correctAnswer = this.correctAnswers[0];
            } else {
              alert('No questions available.');
            }
          } catch (error) {
            console.error('Error parsing JSON data:', error);
            alert('Failed to parse questions. Please contact support.');
          }
        },
        error: (error) => {
          console.error('Error fetching questions:', error);
          alert('Failed to load questions. Please try again.');
        },
      });
  }
  
  startQuiz() {
    this.started = true;
  
    // Play the first question audio only after the quiz starts
    if (this.currentQuestion) {
      this.triggerTTS();
    }
  }

  triggerTTS() {
    const payload = { text: this.currentQuestion };

    // Make a POST request to the TTS streaming endpoint
    this.http.post('http://127.0.0.1:7990/api/tts_stream', payload, { responseType: 'blob' })
        .subscribe({
            next: (audioBlob) => {
                // Create a URL for the audio blob
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                audio.play(); // Play the audio
            },
            error: (error) => {
                console.error('Error generating TTS:', error);
                alert('Failed to generate audio for the question. Please try again.');
            }
        });
      }

  playAudio(audioUrl: string) {
    const audio = new Audio(audioUrl);
    audio.play().catch((error) => {
      console.error('Error playing audio:', error);
      alert('Failed to play the question audio. Please check your setup.');
    });
  }

  isSpeaking = false;

  startSpeechRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
  
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
  
    recognition.onstart = () => {
      this.isSpeaking = true;
      this.cdr.detectChanges(); // Notify Angular to update the UI
    };
  
    recognition.onresult = (event: any) => {
      const spokenText = event.results[0][0].transcript;
      console.log('Recognized Speech:', spokenText);
      this.userAnswer = spokenText; // Update the userAnswer field
      this.cdr.detectChanges();
    };
  
    recognition.onend = () => {
      this.isSpeaking = false;
      this.cdr.detectChanges();
    };
  
    recognition.onerror = (error: any) => {
      console.error('Speech recognition error:', error);
      alert('Speech recognition failed. Please try again.');
      this.isSpeaking = false;
      this.cdr.detectChanges();
    };
  
    recognition.start();
  }     

  submitAnswer() {
    if (!this.currentQuestion || !this.userAnswer) {
      alert('Please provide an answer before submitting.');
      return;
    }
  
    // Payload
    const payload = {
      question: this.currentQuestion,
      user_answer: this.userAnswer,
      real_answer: this.correctAnswer,
    };
  
    // Show the loading spinner
    this.loading = true;
    this.feedback = '';
    this.nextQuestionPending = false;
  
    this.http
      .post('http://127.0.0.1:7990/api/evaluate_quiz', payload, {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      })
      .subscribe({
        next: (response: any) => {
          console.log('Evaluation Response:', response);
  
          // Hide spinner and show feedback
          this.loading = false;
          this.feedback = response.evaluation;
  
          // Play the evaluation feedback
          this.playFeedbackAudio(this.feedback);
  
          // Increment correctCount if the answer is correct
          if (
            response.evaluation.toLowerCase().includes('your answer is correct')
          ) {
            this.correctCount++;
          }
  
          // Mark that the next question is ready to be loaded
          this.nextQuestionPending = true;
        },
        error: (error) => {
          console.error('Error submitting answer:', error);
          this.loading = false;
          this.feedback = 'Failed to submit your answer. Please try again.';
        },
      });
  }  

  playFeedbackAudio(feedbackText: string) {
    if (!feedbackText) {
      return;
    }
  
    const utterance = new SpeechSynthesisUtterance(feedbackText);
    const voices = speechSynthesis.getVoices(); // Fetch available voices
  
    // Find a more natural-sounding voice (modify based on preference)
    const preferredVoice = voices.find(
      (voice) =>
        voice.lang === 'en-US' && (voice.name.includes('Google') || voice.name.includes('Natural'))
    );
  
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
  
    utterance.lang = 'en-US';
    utterance.rate = 1.3; // Adjust as needed
    utterance.pitch = 2; // Adjust as needed
  
    speechSynthesis.cancel(); // Cancel any ongoing speech
    speechSynthesis.speak(utterance);
  }  

  closePopup() {
    // Hide the feedback popup
    this.feedback = '';
  
    // If the next question is pending, load it
    if (this.nextQuestionPending) {
      this.loadNextQuestion();
    }
  }

  loadNextQuestion() {
    this.questionIndex++;
    if (this.questionIndex < this.questions.length) {
      this.currentQuestion = this.questions[this.questionIndex];
      this.correctAnswer = this.correctAnswers[this.questionIndex];
      this.userAnswer = '';
      this.recognizedText = '';
      this.triggerTTS(); // Automatically play the next question
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