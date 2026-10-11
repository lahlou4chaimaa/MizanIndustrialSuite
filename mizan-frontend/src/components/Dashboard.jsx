import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Activity,
    AlertCircle,
    AlertTriangle,
    ArrowDownToLine,
    ArrowRight,
    ArrowUpFromLine,
    CheckCircle2,
    Clock3,
    Package,
    RefreshCw,
    Search,
    Server,
    Ship,
    Ticket,
    Truck,
    UserRound,
    Weight,
    Wifi,
    X,
    XCircle,
} from "lucide-react";

import { socket } from "./socket";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

/* ============================================================
   HELPERS
============================================================ */

function getToken() {
    return localStorage.getItem("token");
}

function formatNumber(value) {
    if (
        value === null ||
        value === undefined ||
        value === "" ||
        Number.isNaN(Number(value))
    ) {
        return "—";
    }

    return Number(value).toLocaleString("fr-FR");
}

function formatWeight(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "—";
    }

    return `${formatNumber(value)} kg`;
}

function formatTonnage(value) {
    if (
        value === null ||
        value === undefined ||
        value === "" ||
        Number.isNaN(Number(value))
    ) {
        return "0 T";
    }

    return `${Number(value).toLocaleString("fr-FR", {
        maximumFractionDigits: 2,
    })} T`;
}

function formatDate(value) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatTime(value) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatWaitingTime(entryValue, exitValue = null) {
    if (!entryValue) {
        return "—";
    }

    const entryDate = new Date(entryValue);

    if (Number.isNaN(entryDate.getTime())) {
        return "—";
    }

    const endDate = exitValue
        ? new Date(exitValue)
        : new Date();

    if (Number.isNaN(endDate.getTime())) {
        return "—";
    }

    const diffMs = Math.max(
        0,
        endDate.getTime() - entryDate.getTime()
    );

    const totalMinutes = Math.floor(
        diffMs / 60000
    );

    if (totalMinutes < 1) {
        return "< 1 min";
    }

    if (totalMinutes < 60) {
        return `${totalMinutes} min`;
    }

    const hours = Math.floor(
        totalMinutes / 60
    );

    const minutes =
        totalMinutes % 60;

    if (minutes === 0) {
        return `${hours} h`;
    }

    return `${hours} h ${minutes} min`;
}


function getWaitingMinutes(entryValue, exitValue = null) {
    if (!entryValue) {
        return 0;
    }

    const entryDate = new Date(entryValue);

    if (Number.isNaN(entryDate.getTime())) {
        return 0;
    }

    const endDate = exitValue
        ? new Date(exitValue)
        : new Date();

    if (Number.isNaN(endDate.getTime())) {
        return 0;
    }

    return Math.max(
        0,
        Math.floor(
            (
                endDate.getTime() -
                entryDate.getTime()
            ) / 60000
        )
    );
}
function getTodayStart() {
    const now = new Date();

    return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0
    );
}

const isToday = (dateValue) => {
    if (!dateValue) {
        return false;
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return false;
    }

    const now = new Date();

    return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()
    );
};

function getTruckPlate(pesee) {
    return (
        pesee?.camion?.immatriculation ||
        pesee?.immatriculation_tracteur_scanned ||
        pesee?.ticket?.matricule_tracteur ||
        "—"
    );
}

function getTrailerPlate(pesee) {
    return (
        pesee?.immatriculation_remorque_scanned ||
        pesee?.ticket?.matricule_remorque ||
        pesee?.camion?.immatriculation_remorque ||
        "—"
    );
}

function getDriverName(pesee) {
    if (pesee?.chauffeur) {
        const fullName = [
            pesee.chauffeur.prenom,
            pesee.chauffeur.nom,
        ]
            .filter(Boolean)
            .join(" ");

        if (fullName) {
            return fullName;
        }
    }

    if (pesee?.ticket) {
        const fullName = [
            pesee.ticket.prenom_chauffeur,
            pesee.ticket.nom_chauffeur,
        ]
            .filter(Boolean)
            .join(" ");

        if (fullName) {
            return fullName;
        }
    }

    return "—";
}

function getDriverCin(pesee) {
    return (
        pesee?.chauffeur?.cin ||
        pesee?.ticket?.cin_chauffeur ||
        pesee?.ticket?.chauffeur_cin ||
        "—"
    );
}

function getMerchandiseName(pesee) {
    return (
        pesee?.marchandise?.nom ||
        pesee?.ticket?.marchandise?.nom ||
        "—"
    );
}

function getPrestationNumber(pesee) {
    return (
        pesee?.prestation?.numero_prestation ||
        pesee?.ticket?.prestation?.numero_prestation ||
        (pesee?.prestation_id
            ? `#${pesee.prestation_id}`
            : "Non affectée")
    );
}

function getTicketNumber(pesee) {
    return (
        pesee?.ticket?.numero_ticket ||
        pesee?.ticket?.code_qr ||
        pesee?.code_qr ||
        "—"
    );
}

function getPeseeDate(pesee) {
    return (
        pesee?.date_sortie ||
        pesee?.date_entree ||
        pesee?.created_at ||
        null
    );
}

function getEntryDate(pesee) {
    return (
        pesee?.date_entree ||
        pesee?.created_at ||
        null
    );
}

function canMakeSortie(pesee) {
    if (!pesee?.id) {
        return false;
    }

    if (
        pesee.statut !== "ENTREE" &&
        pesee.statut !== "ENCOURS"
    ) {
        return false;
    }

    if (
        pesee.poids_tare === null ||
        pesee.poids_tare === undefined
    ) {
        return false;
    }

    return true;
}

function getPeseeStatusLabel(status) {
    switch (status) {
        case "ENTREE":
            return "Entrée";

        case "ENCOURS":
            return "En pesée";

        case "VALIDE":
            return "Terminée";

        case "ANNULEE":
            return "Annulée";

        default:
            return status || "Inconnu";
    }
}

function getPrestationStatusLabel(status) {
    switch (status) {
        case "CREEE":
            return "Créée";

        case "AFFECTEE":
            return "Affectée";

        case "PESAGE_ENTREE":
            return "Pesée entrée";

        case "EN_COURS":
            return "En cours";

        case "PESAGE_SORTIE":
            return "Pesée sortie";

        case "TERMINEE":
            return "Terminée";

        case "ANNULEE":
            return "Annulée";

        default:
            return status || "Inconnu";
    }
}

/* ============================================================
   STATUS BADGE
============================================================ */

function StatusBadge({
    status,
    type = "pesee",
}) {
    let className =
        "bg-slate-100 text-slate-600 border-slate-200";

    if (type === "pesee") {
        if (status === "ENTREE") {
            className =
                "bg-sky-50 text-sky-700 border-sky-200";
        }

        if (status === "ENCOURS") {
            className =
                "bg-amber-50 text-amber-700 border-amber-200";
        }

        if (status === "VALIDE") {
            className =
                "bg-emerald-50 text-emerald-700 border-emerald-200";
        }

        if (status === "ANNULEE") {
            className =
                "bg-red-50 text-red-700 border-red-200";
        }
    }

    if (type === "prestation") {
        if (status === "CREEE") {
            className =
                "bg-slate-100 text-slate-700 border-slate-200";
        }

        if (
            status === "AFFECTEE" ||
            status === "PESAGE_ENTREE"
        ) {
            className =
                "bg-sky-50 text-sky-700 border-sky-200";
        }

        if (
            status === "EN_COURS" ||
            status === "PESAGE_SORTIE"
        ) {
            className =
                "bg-amber-50 text-amber-700 border-amber-200";
        }

        if (status === "TERMINEE") {
            className =
                "bg-emerald-50 text-emerald-700 border-emerald-200";
        }

        if (status === "ANNULEE") {
            className =
                "bg-red-50 text-red-700 border-red-200";
        }
    }

    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${className}`}
        >
            {type === "pesee"
                ? getPeseeStatusLabel(status)
                : getPrestationStatusLabel(status)}
        </span>
    );
}

/* ============================================================
   KPI
============================================================ */

function Kpi({
    label,
    value,
    subtitle,
    icon: Icon,
    iconClass,
}) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.08em] font-bold text-slate-400">
                        {label}
                    </p>

                    <p className="mt-1 text-2xl font-black text-slate-900">
                        {value}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                        {subtitle}
                    </p>
                </div>

                <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconClass}`}
                >
                    <Icon size={19} />
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   ALERT CARD
============================================================ */

