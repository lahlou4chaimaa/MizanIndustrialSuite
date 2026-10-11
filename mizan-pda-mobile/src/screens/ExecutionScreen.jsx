import React, { useMemo } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    SafeAreaView,
} from "react-native";

import {
    ArrowLeft,
    Truck,
    UserRound,
    Package,
    MapPin,
    FileText,
    ShieldCheck,
    ReceiptText,
    ClipboardList,
    History,
    CalendarDays,
    Clock3,
    CheckCircle2,
    AlertCircle,
    Scale,
    Building2,
    Phone,
    CreditCard,
    Hash,
    Boxes,
    ChevronRight,
    QrCode,
    BadgeCheck,
    CircleDot,
    Weight,
    Route,
    FileCheck2,
    Banknote,
    Layers3,
} from "lucide-react-native";

/* =========================================================
   HELPERS
========================================================= */

const COLORS = {
    navy: "#0B1F33",
    navy2: "#102B45",
    primary: "#1769AA",
    primaryDark: "#0F548B",
    primaryLight: "#EAF4FB",
    blueSoft: "#F2F8FC",

    bg: "#F3F6F9",
    white: "#FFFFFF",

    text: "#0F172A",
    textSoft: "#334155",
    muted: "#64748B",
    muted2: "#94A3B8",

    border: "#DCE6EF",
    borderLight: "#E8EEF3",

    success: "#15803D",
    successBg: "#EAF7EF",

    warning: "#B45309",
    warningBg: "#FFF7E8",

    danger: "#B91C1C",
    dangerBg: "#FDECEC",

    purple: "#6D4AFF",
    purpleBg: "#F1EEFF",
};

const formatNumber = (value, decimals = 0) => {
    if (value === null || value === undefined || value === "") {
        return "—";
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
        return String(value);
    }

    return number.toLocaleString("fr-FR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
};

const formatWeight = (value) => {
    if (value === null || value === undefined || value === "") {
        return "—";
    }

    return `${formatNumber(value, 0)} kg`;
};

const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const formatDateTime = (value) => {
    if (!value) return "—";

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
};

const formatMoney = (value) => {
    if (value === null || value === undefined || value === "") {
        return "—";
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
        return String(value);
    }

    return `${number.toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })} MAD`;
};

const getStatusLabel = (status) => {
    const labels = {
        PLANIFIEE: "Planifiée",
        PLANIFIE: "Planifiée",
        EN_ATTENTE: "En attente",
        EN_COURS: "En cours",
        TERMINEE: "Terminée",
        ANNULEE: "Annulée",
        CLOTUREE: "Clôturée",
        VALIDE: "Validé",
        BROUILLON: "Brouillon",
    };

    return labels[String(status || "").toUpperCase()] || status || "—";
};

const getStatusColor = (status) => {
    const normalized = String(status || "").toUpperCase();

    if (
        normalized === "TERMINEE" ||
        normalized === "VALIDE" ||
        normalized === "CLOTUREE"
    ) {
        return {
            color: COLORS.success,
            background: COLORS.successBg,
        };
    }

    if (
        normalized === "EN_COURS" ||
        normalized === "PLANIFIEE" ||
        normalized === "PLANIFIE" ||
        normalized === "EN_ATTENTE"
    ) {
        return {
            color: COLORS.primary,
            background: COLORS.primaryLight,
        };
    }

    if (normalized === "ANNULEE") {
        return {
            color: COLORS.danger,
            background: COLORS.dangerBg,
        };
    }

    return {
        color: COLORS.muted,
        background: COLORS.bg,
    };
};

/* =========================================================
   SMALL COMPONENTS
========================================================= */

const SectionTitle = ({
    icon: Icon,
    title,
    subtitle,
    right,
}) => (
    <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleLeft}>
            <View style={styles.sectionIcon}>
                <Icon size={18} color={COLORS.primary} strokeWidth={2.2} />
            </View>

            <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>{title}</Text>

                {subtitle ? (
                    <Text style={styles.sectionSubtitle}>{subtitle}</Text>
                ) : null}
            </View>
        </View>

        {right ? right : null}
    </View>
);

const InfoItem = ({
    icon: Icon,
    label,
    value,
    accent = false,
    fullWidth = false,
}) => (
    <View
        style={[
            styles.infoItem,
            fullWidth && styles.infoItemFull,
        ]}
    >
        <View
            style={[
                styles.infoIcon,
                accent && styles.infoIconAccent,
            ]}
        >
            <Icon
                size={16}
                color={accent ? COLORS.primary : COLORS.muted}
                strokeWidth={2}
            />
        </View>

        <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{label}</Text>

            <Text
                style={[
                    styles.infoValue,
                    accent && styles.infoValueAccent,
                ]}
                numberOfLines={3}
            >
                {value || "—"}
            </Text>
        </View>
    </View>
);

const EmptyState = ({
    icon: Icon = FileText,
    title,
    description,
}) => (
    <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
            <Icon size={22} color={COLORS.muted2} strokeWidth={1.8} />
        </View>

        <View style={{ flex: 1 }}>
            <Text style={styles.emptyTitle}>{title}</Text>

            {description ? (
                <Text style={styles.emptyDescription}>
                    {description}
                </Text>
            ) : null}
        </View>
    </View>
);

/* =========================================================
   PRESTATION CARD
========================================================= */

