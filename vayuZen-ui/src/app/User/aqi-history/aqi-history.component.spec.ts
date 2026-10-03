import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AqiHistoryComponent } from './aqi-history.component';

describe('AqiHistoryComponent', () => {
  let component: AqiHistoryComponent;
  let fixture: ComponentFixture<AqiHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AqiHistoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AqiHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
