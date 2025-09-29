import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RequestsComponent } from './requests';
import { Router, ActivatedRoute, convertToParamMap } from '@angular/router';
import { RequestService } from '../../services/request.service';
import { of } from 'rxjs';

describe('RequestsComponent', () => {
  let component: RequestsComponent;
  let fixture: ComponentFixture<RequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestsComponent], // ✅ standalone component
      providers: [
        // mock service ให้ไม่ยิง API จริงตอนเทสต์
        { provide: RequestService, useValue: { list: () => of([]) } },
        // mock route params/query params
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
        // mock router
        { provide: Router, useValue: { navigate: () => {} } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
