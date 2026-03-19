import { Component, OnInit, AfterViewInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';

declare const google: any;

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
    private ngZone: NgZone // Added NgZone to handle navigation back into Angular context
  ) {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.tryInitializeGoogle();
  }

  // New method to handle the "Missing Button" race condition
  private tryInitializeGoogle() {
    const interval = setInterval(() => {
      if (typeof google !== 'undefined' && google.accounts) {
        this.initializeGoogleButton();
        clearInterval(interval);
      }
    }, 100); // Check every 100ms until the script is loaded
  }

  private initializeGoogleButton() {
    google.accounts.id.initialize({
      client_id: "131038262363-v1h7203mn6c6pb9616sivkknb6rkibos.apps.googleusercontent.com",
      callback: (response: any) => this.handleGoogleLogin(response)
    });

    const btnContainer = document.getElementById("googleSignInBtn");
    if (btnContainer) {
      google.accounts.id.renderButton(
        btnContainer,
        {
          theme: "outline",
          size: "large",
          width: 240
        }
      );
    }
  }

  handleGoogleLogin(response: any) {
    console.log("Google Token:", response);
    // Decoding the JWT to get user info
    const decodedToken = JSON.parse(atob(response.credential.split('.')[1]));

    const googleUser = {
      username: decodedToken.name,
      email: decodedToken.email,
      profilePic: decodedToken.picture, // This is used for the board header
      provider: 'google'
    };

    console.log("Google User Data:", googleUser);
    
    // Using ngZone.run to ensure Angular detects the navigation change
    this.ngZone.run(() => {
      localStorage.setItem("currentUser", JSON.stringify(googleUser));
      this.successMessage = "Google Login Successful! Redirecting...";
      this.router.navigate(['/board']);
    });
  }

  clearError(field: string) {
    if (this.fieldErrors[field]) {
      this.fieldErrors[field] = null;
    }
    this.errorMessage = null; 
  }

  onSwitchMode() {
    this.isLoginMode = !this.isLoginMode;
    this.successMessage = '';
    this.fieldErrors = {};
    this.errorMessage = null;
    
    // Re-render Google button if switching back to login mode
    if (this.isLoginMode) {
      setTimeout(() => this.tryInitializeGoogle(), 0);
    }
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
        this.tryInitializeGoogle(); // Ensure button loads after switching to login
      }, 2000);

    } else {
      const userExists = users.find((u: any) => 
        u.email === this.authData.loginIdentifier || 
        u.username === this.authData.loginIdentifier
      );

      if (!userExists) {
        this.fieldErrors.identifier = "User not found. Check your email/username.";
        return;
      }

      if (userExists.password !== this.authData.password) {
        this.fieldErrors.password = "Incorrect password. Please try again.";
        return;
      }

      localStorage.setItem('currentUser', JSON.stringify(userExists));
      this.successMessage = "Login Successful! Redirecting...";
      this.router.navigate(['/board']);
    }
  }
}