import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
   styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  currentStep = 1; // We use a 2-step form: step 1 = account info, step 2 = health info
 
  // Options for the dropdowns
  ageGroups = [
    { value: 'CHILD',       label: 'Child (under 12)' },
    { value: 'YOUNG_ADULT', label: 'Young Adult (12–35)' },
    { value: 'ADULT',       label: 'Adult (35–60)' },
    { value: 'ELDERLY',     label: 'Elderly (60+)' }
  ];
 
  healthConditions = [
    { value: 'NONE',          label: 'None / Healthy' },
    { value: 'ASTHMA',        label: 'Asthma' },
    { value: 'HEART_DISEASE', label: 'Heart Disease' },
    { value: 'DIABETES',      label: 'Diabetes' },
    { value: 'RESPIRATORY',   label: 'Respiratory Condition' }
  ]; 
    features = [
    {
      icon: '🌫️',
      text: 'Real-time air quality monitoring'
    },
    {
      icon: '❤️',
      text: 'Personalized health recommendations'
    },
    {
      icon: '📊',
      text: 'Daily AQI insights and alerts'
    },
    {
      icon: '🛡️',
      text: 'Protect your health from pollution'
    }
  ];
 
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      fullName:        ['', [Validators.required, Validators.minLength(2)]],
      email:           ['', [Validators.required, Validators.email]],
      password:        ['', [Validators.required, Validators.minLength(6)]],  
      ageGroup:        ['', Validators.required],
      healthCondition: ['', Validators.required]
    });
  }
 
  get f() { return this.registerForm.controls; }
 
  // Move to step 2 — only if step 1 fields are valid
  nextStep(): void {
    const step1Fields = ['fullName', 'email', 'password'];
    step1Fields.forEach(field => this.registerForm.get(field)?.markAsTouched());
 
    const step1Valid = step1Fields.every(field => this.registerForm.get(field)?.valid);
    if (step1Valid) this.currentStep = 2;
  }
 
  prevStep(): void {
    this.currentStep = 1;
  }
 
  onSubmit(): void {
    this.registerForm.markAllAsTouched();
    if (this.registerForm.invalid) return;
 
    this.isLoading = true;
    this.errorMessage = '';
 
    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
        this.currentStep = 1; // Go back to step 1 to show the error
      }
    });
  }
}
