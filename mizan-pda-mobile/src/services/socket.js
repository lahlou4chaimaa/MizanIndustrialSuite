// src/services/socket.js

import { io } from 'socket.io-client';

const SOCKET_URL =
    'http://192.168.11.139:5000';

export const socket = io(SOCKET_URL, {
    transports: ['websocket'],
    autoConnect: false,

    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
});

/*
 * ============================================================
 * ÉVÉNEMENTS INTERNES SOCKET
 * ============================================================
 */

const handleConnect = () => {
    console.log(
        '[Socket.IO] Connecté :',
        socket.id
    );
};

const handleDisconnect = (reason) => {
    console.log(
        '[Socket.IO] Déconnecté :',
        reason
    );
};

const handleConnectError = (error) => {
    console.error(
        '[Socket.IO] Erreur :',
        error?.message || error
    );
};

/*
 * ============================================================
 * CONNEXION
 * ============================================================
 */

export const connectSocket = (
    nouvellePrestationCallback = null
) => {
    socket.off(
        'connect',
        handleConnect
    );

    socket.off(
        'disconnect',
        handleDisconnect
    );

    socket.off(
        'connect_error',
        handleConnectError
    );

    socket.on(
        'connect',
        handleConnect
    );

    socket.on(
        'disconnect',
        handleDisconnect
    );

    socket.on(
        'connect_error',
        handleConnectError
    );

    /*
     * Nouvelle prestation
     */
    socket.off(
        'nouvelle-prestation'
    );

    if (nouvellePrestationCallback) {
        socket.on(
            'nouvelle-prestation',
            nouvellePrestationCallback
        );
    }

    if (!socket.connected) {
        socket.connect();
    }
};

/*
 * ============================================================
 * PRESTATION — CHANGEMENT STATUT
 * ============================================================
 */

export const onPrestationStatutChange = (
    callback
) => {
    socket.off(
        'prestation-statut-change'
    );

    if (callback) {
        socket.on(
            'prestation-statut-change',
            callback
        );
    }
};

/*
 * ============================================================
 * PRESTATION — AFFECTATION
 * ============================================================
 */

export const onPrestationAffectee = (
    callback
) => {
    socket.off(
        'prestation-affectee'
    );

    if (callback) {
        socket.on(
            'prestation-affectee',
            callback
        );
    }
};

/*
 * ============================================================
 * PESÉE — ENTRÉE
 * ============================================================
 */

export const onPeseeEntreeEnregistree = (
    callback
) => {
    socket.off(
        'pesee-entree-enregistree'
    );

    if (callback) {
        socket.on(
            'pesee-entree-enregistree',
            callback
        );
    }
};

/*
 * ============================================================
 * PESÉE — SORTIE
 * ============================================================
 */

export const onPeseeSortieEnregistree = (
    callback
) => {
    socket.off(
        'pesee-sortie-enregistree'
    );

    if (callback) {
        socket.on(
            'pesee-sortie-enregistree',
            callback
        );
    }
};

/*
 * ============================================================
 * BALANCE
 * ============================================================
 */

export const onWeightUpdate = (
    callback
) => {
    socket.off(
        'weight-update'
    );

    if (callback) {
        socket.on(
            'weight-update',
            callback
        );
    }
};

/*
 * ============================================================
 * SUPPRESSION LISTENERS
 * ============================================================
 */

export const removeSocketListeners = () => {
    socket.off(
        'nouvelle-prestation'
    );

    socket.off(
        'prestation-statut-change'
    );

    socket.off(
        'prestation-affectee'
    );

    socket.off(
        'pesee-entree-enregistree'
    );

    socket.off(
        'pesee-sortie-enregistree'
    );

    socket.off(
        'weight-update'
    );
};

/*
 * ============================================================
 * DÉCONNEXION
 * ============================================================
 */

export const disconnectSocket = () => {
    removeSocketListeners();

    socket.off(
        'connect',
        handleConnect
    );

    socket.off(
        'disconnect',
        handleDisconnect
    );

    socket.off(
        'connect_error',
        handleConnectError
    );

    if (socket.connected) {
        socket.disconnect();
    }
};