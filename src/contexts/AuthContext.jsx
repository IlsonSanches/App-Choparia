import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAdmin, setHasAdmin] = useState(null);

  // Carregar dados do usuário do Firestore
  const loadUserData = async (firebaseUser) => {
    try {
      const userDoc = await getDoc(doc(db, 'usuarios', firebaseUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserRole(userData.role || 'user');
        setUser({
          ...firebaseUser,
          role: userData.role || 'user',
          name: userData.name || firebaseUser.email,
          ...userData
        });
      } else {
        // Se não existe no Firestore, considera como usuário comum
        setUserRole('user');
        setUser({
          ...firebaseUser,
          role: 'user',
          name: firebaseUser.email
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      setUserRole('user');
      setUser({
        ...firebaseUser,
        role: 'user',
        name: firebaseUser.email
      });
    }
  };

  // Verificar se existe algum admin no sistema
  const checkForAdmin = async () => {
    try {
      console.log('🔍 Verificando se existe admin...');
      const adminQuery = query(
        collection(db, 'usuarios'), 
        where('role', '==', 'admin')
      );
      const adminSnapshot = await getDocs(adminQuery);
      const hasAdminResult = !adminSnapshot.empty;
      console.log('👤 Admin encontrado:', hasAdminResult);
      setHasAdmin(hasAdminResult);
      return hasAdminResult;
    } catch (error) {
      console.error('❌ Erro ao verificar admin:', error);
      
      // Se for erro de permissão, assumir que não há admin (primeira vez)
      if (error.code === 'permission-denied' || error.message.includes('permissions')) {
        console.log('🔓 Erro de permissão - assumindo primeira configuração');
        setHasAdmin(false);
        return false;
      }
      
      // Outros erros também assumem que não há admin
      setHasAdmin(false);
      return false;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      // Primeiro verificar se existe admin
      await checkForAdmin();
      
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          await loadUserData(firebaseUser);
        } else {
          setUser(null);
          setUserRole(null);
        }
        setLoading(false);
      });

      return unsubscribe;
    };

    const unsubscribe = initializeAuth();
    
    return () => {
      if (unsubscribe && typeof unsubscribe.then === 'function') {
        unsubscribe.then(unsub => unsub());
      }
    };
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserRole(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const isAdmin = () => {
    return userRole === 'admin';
  };

  const isUser = () => {
    return userRole === 'user';
  };

  const value = {
    user,
    userRole,
    loading,
    hasAdmin,
    logout,
    isAdmin,
    isUser,
    loadUserData,
    checkForAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
