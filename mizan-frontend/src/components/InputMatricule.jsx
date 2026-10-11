import React, {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    Camera,
    RotateCcw,
    CheckCircle2,
    Loader2,
    ScanLine,
    AlertCircle,
    Keyboard,
    Database,
    LayoutDashboard,
    ShieldCheck,
    CircleDot,
} from "lucide-react";

const OCR_SERVICE_URL =
    import.meta.env.VITE_OCR_SERVICE_URL ||
    "http://127.0.0.1:8000";

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

    const normalized = String(value)
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

const platesMatch = (
    plate1,
    plate2
) => {
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

    if (!signature1 || !signature2) {
        return false;
    }

    return (
        signature1.digits ===
        signature2.digits &&
        signature1.arabicLetters ===
        signature2.arabicLetters
    );
};

export default function InputMatricule({
    type = "tracteur",
    value = "",
    onChange,
    onDetected,
    disabled = false,
    onRetourDashboard,
}) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const [cameraActive, setCameraActive] =
        useState(false);

    const [capturing, setCapturing] =
        useState(false);

    const [savingCamion, setSavingCamion] =
        useState(false);

    const [error, setError] =
        useState("");

    const [preview, setPreview] =
        useState("");

    const [camionId, setCamionId] =
        useState(null);

    const label =
        type === "remorque"
            ? "Matricule remorque"
            : "Matricule tracteur";

    const shortLabel =
        type === "remorque"
            ? "REMORQUE"
            : "TRACTEUR";

    // ========================================================
    // CLEANUP
    // ========================================================

    useEffect(() => {
        return () => {
            stopCamera();

            if (preview) {
                URL.revokeObjectURL(preview);
            }
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ========================================================
    // CAMERA
    // ========================================================

    const startCamera = async () => {
        try {
            setError("");

            if (cameraActive) {
                return;
            }

            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia
            ) {
                throw new Error(
                    "La caméra n'est pas disponible dans ce navigateur."
                );
            }

            const stream =
                await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: "environment",
                        width: {
                            ideal: 1920,
                        },
                        height: {
                            ideal: 1080,
                        },
                    },
                    audio: false,
                });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject =
                    stream;

                await videoRef.current.play();

                setCameraActive(true);
            }
        } catch (err) {
            console.error(
                "[CAMERA] Erreur :",
                err
            );

            setError(
                err?.message ||
                "Impossible d'accéder à la caméra."
            );
        }
    };

    // ========================================================
    // STOP CAMERA
    // ========================================================

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current
                .getTracks()
                .forEach((track) => {
                    track.stop();
                });

            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setCameraActive(false);
    };

    // ========================================================
    // EXTRAIRE MATRICULE OCR
    // ========================================================

    const extractDetectedValue = (data) => {
        if (!data) {
            return "";
        }

        if (type === "tracteur") {
            if (
                typeof data.matricule_tracteur ===
                "string"
            ) {
                return data.matricule_tracteur.trim();
            }

            if (
                data.tracteur &&
                typeof data.tracteur.full_plate ===
                "string"
            ) {
                return data.tracteur.full_plate.trim();
            }
        }

        if (type === "remorque") {
            if (
                typeof data.matricule_remorque ===
                "string"
            ) {
                return data.matricule_remorque.trim();
            }

            if (
                data.remorque &&
                typeof data.remorque.full_plate ===
                "string"
            ) {
                return data.remorque.full_plate.trim();
            }
        }

        const possibleValues = [
            data.matricule,
            data.immatriculation,
            data.plate,
            data.plate_text,
            data.texte,
        ];

        for (
            const candidate of possibleValues
        ) {
            if (
                typeof candidate === "string" &&
                candidate.trim()
            ) {
                return candidate.trim();
            }
        }

        if (
            data.plate_text &&
            typeof data.plate_text === "object"
        ) {
            if (
                typeof data.plate_text.full_plate ===
                "string"
            ) {
                return data.plate_text.full_plate.trim();
            }
        }

        return "";
    };

    // ========================================================
    // SAUVEGARDER / RECUPERER CAMION
    // ========================================================

    const saveDetectedCamion = async (
        matricule
    ) => {
        const immatriculation = String(
            matricule || ""
        ).trim();

        if (!immatriculation) {
            return null;
        }

        try {
            setSavingCamion(true);

            const token =
                localStorage.getItem("token");

            const getResponse =
                await fetch(
                    `${API_URL}/camions`,
                    {
                        method: "GET",

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

            let getData = null;

            try {
                getData =
                    await getResponse.json();
            } catch {
                getData = null;
            }

            if (
                getResponse.status === 401 ||
                getResponse.status === 403
            ) {
                return null;
            }

            const camions =
                Array.isArray(
                    getData?.camions
                )
                    ? getData.camions
                    : Array.isArray(
                        getData?.data
                    )
                        ? getData.data
                        : Array.isArray(getData)
                            ? getData
                            : [];

            const existingCamion =
                camions.find((camion) => {
                    const plaqueDB =
                        String(
                            camion?.immatriculation ||
                            camion?.matricule ||
                            ""
                        ).trim();

                    return platesMatch(
                        immatriculation,
                        plaqueDB
                    );
                });

            if (existingCamion) {
                setCamionId(
                    existingCamion.id
                );

                return existingCamion;
            }

            const createResponse =
                await fetch(
                    `${API_URL}/camions`,
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

                        body: JSON.stringify({
                            immatriculation:
                                immatriculation,
                        }),
                    }
                );

            let createData = null;

            try {
                createData =
                    await createResponse.json();
            } catch {
                createData = null;
            }

            if (
                createResponse.ok &&
                createData?.camion
            ) {
                setCamionId(
                    createData.camion.id
                );

                return createData.camion;
            }

            if (
                createResponse.status ===
                409
            ) {
                const conflictCamion =
                    createData?.camion ||
                    createData?.data?.camion ||
                    null;

                if (conflictCamion) {
                    setCamionId(
                        conflictCamion.id
                    );

                    return conflictCamion;
                }

                const retryResponse =
                    await fetch(
                        `${API_URL}/camions`,
                        {
                            method: "GET",

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

                let retryData = null;

                try {
                    retryData =
                        await retryResponse.json();
                } catch {
                    retryData = null;
                }

                const retryCamions =
                    Array.isArray(
                        retryData?.camions
                    )
                        ? retryData.camions
                        : [];

                const retryExisting =
                    retryCamions.find(
                        (camion) =>
                            platesMatch(
                                immatriculation,
                                camion?.immatriculation
                            )
                    );

                if (retryExisting) {
                    setCamionId(
                        retryExisting.id
                    );

                    return retryExisting;
                }
            }

            if (
                createResponse.status === 401 ||
                createResponse.status === 403
            ) {
                return null;
            }

            return null;
        } catch (err) {
            console.error(
                "[CAMION] Erreur sauvegarde automatique :",
                err
            );

            return null;
        } finally {
            setSavingCamion(false);
        }
    };

    // ========================================================
    // CAPTURE
    // ========================================================

    const capture = async () => {
        if (
            !videoRef.current ||
            !canvasRef.current
        ) {
            setError(
                "La caméra n'est pas correctement initialisée."
            );

            return;
        }

        if (!cameraActive) {
            setError(
                "Activez d'abord la caméra."
            );

            return;
        }

        setCapturing(true);
        setError("");

        try {
            const video =
                videoRef.current;

            const canvas =
                canvasRef.current;

            if (
                !video.videoWidth ||
                !video.videoHeight
            ) {
                throw new Error(
                    "La caméra n'a pas encore fourni d'image."
                );
            }

            canvas.width =
                video.videoWidth;

            canvas.height =
                video.videoHeight;

            const context =
                canvas.getContext("2d");

            if (!context) {
                throw new Error(
                    "Impossible d'utiliser le canvas."
                );
            }

            context.drawImage(
                video,
                0,
                0,
                canvas.width,
                canvas.height
            );

            const blob =
                await new Promise(
                    (resolve) => {
                        canvas.toBlob(
                            resolve,
                            "image/jpeg",
                            0.95
                        );
                    }
                );

            if (!blob) {
                throw new Error(
                    "Capture impossible."
                );
            }

            if (preview) {
                URL.revokeObjectURL(
                    preview
                );
            }

            const imageUrl =
                URL.createObjectURL(
                    blob
                );

            setPreview(imageUrl);

            const formData =
                new FormData();

            formData.append(
                "file",
                blob,
                `${type}-plate.jpg`
            );

            const endpoint =
                type === "remorque"
                    ? `${OCR_SERVICE_URL}/api/detecter-remorque`
                    : `${OCR_SERVICE_URL}/api/detecter-tracteur`;

            const response =
                await fetch(
                    endpoint,
                    {
                        method: "POST",
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

            if (!response.ok) {
                throw new Error(
                    data?.detail ||
                    data?.message ||
                    data?.erreur ||
                    "Erreur OCR."
                );
            }

            const finalValue =
                extractDetectedValue(data);

            if (!finalValue) {
                setError(
                    type === "remorque"
                        ? "Aucune matricule remorque détectée. Utilisez la saisie manuelle ci-dessous."
                        : "Aucune matricule tracteur détectée. Utilisez la saisie manuelle ci-dessous."
                );

                return;
            }

            onChange?.(finalValue);

            const camion =
                await saveDetectedCamion(
                    finalValue
                );

            onDetected?.(
                finalValue,
                {
                    ...data,
                    camion,
                    camion_id:
                        camion?.id ||
                        null,
                }
            );

            setError("");
        } catch (err) {
            console.error(
                "[OCR] Erreur détection :",
                err
            );

            setError(
                err?.message ||
                "Erreur pendant la détection."
            );
        } finally {
            setCapturing(false);
        }
    };

    // ========================================================
    // RESET
    // ========================================================

    const reset = () => {
        if (preview) {
            URL.revokeObjectURL(preview);
        }

        setPreview("");
        setError("");
        setCamionId(null);

        onChange?.("");
    };

    // ========================================================
    // SAISIE MANUELLE
    // ========================================================

    const handleManualChange = (event) => {
        const manualValue =
            event.target.value;

        setError("");

        onChange?.(manualValue);
    };

    // ========================================================
    // AFFICHAGE
    // ========================================================

    return (
        <section className="w-full overflow-hidden border border-slate-200 bg-white shadow-sm">

            {/* ==================================================
                HEADER
            ================================================== */}

            <header className="border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    <div className="flex min-w-0 items-center gap-4">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-blue-950 text-white">
                            <ScanLine size={21} />
                        </div>

                        <div className="min-w-0">

                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-500">
                                    Identification véhicule
                                </span>

                                <span className="h-1 w-1 rounded-full bg-slate-300" />

                                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                                    Poste de pesage
                                </span>
                            </div>

                            <h2 className="mt-1 text-lg font-bold text-blue-950 sm:text-xl">
                                {label}
                            </h2>

                        </div>

                    </div>

                    <div className="flex items-center gap-2">

                        <div className="flex items-center gap-2 border border-slate-200 bg-slate-50 px-3 py-2">
                            <CircleDot
                                size={13}
                                className="text-emerald-500"
                            />

                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                {shortLabel}
                            </span>
                        </div>

                        {typeof onRetourDashboard === "function" && (
                            <button
                                type="button"
                                onClick={onRetourDashboard}
                                className="flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                                <LayoutDashboard size={15} />

                                <span className="hidden sm:inline">
                                    Dashboard
                                </span>
                            </button>
                        )}

                    </div>
                </div>
            </header>

            {/* ==================================================
                CONTENU PRINCIPAL
            ================================================== */}

            <div className="grid w-full grid-cols-1 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,0.8fr)]">

                {/* ==================================================
                    ZONE CAMERA
                ================================================== */}

                <div className="border-b border-slate-200 p-5 sm:p-7 xl:border-b-0 xl:border-r">

                    <div className="mb-4 flex items-center justify-between">

                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                                Capture
                            </p>

                            <h3 className="mt-1 text-sm font-bold text-slate-900">
                                Lecture automatique de la plaque
                            </h3>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            <ShieldCheck size={14} />
                            OCR sécurisé
                        </div>

                    </div>

                    <div className="relative w-full overflow-hidden bg-slate-950">

                        {preview ? (
                            <img
                                src={preview}
                                alt="Capture matricule"
                                className="block aspect-video w-full object-cover"
                            />
                        ) : (
                            <>
                                <video
                                    ref={videoRef}
                                    muted
                                    playsInline
                                    className="block aspect-video w-full object-cover"
                                />

                                {!cameraActive && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#071d35]">

                                        <div className="mb-4 flex h-14 w-14 items-center justify-center border border-white/10 bg-white/5">
                                            <Camera
                                                size={27}
                                                className="text-white/60"
                                            />
                                        </div>

                                        <p className="text-sm font-semibold text-white">
                                            Caméra inactive
                                        </p>

                                        <p className="mt-1 text-xs text-white/45">
                                            Activez la caméra pour commencer
                                        </p>

                                    </div>
                                )}
                            </>
                        )}

                        {cameraActive && !preview && (
                            <div className="pointer-events-none absolute inset-0">

                                {/* Assombrissement léger */}
                                <div className="absolute inset-0 bg-black/10" />

                                {/* Cadre principal */}
                                <div className="absolute left-1/2 top-1/2 h-[28%] w-[68%] -translate-x-1/2 -translate-y-1/2 border-2 border-orange-400">

                                    {/* Coins */}
                                    <span className="absolute -left-0.5 -top-0.5 h-4 w-4 border-l-4 border-t-4 border-orange-300" />
                                    <span className="absolute -right-0.5 -top-0.5 h-4 w-4 border-r-4 border-t-4 border-orange-300" />
                                    <span className="absolute -bottom-0.5 -left-0.5 h-4 w-4 border-b-4 border-l-4 border-orange-300" />
                                    <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 border-b-4 border-r-4 border-orange-300" />

                                </div>

                                {/* Ligne de scan */}
                                <div className="absolute left-1/2 top-1/2 h-px w-[61%] -translate-x-1/2 bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.9)]" />

                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-sm">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/80">
                                        Positionnez la plaque dans le cadre
                                    </span>
                                </div>

                            </div>
                        )}

                    </div>

                    <canvas
                        ref={canvasRef}
                        className="hidden"
                    />

                    {/* ACTIONS CAMERA */}

                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">

                        {!cameraActive ? (
                            <button
                                type="button"
                                onClick={startCamera}
                                disabled={disabled}
                                className="flex min-h-11 items-center justify-center gap-2 bg-blue-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <Camera size={18} />
                                Activer la caméra
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={capture}
                                disabled={
                                    disabled ||
                                    capturing ||
                                    savingCamion
                                }
                                className="flex min-h-11 items-center justify-center gap-2 bg-orange-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {capturing ? (
                                    <>
                                        <Loader2
                                            size={18}
                                            className="animate-spin"
                                        />
                                        Détection...
                                    </>
                                ) : savingCamion ? (
                                    <>
                                        <Loader2
                                            size={18}
                                            className="animate-spin"
                                        />
                                        Vérification...
                                    </>
                                ) : (
                                    <>
                                        <Camera size={18} />
                                        Capturer la plaque
                                    </>
                                )}
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={reset}
                            disabled={disabled}
                            className="flex min-h-11 items-center justify-center gap-2 border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <RotateCcw size={17} />
                            Réinitialiser
                        </button>

                    </div>

                </div>

                {/* ==================================================
                    PANNEAU DROIT
                ================================================== */}

                <aside className="flex flex-col bg-slate-50/60">

                    {/* RESULTAT */}

                    <div className="border-b border-slate-200 p-5 sm:p-7">

                        <div className="flex items-center justify-between">

                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                                    Résultat
                                </p>

                                <h3 className="mt-1 text-sm font-bold text-slate-900">
                                    Identification détectée
                                </h3>
                            </div>

                            {value && (
                                <CheckCircle2
                                    size={19}
                                    className="text-emerald-500"
                                />
                            )}

                        </div>

                        {value ? (
                            <div className="mt-5">

                                <div className="border border-blue-100 bg-white p-4">

                                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                                        Matricule
                                    </p>

                                    <p className="mt-2 break-all text-2xl font-extrabold tracking-wide text-blue-950">
                                        {value}
                                    </p>

                                </div>

                                {camionId && (
                                    <div className="mt-2 flex items-center justify-between border border-slate-200 bg-white px-4 py-3">

                                        <div className="flex items-center gap-2">
                                            <Database
                                                size={15}
                                                className="text-blue-700"
                                            />

                                            <span className="text-xs font-semibold text-slate-600">
                                                Véhicule enregistré
                                            </span>
                                        </div>

                                        <span className="text-xs font-bold text-blue-950">
                                            #{camionId}
                                        </span>

                                    </div>
                                )}

                                {savingCamion && (
                                    <div className="mt-2 flex items-center gap-2 border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-700">
                                        <Loader2
                                            size={15}
                                            className="animate-spin"
                                        />

                                        Vérification dans la base de données...
                                    </div>
                                )}

                            </div>
                        ) : (
                            <div className="mt-5 border border-dashed border-slate-300 bg-white p-4">

                                <div className="flex items-center gap-3">

                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-slate-100">
                                        <ScanLine
                                            size={18}
                                            className="text-slate-400"
                                        />
                                    </div>

                                    <div>
                                        <p className="text-xs font-bold text-slate-700">
                                            En attente de détection
                                        </p>

                                        <p className="mt-1 text-[11px] leading-4 text-slate-400">
                                            Utilisez la caméra ou la saisie manuelle.
                                        </p>
                                    </div>

                                </div>

                            </div>
                        )}

                    </div>

                    {/* SAISIE MANUELLE */}

                    <div className="border-b border-slate-200 p-5 sm:p-7">

                        <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-orange-50">
                                <Keyboard
                                    size={17}
                                    className="text-orange-600"
                                />
                            </div>

                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Saisie manuelle
                                    </h3>

                                    <span className="border border-orange-200 bg-orange-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-orange-700">
                                        Secours
                                    </span>
                                </div>

                                <p className="mt-1 text-[11px] text-slate-400">
                                    Corrigez la valeur détectée si nécessaire.
                                </p>
                            </div>

                        </div>

                        <div className="mt-4">

                            <label
                                htmlFor={`manual-${type}`}
                                className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500"
                            >
                                {label}
                            </label>

                            <input
                                id={`manual-${type}`}
                                type="text"
                                value={value || ""}
                                onChange={handleManualChange}
                                disabled={disabled}
                                autoComplete="off"
                                spellCheck="false"
                                placeholder={
                                    type === "remorque"
                                        ? "Ex. 73215 8"
                                        : "Ex. 73215 ب 8"
                                }
                                className="h-12 w-full border border-slate-200 bg-white px-4 text-base font-bold tracking-wide text-blue-950 outline-none transition placeholder:text-xs placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:border-blue-700 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                            />

                            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400">
                                <Keyboard size={12} />
                                <span>
                                    La saisie manuelle remplace la détection OCR.
                                </span>
                            </div>

                        </div>

                    </div>

                    {/* ERREUR */}

                    {error && (
                        <div className="border-b border-slate-200 p-5 sm:p-7">

                            <div className="flex items-start gap-3 border border-orange-200 bg-orange-50 px-4 py-3">

                                <AlertCircle
                                    size={18}
                                    className="mt-0.5 shrink-0 text-orange-500"
                                />

                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange-700">
                                        Information
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-slate-700">
                                        {error}
                                    </p>
                                </div>

                            </div>

                        </div>
                    )}

                    {/* ETAT SYSTEME */}

                    <div className="mt-auto p-5 sm:p-7">

                        <div className="flex items-center justify-between border border-slate-200 bg-white px-4 py-3">

                            <div className="flex items-center gap-2">

                                <span className="h-2 w-2 rounded-full bg-emerald-500" />

                                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                    Système OCR
                                </span>

                            </div>

                            <span className="text-[10px] font-bold text-emerald-600">
                                DISPONIBLE
                            </span>

                        </div>

                        <div className="mt-2 flex items-center justify-between border border-slate-200 bg-white px-4 py-3">

                            <div className="flex items-center gap-2">

                                <span
                                    className={`h-2 w-2 rounded-full ${cameraActive
                                            ? "bg-emerald-500"
                                            : "bg-slate-300"
                                        }`}
                                />

                                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                    Caméra
                                </span>

                            </div>

                            <span
                                className={`text-[10px] font-bold ${cameraActive
                                        ? "text-emerald-600"
                                        : "text-slate-400"
                                    }`}
                            >
                                {cameraActive
                                    ? "ACTIVE"
                                    : "INACTIVE"}
                            </span>

                        </div>

                    </div>

                </aside>

            </div>

            {/* ==================================================
                FOOTER
            ================================================== */}

            <footer className="border-t border-slate-200 bg-[#f8fafc] px-5 py-3 sm:px-7">

                <div className="flex flex-col gap-2 text-[10px] font-medium text-slate-400 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-2">
                        <ShieldCheck size={13} />
                        <span>
                            Identification sécurisée du véhicule
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                        <span>
                            OCR + saisie manuelle
                        </span>
                    </div>

                </div>

            </footer>

        </section>
    );
}