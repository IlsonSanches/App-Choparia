import React from 'react';
import { 
  BarChart3, 
  DollarSign, 
  History, 
  Menu, 
  X,
  Store,
  Users,
  LogOut,
  User,
  Shield,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Sidebar = ({ currentView, setCurrentView, isOpen, setIsOpen }) => {
  const { user, userRole, logout, isAdmin } = useAuth();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      description: 'Visão geral das vendas',
      roles: ['admin', 'user']
    },
    {
      id: 'vendas',
      label: 'Nova Venda',
      icon: DollarSign,
      description: 'Lançar nova venda',
      roles: ['admin', 'user']
    },
    {
      id: 'historico',
      label: 'Histórico',
      icon: History,
      description: 'Ver vendas anteriores',
      roles: ['admin']
    },
    {
      id: 'relatorios',
      label: 'Relatórios',
      icon: FileText,
      description: 'Análise por período',
      roles: ['admin']
    },
    {
      id: 'usuarios',
      label: 'Usuários',
      icon: Users,
      description: 'Gerenciar usuários',
      roles: ['admin']
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(userRole || 'user')
  );


  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-primary text-white z-30 transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-16'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600">
          <div className={`flex items-center space-x-3 ${!isOpen && 'justify-center'}`}>
            <Store className="w-8 h-8 text-accent" />
            {isOpen && (
              <div>
                <h1 className="text-xl font-bold">Choparia</h1>
                <p className="text-sm text-gray-300">Controle de Vendas</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded-lg hover:bg-secondary transition-colors"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="mt-6">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-secondary transition-colors ${
                  isActive ? 'bg-accent text-white border-r-4 border-white' : 'text-gray-300'
                } ${!isOpen && 'justify-center'}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isOpen && (
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-gray-400">{item.description}</div>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="absolute bottom-4 left-0 right-0 px-4">
          {isOpen && (
            <div className="bg-secondary rounded-lg p-3 mb-3">
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center">
                  {isAdmin() ? (
                    <Shield className="w-4 h-4 text-blue-600" />
                  ) : (
                    <User className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.name || 'Usuário'}
                  </p>
                  <p className="text-xs text-gray-300">
                    {isAdmin() ? 'Administrador' : 'Usuário'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </button>
            </div>
          )}
          
          {!isOpen && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-3 text-gray-300 hover:bg-secondary rounded-lg transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