function AlertItem({
    icon: Icon,
    title,
    description,
    tone = "amber",
    onClick,
}) {
    const tones = {
        red: {
            wrapper:
                "border-red-200 bg-red-50/70",
            icon:
                "bg-red-100 text-red-600",
            title:
                "text-red-800",
            description:
                "text-red-700",
        },
        amber: {
            wrapper:
                "border-amber-200 bg-amber-50/70",
            icon:
                "bg-amber-100 text-amber-600",
            title:
                "text-amber-800",
            description:
                "text-amber-700",
        },
        blue: {
            wrapper:
                "border-sky-200 bg-sky-50/70",
            icon:
                "bg-sky-100 text-sky-600",
            title:
                "text-sky-800",
            description:
                "text-sky-700",
        },
    };

    const current =
        tones[tone] || tones.amber;

    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full text-left rounded-lg border px-3 py-3 flex items-start gap-3 transition hover:shadow-sm ${current.wrapper}`}
        >
            <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${current.icon}`}
            >
                <Icon size={15} />
            </div>

            <div className="min-w-0 flex-1">
                <p
                    className={`text-xs font-black ${current.title}`}
                >
                    {title}
                </p>

                <p
                    className={`text-[11px] mt-0.5 ${current.description}`}
                >
                    {description}
                </p>
            </div>

            <ArrowRight
                size={14}
                className={`mt-1 shrink-0 ${current.description}`}
            />
        </button>
    );
}

/* ============================================================
   DASHBOARD
============================================================ */

