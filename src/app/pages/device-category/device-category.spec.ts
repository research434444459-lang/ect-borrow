import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceCategory } from './device-category';

describe('DeviceCategory', () => {
  let component: DeviceCategory;
  let fixture: ComponentFixture<DeviceCategory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeviceCategory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeviceCategory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
