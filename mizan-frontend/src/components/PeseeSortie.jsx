import React, {
    useEffect,
    useState
} from "react";

import {
    Scale,
    CheckCircle2,
    AlertCircle,
    Search,
    Truck,
    User,
    Package,
    RotateCcw
} from "lucide-react";

import WeighingIQDesign from "./WeighingIQDesign";
import { socket } from "./socket";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

export default function PeseeSortie() {

    // ========================================================
    // RECHERCHE
    // ========================================================

    const [matricule, setMatricule] =
        useState("");

    const [pesee, setPesee] =
        useState(null);

    const [ticket, setTicket] =
        useState(null);

    const [searching, setSearching] =
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

    const [brutValide, setBrutValide] =
        useState(false);

    const [validating, setValidating] =
        useState(false);

    // ========================================================
    // ETAT
    // ========================================================

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    // ========================================================
    // SOCKET
    // ========================================================

    useEffect(() => {

        const handleWeightUpdate =
            (data) => {

                if (!data) {
                    return;
                }

                const value =
                    Number(data.poids);

                if (!Number.isFinite(value)) {
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
    // RECHERCHER PESEE OUVERTE
    // ========================================================

    const searchPesee = async () => {

        const value =
            matricule.trim();

        if (!value) {
            setError(
                "Entrez le matricule du tracteur."
            );

            return;
        }

        try {

            setSearching(true);
            setError("");
            setSuccess("");

            const response =
                await fetch(
                    `${API_URL}/pesee/en-cours/camion/${encodeURIComponent(
                        value
                    )}`
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Aucune pesée en cours."
                );
            }

            setPesee(
                data.pesee
            );

            setTicket(
                data.pesee?.ticket ||
                null
            );

            setPoidsBrut(null);
            setPoidsNet(null);
            setBrutValide(false);

        } catch (err) {
            console.error(
                "Erreur recherche pesée :",
                err
            );

            setError(
                err.message
            );

            setPesee(null);
            setTicket(null);

        } finally {
            setSearching(false);
        }
    };

    // ========================================================
    // VALIDATION BRUT
    // ========================================================

    const validateBrut = async (
        currentWeight
    ) => {

        if (!pesee?.id) {
            setError(
                "Aucune pesée d'entrée sélectionnée."
            );

            return;
        }

        const brut =
            Number(currentWeight);

        if (
            !Number.isFinite(brut) ||
            brut <= 0
        ) {
            setError(
                "Le poids brut est invalide."
            );

            return;
        }

        if (
            String(statutPoids)
                .toUpperCase() !== "STABLE"
        ) {
            setError(
                "Le poids doit être stable avant validation."
            );

            return;
        }

        try {

            setValidating(true);
            setError("");

            const response =
                await fetch(
                    `${API_URL}/pesee/${pesee.id}/sortie`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json"
                        },
                        body: JSON.stringify({
                            poidsBrut: brut
                        })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Impossible de clôturer la pesée."
                );
            }

            setPesee(
                data.pesee
            );

            setTicket(
                data.pesee?.ticket ||
                data.ticket ||
                null
            );

            setPoidsBrut(
                Number(
                    data.poids_brut ??
                    brut
                )
            );

            setPoidsNet(
                Number(
                    data.poids_net
                )
            );

            setBrutValide(true);

            setSuccess(
                "Pesée de sortie enregistrée avec succès."
            );

        } catch (err) {
            console.error(
                "Erreur validation brut :",
                err
            );

            setError(
                err.message
            );

        } finally {
            setValidating(false);
        }
    };

    // ========================================================
    // RESET
    // ========================================================

    const reset = () => {

        setMatricule("");
        setPesee(null);
        setTicket(null);

        setPoidsBrut(null);
        setPoidsNet(null);
        setBrutValide(false);

        setError("");
        setSuccess("");
    };

    const tare =
        pesee
            ? Number(
                pesee.poids_tare
            )
            : null;

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6">

            <div className="max-w-6xl mx-auto">

                {/* HEADER */}

                <div className="flex items-center justify-between mb-6">

                    <div>

                        <p className="text-sm font-semibold text-slate-500">
                            MIZAN · PONT-BASCULE
                        </p>

                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">
                            Pesée de sortie
                        </h1>

                        <p className="text-sm text-slate-500 mt-1">
                            Enregistrement du poids brut et calcul du poids net
                        </p>

                    </div>

                    <button
                        type="button"
                        onClick={reset}
                        className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700 flex items-center gap-2"
                    >
                        <RotateCcw size={17} />
                        Réinitialiser
                    </button>

                </div>

                {/* ERROR */}

                {error && (
                    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 flex gap-3">

                        <AlertCircle
                            size={20}
                            className="text-red-600 shrink-0"
                        />

                        <p className="text-sm text-red-700">
                            {error}
                        </p>

                    </div>
                )}

                {/* SUCCESS */}

                {success && (
                    <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex gap-3">

                        <CheckCircle2
                            size={20}
                            className="text-emerald-600"
                        />

                        <p className="text-sm text-emerald-700">
                            {success}
                        </p>

                    </div>
                )}

                {/* RECHERCHE */}

                {!pesee && (

                    <div className="bg-white border border-slate-200 rounded-2xl p-6">

                        <div className="flex items-center gap-3 mb-5">

                            <Search
                                size={22}
                                className="text-slate-700"
                            />

                            <div>
                                <h2 className="font-bold text-slate-900">
                                    Rechercher le ticket
                                </h2>

                                <p className="text-sm text-slate-500">
                                    Entrez le matricule du tracteur revenu pour la deuxième pesée.
                                </p>
                            </div>

                        </div>

                        <div className="flex flex-col md:flex-row gap-3">

                            <input
                                value={matricule}
                                onChange={(e) =>
                                    setMatricule(
                                        e.target.value
                                    )
                                }
                                onKeyDown={(e) => {
                                    if (
                                        e.key === "Enter"
                                    ) {
                                        searchPesee();
                                    }
                                }}
                                placeholder="Ex. 23869 BAA 15"
                                className="flex-1 px-4 py-3 rounded-xl border border-slate-300 outline-none focus:border-slate-500"
                            />

                            <button
                                type="button"
                                disabled={
                                    searching
                                }
                                onClick={
                                    searchPesee
                                }
                                className="px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {searching ? (
                                    <>
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Recherche...
                                    </>
                                ) : (
                                    <>
                                        <Search size={18} />
                                        Rechercher
                                    </>
                                )}
                            </button>

                        </div>

                    </div>
                )}

                {/* PESEE TROUVEE */}

                {pesee && (

                    <>

                        {/* INFOS */}

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">

                            <Info
                                icon={
                                    <Truck size={18} />
                                }
                                label="Tracteur"
                                value={
                                    pesee.immatriculation_tracteur_scanned ||
                                    pesee.camion?.immatriculation ||
                                    "—"
                                }
                            />

                            <Info
                                icon={
                                    <User size={18} />
                                }
                                label="Chauffeur"
                                value={
                                    pesee.chauffeur
                                        ? `${pesee.chauffeur.prenom} ${pesee.chauffeur.nom}`
                                        : "—"
                                }
                            />

                            <Info
                                icon={
                                    <Package size={18} />
                                }
                                label="Marchandise"
                                value={
                                    pesee.marchandise?.nom ||
                                    "—"
                                }
                            />

                            <Info
                                icon={
                                    <Scale size={18} />
                                }
                                label="Tare"
                                value={
                                    Number.isFinite(
                                        tare
                                    )
                                        ? `${tare.toLocaleString(
                                            "fr-FR"
                                        )} kg`
                                        : "—"
                                }
                            />

                        </div>

                        {/* PESEE */}

                        <WeighingIQDesign
                            mode="exit"
                            poids={poids}
                            statut={
                                statutPoids
                            }
                            poidsTare={
                                tare
                            }
                            poidsBrut={
                                poidsBrut
                            }
                            poidsNet={
                                poidsNet
                            }
                            validated={
                                brutValide
                            }
                            validating={
                                validating
                            }
                            onValidate={
                                validateBrut
                            }
                        />

                        {/* RESULTAT FINAL */}

                        {brutValide && (

                            <div className="mt-5 bg-white border border-emerald-200 rounded-2xl p-6">

                                <div className="flex items-center gap-3">

                                    <CheckCircle2
                                        size={24}
                                        className="text-emerald-600"
                                    />

                                    <div>
                                        <h2 className="font-bold text-slate-900">
                                            Pesée terminée
                                        </h2>

                                        <p className="text-sm text-slate-500">
                                            Le ticket est maintenant clôturé.
                                        </p>
                                    </div>

                                </div>

                                <div className="grid md:grid-cols-3 gap-4 mt-5">

                                    <Info
                                        label="Tare"
                                        value={`${tare.toLocaleString(
                                            "fr-FR"
                                        )} kg`}
                                    />

                                    <Info
                                        label="Brut"
                                        value={`${poidsBrut.toLocaleString(
                                            "fr-FR"
                                        )} kg`}
                                    />

                                    <Info
                                        label="Net"
                                        value={`${poidsNet.toLocaleString(
                                            "fr-FR"
                                        )} kg`}
                                    />

                                </div>

                                <div className="mt-5">

                                    <button
                                        type="button"
                                        onClick={() => {
                                            window.open(
                                                `${API_URL}/tickets/pesee/${pesee.id}/pdf`,
                                                "_blank"
                                            );
                                        }}
                                        className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800"
                                    >
                                        Imprimer le ticket final
                                    </button>

                                </div>

                            </div>

                        )}

                    </>
                )}

            </div>
        </div>
    );
}


// ============================================================
// INFO
// ============================================================

function Info({
    icon,
    label,
    value
}) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl p-4">

            <div className="flex items-center gap-2 text-slate-400">

                {icon}

                <p className="text-xs uppercase tracking-wide font-semibold">
                    {label}
                </p>

            </div>

            <p className="font-bold text-slate-900 mt-2">
                {value || "—"}
            </p>

        </div>
    );
}