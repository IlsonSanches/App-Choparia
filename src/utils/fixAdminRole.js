import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export const fixAdminRole = async () => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.error('❌ Nenhum usuário logado');
      return { success: false, message: 'Nenhum usuário logado' };
    }

    console.log('🔍 Verificando usuário atual:', currentUser.email);

    // Verificar se já existe no Firestore
    const userQuery = query(
      collection(db, 'usuarios'),
      where('uid', '==', currentUser.uid)
    );
    const userSnapshot = await getDocs(userQuery);

    if (!userSnapshot.empty) {
      // Atualizar usuário existente
      const userDoc = userSnapshot.docs[0];
      await updateDoc(doc(db, 'usuarios', userDoc.id), {
        role: 'admin',
        name: currentUser.displayName || currentUser.email,
        email: currentUser.email,
        updatedAt: new Date()
      });
      console.log('✅ Usuário atualizado para admin');
    } else {
      // Criar novo documento
      await addDoc(collection(db, 'usuarios'), {
        uid: currentUser.uid,
        name: currentUser.displayName || currentUser.email,
        email: currentUser.email,
        role: 'admin',
        createdAt: new Date(),
        active: true,
        isFirstAdmin: true
      });
      console.log('✅ Usuário criado como admin');
    }

    return { success: true, message: 'Usuário configurado como admin com sucesso!' };

  } catch (error) {
    console.error('❌ Erro ao corrigir role do admin:', error);
    return { success: false, message: error.message };
  }
};
