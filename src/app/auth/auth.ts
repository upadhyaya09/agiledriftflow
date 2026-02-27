import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.html',
  styleUrls: ['./auth.css']
})

export class AuthComponent {
  isLoginMode = true; // Toggle between Login and Register

  // Form Data
  authData = {
    email: '',
    username: '',
    phone: '',
    password: '',
    loginIdentifier: '' // Used for Email/Username/Phone in login
  };

  constructor(private router: Router) {}

  onSwitchMode() {
    this.isLoginMode = !this.isLoginMode;
  }

  onSubmit(form: NgForm) {
      // 1. BLOCK SUBMISSION IF HTML VALIDATION FAILS
      if (form.invalid) {
        // This  line marks every field as 'touched' 
        // This forces all your validation messages to pop up instantly!
        form.control.markAllAsTouched();
        alert("Please fill in all mandatory fields correctly.");
        return; 
      }

      // Get existing users from storage or start with an empty list
      const users = JSON.parse(localStorage.getItem('users') || '[]');

      if (!this.isLoginMode) {
         // REGISTER LOGIC
         const isDuplicate = users.some((u: any) => 
             u.email === this.authData.email || u.username === this.authData.username
         );

         if (isDuplicate) {
             alert("Email or Username already exists!");
             return;
         }

         // Save new user
         users.push({ ...this.authData });
         localStorage.setItem('users', JSON.stringify(users));
         alert("Registration Successful! Please Login.");
         this.isLoginMode = true;
         form.resetForm();
        } else {
         // LOGIN LOGIC
         const user = users.find((u: any) => 
             (u.email === this.authData.loginIdentifier || 
              u.username === this.authData.loginIdentifier || 
              u.phone === this.authData.loginIdentifier) && 
              u.password === this.authData.password
         );

         if (user) {
             localStorage.setItem('currentUser', JSON.stringify(user)); // Save session
             this.router.navigate(['/board']); // Success!
         } else {
             alert("Invalid credentials.");
         }
        }
    }

    passwordVisible = false;

    // Simple toggle function
    togglePassword() {
      this.passwordVisible = !this.passwordVisible;
    }
}