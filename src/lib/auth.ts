import { systemUsersApi } from './supabaseApi';

export interface AuthUser {
  id: number;
  username: string;
  role: string;
}

class AuthService {
  private currentUser: AuthUser | null = null;

  async login(username: string, password: string): Promise<AuthUser | null> {
    try {
      const user = await systemUsersApi.findByUsername(username);

      if (user && user.password === password) {
        this.currentUser = {
          id: Number(user.id),
          username: user.username,
          role: user.role
        };
        
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        
        return this.currentUser;
      }
      
      return null;
    } catch (error) {
      console.error('Erro no login:', error);
      return null;
    }
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
  }

  getCurrentUser(): AuthUser | null {
    if (this.currentUser) {
      return this.currentUser;
    }

    // Tentar recuperar do localStorage
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      this.currentUser = JSON.parse(stored);
      return this.currentUser;
    }

    return null;
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  hasPermission(permission: 'vendas' | 'estoque' | 'relatorios' | 'configuracoes'): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    if (user.role === 'admin') return true;

    // Estagiário só pode acessar vendas
    if (user.role === 'estagiario') {
      return permission === 'vendas';
    }

    // Vendedor pode acessar vendas e relatórios
    if (user.role === 'vendedor') {
      return permission === 'vendas' || permission === 'relatorios';
    }

    // Estoquista pode acessar estoque
    if (user.role === 'estoquista') {
      return permission === 'estoque';
    }

    return false;
  }
}

export const authService = new AuthService();