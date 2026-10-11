import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://127.0.0.1:5000', {
    transports: ['websocket', 'polling'],
    autoConnect: true
});

/* ═══════════════════════════════════════════
   PALETTE MATERIAL 3
   ═══════════════════════════════════════════ */
const T = {
    primary: '#001e40', onPrimary: '#ffffff',
    surface: '#f7fafc', surfaceContainerLowest: '#ffffff',
    surfaceContainerHigh: '#e5e9eb', surfaceContainer: '#ebeef0',
    outline: '#737780', outlineVariant: '#c3c6d1',
    secondaryContainer: '#fd8b00', onSecondaryContainer: '#603100',
    error: '#ba1a1a', onError: '#ffffff',
    tertiaryFixedDim: '#61de8a', surfaceTint: '#3a5f94',
    onSurface: '#181c1e', onSurfaceVariant: '#43474f',
    surfaceBright: '#f7fafc', surfaceVariant: '#e0e3e5'
};

/* ═══════════════════════════════════════════
   ICÔNES SVG
   ═══════════════════════════════════════════ */
const I = {
    anchor: <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2ZM19 13C18.4 13 18 12.6 18 12V9H17V12C17 13.1 16.1 14 15 14C13.9 14 13 13.1 13 12V9H12V19H13C13 19.6 12.6 20 12 20C11.4 20 11 19.6 11 19H10V9H9V12C9 13.1 8.1 14 7 14C5.9 14 5 13.1 5 12V9H4V12C4 12.6 3.6 13 3 13C2.4 13 2 12.6 2 12V9C2 7.3 3.3 6 5 6H7V4C7 2.9 7.9 2 9 2H15C16.1 2 17 2.9 17 4V6H19C20.7 6 22 7.3 22 9V12C22 12.6 21.6 13 21 13C20.4 13 20 12.6 20 12V9C20 8.4 19.6 8 19 8H17V12C17 14.2 15.2 16 13 16H11C8.8 16 7 14.2 7 12V8H5C4.4 8 4 8.4 4 9V12C4 12.6 3.6 13 3 13Z" /></svg>,
    scale: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12S7.59 4 12 4 20 7.59 20 12 16.41 20 12 20ZM12.5 7V12.25L16 14.33L15.28 15.54L11 13V7H12.5Z" /></svg>,
    dash: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" /></svg>,
    truck: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 8H17V4H3C1.9 4 1 4.9 1 6V17H3C3 18.66 4.34 20 6 20C7.66 20 9 18.66 9 17H15C15 18.66 16.34 20 18 20C19.66 20 21 18.66 21 17H23V12L20 8ZM19.5 9.5L21.46 12H17V9.5H19.5ZM6 18C5.45 18 5 17.55 5 17C5 16.45 5.45 16 6 16C6.55 16 7 16.45 7 17C7 17.55 6.55 18 6 18ZM18 18C17.45 18 17 17.55 17 17C17 16.45 17.45 16 18 16C18.55 16 19 16.45 19 17C19 17.55 18.55 18 18 18Z" /></svg>,
    users: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" /></svg>,
    help: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 19H11V17H13V19ZM15.07 11.25L14.17 12.17C13.45 12.9 13 13.5 13 15H11V14.5C11 13.4 11.45 12.4 12.17 11.67L13.41 10.41C13.78 10.05 14 9.55 14 9C14 7.9 13.1 7 12 7C10.9 7 10 7.9 10 9H8C8 6.79 9.79 5 12 5C14.21 5 16 6.79 16 9C16 9.88 15.64 10.68 15.07 11.25Z" /></svg>,
    logout: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.59L17 17L22 12L17 7ZM4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z" /></svg>,
    check: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" /></svg>,
    bell: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.37 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" /></svg>,
    zero: <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12S7.59 4 12 4 20 7.59 20 12 16.41 20 12 20Z" /></svg>,
    capture: <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12L9.4 7.4L8 6L2 12L8 18L9.4 16.6ZM14.6 16.6L19.2 12L14.6 7.4L16 6L22 12L16 18L14.6 16.6Z" /></svg>,
    history: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M13 3C8.03 3 4 7.03 4 12H1L4.89 15.89L4.96 16.03L9 12H6C6 8.13 9.13 5 13 5C16.87 5 20 8.13 20 12C20 15.87 16.87 19 13 19C11.07 19 9.32 18.21 8.06 16.94L6.64 18.36C8.27 19.99 10.51 21 13 21C17.97 21 22 16.97 22 12C22 7.03 17.97 3 13 3ZM12 8V13L16.28 15.54L17 14.33L13.5 12.25V8H12Z" /></svg>,
    upload: <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16H15V10H19L12 3L5 10H9V16ZM5 18H19V20H5V18Z" /></svg>,
    emergency: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" /></svg>,
    add: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" /></svg>,
    qr: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 11H11V3H3V11ZM5 5H9V9H5V5ZM3 21H11V13H3V21ZM5 15H9V19H5V15ZM13 3V11H21V3H13ZM19 9H15V5H19V9ZM13 13H15V15H13V13ZM15 15H17V17H15V15ZM13 17H15V19H13V17ZM15 19H17V21H15V19ZM17 17H19V19H17V17ZM17 13H19V15H17V13ZM19 15H21V17H19V15ZM17 21H19V19H21V21H17ZM19 19V17H21V19H19Z" /></svg>
};

