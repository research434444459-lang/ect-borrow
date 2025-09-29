import { TestBed } from '@angular/core/testing';
import { AdminLoginComponent } from './admin-login';

describe('AdminLoginComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLoginComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AdminLoginComponent);
    const comp = fixture.componentInstance;
    expect(comp).toBeTruthy();
  });
});
