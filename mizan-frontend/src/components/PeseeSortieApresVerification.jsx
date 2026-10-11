import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    CheckCircle2,
    AlertCircle,
    Truck,
    Weight,
    ArrowRight,
    RotateCcw,
    LayoutDashboard,
    Printer,
    Package,
    ClipboardCheck,
    ShieldCheck,
} from "lucide-react";

import InputMatricule from "./InputMatricule";
import WeighingIQDesign from "./WeighingIQDesign";
import { socket } from "./socket";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

// ============================================================
// NORMALISATION PLAQUE
// ============================================================

const normalizePlate = (value) => {
    if (!value) {
        return "";
    }

    return String(value)
        .normalize("NFKC")
        .toLowerCase()
        .replace(/[|]/g, "")
        .replace(/\s+/g, "")
        .replace(/[-_./]/g, "")
        .trim();
};

// ============================================================
// SIGNATURE PLAQUE
// ============================================================

const getPlateSignature = (value) => {
    if (!value) {
        return null;
    }

    const normalized =
        String(value)
            .normalize("NFKC")
            .toLowerCase();

    const digits =
        (normalized.match(/\d+/g) || []).join("");

    const arabicLetters =
        (
            normalized.match(
                /[\u0600-\u06FF]/g
            ) || []
        ).join("");

    if (!digits && !arabicLetters) {
        return null;
    }

    return {
        digits,
        arabicLetters,
    };
};

// ============================================================
// COMPARAISON PLAQUES
// ============================================================

const platesMatch = (plate1, plate2) => {
    if (!plate1 || !plate2) {
        return false;
    }

    const normalized1 =
        normalizePlate(plate1);

    const normalized2 =
        normalizePlate(plate2);

    if (
        normalized1 &&
        normalized1 === normalized2
    ) {
        return true;
    }

    const signature1 =
        getPlateSignature(plate1);

    const signature2 =
        getPlateSignature(plate2);

    if (
        !signature1 ||
        !signature2
    ) {
        return false;
    }

    return (
        signature1.digits ===
        signature2.digits &&
        signature1.arabicLetters ===
        signature2.arabicLetters
    );
};

// ============================================================
// EXTRACTION DONNEES API
// ============================================================

const extractPesee = (data) => {
    return (
        data?.pesee ||
        data?.data?.pesee ||
        data?.data ||
        null
    );
};

const extractTicket = (data) => {
    return (
        data?.ticket ||
        data?.data?.ticket ||
        data?.pesee?.ticket ||
        null
    );
};

// ============================================================
// EXTRACTION PRESTATION
// ============================================================

const extractPrestation = (pesee) => {
    if (!pesee) {
        return null;
    }

    return (
        pesee?.prestation ||
        pesee?.ticket?.prestation ||
        null
    );
};

// ============================================================
// EXTRACTION PRESTATION CAMION
// ============================================================

const extractPrestationCamion = (pesee) => {
    if (!pesee) {
        return null;
    }

    const prestation =
        extractPrestation(pesee);

    return (
        pesee?.prestationCamion ||
        pesee?.prestation_camion ||
        pesee?.ticket?.prestationCamion ||
        pesee?.ticket?.prestation_camion ||
        prestation?.prestationCamion ||
        prestation?.prestation_camion ||
        prestation?.camionAffectation ||
        null
    );
};

// ============================================================
// UNITE
// ============================================================

const normalizeUnit = (value) => {

    const unit =
        String(value || "")
            .trim()
            .toLowerCase();

    if (
        unit === "t" ||
        unit === "ton" ||
        unit === "tons" ||
        unit === "tonne" ||
        unit === "tonnes"
    ) {
        return "T";
    }

    return "kg";
};

// ============================================================
// CONVERSION
// ============================================================

const convertKgToUnit = (
    kilograms,
    unit
) => {

    const kg =
        Number(kilograms);

    if (!Number.isFinite(kg)) {
        return 0;
    }

    return normalizeUnit(unit) === "T"
        ? kg / 1000
        : kg;
};

// ============================================================
// FORMAT NOMBRE
// ============================================================

const formatNumber = (
    value,
    decimals = 3
) => {

    const number =
        Number(value);

    if (!Number.isFinite(number)) {
        return "—";
    }

    return number.toLocaleString(
        "fr-FR",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: decimals,
        }
    );
};

// ============================================================
// COMPOSANT
// ============================================================

