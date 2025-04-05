import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { QuizComponent } from './quiz/quiz.component';
import { QuizzesSelectionComponent } from './quizzes-selection/quizzes-selection.component';

export const appRoutes: Routes = [
  { path: '', component: QuizzesSelectionComponent },
  { path: 'home', component: HomeComponent },
  { path: 'quizzes', component: QuizzesSelectionComponent },
  { path: 'quiz/:id', component: QuizComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}