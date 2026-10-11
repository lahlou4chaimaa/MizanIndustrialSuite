// import React, { useState } from 'react';

// export default function FormulairePesee({ poidsEnDirect }) {
//     const [matricule, setMatricule] = useState('');
//     const [chauffeur, setChauffeur] = useState('');
//     const [produit, setProduit] = useState('');
//     const [poidsCapture, setPoidsCapture] = useState('');

//     // Fonction pour verrouiller/capturer le poids du direct dans le formulaire
//     const handleCapturerPoids = () => {
//         setPoidsCapture(poidsEnDirect);
//     };

//     const handleSubmit = (e) => {
//         e.preventDefault();
//         const ticketData = {
//             matricule,
//             chauffeur,
//             produit,
//             poids: Number(poidsCapture),
//             date: new Date().toISOString()
//         };

//         console.log('📄 Ticket de pesée prêt à être envoyé :', ticketData);
//         alert(`Ticket enregistré pour ${matricule} avec un poids de ${poidsCapture} kg !`);
//     };

//     return (
//         <form onSubmit={handleSubmit} style={{
//             maxWidth: '400px',
//             margin: '0 auto',
//             padding: '20px',
//             border: '1px solid #ddd',
//             borderRadius: '8px',
//             display: 'flex',
//             flexDirection: 'column',
//             gap: '15px',
//             backgroundColor: '#fff',
//             color: '#333'
//         }}>
//             <h2>Nouveau Ticket de Pesée</h2>

//             <div>
//                 <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
//                     Immatriculation du Camion :
//                 </label>
//                 <input
//                     type="text"
//                     value={matricule}
//                     onChange={(e) => setMatricule(e.target.value)}
//                     placeholder="ex: 12345-A-6"
//                     required
//                     style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
//                 />
//             </div>

//             <div>
//                 <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
//                     Nom du Chauffeur :
//                 </label>
//                 <input
//                     type="text"
//                     value={chauffeur}
//                     onChange={(e) => setChauffeur(e.target.value)}
//                     placeholder="ex: Mohamed"
//                     required
//                     style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
//                 />
//             </div>

//             <div>
//                 <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
//                     Marchandise / Produit :
//                 </label>
//                 <input
//                     type="text"
//                     value={produit}
//                     onChange={(e) => setProduit(e.target.value)}
//                     placeholder="ex: Blé / Sucre / Ciment"
//                     required
//                     style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
//                 />
//             </div>

//             {/* Section Capture du Poids */}
//             <div style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '6px' }}>
//                 <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
//                     Poids Saisi pour le Ticket :
//                 </label>
//                 <div style={{ display: 'flex', gap: '10px' }}>
//                     <input
//                         type="number"
//                         value={poidsCapture}
//                         readOnly
//                         placeholder="Cliquez sur capturer"
//                         required
//                         style={{ flex: 1, padding: '8px', fontWeight: 'bold', fontSize: '16px' }}
//                     />
//                     <button
//                         type="button"
//                         onClick={handleCapturerPoids}
//                         style={{
//                             padding: '8px 15px',
//                             backgroundColor: '#007bff',
//                             color: '#fff',
//                             border: 'none',
//                             borderRadius: '4px',
//                             cursor: 'pointer'
//                         }}
//                     >
//                         🎯 Capturer ({poidsEnDirect} kg)
//                     </button>
//                 </div>
//             </div>

//             <button
//                 type="submit"
//                 style={{
//                     padding: '12px',
//                     backgroundColor: '#28a745',
//                     color: '#fff',
//                     fontSize: '16px',
//                     border: 'none',
//                     borderRadius: '6px',
//                     cursor: 'pointer',
//                     marginTop: '10px'
//                 }}
//             >
//                 💾 Valider et Enregistrer le Ticket
//             </button>
//         </form>
//     );
// }


import React, { useState } from 'react';
import InputMatricule from './InputMatricule';

export default function FormulairePesee({ poidsEnDirect = 0 }) {
    const [matriculeTracteur, setMatriculeTracteur] = useState('');
    const [matriculeRemorque, setMatriculeRemorque] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!matriculeTracteur) {
            alert("Veuillez saisir le matricule du tracteur.");
            return;
        }
        if (!poidsEnDirect || poidsEnDirect <= 0) {
            alert("Le poids mesure doit etre superieur a 0 kg.");
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || '';
            const headers = { 'Content-Type': 'application/json' };
            if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch('http://localhost:5000/api/pesee/entree', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    matriculeTracteur: matriculeTracteur.trim(),
                    matriculeRemorque: matriculeRemorque.trim(),
                    poidsEntree: Number(poidsEnDirect)
                })
            });
            const data = await response.json();
            if (response.ok) {
                alert(`${data.message || 'Pesee enregistree'}\nID: ${data.pesee?.id || 'N/A'}`);
                setMatriculeTracteur('');
                setMatriculeRemorque('');
            } else {
                alert(`Erreur [${response.status}]: ${data.error || 'Erreur'}`);
            }
        } catch {
            alert("Le serveur est injoignable.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start' }}>
                <InputMatricule
                    label="Tracteur (Avant)"
                    typeCamera="ocr-update"
                    value={matriculeTracteur}
                    onChange={(val) => setMatriculeTracteur(val)}
                />
                <InputMatricule
                    label="Remorque (Arriere)"
                    typeCamera="ocr-remorque-update"
                    value={matriculeRemorque}
                    onChange={(val) => setMatriculeRemorque(val)}
                />
            </div>
            <div style={{ textAlign: 'center', marginTop: 25 }}>
                <button type="submit" disabled={loading} style={{
                    padding: '14px 28px',
                    backgroundColor: loading ? '#6EE7B7' : '#10B981',
                    color: '#fff', border: 'none', borderRadius: 8,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold', fontSize: 16
                }}>
                    {loading ? 'ENREGISTREMENT...' : `VALIDER LA PESEE (${poidsEnDirect} kg)`}
                </button>
            </div>
        </form>
    );
}