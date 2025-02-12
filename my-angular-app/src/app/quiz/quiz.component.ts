import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

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
  quizId: string = '';
  questions: string[] = [];
  correctAnswers: string[] = [];
  currentQuestion: string = '';
  correctAnswer: string = '';
  userAnswer: string = '';
  answerFile: string = '';
  recognizedText: string = '';
  questionIndex: number = 0;
  correctCount: number = 0;
  totalQuestions: number = 0;
  quizComplete: boolean = false;
  percentage: number = 0;
  loading: boolean = false; // To control the spinner visibility
  feedback: string = ''; // To display the evaluation feedback
  nextQuestionPending: boolean = false;
  useFiller: boolean = true;
  fillerAudioUrl: string = ''; // Stores preloaded filler phrase
  isSpeaking = false;
  started = false;

  // Tooltip visibility
  showTooltip: boolean = false;

  constructor(private route: ActivatedRoute, private http: HttpClient, private cdr: ChangeDetectorRef) {
  }

  ngOnInit() {
    // Wait for the route parameters to initialize before calling loadQuestions
    this.route.params.subscribe((params) => {
      this.quizId = params['id']; // Extract quiz ID from the URL
      if (this.quizId) {
        this.loadQuestions(); // Call loadQuestions only after quizId is set
        this.answerFile = `${this.quizId}_answer.csv`;
      } else {
        console.error('Quiz ID not found in route parameters.');
        alert('Invalid quiz ID. Please try again.');
      }
    });
  }

  loadQuestions() {
    const apiUrl = `http://127.0.0.1:7990/api/question_answers?quiz=${this.quizId}`;

    this.http
      .get<{ question: string; answer: string }[]>(apiUrl)
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
              this.preloadFillerAudio(); // Preload filler audio for lower latency
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
        },
      });
  }

  preloadFillerAudio() {
    this.http.get('http://127.0.0.1:7990/api/filler_tts', { responseType: 'blob' })
      .subscribe({
        next: (audioBlob) => {
          this.fillerAudioUrl = URL.createObjectURL(audioBlob);
          console.log('Filler audio preloaded:', this.fillerAudioUrl);
        },
        error: (error) => {
          console.error('Error preloading filler TTS:', error);
          this.fillerAudioUrl = ''; // Reset on error
        }
      });
  }

  startQuiz() {
    this.started = true;

    if (this.currentQuestion) {
      this.triggerTTS();
    }
  }

  toggleFiller() {
    this.useFiller = !this.useFiller;
  }

  triggerTTS() {
    if (!this.currentQuestion) {
      alert('No question available to replay.');
      return;
    }

    const payload = { text: this.currentQuestion };

    this.http.post('http://127.0.0.1:7990/api/tts_stream', payload, { responseType: 'blob' })
      .subscribe({
        next: (audioBlob) => {
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audio.play();
        },
        error: (error) => {
          console.error('Error generating TTS:', error);
          alert('Failed to generate audio for the question. Please try again.');
        }
      });
  }

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
      this.cdr.detectChanges();
    };

    recognition.onresult = (event: any) => {
      const spokenText = event.results[0][0].transcript;
      console.log('Recognized Speech:', spokenText);
      this.userAnswer = spokenText;
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

    this.loading = true;
    this.feedback = '';
    this.nextQuestionPending = false;

    // First, play the filler audio before submitting
    this.playFillerAudio(() => {
      const payload = {
        question: this.currentQuestion,
        user_answer: this.userAnswer,
        real_answer: this.correctAnswer,
        answer_file: this.answerFile,
      };

      this.http
        .post('http://127.0.0.1:7990/api/evaluate_quiz', payload, {
          headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        })
        .subscribe({
          next: (response: any) => {
            console.log('Evaluation Response:', response);

            this.loading = false;
            this.feedback = response.evaluation;

            // Play the evaluation feedback via TTS
            this.playFeedbackAudio(response.evaluation);

            if (response.evaluation.toLowerCase().includes('your answer is correct')) {
              this.correctCount++;
            }

            this.nextQuestionPending = true;
          },
          error: (error) => {
            console.error('Error submitting answer:', error);
            this.loading = false;
            this.feedback = 'Failed to submit your answer. Please try again.';
          },
        });
    });
  }

  playFillerAudio(callback: () => void) {
    if (this.fillerAudioUrl && this.useFiller) {
      const audio = new Audio(this.fillerAudioUrl);
      audio.onended = callback;
      audio.play();
    } else {
      callback();
    }
  }

  playFeedbackAudio(feedbackText: string) {
    if (!feedbackText) {
      return;
    }

    const payload = { text: feedbackText };

    this.http.post('http://127.0.0.1:7990/api/tts_stream', payload, { responseType: 'blob' })
      .subscribe({
        next: (audioBlob) => {
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audio.play();
        },
        error: (error) => {
          console.error('Error generating TTS:', error);
          alert('Failed to generate audio for feedback.');
        }
      });
  }

  closePopup() {
    this.feedback = '';

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
      this.preloadFillerAudio(); // Preload filler for next question
      this.triggerTTS();
    } else {
      this.calculateResults();
    }
  }

  calculateResults() {
    this.quizComplete = true;
    var user_points = 0
    var total_points = 0

    const payload = { file: this.answerFile };

    this.http.post('http://127.0.0.1:7990/api/get_points', payload, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    })
      .subscribe({
        next: (response: any) => {
            user_points = parseInt(response.user_points, 10);
            total_points = parseInt(response.total_points, 10);
            this.percentage = Math.round((user_points / total_points) * 100);
            alert(`Quiz complete! You reached ${user_points} out of ${total_points} points correctly (${this.percentage}%).`);
        },
        error: (error) => {
          console.error('Error generating TTS:', error);
          alert('Failed to generate audio for feedback.');
        }
      });
  }
}
