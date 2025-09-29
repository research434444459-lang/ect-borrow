import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Forecast } from './forecast';

describe('Forecast', () => {
  let component: Forecast;
  let fixture: ComponentFixture<Forecast>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Forecast]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Forecast);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
