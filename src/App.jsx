import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SalesForm from './components/SalesForm';
import SalesHistory from './components/SalesHistory';
import UserManagement from './components/UserManagement';
import Login from './components/Login';
import FirstAdminSetup from './components/FirstAdminSetup';

const AppContent = () => {
  const { user, loading, hasAdmin, checkForAdmin } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não há admin no sistema, mostrar setup inicial
  if (hasAdmin === false) {
    return <FirstAdminSetup onAdminCreated={() => checkForAdmin()} />;
  }

  // Se não há usuário logado, mostrar login
  if (!user) {
    return <Login onLogin={() => {}} />;
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'vendas':
        return <SalesForm />;
      case 'historico':
        return <SalesHistory />;
      case 'usuarios':
        return <UserManagement />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        currentView={currentView}
        setCurrentView={setCurrentView}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <div className="h-full overflow-auto">
          {renderCurrentView()}
        </div>
      </main>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
