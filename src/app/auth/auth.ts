import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
//import { HttpClient, HttpClientModule } from '@angular/common/http';

declare const google:any;
@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.html',
  styleUrls: ['./auth.css']
})

export class AuthComponent implements OnInit, AfterViewInit {
  isLoginMode = true; // Toggle between Login and Register
  successMessage: string = '';
  errorMessage: string | null = null;
  fieldErrors: any = {};
  passwordVisible = false;
  
  // Form Data
  authData = {
    email: '',
    username: '',
    phone: '',
    password: '',
    loginIdentifier: '' // Used for Email/Username/Phone in login
  };

  constructor(
    private router: Router, 
    //private http: HttpClient
  ) {}

  ngOnInit() {}

  ngAfterViewInit() {

    google.accounts.id.initialize({
      client_id: "131038262363-v1h7203mn6c6pb9616sivkknb6rkibos.apps.googleusercontent.com",
      callback: (response: any) => this.handleGoogleLogin(response)
    });

    google.accounts.id.renderButton(
      document.getElementById("googleSignInBtn"),
      {
        theme: "outline",
        size: "large",
        width: 240
      }
    );

  }

  handleGoogleLogin(response: any) {
    console.log("Google Token:", response);
    const decodedToken = JSON.parse(atob(response.credential.split('.')[1]));

    const googleUser = {
      username: decodedToken.name,
      email: decodedToken.email,
      profilePic: decodedToken.picture,
      provider: 'google'
    };

    console.log("Google User Data:", googleUser);
    localStorage.setItem("currentUser", JSON.stringify(googleUser));
    this.successMessage = "Google Login Successful! Redirecting...";
    this.router.navigate(['/board']);
  }

  clearError(field: string) {
    if (this.fieldErrors[field]) {
      this.fieldErrors[field] = null;
    }
    this.errorMessage = null; // Also clear any general top-level error
  }

  onSwitchMode() {
    this.isLoginMode = !this.isLoginMode;
    this.successMessage = '';
    this.fieldErrors = {};
    this.errorMessage = null;
  }

  togglePassword() {
    this.passwordVisible = !this.passwordVisible;
  }

  onSubmit(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

     this.handleAuthLogic(form);
  }

  // Moved your original LocalStorage logic here to keep onSubmit clean
  private handleAuthLogic(form: NgForm) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    this.fieldErrors = {};

    if (!this.isLoginMode) {
      const isDuplicate = users.some((u: any) => 
          u.email === this.authData.email || u.username === this.authData.username
      );

      if (isDuplicate) {
          this.errorMessage = "Email or Username already exists!";
          return;
      }

      users.push({ ...this.authData });
      localStorage.setItem('users', JSON.stringify(users));

      this.successMessage = "Registration Successful! Please Login.";
      setTimeout(() => {
        this.isLoginMode = true;
        form.resetForm();
        this.successMessage = '';
      }, 2000);

    } else {

      const userExists = users.find((u: any) => 
        u.email === this.authData.loginIdentifier || 
        u.username === this.authData.loginIdentifier
      );

      if (!userExists) {
        // Show error specifically for the identifier field
        this.fieldErrors.identifier = "User not found. Check your email/username.";
        return;
      }

      //  If user exists, check if the password matches
      if (userExists.password !== this.authData.password) {
        // Show error specifically for the password field
        this.fieldErrors.password = "Incorrect password. Please try again.";
        return;
      }

      // Success: If both are correct
      localStorage.setItem('currentUser', JSON.stringify(userExists));
      this.successMessage = "Login Successful! Redirecting...";
      this.router.navigate(['/board']);
    }
  }

}