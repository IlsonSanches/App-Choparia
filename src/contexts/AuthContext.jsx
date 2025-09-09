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
      console.log('🔍 Carregando dados do usuário:', firebaseUser.uid);
      
      // Método 1: Buscar pelo documento com UID como ID
      const userDoc = await getDoc(doc(db, 'usuarios', firebaseUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('📄 Documento encontrado (método 1):', userData);
        setUserRole(userData.role || 'user');
        setUser({
          ...firebaseUser,
          role: userData.role || 'user',
          name: userData.name || firebaseUser.email,
          ...userData
        });
        return;
      }
      
      // Método 2: Buscar por query onde uid = firebaseUser.uid
      console.log('🔍 Documento não encontrado, tentando query...');
      const userQuery = query(
        collection(db, 'usuarios'),
        where('uid', '==', firebaseUser.uid)
      );
      const querySnapshot = await getDocs(userQuery);
      
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        console.log('📄 Documento encontrado (método 2):', userData);
        setUserRole(userData.role || 'user');
        setUser({
          ...firebaseUser,
          role: userData.role || 'user',
          name: userData.name || firebaseUser.email,
          ...userData
        });
        return;
      }
      
      // Se não existe no Firestore, considera como usuário comum
      console.log('❌ Nenhum documento encontrado, definindo como user');
      setUserRole('user');
      setUser({
        ...firebaseUser,
        role: 'user',
        name: firebaseUser.email
      });
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados do usuário:', error);
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
      
      // Método simplificado: primeiro verificar config do sistema
      try {
        const configDoc = await getDoc(doc(db, 'config', 'system'));
        if (configDoc.exists() && configDoc.data().hasAdmin) {
          console.log('👤 Admin confirmado via config do sistema');
          setHasAdmin(true);
          return true;
        }
      } catch (configError) {
        console.log('⚠️ Config do sistema não encontrada, tentando outros métodos');
      }
      
      // Método alternativo: tentar buscar todos os usuários
      try {
        const usersSnapshot = await getDocs(collection(db, 'usuarios'));
        
        if (usersSnapshot.empty) {
          console.log('📭 Nenhum usuário encontrado - primeiro acesso');
          setHasAdmin(false);
          return false;
        }
        
        // Verificar se algum usuário é admin
        let foundAdmin = false;
        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          if (userData.role === 'admin') {
            foundAdmin = true;
          }
        });
        
        console.log('👤 Admin encontrado via scan de usuários:', foundAdmin);
        setHasAdmin(foundAdmin);
        return foundAdmin;
        
      } catch (usersError) {
        console.log('⚠️ Erro ao acessar usuários:', usersError.message);
        
        // Se é erro de permissão, assumir primeiro acesso
        if (usersError.code === 'permission-denied' || 
            usersError.message.includes('permissions') ||
            usersError.message.includes('Missing or insufficient permissions')) {
          console.log('🔓 Erro de permissão - assumindo primeiro acesso');
          setHasAdmin(false);
          return false;
        }
      }
      
      // Fallback: assumir primeiro acesso
      console.log('❌ Todos os métodos falharam - assumindo primeiro acesso');
      setHasAdmin(false);
      return false;
      
    } catch (error) {
      console.error('❌ Erro crítico ao verificar admin:', error);
      setHasAdmin(false);
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      if (!isMounted) return;
      
      console.log('🚀 Inicializando autenticação...');
      
      // Primeiro verificar se existe admin
      await checkForAdmin();
      
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!isMounted) return;
        
        console.log('👤 Estado da autenticação mudou:', firebaseUser ? 'logado' : 'deslogado');
        
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

    const cleanup = initializeAuth();
    
    return () => {
      isMounted = false;
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(unsub => {
          if (unsub && typeof unsub === 'function') {
            unsub();
          }
        });
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