/* ═══════════════════════════════════════════
   COMPOSANT INPUT MATRICULE (OCR)
   ═══════════════════════════════════════════ */
function InputMatricule({ label, typeCamera, value, onChange }) {
    const [verrouille, setVerrouille] = useState(false);
    const [buffer, setBuffer] = useState([]);

    useEffect(() => {
        const handleDetection = (data) => {
            if (!data?.matriculeDetectee || verrouille) return;
            const conf = data.confiance || 0;
            if (conf < 60) return;

            const newBuffer = [...buffer, { m: data.matriculeDetectee, c: conf }].slice(-5);
            setBuffer(newBuffer);

            const counts = {};
            newBuffer.forEach(e => { counts[e.m] = (counts[e.m] || 0) + 1; });

            let best = null, maxC = 0, bestConf = 0;
            Object.entries(counts).forEach(([m, c]) => {
                if (c > maxC) {
                    maxC = c;
                    best = m;
                    bestConf = Math.max(...newBuffer.filter(e => e.m === m).map(e => e.c));
                }
            });

            if (maxC >= 3 && bestConf >= 70) {
                onChange(best);
                setVerrouille(true);
                setBuffer([]);
            }
        };
        socket.on(typeCamera, handleDetection);
        return () => { socket.off(typeCamera, handleDetection); };
    }, [typeCamera, onChange, verrouille, buffer]);

    const deverrouiller = () => { setVerrouille(false); setBuffer([]); onChange(''); };

    return (
        <div style={{ border: `2px solid ${verrouille ? '#10B981' : '#E5E7EB'}`, borderRadius: 12, padding: 16, backgroundColor: verrouille ? '#ECFDF5' : '#F9FAFB', minWidth: 260, transition: 'all 0.3s' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: 14, color: '#374151', marginBottom: 8 }}>{label}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="text" value={value || ''} onChange={(e) => { if (!verrouille) onChange(e.target.value); }}
                    readOnly={verrouille} placeholder={typeCamera === 'ocr-remorque-update' ? "ex: 98765-72" : "ex: 12345-A-6"}
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 16, fontFamily: 'monospace', fontWeight: 600, backgroundColor: verrouille ? '#D1FAE5' : '#FFFFFF', color: verrouille ? '#065F46' : '#111827', outline: 'none' }} />
                {verrouille && <button onClick={deverrouiller} style={{ padding: '8px 12px', backgroundColor: '#EF4444', color: '#FFF', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Deverrouiller</button>}
            </div>
            {verrouille && <div style={{ marginTop: 6, fontSize: 12, color: '#10B981', fontWeight: 700 }}>Verrouille par OCR</div>}
        </div>
    );
}

/* ═══════════════════════════════════════════
   COMPOSANT PRINCIPAL
   ═══════════════════════════════════════════ */
