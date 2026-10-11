
// src/services/api.js


// ============================================================
// CONFIGURATION API
// ============================================================

const API_URL =
    process.env.EXPO_PUBLIC_API_URL ||
    'http://192.168.11.139:5000';


// ============================================================
// HEADERS
// ============================================================

const getHeaders = (
    token = null,
    json = true
) => {
    const headers = {};

    if (json) {
        headers['Content-Type'] =
            'application/json';
    }

    if (token) {
        headers.Authorization =
            `Bearer ${token}`;
    }

    return headers;
};


// ============================================================
// LECTURE SÉCURISÉE DE LA RÉPONSE
// ============================================================

const parseResponse = async (
    response,
    defaultError
) => {
    const text = await response.text();

    let data = {};

    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = {
                message: text,
            };
        }
    }

    if (!response.ok) {
        throw new Error(
            data?.message ||
            data?.error ||
            defaultError
        );
    }

    return data;
};


// ============================================================
// DOSSIER CAMION
// ============================================================

/**
 * GET /api/dossier/:ticketId
 *
 * Ancien endpoint conservé pour compatibilité
 * avec les anciens écrans du PDA.
 */
export const fetchDossierCamion = async (
    ticketId,
    token = null
) => {
    try {
        if (!ticketId) {
            throw new Error(
                'Ticket ID manquant.'
            );
        }

        const response = await fetch(
            `${API_URL}/api/dossier/${encodeURIComponent(
                ticketId
            )}`,
            {
                method: 'GET',
                headers: getHeaders(
                    token,
                    false
                ),
            }
        );

        return await parseResponse(
            response,
            'Impossible de récupérer le dossier.'
        );
    } catch (error) {
        console.error(
            '[API] fetchDossierCamion:',
            error
        );

        throw error;
    }
};


// ============================================================
// PRESTATION PAR QR CODE DU TICKET
// ============================================================

/**
 * GET /api/prestations/qr/:qrCode
 *
 * Nouveau flux PDA :
 *
 * QR du ticket
 *      ↓
 * Ticket
 *      ↓
 * Prestation liée
 *      ↓
 * Camion / Chauffeur / Marchandise / Zone
 *
 * Le PDA n'a donc pas besoin de connaître
 * prestation_id avant le scan.
 */
export const fetchPrestationByQr = async (
    qrCode,
    token = null
) => {
    try {
        if (
            !qrCode ||
            !String(qrCode).trim()
        ) {
            throw new Error(
                'QR code manquant.'
            );
        }

        const cleanQrCode =
            String(qrCode).trim();

        console.log(
            '[API] Recherche prestation par QR:',
            cleanQrCode
        );

        const response = await fetch(
            `${API_URL}/api/prestations/qr/${encodeURIComponent(
                cleanQrCode
            )}`,
            {
                method: 'GET',
                headers: getHeaders(
                    token,
                    false
                ),
            }
        );

        const data = await parseResponse(
            response,
            'Impossible de récupérer la prestation liée au QR code.'
        );

        console.log(
            '[API] Prestation récupérée par QR:',
            data
        );

        return data;
    } catch (error) {
        console.error(
            '[API] fetchPrestationByQr:',
            error
        );

        throw error;
    }
};


// ============================================================
// PRESTATIONS PDA
// ============================================================

/**
 * GET /api/prestations/pda
 *
 * Récupère les prestations disponibles
 * pour le PDA.
 */

export const fetchPrestationsPDA = async () => {
    try {
        const response = await fetch(
            `${API_URL}/api/prestations/pda`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data?.message ||
                "Impossible de récupérer les prestations."
            );
        }

        return data;

    } catch (error) {
        console.error(
            "[API] Erreur fetchPrestationsPDA :",
            error
        );

        throw error;
    }
};

// ============================================================
// PRESTATION PAR ID
// ============================================================

/**
 * GET /api/prestations/:id
 */
export const fetchPrestationById = async (
    prestationId,
    token = null
) => {
    try {
        if (!prestationId) {
            throw new Error(
                'ID prestation manquant.'
            );
        }

        const response = await fetch(
            `${API_URL}/api/prestations/${encodeURIComponent(
                prestationId
            )}`,
            {
                method: 'GET',
                headers: getHeaders(
                    token,
                    false
                ),
            }
        );

        return await parseResponse(
            response,
            'Prestation introuvable.'
        );
    } catch (error) {
        console.error(
            '[API] fetchPrestationById:',
            error
        );

        throw error;
    }
};


// ============================================================
// CHANGEMENT STATUT PRESTATION
// ============================================================

/**
 * POST /api/prestations/:id/statut
 *
 * IMPORTANT :
 * Le backend actuel utilise PATCH
 * pour cette route.
 *
 * Cette fonction est conservée pour compatibilité
 * avec l'ancien PDA.
 */
