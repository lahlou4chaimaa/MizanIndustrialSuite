import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://127.0.0.1:5000', {
    transports: ['websocket', 'polling']
});

export default function LecteurMatricule({ onMatriculeSelect }) {
    const [matricule, setMatricule] = useState('12345 | أ | 26');
    const [suggestions, setSuggestions] = useState(['12345 | أ | 26', '12345 | ب | 26', '12345 | د | 26']);
    const [confiance, setConfiance] = useState(85);
    const [alerteAgent, setAlerteAgent] = useState(true);

    useEffect(() => {
        socket.on('ocr-update', (data) => {
            setMatricule(data.matriculeDetectee);
            setSuggestions(data.suggestions || []);
            setConfiance(data.confiance);
            setAlerteAgent(data.alerteAgent);

            if (data.matriculeDetectee && typeof onMatriculeSelect === 'function') {
                onMatriculeSelect(data.matriculeDetectee);
            }
        });

        return () => socket.off('ocr-update');
    }, [onMatriculeSelect]);

    const handleSelectSuggestion = (val) => {
        setMatricule(val);
        if (typeof onMatriculeSelect === 'function') {
            onMatriculeSelect(val);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-5">
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🇲🇦</span>
                    <h3 className="font-bold text-slate-800 text-sm">
                        LECTURE OPTIQUE DE PLAQUE (MAROC)
                    </h3>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${confiance >= 75 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                    Précision : {confiance}%
                </span>
            </div>

            {/* Visualisation Style Plaque Marocaine */}
            <div className="flex flex-col items-center justify-center bg-slate-900 p-4 rounded-xl border-2 border-slate-700">
                <span className="text-xs text-slate-400 mb-2 font-mono">MATRICULE DÉTECTÉ</span>
                <div className="bg-white text-slate-950 font-mono font-extrabold text-2xl md:text-3xl px-6 py-3 rounded-lg border-2 border-black tracking-widest shadow-inner flex items-center gap-4 dir-rtl">
                    <span>{matricule}</span>
                </div>
            </div>

            {/* Suggestions en cas d'ambiguïté (Arabe) */}
            {suggestions.length > 0 && (
                <div>
                    <label className="text-xs font-bold text-slate-500 block mb-2">
                        Suggestions d'ambiguïté de la lettre :
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {suggestions.map((sug, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSelectSuggestion(sug)}
                                className={`py-2 px-3 font-mono text-sm font-bold border rounded-lg transition-all ${matricule === sug
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                    }`}
                            >
                                {sug}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Message de Sécurité pour l'agent */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-600 shrink-0">warning</span>
                <div className="text-xs text-amber-900">
                    <p className="font-bold uppercase tracking-wide">Procédure de Sécurité Pont-Bascule</p>
                    <p className="mt-1">
                        Veuillez vérifier manuellement la <strong>plaque de la remorque arrière</strong>. En cas d'intempéries ou de saleté sur la plaque, sélectionnez l'une des 3 suggestions ci-dessus ou corrigez directement le champ.
                    </p>
                </div>
            </div>
        </div>
    );
}