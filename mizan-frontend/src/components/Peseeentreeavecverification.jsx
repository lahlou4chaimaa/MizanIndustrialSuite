import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    CheckCircle2,
    AlertCircle,
    Truck,
    Package,
    RotateCcw,
    ArrowRight,
    LayoutDashboard,
} from "lucide-react";

import { Html5Qrcode } from "html5-qrcode";

import InputMatricule from "./InputMatricule";
import DriverVerificationDesign from "./DriverVerificationDesign";
import WeighingIQDesign from "./WeighingIQDesign";
import { socket } from "./socket";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

const QR_READER_ID = "mizan-qr-reader";

// ============================================================
// CONFIGURATION POIDS TARE
// ============================================================

const MIN_TARE_WEIGHT = 11000;
const MAX_TARE_WEIGHT = 16000;

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

export default function PeseeEntreeAvecVerification({
    onRetourDashboard,
} = {}) {

    // ========================================================
    // PRESTATIONS
    // ========================================================

    const [prestations, setPrestations] =
        useState([]);

    const [prestation, setPrestation] =
        useState(null);

    const [prestationId, setPrestationId] =
        useState(null);

    const [loadingPrestations, setLoadingPrestations] =
        useState(false);

    // ========================================================
    // ETAPE
    // ========================================================

    const [step, setStep] =
        useState("matricules");

    // ========================================================
    // MATRICULES
    // ========================================================

    const [matriculeTracteur, setMatriculeTracteur] =
        useState("");

    const [matriculeRemorque, setMatriculeRemorque] =
        useState("");

    const [camionId, setCamionId] =
        useState(null);

    // ========================================================
    // CHAUFFEUR
    // ========================================================

    const [chauffeur, setChauffeur] =
        useState(null);

    const [codeQr, setCodeQr] =
        useState("");

    const [identiteConfirmee, setIdentiteConfirmee] =
        useState(false);

    const [scanningQr, setScanningQr] =
        useState(false);

    const [savingDriver, setSavingDriver] =
        useState(false);

    const qrScannerRef =
        useRef(null);

    // ========================================================
    // MARCHANDISE
    // ========================================================

    const [marchandises, setMarchandises] =
        useState([]);

    const [marchandiseId, setMarchandiseId] =
        useState("");

    const [loadingMarchandises, setLoadingMarchandises] =
        useState(false);

    // ========================================================
    // POIDS
    // ========================================================

    const [poids, setPoids] =
        useState(0);

    const [statutPoids, setStatutPoids] =
        useState("STABLE");

    const [poidsTare, setPoidsTare] =
        useState(null);

    const [tareValidee, setTareValidee] =
        useState(false);

    const [validationTareLoading, setValidationTareLoading] =
        useState(false);

    // ========================================================
    // RESULTAT
    // ========================================================

    const [pesee, setPesee] =
        useState(null);

    const [ticket, setTicket] =
        useState(null);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    // ========================================================
    // CHARGER MARCHANDISES
    // ========================================================

    useEffect(() => {

        const loadMarchandises = async () => {

            try {

                setLoadingMarchandises(true);

                const response =
                    await fetch(
                        `${API_URL}/marchandises`
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data?.error ||
                        data?.message ||
                        "Impossible de charger les marchandises."
                    );
                }

                setMarchandises(
                    data?.marchandises ||
                    data?.data ||
                    []
                );

            } catch (err) {

                console.error(
                    "Erreur marchandises :",
                    err
                );

                setError(
                    err?.message ||
                    "Impossible de charger les marchandises."
                );

            } finally {

                setLoadingMarchandises(false);

            }
        };

        loadMarchandises();

    }, []);

    // ========================================================
    // TROUVER PRESTATION
    // ========================================================

    const findPrestationForCamion = useCallback(
        (
            camionIdRecherche,
            matriculeRecherche,
            listePrestations = prestations
        ) => {

            if (!Array.isArray(listePrestations)) {
                return null;
            }

            const matricule = String(
                matriculeRecherche || ""
            ).trim();

            const numericCamionId =
                camionIdRecherche !== null &&
                    camionIdRecherche !== undefined &&
                    camionIdRecherche !== ""
                    ? Number(camionIdRecherche)
                    : null;

            console.log(
                "[PESÉE] Recherche prestation avec:",
                {
                    camionIdRecherche,
                    numericCamionId,
                    matricule,
                    nombrePrestations:
                        listePrestations.length,
                }
            );

            let found = null;

            if (
                numericCamionId !== null &&
                Number.isFinite(numericCamionId)
            ) {

                found = listePrestations.find((item) => {

                    const prestationCamionId =
                        item?.camion_id ??
                        item?.camionId ??
                        item?.camion?.id ??
                        item?.camion?.camion_id ??
                        null;

                    return (
                        Number(prestationCamionId) ===
                        numericCamionId
                    );
                });
            }

            if (!found && matricule) {

                found = listePrestations.find((item) => {

                    const possiblePlates = [
                        item?.matriculeTracteur,
                        item?.matricule_tracteur,
                        item?.immatriculation,
                        item?.immatriculation_tracteur,
                        item?.matricule,
                        item?.camion?.matricule,
                        item?.camion?.immatriculation,
                        item?.camion?.matricule_tracteur,
                        item?.camion?.immatriculation_tracteur,
                    ].filter(Boolean);

                    const matched =
                        possiblePlates.some(
                            (plate) =>
                                platesMatch(
                                    matricule,
                                    plate
                                )
                        );

                    if (matched) {

                        console.log(
                            "[PESÉE] Prestation trouvée par matricule:",
                            {
                                prestationId:
                                    item?.id,
                                matriculeRecherche:
                                    matricule,
                                possiblePlates,
                            }
                        );
                    }

                    return matched;
                });
            }

            if (found) {

                const foundId =
                    found.id ??
                    found.prestation_id ??
                    found.prestationId ??
                    null;

                const foundCamionId =
                    found.camion_id ??
                    found.camionId ??
                    found.camion?.id ??
                    null;

                console.log(
                    "[PESÉE] PRESTATION ASSOCIÉE:",
                    {
                        id: foundId,
                        camion_id: foundCamionId,
                        numero:
                            found.numero_prestation,
                        statut: found.statut,
                    }
                );

                setPrestation(found);
                setPrestationId(foundId);

                if (foundCamionId) {
                    setCamionId(foundCamionId);
                }

                return found;
            }

            console.warn(
                "[PESÉE] Aucune prestation trouvée.",
                {
                    camionIdRecherche,
                    matriculeRecherche,
                    prestations: listePrestations,
                }
            );

            return null;
        },
        [prestations]
    );

    // ========================================================
    // RESOLUTION AUTOMATIQUE
    // ========================================================

    useEffect(() => {

        if (!prestations.length) {
            return;
        }

        if (
            !camionId &&
            !matriculeTracteur.trim()
        ) {
            return;
        }

        findPrestationForCamion(
            camionId,
            matriculeTracteur,
            prestations
        );

    }, [
        prestations,
        camionId,
        matriculeTracteur,
        findPrestationForCamion,
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
                    Number(data.poids);

                if (
                    !Number.isFinite(value)
                ) {
                    return;
                }

                setPoids(value);

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
    // STOP QR
    // ========================================================

    const stopQrScanner =
        useCallback(
            async () => {

                if (
                    !qrScannerRef.current
                ) {

                    setScanningQr(false);

                    return;
                }

                const scanner =
                    qrScannerRef.current;

                try {

                    const state =
                        scanner.getState();

                    if (
                        state !== undefined &&
                        state !== 1
                    ) {

                        await scanner.stop();
                    }

                } catch (err) {

                    console.warn(
                        "[QR] Erreur arrêt :",
                        err
                    );
                }

                try {

                    await scanner.clear();

                } catch (err) {

                    console.warn(
                        "[QR] Erreur clear :",
                        err
                    );
                }

                qrScannerRef.current = null;

                setScanningQr(false);

            },
            []
        );

    useEffect(() => {

        return () => {
            stopQrScanner();
        };

    }, [stopQrScanner]);

    // ========================================================
    // QR DETECTE
    // ========================================================

    const handleQrDetected =
        useCallback(
            async (decodedText) => {

                const qr =
                    String(
                        decodedText || ""
                    ).trim();

                if (!qr) {
                    return;
                }

                await stopQrScanner();

                setCodeQr(qr);
                setError("");

                try {

                    const response =
                        await fetch(
                            `${API_URL}/chauffeurs/qr/${encodeURIComponent(
                                qr
                            )}`
                        );

                    const data =
                        await response.json();

                    if (
                        response.ok &&
                        data?.chauffeur
                    ) {

                        setChauffeur(
                            data.chauffeur
                        );

                        setStep(
                            "chauffeur-verify"
                        );

                        return;
                    }

                    if (
                        response.status === 404
                    ) {

                        setChauffeur(null);

                        setStep(
                            "chauffeur-enroll"
                        );

                        return;
                    }

                    throw new Error(
                        data?.error ||
                        data?.message ||
                        "Erreur lors de la recherche du chauffeur."
                    );

                } catch (err) {

                    console.error(
                        "[QR] Recherche chauffeur :",
                        err
                    );

                    setError(
                        err?.message ||
                        "Erreur lors de la recherche du chauffeur."
                    );
                }

            },
            [stopQrScanner]
        );

    // ========================================================
    // START QR
    // ========================================================

    const startQrScanner =
        async () => {

            try {

                setError("");
                setScanningQr(true);

                await stopQrScanner();

                const scanner =
                    new Html5Qrcode(
                        QR_READER_ID
                    );

                qrScannerRef.current =
                    scanner;

                await scanner.start(
                    {
                        facingMode:
                            "environment",
                    },
                    {
                        fps: 10,
                        qrbox: {
                            width: 250,
                            height: 250,
                        },
                    },
                    handleQrDetected,
                    () => { }
                );

            } catch (err) {

                console.error(
                    "[QR] Erreur scanner :",
                    err
                );

                qrScannerRef.current =
                    null;

                setScanningQr(false);

                setError(
                    "Impossible d'activer le scanner QR. Vérifiez l'autorisation caméra."
                );
            }
        };

    // ========================================================
    // ENREGISTRER NOUVEAU CHAUFFEUR
    // ========================================================

    const saveNewDriver =
        async ({
            nom,
            prenom,
            cin,
            code_qr,
            photo,
        }) => {

            try {

                setSavingDriver(true);
                setError("");

                const response =
                    await fetch(
                        `${API_URL}/chauffeurs/enregistrer-avec-qr`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",
                            },

                            body: JSON.stringify({
                                nom,
                                prenom,
                                cin,
                                code_qr,
                            }),
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    throw new Error(
                        data?.message ||
                        data?.error ||
                        "Impossible d'enregistrer le chauffeur."
                    );
                }

                let newDriver =
                    data?.chauffeur;

                if (
                    photo &&
                    photo.startsWith(
                        "data:image/"
                    ) &&
                    newDriver?.id
                ) {

                    try {

                        const blob =
                            await dataUrlToBlob(
                                photo
                            );

                        const formData =
                            new FormData();

                        formData.append(
                            "photo",
                            blob,
                            "photo-reference.jpg"
                        );

                        const photoResponse =
                            await fetch(
                                `${API_URL}/chauffeurs/${newDriver.id}/photo-reference`,
                                {
                                    method: "POST",
                                    body: formData,
                                }
                            );

                        const photoData =
                            await photoResponse.json();

                        if (
                            photoResponse.ok &&
                            photoData?.chauffeur
                        ) {

                            newDriver =
                                photoData.chauffeur;
                        }

                    } catch (photoError) {

                        console.error(
                            "[CHAUFFEUR] Erreur photo :",
                            photoError
                        );
                    }
                }

                setChauffeur(
                    newDriver
                );

                setIdentiteConfirmee(
                    true
                );

                setSuccess(
                    "Chauffeur enregistré avec succès."
                );

                setStep(
                    "poids"
                );

            } catch (err) {

                console.error(
                    "[CHAUFFEUR] Erreur création :",
                    err
                );

                setError(
                    err?.message ||
                    "Impossible d'enregistrer le chauffeur."
                );

            } finally {

                setSavingDriver(false);
            }
        };

    // ========================================================
    // CONFIRMER CHAUFFEUR
    // ========================================================

    const confirmDriver = () => {

        setIdentiteConfirmee(true);
        setError("");
        setStep("poids");
    };

    // ========================================================
    // REFUSER CHAUFFEUR
    // ========================================================

    const rejectDriver = () => {

        setIdentiteConfirmee(false);
        setChauffeur(null);
        setCodeQr("");

        setError(
            "L'identité du chauffeur n'a pas été confirmée."
        );

        setStep("chauffeur-scan");
    };

    // ========================================================
    // VALIDATION TARE
    // ========================================================

    const validateTare = async (currentWeight) => {

        /*
         * IMPORTANT :
         * Le bouton de validation peut être utilisé pendant
         * STABLE ou INSTABLE.
         *
         * Le statut du pont-bascule est uniquement informatif.
         * La seule condition liée au poids est la plage :
         *
         * 11 000 kg <= TARE <= 16 000 kg
         */

        const weight =
            Number(currentWeight);

        if (
            !Number.isFinite(weight) ||
            weight <= 0
        ) {

            const message =
                "Le poids de tare est invalide.";

            setError(message);

            return {
                success: false,
                error: message,
            };
        }

        // ====================================================
        // CONTROLE PLAGE TARE
        // 11 000 kg <= TARE <= 16 000 kg
        // ====================================================

        if (weight < MIN_TARE_WEIGHT) {

            const message =
                `Le poids de tare est inférieur à la limite autorisée. La tare doit être comprise entre ${MIN_TARE_WEIGHT.toLocaleString("fr-FR")} kg et ${MAX_TARE_WEIGHT.toLocaleString("fr-FR")} kg.`;

            setError(message);

            return {
                success: false,
                error: message,
            };
        }

        if (weight > MAX_TARE_WEIGHT) {

            const message =
                `Le poids de tare dépasse la limite autorisée. La tare doit être comprise entre ${MIN_TARE_WEIGHT.toLocaleString("fr-FR")} kg et ${MAX_TARE_WEIGHT.toLocaleString("fr-FR")} kg.`;

            setError(message);

            return {
                success: false,
                error: message,
            };
        }

        /*
         * PAS DE CONTROLE :
         *
         * statutPoids === "STABLE"
         *
         * Le poids peut donc être validé pendant la montée,
         * par exemple :
         *
         * 11 250 kg INSTABLE
         * 12 341 kg INSTABLE
         * 14 875 kg INSTABLE
         * 15 876 kg INSTABLE
         *
         * tant qu'il reste entre 11 000 et 16 000 kg.
         */

        if (!matriculeTracteur.trim()) {

            const message =
                "Le matricule du tracteur est obligatoire.";

            setError(message);

            return {
                success: false,
                error: message,
            };
        }

        if (!marchandiseId) {

            const message =
                "Veuillez sélectionner une marchandise.";

            setError(message);

            return {
                success: false,
                error: message,
            };
        }

        setError("");
        setSuccess("");
        setValidationTareLoading(true);

        try {

            const token =
                localStorage.getItem("token");

            const formData =
                new FormData();

            formData.append(
                "matriculeTracteur",
                matriculeTracteur.trim()
            );

            formData.append(
                "matriculeRemorque",
                matriculeRemorque?.trim() || ""
            );

            formData.append(
                "poidsEntree",
                String(weight)
            );

            formData.append(
                "codeQr",
                codeQr?.trim() ||
                chauffeur?.code_qr ||
                ""
            );

            formData.append(
                "identite_confirmee",
                String(
                    Boolean(
                        identiteConfirmee
                    )
                )
            );

            if (chauffeur?.id) {

                formData.append(
                    "chauffeur_id",
                    String(
                        chauffeur.id
                    )
                );
            }

            if (marchandiseId) {

                formData.append(
                    "marchandise_id",
                    String(
                        Number(
                            marchandiseId
                        )
                    )
                );
            }

            console.log(
                "[PESEE] Envoi tare :",
                {
                    matriculeTracteur:
                        matriculeTracteur.trim(),
                    matriculeRemorque:
                        matriculeRemorque?.trim() || "",
                    poidsEntree:
                        weight,
                    statut:
                        statutPoids,
                    chauffeur_id:
                        chauffeur?.id || null,
                    marchandise_id:
                        Number(marchandiseId),
                }
            );

            const response =
                await fetch(
                    `${API_URL}/pesee/entree`,
                    {
                        method: "POST",

                        headers: {
                            ...(token
                                ? {
                                    Authorization:
                                        `Bearer ${token}`,
                                }
                                : {}),
                        },

                        body: formData,
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
                "[PESEE] Réponse serveur :",
                {
                    status:
                        response.status,
                    ok:
                        response.ok,
                    data,
                }
            );

            if (!response.ok) {

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
                data?.pesee ||
                data?.data?.pesee ||
                null;

            const returnedTicket =
                data?.ticket ||
                data?.data?.ticket ||
                returnedPesee?.ticket ||
                null;

            console.log(
                "[PESEE] Pesée retournée :",
                returnedPesee
            );

            console.log(
                "[PESEE] Ticket retourné :",
                returnedTicket
            );

            if (!returnedPesee) {

                throw new Error(
                    "Le serveur a répondu avec succès, mais aucune pesée n'a été retournée."
                );
            }

            if (!returnedTicket) {

                throw new Error(
                    "Le serveur a enregistré la pesée, mais aucun ticket n'a été retourné."
                );
            }

            setPesee(
                returnedPesee
            );

            setTicket(
                returnedTicket
            );

            setPoidsTare(
                weight
            );

            setTareValidee(
                true
            );

            setError("");

            setSuccess(
                data?.message ||
                "Pesée d'entrée enregistrée avec succès."
            );

            setStep(
                "termine"
            );

            console.log(
                "[PESEE] TARE VALIDEE"
            );

            console.log(
                "[PESEE] Passage automatique vers le ticket."
            );

            return {
                success: true,
                pesee: returnedPesee,
                ticket: returnedTicket,
                data,
            };

        } catch (err) {

            console.error(
                "[PESEE] Erreur validation tare :",
                err
            );

            const errorMessage =
                err?.message ||
                "Impossible d'enregistrer la pesée.";

            setError(
                errorMessage
            );

            setSuccess("");

            return {
                success: false,
                error: errorMessage,
            };

        } finally {

            setValidationTareLoading(
                false
            );
        }
    };

    // ========================================================
    // RESET
    // ========================================================

    const resetProcess = async () => {

        await stopQrScanner();

        setStep(
            "matricules"
        );

        setMatriculeTracteur("");
        setMatriculeRemorque("");
        setCamionId(null);

        setPrestation(null);
        setPrestationId(null);

        setChauffeur(null);
        setCodeQr("");
        setIdentiteConfirmee(false);

        setPoids(0);
        setStatutPoids("STABLE");

        setPoidsTare(null);
        setTareValidee(false);

        setPesee(null);
        setTicket(null);

        setMarchandiseId("");

        setError("");
        setSuccess("");
    };

    // ========================================================
    // RETOUR DASHBOARD
    // ========================================================

    const handleRetourDashboard =
        async () => {

            await stopQrScanner();

            if (
                typeof onRetourDashboard ===
                "function"
            ) {

                onRetourDashboard();
            }
        };

    // ========================================================
    // CONTINUER MATRICULES
    // ========================================================

    const continueFromMatricules =
        async () => {

            setError("");
            setSuccess("");

            const matricule =
                String(
                    matriculeTracteur ||
                    ""
                ).trim();

            if (!matricule) {

                setError(
                    "Veuillez renseigner le matricule du tracteur."
                );

                return;
            }

            setStep(
                "chauffeur-scan"
            );
        };

    // ========================================================
    // ETAPE COURANTE
    // ========================================================

    const currentStepNumber =
        step === "matricules"
            ? 1
            : step.startsWith("chauffeur")
                ? 2
                : step === "poids"
                    ? 3
                    : 4;

    return (
        <div className="min-h-screen w-full bg-slate-100 text-slate-900">

            {/* ====================================================
                TOP BAR
            ==================================================== */}

            <div className="w-full border-b border-slate-200 bg-white">

                <div className="w-full px-4 py-4 sm:px-6 lg:px-8">

                    <div className="flex w-full flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

                        <div className="flex items-start gap-4">

                            <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                                <Truck size={24} />
                            </div>

                            <div>
                                <div className="flex items-center gap-2">

                                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                                        MIZAN
                                    </span>

                                    <span className="h-1 w-1 rounded-full bg-slate-300" />

                                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Pont-bascule
                                    </span>

                                </div>

                                <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                                    Pesée d'entrée
                                </h1>

                                <p className="mt-1 text-sm text-slate-500">
                                    Enregistrement et validation de la tare du camion
                                </p>
                            </div>

                        </div>

                        <div className="flex flex-wrap items-center gap-2">

                            <div className="hidden lg:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                <span className="text-xs font-semibold text-slate-600">
                                    Poste opérationnel
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    resetProcess
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
                            >
                                <RotateCcw size={17} />
                                Réinitialiser
                            </button>

                        </div>

                    </div>

                </div>

            </div>

            {/* ====================================================
                STEPPER
            ==================================================== */}

            <div className="w-full border-b border-slate-200 bg-white">

                <div className="w-full px-4 py-3 sm:px-6 lg:px-8">

                    <div className="grid w-full grid-cols-4 gap-2">

                        <Step
                            number="1"
                            title="Matricules"
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
                            title="Chauffeur"
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
                            title="Pesée"
                            active={
                                currentStepNumber ===
                                3
                            }
                            completed={
                                currentStepNumber >
                                3
                            }
                        />

                        <Step
                            number="4"
                            title="Ticket"
                            active={
                                currentStepNumber ===
                                4
                            }
                            completed={false}
                        />

                    </div>

                </div>

            </div>

            {/* ====================================================
                MAIN
            ==================================================== */}

            <main className="w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-6">

                <div className="w-full">

                    {/* ====================================================
                        ALERTES
                    ==================================================== */}

                    <div className="space-y-3">

                        {error && (

                            <div className="flex w-full items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 shadow-sm">

                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100">
                                    <AlertCircle
                                        size={18}
                                        className="text-red-600"
                                    />
                                </div>

                                <div className="min-w-0">
                                    <p className="text-xs font-bold uppercase tracking-wide text-red-500">
                                        Attention
                                    </p>

                                    <p className="mt-0.5 text-sm font-semibold text-red-700">
                                        {error}
                                    </p>
                                </div>

                            </div>
                        )}

                        {success && (

                            <div className="flex w-full items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 shadow-sm">

                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                                    <CheckCircle2
                                        size={18}
                                        className="text-emerald-600"
                                    />
                                </div>

                                <div className="min-w-0">
                                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">
                                        Opération réussie
                                    </p>

                                    <p className="mt-0.5 text-sm font-semibold text-emerald-700">
                                        {success}
                                    </p>
                                </div>

                            </div>
                        )}

                    </div>

                    {/* ====================================================
                        ETAPE 1 — MATRICULES
                    ==================================================== */}

                    {step === "matricules" && (

                        <div className="mt-5 w-full">

                            <div className="mb-4 flex items-center justify-between">

                                <div>
                                    <h2 className="text-lg font-black text-slate-900">
                                        Identification du véhicule
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Saisissez ou détectez les matricules du tracteur et de la remorque.
                                    </p>
                                </div>

                                <div className="hidden sm:flex items-center gap-2 rounded-xl bg-slate-200/70 px-3 py-2">
                                    <Truck size={16} className="text-slate-600" />
                                    <span className="text-xs font-bold text-slate-600">
                                        Étape 1 / 4
                                    </span>
                                </div>

                            </div>

                            <div className="grid w-full grid-cols-1 gap-4 xl:grid-cols-2">

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

                                        setError("");
                                    }}
                                    onDetected={(
                                        value,
                                        data
                                    ) => {

                                        const detectedCamionId =
                                            data?.camion_id ??
                                            data?.camion?.id ??
                                            data?.camion?.camion_id ??
                                            null;

                                        setMatriculeTracteur(
                                            value
                                        );

                                        setError("");

                                        if (
                                            detectedCamionId
                                        ) {

                                            setCamionId(
                                                detectedCamionId
                                            );
                                        }
                                    }}
                                />

                                <InputMatricule
                                    type="remorque"
                                    value={
                                        matriculeRemorque
                                    }
                                    onChange={
                                        setMatriculeRemorque
                                    }
                                />

                            </div>

                            <div className="mt-4 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                                <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6">

                                    <div className="flex items-center gap-3">

                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                                            <Truck size={19} />
                                        </div>

                                        <div>
                                            <p className="font-bold text-slate-900">
                                                Vérification du véhicule
                                            </p>

                                            <p className="text-sm text-slate-500">
                                                Vérifiez les matricules avant de poursuivre.
                                            </p>
                                        </div>

                                    </div>

                                </div>

                                <div className="p-5 sm:p-6">

                                    <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2">

                                        <Info
                                            label="Tracteur"
                                            value={
                                                matriculeTracteur
                                            }
                                        />

                                        <Info
                                            label="Remorque"
                                            value={
                                                matriculeRemorque
                                            }
                                        />

                                    </div>

                                    <button
                                        type="button"
                                        onClick={
                                            continueFromMatricules
                                        }
                                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.995]"
                                    >
                                        Continuer vers l'identification du chauffeur
                                        <ArrowRight size={18} />
                                    </button>

                                </div>

                            </div>

                        </div>
                    )}

                    {/* ====================================================
                        ETAPE 2A — SCAN CHAUFFEUR
                    ==================================================== */}

                    {step === "chauffeur-scan" && (

                        <div className="mt-5 w-full">

                            <div className="mb-4 flex items-center justify-between">

                                <div>
                                    <h2 className="text-lg font-black text-slate-900">
                                        Identification du chauffeur
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Scannez le badge QR du chauffeur.
                                    </p>
                                </div>

                                <div className="hidden sm:flex items-center gap-2 rounded-xl bg-slate-200/70 px-3 py-2">
                                    <span className="text-xs font-bold text-slate-600">
                                        Étape 2 / 4
                                    </span>
                                </div>

                            </div>

                            <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">

                                <DriverVerificationDesign
                                    mode="scan"
                                    qrCode={codeQr}
                                    scanning={scanningQr}
                                    onStartScan={
                                        startQrScanner
                                    }
                                />

                                <div className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4">

                                    <div className="mb-3 flex items-center justify-between">

                                        <div>
                                            <p className="text-sm font-bold text-slate-800">
                                                Lecteur QR
                                            </p>

                                            <p className="text-xs text-slate-500">
                                                Caméra du poste de pesée
                                            </p>
                                        </div>

                                        {scanningQr && (
                                            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                Scanner actif
                                            </span>
                                        )}

                                    </div>

                                    <div
                                        id={
                                            QR_READER_ID
                                        }
                                        className="min-h-[120px] w-full overflow-hidden rounded-xl border border-slate-200 bg-white"
                                    />

                                    {scanningQr && (

                                        <p className="mt-3 text-center text-sm font-medium text-slate-500">
                                            Présentez le badge QR devant la caméra...
                                        </p>
                                    )}

                                </div>

                            </div>

                        </div>
                    )}

                    {/* ====================================================
                        ETAPE 2B — NOUVEAU CHAUFFEUR
                    ==================================================== */}

                    {step === "chauffeur-enroll" && (

                        <div className="mt-5 w-full">

                            <div className="mb-4">
                                <h2 className="text-lg font-black text-slate-900">
                                    Enregistrement du chauffeur
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Le badge QR n'est associé à aucun chauffeur existant.
                                </p>
                            </div>

                            <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">

                                <DriverVerificationDesign
                                    mode="enroll"
                                    qrCode={codeQr}
                                    saving={savingDriver}
                                    onSaveNew={
                                        saveNewDriver
                                    }
                                />

                            </div>

                        </div>
                    )}

                    {/* ====================================================
                        ETAPE 2C — VERIFICATION
                    ==================================================== */}

                    {step === "chauffeur-verify" && (

                        <div className="mt-5 w-full">

                            <div className="mb-4">
                                <h2 className="text-lg font-black text-slate-900">
                                    Vérification de l'identité
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Vérifiez les informations affichées avant de confirmer.
                                </p>
                            </div>

                            <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">

                                <DriverVerificationDesign
                                    mode="verify"
                                    chauffeur={chauffeur}
                                    qrCode={codeQr}
                                    onConfirm={
                                        confirmDriver
                                    }
                                    onReject={
                                        rejectDriver
                                    }
                                />

                            </div>

                        </div>
                    )}

                    {/* ====================================================
                        ETAPE 3 — PESEE
                    ==================================================== */}

                    {step === "poids" && (

                        <div className="mt-5 w-full">

                            <div className="mb-4 flex items-center justify-between">

                                <div>
                                    <h2 className="text-lg font-black text-slate-900">
                                        Enregistrement de la tare
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Sélectionnez la marchandise puis contrôlez le poids affiché par le pont-bascule.
                                    </p>
                                </div>

                                <div className="hidden sm:flex items-center gap-2 rounded-xl bg-slate-200/70 px-3 py-2">
                                    <span className="text-xs font-bold text-slate-600">
                                        Étape 3 / 4
                                    </span>
                                </div>

                            </div>

                            {/* MARCHANDISE */}

                            <div className="mb-4 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                                <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6">

                                    <div className="flex items-center gap-3">

                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                                            <Package size={19} />
                                        </div>

                                        <div>
                                            <p className="font-bold text-slate-900">
                                                Marchandise
                                            </p>

                                            <p className="text-sm text-slate-500">
                                                Sélectionnez la marchandise transportée.
                                            </p>
                                        </div>

                                    </div>

                                </div>

                                <div className="p-5 sm:p-6">

                                    <select
                                        value={
                                            marchandiseId
                                        }
                                        onChange={(e) =>
                                            setMarchandiseId(
                                                e.target.value
                                            )
                                        }
                                        disabled={
                                            loadingMarchandises
                                        }
                                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                                    >

                                        <option value="">
                                            Sélectionner une marchandise
                                        </option>

                                        {marchandises.map(
                                            (marchandise) => (

                                                <option
                                                    key={
                                                        marchandise.id
                                                    }
                                                    value={
                                                        marchandise.id
                                                    }
                                                >
                                                    {
                                                        marchandise.nom
                                                    }

                                                    {
                                                        marchandise.code
                                                            ? ` (${marchandise.code})`
                                                            : ""
                                                    }

                                                </option>
                                            )
                                        )}

                                    </select>

                                </div>

                            </div>

                            {/* VEHICULE + CHAUFFEUR */}

                            <div className="mb-4 grid w-full grid-cols-1 gap-3 md:grid-cols-3">

                                <Info
                                    label="Tracteur"
                                    value={
                                        matriculeTracteur
                                    }
                                />

                                <Info
                                    label="Remorque"
                                    value={
                                        matriculeRemorque
                                    }
                                />

                                <Info
                                    label="Chauffeur"
                                    value={
                                        chauffeur
                                            ? `${chauffeur.prenom} ${chauffeur.nom}`
                                            : "—"
                                    }
                                />

                            </div>

                            {/* POIDS */}

                            <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                                <WeighingIQDesign
                                    mode="entry"
                                    poids={poids}
                                    statut={
                                        statutPoids
                                    }
                                    poidsTare={
                                        poidsTare
                                    }
                                    validated={
                                        tareValidee
                                    }
                                    validating={
                                        validationTareLoading
                                    }
                                    onValidate={
                                        validateTare
                                    }
                                />

                            </div>

                        </div>
                    )}

                    {/* ====================================================
                        ETAPE 4 — TICKET
                    ==================================================== */}

                    {step === "termine" && (

                        <div className="mt-5 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                            <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-white px-5 py-8 sm:px-8 lg:px-10">

                                <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left">

                                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-emerald-100 ring-8 ring-emerald-50">

                                        <CheckCircle2
                                            size={42}
                                            className="text-emerald-600"
                                        />

                                    </div>

                                    <div className="mt-5 sm:ml-6 sm:mt-0">

                                        <div className="mb-2 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
                                            Opération terminée
                                        </div>

                                        <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                                            Pesée d'entrée terminée
                                        </h2>

                                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                                            La tare a été enregistrée avec succès. Le camion peut quitter le pont-bascule.
                                        </p>

                                    </div>

                                </div>

                            </div>

                            <div className="w-full p-5 sm:p-6 lg:p-8">

                                <div className="mb-4 flex items-center justify-between">

                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                                            Récapitulatif
                                        </p>

                                        <h3 className="mt-1 text-lg font-black text-slate-900">
                                            Informations de la pesée
                                        </h3>
                                    </div>

                                    <div className="hidden sm:flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                        <span className="text-xs font-bold text-slate-600">
                                            Enregistrée
                                        </span>
                                    </div>

                                </div>

                                <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

                                    <Info
                                        label="Ticket"
                                        value={
                                            ticket?.numero_ticket ||
                                            pesee?.ticket?.numero_ticket ||
                                            "—"
                                        }
                                    />

                                    <Info
                                        label="Prestation"
                                        value="Affectée ultérieurement par le PDA"
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
                                            poidsTare !== null
                                                ? `${Number(
                                                    poidsTare
                                                ).toLocaleString(
                                                    "fr-FR"
                                                )} kg`
                                                : "—"
                                        }
                                    />

                                </div>

                                <div className="mt-3 grid w-full grid-cols-1 gap-3 md:grid-cols-3">

                                    <Info
                                        label="Chauffeur"
                                        value={
                                            chauffeur
                                                ? `${chauffeur.prenom} ${chauffeur.nom}`
                                                : "—"
                                        }
                                    />

                                    <Info
                                        label="CIN"
                                        value={
                                            chauffeur?.cin ||
                                            "—"
                                        }
                                    />

                                    <Info
                                        label="Marchandise"
                                        value={
                                            marchandises.find(
                                                (m) =>
                                                    Number(
                                                        m.id
                                                    ) ===
                                                    Number(
                                                        marchandiseId
                                                    )
                                            )?.nom ||
                                            "—"
                                        }
                                    />

                                </div>

                                <div className="mt-6 grid w-full grid-cols-1 gap-3 md:grid-cols-3">

                                    <button
                                        type="button"
                                        onClick={
                                            resetProcess
                                        }
                                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                                    >
                                        <RotateCcw
                                            size={18}
                                        />
                                        Nouvelle pesée
                                    </button>

                                    {typeof onRetourDashboard ===
                                        "function" && (

                                            <button
                                                type="button"
                                                onClick={
                                                    handleRetourDashboard
                                                }
                                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                                            >

                                                <LayoutDashboard
                                                    size={18}
                                                />

                                                Retour au dashboard

                                            </button>
                                        )}

                                    <button
                                        type="button"
                                        onClick={() => {

                                            const peseeId =
                                                pesee?.id;

                                            if (!peseeId) {

                                                setError(
                                                    "Impossible d'imprimer : l'identifiant de la pesée est introuvable."
                                                );

                                                return;
                                            }

                                            window.open(
                                                `${API_URL}/tickets/pesee/${peseeId}/pdf`,
                                                "_blank"
                                            );
                                        }}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
                                    >
                                        Imprimer le ticket
                                    </button>

                                </div>

                            </div>

                        </div>
                    )}

                </div>

            </main>

        </div>
    );
}