export default function AffichagePesee({ onWeightUpdate }) {
    // --- Socket.IO (ton code exact) ---
    const [poids, setPoids] = useState(0);
    const [statut, setStatut] = useState('DECONNECTE');

    // --- Formulaire ---
    const [matriculeTracteur, setMatriculeTracteur] = useState('');
    const [matriculeRemorque, setMatriculeRemorque] = useState('');
    const [loading, setLoading] = useState(false);
    const [notes, setNotes] = useState('');
    const [tickets, setTickets] = useState([
        { id: 'TRK-881-XY', produit: 'Ciment Portland', poids: 28100, date: '2026-08-20T14:30:00' },
        { id: 'TRK-224-BR', produit: 'Ble Dur', poids: 41050, date: '2026-08-20T13:15:00' }
    ]);

    const isConnected = statut === 'CONNECTE' || statut === 'STABLE';
    const pct = Math.min((poids / 40000) * 100, 100);
    const inRange = poids >= 34000 && poids <= 35000;

    // --- Ton useEffect exact ---
    useEffect(() => {
        const onConnect = () => { setStatut('CONNECTE'); };
        const onDisconnect = () => { setStatut('DECONNECTE'); };
        const onWeightUpdateEvent = (data) => {
            const v = data && data.poids !== undefined ? Number(data.poids) : 0;
            setPoids(v);
            setStatut(data.statut || 'STABLE');
            if (typeof onWeightUpdate === 'function') onWeightUpdate(v);
        };
        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('weight-update', onWeightUpdateEvent);
        if (socket.connected) setStatut('CONNECTE');
        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('weight-update', onWeightUpdateEvent);
        };
    }, [onWeightUpdate]);

    // --- Handlers ---
    const handleCapture = () => { };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!matriculeTracteur) { alert("Veuillez saisir le matricule du tracteur."); return; }
        if (!poids || poids <= 0) { alert("Le poids doit etre superieur a 0 kg."); return; }
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || '';
            const headers = { 'Content-Type': 'application/json' };
            if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch('http://localhost:5000/api/pesee/entree', {
                method: 'POST', headers,
                body: JSON.stringify({
                    matriculeTracteur: matriculeTracteur.trim(),
                    matriculeRemorque: matriculeRemorque.trim(),
                    poidsEntree: Number(poids)
                })
            });
            const data = await res.json();
            if (res.ok) {
                alert(`${data.message || 'Pesee enregistree'}\nID: ${data.pesee?.id || 'N/A'}`);
                setTickets(prev => [{ id: matriculeTracteur.toUpperCase(), produit: 'Nouvelle pesee', poids, date: new Date().toISOString() }, ...prev].slice(0, 10));
                setMatriculeTracteur(''); setMatriculeRemorque(''); setNotes('');
            } else { alert(`Erreur [${res.status}]: ${data.error || 'Erreur'}`); }
        } catch { alert("Le serveur est injoignable."); }
        finally { setLoading(false); }
    };

    const handleEmergency = () => { if (window.confirm('Confirmer l arret d urgence ?')) { setPoids(0); setStatut('URGENCE'); } };

    // --- Styles helpers ---
    const card = { backgroundColor: T.surfaceContainerLowest, border: `1px solid ${T.outlineVariant}`, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };
    const input = { width: '100%', padding: '12px 16px', backgroundColor: T.surfaceContainerLowest, border: `1px solid ${T.outlineVariant}`, borderRadius: 8, fontSize: 16, color: T.onSurface, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };
    const label = { display: 'block', fontSize: 14, fontWeight: 700, color: T.onSurfaceVariant, marginBottom: 6 };
    const navItem = { display: 'flex', alignItems: 'center', gap: 16, color: T.onSurfaceVariant, borderRadius: 12, padding: '12px 16px', textDecoration: 'none', fontSize: 14, fontWeight: 700, transition: 'all 0.2s' };

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: T.surface, fontFamily: '"Inter", system-ui, sans-serif', color: T.onSurface, overflow: 'hidden' }}>

            {/* SIDEBAR */}
            <nav className="hidden-md" style={{ display: 'flex', flexDirection: 'column', padding: 16, gap: 24, position: 'fixed', left: 0, top: 0, height: '100%', width: 256, zIndex: 40, borderRight: `1px solid ${T.outlineVariant}`, backgroundColor: T.surfaceContainerLowest, color: T.primary }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: T.surfaceContainerHigh, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{I.anchor}</div>
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 800, color: T.primary, margin: 0, letterSpacing: '-0.02em' }}>Terminal Core</h1>
                        <p style={{ fontSize: 14, fontWeight: 500, color: T.outline, margin: 0 }}>Port Logistics OS</p>
                    </div>
                </div>
                <button style={{ width: '100%', minHeight: 48, backgroundColor: T.secondaryContainer, color: T.onSecondaryContainer, fontSize: 14, fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>{I.add} Nouvelle entree</button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16, flexGrow: 1 }}>
                    <a href="#" style={{ ...navItem, backgroundColor: T.primary, color: T.onPrimary, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', transform: 'scale(0.98)' }}>{I.scale} Station de Pesee</a>
                    <a href="#" style={navItem} onMouseEnter={e => e.currentTarget.style.backgroundColor = T.surfaceContainerHigh} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>{I.dash} Statut Operationnel</a>
                    <a href="#" style={navItem} onMouseEnter={e => e.currentTarget.style.backgroundColor = T.surfaceContainerHigh} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>{I.truck} Suivi Flotte</a>
                    <a href="#" style={navItem} onMouseEnter={e => e.currentTarget.style.backgroundColor = T.surfaceContainerHigh} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>{I.users} Gestion Utilisateurs</a>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 16, borderTop: `1px solid ${T.outlineVariant}` }}>
                    <a href="#" style={navItem} onMouseEnter={e => e.currentTarget.style.backgroundColor = T.surfaceContainerHigh} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>{I.help} Support</a>
                    <a href="#" style={navItem} onMouseEnter={e => e.currentTarget.style.backgroundColor = T.surfaceContainerHigh} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>{I.logout} Deconnexion</a>
                </div>
            </nav>

            {/* MAIN */}
            <main style={{ flex: 1, marginLeft: 256, width: '100%', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

                {/* HEADER */}
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 32px', height: 80, borderBottom: `1px solid ${T.outlineVariant}`, backgroundColor: T.surfaceContainerLowest, flexShrink: 0, zIndex: 30 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <h2 style={{ fontSize: 24, fontWeight: 600, color: T.onSurface, margin: 0 }}>Pont-Bascule #4</h2>
                        <span style={{ padding: '4px 12px', backgroundColor: `${T.surfaceTint}10`, color: T.surfaceTint, borderRadius: 9999, fontSize: 14, fontWeight: 700, border: `1px solid ${T.surfaceTint}20`, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: T.surfaceTint, animation: 'pulse 2s infinite' }} />
                            Systeme Actif
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 600, letterSpacing: '0.05em', color: T.outline, paddingRight: 16, borderRight: `1px solid ${T.outlineVariant}` }}>
                            SYNC: {new Date().toISOString().split('T')[1].split('.')[0]} UTC
                        </div>
                        <button style={{ width: 48, height: 48, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.outline }}>{I.bell}</button>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: T.surfaceVariant, overflow: 'hidden', border: `2px solid ${T.outlineVariant}` }}>
                            <img src="https://ui-avatars.com/api/?name=Operateur&background=3a5f94&color=fff&size=128" alt="Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    </div>
                </header>

                {/* WORKSPACE */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 32, backgroundColor: T.surface }}>
                    <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24 }}>

                        {/* COLONNE GAUCHE (8) */}
                        <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: 24 }}>

                            {/* LIVE DISPLAY */}
                            <section style={{ ...card, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ backgroundColor: T.primary, color: T.onPrimary, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ fontSize: 20, fontWeight: 600, margin: 0, letterSpacing: '0.05em' }}>AFFICHAGE LIVE PONT-BASCULE</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 9999, fontSize: 14, fontWeight: 700 }}>{I.check} {isConnected ? 'CAPTEUR STABLE' : 'CAPTEUR HORS LIGNE'}</div>
                                </div>
                                <div style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: T.surfaceBright, position: 'relative', minHeight: 240 }}>
                                    <div style={{ position: 'absolute', inset: 0, opacity: 0.05, pointerEvents: 'none', backgroundImage: `linear-gradient(${T.primary} 1px, transparent 1px), linear-gradient(to right, ${T.primary} 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, position: 'relative', zIndex: 10 }}>
                                        <span style={{ fontSize: 96, lineHeight: '100px', fontWeight: 900, color: T.primary, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.05em', fontFamily: '"Inter", monospace' }}>{poids.toLocaleString('fr-FR')}</span>
                                        <span style={{ fontSize: 24, fontWeight: 700, color: T.outline }}>kg</span>
                                    </div>
                                    <div style={{ width: '100%', maxWidth: 512, marginTop: 32, display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', zIndex: 10 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 500, color: T.outline }}>
                                            <span>0</span><span>Cible : 34 000 - 35 000</span><span>Max : 40 000</span>
                                        </div>
                                        <div style={{ width: '100%', height: 12, backgroundColor: T.surfaceContainerHigh, borderRadius: 9999, overflow: 'hidden', display: 'flex' }}>
                                            <div style={{ height: '100%', width: `${pct}%`, backgroundColor: inRange ? T.tertiaryFixedDim : T.secondaryContainer, position: 'relative', borderRight: `2px solid ${T.surfaceContainerLowest}`, transition: 'width 0.3s ease' }}>
                                                <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.3))' }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* CONTROLS */}
                            <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <button style={{ height: 96, backgroundColor: T.surfaceContainerLowest, border: `1px solid ${T.outlineVariant}`, borderRadius: 12, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s', color: T.onSurfaceVariant }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.color = T.primary; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.outlineVariant; e.currentTarget.style.color = T.onSurfaceVariant; }}>{I.zero}<span style={{ fontSize: 20, fontWeight: 600 }}>Tarer (Tare)</span></button>
                                <button onClick={handleCapture} style={{ height: 96, backgroundColor: T.surfaceContainerLowest, border: `1px solid ${T.outlineVariant}`, borderRadius: 12, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s', color: T.onSurfaceVariant }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.color = T.primary; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.outlineVariant; e.currentTarget.style.color = T.onSurfaceVariant; }}>{I.capture}<span style={{ fontSize: 20, fontWeight: 600 }}>Capturer Poids</span></button>
                            </section>

                            {/* NOTES */}
                            <section style={{ ...card, padding: 24 }}>
                                <label style={label}>Notes Operateur (Optionnel)</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Saisissez vos observations..." style={{ ...input, height: 128, resize: 'none' }}
                                    onFocus={e => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${T.primary}15`; }}
                                    onBlur={e => { e.currentTarget.style.borderColor = T.outlineVariant; e.currentTarget.style.boxShadow = 'none'; }} />
                            </section>
                        </div>

                        {/* COLONNE DROITE (4) */}
                        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 24 }}>

                            {/* FORMULAIRE */}
                            <section style={{ ...card, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ backgroundColor: T.primary, color: T.onPrimary, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>{I.truck}<h3 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>NOUVEAU TICKET</h3></div>
                                <form id="ticketForm" onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

                                    {/* MATRICULES OCR */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        <InputMatricule label="Tracteur (Avant)" typeCamera="ocr-update" value={matriculeTracteur} onChange={setMatriculeTracteur} />
                                        <InputMatricule label="Remorque (Arriere)" typeCamera="ocr-remorque-update" value={matriculeRemorque} onChange={setMatriculeRemorque} />
                                    </div>

                                    <div>
                                        <label style={label}>Poids Live (kg)</label>
                                        <input type="number" value={poids} readOnly style={{ ...input, fontWeight: 700, fontSize: 18, backgroundColor: T.surfaceContainerHigh }} />
                                    </div>
                                </form>
                            </section>

                            {/* HISTORIQUE */}
                            <section style={{ ...card, padding: 16 }}>
                                <h4 style={{ fontSize: 14, fontWeight: 700, color: T.outline, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>{I.history} Entrees Recentes</h4>
                                <ul style={{ display: 'flex', flexDirection: 'column', gap: 2, listStyle: 'none', padding: 0, margin: 0, maxHeight: 200, overflowY: 'auto' }}>
                                    {tickets.map((t, i) => (
                                        <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < tickets.length - 1 ? `1px solid ${T.surfaceVariant}` : 'none' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 600, color: T.onSurface }}>{t.id}</span>
                                                <span style={{ fontSize: 12, color: T.outline }}>{t.produit}</span>
                                            </div>
                                            <span style={{ fontSize: 14, fontWeight: 700, color: T.tertiaryFixedDim }}>{t.poids.toLocaleString('fr-FR')} kg</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            {/* ACTIONS */}
                            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <button form="ticketForm" type="submit" disabled={loading} style={{ width: '100%', minHeight: 64, backgroundColor: T.secondaryContainer, color: T.onSecondaryContainer, fontSize: 20, fontWeight: 700, borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', opacity: loading ? 0.7 : 1 }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#ff991a'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = T.secondaryContainer}>{I.upload} {loading ? 'ENREGISTREMENT...' : 'ENREGISTRER TICKET'}</button>
                                <button type="button" onClick={handleEmergency} style={{ width: '100%', minHeight: 48, backgroundColor: T.error, color: T.onError, fontSize: 14, fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>{I.emergency} ARRET D URGENCE / REJET</button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} } @media(max-width:1280px){.hidden-md{display:none!important}main{margin-left:0!important}}`}</style>
        </div>
    );
}