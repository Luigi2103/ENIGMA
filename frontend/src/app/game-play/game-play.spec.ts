import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamePlayComponent } from './game-play';

describe('GamePlayComponent', () => {
  let component: GamePlayComponent;
  let fixture: ComponentFixture<GamePlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GamePlayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GamePlayComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
