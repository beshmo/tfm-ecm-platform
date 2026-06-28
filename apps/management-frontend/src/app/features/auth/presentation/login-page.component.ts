import { Component } from "@angular/core";

@Component({
  selector: "ecmp-login-page",
  standalone: true,
  template: `
    <main class="page">
      <h1>ECMP Management</h1>
      <p>Login shell placeholder.</p>
    </main>
  `,
  styles: [
    `
      .page {
        display: grid;
        min-height: 100vh;
        place-content: center;
        text-align: center;
      }
    `
  ]
})
export class LoginPageComponent {}
