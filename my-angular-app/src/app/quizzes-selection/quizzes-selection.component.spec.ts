import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuizzesSelectionComponent } from './quizzes-selection.component';

describe('QuizzesSelectionComponent', () => {
  let component: QuizzesSelectionComponent;
  let fixture: ComponentFixture<QuizzesSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizzesSelectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuizzesSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