const PrestationCard = ({
    prestation,
    selected,
    onSelect,
    onAffecter,
}) => {
    const statusStyle = getStatusColor(prestation?.statut);

    const quantitePrevue =
        prestation?.quantite_prevue ??
        prestation?.prestationCamion?.quantite_prevue;

    const quantiteRealisee =
        prestation?.quantite_realisee ??
        prestation?.prestationCamion?.quantite_realisee;

    const quantiteRestante =
        prestation?.quantiteRestante ??
        (
            quantitePrevue !== null &&
                quantitePrevue !== undefined &&
                quantiteRealisee !== null &&
                quantiteRealisee !== undefined
                ? Number(quantitePrevue) - Number(quantiteRealisee)
                : null
        );

    const camion =
        prestation?.camion ||
        prestation?.prestationCamion?.camion;

    const marchandise = prestation?.marchandise;

    return (
        <View
            style={[
                styles.prestationCard,
                selected && styles.prestationCardSelected,
            ]}
        >
            {/* Top */}
            <View style={styles.prestationTop}>
                <View style={{ flex: 1 }}>
                    <View style={styles.prestationNumberRow}>
                        <View style={styles.prestationNumberIcon}>
                            <Hash
                                size={15}
                                color={
                                    selected
                                        ? COLORS.primary
                                        : COLORS.muted
                                }
                                strokeWidth={2.4}
                            />
                        </View>

                        <Text style={styles.prestationNumber}>
                            {prestation?.numero_prestation ||
                                `PRESTATION #${prestation?.id || "—"}`}
                        </Text>
                    </View>

                    <Text style={styles.prestationOperation}>
                        {prestation?.type_operation ||
                            "Opération non renseignée"}
                    </Text>
                </View>

                <View
                    style={[
                        styles.statusBadge,
                        {
                            backgroundColor: statusStyle.background,
                        },
                    ]}
                >
                    <CircleDot
                        size={12}
                        color={statusStyle.color}
                        strokeWidth={2.5}
                    />

                    <Text
                        style={[
                            styles.statusBadgeText,
                            {
                                color: statusStyle.color,
                            },
                        ]}
                    >
                        {getStatusLabel(prestation?.statut)}
                    </Text>
                </View>
            </View>

            {/* Main information */}
            <View style={styles.prestationInfoGrid}>
                <View style={styles.prestationMiniItem}>
                    <Truck
                        size={15}
                        color={COLORS.muted}
                        strokeWidth={2}
                    />

                    <View style={{ flex: 1 }}>
                        <Text style={styles.miniLabel}>Camion</Text>

                        <Text style={styles.miniValue}>
                            {camion?.immatriculation || "—"}
                        </Text>
                    </View>
                </View>

                <View style={styles.prestationMiniItem}>
                    <Package
                        size={15}
                        color={COLORS.muted}
                        strokeWidth={2}
                    />

                    <View style={{ flex: 1 }}>
                        <Text style={styles.miniLabel}>
                            Marchandise
                        </Text>

                        <Text
                            style={styles.miniValue}
                            numberOfLines={1}
                        >
                            {marchandise?.nom ||
                                marchandise?.code ||
                                "—"}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Quantity */}
            <View style={styles.quantityContainer}>
                <View style={styles.quantityBox}>
                    <Text style={styles.quantityLabel}>
                        Prévue
                    </Text>

                    <Text style={styles.quantityValue}>
                        {formatNumber(quantitePrevue, 3)}
                        {prestation?.unite
                            ? ` ${prestation.unite}`
                            : ""}
                    </Text>
                </View>

                <View style={styles.quantityDivider} />

                <View style={styles.quantityBox}>
                    <Text style={styles.quantityLabel}>
                        Réalisée
                    </Text>

                    <Text style={styles.quantityValue}>
                        {formatNumber(quantiteRealisee, 3)}
                        {prestation?.unite
                            ? ` ${prestation.unite}`
                            : ""}
                    </Text>
                </View>

                <View style={styles.quantityDivider} />

                <View style={styles.quantityBox}>
                    <Text style={styles.quantityLabel}>
                        Restante
                    </Text>

                    <Text
                        style={[
                            styles.quantityValue,
                            styles.quantityRemaining,
                        ]}
                    >
                        {formatNumber(quantiteRestante, 3)}
                        {prestation?.unite
                            ? ` ${prestation.unite}`
                            : ""}
                    </Text>
                </View>
            </View>

            {/* Selection */}
            {/* OUVRIR LA PRESTATION */}
            <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => onSelect?.(prestation)}
                style={[
                    styles.selectPrestationButton,
                    selected && styles.selectPrestationButtonSelected,
                ]}
            >
                <View
                    style={[
                        styles.selectionCircle,
                        selected && styles.selectionCircleSelected,
                    ]}
                >
                    {selected ? (
                        <CheckCircle2
                            size={19}
                            color={COLORS.white}
                            strokeWidth={2.5}
                        />
                    ) : (
                        <FileCheck2
                            size={16}
                            color={COLORS.primary}
                            strokeWidth={2.2}
                        />
                    )}
                </View>

                <View style={{ flex: 1 }}>
                    <Text
                        style={[
                            styles.selectButtonTitle,
                            selected && styles.selectButtonTitleSelected,
                        ]}
                    >
                        {selected
                            ? "Prestation ouverte"
                            : "Ouvrir la prestation"}
                    </Text>

                    <Text style={styles.selectButtonSubtitle}>
                        {selected
                            ? "Les détails complets sont affichés ci-dessous"
                            : "Voir les informations complètes de la prestation"}
                    </Text>
                </View>

                <ChevronRight
                    size={20}
                    color={selected ? COLORS.primary : COLORS.muted2}
                    strokeWidth={2.2}
                />
            </TouchableOpacity>
            {/* Affect */}
            {selected ? (
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => onAffecter?.(prestation)}
                    style={styles.affectButton}
                >
                    <ShieldCheck
                        size={19}
                        color={COLORS.white}
                        strokeWidth={2.2}
                    />

                    <Text style={styles.affectButtonText}>
                        AFFECTER AU TICKET
                    </Text>

                    <ChevronRight
                        size={18}
                        color={COLORS.white}
                        strokeWidth={2.2}
                    />
                </TouchableOpacity>
            ) : null}
        </View>
    );
};

/* =========================================================
   MAIN SCREEN
========================================================= */

