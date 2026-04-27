import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  template: ''
})
export class AuthPageComponent {
  private readonly router = inject(Router);

  constructor() {
    void this.router.navigateByUrl('/login');
  }
}
