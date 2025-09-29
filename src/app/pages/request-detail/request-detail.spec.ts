import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';
import { RequestDetailComponent } from './request-detail';
import { RequestService } from '../../services/request.service';

describe('RequestDetailComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ studentId: '65080500444', date: '2025-09-12' }),
            },
          },
        },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        {
          provide: RequestService,
          useValue: {
            getRequestDetail: () =>
              of({
                studentId: '65080500444',
                name: 'ผู้ทดสอบ',
                date: '2025-09-12',
                status: 'อนุมัติ',
                // ใช้ device (ไม่ใช้ label) ให้ตรง type
                items: [{ device: 'Camera', quantity: 1, remarks: 'OK' }],
                notFoundAnswer: '',
                note: '',
                eventEquipment: '',
                extras: {},
              }),
          },
        },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(RequestDetailComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });
});
