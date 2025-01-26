import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    FormsModule,
    NgFor,
    NgIf
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  questions: string[] = [];
  recognizedText: string = '';
  textToSpeak: string = '';

  constructor(private http: HttpClient) {}

  fetchQuestions() {
    this.http.get<string[]>('http://127.0.0.1:7990/api/questions')
      .subscribe({
        next: (data) => {
          this.questions = data;
          console.log('Questions fetched:', data);
        },
        error: (err) => console.error('Error fetching questions:', err),
      });
  }

  startSpeechRecognition() {
    const recognition = new (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      this.recognizedText = event.results[0][0].transcript;
      console.log('Recognized Text:', this.recognizedText);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
    };

    recognition.start();
  }

  synthesizeSpeech() {
    if (!this.textToSpeak) {
      console.error('No text provided for speech synthesis.');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(this.textToSpeak);
    utterance.lang = 'en-US';
    utterance.rate = 1;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
  }
}