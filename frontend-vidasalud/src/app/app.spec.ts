import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { App } from './app';
import { MsalService } from '@azure/msal-angular';
import { AuthService } from './services/auth.service';

describe('App', () => {
  const mockMsalService = {
    handleRedirectObservable: () => of(null),
    instance: {
      setActiveAccount: () => {},
      getAllAccounts: () => [],
      getActiveAccount: () => null
    }
  };

  const mockAuthService = {
    refreshUserState: () => {},
    currentUser: () => null,
    isAuthenticated: () => false,
    hasRole: () => false
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: MsalService, useValue: mockMsalService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();
  });

  it('should create the app component', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});

