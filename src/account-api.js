export const apiBase = (import.meta.env?.VITE_API_URL || '').replace(/\/$/, '');
export const accountEnabled = Boolean(apiBase);
export async function apiRequest(path, {token, body, method = 'GET', signal} = {}) {
  if (!accountEnabled) throw new Error('As contas ainda não estão disponíveis. Seu checklist local continua funcionando.');
  let response;
  try {
    response = await fetch(apiBase + path, {method, signal: signal || AbortSignal.timeout(60000), headers: {...(body ? {'Content-Type':'application/json'} : {}), ...(token ? {Authorization:`Bearer ${token}`} : {})}, ...(body ? {body:JSON.stringify(body)} : {})});
  } catch { throw new Error('Não foi possível conectar. O serviço pode estar iniciando; tente novamente em instantes.'); }
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.message || (response.status === 401 ? 'E-mail ou senha inválidos, ou sessão expirada. Entre novamente.' : response.status === 429 ? 'Muitas tentativas. Aguarde um minuto antes de tentar novamente.' : 'Não foi possível concluir. Tente novamente.'));
    error.status = response.status; throw error;
  }
  return data;
}
export function todayInBrazil() { return new Intl.DateTimeFormat('en-CA', {timeZone:'America/Sao_Paulo', year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date()); }
