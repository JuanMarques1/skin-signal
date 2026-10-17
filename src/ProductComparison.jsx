import React from 'react';
import {Link} from 'react-router-dom';
import {ArrowUpRight} from 'lucide-react';

const rows = [
  ['Reflexo', 'Uso cotidiano diante do espelho.', 'Uso cotidiano integrado a uma interface de rotina.'],
  ['Iluminação', 'Depende do modelo e da luz do ambiente.', 'LED ajustável previsto no conceito.'],
  ['Organização', 'Lembretes e listas ficam em outros recursos.', 'Etapas e lembretes reunidos na interface proposta.'],
  ['Histórico', 'Registros precisam ser organizados separadamente.', 'Proposta de histórico pessoal de registros visuais.'],
  ['Câmera e dados', 'Um modelo sem câmera não captura imagens.', 'Câmera opcional no uso, com consentimento e exclusão previstos.'],
];

export default function ProductComparison() {
  return <section className="section comparison" aria-labelledby="comparison-title">
    <div className="section-heading">
      <div><div className="eyebrow">UM OBJETO, NOVAS POSSIBILIDADES</div><h2 id="comparison-title">O que muda no seu espelho?</h2></div>
      <p>Compare um espelho comum, sem recursos conectados, com a proposta do Skin Signal.</p>
    </div>
    <div className="comparison-scroll" role="region" aria-label="Comparação dos espelhos" tabIndex={0}>
      <table className="comparison-table">
        <caption>Espelho comum e Skin Signal: comparação de recursos</caption>
        <thead><tr><th scope="col">Na sua rotina</th><th scope="col">Espelho comum</th><th scope="col">Skin Signal <span>Conceito em desenvolvimento</span></th></tr></thead>
        <tbody>{rows.map(([label, common, proposed]) => <tr key={label}><th scope="row">{label}</th><td>{common}</td><td>{proposed}</td></tr>)}</tbody>
      </table>
    </div>
    <p className="smallprint">Os recursos do Skin Signal são propostas, sujeitos a desenvolvimento e validação. Não há diagnóstico ou prescrição.</p>
    <Link className="text-link" to="/rotina">Experimente organizar sua rotina <ArrowUpRight size={18}/></Link>
  </section>;
}