export const changerStatutPrestation = async (
    prestationId,
    statut,
    token = null
) => {
    try {
        if (!prestationId) {
            throw new Error(
                'ID prestation manquant.'
            );
        }

        if (!statut) {
            throw new Error(
                'Statut manquant.'
            );
        }

        const response = await fetch(
            `${API_URL}/api/prestations/${encodeURIComponent(
                prestationId
            )}/statut`,
            {
                method: 'PATCH',
                headers: getHeaders(token),
                body: JSON.stringify({
                    statut,
                }),
            }
        );

        return await parseResponse(
            response,
            'Impossible de modifier le statut de la prestation.'
        );
    } catch (error) {
        console.error(
            '[API] changerStatutPrestation:',
            error
        );

        throw error;
    }
};


// ============================================================
// PESÉE D'ENTRÉE
// ============================================================

/**
 * POST /api/pesee/entree
 *
 * Payload :
 *
 * {
 *     prestation_id,
 *     immatriculation_tracteur,
 *     immatriculation_remorque,
 *     poidsTare,
 *     codeQr,
 *     identite_confirmee,
 *     chauffeur_id
 * }
 *
 * Cette fonction est conservée pour les anciens
 * écrans du PDA.
 */
export const createPeseeEntree = async (
    payload,
    token = null
) => {
    try {
        if (!payload) {
            throw new Error(
                'Données de pesée manquantes.'
            );
        }

        if (!payload.prestation_id) {
            throw new Error(
                'ID prestation manquant.'
            );
        }

        if (
            !payload.immatriculation_tracteur ||
            !String(
                payload.immatriculation_tracteur
            ).trim()
        ) {
            throw new Error(
                'Immatriculation du tracteur manquante.'
            );
        }

        const poidsTare = Number(
            payload.poidsTare
        );

        if (
            !Number.isFinite(poidsTare) ||
            poidsTare <= 0
        ) {
            throw new Error(
                'Poids de tare invalide.'
            );
        }

        const cleanPayload = {
            ...payload,

            prestation_id:
                Number(
                    payload.prestation_id
                ),

            immatriculation_tracteur:
                String(
                    payload.immatriculation_tracteur
                ).trim(),

            immatriculation_remorque:
                payload.immatriculation_remorque
                    ? String(
                        payload.immatriculation_remorque
                    ).trim()
                    : null,

            poidsTare,

            codeQr:
                payload.codeQr
                    ? String(
                        payload.codeQr
                    ).trim()
                    : null,

            identite_confirmee:
                Boolean(
                    payload.identite_confirmee
                ),

            chauffeur_id:
                payload.chauffeur_id
                    ? Number(
                        payload.chauffeur_id
                    )
                    : null,
        };

        console.log(
            '[API] POST /pesee/entree',
            cleanPayload
        );

        const response = await fetch(
            `${API_URL}/api/pesee/entree`,
            {
                method: 'POST',
                headers: getHeaders(token),
                body: JSON.stringify(
                    cleanPayload
                ),
            }
        );

        return await parseResponse(
            response,
            'Impossible d’enregistrer la pesée d’entrée.'
        );
    } catch (error) {
        console.error(
            '[API] createPeseeEntree:',
            error
        );

        throw error;
    }
};


// ============================================================
// PESÉE DE SORTIE
// ============================================================

/**
 * POST /api/pesee/:id/sortie
 *
 * Payload :
 *
 * {
 *     poidsBrut
 * }
 *
 * Le PDA transmet uniquement le poids brut.
 *
 * Le calcul du poids net n'est PAS effectué ici.
 */
export const createPeseeSortie = async (
    peseeId,
    poidsBrut,
    token = null
) => {
    try {
        if (!peseeId) {
            throw new Error(
                'ID pesée manquant.'
            );
        }

        const numericPoidsBrut =
            Number(poidsBrut);

        if (
            !Number.isFinite(
                numericPoidsBrut
            ) ||
            numericPoidsBrut <= 0
        ) {
            throw new Error(
                'Poids brut invalide.'
            );
        }

        console.log(
            '[API] POST /pesee/%s/sortie',
            peseeId
        );

        const response = await fetch(
            `${API_URL}/api/pesee/${encodeURIComponent(
                peseeId
            )}/sortie`,
            {
                method: 'POST',
                headers: getHeaders(token),
                body: JSON.stringify({
                    poidsBrut:
                        numericPoidsBrut,
                }),
            }
        );

        return await parseResponse(
            response,
            'Impossible d’enregistrer la pesée de sortie.'
        );
    } catch (error) {
        console.error(
            '[API] createPeseeSortie:',
            error
        );

        throw error;
    }
};


// ============================================================
// PESÉE EN COURS PAR CAMION
// ============================================================

/**
 * GET /api/pesee/en-cours/camion/:immatriculation
 */