// ============================================================
// DATA URL → BLOB
// ============================================================

async function dataUrlToBlob(dataUrl) {

    const response =
        await fetch(dataUrl);

    return response.blob();
}

// ============================================================
// INFO
// ============================================================

function Info({
    label,
    value,
}) {

    return (
        <div className="group w-full rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm">

            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                {label}
            </p>

            <p className="mt-1.5 break-words text-sm font-black text-slate-900">
                {value || "—"}
            </p>

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
            className={`w-full rounded-xl border px-3 py-2.5 transition sm:px-4 ${active
                ? "border-slate-900 bg-slate-900 shadow-sm"
                : completed
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-slate-200 bg-white"
                }`}
        >

            <div className="flex items-center gap-2.5">

                <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black ${active
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

                <div className="min-w-0">

                    <span
                        className={`block truncate text-xs font-bold sm:text-sm ${active
                            ? "text-white"
                            : completed
                                ? "text-emerald-700"
                                : "text-slate-600"
                            }`}
                    >
                        {title}
                    </span>

                    <span
                        className={`hidden text-[10px] font-medium sm:block ${active
                            ? "text-slate-300"
                            : completed
                                ? "text-emerald-600"
                                : "text-slate-400"
                            }`}
                    >
                        {active
                            ? "En cours"
                            : completed
                                ? "Terminé"
                                : "À venir"}
                    </span>

                </div>

            </div>

        </div>
    );
}