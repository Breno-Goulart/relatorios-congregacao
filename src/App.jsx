import React, { useState, useMemo, useEffect, Suspense, lazy, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { auth, db } from './config/firebase'; 
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  updateDoc, 
  doc, 
  deleteDoc, 
  query, 
  orderBy, 
  setDoc, 
  getDocs, 
  where, 
  serverTimestamp 
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut, 
  setPersistence, 
  inMemoryPersistence 
} from 'firebase/auth';

import ImageLoader from './components/ImageLoader';
import { formatarNome, formatHoras } from './utils/formatters';

const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const FormularioPublicador = lazy(() => import('./pages/FormularioPublicador'));

const capaPadrao = "https://images.unsplash.com/photo-1579546678183-a84849910e97?q=80&w=1000&auto=format&fit=crop";

const meses = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
const opcoesEstudos = Array.from({ length: 51 }, (_, i) => i);

export default function App() {
  const [view, setView] = useState('form'); 
  const [reports, setReports] = useState([]);
  const [fechamentos, setFechamentos] = useState({});
  const [publicadoresList, setPublicadoresList] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  
  const [monthlyImage, setMonthlyImage] = useState(localStorage.getItem('@Capa_App') || '');

  useEffect(() => {
    if (monthlyImage && typeof monthlyImage === 'string' && monthlyImage.startsWith('http')) {
      localStorage.setItem('@Capa_App', monthlyImage);
      window.__ramCacheImg = new Image();
      window.__ramCacheImg.src = monthlyImage;
    }
  }, [monthlyImage]);
  
  const currentYear = new Date().getFullYear().toString();
  const currentMonth = new Date().toLocaleString('pt-BR', { month: 'long' }).toUpperCase();

  const [formData, setFormData] = useState({
    mes: currentMonth,
    ano: currentYear,
    nome: '',
    participou: 'SIM',
    tipo: 'Publicador(a)',
    estudos: '0',
    horas: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'publicadores'), (snap) => {
      setPublicadoresList(snap.docs.map(doc => doc.data().nome).filter(Boolean));
    }, (error) => {
      // Silenciado intencionalmente: permissão negada para usuários não logados lerem a base de publicadores diretamente
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!db) return;
    const configRef = doc(db, 'configuracoes', 'gerais');
    const unsub = onSnapshot(configRef, (docSnap) => {
      let coverImage = capaPadrao; 
      if (docSnap.exists() && docSnap.data().imagemCapa) {
        const linkDoBanco = docSnap.data().imagemCapa;
        if (typeof linkDoBanco === 'string' && linkDoBanco.startsWith('http')) {
           coverImage = linkDoBanco;
        }
      }
      setMonthlyImage(prev => prev !== coverImage ? coverImage : prev);
    }, (error) => {
      // Silencia intencionalmente o erro de permissão para usuários deslogados
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser || !db) return;
    const q = query(collection(db, 'relatorios'), orderBy('dataEnvio', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReports(data);
    }, (error) => {
      console.error("Erro ao sincronizar dados: ", error);
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'fechamentos'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = {};
      snapshot.docs.forEach(doc => {
        data[doc.id] = doc.data().fechado;
      });
      setFechamentos(data);
    }, (error) => {
      console.error("Erro ao sincronizar fechamentos: ", error);
    });
    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'horas') {
      setFormData(prev => ({ ...prev, [name]: formatHoras(value) }));
    } else if (name === 'nome') {
      setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const isSelectedMonthClosed = fechamentos[`${formData.mes}-${formData.ano}`] || false;

  const handleSubmit = async (e, customFormData) => {
    if (e) e.preventDefault();
    const dataToSubmit = customFormData || formData;

    if (!db) {
      alert("Erro crítico: Banco de dados inacessível.");
      return;
    }

    if (fechamentos[`${dataToSubmit.mes}-${dataToSubmit.ano}`]) {
      alert("Este mês já está fechado. Não é possível enviar relatórios.");
      return;
    }

    const nomeCorrigido = dataToSubmit.nome.trim().replace(/\s+/g, ' ').toUpperCase();
    const nomeBusca = nomeCorrigido.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (!nomeCorrigido) {
      alert("Por favor, insira um nome válido.");
      return;
    }

    try {
      const q = query(
        collection(db, 'relatorios'),
        where('nome', '==', nomeCorrigido),
        where('mes', '==', dataToSubmit.mes),
        where('ano', '==', dataToSubmit.ano)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        alert("Você já enviou seu relatório este mês.");
        return;
      }

      const newReport = {
        ...dataToSubmit,
        nome: nomeCorrigido, 
        nome_busca: nomeBusca,
        dataEnvio: serverTimestamp(),
        tipo: dataToSubmit.participou === 'NÃO' ? 'Publicador(a)' : dataToSubmit.tipo,
        estudos: dataToSubmit.participou === 'NÃO' ? '0' : (dataToSubmit.estudos || '0'),
        horas: (dataToSubmit.participou === 'SIM' && dataToSubmit.tipo?.includes('Pioneiro')) ? (dataToSubmit.horas || '0') : null
      };
      
      await addDoc(collection(db, 'relatorios'), newReport);
      
      try {
        const pubQuery = query(collection(db, 'publicadores'), where('nome', '==', nomeCorrigido));
        const pubSnap = await getDocs(pubQuery);
        if (pubSnap.empty) {
          await addDoc(collection(db, 'publicadores'), {
            nome: nomeCorrigido,
            nome_busca: nomeBusca,
            tipo_padrao: newReport.tipo,
            dataCriacao: serverTimestamp()
          });
        }
      } catch (error) {
        // Silenciado intencionalmente: Usuários públicos não têm permissão para alterar a lista de publicadores. Isso é normal e esperado.
      }

      setIsSubmitted(true);
      
      setTimeout(() => {
        setFormData(prev => ({ 
          ...prev, 
          nome: '', 
          estudos: '0', 
          horas: '', 
          participou: 'SIM',
          tipo: 'Publicador(a)'
        }));
        setIsSubmitted(false);
      }, 1000);
    } catch (error) {
      console.error("Falha ao processar relatório: ", error);
      alert("Erro ao enviar. Por favor, tente novamente.");
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminError('');
    try {
      await setPersistence(auth, inMemoryPersistence);
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    } catch (error) {
      setAdminError('Acesso não autorizado. Verifique as credenciais.');
    }
  };

  const handleLogout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const updateReport = useCallback(async (updatedReport) => {
    try {
      const nomeCorrigido = updatedReport.nome.trim().replace(/\s+/g, ' ').toUpperCase();
      const nomeBusca = nomeCorrigido.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      const reportParaSalvar = {
        ...updatedReport,
        nome: nomeCorrigido,
        nome_busca: nomeBusca,
        tipo: updatedReport.participou === 'NÃO' ? 'Publicador(a)' : updatedReport.tipo,
        estudos: updatedReport.participou === 'NÃO' ? '0' : (updatedReport.estudos || '0'),
        horas: (updatedReport.participou === 'SIM' && updatedReport.tipo?.includes('Pioneiro')) ? (updatedReport.horas || '0') : null
      };
      const docRef = doc(db, 'relatorios', reportParaSalvar.id);
      await updateDoc(docRef, reportParaSalvar);
      return true;
    } catch (error) {
      console.error("Erro ao atualizar documento: ", error);
      return false;
    }
  }, []);

  const deleteReport = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, 'relatorios', id));
    } catch (error) {
      console.error("Erro ao apagar documento: ", error);
    }
  }, []);

  const addReportAdmin = useCallback(async (reportData) => {
    try {
      const nomeCorrigido = reportData.nome.trim().replace(/\s+/g, ' ').toUpperCase();
      const nomeBusca = nomeCorrigido.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      const q = query(
        collection(db, 'relatorios'),
        where('nome', '==', nomeCorrigido),
        where('mes', '==', reportData.mes),
        where('ano', '==', reportData.ano)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        alert("Atenção: Já existe um relatório para este irmão neste período.");
        return false;
      }

      const newReport = {
        ...reportData,
        nome: nomeCorrigido,
        nome_busca: nomeBusca,
        dataEnvio: serverTimestamp(),
        enviadoPorAdmin: true,
        tipo: reportData.participou === 'NÃO' ? 'Publicador(a)' : reportData.tipo,
        estudos: reportData.participou === 'NÃO' ? '0' : (reportData.estudos || '0'),
        horas: (reportData.participou === 'SIM' && reportData.tipo?.includes('Pioneiro')) ? (reportData.horas || '0') : null
      };
      await addDoc(collection(db, 'relatorios'), newReport);

      const pubQuery = query(collection(db, 'publicadores'), where('nome', '==', nomeCorrigido));
      const pubSnap = await getDocs(pubQuery);
      if (pubSnap.empty) {
        await addDoc(collection(db, 'publicadores'), {
          nome: nomeCorrigido,
          nome_busca: nomeBusca,
          tipo_padrao: newReport.tipo,
          dataCriacao: serverTimestamp()
        });
      }

      return true;
    } catch (error) {
      console.error("Erro ao adicionar registro: ", error);
      return false;
    }
  }, []);

  const saveConfig = useCallback(async (dadosRecebidos) => {
    try {
      let urlParaSalvar = typeof dadosRecebidos === 'object' && dadosRecebidos.monthlyImage ? dadosRecebidos.monthlyImage : dadosRecebidos;
      
      if (dadosRecebidos instanceof File) {
        const storage = getStorage();
        
        if (monthlyImage && monthlyImage.includes('firebasestorage.googleapis.com')) {
          try {
            const oldImageRef = ref(storage, monthlyImage);
            await deleteObject(oldImageRef);
          } catch (deleteError) {
            if (deleteError.code !== 'storage/object-not-found') {
              console.error("Erro ao deletar imagem antiga do Storage: ", deleteError);
            }
          }
        }
        
        const fileRef = ref(storage, `capas/capa_${Date.now()}_${dadosRecebidos.name}`);
        const snapshot = await uploadBytes(fileRef, dadosRecebidos);
        urlParaSalvar = await getDownloadURL(snapshot.ref);
      }
      
      await setDoc(doc(db, 'configuracoes', 'gerais'), { imagemCapa: urlParaSalvar }, { merge: true });
      return true;
    } catch (error) {
      console.error("Erro ao gravar configuração: ", error);
      if (error.code === 'storage/quota-exceeded' || error.message?.includes('402')) {
        alert("Limite de armazenamento gratuito atingido. Apague arquivos antigos no Firebase ou use link externo.");
      } else {
        alert("Ocorreu um erro ao tentar salvar a imagem.");
      }
      return false;
    }
  }, [monthlyImage]);

  const toggleFechamento = useCallback(async (mes, ano, statusAtual) => {
    const docId = `${mes}-${ano}`;
    try {
      await setDoc(doc(db, 'fechamentos', docId), {
        fechado: !statusAtual,
        dataFechamento: !statusAtual ? new Date().toISOString() : null
      }, { merge: true });
      return true;
    } catch (error) {
      console.error("Erro ao alterar fechamento: ", error);
      return false;
    }
  }, []);

  const anosDisponiveis = useMemo(() => {
    const yearNow = new Date().getFullYear();
    const range = [];
    for (let i = 2026; i <= Math.max(2026, yearNow); i++) {
      range.push(i.toString());
    }
    return range.sort((a, b) => b - a);
  }, []);

  if (authLoading) {
    return <div className="flex h-screen items-center justify-center text-gray-500 animate-pulse">Verificando sessão...</div>;
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<div className="flex h-screen items-center justify-center animate-pulse">Carregando congregação...</div>}>
        <Routes>
          <Route path="/admin" element={
            currentUser ? (
              <AdminDashboard 
                reports={reports} 
                fechamentos={fechamentos}
                onLogout={handleLogout} 
                monthlyImage={monthlyImage} 
                setMonthlyImage={setMonthlyImage} 
                meses={meses} 
                anosDisponiveis={anosDisponiveis}
                opcoesEstudos={opcoesEstudos}
                onUpdateReport={updateReport}
                onDeleteReport={deleteReport}
                onAddReport={addReportAdmin}
                onSaveConfig={saveConfig}
                onToggleFechamento={toggleFechamento}
                ImageLoader={ImageLoader}
              />
            ) : (
              <Navigate to="/" replace />
            )
          } />

          <Route path="/" element={
            currentUser ? (
              <Navigate to="/admin" replace />
            ) : (
              <FormularioPublicador 
                view={view}
                setView={setView}
                publicadoresList={publicadoresList}
                monthlyImage={monthlyImage}
                handleAdminLogin={handleAdminLogin}
                adminEmail={adminEmail}
                setAdminEmail={setAdminEmail}
                adminPassword={adminPassword}
                setAdminPassword={setAdminPassword}
                adminError={adminError}
                isSubmitted={isSubmitted}
                handleSubmit={handleSubmit}
                isSelectedMonthClosed={isSelectedMonthClosed}
                formData={formData}
                setFormData={setFormData}
                handleInputChange={handleInputChange}
                meses={meses}
                anosDisponiveis={anosDisponiveis}
                opcoesEstudos={opcoesEstudos}
                ImageLoader={ImageLoader}
              />
            )
          } />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}