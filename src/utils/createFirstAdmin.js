import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export const createFirstAdmin = async (adminData) => {
  try {
    console.log('🔍 Verificando admins existentes...');
    
    // Tentar verificar se já existe algum admin (pode dar erro de permissão)
    try {
      const adminQuery = query(
        collection(db, 'usuarios'), 
        where('role', '==', 'admin')
      );
      const adminSnapshot = await getDocs(adminQuery);
      
      if (!adminSnapshot.empty) {
        throw new Error('Já existe um administrador no sistema');
      }
    } catch (permissionError) {
      console.log('⚠️ Não foi possível verificar admins existentes (normal na primeira vez)');
      // Continuar mesmo com erro de permissão
    }

    // Criar usuário no Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      adminData.email, 
      adminData.password
    );

    // Salvar dados do admin no Firestore
    await addDoc(collection(db, 'usuarios'), {
      uid: userCredential.user.uid,
      name: adminData.name,
      email: adminData.email,
      role: 'admin',
      createdAt: new Date(),
      active: true,
      isFirstAdmin: true
    });

    return {
      success: true,
      message: 'Administrador criado com sucesso!',
      user: userCredential.user
    };

  } catch (error) {
    console.error('Erro ao criar primeiro admin:', error);
    
    let errorMessage = 'Erro ao criar administrador';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'Este email já está em uso';
        break;
      case 'auth/weak-password':
        errorMessage = 'Senha muito fraca (mínimo 6 caracteres)';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Email inválido';
        break;
      default:
        errorMessage = error.message;
    }

    return {
      success: false,
      message: errorMessage
    };
  }
};
