import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export default function AffichagePesee() {
    const [liveData, setLiveData] = useState({ poids: 0, unite: 'kg', statut: 'STABLE' });

    useEffect(() => {
        const socket = io(SOCKET_URL);

        socket.on('weight-update', (data) => {
            setLiveData(data);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <h2>Pont-Bascule en Direct</h2>
            <div style={{
                fontSize: '56px',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                background: '#111',
                color: '#00FF00',
                padding: '20px 40px',
                borderRadius: '10px',
                display: 'inline-block'
            }}>
                {liveData.poids} {liveData.unite}
            </div>
            <p>Statut : <strong>{liveData.statut}</strong></p>
        </div>
    );
}