import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-quizzes-selection',
  standalone: true,
  imports: [
    NgFor
  ],
  templateUrl: './quizzes-selection.component.html',
  styleUrl: './quizzes-selection.component.css'
})
export class QuizzesSelectionComponent {
  // Hardcoded quiz data
  quizzes = [
    { id: 'austria', name: 'Austria' },
    { id: 'germany', name: 'Germany' },
    { id: 'greece', name: 'Greece' },
    { id: 'harry_potter', name: 'Harry Potter' },
    { id: 'history', name: 'History' },
    { id: 'IT', name: 'IT' }
  ];

  constructor(private router: Router) {}

  // Navigate to the quiz page with the appropriate quiz ID
  navigateToQuiz(quizId: string) {
    this.router.navigate(['/quiz', quizId]);
  }
}
