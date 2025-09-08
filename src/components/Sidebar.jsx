import React from 'react';
import { 
  BarChart3, 
  DollarSign, 
  History, 
  Menu, 
  X,
  Store
} from 'lucide-react';

const Sidebar = ({ currentView, setCurrentView, isOpen, setIsOpen }) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      description: 'Visão geral das vendas'
    },
    {
      id: 'vendas',
      label: 'Nova Venda',
      icon: DollarSign,
      description: 'Lançar nova venda'
    },
    {
      id: 'historico',
      label: 'Histórico',
      icon: History,
      description: 'Ver vendas anteriores'
    }
  ];

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
          {menuItems.map((item) => {
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

        {/* Footer */}
        {isOpen && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-secondary rounded-lg p-3">
              <p className="text-xs text-gray-300 text-center">
                App Choparia v1.0
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
