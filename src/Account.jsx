import React, {createContext, useContext, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {apiRequest, accountEnabled} from './account-api.js';
import {buildRoutine} from './routine.js';

const AuthContext = createContext(null);
export function AuthProvider({children}) {
  const [session, setSession] = useState(null);
  useEffect(() => { if (!session) return; const timer = setTimeout(() => setSession(null), Math.max(0, new Date(session.expiresAt).getTime() - Date.now())); return () => clearTimeout(timer); }, [session]);
  async function request(path, options = {}) {
    try {return await apiRequest(path, {...options, token:session?.accessToken});}
    catch (error) {if (error.status === 401) setSession(null); throw error;}
  }
  async function signIn(mode, body) { const data = await apiRequest(`/api/auth/${mode}`, {method:'POST', body}); setSession(data); }
  async function signOut() { try {await request('/api/auth/logout', {method:'POST'});} finally {setSession(null);} }
  return <AuthContext.Provider value={{session, request, signIn, signOut, clearSession:() => setSession(null)}}>{children}</AuthContext.Provider>;
}
export const useAccount = () => useContext(AuthContext);
export function AccountLink() { const {session} = useAccount(); return accountEnabled ? <Link to="/conta">{session ? 'Minha conta' : 'Entrar'}</Link> : null; }
export default function Account() {
  const {session, signIn, signOut, request, clearSession} = useAccount();
  const [mode, setMode] = useState('login'), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [history, setHistory] = useState(null), [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    if (!session) {setHistory(null); setConfirmDelete(false); return;}
    let current = true;
    request('/api/history').then(data => {if (current) setHistory(data);}).catch(error => {if (current) setMessage(error.message);});
    return () => {current = false;};
  }, [session?.user.id]);
  async function submit(event) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    setBusy(true); setMessage('');
    try { await signIn(mode, {name:data.get('name'), email:data.get('email'), password:data.get('password')}); form.reset(); }
    catch(error) {setMessage(error.message);} finally {setBusy(false);}
  }
  async function removeRecord(id) {setBusy(true);try {await request(`/api/history/${id}`,{method:'DELETE'});setHistory(items => items.filter(item => item.id !== id));setMessage('Registro removido.');}catch(error){setMessage(error.message);}finally{setBusy(false);}}
  async function removeAccount() {setBusy(true);try {await request('/api/me',{method:'DELETE'});clearSession();setMessage('Sua conta, rotina e histórico foram excluídos.');}catch(error){setMessage(error.message);}finally{setBusy(false);}}
  return <section className="section account-page"><div className="routine-intro"><div className="eyebrow">SEU ESPAÇO DE CUIDADO</div><h1>{session ? `Olá, ${session.user.name}.` : 'Sua rotina acompanha você.'}</h1><p>Guarde sua rotina na conta e consulte os momentos de cuidado que você registrou.</p></div>
    {!accountEnabled ? <div className="routine-panel"><h2>Contas em preparação.</h2><p>Enquanto isso, você pode montar e salvar seu checklist neste navegador.</p><Link className="button" to="/rotina">Montar minha rotina</Link></div> : !session ? <div className="account-login routine-panel"><div className="gallery-buttons" role="group" aria-label="Acesso à conta"><button type="button" aria-pressed={mode === 'login'} onClick={() => {setMode('login');setMessage('');}}>Entrar</button><button type="button" aria-pressed={mode === 'register'} onClick={() => {setMode('register');setMessage('');}}>Criar conta</button></div><form onSubmit={submit}>{mode === 'register' && <label>Seu nome<input name="name" autoComplete="name" required minLength={2} maxLength={100}/></label>}<label>E-mail<input name="email" type="email" autoComplete="email" required maxLength={254}/></label><label>Senha<input key={mode} name="password" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required minLength={mode === 'register' ? 12 : 1} maxLength={128}/></label>{mode === 'register' && <><p className="smallprint">Use uma senha de 12 a 128 caracteres. Nesta primeira versão não há recuperação de senha por e-mail.</p><label className="checkbox"><input type="checkbox" required/>Li a <Link to="/privacidade">política de privacidade</Link> e entendi o uso dos dados para conta, rotina e histórico.</label></>}<button type="submit" className="button" disabled={busy}>{busy ? 'Aguarde…' : mode === 'login' ? 'Entrar na conta' : 'Criar minha conta'}</button></form><p className="smallprint">Por segurança, será preciso entrar novamente ao recarregar ou fechar esta página. Nenhuma senha ou chave de acesso fica salva no navegador.</p></div> : <><div className="account-actions"><Link className="button" to="/rotina">Abrir meu checklist</Link><button type="button" className="secondary-button" disabled={busy} onClick={async()=>{setBusy(true);try{await signOut();setMessage('Você saiu da conta.');}catch{setMessage('Você saiu deste navegador. A sessão no servidor expira em até 8 horas.');}finally{setBusy(false);}}}>Sair da conta</button></div><div className="routine-panel account-history"><h2>Seu histórico</h2><p>Seus últimos 120 registros, organizados por data e período.</p>{history === null ? <button className="secondary-button" type="button" onClick={() => {setMessage('');request('/api/history').then(setHistory).catch(error => setMessage(error.message));}}>Carregar histórico</button> : history.length === 0 ? <p>Você ainda não registrou uma rotina. Monte o checklist e use “Registrar este momento”.</p> : <><p className="account-summary">{history.filter(item => item.checked.length === item.totalSteps).length} momentos completos · {new Set(history.map(item => item.date)).size} dias com registros</p><div className="history-list">{history.map(item => <article key={item.id}><div><h3>{new Date(item.date + 'T12:00:00').toLocaleDateString('pt-BR')} · {item.period === 'morning' ? 'Manhã' : 'Noite'}</h3><p>{item.checked.length} de {item.totalSteps} etapas · {buildRoutine(item).duration}</p></div><button className="text-link" type="button" disabled={busy} onClick={() => removeRecord(item.id)}>Remover registro</button></article>)}</div></>}</div><details className="account-delete"><summary>Excluir minha conta</summary><p>A exclusão remove sua conta, sessões, rotina e histórico do servidor. O checklist salvo localmente neste navegador é independente.</p>{confirmDelete ? <div className="account-actions"><button type="button" className="secondary-button" onClick={()=>setConfirmDelete(false)}>Cancelar</button><button type="button" className="button" disabled={busy} onClick={removeAccount}>Confirmar exclusão da conta</button></div> : <button type="button" className="secondary-button" onClick={()=>setConfirmDelete(true)}>Quero excluir minha conta</button>}</details></>}
    <p className="routine-feedback" role="status">{message}</p>
  </section>;
}