export default function PeseeSortieApresVerification({
    peseeId: peseeIdProp = null,
    onRetourDashboard,
} = {}) {

    // ========================================================
    // IDENTIFIANT PESEE
    // ========================================================

    const [peseeId, setPeseeId] =
        useState(
            peseeIdProp
        );

    // ========================================================
    // ETAPE
    // ========================================================

    const [step, setStep] =
        useState("chargement");

    // ========================================================
    // PESEE
    // ========================================================

    const [pesee, setPesee] =
        useState(null);

    const [ticket, setTicket] =
        useState(null);

    // ========================================================
    // PRESTATION
    // ========================================================

    const [prestation, setPrestation] =
        useState(null);

    const [prestationCamion, setPrestationCamion] =
        useState(null);

    // ========================================================
    // MATRICULES
    // ========================================================

    const [matriculeTracteur, setMatriculeTracteur] =
        useState("");

    const [matriculeRemorque, setMatriculeRemorque] =
        useState("");

    const [matriculeTracteurVerifie, setMatriculeTracteurVerifie] =
        useState(false);

    const [matriculeRemorqueVerifie, setMatriculeRemorqueVerifie] =
        useState(false);

    // ========================================================
    // POIDS
    // ========================================================

    const [poids, setPoids] =
        useState(0);

    const [statutPoids, setStatutPoids] =
        useState("STABLE");

    const [poidsBrut, setPoidsBrut] =
        useState(null);

    const [poidsNet, setPoidsNet] =
        useState(null);

    // ========================================================
    // RESULTAT
    // ========================================================

    const [resultat, setResultat] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [validationLoading, setValidationLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    // ========================================================
    // RECUPERER ID DEPUIS URL SI NECESSAIRE
    // ========================================================

    useEffect(() => {

        if (peseeIdProp) {
            setPeseeId(
                peseeIdProp
            );

            return;
        }

        try {

            const params =
                new URLSearchParams(
                    window.location.search
                );

            const id =
                params.get("peseeId") ||
                params.get("pesee_id") ||
                params.get("id");

            if (id) {
                setPeseeId(id);
            }

        } catch (err) {

            console.warn(
                "[SORTIE] Impossible de lire l'URL :",
                err
            );
        }

    }, [
        peseeIdProp,
    ]);

    // ========================================================
    // CHARGER PESEE
    // ========================================================

    const loadPesee = useCallback(
        async () => {

            if (!peseeId) {

                setLoading(false);
                setError(
                    "Aucun identifiant de pesée n'a été fourni."
                );

                setStep(
                    "erreur"
                );

                return;
            }

            try {

                setLoading(true);
                setError("");
                setSuccess("");

                const token =
                    localStorage.getItem(
                        "token"
                    );

                const response =
                    await fetch(
                        `${API_URL}/pesee/${encodeURIComponent(
                            peseeId
                        )}`,
                        {
                            headers: {
                                ...(token
                                    ? {
                                        Authorization:
                                            `Bearer ${token}`,
                                    }
                                    : {}),
                            },
                        }
                    );

                let data = null;

                try {

                    data =
                        await response.json();

                } catch {

                    data = null;
                }

                if (!response.ok) {

                    throw new Error(
                        data?.error ||
                        data?.message ||
                        `Impossible de récupérer la pesée (${response.status}).`
                    );
                }

                const loadedPesee =
                    extractPesee(
                        data
                    );

                if (!loadedPesee) {

                    throw new Error(
                        "La pesée demandée est introuvable."
                    );
                }

                const loadedTicket =
                    extractTicket(
                        data
                    ) ||
                    loadedPesee?.ticket ||
                    null;

                const loadedPrestation =
                    extractPrestation(
                        loadedPesee
                    );

                const loadedPrestationCamion =
                    extractPrestationCamion(
                        loadedPesee
                    );

                setPesee(
                    loadedPesee
                );

                setTicket(
                    loadedTicket
                );

                setPrestation(
                    loadedPrestation
                );

                setPrestationCamion(
                    loadedPrestationCamion
                );

                // ------------------------------------------------
                // MATRICULE ENTREE
                // ------------------------------------------------

                const entreeTracteur =
                    loadedPesee
                        ?.immatriculation_tracteur_scanned ||
                    loadedTicket
                        ?.matricule_tracteur ||
                    loadedPesee
                        ?.matricule_tracteur ||
                    "";

                const entreeRemorque =
                    loadedPesee
                        ?.immatriculation_remorque_scanned ||
                    loadedTicket
                        ?.matricule_remorque ||
                    loadedPesee
                        ?.matricule_remorque ||
                    "";

                setMatriculeTracteur(
                    entreeTracteur
                );

                setMatriculeRemorque(
                    entreeRemorque
                );

                // ------------------------------------------------
                // TARE
                // ------------------------------------------------

                const tare =
                    Number(
                        loadedPesee?.poids_tare
                    );

                if (
                    Number.isFinite(tare)
                ) {

                    setPesee(
                        loadedPesee
                    );
                }

                setStep(
                    "matricules"
                );

            } catch (err) {

                console.error(
                    "[SORTIE] Erreur chargement pesée :",
                    err
                );

                setError(
                    err?.message ||
                    "Impossible de charger la pesée."
                );

                setStep(
                    "erreur"
                );

            } finally {

                setLoading(false);
            }

        },
        [
            peseeId,
        ]
    );

    useEffect(() => {

        loadPesee();

    }, [
        loadPesee,
    ]);

    // ========================================================
    // SOCKET POIDS
    // ========================================================

    useEffect(() => {

        const handleWeightUpdate =
            (data) => {

                if (!data) {
                    return;
                }

                const value =
                    Number(
                        data.poids
                    );

                if (
                    !Number.isFinite(value)
                ) {
                    return;
                }

                setPoids(
                    value
                );

                setStatutPoids(
                    String(
                        data.statut ||
                        "STABLE"
                    ).toUpperCase()
                );
            };

        socket.on(
            "weight-update",
            handleWeightUpdate
        );

        return () => {

            socket.off(
                "weight-update",
                handleWeightUpdate
            );

        };

    }, []);

    // ========================================================
    // DONNEES ENTREE
    // ========================================================

    const matriculeEntreeTracteur =
        useMemo(() => {

            return (
                pesee
                    ?.immatriculation_tracteur_scanned ||
                ticket
                    ?.matricule_tracteur ||
                ""
            );

        }, [
            pesee,
            ticket,
        ]);

    const matriculeEntreeRemorque =
        useMemo(() => {

            return (
                pesee
                    ?.immatriculation_remorque_scanned ||
                ticket
                    ?.matricule_remorque ||
                ""
            );

        }, [
            pesee,
            ticket,
        ]);

    const tare =
        useMemo(() => {

            const value =
                Number(
                    pesee?.poids_tare
                );

            return Number.isFinite(value)
                ? value
                : null;

        }, [
            pesee,
        ]);

    // ========================================================
    // PRESTATION ID
    // ========================================================

    const prestationId =
        useMemo(() => {

            return (
                ticket?.prestation_id ||
                pesee?.prestation_id ||
                prestation?.id ||
                null
            );

        }, [
            ticket,
            pesee,
            prestation,
        ]);

    // ========================================================
    // UNITE PRESTATION
    // ========================================================

    const unitePrestation =
        useMemo(() => {

            return normalizeUnit(
                prestation?.unite ||
                prestation?.unite_mesure ||
                prestation?.unite_quantite ||
                prestation?.unit ||
                "T"
            );

        }, [
            prestation,
        ]);

    // ========================================================
    // QUANTITE CAMION
    // ========================================================

    const quantitePrevueCamion =
        useMemo(() => {

            if (!prestationCamion) {
                return null;
            }

            const value =
                Number(
                    prestationCamion
                        ?.quantite_prevue
                );

            return Number.isFinite(value)
                ? value
                : null;

        }, [
            prestationCamion,
        ]);

    const quantiteRealiseeCamion =
        useMemo(() => {

            if (!prestationCamion) {
                return 0;
            }

            const value =
                Number(
                    prestationCamion
                        ?.quantite_realisee
                );

            return Number.isFinite(value)
                ? value
                : 0;

        }, [
            prestationCamion,
        ]);

    const quantiteRestanteCamion =
        useMemo(() => {

            if (
                quantitePrevueCamion ===
                null
            ) {
                return null;
            }

            return Math.max(
                quantitePrevueCamion -
                quantiteRealiseeCamion,
                0
            );

        }, [
            quantitePrevueCamion,
            quantiteRealiseeCamion,
        ]);

    // ========================================================
    // QUANTITE GLOBALE
    // ========================================================

    const quantitePrevueGlobale =
        useMemo(() => {

            if (
                prestation?.quantite_prevue ===
                null ||
                prestation?.quantite_prevue ===
                undefined
            ) {
                return null;
            }

            const value =
                Number(
                    prestation.quantite_prevue
                );

            return Number.isFinite(value)
                ? value
                : null;

        }, [
            prestation,
        ]);

    const quantiteRealiseeGlobale =
        useMemo(() => {

            const value =
                Number(
                    prestation?.quantite_realisee ||
                    0
                );

            return Number.isFinite(value)
                ? value
                : 0;

        }, [
            prestation,
        ]);

    const quantiteRestanteGlobale =
        useMemo(() => {

            if (
                quantitePrevueGlobale ===
                null
            ) {
                return null;
            }

            return Math.max(
                quantitePrevueGlobale -
                quantiteRealiseeGlobale,
                0
            );

        }, [
            quantitePrevueGlobale,
            quantiteRealiseeGlobale,
        ]);

    // ========================================================
    // QUANTITE ACTUELLE
    // ========================================================

    const quantiteActuelle =
        useMemo(() => {

            if (
                poidsNet ===
                null
            ) {
                return null;
            }

            return convertKgToUnit(
                poidsNet,
                unitePrestation
            );

        }, [
            poidsNet,
            unitePrestation,
        ]);

    // ========================================================
    // TOLERANCE 5 %
    // ========================================================

    const toleranceCamion =
        useMemo(() => {

            if (
                quantiteRestanteCamion ===
                null
            ) {
                return null;
            }

            return (
                quantiteRestanteCamion *
                0.05
            );

        }, [
            quantiteRestanteCamion,
        ]);

    const quantiteMin =
        useMemo(() => {

            if (
                quantiteRestanteCamion ===
                null
            ) {
                return null;
            }

            return Math.max(
                quantiteRestanteCamion -
                toleranceCamion,
                0
            );

        }, [
            quantiteRestanteCamion,
            toleranceCamion,
        ]);

    const quantiteMax =
        useMemo(() => {

            if (
                quantiteRestanteCamion ===
                null
            ) {
                return null;
            }

            return (
                quantiteRestanteCamion +
                toleranceCamion
            );

        }, [
            quantiteRestanteCamion,
            toleranceCamion,
        ]);

    // ========================================================
    // VERIFICATION MATRICULE TRACTEUR
    // ========================================================

    const verifyTracteur = () => {

        setError("");

        if (
            !matriculeTracteur.trim()
        ) {

            setError(
                "Le matricule du tracteur est obligatoire."
            );

            return false;
        }

        if (
            !matriculeEntreeTracteur
        ) {

            setError(
                "Le matricule du tracteur enregistré à l'entrée est introuvable."
            );

            return false;
        }

        if (
            !platesMatch(
                matriculeTracteur,
                matriculeEntreeTracteur
            )
        ) {

            setMatriculeTracteurVerifie(
                false
            );

            setError(
                `Le matricule du tracteur ne correspond pas à celui enregistré à l'entrée (${matriculeEntreeTracteur}).`
            );

            return false;
        }

        setMatriculeTracteurVerifie(
            true
        );

        return true;
    };

    // ========================================================
    // VERIFICATION MATRICULE REMORQUE
    // ========================================================

    const verifyRemorque = () => {

        setError("");

        // -----------------------------------------------
        // Aucune remorque à l'entrée
        // -----------------------------------------------

        if (
            !matriculeEntreeRemorque
        ) {

            setMatriculeRemorqueVerifie(
                true
            );

            return true;
        }

        // -----------------------------------------------
        // Remorque obligatoire
        // -----------------------------------------------

        if (
            !matriculeRemorque.trim()
        ) {

            setError(
                "Le matricule de la remorque est obligatoire car une remorque était enregistrée à l'entrée."
            );

            return false;
        }

        if (
            !platesMatch(
                matriculeRemorque,
                matriculeEntreeRemorque
            )
        ) {

            setMatriculeRemorqueVerifie(
                false
            );

            setError(
                `Le matricule de la remorque ne correspond pas à celui enregistré à l'entrée (${matriculeEntreeRemorque}).`
            );

            return false;
        }

        setMatriculeRemorqueVerifie(
            true
        );

        return true;
    };

    // ========================================================
    // CONTINUER MATRICULES
    // ========================================================

    const continueFromMatricules =
        () => {

            setError("");
            setSuccess("");

            const tracteurOK =
                verifyTracteur();

            if (!tracteurOK) {
                return;
            }

            const remorqueOK =
                verifyRemorque();

            if (!remorqueOK) {
                return;
            }

            setStep(
                "poids"
            );
        };

    // ========================================================
    // VALIDATION POIDS SORTIE
    // ========================================================

    // ========================================================
    // VALIDATION POIDS SORTIE
    // ========================================================

    const validateSortie =
        async (
            currentWeight
        ) => {

            const grossWeight =
                Number(
                    currentWeight
                );

            // ------------------------------------------------
            // POIDS
            // SORTIE = POIDS BRUT
            // PLAGE AUTORISEE : 20 000 → 40 000 KG
            // ------------------------------------------------

            if (
                !Number.isFinite(
                    grossWeight
                ) ||
                grossWeight <= 0
            ) {

                const message =
                    "Le poids brut est invalide.";

                setError(
                    message
                );

                return {
                    success: false,
                    error: message,
                };
            }

            if (
                grossWeight < 20000
            ) {

                const message =
                    `Le poids brut doit être compris entre 20 000 kg et 40 000 kg. Poids actuel : ${formatNumber(
                        grossWeight,
                        2
                    )} kg.`;

                setError(
                    message
                );

                return {
                    success: false,
                    error: message,
                };
            }

            if (
                grossWeight > 40000
            ) {

                const message =
                    `Le poids brut doit être compris entre 20 000 kg et 40 000 kg. Poids actuel : ${formatNumber(
                        grossWeight,
                        2
                    )} kg.`;

                setError(
                    message
                );

                return {
                    success: false,
                    error: message,
                };
            }

            // ------------------------------------------------
            // STABILITE
            // ------------------------------------------------



            // ------------------------------------------------
            // TARE
            // ------------------------------------------------

            if (
                tare === null
            ) {

                const message =
                    "Le poids de tare enregistré est introuvable.";

                setError(
                    message
                );

                return {
                    success: false,
                    error: message,
                };
            }

            // ------------------------------------------------
            // MATRICULE TRACTEUR
            // ------------------------------------------------

            if (
                !matriculeTracteurVerifie
            ) {

                const ok =
                    verifyTracteur();

                if (!ok) {

                    return {
                        success: false,
                        error:
                            "Le matricule du tracteur n'est pas vérifié.",
                    };
                }
            }

            // ------------------------------------------------
            // MATRICULE REMORQUE
            // ------------------------------------------------

            if (
                !matriculeRemorqueVerifie
            ) {

                const ok =
                    verifyRemorque();

                if (!ok) {

                    return {
                        success: false,
                        error:
                            "Le matricule de la remorque n'est pas vérifié.",
                    };
                }
            }

            // ------------------------------------------------
            // NET
            // BRUT - TARE
            // ------------------------------------------------

            const netWeight =
                grossWeight -
                tare;

            if (
                netWeight <= 0
            ) {

                const message =
                    `Le poids brut (${formatNumber(
                        grossWeight,
                        2
                    )} kg) doit être supérieur à la tare (${formatNumber(
                        tare,
                        2
                    )} kg).`;

                setError(
                    message
                );

                return {
                    success: false,
                    error: message,
                };
            }

            // ------------------------------------------------
            // QUANTITE
            // ------------------------------------------------

            const quantity =
                convertKgToUnit(
                    netWeight,
                    unitePrestation
                );

            // ------------------------------------------------
            // CONTROLE FRONTEND 5 %
            //
            // Le backend reste la validation finale.
            // ------------------------------------------------

            if (
                quantiteRestanteCamion !==
                null &&
                quantiteRestanteCamion <= 0
            ) {

                const message =
                    "La quantité restante affectée à ce camion est déjà épuisée.";

                setError(
                    message
                );

                return {
                    success: false,
                    error: message,
                };
            }

            if (
                quantiteRestanteCamion !==
                null &&
                (
                    quantity <
                    quantiteMin ||
                    quantity >
                    quantiteMax
                )
            ) {

                const message =
                    `La quantité pesée est de ${formatNumber(
                        quantity
                    )} ${unitePrestation}. ` +
                    `La quantité attendue pour ce camion est de ${formatNumber(
                        quantiteRestanteCamion
                    )} ${unitePrestation}, ` +
                    `avec une tolérance de ±5 % ` +
                    `(${formatNumber(
                        quantiteMin
                    )} à ${formatNumber(
                        quantiteMax
                    )} ${unitePrestation}).`;

                setError(
                    message
                );

                return {
                    success: false,
                    error: message,
                };
            }

            // ------------------------------------------------
            // CONTROLE GLOBAL
            // ------------------------------------------------

            if (
                quantiteRestanteGlobale !==
                null &&
                quantity >
                quantiteRestanteGlobale
            ) {

                const message =
                    `La quantité pesée (${formatNumber(
                        quantity
                    )} ${unitePrestation}) dépasse la quantité restante globale de la prestation (${formatNumber(
                        quantiteRestanteGlobale
                    )} ${unitePrestation}).`;

                setError(
                    message
                );

                return {
                    success: false,
                    error: message,
                };
            }

            // ------------------------------------------------
            // ETAT LOCAL
            // ------------------------------------------------

            setError("");
            setSuccess("");
            setValidationLoading(
                true
            );

            try {

                const token =
                    localStorage.getItem(
                        "token"
                    );

                // ------------------------------------------------
                // BODY
                // ------------------------------------------------

                const body = {
                    poidsBrut:
                        grossWeight,

                    matriculeTracteur:
                        matriculeTracteur.trim(),

                    matriculeRemorque:
                        matriculeRemorque?.trim() ||
                        "",
                };

                console.log(
                    "[SORTIE] Validation :",
                    {
                        peseeId,
                        poidsBrut:
                            grossWeight,
                        poidsTare:
                            tare,
                        poidsNet:
                            netWeight,
                        quantite:
                            quantity,
                        unite:
                            unitePrestation,
                        prestationId,
                        matriculeTracteur:
                            matriculeTracteur.trim(),
                        matriculeRemorque:
                            matriculeRemorque?.trim() ||
                            "",
                    }
                );

                // ------------------------------------------------
                // BACKEND
                // ------------------------------------------------

                const response =
                    await fetch(
                        `${API_URL}/pesee/${encodeURIComponent(
                            peseeId
                        )}/sortie`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                ...(token
                                    ? {
                                        Authorization:
                                            `Bearer ${token}`,
                                    }
                                    : {}),
                            },

                            body:
                                JSON.stringify(
                                    body
                                ),
                        }
                    );

                let data = null;

                try {

                    data =
                        await response.json();

                } catch {

                    data = null;
                }

                console.log(
                    "[SORTIE] Réponse serveur :",
                    {
                        status:
                            response.status,
                        ok:
                            response.ok,
                        data,
                    }
                );

                if (
                    !response.ok
                ) {

                    const errorMessage =
                        data?.error ||
                        data?.message ||
                        data?.details ||
                        data?.msg ||
                        `Erreur serveur HTTP ${response.status}`;

                    throw new Error(
                        errorMessage
                    );
                }

                const returnedPesee =
                    extractPesee(
                        data
                    ) ||
                    data?.pesee ||
                    pesee;

                const returnedTicket =
                    extractTicket(
                        data
                    ) ||
                    data?.ticket ||
                    ticket;

                const returnedPrestation =
                    data?.prestation ||
                    returnedPesee?.prestation ||
                    prestation;

                const returnedPrestationCamion =
                    data?.prestationCamion ||
                    data?.prestation_camion ||
                    returnedPesee?.prestationCamion ||
                    returnedPesee?.prestation_camion ||
                    prestationCamion;

                // ------------------------------------------------
                // STOCKAGE
                // ------------------------------------------------

                setPesee(
                    returnedPesee
                );

                setTicket(
                    returnedTicket
                );

                setPrestation(
                    returnedPrestation
                );

                setPrestationCamion(
                    returnedPrestationCamion
                );

                setPoidsBrut(
                    grossWeight
                );

                setPoidsNet(
                    netWeight
                );

                setResultat(
                    data
                );

                setSuccess(
                    data?.message ||
                    "Pesée de sortie enregistrée avec succès."
                );

                setError("");

                setStep(
                    "termine"
                );

                return {
                    success: true,
                    pesee:
                        returnedPesee,
                    ticket:
                        returnedTicket,
                    data,
                };

            } catch (err) {

                console.error(
                    "[SORTIE] Erreur validation :",
                    err
                );

                const errorMessage =
                    err?.message ||
                    "Impossible d'enregistrer la pesée de sortie.";

                setError(
                    errorMessage
                );

                setSuccess("");

                return {
                    success: false,
                    error:
                        errorMessage,
                };

            } finally {

                setValidationLoading(
                    false
                );
            }
        };

    // ========================================================
    // RESET
    // ========================================================

    const resetProcess = () => {

        setStep(
            "chargement"
        );

        setPesee(null);
        setTicket(null);

        setPrestation(null);
        setPrestationCamion(null);

        setMatriculeTracteur("");
        setMatriculeRemorque("");

        setMatriculeTracteurVerifie(
            false
        );

        setMatriculeRemorqueVerifie(
            false
        );

        setPoids(0);
        setStatutPoids("STABLE");

        setPoidsBrut(null);
        setPoidsNet(null);

        setResultat(null);

        setError("");
        setSuccess("");

        loadPesee();
    };

    // ========================================================
    // RETOUR DASHBOARD
    // ========================================================

    const handleRetourDashboard =
        () => {

            if (
                typeof onRetourDashboard ===
                "function"
            ) {

                onRetourDashboard();

                return;
            }

            if (
                window.history.length >
                1
            ) {

                window.history.back();
            }
        };

    // ========================================================
    // ETAPE
    // ========================================================

    const currentStepNumber =
        step === "matricules"
            ? 1
            : step === "poids"
                ? 2
                : step === "termine"
                    ? 3
                    : 1;

    // ========================================================
    // CHARGEMENT
    // ========================================================

    if (
        loading ||
        step === "chargement"
    ) {

        return (
            <div className="w-full min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">

                <div className="w-full bg-white border border-slate-200 rounded-2xl p-8">

                    <div className="flex items-center gap-3">

                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">

                            <Weight
                                size={21}
                                className="text-slate-700"
                            />

                        </div>

                        <div>

                            <p className="font-bold text-slate-900">
                                Chargement de la pesée
                            </p>

                            <p className="text-sm text-slate-500 mt-1">
                                Récupération des informations du camion et de la prestation...
                            </p>

                        </div>

                    </div>

                </div>

            </div>
        );
    }

    // ========================================================
    // ERREUR CHARGEMENT
    // ========================================================

    if (
        step === "erreur"
    ) {

        return (
            <div className="w-full min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">

                <div className="w-full bg-white border border-red-200 rounded-2xl p-8">

                    <div className="flex items-start gap-4">

                        <AlertCircle
                            size={26}
                            className="text-red-600 shrink-0"
                        />

                        <div>

                            <h1 className="text-xl font-black text-slate-900">
                                Impossible de charger la pesée
                            </h1>

                            <p className="text-sm text-red-700 mt-2">
                                {error ||
                                    "Une erreur est survenue."}
                            </p>

                        </div>

                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mt-6">

                        <button
                            type="button"
                            onClick={
                                loadPesee
                            }
                            className="px-5 py-3 rounded-xl bg-slate-900 text-white font-semibold flex items-center justify-center gap-2 hover:bg-slate-800"
                        >

                            <RotateCcw
                                size={18}
                            />

                            Réessayer

                        </button>

                        <button
                            type="button"
                            onClick={
                                handleRetourDashboard
                            }
                            className="px-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold flex items-center justify-center gap-2 hover:bg-slate-50"
                        >

                            <LayoutDashboard
                                size={18}
                            />

                            Retour au dashboard

                        </button>

                    </div>

                </div>

            </div>
        );
    }

    // ========================================================
    // RENDER
    // ========================================================

    return (
        <div className="w-full min-h-screen bg-slate-50 p-2 sm:p-4 lg:p-6">

            <div className="w-full">

                {/* ====================================================
                    HEADER
                ==================================================== */}

                <div className="mb-5 w-full">

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                        <div>

                            <p className="text-sm font-semibold text-slate-500">
                                MIZAN · PONT-BASCULE
                            </p>

                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">
                                Pesée de sortie
                            </h1>

                            <p className="text-sm text-slate-500 mt-1">
                                Vérification du camion et enregistrement du poids brut
                            </p>

                        </div>

                        <div className="flex flex-wrap gap-3">

                            <button
                                type="button"
                                onClick={
                                    resetProcess
                                }
                                disabled={
                                    validationLoading
                                }
                                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 flex items-center justify-center gap-2 disabled:opacity-50"
                            >

                                <RotateCcw
                                    size={17}
                                />

                                Réinitialiser

                            </button>

                        </div>

                    </div>

                    {/* =================================================
                        STEPPER
                    ================================================= */}

                    <div className="mt-5 grid grid-cols-3 gap-2">

                        <Step
                            number="1"
                            title="Vérification"
                            active={
                                currentStepNumber ===
                                1
                            }
                            completed={
                                currentStepNumber >
                                1
                            }
                        />

                        <Step
                            number="2"
                            title="Poids brut"
                            active={
                                currentStepNumber ===
                                2
                            }
                            completed={
                                currentStepNumber >
                                2
                            }
                        />

                        <Step
                            number="3"
                            title="Ticket"
                            active={
                                currentStepNumber ===
                                3
                            }
                            completed={false}
                        />

                    </div>

                </div>

                {/* ====================================================
                    ERROR
                ==================================================== */}

                {error && (

                    <div className="mb-5 w-full rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">

                        <AlertCircle
                            size={20}
                            className="text-red-600 shrink-0 mt-0.5"
                        />

                        <p className="text-sm text-red-700 font-medium">
                            {error}
                        </p>

                    </div>
                )}

                {/* ====================================================
                    SUCCESS
                ==================================================== */}

                {success && (

                    <div className="mb-5 w-full rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">

                        <CheckCircle2
                            size={20}
                            className="text-emerald-600 shrink-0 mt-0.5"
                        />

                        <p className="text-sm text-emerald-700 font-medium">
                            {success}
                        </p>

                    </div>
                )}

                {/* ====================================================
                    ETAPE 1
                ==================================================== */}

                {step === "matricules" && (

                    <div className="w-full">

                        {/* --------------------------------------------
                            INFORMATIONS ENTREE
                        --------------------------------------------- */}

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">

                            <Info
                                label="Ticket"
                                value={
                                    ticket?.numero_ticket ||
                                    pesee?.ticket?.numero_ticket ||
                                    "—"
                                }
                            />

                            <Info
                                label="Tare"
                                value={
                                    tare !== null
                                        ? `${formatNumber(
                                            tare,
                                            2
                                        )} kg`
                                        : "—"
                                }
                            />

                            <Info
                                label="Prestation"
                                value={
                                    prestation?.numero_prestation ||
                                    prestation?.numero ||
                                    (
                                        prestationId
                                            ? `#${prestationId}`
                                            : "—"
                                    )
                                }
                            />

                            <Info
                                label="Camion"
                                value={
                                    pesee?.camion_id
                                        ? `#${pesee.camion_id}`
                                        : "—"
                                }
                            />

                        </div>

                        {/* --------------------------------------------
                            PRESTATION CAMION
                        --------------------------------------------- */}

                        {prestationCamion && (

                            <div className="mb-5 w-full bg-white border border-slate-200 rounded-2xl p-5">

                                <div className="flex items-center gap-3">

                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">

                                        <ClipboardCheck
                                            size={21}
                                            className="text-slate-700"
                                        />

                                    </div>

                                    <div>

                                        <p className="font-bold text-slate-900">
                                            Affectation du camion
                                        </p>

                                        <p className="text-sm text-slate-500">
                                            Contrôle de la quantité affectée avant la sortie.
                                        </p>

                                    </div>

                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">

                                    <Info
                                        label="Quantité prévue"
                                        value={
                                            quantitePrevueCamion !==
                                                null
                                                ? `${formatNumber(
                                                    quantitePrevueCamion
                                                )} ${unitePrestation}`
                                                : "—"
                                        }
                                    />

                                    <Info
                                        label="Déjà réalisée"
                                        value={
                                            `${formatNumber(
                                                quantiteRealiseeCamion
                                            )} ${unitePrestation}`
                                        }
                                    />

                                    <Info
                                        label="Quantité restante"
                                        value={
                                            quantiteRestanteCamion !==
                                                null
                                                ? `${formatNumber(
                                                    quantiteRestanteCamion
                                                )} ${unitePrestation}`
                                                : "—"
                                        }
                                    />

                                </div>

                            </div>
                        )}

                        {/* --------------------------------------------
                            VERIFICATION MATRICULES
                        --------------------------------------------- */}

                        <div className="w-full bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">

                            <div className="flex items-center gap-3 mb-5">

                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">

                                    <ShieldCheck
                                        size={21}
                                        className="text-slate-700"
                                    />

                                </div>

                                <div>

                                    <p className="font-bold text-slate-900">
                                        Vérification du véhicule
                                    </p>

                                    <p className="text-sm text-slate-500">
                                        Les matricules doivent correspondre à ceux enregistrés à l'entrée.
                                    </p>

                                </div>

                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                                <InputMatricule
                                    label="Matricule tracteur"
                                    type="tracteur"
                                    value={
                                        matriculeTracteur
                                    }
                                    onChange={(value) => {

                                        setMatriculeTracteur(
                                            value
                                        );

                                        setMatriculeTracteurVerifie(
                                            false
                                        );

                                        setError("");
                                    }}
                                    onDetected={(
                                        value
                                    ) => {

                                        setMatriculeTracteur(
                                            value
                                        );

                                        setMatriculeTracteurVerifie(
                                            false
                                        );

                                        setError("");
                                    }}
                                />

                                <InputMatricule
                                    label="Matricule remorque"
                                    type="remorque"
                                    value={
                                        matriculeRemorque
                                    }
                                    onChange={(value) => {

                                        setMatriculeRemorque(
                                            value
                                        );

                                        setMatriculeRemorqueVerifie(
                                            false
                                        );

                                        setError("");
                                    }}
                                    onDetected={(
                                        value
                                    ) => {

                                        setMatriculeRemorque(
                                            value
                                        );

                                        setMatriculeRemorqueVerifie(
                                            false
                                        );

                                        setError("");
                                    }}
                                />

                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">

                                <VerificationCard
                                    label="Tracteur"
                                    expected={
                                        matriculeEntreeTracteur
                                    }
                                    current={
                                        matriculeTracteur
                                    }
                                    verified={
                                        matriculeTracteurVerifie
                                    }
                                />

                                <VerificationCard
                                    label="Remorque"
                                    expected={
                                        matriculeEntreeRemorque ||
                                        "Aucune remorque à l'entrée"
                                    }
                                    current={
                                        matriculeRemorque ||
                                        "—"
                                    }
                                    verified={
                                        matriculeRemorqueVerifie
                                    }
                                />

                            </div>

                            <button
                                type="button"
                                onClick={
                                    continueFromMatricules
                                }
                                className="mt-6 w-full py-3.5 rounded-xl bg-slate-900 text-white font-semibold flex items-center justify-center gap-2 hover:bg-slate-800"
                            >

                                Vérifier et continuer

                                <ArrowRight
                                    size={18}
                                />

                            </button>

                        </div>

                    </div>
                )}

                {/* ====================================================
                    ETAPE 2 — POIDS
                ==================================================== */}

                {step === "poids" && (

                    <div className="w-full">

                        {/* --------------------------------------------
                            RESUME
                        --------------------------------------------- */}

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">

                            <Info
                                label="Tracteur"
                                value={
                                    matriculeTracteur
                                }
                            />

                            <Info
                                label="Remorque"
                                value={
                                    matriculeRemorque ||
                                    "Aucune"
                                }
                            />

                            <Info
                                label="Tare"
                                value={
                                    tare !== null
                                        ? `${formatNumber(
                                            tare,
                                            2
                                        )} kg`
                                        : "—"
                                }
                            />

                            <Info
                                label="Quantité attendue"
                                value={
                                    quantiteRestanteCamion !==
                                        null
                                        ? `${formatNumber(
                                            quantiteRestanteCamion
                                        )} ${unitePrestation}`
                                        : "Contrôle backend"
                                }
                            />

                        </div>

                        {/* --------------------------------------------
                            CONTROLE TOLERANCE
                        --------------------------------------------- */}

                        {quantiteRestanteCamion !==
                            null && (

                                <div className="mb-5 w-full bg-white border border-slate-200 rounded-2xl p-5">

                                    <div className="flex items-center gap-3 mb-4">

                                        <Package
                                            size={21}
                                            className="text-slate-700"
                                        />

                                        <div>

                                            <p className="font-bold text-slate-900">
                                                Contrôle de quantité
                                            </p>

                                            <p className="text-sm text-slate-500">
                                                Tolérance autorisée : ±5 %
                                            </p>

                                        </div>

                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                        <Info
                                            label="Minimum accepté"
                                            value={
                                                `${formatNumber(
                                                    quantiteMin
                                                )} ${unitePrestation}`
                                            }
                                        />

                                        <Info
                                            label="Quantité attendue"
                                            value={
                                                `${formatNumber(
                                                    quantiteRestanteCamion
                                                )} ${unitePrestation}`
                                            }
                                        />

                                        <Info
                                            label="Maximum accepté"
                                            value={
                                                `${formatNumber(
                                                    quantiteMax
                                                )} ${unitePrestation}`
                                            }
                                        />

                                    </div>

                                </div>
                            )}

                        {/* --------------------------------------------
                            PESAGE
                        --------------------------------------------- */}

                        <WeighingIQDesign
                            mode="exit"
                            poids={
                                poids
                            }
                            statut={
                                statutPoids
                            }
                            poidsTare={
                                tare
                            }
                            validated={
                                false
                            }
                            validating={
                                validationLoading
                            }
                            onValidate={
                                validateSortie
                            }
                        />

                        {/* --------------------------------------------
                            APERCU NET
                        --------------------------------------------- */}

                        {poids > 0 &&
                            tare !== null && (

                                <div className="mt-5 w-full bg-white border border-slate-200 rounded-2xl p-5">

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                        <Info
                                            label="Poids brut actuel"
                                            value={
                                                `${formatNumber(
                                                    poids,
                                                    2
                                                )} kg`
                                            }
                                        />

                                        <Info
                                            label="Tare"
                                            value={
                                                `${formatNumber(
                                                    tare,
                                                    2
                                                )} kg`
                                            }
                                        />

                                        <Info
                                            label="Net estimé"
                                            value={
                                                poids >
                                                    tare
                                                    ? `${formatNumber(
                                                        poids -
                                                        tare,
                                                        2
                                                    )} kg`
                                                    : "—"
                                            }
                                        />

                                    </div>

                                    {poids >
                                        tare && (

                                            <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-4">

                                                <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                                                    Quantité estimée dans l'unité de la prestation
                                                </p>

                                                <p className="text-2xl font-black text-slate-900 mt-1">

                                                    {formatNumber(
                                                        convertKgToUnit(
                                                            poids -
                                                            tare,
                                                            unitePrestation
                                                        )
                                                    )}{" "}
                                                    {unitePrestation}

                                                </p>

                                            </div>
                                        )}

                                </div>
                            )}

                    </div>
                )}

                {/* ====================================================
                    ETAPE 3 — TERMINE
                ==================================================== */}

                {step === "termine" && (

                    <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

                        <div className="p-8 text-center">

                            <div className="w-20 h-20 rounded-full bg-emerald-100 mx-auto flex items-center justify-center">

                                <CheckCircle2
                                    size={42}
                                    className="text-emerald-600"
                                />

                            </div>

                            <h2 className="text-2xl font-black text-slate-900 mt-5">
                                Pesée de sortie terminée
                            </h2>

                            <p className="text-slate-500 mt-2">
                                Le poids brut a été enregistré et la quantité réelle a été affectée à la prestation.
                            </p>

                        </div>

                        <div className="border-t border-slate-200 p-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

                                <Info
                                    label="Ticket"
                                    value={
                                        ticket?.numero_ticket ||
                                        pesee?.ticket?.numero_ticket ||
                                        "—"
                                    }
                                />

                                <Info
                                    label="Tracteur"
                                    value={
                                        matriculeTracteur
                                    }
                                />

                                <Info
                                    label="Tare"
                                    value={
                                        tare !== null
                                            ? `${formatNumber(
                                                tare,
                                                2
                                            )} kg`
                                            : "—"
                                    }
                                />

                                <Info
                                    label="Poids brut"
                                    value={
                                        poidsBrut !== null
                                            ? `${formatNumber(
                                                poidsBrut,
                                                2
                                            )} kg`
                                            : "—"
                                    }
                                />

                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">

                                <Info
                                    label="Poids net"
                                    value={
                                        poidsNet !== null
                                            ? `${formatNumber(
                                                poidsNet,
                                                2
                                            )} kg`
                                            : "—"
                                    }
                                />

                                <Info
                                    label="Quantité réalisée"
                                    value={
                                        quantiteActuelle !==
                                            null
                                            ? `${formatNumber(
                                                quantiteActuelle
                                            )} ${unitePrestation}`
                                            : "—"
                                    }
                                />

                                <Info
                                    label="Unité"
                                    value={
                                        unitePrestation
                                    }
                                />

                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">

                                <Info
                                    label="Prestation"
                                    value={
                                        prestation?.numero_prestation ||
                                        prestation?.numero ||
                                        (
                                            prestationId
                                                ? `#${prestationId}`
                                                : "—"
                                        )
                                    }
                                />

                                <Info
                                    label="Quantité restante globale"
                                    value={
                                        resultat
                                            ?.quantite_restante !==
                                            undefined &&
                                            resultat
                                                ?.quantite_restante !==
                                            null
                                            ? `${formatNumber(
                                                resultat.quantite_restante
                                            )} ${unitePrestation}`
                                            : "Mise à jour effectuée"
                                    }
                                />

                            </div>

                            <div className="mt-6 flex flex-col md:flex-row gap-3">

                                <button
                                    type="button"
                                    onClick={
                                        resetProcess
                                    }
                                    className="flex-1 py-3.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 flex items-center justify-center gap-2"
                                >

                                    <RotateCcw
                                        size={18}
                                    />

                                    Nouvelle pesée

                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        handleRetourDashboard
                                    }
                                    className="flex-1 py-3.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 flex items-center justify-center gap-2"
                                >

                                    <LayoutDashboard
                                        size={18}
                                    />

                                    Retour au dashboard

                                </button>

                                <button
                                    type="button"
                                    onClick={() => {

                                        const id =
                                            pesee?.id ||
                                            peseeId;

                                        if (!id) {

                                            setError(
                                                "Impossible d'imprimer : identifiant de pesée introuvable."
                                            );

                                            return;
                                        }

                                        window.open(
                                            `${API_URL}/tickets/pesee/${id}/pdf`,
                                            "_blank"
                                        );

                                    }}
                                    className="flex-1 py-3.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 flex items-center justify-center gap-2"
                                >

                                    <Printer
                                        size={18}
                                    />

                                    Imprimer le ticket

                                </button>

                            </div>

                        </div>

                    </div>
                )}

            </div>

        </div>
    );
}