export default function Dashboard({
    utilisateur,
    onNavigatePesee,
    onSelectPesee,
}) {
    const [pesees, setPesees] = useState([]);
    const [prestations, setPrestations] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [lastUpdate, setLastUpdate] =
        useState(new Date());

    /* ========================================================
       FICHE CAMION
    ======================================================== */

    const [selectedTruck, setSelectedTruck] =
        useState(null);

    /* ========================================================
       FORCE REFRESH FOR WAITING TIMES
    ======================================================== */

    const [, setClock] =
        useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => {
            setClock(Date.now());
        }, 30000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    /* ========================================================
       LOAD PESEES
    ======================================================== */

    const loadPesees = useCallback(
        async (silent = false) => {
            try {
                if (!silent) {
                    setLoading(true);
                }

                const token = getToken();

                const response = await fetch(
                    `${API_URL}/pesee`,
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

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data?.message ||
                        data?.error ||
                        "Impossible de charger les pesées."
                    );
                }

                const liste =
                    Array.isArray(
                        data?.pesees
                    )
                        ? data.pesees
                        : Array.isArray(
                            data?.data
                        )
                            ? data.data
                            : [];

                setPesees(liste);
                setLastUpdate(
                    new Date()
                );
                setError("");

            } catch (err) {
                console.error(
                    "[DASHBOARD] Pesees:",
                    err
                );

                setError(
                    err?.message ||
                    "Impossible de charger les pesées."
                );

            } finally {
                if (!silent) {
                    setLoading(false);
                }
            }
        },
        []
    );

    /* ========================================================
       LOAD PRESTATIONS
    ======================================================== */

    const loadPrestations =
        useCallback(
            async (silent = false) => {
                try {
                    const token =
                        getToken();

                    const response =
                        await fetch(
                            `${API_URL}/prestations`,
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

                    const data =
                        await response.json();

                    if (!response.ok) {
                        throw new Error(
                            data?.message ||
                            data?.error ||
                            "Impossible de charger les prestations."
                        );
                    }

                    const liste =
                        Array.isArray(
                            data?.prestations
                        )
                            ? data.prestations
                            : Array.isArray(
                                data?.data
                            )
                                ? data.data
                                : Array.isArray(
                                    data
                                )
                                    ? data
                                    : [];

                    setPrestations(
                        liste
                    );

                } catch (err) {
                    console.error(
                        "[DASHBOARD] Prestations:",
                        err
                    );

                    if (!silent) {
                        setError(
                            err?.message ||
                            "Impossible de charger les prestations."
                        );
                    }
                }
            },
            []
        );

    /* ========================================================
       LOAD DASHBOARD
    ======================================================== */

    const loadDashboard =
        useCallback(
            async (silent = false) => {
                if (!silent) {
                    setRefreshing(
                        true
                    );
                }

                await Promise.all([
                    loadPesees(
                        silent
                    ),
                    loadPrestations(
                        silent
                    ),
                ]);

                if (!silent) {
                    setRefreshing(
                        false
                    );
                }
            },
            [
                loadPesees,
                loadPrestations,
            ]
        );

    useEffect(() => {
        loadDashboard(false);
    }, [loadDashboard]);

    /* ========================================================
       AUTO REFRESH
    ======================================================== */

    useEffect(() => {
        const interval =
            setInterval(() => {
                loadDashboard(true);
            }, 15000);

        return () => {
            clearInterval(
                interval
            );
        };
    }, [loadDashboard]);

    /* ========================================================
       SOCKET.IO
    ======================================================== */

    useEffect(() => {
        const refresh = () => {
            loadDashboard(true);
        };

        socket.on(
            "pesee-entree-enregistree",
            refresh
        );

        socket.on(
            "pesee-sortie-enregistree",
            refresh
        );

        socket.on(
            "prestation-affectee",
            refresh
        );

        socket.on(
            "prestation-statut-change",
            refresh
        );

        return () => {
            socket.off(
                "pesee-entree-enregistree",
                refresh
            );

            socket.off(
                "pesee-sortie-enregistree",
                refresh
            );

            socket.off(
                "prestation-affectee",
                refresh
            );

            socket.off(
                "prestation-statut-change",
                refresh
            );
        };
    }, [loadDashboard]);

    console.log("========== DASHBOARD DEBUG ==========");
    console.log("pesees =", pesees);
    console.log("nombre pesees =", pesees?.length);

    if (pesees?.length > 0) {
        console.log("PREMIERE PESEE =", pesees[0]);
        console.log("date_entree =", pesees[0]?.date_entree);
        console.log("date_sortie =", pesees[0]?.date_sortie);
        console.log("poids_net =", pesees[0]?.poids_net);
        console.log("poidsNet =", pesees[0]?.poidsNet);
        console.log("statut =", pesees[0]?.statut);
    }

    console.log("====================================");

    const statistics = useMemo(() => {
        // =====================================================
        // TEST : toutes les pesées récupérées
        // =====================================================

        const todayEntries = pesees.filter(
            (p) => !!p?.date_entree
        );

        const todaySorties = pesees.filter(
            (p) => !!p?.date_sortie
        );

        const enCours = pesees.filter((p) => {
            const statut = String(
                p?.statut || ""
            ).toUpperCase();

            return (
                statut === "ENTREE" ||
                statut === "ENCOURS"
            );
        });

        const todayNetKg = todaySorties.reduce(
            (total, pesee) => {
                return (
                    total +
                    Number(
                        pesee?.poids_net ??
                        0
                    )
                );
            },
            0
        );

        const activePrestations =
            prestations.filter((p) => {
                const statut = String(
                    p?.statut || ""
                ).toUpperCase();

                return (
                    statut === "AFFECTEE" ||
                    statut === "PESAGE_ENTREE" ||
                    statut === "EN_COURS" ||
                    statut === "PESAGE_SORTIE"
                );
            });

        console.log("===== TEST KPI =====");
        console.log(
            "ENTREES =",
            todayEntries.length
        );
        console.log(
            "SORTIES =",
            todaySorties.length
        );
        console.log(
            "NET KG =",
            todayNetKg
        );
        console.log("====================");

        return {
            todayEntries,
            todaySorties,
            enCours,
            activePrestations,
            todayNetKg,
        };
    }, [
        pesees,
        prestations,
    ]);
    /* ========================================================
       ACTIVE TRUCKS
    ======================================================== */

    const activeTrucks =
        useMemo(() => {
            let liste = [
                ...statistics.enCours,
            ];

            if (search.trim()) {
                const query =
                    search
                        .toLowerCase()
                        .trim();

                liste =
                    liste.filter(
                        (p) => {
                            const values =
                                [
                                    getTruckPlate(
                                        p
                                    ),
                                    getTrailerPlate(
                                        p
                                    ),
                                    getDriverName(
                                        p
                                    ),
                                    getPrestationNumber(
                                        p
                                    ),
                                    getTicketNumber(
                                        p
                                    ),
                                ];

                            return values.some(
                                (
                                    value
                                ) =>
                                    String(
                                        value
                                    )
                                        .toLowerCase()
                                        .includes(
                                            query
                                        )
                            );
                        }
                    );
            }

            liste.sort(
                (a, b) => {
                    const dateA =
                        new Date(
                            getEntryDate(
                                a
                            ) || 0
                        ).getTime();

                    const dateB =
                        new Date(
                            getEntryDate(
                                b
                            ) || 0
                        ).getTime();

                    return (
                        dateA -
                        dateB
                    );
                }
            );

            return liste;
        }, [
            statistics.enCours,
            search,
        ]);

    /* ========================================================
       ALERTES OPÉRATIONNELLES
    ======================================================== */

    const operationalAlerts =
        useMemo(() => {
            const alerts = [];

            const longWaiting =
                statistics.enCours.filter(
                    (p) =>
                        getWaitingMinutes(
                            getEntryDate(
                                p
                            )
                        ) >= 30
                );

            if (
                longWaiting.length >
                0
            ) {
                alerts.push({
                    id: "long-wait",
                    tone: "red",
                    icon: Clock3,
                    title: `${longWaiting.length} camion${longWaiting.length > 1
                        ? "s"
                        : ""
                        } en attente depuis +30 min`,
                    description:
                        "Une intervention de l'agent peut être nécessaire.",
                    target:
                        "waiting",
                });
            }

            const mediumWaiting =
                statistics.enCours.filter(
                    (p) => {
                        const minutes =
                            getWaitingMinutes(
                                getEntryDate(
                                    p
                                )
                            );

                        return (
                            minutes >=
                            15 &&
                            minutes < 30
                        );
                    }
                );

            if (
                mediumWaiting.length >
                0
            ) {
                alerts.push({
                    id: "medium-wait",
                    tone: "amber",
                    icon: Clock3,
                    title: `${mediumWaiting.length} camion${mediumWaiting.length > 1
                        ? "s"
                        : ""
                        } en attente depuis +15 min`,
                    description:
                        "Vérifier la file de traitement.",
                    target:
                        "waiting",
                });
            }

            const incomplete =
                statistics.enCours.filter(
                    (p) =>
                        getDriverName(
                            p
                        ) === "—" ||
                        getPrestationNumber(
                            p
                        ) ===
                        "Non affectée"
                );

            if (
                incomplete.length >
                0
            ) {
                alerts.push({
                    id: "incomplete",
                    tone: "blue",
                    icon: AlertCircle,
                    title: `${incomplete.length} dossier${incomplete.length > 1
                        ? "s"
                        : ""
                        } incomplet${incomplete.length > 1
                            ? "s"
                            : ""
                        }`,
                    description:
                        "Chauffeur ou prestation non renseigné.",
                    target:
                        "incomplete",
                });
            }

            const quotaAlerts =
                prestations.filter(
                    (p) => {
                        if (
                            p?.statut ===
                            "ANNULEE"
                        ) {
                            return false;
                        }

                        const planned =
                            Number(
                                p?.quantite_prevue ||
                                0
                            );

                        const realised =
                            Number(
                                p?.quantite_realisee ||
                                0
                            );

                        if (
                            planned <= 0
                        ) {
                            return false;
                        }

                        return (
                            realised /
                            planned >=
                            0.8
                        );
                    }
                );

            if (
                quotaAlerts.length >
                0
            ) {
                alerts.push({
                    id: "quota",
                    tone: "amber",
                    icon: Package,
                    title: `${quotaAlerts.length} prestation${quotaAlerts.length > 1
                        ? "s"
                        : ""
                        } proche${quotaAlerts.length > 1
                            ? "s"
                            : ""
                        } du quota`,
                    description:
                        "Au moins 80 % de la quantité prévue est réalisée.",
                    target:
                        "prestations",
                });
            }

            return alerts.slice(
                0,
                4
            );
        }, [
            statistics.enCours,
            prestations,
        ]);

    /* ========================================================
       RECENT ACTIVITY
    ======================================================== */

    const recentActivity =
        useMemo(() => {
            const liste = [
                ...pesees,
            ];

            liste.sort(
                (a, b) => {
                    const dateA =
                        new Date(
                            getPeseeDate(
                                a
                            ) || 0
                        ).getTime();

                    const dateB =
                        new Date(
                            getPeseeDate(
                                b
                            ) || 0
                        ).getTime();

                    return (
                        dateB -
                        dateA
                    );
                }
            );

            return liste.slice(
                0,
                6
            );
        }, [pesees]);

    /* ========================================================
       PRESTATIONS
    ======================================================== */

    const visiblePrestations =
        useMemo(() => {
            return [
                ...prestations,
            ]
                .filter(
                    (p) =>
                        p?.statut !==
                        "ANNULEE"
                )
                .sort(
                    (a, b) => {
                        const aDate =
                            new Date(
                                a?.updated_at ||
                                a?.created_at ||
                                0
                            ).getTime();

                        const bDate =
                            new Date(
                                b?.updated_at ||
                                b?.created_at ||
                                0
                            ).getTime();

                        return (
                            bDate -
                            aDate
                        );
                    }
                )
                .slice(
                    0,
                    5
                );
        }, [prestations]);

    /* ========================================================
       CURRENT WEIGHT
    ======================================================== */

    const currentPesee =
        useMemo(() => {
            const candidates =
                pesees.filter(
                    (p) =>
                        p?.statut ===
                        "ENCOURS"
                );

            candidates.sort(
                (a, b) => {
                    const dateA =
                        new Date(
                            a?.updated_at ||
                            a?.date_entree ||
                            0
                        ).getTime();

                    const dateB =
                        new Date(
                            b?.updated_at ||
                            b?.date_entree ||
                            0
                        ).getTime();

                    return (
                        dateB -
                        dateA
                    );
                }
            );

            return (
                candidates[0] ||
                null
            );
        }, [pesees]);

    /* ========================================================
       FLOW COUNTERS
    ======================================================== */

    const flowCounters =
        useMemo(() => {
            const entree =
                pesees.filter(
                    (p) =>
                        p?.statut ===
                        "ENTREE"
                ).length;

            const pesee =
                pesees.filter(
                    (p) =>
                        p?.statut ===
                        "ENCOURS"
                ).length;

            const sortie =
                statistics
                    .todaySorties
                    .length;

            return {
                entree,
                pesee,
                sortie,
            };
        }, [
            pesees,
            statistics.todaySorties,
        ]);

    /* ========================================================
       ACTION SORTIE
    ======================================================== */

    const handleSelectPesee =
        (pesee) => {
            if (!pesee?.id) {
                console.error(
                    "[DASHBOARD] Pesée sans ID.",
                    pesee
                );
                return;
            }

            if (
                !canMakeSortie(
                    pesee
                )
            ) {
                console.warn(
                    "[DASHBOARD] Pesée non disponible pour sortie.",
                    pesee
                );
                return;
            }

            console.log(
                "[DASHBOARD] Pesée sélectionnée pour sortie :",
                {
                    peseeId:
                        pesee.id,
                    camionId:
                        pesee.camion_id,
                    prestationId:
                        pesee.prestation_id,
                    matricule:
                        getTruckPlate(
                            pesee
                        ),
                }
            );

            if (
                typeof onSelectPesee ===
                "function"
            ) {
                onSelectPesee(
                    pesee
                );
            }
        };

    /* ========================================================
       OUVRIR FICHE CAMION
    ======================================================== */

    const handleOpenTruck =
        (pesee) => {
            if (!pesee?.id) {
                return;
            }

            setSelectedTruck(
                pesee
            );
        };

    /* ========================================================
       REFRESH
    ======================================================== */

    const handleRefresh =
        async () => {
            await loadDashboard(
                false
            );
        };

    /* ========================================================
       RENDER
    ======================================================== */

    return (
        <>
            <div
                className="min-h-screen w-screen bg-slate-100 overflow-x-hidden"
                style={{
                    position:
                        "relative",
                    left: "50%",
                    transform:
                        "translateX(-50%)",
                }}
            >
                {/* ==================================================
                    HEADER
                ================================================== */}

                <header className="bg-blue-950 text-white">

                    <div className="w-full px-5 sm:px-8 lg:px-10 xl:px-14 2xl:px-20 py-5">

                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                            <div className="flex items-center gap-4">

                                <div className="w-11 h-11 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
                                    <Ship
                                        size={
                                            21
                                        }
                                        className="text-white"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center gap-2">

                                        <p className="text-[11px] font-black tracking-[0.2em] text-orange-400">
                                            MARSA MAROC
                                        </p>

                                        <span className="text-blue-500">
                                            •
                                        </span>

                                        <p className="text-[11px] font-bold tracking-[0.15em] text-blue-300">
                                            GATE DE PESAGE
                                        </p>

                                    </div>

                                    <h1 className="text-xl md:text-2xl font-black mt-0.5">
                                        Centre de supervision
                                    </h1>
                                </div>

                            </div>

                            <div className="flex flex-wrap items-center gap-3">

                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 border border-white/10">
                                    <Wifi
                                        size={
                                            14
                                        }
                                        className="text-emerald-400"
                                    />

                                    <span className="text-xs font-semibold text-blue-100">
                                        Système connecté
                                    </span>
                                </div>

                                <div className="px-3 py-2 rounded-lg bg-white/10 border border-white/10">

                                    <span className="text-xs text-blue-200">
                                        Mise à jour{" "}
                                    </span>

                                    <span className="text-xs font-bold text-white">
                                        {lastUpdate.toLocaleTimeString(
                                            "fr-FR",
                                            {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            }
                                        )}
                                    </span>

                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        handleRefresh
                                    }
                                    disabled={
                                        refreshing
                                    }
                                    className="px-3.5 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-xs font-bold flex items-center gap-2 hover:bg-white/20 disabled:opacity-50 transition"
                                >
                                    <RefreshCw
                                        size={
                                            14
                                        }
                                        className={
                                            refreshing
                                                ? "animate-spin"
                                                : ""
                                        }
                                    />

                                    Actualiser
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        onNavigatePesee
                                    }
                                    className="px-4 py-2 rounded-lg bg-orange-500 text-white text-xs font-black flex items-center gap-2 hover:bg-orange-400 transition"
                                >
                                    <Weight
                                        size={
                                            15
                                        }
                                    />

                                    Nouvelle pesée
                                </button>

                            </div>

                        </div>

                        <div className="mt-3 text-xs text-blue-300">

                            Agent connecté:{" "}

                            <span className="font-bold text-white">
                                {utilisateur?.nom ||
                                    utilisateur?.email ||
                                    "Agent"}
                            </span>

                        </div>

                    </div>

                    <div className="h-1 bg-orange-500" />

                </header>

                {/* ==================================================
                    BODY
                ================================================== */}

                <main className="w-full px-5 sm:px-8 lg:px-10 xl:px-14 2xl:px-20 py-6">

                    {/* ERROR */}

                    {error && (
                        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3">

                            <AlertCircle
                                size={
                                    18
                                }
                                className="text-red-600 shrink-0"
                            />

                            <div className="flex-1">

                                <p className="text-sm font-bold text-red-800">
                                    Erreur de chargement
                                </p>

                                <p className="text-xs text-red-700 mt-0.5">
                                    {error}
                                </p>

                            </div>

                        </div>
                    )}

                    {/* ==================================================
                        KPI
                    ================================================== */}

                    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">

                        <Kpi
                            label="Camions présents"
                            value={
                                statistics
                                    .enCours
                                    .length
                            }
                            subtitle="Actuellement dans le workflow"
                            icon={
                                Truck
                            }
                            iconClass="bg-blue-950 text-white"
                        />

                        <Kpi
                            label="Entrées aujourd'hui"
                            value={
                                statistics
                                    .todayEntries
                                    .length
                            }
                            subtitle="Mouvements enregistrés"
                            icon={
                                ArrowDownToLine
                            }
                            iconClass="bg-sky-50 text-sky-700"
                        />

                        <Kpi
                            label="Sorties aujourd'hui"
                            value={
                                statistics
                                    .todaySorties
                                    .length
                            }
                            subtitle="Pesées réellement clôturées"
                            icon={
                                ArrowUpFromLine
                            }
                            iconClass="bg-emerald-50 text-emerald-700"
                        />

                        <Kpi
                            label="Tonnage net"
                            value={formatTonnage(
                                statistics
                                    .todayNetKg /
                                1000
                            )}
                            subtitle="Marchandise sortie aujourd'hui"
                            icon={
                                Package
                            }
                            iconClass="bg-orange-50 text-orange-600"
                        />

                    </section>

                    {/* ==================================================
                        ALERTES OPÉRATIONNELLES
                    ================================================== */}

                    <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-5">

                        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

                            <div>

                                <div className="flex items-center gap-2">

                                    <AlertTriangle
                                        size={
                                            18
                                        }
                                        className={
                                            operationalAlerts.length >
                                                0
                                                ? "text-amber-600"
                                                : "text-emerald-600"
                                        }
                                    />

                                    <h2 className="font-black text-slate-900">
                                        Alertes opérationnelles
                                    </h2>

                                    <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${operationalAlerts.length > 0
                                            ? "bg-amber-100 text-amber-700"
                                            : "bg-emerald-100 text-emerald-700"
                                            }`}
                                    >
                                        {
                                            operationalAlerts.length
                                        }
                                    </span>

                                </div>

                                <p className="text-xs text-slate-400 mt-1">
                                    Points nécessitant éventuellement l'attention de l'agent
                                </p>

                            </div>

                            <div className="text-[11px] text-slate-400">
                                Analyse automatique des données
                            </div>

                        </div>

                        <div className="p-4">

                            {operationalAlerts.length >
                                0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">

                                    {operationalAlerts.map(
                                        (
                                            alert
                                        ) => (
                                            <AlertItem
                                                key={
                                                    alert.id
                                                }
                                                icon={
                                                    alert.icon
                                                }
                                                title={
                                                    alert.title
                                                }
                                                description={
                                                    alert.description
                                                }
                                                tone={
                                                    alert.tone
                                                }
                                                onClick={() => {
                                                    if (
                                                        alert.target ===
                                                        "waiting" ||
                                                        alert.target ===
                                                        "incomplete"
                                                    ) {
                                                        document
                                                            .getElementById(
                                                                "camions-a-traiter"
                                                            )
                                                            ?.scrollIntoView(
                                                                {
                                                                    behavior:
                                                                        "smooth",
                                                                    block:
                                                                        "center",
                                                                }
                                                            );
                                                    }

                                                    if (
                                                        alert.target ===
                                                        "prestations"
                                                    ) {
                                                        document
                                                            .getElementById(
                                                                "prestations-dashboard"
                                                            )
                                                            ?.scrollIntoView(
                                                                {
                                                                    behavior:
                                                                        "smooth",
                                                                    block:
                                                                        "center",
                                                                }
                                                            );
                                                    }
                                                }}
                                            />
                                        )
                                    )}

                                </div>
                            ) : (
                                <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">

                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                        <CheckCircle2
                                            size={
                                                16
                                            }
                                        />
                                    </div>

                                    <div>

                                        <p className="text-xs font-black text-emerald-800">
                                            Aucun point d'attention détecté
                                        </p>

                                        <p className="text-[11px] text-emerald-700 mt-0.5">
                                            Les mouvements ouverts sont dans les délais surveillés.
                                        </p>

                                    </div>

                                </div>
                            )}

                        </div>

                    </section>

                    {/* ==================================================
                        FLUX + BALANCE
                    ================================================== */}

                    <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.8fr)_minmax(360px,0.8fr)] gap-5 mb-5">

                        {/* FLUX */}

                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

                            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">

                                <div>

                                    <div className="flex items-center gap-2">

                                        <Activity
                                            size={
                                                18
                                            }
                                            className="text-blue-950"
                                        />

                                        <h2 className="font-black text-slate-900">
                                            Flux du pont-bascule
                                        </h2>

                                    </div>

                                    <p className="text-xs text-slate-400 mt-1">
                                        Vue synthétique du trafic opérationnel
                                    </p>

                                </div>

                                <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">

                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />

                                    Temps réel

                                </div>

                            </div>

                            <div className="p-6">

                                <div className="grid grid-cols-3 gap-3">

                                    <div className="text-center">

                                        <div className="mx-auto w-10 h-10 rounded-full bg-sky-50 text-sky-700 flex items-center justify-center">
                                            <ArrowDownToLine
                                                size={
                                                    18
                                                }
                                            />
                                        </div>

                                        <p className="mt-2 text-2xl font-black text-slate-900">
                                            {
                                                flowCounters.entree
                                            }
                                        </p>

                                        <p className="text-xs font-semibold text-slate-400">
                                            Entrée
                                        </p>

                                    </div>

                                    <div className="text-center">

                                        <div className="mx-auto w-10 h-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
                                            <Weight
                                                size={
                                                    18
                                                }
                                            />
                                        </div>

                                        <p className="mt-2 text-2xl font-black text-slate-900">
                                            {
                                                flowCounters.pesee
                                            }
                                        </p>

                                        <p className="text-xs font-semibold text-slate-400">
                                            En pesée
                                        </p>

                                    </div>

                                    <div className="text-center">

                                        <div className="mx-auto w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                                            <ArrowUpFromLine
                                                size={
                                                    18
                                                }
                                            />
                                        </div>

                                        <p className="mt-2 text-2xl font-black text-slate-900">
                                            {
                                                flowCounters.sortie
                                            }
                                        </p>

                                        <p className="text-xs font-semibold text-slate-400">
                                            Sorties
                                        </p>

                                    </div>

                                </div>

                                <div className="relative mt-8">

                                    <div className="absolute left-[12%] right-[12%] top-3 h-0.5 bg-slate-200" />

                                    <div className="relative grid grid-cols-3">

                                        <div className="flex justify-start">
                                            <div className="w-6 h-6 rounded-full bg-sky-500 border-4 border-white ring-1 ring-sky-200" />
                                        </div>

                                        <div className="flex justify-center">
                                            <div className="w-6 h-6 rounded-full bg-amber-500 border-4 border-white ring-1 ring-amber-200" />
                                        </div>

                                        <div className="flex justify-end">
                                            <div className="w-6 h-6 rounded-full bg-emerald-500 border-4 border-white ring-1 ring-emerald-200" />
                                        </div>

                                    </div>

                                    <div className="grid grid-cols-3 mt-3">

                                        <div>

                                            <p className="text-sm font-bold text-slate-800">
                                                Entrée
                                            </p>

                                            <p className="text-xs text-slate-400 mt-0.5">
                                                Identification & ticket
                                            </p>

                                        </div>

                                        <div className="text-center">

                                            <p className="text-sm font-bold text-slate-800">
                                                Pesée
                                            </p>

                                            <p className="text-xs text-slate-400 mt-0.5">
                                                Tare / brut
                                            </p>

                                        </div>

                                        <div className="text-right">

                                            <p className="text-sm font-bold text-slate-800">
                                                Sortie
                                            </p>

                                            <p className="text-xs text-slate-400 mt-0.5">
                                                Net validé
                                            </p>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                        {/* BALANCE LIVE */}

                        <div className="bg-blue-950 text-white rounded-xl shadow-sm overflow-hidden">

                            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">

                                <div>

                                    <div className="flex items-center gap-2">

                                        <Server
                                            size={
                                                18
                                            }
                                            className="text-orange-400"
                                        />

                                        <h2 className="font-black">
                                            Pont-bascule en direct
                                        </h2>

                                    </div>

                                    <p className="text-xs text-blue-300 mt-1">
                                        Lecture actuelle
                                    </p>

                                </div>

                                <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide font-bold text-emerald-300">

                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />

                                    En ligne

                                </span>

                            </div>

                            <div className="p-5">

                                <div className="text-center py-2">

                                    <p className="text-4xl md:text-5xl font-black tracking-tight">

                                        {currentPesee
                                            ? formatNumber(
                                                currentPesee.poids_brut ||
                                                currentPesee.poids_tare
                                            )
                                            : "0"}

                                        <span className="text-lg ml-2 text-blue-300">
                                            kg
                                        </span>

                                    </p>

                                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/20">

                                        <span className="w-2 h-2 rounded-full bg-emerald-400" />

                                        <span className="text-xs font-bold text-emerald-300">
                                            {currentPesee
                                                ? "STABLE"
                                                : "EN ATTENTE"}
                                        </span>

                                    </div>

                                </div>

                                {currentPesee ? (
                                    <div className="mt-5 border-t border-white/10 pt-4">

                                        <p className="text-lg font-black">
                                            {getTruckPlate(
                                                currentPesee
                                            )}
                                        </p>

                                        <p className="text-xs text-blue-300 mt-1">
                                            {getPrestationNumber(
                                                currentPesee
                                            )}
                                        </p>

                                        <div className="grid grid-cols-3 gap-2 mt-4">

                                            <div>

                                                <p className="text-[10px] uppercase text-blue-400 font-bold">
                                                    Tare
                                                </p>

                                                <p className="mt-1 text-sm font-bold">
                                                    {formatWeight(
                                                        currentPesee.poids_tare
                                                    )}
                                                </p>

                                            </div>

                                            <div>

                                                <p className="text-[10px] uppercase text-blue-400 font-bold">
                                                    Brut
                                                </p>

                                                <p className="mt-1 text-sm font-bold">
                                                    {formatWeight(
                                                        currentPesee.poids_brut
                                                    )}
                                                </p>

                                            </div>

                                            <div>

                                                <p className="text-[10px] uppercase text-blue-400 font-bold">
                                                    Net
                                                </p>

                                                <p className="mt-1 text-sm font-bold">
                                                    {formatWeight(
                                                        currentPesee.poids_net
                                                    )}
                                                </p>

                                            </div>

                                        </div>

                                    </div>
                                ) : (
                                    <div className="mt-5 border-t border-white/10 pt-4 text-center">

                                        <p className="text-sm text-blue-300">
                                            Aucun camion actuellement sur la pesée.
                                        </p>

                                    </div>
                                )}

                            </div>

                        </div>

                    </section>

                    {/* ==================================================
                        CAMIONS À TRAITER
                    ================================================== */}

                    <section
                        id="camions-a-traiter"
                        className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-5"
                    >

                        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                            <div>

                                <div className="flex items-center gap-2">

                                    <Truck
                                        size={
                                            18
                                        }
                                        className="text-blue-950"
                                    />

                                    <h2 className="font-black text-slate-900">
                                        Camions à traiter
                                    </h2>

                                    <span className="px-2 py-0.5 rounded-full bg-blue-950 text-white text-[10px] font-black">
                                        {
                                            activeTrucks.length
                                        }
                                    </span>

                                </div>

                                <p className="text-xs text-slate-400 mt-1">
                                    Actions disponibles sur les pesées encore ouvertes
                                </p>

                            </div>

                            <div className="relative w-full sm:w-72">

                                <Search
                                    size={
                                        15
                                    }
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    type="text"
                                    value={
                                        search
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setSearch(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Rechercher un camion..."
                                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 bg-white text-xs outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                                />

                            </div>

                        </div>

                        {loading ? (
                            <div className="p-10 text-center">

                                <RefreshCw
                                    size={
                                        22
                                    }
                                    className="animate-spin mx-auto text-slate-400"
                                />

                                <p className="text-xs text-slate-500 mt-2">
                                    Chargement...
                                </p>

                            </div>
                        ) : activeTrucks.length ===
                            0 ? (
                            <div className="p-10 text-center">

                                <CheckCircle2
                                    size={
                                        30
                                    }
                                    className="mx-auto text-emerald-500"
                                />

                                <p className="mt-2 text-sm font-bold text-slate-700">
                                    Aucun camion à traiter
                                </p>

                                <p className="text-xs text-slate-400 mt-1">
                                    Tous les mouvements sont à jour.
                                </p>

                            </div>
                        ) : (
                            <div className="overflow-x-auto">

                                <table className="w-full min-w-[1100px]">

                                    <thead className="bg-slate-50 border-b border-slate-200">

                                        <tr>

                                            <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wide font-black text-slate-400">
                                                Matricule
                                            </th>

                                            <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wide font-black text-slate-400">
                                                Chauffeur
                                            </th>

                                            <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wide font-black text-slate-400">
                                                Prestation
                                            </th>

                                            <th className="text-right px-5 py-3 text-[10px] uppercase tracking-wide font-black text-slate-400">
                                                Tare
                                            </th>

                                            <th className="text-center px-5 py-3 text-[10px] uppercase tracking-wide font-black text-slate-400">
                                                Attente
                                            </th>

                                            <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wide font-black text-slate-400">
                                                État
                                            </th>

                                            <th className="text-right px-5 py-3 text-[10px] uppercase tracking-wide font-black text-slate-400">
                                                Action
                                            </th>

                                        </tr>

                                    </thead>

                                    <tbody className="divide-y divide-slate-100">

                                        {activeTrucks.map(
                                            (
                                                pesee
                                            ) => {

                                                const waitingMinutes =
                                                    getWaitingMinutes(
                                                        getEntryDate(
                                                            pesee
                                                        )
                                                    );

                                                const waitingClass =
                                                    waitingMinutes >=
                                                        30
                                                        ? "bg-red-50 text-red-700 border-red-200"
                                                        : waitingMinutes >=
                                                            15
                                                            ? "bg-amber-50 text-amber-700 border-amber-200"
                                                            : "bg-slate-50 text-slate-600 border-slate-200";

                                                return (
                                                    <tr
                                                        key={
                                                            pesee.id
                                                        }
                                                        className="hover:bg-slate-50 transition"
                                                    >

                                                        <td
                                                            className="px-5 py-4 cursor-pointer"
                                                            onClick={() =>
                                                                handleOpenTruck(
                                                                    pesee
                                                                )
                                                            }
                                                        >

                                                            <div className="flex items-center gap-3">

                                                                <div className="w-8 h-8 rounded-lg bg-blue-950 text-white flex items-center justify-center">
                                                                    <Truck
                                                                        size={
                                                                            15
                                                                        }
                                                                    />
                                                                </div>

                                                                <div>

                                                                    <p className="text-sm font-black text-slate-900">
                                                                        {getTruckPlate(
                                                                            pesee
                                                                        )}
                                                                    </p>

                                                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                                                        {getTrailerPlate(
                                                                            pesee
                                                                        ) !==
                                                                            "—"
                                                                            ? `Remorque : ${getTrailerPlate(
                                                                                pesee
                                                                            )}`
                                                                            : "Remorque non renseignée"}
                                                                    </p>

                                                                </div>

                                                            </div>

                                                        </td>

                                                        <td
                                                            className="px-5 py-4 cursor-pointer"
                                                            onClick={() =>
                                                                handleOpenTruck(
                                                                    pesee
                                                                )
                                                            }
                                                        >

                                                            <div className="flex items-center gap-2">

                                                                <UserRound
                                                                    size={
                                                                        14
                                                                    }
                                                                    className="text-slate-400"
                                                                />

                                                                <span className="text-sm font-semibold text-slate-700">
                                                                    {getDriverName(
                                                                        pesee
                                                                    )}
                                                                </span>

                                                            </div>

                                                        </td>

                                                        <td
                                                            className="px-5 py-4 cursor-pointer"
                                                            onClick={() =>
                                                                handleOpenTruck(
                                                                    pesee
                                                                )
                                                            }
                                                        >

                                                            <p className="text-sm font-bold text-slate-800">
                                                                {getPrestationNumber(
                                                                    pesee
                                                                )}
                                                            </p>

                                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                                {getMerchandiseName(
                                                                    pesee
                                                                )}
                                                            </p>

                                                        </td>

                                                        <td
                                                            className="px-5 py-4 text-right cursor-pointer"
                                                            onClick={() =>
                                                                handleOpenTruck(
                                                                    pesee
                                                                )
                                                            }
                                                        >

                                                            <span className="text-sm font-bold text-slate-800">
                                                                {formatWeight(
                                                                    pesee.poids_tare
                                                                )}
                                                            </span>

                                                        </td>

                                                        <td
                                                            className="px-5 py-4 text-center cursor-pointer"
                                                            onClick={() =>
                                                                handleOpenTruck(
                                                                    pesee
                                                                )
                                                            }
                                                        >

                                                            <span
                                                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${waitingClass}`}
                                                            >

                                                                <Clock3
                                                                    size={
                                                                        12
                                                                    }
                                                                />

                                                                {formatWaitingTime(
                                                                    getEntryDate(
                                                                        pesee
                                                                    )
                                                                )}

                                                            </span>

                                                        </td>

                                                        <td
                                                            className="px-5 py-4 cursor-pointer"
                                                            onClick={() =>
                                                                handleOpenTruck(
                                                                    pesee
                                                                )
                                                            }
                                                        >

                                                            <StatusBadge
                                                                status={
                                                                    pesee.statut
                                                                }
                                                            />

                                                        </td>

                                                        <td className="px-5 py-4 text-right">

                                                            <div className="flex items-center justify-end gap-2">

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleOpenTruck(
                                                                            pesee
                                                                        )
                                                                    }
                                                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
                                                                >
                                                                    Voir dossier
                                                                </button>

                                                                {canMakeSortie(
                                                                    pesee
                                                                ) ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleSelectPesee(
                                                                                pesee
                                                                            )
                                                                        }
                                                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500 text-white text-xs font-black hover:bg-orange-400 transition"
                                                                    >
                                                                        <ArrowUpFromLine
                                                                            size={
                                                                                14
                                                                            }
                                                                        />

                                                                        Faire la sortie
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-xs text-slate-400">
                                                                        —
                                                                    </span>
                                                                )}

                                                            </div>

                                                        </td>

                                                    </tr>
                                                );
                                            }
                                        )}

                                    </tbody>

                                </table>

                            </div>
                        )}

                    </section>

                    {/* ==================================================
                        ACTIVITY + PRESTATIONS
                    ================================================== */}

                    <section className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-5">

                        {/* ACTIVITÉ */}

                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

                            <div className="px-5 py-4 border-b border-slate-200">

                                <div className="flex items-center gap-2">

                                    <Activity
                                        size={
                                            18
                                        }
                                        className="text-blue-950"
                                    />

                                    <h2 className="font-black text-slate-900">
                                        Activité récente
                                    </h2>

                                </div>

                                <p className="text-xs text-slate-400 mt-1">
                                    Derniers événements enregistrés
                                </p>

                            </div>

                            <div className="divide-y divide-slate-100">

                                {recentActivity.map(
                                    (
                                        pesee
                                    ) => {

                                        let Icon =
                                            Truck;

                                        let iconClass =
                                            "bg-slate-100 text-slate-600";

                                        let title =
                                            "Mouvement enregistré";

                                        if (
                                            pesee.statut ===
                                            "VALIDE"
                                        ) {
                                            Icon =
                                                CheckCircle2;

                                            iconClass =
                                                "bg-emerald-50 text-emerald-600";

                                            title =
                                                "Sortie validée";
                                        } else if (
                                            pesee.statut ===
                                            "ENCOURS"
                                        ) {
                                            Icon =
                                                Weight;

                                            iconClass =
                                                "bg-amber-50 text-amber-600";

                                            title =
                                                "Pesée en cours";
                                        } else if (
                                            pesee.statut ===
                                            "ENTREE"
                                        ) {
                                            Icon =
                                                ArrowDownToLine;

                                            iconClass =
                                                "bg-sky-50 text-sky-600";

                                            title =
                                                "Entrée enregistrée";
                                        } else if (
                                            pesee.statut ===
                                            "ANNULEE"
                                        ) {
                                            Icon =
                                                XCircle;

                                            iconClass =
                                                "bg-red-50 text-red-600";

                                            title =
                                                "Mouvement annulé";
                                        }

                                        return (
                                            <button
                                                type="button"
                                                key={
                                                    pesee.id
                                                }
                                                onClick={() =>
                                                    handleOpenTruck(
                                                        pesee
                                                    )
                                                }
                                                className="w-full text-left px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition"
                                            >

                                                <div
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconClass}`}
                                                >
                                                    <Icon
                                                        size={
                                                            15
                                                        }
                                                    />
                                                </div>

                                                <div className="min-w-0 flex-1">

                                                    <div className="flex items-center justify-between gap-3">

                                                        <p className="text-xs font-black text-slate-800">
                                                            {
                                                                title
                                                            }
                                                        </p>

                                                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                                            {formatTime(
                                                                getPeseeDate(
                                                                    pesee
                                                                )
                                                            )}
                                                        </span>

                                                    </div>

                                                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                                                        {getTruckPlate(
                                                            pesee
                                                        )}
                                                    </p>

                                                    {pesee.statut ===
                                                        "VALIDE" &&
                                                        pesee.poids_net !==
                                                        null &&
                                                        pesee.poids_net !==
                                                        undefined && (
                                                            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                                                                Net :{" "}
                                                                {formatWeight(
                                                                    pesee.poids_net
                                                                )}
                                                            </p>
                                                        )}

                                                </div>

                                                <ArrowRight
                                                    size={
                                                        14
                                                    }
                                                    className="text-slate-300 shrink-0"
                                                />

                                            </button>
                                        );
                                    }
                                )}

                                {recentActivity.length ===
                                    0 && (
                                        <div className="p-8 text-center">

                                            <Clock3
                                                size={
                                                    26
                                                }
                                                className="mx-auto text-slate-300"
                                            />

                                            <p className="text-sm font-semibold text-slate-600 mt-2">
                                                Aucune activité
                                            </p>

                                        </div>
                                    )}

                            </div>

                        </div>

                        {/* PRESTATIONS */}

                        <div
                            id="prestations-dashboard"
                            className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
                        >

                            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">

                                <div>

                                    <div className="flex items-center gap-2">

                                        <Ticket
                                            size={
                                                18
                                            }
                                            className="text-orange-600"
                                        />

                                        <h2 className="font-black text-slate-900">
                                            Prestations / tonnage
                                        </h2>

                                    </div>

                                    <p className="text-xs text-slate-400 mt-1">
                                        Avancement des quantités prévues
                                    </p>

                                </div>

                                <span className="text-xs font-bold text-slate-400">
                                    {
                                        visiblePrestations.length
                                    }{" "}
                                    affichées
                                </span>

                            </div>

                            <div className="divide-y divide-slate-100">

                                {visiblePrestations.map(
                                    (
                                        prestation
                                    ) => {

                                        const planned =
                                            Number(
                                                prestation?.quantite_prevue ||
                                                0
                                            );

                                        const realised =
                                            Number(
                                                prestation?.quantite_realisee ||
                                                0
                                            );

                                        const remaining =
                                            Math.max(
                                                planned -
                                                realised,
                                                0
                                            );

                                        const percent =
                                            planned >
                                                0
                                                ? Math.min(
                                                    Math.max(
                                                        (realised /
                                                            planned) *
                                                        100,
                                                        0
                                                    ),
                                                    100
                                                )
                                                : 0;

                                        const unite =
                                            prestation?.unite ||
                                            "T";

                                        const quotaReached =
                                            planned >
                                            0 &&
                                            realised /
                                            planned >=
                                            0.8;

                                        return (
                                            <div
                                                key={
                                                    prestation.id
                                                }
                                                className="px-5 py-4"
                                            >

                                                <div className="flex items-start justify-between gap-4">

                                                    <div className="min-w-0">

                                                        <p className="text-sm font-black text-slate-900">
                                                            {
                                                                prestation.numero_prestation ||
                                                                `PRESTATION #${prestation.id}`
                                                            }
                                                        </p>

                                                        <div className="flex items-center gap-2 mt-1">

                                                            <p className="text-xs text-slate-400">
                                                                {prestation?.statut
                                                                    ? getPrestationStatusLabel(
                                                                        prestation.statut
                                                                    )
                                                                    : "—"}
                                                            </p>

                                                            {quotaReached && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                                                                    <AlertTriangle
                                                                        size={
                                                                            10
                                                                        }
                                                                    />
                                                                    Surveillance
                                                                </span>
                                                            )}

                                                        </div>

                                                    </div>

                                                    <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
                                                        {Math.round(
                                                            percent
                                                        )}
                                                        %
                                                    </span>

                                                </div>

                                                <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">

                                                    <div
                                                        className={`h-full rounded-full transition-all ${quotaReached
                                                            ? "bg-amber-500"
                                                            : "bg-orange-500"
                                                            }`}
                                                        style={{
                                                            width: `${percent}%`,
                                                        }}
                                                    />

                                                </div>

                                                <div className="mt-3 grid grid-cols-3 gap-3">

                                                    <div>

                                                        <p className="text-[10px] uppercase font-bold tracking-wide text-slate-400">
                                                            Prévu
                                                        </p>

                                                        <p className="mt-1 text-xs font-bold text-slate-800">
                                                            {planned.toLocaleString(
                                                                "fr-FR"
                                                            )}{" "}
                                                            {
                                                                unite
                                                            }
                                                        </p>

                                                    </div>

                                                    <div>

                                                        <p className="text-[10px] uppercase font-bold tracking-wide text-slate-400">
                                                            Réalisé
                                                        </p>

                                                        <p className="mt-1 text-xs font-bold text-emerald-600">
                                                            {realised.toLocaleString(
                                                                "fr-FR"
                                                            )}{" "}
                                                            {
                                                                unite
                                                            }
                                                        </p>

                                                    </div>

                                                    <div>

                                                        <p className="text-[10px] uppercase font-bold tracking-wide text-slate-400">
                                                            Restant
                                                        </p>

                                                        <p className="mt-1 text-xs font-bold text-slate-800">
                                                            {remaining.toLocaleString(
                                                                "fr-FR"
                                                            )}{" "}
                                                            {
                                                                unite
                                                            }
                                                        </p>

                                                    </div>

                                                </div>

                                            </div>
                                        );
                                    }
                                )}

                                {visiblePrestations.length ===
                                    0 && (
                                        <div className="p-8 text-center">

                                            <Package
                                                size={
                                                    27
                                                }
                                                className="mx-auto text-slate-300"
                                            />

                                            <p className="text-sm font-semibold text-slate-600 mt-2">
                                                Aucune prestation
                                            </p>

                                            <p className="text-xs text-slate-400 mt-1">
                                                Les prestations apparaîtront ici.
                                            </p>

                                        </div>
                                    )}

                            </div>

                        </div>

                    </section>

                    {/* ==================================================
                        BOTTOM OPERATION
                    ================================================== */}

                    <section className="mt-5 bg-blue-950 rounded-xl px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                        <div className="flex items-center gap-3">

                            <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">

                                <Weight
                                    size={
                                        17
                                    }
                                    className="text-white"
                                />

                            </div>

                            <div>

                                <p className="text-sm font-black text-white">
                                    Prêt pour une nouvelle entrée
                                </p>

                                <p className="text-xs text-blue-300 mt-0.5">
                                    OCR · chauffeur · tare · ticket QR
                                </p>

                            </div>

                        </div>

                        <button
                            type="button"
                            onClick={
                                onNavigatePesee
                            }
                            className="px-4 py-2.5 rounded-lg bg-orange-500 text-white text-xs font-black flex items-center justify-center gap-2 hover:bg-orange-400 transition"
                        >
                            Ouvrir le pont-bascule

                            <ArrowRight
                                size={
                                    15
                                }
                            />
                        </button>

                    </section>

                </main>
            </div>

            {/* ========================================================
                FICHE CAMION - DRAWER
            ======================================================== */}

            {selectedTruck && (
                <div className="fixed inset-0 z-[100]">

                    {/* OVERLAY */}

                    <button
                        type="button"
                        aria-label="Fermer"
                        onClick={() =>
                            setSelectedTruck(
                                null
                            )
                        }
                        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
                    />

                    {/* DRAWER */}

                    <aside className="absolute top-0 right-0 h-full w-full max-w-xl bg-white shadow-2xl flex flex-col">

                        {/* HEADER */}

                        <div className="bg-blue-950 text-white px-6 py-5">

                            <div className="flex items-start justify-between gap-4">

                                <div className="flex items-center gap-3">

                                    <div className="w-11 h-11 rounded-xl bg-orange-500 flex items-center justify-center">

                                        <Truck
                                            size={
                                                21
                                            }
                                        />

                                    </div>

                                    <div>

                                        <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-blue-300">
                                            Dossier véhicule
                                        </p>

                                        <h2 className="text-xl font-black mt-0.5">
                                            {getTruckPlate(
                                                selectedTruck
                                            )}
                                        </h2>

                                    </div>

                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setSelectedTruck(
                                            null
                                        )
                                    }
                                    className="w-9 h-9 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 transition"
                                >
                                    <X
                                        size={
                                            17
                                        }
                                    />
                                </button>

                            </div>

                            <div className="mt-4 flex items-center justify-between gap-3">

                                <StatusBadge
                                    status={
                                        selectedTruck.statut
                                    }
                                />

                                <span className="text-xs text-blue-300">
                                    Entrée :{" "}
                                    <span className="font-bold text-white">
                                        {formatDate(
                                            getEntryDate(
                                                selectedTruck
                                            )
                                        )}
                                    </span>
                                </span>

                            </div>

                        </div>

                        {/* CONTENT */}

                        <div className="flex-1 overflow-y-auto p-5 space-y-5">

                            {/* IDENTIFICATION */}

                            <div>

                                <p className="text-[11px] uppercase tracking-[0.08em] font-black text-slate-400 mb-3">
                                    Identification
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Truck
                                                size={
                                                    15
                                                }
                                            />

                                            <p className="text-[10px] uppercase font-bold tracking-wide">
                                                Tracteur
                                            </p>
                                        </div>

                                        <p className="mt-2 text-sm font-black text-slate-900">
                                            {getTruckPlate(
                                                selectedTruck
                                            )}
                                        </p>

                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Truck
                                                size={
                                                    15
                                                }
                                            />

                                            <p className="text-[10px] uppercase font-bold tracking-wide">
                                                Remorque
                                            </p>
                                        </div>

                                        <p className="mt-2 text-sm font-black text-slate-900">
                                            {getTrailerPlate(
                                                selectedTruck
                                            )}
                                        </p>

                                    </div>

                                </div>

                            </div>

                            {/* CHAUFFEUR */}

                            <div>

                                <p className="text-[11px] uppercase tracking-[0.08em] font-black text-slate-400 mb-3">
                                    Chauffeur
                                </p>

                                <div className="rounded-xl border border-slate-200 p-4">

                                    <div className="flex items-start gap-3">

                                        <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                                            <UserRound
                                                size={
                                                    17
                                                }
                                            />
                                        </div>

                                        <div className="min-w-0">

                                            <p className="text-sm font-black text-slate-900">
                                                {getDriverName(
                                                    selectedTruck
                                                )}
                                            </p>

                                            <p className="text-xs text-slate-400 mt-1">
                                                CIN :{" "}
                                                <span className="font-semibold text-slate-600">
                                                    {getDriverCin(
                                                        selectedTruck
                                                    )}
                                                </span>
                                            </p>

                                        </div>

                                    </div>

                                </div>

                            </div>

                            {/* PRESTATION */}

                            <div>

                                <p className="text-[11px] uppercase tracking-[0.08em] font-black text-slate-400 mb-3">
                                    Prestation
                                </p>

                                <div className="rounded-xl border border-slate-200 p-4">

                                    <div className="flex items-start justify-between gap-3">

                                        <div className="flex items-center gap-3">

                                            <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                                                <Ticket
                                                    size={
                                                        17
                                                    }
                                                />
                                            </div>

                                            <div>

                                                <p className="text-sm font-black text-slate-900">
                                                    {getPrestationNumber(
                                                        selectedTruck
                                                    )}
                                                </p>

                                                <p className="text-xs text-slate-400 mt-1">
                                                    Marchandise :{" "}
                                                    <span className="font-semibold text-slate-600">
                                                        {getMerchandiseName(
                                                            selectedTruck
                                                        )}
                                                    </span>
                                                </p>

                                            </div>

                                        </div>

                                        {selectedTruck?.prestation?.statut && (
                                            <StatusBadge
                                                type="prestation"
                                                status={
                                                    selectedTruck
                                                        .prestation
                                                        .statut
                                                }
                                            />
                                        )}

                                    </div>

                                </div>

                            </div>

                            {/* PESÉE */}

                            <div>

                                <p className="text-[11px] uppercase tracking-[0.08em] font-black text-slate-400 mb-3">
                                    Données de pesée
                                </p>

                                <div className="grid grid-cols-3 gap-3">

                                    <div className="rounded-xl border border-slate-200 p-4">

                                        <p className="text-[10px] uppercase font-bold tracking-wide text-slate-400">
                                            Tare
                                        </p>

                                        <p className="mt-2 text-sm font-black text-slate-900">
                                            {formatWeight(
                                                selectedTruck.poids_tare
                                            )}
                                        </p>

                                    </div>

                                    <div className="rounded-xl border border-slate-200 p-4">

                                        <p className="text-[10px] uppercase font-bold tracking-wide text-slate-400">
                                            Brut
                                        </p>

                                        <p className="mt-2 text-sm font-black text-slate-900">
                                            {formatWeight(
                                                selectedTruck.poids_brut
                                            )}
                                        </p>

                                    </div>

                                    <div className="rounded-xl border border-slate-200 p-4">

                                        <p className="text-[10px] uppercase font-bold tracking-wide text-slate-400">
                                            Net
                                        </p>

                                        <p className="mt-2 text-sm font-black text-emerald-600">
                                            {formatWeight(
                                                selectedTruck.poids_net
                                            )}
                                        </p>

                                    </div>

                                </div>

                            </div>

                            {/* TEMPS */}

                            <div>

                                <p className="text-[11px] uppercase tracking-[0.08em] font-black text-slate-400 mb-3">
                                    Suivi temporel
                                </p>

                                <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">

                                    <div className="px-4 py-3 flex items-center justify-between">

                                        <span className="text-xs text-slate-500">
                                            Entrée
                                        </span>

                                        <span className="text-xs font-bold text-slate-800">
                                            {formatDate(
                                                selectedTruck.date_entree ||
                                                selectedTruck.created_at
                                            )}
                                        </span>

                                    </div>

                                    <div className="px-4 py-3 flex items-center justify-between">

                                        <span className="text-xs text-slate-500">
                                            Sortie
                                        </span>

                                        <span className="text-xs font-bold text-slate-800">
                                            {formatDate(
                                                selectedTruck.date_sortie
                                            )}
                                        </span>

                                    </div>

                                    <div className="px-4 py-3 flex items-center justify-between">

                                        <span className="text-xs text-slate-500">
                                            Temps d'attente
                                        </span>

                                        <span
                                            className={`text-xs font-black ${getWaitingMinutes(
                                                getEntryDate(selectedTruck),
                                                selectedTruck?.date_sortie
                                            ) >= 30
                                                ? "text-red-600"
                                                : getWaitingMinutes(
                                                    getEntryDate(selectedTruck),
                                                    selectedTruck?.date_sortie
                                                ) >= 15
                                                    ? "text-amber-600"
                                                    : "text-slate-800"
                                                }`}
                                        >
                                            {formatWaitingTime(
                                                getEntryDate(selectedTruck),
                                                selectedTruck?.date_sortie
                                            )}
                                        </span>

                                    </div>

                                </div>

                            </div>

                            {/* TICKET */}

                            <div>

                                <p className="text-[11px] uppercase tracking-[0.08em] font-black text-slate-400 mb-3">
                                    Ticket
                                </p>

                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                                    <div className="flex items-center gap-3">

                                        <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center">
                                            <Ticket
                                                size={
                                                    17
                                                }
                                            />
                                        </div>

                                        <div>

                                            <p className="text-[10px] uppercase font-bold tracking-wide text-slate-400">
                                                Numéro / QR
                                            </p>

                                            <p className="mt-1 text-xs font-bold text-slate-800 break-all">
                                                {getTicketNumber(
                                                    selectedTruck
                                                )}
                                            </p>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                        {/* FOOTER */}

                        <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">

                            <div className="flex items-center justify-between gap-3">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setSelectedTruck(
                                            null
                                        )
                                    }
                                    className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition"
                                >
                                    Fermer
                                </button>

                                {canMakeSortie(
                                    selectedTruck
                                ) && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedTruck(
                                                    null
                                                );

                                                handleSelectPesee(
                                                    selectedTruck
                                                );
                                            }}
                                            className="px-4 py-2.5 rounded-lg bg-orange-500 text-white text-xs font-black flex items-center gap-2 hover:bg-orange-400 transition"
                                        >
                                            <ArrowUpFromLine
                                                size={
                                                    15
                                                }
                                            />

                                            Faire la sortie
                                        </button>
                                    )}

                            </div>

                        </div>

                    </aside>

                </div>
            )}
        </>
    );
}