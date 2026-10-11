import React from "react";

import {
    Scale,
    CheckCircle2,
    Radio,
    Lock,
    ArrowDown,
    Calculator,
    ShieldCheck,
    TrendingUp,
    AlertCircle,
} from "lucide-react";

function formatWeight(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "0";
    }

    return number.toLocaleString("fr-FR", {
        maximumFractionDigits: 2,
    });
}

export default function WeighingIQDesign({
    mode = "entry",

    poids = 0,

    statut = "INSTABLE",

    poidsTare = null,

    poidsBrut = null,

    poidsNet = null,

    validated = false,

    validating = false,

    onValidate,
}) {
    const isEntry = mode === "entry";

    /*
     * ========================================================
     * POIDS ACTUEL
     * ========================================================
     */

    const displayedWeight = Number(poids);

    const validWeight =
        Number.isFinite(displayedWeight) &&
        displayedWeight > 0;

    /*
     * ========================================================
     * STABILITE
     * ========================================================
     *
     * IMPORTANT :
     * La stabilité est uniquement affichée.
     *
     * Elle NE BLOQUE PAS la validation.
     *
     * L'utilisateur peut valider à n'importe quel moment
     * lorsque le poids est dans la plage autorisée.
     * ========================================================
     */

    const stable =
        String(statut)
            .trim()
            .toUpperCase() === "STABLE";

    /*
     * ========================================================
     * PLAGE DE VALIDATION
     * ========================================================
     *
     * ENTREE :
     * 11 000 kg → 16 000 kg
     *
     * SORTIE :
     * 20 000 kg → 40 000 kg
     * ========================================================
     */

    const minValidationWeight = isEntry
        ? 11000
        : 20000;

    const maxValidationWeight = isEntry
        ? 16000
        : 40000;

    const weightInValidationRange =
        Number.isFinite(displayedWeight) &&
        displayedWeight >= minValidationWeight &&
        displayedWeight <= maxValidationWeight;

    /*
     * ========================================================
     * BOUTON ACTIVABLE
     * ========================================================
     *
     * IMPORTANT :
     *
     * Le bouton NE dépend PAS de STABLE / INSTABLE.
     *
     * Il est cliquable si :
     *
     * 1. le poids est dans la plage autorisée
     * 2. la pesée n'est pas déjà validée
     * 3. aucune validation n'est actuellement en cours
     *
     * EXEMPLE :
     *
     * 12 341 kg INSTABLE → bouton cliquable
     * 15 876 kg INSTABLE → bouton cliquable
     * 32 456 kg INSTABLE → bouton cliquable
     *
     * Le poids affiché au moment du clic est envoyé
     * à onValidate().
     * ========================================================
     */

    const canValidate =
        !validating &&
        !validated &&
        weightInValidationRange;

    /*
     * ========================================================
     * VALIDATION
     * ========================================================
     */

    const handleValidate = async () => {
        if (!canValidate) {
            return;
        }

        if (typeof onValidate !== "function") {
            console.error(
                "[PESÉE] onValidate n'est pas une fonction."
            );

            return;
        }

        console.log(
            "[PESÉE] Validation du poids :",
            displayedWeight,
            "kg"
        );

        console.log(
            "[PESÉE] Statut au moment du clic :",
            statut
        );

        try {
            /*
             * IMPORTANT :
             * On transmet exactement le poids actuellement affiché.
             *
             * STABLE / INSTABLE n'intervient pas ici.
             */
            const result = await onValidate(displayedWeight);

            console.log(
                "[PESÉE] Résultat validation :",
                result
            );

            if (
                result &&
                typeof result === "object" &&
                result.success === false
            ) {
                console.warn(
                    "[PESÉE] Validation refusée :",
                    result.error ||
                    result.message ||
                    "Erreur inconnue"
                );

                return;
            }
        } catch (error) {
            console.error(
                "[PESÉE] Erreur pendant la validation :",
                error
            );
        }
    };

    /*
     * ========================================================
     * ETAT VISUEL DE LA PLAGE
     * ========================================================
     */

    const belowRange =
        validWeight &&
        displayedWeight < minValidationWeight;

    const aboveRange =
        validWeight &&
        displayedWeight > maxValidationWeight;

    /*
     * ========================================================
     * POIDS DANS LA PLAGE MAIS INSTABLE
     * ========================================================
     *
     * Ce statut sert uniquement à l'affichage.
     * Il ne bloque PAS le bouton.
     * ========================================================
     */

    const inRangeButUnstable =
        weightInValidationRange &&
        !stable;

    return (
        <div className="w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.07)]">

            {/* ====================================================
                HEADER
            ==================================================== */}

            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 px-6 py-6 md:px-8">

                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                    <div className="flex items-center gap-4">

                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/10">

                            <Scale
                                size={27}
                                strokeWidth={2}
                            />

                        </div>

                        <div>

                            <div className="flex items-center gap-3">

                                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                                    {isEntry
                                        ? "Pesée d'entrée"
                                        : "Pesée de sortie"}
                                </h2>

                                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">

                                    {isEntry
                                        ? "TARE"
                                        : "BRUT"}

                                </span>

                            </div>

                            <p className="mt-1.5 text-sm text-slate-500">

                                {isEntry
                                    ? "Enregistrement du poids à vide du véhicule."
                                    : "Enregistrement du poids brut du véhicule chargé."}

                            </p>

                        </div>

                    </div>

                    {/* ====================================================
                        STATUT
                    ==================================================== */}

                    <div
                        className={`flex w-fit items-center gap-2.5 rounded-full border px-4 py-2.5 text-xs font-bold shadow-sm ${stable
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                            }`}
                    >

                        <span
                            className={`h-2 w-2 rounded-full ${stable
                                    ? "bg-emerald-500"
                                    : "bg-amber-500"
                                }`}
                        />

                        <Radio size={14} />

                        {stable
                            ? "STABLE"
                            : "INSTABLE"}

                    </div>

                </div>

            </div>

            {/* ====================================================
                ZONE POIDS LIVE
            ==================================================== */}

            <div className="px-6 pt-6 md:px-8">

                <div className="relative overflow-hidden rounded-[26px] bg-slate-950 p-7 text-white md:p-8">

                    <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />

                    <div className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-cyan-500/5 blur-3xl" />

                    <div className="relative">

                        <div className="mb-6 flex items-center justify-between">

                            <div>

                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">

                                    {validated
                                        ? "Poids enregistré"
                                        : "Lecture du pont-bascule"}

                                </p>

                                <p className="mt-1 text-sm text-slate-400">

                                    {isEntry
                                        ? "Plage autorisée : 11 000 – 16 000 kg"
                                        : "Plage autorisée : 20 000 – 40 000 kg"}

                                </p>

                            </div>

                            {validated && (

                                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-slate-300">

                                    <Lock size={14} />

                                    Verrouillé

                                </div>

                            )}

                        </div>

                        {/* ====================================================
                            POIDS
                        ==================================================== */}

                        <div className="flex items-end gap-4">

                            <span className="text-6xl font-bold tracking-[-0.04em] text-white md:text-7xl">

                                {formatWeight(
                                    validated
                                        ? isEntry
                                            ? poidsTare
                                            : poidsBrut
                                        : displayedWeight
                                )}

                            </span>

                            <span className="mb-2.5 text-xl font-medium text-slate-500">
                                kg
                            </span>

                        </div>

                        {/* ====================================================
                            ETAT
                        ==================================================== */}

                        <div className="mt-6 flex flex-wrap items-center gap-3">

                            <div
                                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${weightInValidationRange
                                        ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                                        : "border-white/10 bg-white/5 text-slate-400"
                                    }`}
                            >

                                {weightInValidationRange ? (
                                    <ShieldCheck size={14} />
                                ) : (
                                    <AlertCircle size={14} />
                                )}

                                {weightInValidationRange
                                    ? "Poids dans la plage de validation"
                                    : "Poids hors plage de validation"}

                            </div>

                            {!validated && (

                                <div className="flex items-center gap-2 text-xs text-slate-500">

                                    <TrendingUp size={14} />

                                    {stable
                                        ? "Mesure stable"
                                        : "Variation du poids en cours"}

                                </div>

                            )}

                        </div>

                    </div>

                </div>

            </div>

            {/* ====================================================
                INDICATEUR PLAGE
            ==================================================== */}

            <div className="px-6 pt-5 md:px-8">

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

                    <div className="mb-3 flex items-center justify-between">

                        <div>

                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Zone de validation
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-800">

                                {formatWeight(minValidationWeight)}
                                {" – "}
                                {formatWeight(maxValidationWeight)}
                                {" kg"}

                            </p>

                        </div>

                        <div
                            className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${weightInValidationRange
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-200 text-slate-500"
                                }`}
                        >

                            {weightInValidationRange
                                ? "VALIDATION POSSIBLE"
                                : "HORS ZONE"}

                        </div>

                    </div>

                    <div className="relative h-2 overflow-hidden rounded-full bg-slate-200">

                        <div
                            className={`absolute inset-y-0 rounded-full transition-all duration-300 ${weightInValidationRange
                                    ? "bg-emerald-500"
                                    : "bg-slate-300"
                                }`}
                            style={{
                                left: "0%",
                                right: "0%",
                            }}
                        />

                    </div>

                </div>

            </div>

            {/* ====================================================
                VALEURS
            ==================================================== */}

            <div className="grid gap-4 px-6 pt-5 md:grid-cols-3 md:px-8">

                {/* TARE */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300">

                    <div className="flex items-center justify-between">

                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                            Tare
                        </p>

                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">

                            <Scale size={15} />

                        </div>

                    </div>

                    <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">

                        {poidsTare !== null &&
                            poidsTare !== undefined
                            ? `${formatWeight(poidsTare)} kg`
                            : "—"}

                    </p>

                </div>

                {/* BRUT */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300">

                    <div className="flex items-center justify-between">

                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                            Brut
                        </p>

                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">

                            <TrendingUp size={15} />

                        </div>

                    </div>

                    <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">

                        {poidsBrut !== null &&
                            poidsBrut !== undefined
                            ? `${formatWeight(poidsBrut)} kg`
                            : "—"}

                    </p>

                </div>

                {/* NET */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300">

                    <div className="flex items-center justify-between">

                        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">

                            <Calculator size={14} />

                            Net

                        </p>

                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">

                            <Calculator size={15} />

                        </div>

                    </div>

                    <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">

                        {poidsNet !== null &&
                            poidsNet !== undefined
                            ? `${formatWeight(poidsNet)} kg`
                            : "—"}

                    </p>

                </div>

            </div>

            {/* ====================================================
                VALIDATION
            ==================================================== */}

            <div className="px-6 pb-7 pt-6 md:px-8">

                <button
                    type="button"
                    onClick={handleValidate}
                    disabled={!canValidate}
                    className={`flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-4 font-bold transition-all duration-200 ${canValidate
                            ? "bg-slate-950 text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl"
                            : "cursor-not-allowed bg-slate-100 text-slate-400"
                        }`}
                >

                    {validated ? (
                        <>
                            <CheckCircle2 size={21} />

                            {isEntry
                                ? "Tare validée"
                                : "Poids brut validé"}
                        </>
                    ) : validating ? (
                        <>
                            <Scale
                                size={21}
                                className="animate-spin"
                            />

                            Validation...
                        </>
                    ) : (
                        <>
                            <ArrowDown size={21} />

                            {isEntry
                                ? "Valider la tare"
                                : "Valider le poids brut"}
                        </>
                    )}

                </button>

                {/* ====================================================
                    MESSAGE INSTABLE
                    ====================================================
                    
                    IMPORTANT :
                    Ce message informe simplement l'utilisateur.
                    Il ne bloque absolument pas la validation.
                    ==================================================== */}

                {!validated &&
                    !validating &&
                    inRangeButUnstable && (

                        <div className="mt-4 flex items-center justify-center gap-2 text-center text-xs font-medium text-amber-600">

                            <AlertCircle size={14} />

                            <span>
                                Le poids est dans la plage autorisée.
                                Vous pouvez valider à tout moment.
                            </span>

                        </div>
                    )}

                {/* ====================================================
                    MESSAGE HORS PLAGE
                    ==================================================== */}

                {!validated &&
                    !validating &&
                    !weightInValidationRange && (

                        <div className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-slate-400">

                            <AlertCircle size={14} />

                            {belowRange ? (
                                <span>
                                    Poids insuffisant — minimum{" "}
                                    <strong className="text-slate-600">
                                        {formatWeight(
                                            minValidationWeight
                                        )}{" "}
                                        kg
                                    </strong>
                                </span>
                            ) : aboveRange ? (
                                <span>
                                    Poids trop élevé — maximum{" "}
                                    <strong className="text-slate-600">
                                        {formatWeight(
                                            maxValidationWeight
                                        )}{" "}
                                        kg
                                    </strong>
                                </span>
                            ) : (
                                <span>
                                    En attente d'un poids valide.
                                </span>
                            )}

                        </div>
                    )}

                {/* ====================================================
                    MESSAGE PLAGE OK
                    ==================================================== */}

                {!validated &&
                    !validating &&
                    weightInValidationRange &&
                    stable && (

                        <p className="mt-4 text-center text-xs font-medium text-emerald-600">
                            Le poids est stable et dans la plage
                            autorisée. Vous pouvez valider la pesée.
                        </p>
                    )}

                {/* ====================================================
                    MESSAGE PLAGE OK + INSTABLE
                    ==================================================== */}

                {!validated &&
                    !validating &&
                    weightInValidationRange &&
                    !stable && (

                        <p className="mt-4 text-center text-xs font-medium text-emerald-600">
                            Le poids est dans la plage autorisée.
                            Vous pouvez valider la pesée maintenant.
                        </p>
                    )}

            </div>

        </div>
    );
}