export default function ExecutionScreen({
    dossier,
    selectedPrestationId,
    onSelectPrestation,
    onAffecterPrestation,
    onBack,
}) {
    const ticket = dossier?.ticket || {};

    const camion =
        ticket?.camion ||
        dossier?.camion ||
        {};

    const chauffeur =
        ticket?.chauffeur ||
        dossier?.chauffeur ||
        {};

    const marchandise =
        ticket?.marchandise ||
        dossier?.marchandise ||
        {};

    const ticketPesee =
        ticket?.pesee ||
        dossier?.pesee ||
        {};

    const prestations = useMemo(() => {
        if (Array.isArray(dossier?.prestations)) {
            return dossier.prestations;
        }

        if (Array.isArray(dossier?.prestationsAEffectuer)) {
            return dossier.prestationsAEffectuer;
        }

        if (dossier?.prestation) {
            return [dossier.prestation];
        }

        return [];
    }, [dossier]);

    const currentPrestation = useMemo(() => {
        if (!selectedPrestationId) {
            return null;
        }

        return (
            prestations.find(
                (item) =>
                    Number(item?.id) ===
                    Number(selectedPrestationId)
            ) || null
        );
    }, [prestations, selectedPrestationId]);

    const ticketStatus =
        ticket?.statut ||
        dossier?.statut ||
        "";

    const ticketStatusStyle = getStatusColor(ticketStatus);

    const tractor =
        ticket?.matricule_tracteur ||
        camion?.immatriculation ||
        dossier?.matricule_tracteur ||
        "—";

    const trailer =
        ticket?.matricule_remorque ||
        camion?.immatriculation_remorque ||
        dossier?.matricule_remorque ||
        "—";

    const driverName =
        chauffeur?.nom || chauffeur?.prenom
            ? `${chauffeur?.prenom || ""} ${chauffeur?.nom || ""
                }`.trim()
            : ticket?.nom_chauffeur ||
                ticket?.prenom_chauffeur
                ? `${ticket?.prenom_chauffeur || ""} ${ticket?.nom_chauffeur || ""
                    }`.trim()
                : "—";

    const driverCin =
        chauffeur?.cin ||
        ticket?.cin_chauffeur ||
        dossier?.cin_chauffeur ||
        "—";

    const driverPhone =
        chauffeur?.telephone ||
        chauffeur?.phone ||
        dossier?.telephone_chauffeur ||
        "—";

    const transportCompany =
        camion?.societe_transport ||
        dossier?.societe_transport ||
        "—";

    const ticketQr =
        ticket?.qr_code ||
        dossier?.qr_code ||
        dossier?.qrCode ||
        "—";

    const ticketNumber =
        ticket?.numero_ticket ||
        dossier?.numero_ticket ||
        `TICKET #${ticket?.id || "—"}`;

    const poidsTare =
        ticket?.poids_tare ??
        ticketPesee?.poids_tare ??
        null;

    const poidsBrut =
        ticket?.poids_brut ??
        ticketPesee?.poids_brut ??
        null;

    const poidsNet =
        ticket?.poids_net ??
        ticketPesee?.poids_net ??
        null;

    const autorisations =
        currentPrestation?.autorisations ||
        [];

    const camionsPrestation =
        currentPrestation?.camionsPrestation ||
        [];

    const facturations =
        currentPrestation?.facturations ||
        [];

    const documents =
        currentPrestation?.documents ||
        [];

    const operations =
        currentPrestation?.operations ||
        [];

    const events =
        currentPrestation?.events ||
        [];

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* =================================================
                HEADER
            ================================================= */}
            <View style={styles.header}>
                <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={onBack}
                    style={styles.headerBackButton}
                >
                    <ArrowLeft
                        size={21}
                        color={COLORS.white}
                        strokeWidth={2.2}
                    />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <View style={styles.headerBrandRow}>
                        <View style={styles.headerBrandMark}>
                            <Scale
                                size={15}
                                color={COLORS.white}
                                strokeWidth={2.2}
                            />
                        </View>

                        <Text style={styles.headerBrand}>
                            MIZAN
                        </Text>
                    </View>

                    <Text style={styles.headerTitle}>
                        Exécution du dossier
                    </Text>
                </View>

                <View style={styles.headerRight}>
                    <View
                        style={[
                            styles.headerStatusDot,
                            {
                                backgroundColor:
                                    ticketStatusStyle.color,
                            },
                        ]}
                    />

                    <Text style={styles.headerStatusText}>
                        {getStatusLabel(ticketStatus)}
                    </Text>
                </View>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* =================================================
                    PAGE TITLE
                ================================================= */}
                <View style={styles.pageIntro}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.pageEyebrow}>
                            CONTRÔLE & AFFECTATION
                        </Text>

                        <Text style={styles.pageTitle}>
                            Dossier opérationnel
                        </Text>

                        <Text style={styles.pageSubtitle}>
                            Vérification du ticket et sélection
                            de la prestation autorisée.
                        </Text>
                    </View>

                    <View style={styles.pageIcon}>
                        <ClipboardList
                            size={25}
                            color={COLORS.primary}
                            strokeWidth={1.9}
                        />
                    </View>
                </View>

                {/* =================================================
                    TICKET HERO
                ================================================= */}
                <View style={styles.ticketHero}>
                    <View style={styles.ticketHeroTop}>
                        <View style={styles.ticketHeroLeft}>
                            <View style={styles.qrBox}>
                                <QrCode
                                    size={29}
                                    color={COLORS.white}
                                    strokeWidth={1.8}
                                />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={styles.ticketHeroLabel}>
                                    TICKET DE PESÉE
                                </Text>

                                <Text
                                    style={styles.ticketHeroNumber}
                                    numberOfLines={1}
                                >
                                    {ticketNumber}
                                </Text>

                                <Text
                                    style={styles.ticketHeroQr}
                                    numberOfLines={1}
                                >
                                    {ticketQr}
                                </Text>
                            </View>
                        </View>

                        <View
                            style={[
                                styles.heroStatus,
                                {
                                    backgroundColor:
                                        ticketStatusStyle.background,
                                },
                            ]}
                        >
                            <View
                                style={[
                                    styles.heroStatusDot,
                                    {
                                        backgroundColor:
                                            ticketStatusStyle.color,
                                    },
                                ]}
                            />

                            <Text
                                style={[
                                    styles.heroStatusText,
                                    {
                                        color:
                                            ticketStatusStyle.color,
                                    },
                                ]}
                            >
                                {getStatusLabel(ticketStatus)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.ticketTimeline}>
                        <View style={styles.timelineItem}>
                            <View style={styles.timelineIcon}>
                                <CalendarDays
                                    size={15}
                                    color={COLORS.primary}
                                    strokeWidth={2}
                                />
                            </View>

                            <View>
                                <Text style={styles.timelineLabel}>
                                    Entrée
                                </Text>

                                <Text style={styles.timelineValue}>
                                    {formatDateTime(
                                        ticket?.date_entree ||
                                        dossier?.date_entree
                                    )}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.timelineLine} />

                        <View style={styles.timelineItem}>
                            <View
                                style={[
                                    styles.timelineIcon,
                                    {
                                        backgroundColor:
                                            COLORS.successBg,
                                    },
                                ]}
                            >
                                <CheckCircle2
                                    size={15}
                                    color={COLORS.success}
                                    strokeWidth={2}
                                />
                            </View>

                            <View>
                                <Text style={styles.timelineLabel}>
                                    Sortie
                                </Text>

                                <Text style={styles.timelineValue}>
                                    {formatDateTime(
                                        ticket?.date_sortie ||
                                        dossier?.date_sortie
                                    )}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* =================================================
                    VEHICLE
                ================================================= */}
                <View style={styles.sectionCard}>
                    <SectionTitle
                        icon={Truck}
                        title="Véhicule"
                        subtitle="Identification du moyen de transport"
                    />

                    <View style={styles.identityBanner}>
                        <View style={styles.identityMainIcon}>
                            <Truck
                                size={25}
                                color={COLORS.primary}
                                strokeWidth={1.8}
                            />
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text style={styles.identityLabel}>
                                TRACTEUR
                            </Text>

                            <Text style={styles.identityValue}>
                                {tractor}
                            </Text>

                            <Text style={styles.identitySecondary}>
                                Remorque : {trailer}
                            </Text>
                        </View>

                        <View style={styles.verifiedPill}>
                            <ShieldCheck
                                size={14}
                                color={COLORS.success}
                                strokeWidth={2.2}
                            />

                            <Text style={styles.verifiedPillText}>
                                Identifié
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoGrid}>
                        <InfoItem
                            icon={Truck}
                            label="Tracteur"
                            value={tractor}
                            accent
                        />

                        <InfoItem
                            icon={Route}
                            label="Remorque"
                            value={trailer}
                        />

                        <InfoItem
                            icon={Building2}
                            label="Transporteur"
                            value={transportCompany}
                            fullWidth
                        />
                    </View>
                </View>

                {/* =================================================
                    DRIVER
                ================================================= */}
                <View style={styles.sectionCard}>
                    <SectionTitle
                        icon={UserRound}
                        title="Chauffeur"
                        subtitle="Identité associée au ticket"
                    />

                    <View style={styles.identityBanner}>
                        <View style={styles.driverAvatar}>
                            <UserRound
                                size={24}
                                color={COLORS.primary}
                                strokeWidth={1.8}
                            />
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text style={styles.identityLabel}>
                                CHAUFFEUR
                            </Text>

                            <Text style={styles.identityValue}>
                                {driverName}
                            </Text>

                            <Text style={styles.identitySecondary}>
                                CIN : {driverCin}
                            </Text>
                        </View>

                        <View style={styles.verifiedPill}>
                            <BadgeCheck
                                size={14}
                                color={COLORS.success}
                                strokeWidth={2.2}
                            />

                            <Text style={styles.verifiedPillText}>
                                Vérifié
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoGrid}>
                        <InfoItem
                            icon={CreditCard}
                            label="CIN"
                            value={driverCin}
                            accent
                        />

                        <InfoItem
                            icon={Phone}
                            label="Téléphone"
                            value={driverPhone}
                        />
                    </View>
                </View>

                {/* =================================================
                    MERCHANDISE
                ================================================= */}
                <View style={styles.sectionCard}>
                    <SectionTitle
                        icon={Package}
                        title="Marchandise"
                        subtitle="Produit associé au ticket"
                    />

                    <View style={styles.marchandiseBanner}>
                        <View style={styles.marchandiseIcon}>
                            <Boxes
                                size={23}
                                color={COLORS.primary}
                                strokeWidth={1.9}
                            />
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text style={styles.identityLabel}>
                                PRODUIT
                            </Text>

                            <Text style={styles.marchandiseName}>
                                {marchandise?.nom ||
                                    marchandise?.code ||
                                    "Marchandise non renseignée"}
                            </Text>

                            {marchandise?.code ? (
                                <Text style={styles.identitySecondary}>
                                    Code : {marchandise.code}
                                </Text>
                            ) : null}
                        </View>

                        <View style={styles.productBadge}>
                            <Package
                                size={14}
                                color={COLORS.primary}
                                strokeWidth={2}
                            />
                        </View>
                    </View>

                    <View style={styles.infoGrid}>
                        <InfoItem
                            icon={Hash}
                            label="Code"
                            value={marchandise?.code || "—"}
                        />

                        <InfoItem
                            icon={Weight}
                            label="Unité"
                            value={marchandise?.unite || "—"}
                        />

                        <InfoItem
                            icon={FileText}
                            label="Description"
                            value={marchandise?.description || "—"}
                            fullWidth
                        />
                    </View>
                </View>

                {/* =================================================
                    WEIGHING
                ================================================= */}
                <View style={styles.sectionCard}>
                    <SectionTitle
                        icon={Scale}
                        title="Pesée"
                        subtitle="Données enregistrées par le système"
                        right={
                            <View style={styles.readOnlyBadge}>
                                <Text style={styles.readOnlyText}>
                                    LECTURE SEULE
                                </Text>
                            </View>
                        }
                    />

                    <View style={styles.weightGrid}>
                        <View style={styles.weightCard}>
                            <View style={styles.weightIcon}>
                                <Weight
                                    size={18}
                                    color={COLORS.primary}
                                    strokeWidth={2}
                                />
                            </View>

                            <Text style={styles.weightLabel}>
                                TARE
                            </Text>

                            <Text style={styles.weightValue}>
                                {formatWeight(poidsTare)}
                            </Text>
                        </View>

                        <View style={styles.weightCard}>
                            <View style={styles.weightIcon}>
                                <Scale
                                    size={18}
                                    color={COLORS.primary}
                                    strokeWidth={2}
                                />
                            </View>

                            <Text style={styles.weightLabel}>
                                BRUT
                            </Text>

                            <Text style={styles.weightValue}>
                                {formatWeight(poidsBrut)}
                            </Text>
                        </View>

                        <View
                            style={[
                                styles.weightCard,
                                styles.weightCardNet,
                            ]}
                        >
                            <View
                                style={[
                                    styles.weightIcon,
                                    {
                                        backgroundColor:
                                            COLORS.successBg,
                                    },
                                ]}
                            >
                                <CheckCircle2
                                    size={18}
                                    color={COLORS.success}
                                    strokeWidth={2}
                                />
                            </View>

                            <Text style={styles.weightLabel}>
                                NET
                            </Text>

                            <Text
                                style={[
                                    styles.weightValue,
                                    styles.weightValueNet,
                                ]}
                            >
                                {formatWeight(poidsNet)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* =================================================
                    PRESTATIONS
                ================================================= */}
                <View style={styles.sectionCard}>
                    <SectionTitle
                        icon={Layers3}
                        title="Prestations autorisées"
                        subtitle={`${prestations.length} prestation${prestations.length > 1
                            ? "s"
                            : ""
                            } disponible${prestations.length > 1
                                ? "s"
                                : ""
                            }`}
                        right={
                            <View style={styles.countBadge}>
                                <Text style={styles.countBadgeText}>
                                    {prestations.length}
                                </Text>
                            </View>
                        }
                    />

                    {ticket?.prestation_id || dossier?.deja_affecte ? (
                        <View style={styles.alreadyAssigned}>
                            <View style={styles.alreadyAssignedIcon}>
                                <CheckCircle2
                                    size={19}
                                    color={COLORS.success}
                                    strokeWidth={2.2}
                                />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={styles.alreadyAssignedTitle}>
                                    Ticket déjà affecté
                                </Text>

                                <Text
                                    style={
                                        styles.alreadyAssignedText
                                    }
                                >
                                    Ce ticket possède déjà une
                                    prestation associée.
                                </Text>
                            </View>
                        </View>
                    ) : null}

                    {prestations.length === 0 ? (
                        <EmptyState
                            icon={AlertCircle}
                            title="Aucune prestation disponible"
                            description="Aucune prestation active et autorisée n'est disponible pour ce dossier."
                        />
                    ) : (
                        <View style={styles.prestationsList}>
                            {prestations.map((prestation, index) => (
                                <View
                                    key={
                                        prestation?.id ??
                                        `prestation-${index}`
                                    }
                                    style={
                                        index <
                                            prestations.length - 1
                                            ? styles.prestationWrapper
                                            : null
                                    }
                                >
                                    <PrestationCard
                                        prestation={prestation}
                                        selected={
                                            Number(
                                                selectedPrestationId
                                            ) ===
                                            Number(prestation?.id)
                                        }
                                        onSelect={
                                            onSelectPrestation
                                        }
                                        onAffecter={
                                            onAffecterPrestation
                                        }
                                    />
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* =================================================
                    SELECTED PRESTATION DETAIL
                ================================================= */}
                {currentPrestation ? (
                    <View style={styles.sectionCard}>
                        <SectionTitle
                            icon={FileCheck2}
                            title="Détail de la prestation"
                            subtitle="Informations opérationnelles"
                        />

                        <View style={styles.selectedPrestationHero}>
                            <View style={styles.selectedPrestationIcon}>
                                <BadgeCheck
                                    size={25}
                                    color={COLORS.primary}
                                    strokeWidth={2}
                                />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text
                                    style={
                                        styles.selectedPrestationLabel
                                    }
                                >
                                    PRESTATION SÉLECTIONNÉE
                                </Text>

                                <Text
                                    style={
                                        styles.selectedPrestationNumber
                                    }
                                >
                                    {currentPrestation?.numero_prestation ||
                                        `#${currentPrestation?.id}`}
                                </Text>
                            </View>

                            <View
                                style={[
                                    styles.statusBadge,
                                    {
                                        backgroundColor:
                                            getStatusColor(
                                                currentPrestation?.statut
                                            ).background,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.statusBadgeText,
                                        {
                                            color:
                                                getStatusColor(
                                                    currentPrestation?.statut
                                                ).color,
                                        },
                                    ]}
                                >
                                    {getStatusLabel(
                                        currentPrestation?.statut
                                    )}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.detailGrid}>
                            <InfoItem
                                icon={ClipboardList}
                                label="Type d'opération"
                                value={
                                    currentPrestation?.type_operation
                                }
                                accent
                            />

                            <InfoItem
                                icon={MapPin}
                                label="Emplacement"
                                value={
                                    currentPrestation?.emplacement
                                }
                            />

                            <InfoItem
                                icon={Hash}
                                label="DUM"
                                value={
                                    currentPrestation?.dum ||
                                    currentPrestation?.numero_dum ||
                                    "—"
                                }
                            />

                            <InfoItem
                                icon={CalendarDays}
                                label="Création"
                                value={formatDateTime(
                                    currentPrestation?.date_creation ||
                                    currentPrestation?.created_at
                                )}
                            />

                            <InfoItem
                                icon={Clock3}
                                label="Début"
                                value={formatDateTime(
                                    currentPrestation?.date_debut
                                )}
                            />

                            <InfoItem
                                icon={CheckCircle2}
                                label="Fin"
                                value={formatDateTime(
                                    currentPrestation?.date_fin
                                )}
                            />

                            <InfoItem
                                icon={FileText}
                                label="Observations"
                                value={
                                    currentPrestation?.observations ||
                                    "Aucune observation"
                                }
                                fullWidth
                            />
                        </View>
                    </View>
                ) : null}

                {/* =================================================
                    AUTHORIZATIONS
                ================================================= */}
                {currentPrestation ? (
                    <View style={styles.sectionCard}>
                        <SectionTitle
                            icon={ShieldCheck}
                            title="Autorisations"
                            subtitle="Droits d'accès à la prestation"
                        />

                        {autorisations.length === 0 ? (
                            <EmptyState
                                icon={ShieldCheck}
                                title="Aucune autorisation détaillée"
                                description="Aucune autorisation n'est actuellement remontée pour cette prestation."
                            />
                        ) : (
                            <View style={styles.listContainer}>
                                {autorisations.map((autorisation, index) => {
                                    const authCamion =
                                        autorisation?.camion;

                                    const authChauffeur =
                                        autorisation?.chauffeur;

                                    return (
                                        <View
                                            key={
                                                autorisation?.id ??
                                                `auth-${index}`
                                            }
                                            style={[
                                                styles.listRow,
                                                index <
                                                autorisations.length - 1 &&
                                                styles.listRowBorder,
                                            ]}
                                        >
                                            <View
                                                style={
                                                    styles.listRowIcon
                                                }
                                            >
                                                <ShieldCheck
                                                    size={18}
                                                    color={
                                                        autorisation?.actif
                                                            ? COLORS.success
                                                            : COLORS.muted
                                                    }
                                                    strokeWidth={2}
                                                />
                                            </View>

                                            <View
                                                style={{
                                                    flex: 1,
                                                }}
                                            >
                                                <Text
                                                    style={
                                                        styles.listRowTitle
                                                    }
                                                >
                                                    {autorisation?.type_autorisation ||
                                                        "Autorisation"}
                                                </Text>

                                                <Text
                                                    style={
                                                        styles.listRowSubtitle
                                                    }
                                                >
                                                    Camion :{" "}
                                                    {authCamion?.immatriculation ||
                                                        autorisation?.camion_id ||
                                                        "—"}
                                                </Text>

                                                {authChauffeur ? (
                                                    <Text
                                                        style={
                                                            styles.listRowMeta
                                                        }
                                                    >
                                                        Chauffeur :{" "}
                                                        {authChauffeur?.prenom ||
                                                            ""}{" "}
                                                        {authChauffeur?.nom ||
                                                            ""}
                                                    </Text>
                                                ) : null}
                                            </View>

                                            <View
                                                style={[
                                                    styles.activeBadge,
                                                    {
                                                        backgroundColor:
                                                            autorisation?.actif
                                                                ? COLORS.successBg
                                                                : COLORS.bg,
                                                    },
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.activeBadgeText,
                                                        {
                                                            color:
                                                                autorisation?.actif
                                                                    ? COLORS.success
                                                                    : COLORS.muted,
                                                        },
                                                    ]}
                                                >
                                                    {autorisation?.actif
                                                        ? "Active"
                                                        : "Inactive"}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                ) : null}

                {/* =================================================
                    MULTIPLE TRUCKS
                ================================================= */}
                {currentPrestation ? (
                    <View style={styles.sectionCard}>
                        <SectionTitle
                            icon={Truck}
                            title="Camions affectés"
                            subtitle="Véhicules associés à cette prestation"
                        />

                        {camionsPrestation.length === 0 ? (
                            <EmptyState
                                icon={Truck}
                                title="Aucun camion supplémentaire"
                                description="Aucune affectation détaillée n'est enregistrée dans cette prestation."
                            />
                        ) : (
                            <View style={styles.listContainer}>
                                {camionsPrestation.map(
                                    (item, index) => {
                                        const itemCamion =
                                            item?.camion;

                                        return (
                                            <View
                                                key={
                                                    item?.id ??
                                                    `camion-${index}`
                                                }
                                                style={[
                                                    styles.listRow,
                                                    index <
                                                    camionsPrestation.length -
                                                    1 &&
                                                    styles.listRowBorder,
                                                ]}
                                            >
                                                <View
                                                    style={
                                                        styles.listRowIcon
                                                    }
                                                >
                                                    <Truck
                                                        size={18}
                                                        color={
                                                            COLORS.primary
                                                        }
                                                        strokeWidth={2}
                                                    />
                                                </View>

                                                <View
                                                    style={{
                                                        flex: 1,
                                                    }}
                                                >
                                                    <Text
                                                        style={
                                                            styles.listRowTitle
                                                        }
                                                    >
                                                        {itemCamion?.immatriculation ||
                                                            item?.camion_id ||
                                                            "Camion"}
                                                    </Text>

                                                    <Text
                                                        style={
                                                            styles.listRowSubtitle
                                                        }
                                                    >
                                                        Prévue :{" "}
                                                        {formatNumber(
                                                            item?.quantite_prevue,
                                                            3
                                                        )}{" "}
                                                        {currentPrestation?.unite ||
                                                            ""}
                                                    </Text>
                                                </View>

                                                <View
                                                    style={
                                                        styles.miniStatus
                                                    }
                                                >
                                                    <Text
                                                        style={
                                                            styles.miniStatusText
                                                        }
                                                    >
                                                        {getStatusLabel(
                                                            item?.statut
                                                        )}
                                                    </Text>
                                                </View>
                                            </View>
                                        );
                                    }
                                )}
                            </View>
                        )}
                    </View>
                ) : null}

                {/* =================================================
                    BILLING
                ================================================= */}
                {currentPrestation ? (
                    <View style={styles.sectionCard}>
                        <SectionTitle
                            icon={ReceiptText}
                            title="Facturation"
                            subtitle="Éléments tarifaires associés"
                        />

                        {facturations.length === 0 ? (
                            <EmptyState
                                icon={Banknote}
                                title="Aucune facturation"
                                description="Aucune ligne de facturation n'est actuellement enregistrée."
                            />
                        ) : (
                            <View style={styles.listContainer}>
                                {facturations.map(
                                    (facturation, index) => (
                                        <View
                                            key={
                                                facturation?.id ??
                                                `facturation-${index}`
                                            }
                                            style={[
                                                styles.billingRow,
                                                index <
                                                facturations.length - 1 &&
                                                styles.listRowBorder,
                                            ]}
                                        >
                                            <View
                                                style={
                                                    styles.billingIcon
                                                }
                                            >
                                                <Banknote
                                                    size={18}
                                                    color={
                                                        COLORS.primary
                                                    }
                                                    strokeWidth={2}
                                                />
                                            </View>

                                            <View
                                                style={{
                                                    flex: 1,
                                                }}
                                            >
                                                <Text
                                                    style={
                                                        styles.listRowTitle
                                                    }
                                                >
                                                    {facturation?.libelle ||
                                                        facturation?.code ||
                                                        "Ligne de facturation"}
                                                </Text>

                                                <Text
                                                    style={
                                                        styles.listRowSubtitle
                                                    }
                                                >
                                                    Quantité :{" "}
                                                    {formatNumber(
                                                        facturation?.quantite,
                                                        3
                                                    )}{" "}
                                                    {facturation?.unite ||
                                                        ""}
                                                </Text>
                                            </View>

                                            <View
                                                style={
                                                    styles.billingAmount
                                                }
                                            >
                                                <Text
                                                    style={
                                                        styles.billingAmountText
                                                    }
                                                >
                                                    {formatMoney(
                                                        facturation?.total_ttc ??
                                                        facturation?.total_ht
                                                    )}
                                                </Text>

                                                <Text
                                                    style={
                                                        styles.billingAmountLabel
                                                    }
                                                >
                                                    TTC
                                                </Text>
                                            </View>
                                        </View>
                                    )
                                )}
                            </View>
                        )}
                    </View>
                ) : null}

                {/* =================================================
                    DOCUMENTS
                ================================================= */}
                {currentPrestation ? (
                    <View style={styles.sectionCard}>
                        <SectionTitle
                            icon={FileText}
                            title="Documents"
                            subtitle="Documents liés à la prestation"
                        />

                        {documents.length === 0 ? (
                            <EmptyState
                                icon={FileText}
                                title="Aucun document"
                                description="Aucun document n'est actuellement associé à cette prestation."
                            />
                        ) : (
                            <View style={styles.listContainer}>
                                {documents.map(
                                    (document, index) => (
                                        <View
                                            key={
                                                document?.id ??
                                                `document-${index}`
                                            }
                                            style={[
                                                styles.listRow,
                                                index <
                                                documents.length - 1 &&
                                                styles.listRowBorder,
                                            ]}
                                        >
                                            <View
                                                style={
                                                    styles.listRowIcon
                                                }
                                            >
                                                <FileText
                                                    size={18}
                                                    color={
                                                        COLORS.primary
                                                    }
                                                    strokeWidth={2}
                                                />
                                            </View>

                                            <View
                                                style={{
                                                    flex: 1,
                                                }}
                                            >
                                                <Text
                                                    style={
                                                        styles.listRowTitle
                                                    }
                                                >
                                                    {document?.type_document ||
                                                        "Document"}
                                                </Text>

                                                <Text
                                                    style={
                                                        styles.listRowSubtitle
                                                    }
                                                >
                                                    {document?.numero_document ||
                                                        "Numéro non renseigné"}
                                                </Text>
                                            </View>

                                            <Text
                                                style={
                                                    styles.documentStatus
                                                }
                                            >
                                                {document?.statut ||
                                                    "—"}
                                            </Text>
                                        </View>
                                    )
                                )}
                            </View>
                        )}
                    </View>
                ) : null}

                {/* =================================================
                    OPERATIONS
                ================================================= */}
                {currentPrestation ? (
                    <View style={styles.sectionCard}>
                        <SectionTitle
                            icon={ClipboardList}
                            title="Opérations"
                            subtitle="Étapes opérationnelles"
                        />

                        {operations.length === 0 ? (
                            <EmptyState
                                icon={ClipboardList}
                                title="Aucune opération"
                                description="Aucune opération détaillée n'est actuellement associée."
                            />
                        ) : (
                            <View style={styles.listContainer}>
                                {operations.map(
                                    (operation, index) => (
                                        <View
                                            key={
                                                operation?.id ??
                                                `operation-${index}`
                                            }
                                            style={[
                                                styles.listRow,
                                                index <
                                                operations.length - 1 &&
                                                styles.listRowBorder,
                                            ]}
                                        >
                                            <View
                                                style={
                                                    styles.operationNumber
                                                }
                                            >
                                                <Text
                                                    style={
                                                        styles.operationNumberText
                                                    }
                                                >
                                                    {operation?.ordre ??
                                                        index + 1}
                                                </Text>
                                            </View>

                                            <View
                                                style={{
                                                    flex: 1,
                                                }}
                                            >
                                                <Text
                                                    style={
                                                        styles.listRowTitle
                                                    }
                                                >
                                                    {operation?.operation
                                                        ?.nom ||
                                                        operation?.operation
                                                            ?.libelle ||
                                                        operation?.operation_id ||
                                                        "Opération"}
                                                </Text>

                                                <Text
                                                    style={
                                                        styles.listRowSubtitle
                                                    }
                                                >
                                                    {getStatusLabel(
                                                        operation?.statut
                                                    )}
                                                </Text>
                                            </View>
                                        </View>
                                    )
                                )}
                            </View>
                        )}
                    </View>
                ) : null}

                {/* =================================================
                    EVENTS
                ================================================= */}
                {currentPrestation ? (
                    <View style={styles.sectionCard}>
                        <SectionTitle
                            icon={History}
                            title="Historique"
                            subtitle="Événements de la prestation"
                        />

                        {events.length === 0 ? (
                            <EmptyState
                                icon={History}
                                title="Aucun événement"
                                description="Aucun événement historique n'est actuellement remonté."
                            />
                        ) : (
                            <View style={styles.eventsContainer}>
                                {events.map((event, index) => (
                                    <View
                                        key={
                                            event?.id ??
                                            `event-${index}`
                                        }
                                        style={styles.eventRow}
                                    >
                                        <View
                                            style={
                                                styles.eventTimeline
                                            }
                                        >
                                            <View
                                                style={
                                                    styles.eventDot
                                                }
                                            />

                                            {index <
                                                events.length - 1 ? (
                                                <View
                                                    style={
                                                        styles.eventLine
                                                    }
                                                />
                                            ) : null}
                                        </View>

                                        <View
                                            style={{
                                                flex: 1,
                                            }}
                                        >
                                            <Text
                                                style={
                                                    styles.eventTitle
                                                }
                                            >
                                                {event?.type_evenement ||
                                                    "Événement"}
                                            </Text>

                                            <Text
                                                style={
                                                    styles.eventDescription
                                                }
                                            >
                                                {event?.description ||
                                                    "Aucune description"}
                                            </Text>

                                            <Text
                                                style={
                                                    styles.eventDate
                                                }
                                            >
                                                {formatDateTime(
                                                    event?.created_at
                                                )}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                ) : null}

                {/* =================================================
                    FOOTER
                ================================================= */}
                <View style={styles.footer}>
                    <View style={styles.footerMark}>
                        <Scale
                            size={15}
                            color={COLORS.primary}
                            strokeWidth={2}
                        />
                    </View>

                    <View>
                        <Text style={styles.footerTitle}>
                            MIZAN
                        </Text>

                        <Text style={styles.footerSubtitle}>
                            Gate de pesage · Marsa Maroc
                        </Text>
                    </View>
                </View>

                <View style={styles.bottomSpace} />
            </ScrollView>
        </SafeAreaView>
    );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },

    /* HEADER */
    header: {
        height: 72,
        backgroundColor: COLORS.navy,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#17344E",
    },

    headerBackButton: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#17344E",
        borderWidth: 1,
        borderColor: "#27465F",
    },

    headerCenter: {
        flex: 1,
        marginLeft: 12,
    },

    headerBrandRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },

    headerBrandMark: {
        width: 22,
        height: 22,
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.primary,
    },

    headerBrand: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: "800",
        letterSpacing: 1.5,
    },

    headerTitle: {
        marginTop: 2,
        color: "#D8E5F0",
        fontSize: 12,
        fontWeight: "500",
    },

    headerRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        maxWidth: 105,
    },

    headerStatusDot: {
        width: 7,
        height: 7,
        borderRadius: 7,
    },

    headerStatusText: {
        color: "#D8E5F0",
        fontSize: 10,
        fontWeight: "700",
    },

    /* MAIN */
    scroll: {
        flex: 1,
    },

    content: {
        paddingHorizontal: 14,
        paddingTop: 18,
        paddingBottom: 24,
    },

    pageIntro: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },

    pageEyebrow: {
        fontSize: 10,
        fontWeight: "800",
        color: COLORS.primary,
        letterSpacing: 1.2,
        marginBottom: 4,
    },

    pageTitle: {
        color: COLORS.text,
        fontSize: 23,
        fontWeight: "800",
        letterSpacing: -0.4,
    },

    pageSubtitle: {
        marginTop: 5,
        color: COLORS.muted,
        fontSize: 12,
        lineHeight: 18,
        maxWidth: 285,
    },

    pageIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 12,
        borderWidth: 1,
        borderColor: "#D5E8F5",
    },

    /* TICKET HERO */
    ticketHero: {
        backgroundColor: COLORS.navy,
        borderRadius: 20,
        padding: 17,
        marginBottom: 14,
        overflow: "hidden",
    },

    ticketHeroTop: {
        flexDirection: "row",
        alignItems: "flex-start",
    },

    ticketHeroLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        minWidth: 0,
    },

    qrBox: {
        width: 52,
        height: 52,
        borderRadius: 15,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },

    ticketHeroLabel: {
        color: "#8FA9BD",
        fontSize: 9,
        fontWeight: "800",
        letterSpacing: 1.2,
        marginBottom: 3,
    },

    ticketHeroNumber: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: "800",
    },

    ticketHeroQr: {
        color: "#9EB3C4",
        fontSize: 9,
        marginTop: 3,
    },

    heroStatus: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 9,
        paddingVertical: 6,
        borderRadius: 20,
        marginLeft: 8,
    },

    heroStatusDot: {
        width: 6,
        height: 6,
        borderRadius: 6,
        marginRight: 5,
    },

    heroStatusText: {
        fontSize: 9,
        fontWeight: "800",
    },

    ticketTimeline: {
        marginTop: 18,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: "#29445B",
        flexDirection: "row",
        alignItems: "center",
    },

    timelineItem: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },

    timelineIcon: {
        width: 31,
        height: 31,
        borderRadius: 10,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
    },

    timelineLabel: {
        color: "#7891A5",
        fontSize: 9,
        fontWeight: "700",
        marginBottom: 2,
    },

    timelineValue: {
        color: "#E7EFF5",
        fontSize: 10,
        fontWeight: "600",
    },

    timelineLine: {
        width: 25,
        height: 1,
        backgroundColor: "#35526A",
        marginHorizontal: 7,
    },

    /* SECTION */
    sectionCard: {
        backgroundColor: COLORS.white,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 15,
        marginBottom: 13,
    },

    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
    },

    sectionTitleLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },

    sectionIcon: {
        width: 37,
        height: 37,
        borderRadius: 11,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },

    sectionTitle: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: "800",
    },

    sectionSubtitle: {
        color: COLORS.muted,
        fontSize: 10,
        marginTop: 2,
    },

    /* IDENTITY */
    identityBanner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.blueSoft,
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: "#E0EDF5",
        marginBottom: 12,
    },

    identityMainIcon: {
        width: 46,
        height: 46,
        borderRadius: 14,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 11,
    },

    driverAvatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 11,
    },

    identityLabel: {
        color: COLORS.muted,
        fontSize: 8,
        fontWeight: "800",
        letterSpacing: 1,
        marginBottom: 2,
    },

    identityValue: {
        color: COLORS.text,
        fontSize: 15,
        fontWeight: "800",
    },

    identitySecondary: {
        color: COLORS.muted,
        fontSize: 10,
        marginTop: 3,
    },

    verifiedPill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.successBg,
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 20,
        marginLeft: 7,
    },

    verifiedPillText: {
        color: COLORS.success,
        fontSize: 8,
        fontWeight: "800",
        marginLeft: 4,
    },

    infoGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginHorizontal: -4,
    },

    infoItem: {
        width: "50%",
        paddingHorizontal: 4,
        marginBottom: 10,
        flexDirection: "row",
        alignItems: "center",
    },

    infoItemFull: {
        width: "100%",
    },

    infoIcon: {
        width: 30,
        height: 30,
        borderRadius: 9,
        backgroundColor: COLORS.bg,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
    },

    infoIconAccent: {
        backgroundColor: COLORS.primaryLight,
    },

    infoContent: {
        flex: 1,
    },

    infoLabel: {
        color: COLORS.muted2,
        fontSize: 8,
        fontWeight: "700",
        marginBottom: 2,
    },

    infoValue: {
        color: COLORS.textSoft,
        fontSize: 11,
        fontWeight: "700",
    },

    infoValueAccent: {
        color: COLORS.primaryDark,
    },

    /* MERCHANDISE */
    marchandiseBanner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F7FAFC",
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        borderRadius: 14,
        padding: 12,
        marginBottom: 12,
    },

    marchandiseIcon: {
        width: 45,
        height: 45,
        borderRadius: 13,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 11,
    },

    marchandiseName: {
        color: COLORS.text,
        fontSize: 15,
        fontWeight: "800",
    },

    productBadge: {
        width: 31,
        height: 31,
        borderRadius: 10,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
    },

    /* WEIGHT */
    readOnlyBadge: {
        backgroundColor: COLORS.bg,
        borderRadius: 8,
        paddingHorizontal: 7,
        paddingVertical: 5,
    },

    readOnlyText: {
        color: COLORS.muted,
        fontSize: 7,
        fontWeight: "800",
        letterSpacing: 0.6,
    },

    weightGrid: {
        flexDirection: "row",
        gap: 7,
    },

    weightCard: {
        flex: 1,
        minHeight: 105,
        borderRadius: 14,
        backgroundColor: COLORS.blueSoft,
        borderWidth: 1,
        borderColor: "#DFEBF3",
        padding: 10,
    },

    weightCardNet: {
        backgroundColor: COLORS.successBg,
        borderColor: "#D5EDDC",
    },

    weightIcon: {
        width: 31,
        height: 31,
        borderRadius: 10,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },

    weightLabel: {
        color: COLORS.muted,
        fontSize: 8,
        fontWeight: "800",
        letterSpacing: 0.7,
    },

    weightValue: {
        color: COLORS.text,
        fontSize: 13,
        fontWeight: "800",
        marginTop: 3,
    },

    weightValueNet: {
        color: COLORS.success,
    },

    /* PRESTATIONS */
    countBadge: {
        minWidth: 27,
        height: 27,
        paddingHorizontal: 8,
        borderRadius: 9,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
    },

    countBadgeText: {
        color: COLORS.primary,
        fontSize: 11,
        fontWeight: "800",
    },

    alreadyAssigned: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.successBg,
        borderWidth: 1,
        borderColor: "#D5EDDC",
        borderRadius: 13,
        padding: 11,
        marginBottom: 12,
    },

    alreadyAssignedIcon: {
        width: 35,
        height: 35,
        borderRadius: 10,
        backgroundColor: "#DDF2E4",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 9,
    },

    alreadyAssignedTitle: {
        color: COLORS.success,
        fontSize: 11,
        fontWeight: "800",
    },

    alreadyAssignedText: {
        color: "#527563",
        fontSize: 9,
        marginTop: 2,
        lineHeight: 14,
    },

    prestationsList: {
        gap: 10,
    },

    prestationWrapper: {
        marginBottom: 1,
    },

    prestationCard: {
        backgroundColor: "#FBFCFD",
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 16,
        padding: 12,
    },

    prestationCardSelected: {
        borderColor: COLORS.primary,
        backgroundColor: "#F7FBFE",
        borderWidth: 1.5,
    },

    prestationTop: {
        flexDirection: "row",
        alignItems: "flex-start",
    },

    prestationNumberRow: {
        flexDirection: "row",
        alignItems: "center",
    },

    prestationNumberIcon: {
        width: 25,
        height: 25,
        borderRadius: 8,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 6,
    },

    prestationNumber: {
        color: COLORS.text,
        fontSize: 12,
        fontWeight: "800",
        flexShrink: 1,
    },

    prestationOperation: {
        color: COLORS.muted,
        fontSize: 9,
        marginTop: 4,
        marginLeft: 31,
    },

    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 5,
        marginLeft: 8,
    },

    statusBadgeText: {
        fontSize: 8,
        fontWeight: "800",
        marginLeft: 4,
    },

    prestationInfoGrid: {
        flexDirection: "row",
        gap: 7,
        marginTop: 12,
    },

    prestationMiniItem: {
        flex: 1,
        minWidth: 0,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.white,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        padding: 8,
    },

    miniLabel: {
        color: COLORS.muted2,
        fontSize: 7,
        fontWeight: "700",
        marginBottom: 2,
    },

    miniValue: {
        color: COLORS.textSoft,
        fontSize: 9,
        fontWeight: "800",
    },

    quantityContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 9,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        borderRadius: 11,
        paddingVertical: 9,
    },

    quantityBox: {
        flex: 1,
        alignItems: "center",
    },

    quantityLabel: {
        color: COLORS.muted2,
        fontSize: 7,
        fontWeight: "700",
        marginBottom: 3,
    },

    quantityValue: {
        color: COLORS.text,
        fontSize: 10,
        fontWeight: "800",
    },

    quantityRemaining: {
        color: COLORS.primary,
    },

    quantityDivider: {
        width: 1,
        height: 28,
        backgroundColor: COLORS.border,
    },

    selectPrestationButton: {
        marginTop: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        minHeight: 52,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        backgroundColor: COLORS.white,
    },

    selectPrestationButtonSelected: {
        backgroundColor: COLORS.primaryLight,
        borderColor: "#C6E1F2",
    },

    selectionCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: "#B7C5D1",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 9,
    },

    selectionCircleSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary,
    },

    selectButtonTitle: {
        color: COLORS.textSoft,
        fontSize: 10,
        fontWeight: "800",
    },

    selectButtonTitleSelected: {
        color: COLORS.primaryDark,
    },

    selectButtonSubtitle: {
        color: COLORS.muted,
        fontSize: 8,
        marginTop: 2,
    },

    affectButton: {
        marginTop: 8,
        minHeight: 48,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 12,
    },

    affectButtonText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 0.5,
        marginHorizontal: 8,
    },

    /* SELECTED */
    selectedPrestationHero: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: "#D0E5F3",
        borderRadius: 14,
        padding: 11,
        marginBottom: 13,
    },

    selectedPrestationIcon: {
        width: 45,
        height: 45,
        borderRadius: 13,
        backgroundColor: COLORS.white,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },

    selectedPrestationLabel: {
        color: COLORS.primary,
        fontSize: 7,
        fontWeight: "800",
        letterSpacing: 0.9,
    },

    selectedPrestationNumber: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: "800",
        marginTop: 3,
    },

    detailGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginHorizontal: -4,
    },

    /* LISTS */
    listContainer: {
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        borderRadius: 13,
        overflow: "hidden",
    },

    listRow: {
        minHeight: 63,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 9,
    },

    listRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },

    listRowIcon: {
        width: 35,
        height: 35,
        borderRadius: 10,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 9,
    },

    listRowTitle: {
        color: COLORS.text,
        fontSize: 10,
        fontWeight: "800",
    },

    listRowSubtitle: {
        color: COLORS.muted,
        fontSize: 8,
        marginTop: 3,
    },

    listRowMeta: {
        color: COLORS.muted2,
        fontSize: 8,
        marginTop: 2,
    },

    activeBadge: {
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 5,
        marginLeft: 8,
    },

    activeBadgeText: {
        fontSize: 7,
        fontWeight: "800",
    },

    miniStatus: {
        backgroundColor: COLORS.bg,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 8,
        marginLeft: 6,
    },

    miniStatusText: {
        color: COLORS.muted,
        fontSize: 7,
        fontWeight: "800",
    },

    /* BILLING */
    billingRow: {
        minHeight: 70,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 10,
    },

    billingIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 9,
    },

    billingAmount: {
        alignItems: "flex-end",
        marginLeft: 8,
    },

    billingAmountText: {
        color: COLORS.text,
        fontSize: 10,
        fontWeight: "800",
    },

    billingAmountLabel: {
        color: COLORS.muted2,
        fontSize: 7,
        fontWeight: "700",
        marginTop: 2,
    },

    /* DOCUMENT */
    documentStatus: {
        color: COLORS.muted,
        fontSize: 8,
        fontWeight: "700",
        marginLeft: 7,
    },

    /* OPERATIONS */
    operationNumber: {
        width: 31,
        height: 31,
        borderRadius: 10,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 9,
    },

    operationNumberText: {
        color: COLORS.primary,
        fontSize: 10,
        fontWeight: "800",
    },

    /* EVENTS */
    eventsContainer: {
        paddingVertical: 3,
    },

    eventRow: {
        flexDirection: "row",
        minHeight: 65,
    },

    eventTimeline: {
        width: 25,
        alignItems: "center",
        marginRight: 9,
    },

    eventDot: {
        width: 9,
        height: 9,
        borderRadius: 9,
        backgroundColor: COLORS.primary,
        marginTop: 4,
    },

    eventLine: {
        width: 1,
        flex: 1,
        backgroundColor: COLORS.border,
        marginTop: 4,
    },

    eventTitle: {
        color: COLORS.text,
        fontSize: 10,
        fontWeight: "800",
    },

    eventDescription: {
        color: COLORS.muted,
        fontSize: 9,
        lineHeight: 14,
        marginTop: 2,
    },

    eventDate: {
        color: COLORS.muted2,
        fontSize: 8,
        marginTop: 4,
    },

    /* EMPTY */
    emptyState: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FAFBFC",
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        borderRadius: 13,
        padding: 12,
    },

    emptyIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.bg,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },

    emptyTitle: {
        color: COLORS.textSoft,
        fontSize: 10,
        fontWeight: "800",
    },

    emptyDescription: {
        color: COLORS.muted,
        fontSize: 8,
        lineHeight: 13,
        marginTop: 3,
    },

    /* FOOTER */
    footer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 3,
        paddingVertical: 16,
    },

    footerMark: {
        width: 31,
        height: 31,
        borderRadius: 9,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
    },

    footerTitle: {
        color: COLORS.navy,
        fontSize: 10,
        fontWeight: "900",
        letterSpacing: 1.2,
    },

    footerSubtitle: {
        color: COLORS.muted,
        fontSize: 8,
        marginTop: 2,
    },

    bottomSpace: {
        height: 25,
    },
});