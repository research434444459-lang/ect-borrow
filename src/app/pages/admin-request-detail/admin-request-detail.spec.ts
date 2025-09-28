import { TestBed } from '@angular/core/testing';
import { AdminRequestDetailComponent } from './admin-request-detail';

describe('AdminRequestDetailComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminRequestDetailComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const f = TestBed.createComponent(AdminRequestDetailComponent);
    expect(f.componentInstance).toBeTruthy();
  });
});
