import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { authService } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Settings,
  Store,
  Users,
  LogOut,
  RotateCcw
} from 'lucide-react';
import logo from "../../public/logo.png"

interface LayoutProps {
  children: ReactNode;
  onLogout: () => void;
}

const Layout = ({ children, onLogout }: LayoutProps) => {
  const location = useLocation();
  const currentUser = authService.getCurrentUser();

  const navigation = [
    { name: 'PDV', href: '/', icon: ShoppingCart, permission: 'vendas' },
    { name: 'Estoque', href: '/estoque', icon: Package, permission: 'estoque' },
    { name: 'Relatórios', href: '/relatorios', icon: BarChart3, permission: 'relatorios' },
    { name: 'Devoluções', href: '/devolucoes', icon: RotateCcw, permission: 'vendas' },
    { name: 'Clientes', href: '/clientes', icon: Users, permission: 'configuracoes' },
    { name: 'Credores', href: '/credores', icon: Users, permission: 'configuracoes' },
    { name: 'Pagar/Receber', href: '/contaspagar', icon: Settings, permission: 'contaspagar' },
    { name: 'Configurações', href: '/configuracoes', icon: Settings, permission: 'configuracoes' },


  ].filter(item => authService.hasPermission(item.permission as any));

  return (
    // <div className="min-h-screen bg-background">
    //   {/* Header */}
    //   <header className="bg-card border-b border-border">
    //     <div className="flex items-center justify-between px-6 py-4">
    //       <div className="flex items-center space-x-4">
    //  <div className="flex items-center space-x-4">
    //     <img
    //       src={logo}
    //       alt="Boutique da Thaina"
    //       className="h-16 w-16 rounded-full object-cover"
    //     />
    //     <h1 className="text-3xl font-bold text-foreground">
    //       Boutique Thaina
    //     </h1>
    //   </div>


    //       </div>
    //       <div className="flex items-center space-x-4">
    //         <div className="text-sm text-muted-foreground">
    //           Usuário: <span className="font-medium">{currentUser?.username}</span>
    //           {currentUser?.role === 'admin' && <span className="text-primary"> (Thainá)</span>}
    //         </div>
    //         <Button 
    //           variant="ghost" 
    //           size="sm" 
    //           onClick={onLogout}
    //           className="text-muted-foreground hover:text-foreground"
    //         >
    //           <LogOut className="h-4 w-4 mr-2" />
    //           Sair
    //         </Button>
    //       </div>
    //     </div>
    //   </header>

    //   <div className="flex">
    //     {/* Sidebar */}
    //     <nav className="w-64 bg-card border-r border-border min-h-[calc(100vh-73px)]">
    //       <div className="p-4">
    //         <div className="space-y-2">
    //           {navigation.map((item) => {
    //             const Icon = item.icon;
    //             const isActive = location.pathname === item.href;
                
    //             return (
    //               <Link
    //                 key={item.name}
    //                 to={item.href}
    //                 className={cn(
    //                   'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
    //                   isActive
    //                     ? 'bg-primary text-primary-foreground'
    //                     : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    //                 )}
    //               >
    //                 <Icon className="h-5 w-5" />
    //                 <span className="font-medium">{item.name}</span>
    //               </Link>
    //             );
    //           })}
    //         </div>
    //       </div>
    //     </nav>

    //     {/* Main Content */}
    //     <main className="flex-1 bg-background">
    //       {children}
    //     </main>
    //   </div>
    // </div>
    <div className="min-h-screen bg-background">
  {/* Header */}
  <header className="bg-card border-b border-border">
    <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center space-x-2 sm:space-x-4">
        <img
          src={logo}
          alt="Boutique da Thaina"
          className="h-12 w-12 sm:h-16 sm:w-16 rounded-full object-cover"
        />
        <h1 className="text-xl sm:text-3xl font-bold text-foreground">
          Boutique Thaina
        </h1>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4 text-sm sm:text-base">
        <div className="text-muted-foreground">
          Usuário: <span className="font-medium">{currentUser?.username}</span>
          {currentUser?.role === 'admin' && <span className="text-primary"> (Thainá)</span>}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onLogout}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  </header>

  <div className="flex">
    {/* Sidebar */}
    <nav className="bg-card border-r border-border min-h-[calc(100vh-73px)]">
      <div className="flex flex-col sm:w-64 w-16">
        <div className="p-2 sm:p-4 flex flex-col space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center justify-center sm:justify-start px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="ml-0 sm:ml-3 hidden sm:inline font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>

    {/* Main Content */}
    <main className="flex-1 bg-background p-4 sm:p-6">
      {children}
    </main>
  </div>
</div>

  );
};

export default Layout;