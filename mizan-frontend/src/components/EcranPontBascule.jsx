// src/EcranPontBascule.jsx
import React, { useState } from 'react';
import AffichagePesee from './AffichagePesee';
import InputMatricule from './InputMatricule';

export default function EcranPontBascule() {
    const [poids, setPoids] = useState(0);
    const [matriculeTracteur, setMatriculeTracteur] = useState('');
    const [matriculeRemorque, setMatriculeRemorque] = useState('');

    const handleValiderPesee = () => {
        const payload = {
            poids,
            matriculeTracteur,
            matriculeRemorque,
            date: new Date().toISOString()
        };

        console.log("💾 Enregistrement de la pesée :", payload);
        alert(`Pesée enregistrée :\nPoids: ${poids} kg\nTracteur: ${matriculeTracteur}\nRemorque: ${matriculeRemorque}`);
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#0F172A', minHeight: '100vh' }}>

            {/* Indicateur de Poids */}
            <AffichagePesee onWeightUpdate={(val) => setPoids(val)} />

            {/* Saisies / Détections Caméra */}
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>

                {/* Caméra Avant / Tracteur */}
                <InputMatricule
                    label="Matricule Tracteur (Avant)"
                    typeCamera="ocr-update"
                    onChange={(val) => setMatriculeTracteur(val)}
                />

                {/* Caméra Arrière / Remorque */}
                <InputMatricule
                    label="Matricule Remorque (Arrière)"
                    typeCamera="ocr-remorque-update"
                    onChange={(val) => setMatriculeRemorque(val)}
                />
            </div>

            {/* Bouton de validation */}
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button
                    onClick={handleValiderPesee}
                    style={{
                        backgroundColor: '#10B981',
                        color: '#FFFFFF',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        padding: '12px 30px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                    }}
                >
                    💾 VALIDER LA PESÉE
                </button>
            </div>
        </div>
    );
}