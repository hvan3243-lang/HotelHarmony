import { User } from "@shared/schema";

interface AuthState {
  user: User | null;
  token: string | null;
}

class AuthManager {
  private state: AuthState = {
    user: null,
    token: null,
  };

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const token = localStorage.getItem("auth_token");
    const user = localStorage.getItem("auth_user");

    if (token && user) {
      this.state = {
        token,
        user: JSON.parse(user),
      };
    }
  }

  private saveToStorage() {
    if (this.state.token && this.state.user) {
      localStorage.setItem("auth_token", this.state.token);
      localStorage.setItem("auth_user", JSON.stringify(this.state.user));
    } else {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    }
  }

  login(user: User, token: string) {
    this.state = { user, token };
    this.saveToStorage();
  }

  logout() {
    this.state = { user: null, token: null };
    this.saveToStorage();
  }

  getUser(): User | null {
    return this.state.user;
  }

  setUser(user: User) {
    this.state.user = user;
    this.saveToStorage();
  }

  getToken(): string | null {
    return this.state.token;
  }

  isAuthenticated(): boolean {
    return !!this.state.token;
  }

  isAdmin(): boolean {
    return this.state.user?.role === "admin";
  }
}

export const authManager = new AuthManager();
