export const questions = [
  {id:'moment', title:'Quando cabe um momento para você?', description:'Escolha um horário que já faça parte do seu dia.', options:[['morning','Pela manhã','Antes dos compromissos.'],['evening','À noite','Ao encerrar o dia.'],['both','De manhã e à noite','Dois momentos curtos.']]},
  {id:'time', title:'Quanto tempo você quer reservar?', description:'Comece com um espaço que seja confortável manter.', options:[['short','Até 3 minutos','Um começo bem simples.'],['medium','Até 5 minutos','Um pequeno intervalo.'],['long','Até 10 minutos','Um momento com mais calma.']]},
  {id:'goal', title:'O que ajudaria mais a sua rotina?', description:'O checklist vai acompanhar essa preferência.', options:[['remember','Lembrar de começar','Associar o cuidado a um hábito.'],['organize','Organizar as etapas','Deixar tudo pronto para usar.'],['track','Acompanhar a constância','Registrar os momentos de cuidado.']]},
];

export function buildRoutine(answers) {
  const moment = {morning:'Pela manhã', evening:'À noite', both:'De manhã e à noite'}[answers.moment];
  const duration = {short:'Até 3 minutos', medium:'Até 5 minutos', long:'Até 10 minutos'}[answers.time];
  const anchor = {morning:'Associe seu momento de cuidado a um hábito da manhã, como escovar os dentes.', evening:'Associe seu momento de cuidado a um hábito da noite, como escovar os dentes antes de dormir.', both:'Escolha um hábito da manhã e um da noite como pontos de partida para seus dois momentos.'}[answers.moment];
  const goal = {remember:'Deixe uma pista visível, como um lembrete próximo ao espelho.', organize:'Separe, na ordem de uso, os itens da rotina que você já segue.', track:'Anote a data de hoje no seu calendário de autocuidado.'}[answers.goal];
  const steps = [goal, 'Realize os cuidados que você já definiu ou recebeu de um profissional.'];
  if (answers.time !== 'short') steps.push('Guarde os itens e deixe o espaço pronto para a próxima vez.');
  if (answers.time === 'long') steps.push('Reserve uma pausa e observe se esse horário foi confortável para você.');
  steps.push(answers.moment === 'both' ? 'Combine quando será o próximo momento do dia.' : 'Marque seu momento como concluído.');
  return {moment, duration, anchor, steps};
}
