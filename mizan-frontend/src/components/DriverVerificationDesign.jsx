import React, {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    Camera,
    CheckCircle2,
    XCircle,
    UserPlus,
    ScanLine,
    UserRound,
    CreditCard,
    ShieldCheck,
    RotateCcw,
} from "lucide-react";

export default function DriverVerificationDesign({
    mode = "scan",

    chauffeur = null,

    qrCode = "",

    scanning = false,

    saving = false,

    onStartScan,

    onSaveNew,

    onConfirm,

    onReject,
}) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const [cameraActive, setCameraActive] =
        useState(false);

    const [photoTaken, setPhotoTaken] =
        useState(false);

    const [photoBlob, setPhotoBlob] =
        useState(null);

    const [form, setForm] = useState({
        nom: "",
        prenom: "",
        cin: "",
    });

    /*
     * ============================================================
     * CAMERA
     * ============================================================
     */

    useEffect(() => {
        setForm({
            nom: chauffeur?.nom || "",
            prenom: chauffeur?.prenom || "",
            cin: chauffeur?.cin || "",
        });
    }, [chauffeur]);

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        try {
            if (cameraActive) {
                return;
            }

            const stream =
                await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: "user",
                        width: {
                            ideal: 1280,
                        },
                        height: {
                            ideal: 720,
                        },
                    },
                    audio: false,
                });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;

                await videoRef.current.play();

                setCameraActive(true);
            }
        } catch (error) {
            console.error(
                "Erreur caméra chauffeur :",
                error
            );

            alert(
                "Impossible d'accéder à la caméra."
            );
        }
    };

    const stopCamera = () => {
        const video = videoRef.current;

        if (!video) {
            return;
        }

        const stream = video.srcObject;

        if (stream) {
            stream
                .getTracks()
                .forEach((track) => track.stop());
        }

        video.srcObject = null;

        setCameraActive(false);
    };

    const capturePhoto = async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas) {
            return;
        }

        if (
            video.readyState <
            HTMLMediaElement.HAVE_CURRENT_DATA
        ) {
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context =
            canvas.getContext("2d");

        context.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
        );

        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    return;
                }

                setPhotoBlob(blob);
                setPhotoTaken(true);
            },
            "image/jpeg",
            0.9
        );
    };

    const retakePhoto = () => {
        setPhotoBlob(null);
        setPhotoTaken(false);
    };

    /*
     * ============================================================
     * FORM
     * ============================================================
     */

    const handleChange = (event) => {
        const {
            name,
            value,
        } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSave = async () => {
        if (!form.nom.trim()) {
            alert("Le nom est obligatoire.");
            return;
        }

        if (!form.prenom.trim()) {
            alert("Le prénom est obligatoire.");
            return;
        }

        if (!form.cin.trim()) {
            alert("La CIN est obligatoire.");
            return;
        }

        if (!qrCode) {
            alert("Le QR du chauffeur est manquant.");
            return;
        }

        await onSaveNew?.({
            ...form,
            code_qr: qrCode,
            photoBlob,
        });
    };

    /*
     * ============================================================
     * SCAN
     * ============================================================
     */

    if (mode === "scan") {
        return (
            <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-7">

                <div className="mb-7 flex items-center gap-4 border-b border-slate-100 pb-6">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg">
                        <ScanLine size={27} />
                    </div>

                    <div>
                        <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                            Identification
                        </p>

                        <h2 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                            Identification du chauffeur
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Scannez le badge QR du chauffeur.
                        </p>
                    </div>
                </div>

                <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[1.7rem] border-2 border-dashed border-slate-300 bg-slate-50 px-5">

                    <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-slate-700 shadow-sm">
                        <ScanLine size={45} />
                    </div>

                    <p className="text-center text-sm font-semibold text-slate-700">
                        Placez le QR code devant le lecteur.
                    </p>

                    <p className="mt-2 text-center text-xs text-slate-400">
                        Le système identifiera automatiquement le chauffeur.
                    </p>

                    {scanning && (
                        <div className="mt-5 flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
                            Scan en cours...
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={onStartScan}
                    disabled={scanning}
                    className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <ScanLine size={20} />

                    {scanning
                        ? "Scanner actif..."
                        : "Scanner le badge"}
                </button>
            </div>
        );
    }

    /*
     * ============================================================
     * ENROLL
     * ============================================================
     */

    if (mode === "enroll") {
        return (
            <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-7">

                <div className="mb-7 flex items-center gap-4 border-b border-slate-100 pb-6">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg">
                        <UserPlus size={27} />
                    </div>

                    <div>
                        <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                            Nouveau dossier
                        </p>

                        <h2 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                            Nouveau chauffeur
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Ce badge QR n'est pas encore enregistré.
                        </p>
                    </div>
                </div>

                <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                    <div className="mb-2 flex items-center gap-2">
                        <ScanLine
                            size={17}
                            className="text-blue-700"
                        />

                        <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                            QR détecté
                        </p>
                    </div>

                    <p className="break-all rounded-xl bg-white p-3 font-mono text-sm font-bold text-slate-900">
                        {qrCode || "—"}
                    </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Nom
                        </label>

                        <div className="relative">
                            <UserRound
                                size={18}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                name="nom"
                                value={form.nom}
                                onChange={handleChange}
                                className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                                placeholder="Nom"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Prénom
                        </label>

                        <div className="relative">
                            <UserRound
                                size={18}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                name="prenom"
                                value={form.prenom}
                                onChange={handleChange}
                                className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                                placeholder="Prénom"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-5">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        CIN
                    </label>

                    <div className="relative">
                        <CreditCard
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            name="cin"
                            value={form.cin}
                            onChange={handleChange}
                            className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm uppercase outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                            placeholder="Ex : AB123456"
                        />
                    </div>
                </div>

                <div className="mt-6 overflow-hidden rounded-[1.7rem] bg-slate-950">

                    {!photoTaken ? (
                        <div className="relative aspect-video">
                            <video
                                ref={videoRef}
                                muted
                                playsInline
                                className="h-full w-full object-cover"
                            />

                            {!cameraActive && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                                        <Camera
                                            size={36}
                                            className="text-slate-300"
                                        />
                                    </div>

                                    <p className="text-sm font-semibold">
                                        Caméra inactive
                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">
                                        Activez la caméra pour prendre une photo.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex aspect-video flex-col items-center justify-center text-white">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500">
                                <CheckCircle2 size={38} />
                            </div>

                            <p className="text-sm font-bold">
                                Photo capturée
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                                Vous pouvez reprendre la photo si nécessaire.
                            </p>
                        </div>
                    )}
                </div>

                <canvas
                    ref={canvasRef}
                    className="hidden"
                />

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">

                    {!cameraActive ? (
                        <button
                            type="button"
                            onClick={startCamera}
                            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3.5 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                        >
                            <Camera size={19} />
                            Activer la caméra
                        </button>
                    ) : !photoTaken ? (
                        <button
                            type="button"
                            onClick={capturePhoto}
                            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800"
                        >
                            <Camera size={19} />
                            Capturer
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={retakePhoto}
                            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3.5 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                        >
                            <RotateCcw size={19} />
                            Reprendre
                        </button>
                    )}
                </div>

                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <CheckCircle2 size={20} />

                    {saving
                        ? "Enregistrement..."
                        : "Enregistrer le chauffeur"}
                </button>
            </div>
        );
    }

    /*
     * ============================================================
     * VERIFY
     * ============================================================
     */

    return (
        <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-7">

            {/* HEADER */}
            <div className="mb-7 flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg">
                        <ShieldCheck
                            size={27}
                            strokeWidth={2}
                        />
                    </div>

                    <div>
                        <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                            Contrôle d'identité
                        </p>

                        <h2 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                            Vérification du chauffeur
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Comparez les informations et la photo de référence.
                        </p>
                    </div>
                </div>

                <div className="flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Chauffeur identifié
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">

                {/* REFERENCE INFORMATION */}
                <div className="rounded-[1.7rem] border border-slate-200 bg-slate-50/70 p-4 sm:p-5">

                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                                Dossier chauffeur
                            </p>

                            <h3 className="mt-1 text-lg font-bold text-slate-950">
                                Référence enregistrée
                            </h3>
                        </div>

                        <div className="rounded-xl bg-white p-2 text-slate-700 shadow-sm">
                            <UserRound size={21} />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-[0.95fr_1.05fr]">

                        {/* REFERENCE PHOTO */}
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

                            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Photo de référence
                                </span>

                                <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
                                    ENREGISTRÉE
                                </span>
                            </div>

                            <div className="aspect-[4/4.2] overflow-hidden bg-slate-100">
                                {chauffeur?.photo_reference_url ? (
                                    <img
                                        src={`http://localhost:5000${chauffeur.photo_reference_url}`}
                                        alt="Photo de référence du chauffeur"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-300">
                                        <UserRound
                                            size={64}
                                            strokeWidth={1.4}
                                        />

                                        <p className="text-xs font-semibold text-slate-400">
                                            Aucune photo disponible
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* INFORMATION + QR */}
                        <div className="flex flex-col gap-4">

                            {/* PERSONAL INFORMATION */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">

                                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Informations personnelles
                                </p>

                                <div className="space-y-3">

                                    <div>
                                        <p className="text-xs text-slate-400">
                                            Nom complet
                                        </p>

                                        <p className="mt-1 break-words text-base font-bold text-slate-950">
                                            {chauffeur?.prenom || "—"}{" "}
                                            {chauffeur?.nom || ""}
                                        </p>
                                    </div>

                                    <div className="h-px bg-slate-100" />

                                    <div>
                                        <p className="text-xs text-slate-400">
                                            CIN
                                        </p>

                                        <p className="mt-1 font-mono text-sm font-bold uppercase tracking-wide text-slate-800">
                                            {chauffeur?.cin || "—"}
                                        </p>
                                    </div>

                                    <div className="h-px bg-slate-100" />

                                    <div>
                                        <p className="text-xs text-slate-400">
                                            Identifiant chauffeur
                                        </p>

                                        <p className="mt-1 text-sm font-semibold text-slate-800">
                                            {chauffeur?.id
                                                ? `CH-${String(chauffeur.id).padStart(5, "0")}`
                                                : "—"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* QR CODE */}
                            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4">

                                <div className="mb-3 flex items-center gap-2">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
                                        <ScanLine size={19} />
                                    </div>

                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                                            Badge QR
                                        </p>

                                        <p className="text-xs text-blue-600">
                                            Code associé au chauffeur
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-blue-100 bg-white p-3">
                                    <p className="break-all text-center font-mono text-sm font-bold tracking-wide text-slate-950">
                                        {qrCode ||
                                            chauffeur?.code_qr ||
                                            "QR non disponible"}
                                    </p>
                                </div>

                                <div className="mt-3 flex items-center gap-2 text-xs text-blue-700">
                                    <CheckCircle2 size={15} />

                                    <span>
                                        Code QR détecté et associé
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CURRENT PHOTO */}
                <div className="rounded-[1.7rem] border border-slate-200 bg-white p-4 sm:p-5">

                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                                Capture en direct
                            </p>

                            <h3 className="mt-1 text-lg font-bold text-slate-950">
                                Vérification actuelle
                            </h3>
                        </div>

                        <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
                            <Camera size={15} />
                            Caméra
                        </div>
                    </div>

                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-950">

                        <video
                            ref={videoRef}
                            muted
                            playsInline
                            className="h-full w-full object-cover"
                        />

                        {!cameraActive && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-white">

                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                                    <Camera
                                        size={34}
                                        className="text-slate-300"
                                    />
                                </div>

                                <p className="text-sm font-semibold">
                                    Caméra inactive
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                    Activez la caméra pour continuer
                                </p>
                            </div>
                        )}

                        {cameraActive && (
                            <div className="pointer-events-none absolute inset-0">

                                <div className="absolute inset-5 rounded-2xl border border-white/40" />

                                <div className="absolute left-1/2 top-5 h-1 w-24 -translate-x-1/2 rounded-full bg-blue-400 shadow-lg shadow-blue-500/40" />

                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-2 text-xs font-semibold text-white backdrop-blur">
                                    Positionnez le visage dans le cadre
                                </div>
                            </div>
                        )}
                    </div>

                    <canvas
                        ref={canvasRef}
                        className="hidden"
                    />

                    <button
                        type="button"
                        onClick={
                            cameraActive
                                ? capturePhoto
                                : startCamera
                        }
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800"
                    >
                        <Camera size={19} />

                        {cameraActive
                            ? "Capturer la vérification"
                            : "Activer la caméra"}
                    </button>

                    <div className="mt-4 flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                        <ShieldCheck
                            size={18}
                            className="mt-0.5 shrink-0 text-slate-500"
                        />

                        <p className="text-xs leading-relaxed text-slate-500">
                            Vérifiez que le visage correspond à la photo de
                            référence avant de confirmer l'identité.
                        </p>
                    </div>
                </div>
            </div>

            {/* ACTIONS */}
            <div className="mt-6 grid gap-3 border-t border-slate-100 pt-6 sm:grid-cols-2">

                <button
                    type="button"
                    onClick={onReject}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700 transition hover:bg-red-100"
                >
                    <XCircle size={20} />
                    Refuser l'identité
                </button>

                <button
                    type="button"
                    onClick={onConfirm}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
                >
                    <CheckCircle2 size={20} />
                    Identité confirmée
                </button>
            </div>
        </div>
    );
}