// ============================================================
// INFO
// ============================================================

function Info({
    label,
    value,
}) {

    return (
        <div className="w-full rounded-xl border border-slate-200 bg-white p-4">

            <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                {label}
            </p>

            <p className="mt-1 font-bold text-slate-900 break-words">
                {value || "—"}
            </p>

        </div>
    );
}

// ============================================================
// VERIFICATION CARD
// ============================================================

function VerificationCard({
    label,
    expected,
    current,
    verified,
}) {

    return (
        <div
            className={`rounded-xl border p-4 ${verified
                ? "border-emerald-200 bg-emerald-50"
                : "border-slate-200 bg-slate-50"
                }`}
        >

            <div className="flex items-center justify-between gap-3">

                <div>

                    <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                        {label}
                    </p>

                    <p className="font-bold text-slate-900 mt-1">
                        {current || "—"}
                    </p>

                </div>

                {verified && (

                    <CheckCircle2
                        size={23}
                        className="text-emerald-600 shrink-0"
                    />
                )}

            </div>

            <div className="mt-3 pt-3 border-t border-slate-200">

                <p className="text-xs text-slate-400">
                    Valeur enregistrée à l'entrée
                </p>

                <p className="text-sm font-semibold text-slate-700 mt-1">
                    {expected || "—"}
                </p>

            </div>

        </div>
    );
}

// ============================================================
// STEP
// ============================================================

function Step({
    number,
    title,
    active,
    completed,
}) {

    return (
        <div
            className={`w-full rounded-xl border p-3 ${active
                ? "border-slate-900 bg-slate-900 text-white"
                : completed
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-slate-200 bg-white"
                }`}
        >

            <div className="flex items-center gap-2">

                <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${active
                        ? "bg-white text-slate-900"
                        : completed
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                >

                    {completed ? (
                        <CheckCircle2
                            size={16}
                        />
                    ) : (
                        number
                    )}

                </div>

                <span
                    className={`text-xs md:text-sm font-semibold truncate ${active
                        ? "text-white"
                        : completed
                            ? "text-emerald-700"
                            : "text-slate-500"
                        }`}
                >
                    {title}
                </span>

            </div>

        </div>
    );
}