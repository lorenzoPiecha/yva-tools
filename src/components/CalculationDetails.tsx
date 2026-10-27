export function CalculationDetails({ formula, steps }: { formula: string; steps: string[] }) {
  return <details className="calculation-details"><summary>Ver fórmula e passo a passo</summary><p><b>Fórmula:</b> <code>{formula}</code></p><ol>{steps.map((step) => <li key={step}>{step}</li>)}</ol></details>;
}
