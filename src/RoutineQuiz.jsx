import React, {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowLeft, ArrowRight, Check} from 'lucide-react';
import {questions, buildRoutine} from './routine.js';
import {routineStorageKey, validSavedRoutine, routineText} from './routine-storage.js';

export default function RoutineQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({moment:'', time:'', goal:''});
  const [checked, setChecked] = useState([]);
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  const [manualCopy, setManualCopy] = useState(false);
  const heading = useRef(null);
  const moved = useRef(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(routineStorageKey);
      if (raw) {
        const data = JSON.parse(raw);
        if (validSavedRoutine(data)) { setAnswers(data.answers); setChecked(data.checked); setStep(data.step); setSaved(true); setMessage('Sua rotina salva foi recuperada neste navegador.'); }
        else setMessage('A rotina salva não pôde ser recuperada. Monte um novo checklist.');
      }
    } catch { setMessage('O armazenamento local está indisponível ou contém dados inválidos. Você pode continuar usando o checklist.'); }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready || !saved) return;
    try { localStorage.setItem(routineStorageKey, JSON.stringify({version:1, answers, checked, step})); }
    catch { setSaved(false); setMessage('Não foi possível atualizar a rotina salva. O checklist continua disponível nesta página.'); }
  }, [ready, saved, answers, checked, step]);
  useEffect(() => { if (moved.current) heading.current?.focus(); }, [step]);
  function move(next) { moved.current = true; setStep(next); }
  function eraseSaved() {
    try { localStorage.removeItem(routineStorageKey); setSaved(false); setMessage('Rotina removida deste navegador. O checklist atual continua na tela.'); return true; }
    catch { setMessage('Não foi possível apagar a rotina salva. Verifique as permissões de armazenamento do navegador.'); return false; }
  }
  function restart() { if (saved && !eraseSaved()) return; setAnswers({moment:'', time:'', goal:''}); setChecked([]); setManualCopy(false); move(0); }
  function save() {
    try { localStorage.setItem(routineStorageKey, JSON.stringify({version:1, answers, checked, step})); setSaved(true); setMessage('Rotina salva neste navegador. Suas próximas alterações serão salvas automaticamente.'); }
    catch { setMessage('Não foi possível salvar neste navegador. Você ainda pode copiar seu checklist.'); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(routineText(answers, checked)); setMessage('Checklist copiado. Cole onde preferir.'); setManualCopy(false); }
    catch { setManualCopy(true); setMessage('A cópia automática não está disponível. Selecione e copie o texto abaixo.'); }
  }
  const result = step === questions.length;
  const question = questions[step];
  const routine = result ? buildRoutine(answers) : null;

  return <section className="section routine-page" aria-labelledby="routine-title">
    <div className="routine-intro"><div className="eyebrow">SEU TEMPO, SUAS ESCOLHAS</div><h1 id="routine-title">Uma rotina que cabe no seu dia.</h1><p>Responda 3 perguntas e monte um checklist de organização do autocuidado. Sem cadastro.</p></div>
    <div className="routine-layout">
      <aside className="routine-guide"><span className="eyebrow">UM PASSO DE CADA VEZ</span><ol>{questions.map((q, i) => <li key={q.id} aria-current={step === i ? 'step' : undefined} className={step > i ? 'is-complete' : ''}><span>{step > i ? <Check size={16} aria-hidden="true"/> : `0${i + 1}`}</span>{['Seu momento', 'Seu tempo', 'Seu objetivo'][i]}</li>)}</ol><p>Ao terminar, você pode salvar a rotina neste navegador. Sem conta ou envio para servidores.</p></aside>
      <div className="routine-panel">
        {!result ? <form onSubmit={e => { e.preventDefault(); if (answers[question.id]) move(step + 1); }}>
          <p className="routine-progress">Pergunta {step + 1} de 3</p>
          <h2 ref={heading} tabIndex={-1} className="routine-question">{question.title}</h2>
          <p id="question-help">{question.description}</p>
          <fieldset className="routine-options" aria-describedby="question-help"><legend className="visually-hidden">{question.title}</legend>{question.options.map(([value, label, detail]) => <label className="routine-option" key={`${question.id}-${value}`}><input type="radio" name={question.id} value={value} checked={answers[question.id] === value} onChange={() => setAnswers({...answers, [question.id]:value})} required/><span><strong>{label}</strong><small>{detail}</small></span></label>)}</fieldset>
          <div className="routine-actions">{step > 0 && <button type="button" className="text-link" onClick={() => move(step - 1)}><ArrowLeft size={16}/> Voltar</button>}<button className="button" type="submit">{step === 2 ? 'Montar meu checklist' : 'Continuar'} <ArrowRight size={16}/></button></div>
        </form> : <div className="routine-result">
          <p className="routine-progress">Seu ponto de partida</p><h2 ref={heading} tabIndex={-1} className="routine-question">Seu checklist está pronto.</h2>
          <div className="routine-summary"><span>{routine.moment}</span><span>{routine.duration}{answers.moment === 'both' ? ' por momento' : ''}</span></div>
          <p>{routine.anchor}</p><p>Marque as etapas para experimentar. {answers.moment === 'both' ? 'Use esta lista para um dos seus momentos e desmarque as etapas para repetir no outro.' : 'Você pode desmarcar qualquer etapa.'}</p>
          <div className="routine-checklist">{routine.steps.map((text, i) => <label key={text} className="routine-check"><input type="checkbox" checked={checked.includes(i)} onChange={e => setChecked(e.target.checked ? [...checked, i] : checked.filter(n => n !== i))}/><span>{text}</span></label>)}</div>
          <p role="status" className="routine-count">{checked.length} de {routine.steps.length} etapas concluídas{checked.length === routine.steps.length ? ' · Seu momento de cuidado está completo.' : ''}</p>
          <div className="routine-tools"><button type="button" className="secondary-button" onClick={save}>{saved ? 'Salvar novamente' : 'Salvar neste navegador'}</button><button type="button" className="secondary-button" onClick={copy}>Copiar checklist</button><a className="secondary-button" href={`https://wa.me/?text=${encodeURIComponent(routineText(answers, checked))}`} target="_blank" rel="noopener noreferrer">Compartilhar pelo WhatsApp ↗</a></div>
          <p className="smallprint">O WhatsApp abre com o texto preparado. Você escolhe o destinatário e confirma o envio lá.</p>
          {manualCopy && <label className="routine-manual-copy">Texto para copiar<textarea readOnly rows={8} value={routineText(answers, checked)} onFocus={event => event.target.select()}/></label>}
          <div className="routine-actions"><button type="button" className="text-link" onClick={() => {setChecked([]); move(2);}}><ArrowLeft size={16}/> Ajustar respostas</button><button type="button" className="secondary-button" onClick={restart}>Começar de novo</button></div>
          <Link className="text-link routine-product-link" to="/produto">Conheça a proposta do espelho <ArrowRight size={16}/></Link>
        </div>}
        {saved && <div className="routine-saved"><span>Salvamento automático ativo neste navegador.</span><button type="button" className="text-link" onClick={eraseSaved}>Apagar rotina salva</button></div>}
        <p className="routine-feedback" role="status">{message}</p>
        <p className="routine-note">Este checklist organiza hábitos. Não avalia sua pele nem recomenda produtos ou tratamentos.</p>
      </div>
    </div>
  </section>;
}
