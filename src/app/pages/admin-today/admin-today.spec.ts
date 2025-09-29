import { TestBed } from '@angular/core/testing';
import { AdminTodayComponent } from './admin-today';

describe('AdminTodayComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTodayComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AdminTodayComponent);
    const comp = fixture.componentInstance;
    expect(comp).toBeTruthy();
  });
});