export const fetchPeseeEnCoursParCamion =
    async (
        immatriculation,
        token = null
    ) => {
        try {
            if (
                !immatriculation ||
                !String(
                    immatriculation
                ).trim()
            ) {
                throw new Error(
                    'Immatriculation manquante.'
                );
            }

            const cleanImmatriculation =
                String(
                    immatriculation
                ).trim();

            const response = await fetch(
                `${API_URL}/api/pesee/en-cours/camion/${encodeURIComponent(
                    cleanImmatriculation
                )}`,
                {
                    method: 'GET',
                    headers: getHeaders(
                        token,
                        false
                    ),
                }
            );

            return await parseResponse(
                response,
                'Impossible de récupérer la pesée en cours.'
            );
        } catch (error) {
            console.error(
                '[API] fetchPeseeEnCoursParCamion:',
                error
            );

            throw error;
        }
    };


// ============================================================
// PESÉE PAR ID
// ============================================================

/**
 * GET /api/pesee/:id
 */
export const fetchPeseeById = async (
    peseeId,
    token = null
) => {
    try {
        if (!peseeId) {
            throw new Error(
                'ID pesée manquant.'
            );
        }

        const response = await fetch(
            `${API_URL}/api/pesee/${encodeURIComponent(
                peseeId
            )}`,
            {
                method: 'GET',
                headers: getHeaders(
                    token,
                    false
                ),
            }
        );

        return await parseResponse(
            response,
            'Pesée introuvable.'
        );
    } catch (error) {
        console.error(
            '[API] fetchPeseeById:',
            error
        );

        throw error;
    }
};


// ============================================================
// ANCIEN ENDPOINT DE VALIDATION
// ============================================================

/**
 * Ancienne fonction conservée pour
 * compatibilité avec d'éventuels anciens écrans.
 *
 * POST /api/prestation/valider
 */
export const submitPrestationValidation =
    async (
        ticketId,
        prestationId,
        payload = {},
        token = null
    ) => {
        try {
            const response =
                await fetch(
                    `${API_URL}/api/prestation/valider`,
                    {
                        method: 'POST',
                        headers:
                            getHeaders(
                                token
                            ),
                        body: JSON.stringify({
                            ticketId,
                            prestationId,
                            ...payload,
                        }),
                    }
                );

            return await parseResponse(
                response,
                'Échec de validation de la prestation.'
            );
        } catch (error) {
            console.error(
                '[API] submitPrestationValidation:',
                error
            );

            throw error;
        }
    };


// ============================================================
// EXPORT
// ============================================================
// ============================================================
// VALIDATION AUTORISATION PRESTATION PDA
// ============================================================

/**
 * POST /api/prestation-autorisations/valider
 *
 * Vérifie qu'un camion peut accéder à une prestation.
 *
 * Payload :
 * {
 *     prestation_id,
 *     camion_id,
 *     chauffeur_id
 * }
 */
export const validerAccesPrestation = async (
    prestationId,
    camionId,
    chauffeurId = null,
    token = null
) => {
    try {
        if (!prestationId) {
            throw new Error(
                'ID prestation manquant pour la validation.'
            );
        }

        if (!camionId) {
            throw new Error(
                'ID camion manquant pour la validation.'
            );
        }

        const payload = {
            prestation_id: Number(prestationId),
            camion_id: Number(camionId),
        };

        if (chauffeurId) {
            payload.chauffeur_id = Number(chauffeurId);
        }

        console.log(
            '[API] Validation autorisation prestation:',
            payload
        );

        const response = await fetch(
            `${API_URL}/api/prestation-autorisations/valider`,
            {
                method: 'POST',
                headers: getHeaders(token),
                body: JSON.stringify(payload),
            }
        );

        const data = await parseResponse(
            response,
            'Impossible de valider l’autorisation de la prestation.'
        );

        console.log(
            '[API] Résultat validation autorisation:',
            data
        );

        return data;
    } catch (error) {
        console.error(
            '[API] validerAccesPrestation:',
            error
        );

        throw error;
    }
};
export const affecterPrestationAuTicket = async (
    prestationId,
    ticketId
) => {
    if (!prestationId) {
        throw new Error(
            "L'identifiant de la prestation est obligatoire."
        );
    }

    if (!ticketId) {
        throw new Error(
            "L'identifiant du ticket est obligatoire."
        );
    }

    const response = await fetch(
        `${API_URL}/api/prestations/${prestationId}/affectation`,
        {
            method: "PATCH",

            headers: {
                "Content-Type": "application/json",
            },

            body: JSON.stringify({
                ticket_id: ticketId,
            }),
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data?.message ||
            data?.error ||
            "Impossible d'affecter la prestation au ticket."
        );
    }

    return data;
};
export {
    API_URL,
};

