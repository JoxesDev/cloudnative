import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { MsalService } from '@azure/msal-angular';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private msalService = inject(MsalService);
  private authService = inject(AuthService);
  private router = inject(Router);
  title = 'VidaSalud';

  ngOnInit(): void {
    // Procesa el código o token que Microsoft Entra ID envía en el redirect
    this.msalService.handleRedirectObservable().subscribe({
      next: (result) => {
        if (result && result.account) {
          console.log('Autenticación Microsoft Entra ID completada:', result.account.username);
          this.msalService.instance.setActiveAccount(result.account);
          this.authService.refreshUserState();
          this.router.navigate(['/appointments']);
        } else {
          const accounts = this.msalService.instance.getAllAccounts();
          if (accounts.length > 0 && !this.msalService.instance.getActiveAccount()) {
            this.msalService.instance.setActiveAccount(accounts[0]);
          }
          this.authService.refreshUserState();
        }
      },
      error: (err) => {
        console.error('Error procesando respuesta de Microsoft Entra ID:', err);
        const accounts = this.msalService.instance.getAllAccounts();
        if (accounts.length > 0 && !this.msalService.instance.getActiveAccount()) {
          this.msalService.instance.setActiveAccount(accounts[0]);
        }
        this.authService.refreshUserState();
      }
    });
  }
}
