import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.html',
  styleUrls: ['./auth.css']
})

export class AuthComponent {
  isLoginMode = true; // Toggle between Login and Register
  successMessage: string = '';

  // Form Data
  authData = {
    email: '',
    username: '',
    phone: '',
    password: '',
    loginIdentifier: '' // Used for Email/Username/Phone in login
  };

  constructor(private router: Router, private http: HttpClient) {}

  onSwitchMode() {
    this.isLoginMode = !this.isLoginMode;
    this.successMessage = '';
  }

  onSubmit(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      alert("Please fill in all mandatory fields correctly.");
      return; 
    }

    // Determine the mock endpoint based on the mode
    const endpoint = this.isLoginMode ? '/api/login' : '/api/register';

    // 2. Wrap existing logic in an HTTP POST request
    this.http.post(endpoint, this.authData).subscribe({
      next: (response) => {
        console.log('Now it shows in Network Tab!');
        // The Interceptor is working! Now handle the local data
        this.handleAuthLogic(form);
      },
      error: (err) => {
        console.error('Network Error:', err);
        alert("Server error during authentication.");
      }
    });
  }

  // Moved your original LocalStorage logic here to keep onSubmit clean
  private handleAuthLogic(form: NgForm) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    if (!this.isLoginMode) {
      const isDuplicate = users.some((u: any) => 
          u.email === this.authData.email || u.username === this.authData.username
      );

      if (isDuplicate) {
          alert("Email or Username already exists!");
          return;
      }

      users.push({ ...this.authData });
      localStorage.setItem('users', JSON.stringify(users));

      this.successMessage = "Registration Successful! Please Login.";
      setTimeout(() => {
        this.isLoginMode = true;
        this.successMessage = '';
        form.resetForm();
      }, 2000);

    } else {

      const user = users.find((u: any) => 
          (u.email === this.authData.loginIdentifier || 
           u.username === this.authData.loginIdentifier || 
           u.phone === this.authData.loginIdentifier) && 
           u.password === this.authData.password
      );

      if (user) {
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.successMessage = "Login Successful! Redirecting...";
          
          // Small delay so the user sees the success message
          setTimeout(() => {
            this.router.navigate(['/board']);
          }, 1500);
      } else {
          alert("Invalid credentials.");
      }
    }
  }

  passwordVisible = false;
  togglePassword() {
    this.passwordVisible = !this.passwordVisible;
  }
}