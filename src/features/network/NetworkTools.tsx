import { useEffect, useState } from 'react';
import { Download, QrCode, Wifi } from 'lucide-react';
import QRCode from 'qrcode';
import './network.css';

function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <section className="web-tool-panel"><header className="web-panel-heading"><h2>{title}</h2><p>{description}</p></header>{children}</section>; }

export function createQrDataUrl(value: string, foreground: string, background: string, size: number, correction: 'L' | 'M' | 'Q' | 'H') {
  const text = value.trim();
  if (!text) throw new Error('Digite um texto ou link para gerar o QR Code.');
  if (text.length > 2900) throw new Error('O conteúdo está muito longo. Use até 2.900 caracteres.');
  return QRCode.toDataURL(text, { errorCorrectionLevel: correction, margin: 2, width: size, color: { dark: `${foreground}FF`, light: `${background}FF` } });
}

function QrTool() {
  const [value, setValue] = useState('https://'); const [foreground, setForeground] = useState('#06131A'); const [background, setBackground] = useState('#FFFFFF'); const [size, setSize] = useState(320); const [correction, setCorrection] = useState<'L' | 'M' | 'Q' | 'H'>('M'); const [image, setImage] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const generate = async () => { setBusy(true); try { const data = await createQrDataUrl(value, foreground, background, size, correction); setImage(data); setError(''); } catch (caught) { setImage(''); setError(caught instanceof Error ? caught.message : 'Não foi possível gerar esse QR Code.'); } finally { setBusy(false); } };
  const download = () => { if (!image) return; const link = document.createElement('a'); link.href = image; link.download = 'yva-qrcode.png'; link.click(); };
  return <Panel title="Gerador de QR Code" description="Crie o código no próprio navegador e baixe como PNG. O conteúdo não é enviado para um serviço externo."><label className="text-field"><span>Texto, link ou contato</span><textarea rows={4} maxLength={2900} value={value} onChange={(event) => setValue(event.target.value)} placeholder="https://exemplo.com"/></label><div className="electronics-fields"><label className="text-field"><span>Cor do código</span><input type="color" value={foreground} onChange={(event) => setForeground(event.target.value)}/></label><label className="text-field"><span>Fundo</span><input type="color" value={background} onChange={(event) => setBackground(event.target.value)}/></label><label className="text-field"><span>Tamanho</span><select className="select-control" value={size} onChange={(event) => setSize(Number(event.target.value))}><option value={192}>192 px</option><option value={320}>320 px</option><option value={512}>512 px</option><option value={1024}>1024 px</option></select></label><label className="text-field"><span>Correção de erro</span><select className="select-control" value={correction} onChange={(event) => setCorrection(event.target.value as typeof correction)}><option value="L">Baixa · L</option><option value="M">Média · M</option><option value="Q">Alta · Q</option><option value="H">Máxima · H</option></select></label></div><div className="file-actions"><button className="primary-button" disabled={busy} onClick={() => void generate()}>{busy ? 'Gerando…' : <><QrCode size={15}/> Gerar QR Code</>}</button>{image && <button className="text-button" onClick={download}><Download size={15}/> Baixar PNG</button>}</div>{error && <p className="validation-message" role="alert">{error}</p>}{image && <div className="qr-preview"><img src={image} alt="QR Code gerado para o conteúdo informado"/><span>Escaneie para conferir o conteúdo.</span></div>}<p className="electronics-note">Antes de compartilhar, teste o QR com a câmera do celular. Links longos produzem códigos mais densos e difíceis de escanear.</p></Panel>;
}

function ConnectionTool() {
  const [online, setOnline] = useState(navigator.onLine); const [lastChecked, setLastChecked] = useState(new Date());
  useEffect(() => { const update = () => { setOnline(navigator.onLine); setLastChecked(new Date()); }; window.addEventListener('online', update); window.addEventListener('offline', update); return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); }; }, []);
  const connection = (navigator as Navigator & { connection?: { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean } }).connection;
  return <Panel title="Status da conexão" description="Mostra o estado de rede que o navegador informa para este dispositivo."><div className={`network-status ${online ? 'online' : 'offline'}`}><Wifi size={24}/><div><strong>{online ? 'Navegador conectado' : 'Navegador offline'}</strong><span>Estado de conectividade do sistema</span></div></div><div className="conversion-grid">{[['Tipo efetivo', connection?.effectiveType ?? 'Não informado'], ['Downlink estimado', connection?.downlink ? `${connection.downlink} Mbps` : 'Não informado'], ['RTT estimado', connection?.rtt ? `${connection.rtt} ms` : 'Não informado'], ['Economia de dados', connection?.saveData ? 'Ativa' : 'Desativada / não informada'], ['Atualizado', lastChecked.toLocaleTimeString('pt-BR')]].map(([label, result]) => <div className="format-row" key={label}><span>{label}</span><code>{result}</code></div>)}</div><p className="electronics-note">O evento online/offline não garante acesso à internet. Métricas detalhadas variam entre navegadores; esta ferramenta não executa teste de velocidade nem envia dados a servidores.</p></Panel>;
}

export function NetworkTool({ slug }: { slug: string }) { return slug === 'qr-code' ? <QrTool/> : slug === 'status-conexao' ? <ConnectionTool/> : null; }
