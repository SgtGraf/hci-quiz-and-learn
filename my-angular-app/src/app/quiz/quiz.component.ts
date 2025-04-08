import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

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
export class QuizComponent implements OnInit {
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
  loading: boolean = false;
  feedback: string = '';
  nextQuestionPending: boolean = false;
  useFiller: boolean = true;
  fillerAudioUrl: string = '';
  isSpeaking = false;
  started = false;
  finished: boolean = false;
  showTooltip: boolean = false;

  // Central audio controller
  private currentAudio: HTMLAudioElement | null = null;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.quizId = params['id'];
      if (this.quizId) {
        this.loadQuestions();
        this.answerFile = `${this.quizId}_answer.csv`;
      } else {
        console.error('Quiz ID not found in route parameters.');
        alert('Invalid quiz ID. Please try again.');
      }
    });
  }

  private stopCurrentAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  loadQuestions() {
    const apiUrl = `http://127.0.0.1:7990/api/question_answers?quiz=${this.quizId}`;

    this.http.get<{ question: string; answer: string }[]>(apiUrl).subscribe({
      next: (data) => {
        try {
          if (!Array.isArray(data) || data.length === 0) {
            throw new Error('No valid questions received.');
          }

          this.questions = data.map((item) => item.question.trim());
          this.correctAnswers = data.map((item) => item.answer.trim());
          this.totalQuestions = this.questions.length;

          if (this.totalQuestions > 0) {
            this.currentQuestion = this.questions[0];
            this.correctAnswer = this.correctAnswers[0];
            this.preloadFillerAudio();
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
    this.http.get('http://127.0.0.1:7990/api/filler_tts', { responseType: 'blob' }).subscribe({
      next: (audioBlob) => {
        this.fillerAudioUrl = URL.createObjectURL(audioBlob);
        console.log('Filler audio preloaded:', this.fillerAudioUrl);
      },
      error: (error) => {
        console.error('Error preloading filler TTS:', error);
        this.fillerAudioUrl = '';
      },
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

    this.stopCurrentAudio();

    const payload = { text: this.currentQuestion };

    this.http.post('http://127.0.0.1:7990/api/tts_stream', payload, { responseType: 'blob' })
      .subscribe({
        next: (audioBlob) => {
          const audioUrl = URL.createObjectURL(audioBlob);
          this.currentAudio = new Audio(audioUrl);
          this.currentAudio.play();
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

    this.playFillerAudio(() => {
      const payload = {
        question: this.currentQuestion,
        user_answer: this.userAnswer,
        real_answer: this.correctAnswer,
        answer_file: this.answerFile,
      };

      this.http.post('http://127.0.0.1:7990/api/evaluate_quiz', payload, {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      }).subscribe({
        next: (response: any) => {
          this.loading = false;
          this.feedback = response.evaluation;
          this.playFeedbackAudio(response.evaluation);
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
      setTimeout(() => {
        this.stopCurrentAudio();

        this.currentAudio = new Audio(this.fillerAudioUrl);
        this.currentAudio.onended = callback;
        this.currentAudio.play().then(() => console.log());
      }, 1500);
    } else {
      callback();
    }
  }

  playFeedbackAudio(feedbackText: string) {
    if (!feedbackText) {
      return;
    }

    this.stopCurrentAudio();

    const payload = { text: feedbackText };

    this.http.post('http://127.0.0.1:7990/api/tts_stream', payload, { responseType: 'blob' })
      .subscribe({
        next: (audioBlob) => {
          const audioUrl = URL.createObjectURL(audioBlob);
          this.currentAudio = new Audio(audioUrl);
          this.currentAudio.play();
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
      this.preloadFillerAudio();
      this.triggerTTS();
    } else {
      this.finished = true;
      this.calculateResults();
    }
  }

  calculateResults() {
    this.quizComplete = true;

    const payload = { file: this.answerFile };

    this.http.post('http://127.0.0.1:7990/api/get_points', payload, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    }).subscribe({
      next: (response: any) => {
        const user_points = parseInt(response.user_points, 10);
        const total_points = parseInt(response.total_points, 10);
        this.feedback = `Your score: ${user_points} / ${total_points}`;
        this.playFeedbackAudio(`Quiz completed! ${this.feedback}`);
      },
      error: (error) => {
        console.error('Error generating TTS:', error);
        alert('Failed to generate audio for feedback.');
      }
    });
  }

  navigateToQuizzes() {
    this.router.navigate(['/quizzes']);
  }
}
