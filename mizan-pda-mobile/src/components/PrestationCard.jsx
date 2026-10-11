import React from 'react';

import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from 'react-native';

import {
    ChevronRight,
    Truck,
    UserRound,
    Package,
    MapPin,
    FileText,
    CheckCircle2,
    Clock3,
    ShieldCheck,
} from 'lucide-react-native';


// ============================================================
// HELPERS
// ============================================================

const formatNumber = (value, decimals = 3) => {
    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {
        return '--';
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return '--';
    }

    return number.toLocaleString('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
    });
};


const getStatusLabel = (statut) => {
    switch (String(statut || '').toUpperCase()) {
        case 'CREEE':
            return 'Créée';

        case 'AFFECTEE':
            return 'Affectée';

        case 'EN_ATTENTE':
        case 'EN_ATTENTE_AFFECTATION':
            return 'En attente';

        case 'EN_COURS':
            return 'En cours';

        case 'PESAGE_ENTREE':
            return 'Pesée entrée';

        case 'PESAGE_SORTIE':
            return 'Pesée sortie';

        case 'TERMINEE':
            return 'Terminée';

        case 'ANNULEE':
            return 'Annulée';

        case 'CLOTUREE':
            return 'Clôturée';

        default:
            return statut || 'Inconnu';
    }
};


const getStatusStyle = (statut) => {
    switch (String(statut || '').toUpperCase()) {
        case 'TERMINEE':
        case 'CLOTUREE':
            return styles.statusDone;

        case 'ANNULEE':
            return styles.statusCancelled;

        case 'PESAGE_ENTREE':
        case 'PESAGE_SORTIE':
            return styles.statusWeighing;

        case 'EN_COURS':
            return styles.statusProgress;

        case 'AFFECTEE':
        case 'EN_ATTENTE':
        case 'EN_ATTENTE_AFFECTATION':
            return styles.statusWaiting;

        case 'CREEE':
            return styles.statusCreated;

        default:
            return styles.statusDefault;
    }
};


// ============================================================
// COMPONENT
// ============================================================

export default function PrestationCard({
    prestation,
    onSelect,
    onAffecter,
    selected = false,
    disabled = false,
}) {
    if (!prestation) {
        return null;
    }

    const statut = String(
        prestation.statut || ''
    ).toUpperCase();

    const isTerminee =
        statut === 'TERMINEE' ||
        statut === 'CLOTUREE';

    const isAnnulee =
        statut === 'ANNULEE';

    const isBloquee =
        isTerminee ||
        isAnnulee ||
        statut === 'CLOTUREE';

    const isDejaAffectee =
        Boolean(prestation.__deja_affectee);

    const camion =
        prestation.camion ||
        null;

    const chauffeur =
        prestation.chauffeur ||
        null;

    const marchandise =
        prestation.marchandise ||
        null;

    const zone =
        prestation.zone ||
        null;

    const autorisations =
        Array.isArray(prestation.autorisations)
            ? prestation.autorisations
            : [];

    const camionsPrestation =
        Array.isArray(prestation.camionsPrestation)
            ? prestation.camionsPrestation
            : [];

    const numeroPrestation =
        prestation.numero_prestation ||
        prestation.numeroPrestation ||
        `PREST-${prestation.id}`;

    const typeOperation =
        prestation.type_operation ||
        prestation.typeOperation ||
        'PESAGE';

    const quantitePrevue =
        prestation.quantite_prevue ??
        prestation.quantitePrevue ??
        null;

    const quantiteRealisee =
        prestation.quantite_realisee ??
        prestation.quantiteRealisee ??
        0;

    const quantiteRestante =
        prestation.quantiteRestante ??
        prestation.quantite_restante ??
        (
            quantitePrevue !== null
                ? Number(quantitePrevue) -
                Number(quantiteRealisee || 0)
                : null
        );

    const unite =
        prestation.unite ||
        marchandise?.unite ||
        'T';

    const chauffeurName = chauffeur
        ? `${chauffeur.prenom || ''} ${chauffeur.nom || ''}`.trim()
        : '--';

    const tracteur =
        camion?.immatriculation ||
        prestation.immatriculation_tracteur ||
        prestation.immatriculation_tracteur_scanned ||
        '--';

    const remorque =
        camion?.immatriculation_remorque ||
        prestation.immatriculation_remorque ||
        prestation.immatriculation_remorque_scanned ||
        '--';

    const dum =
        prestation.dum ||
        '--';

    const emplacement =
        prestation.emplacement ||
        '--';

    const observations =
        prestation.observations ||
        '';

    const isSelectable =
        !isBloquee &&
        !disabled;

    const handleSelect = () => {
        if (!isSelectable) {
            return;
        }

        if (typeof onSelect === 'function') {
            onSelect(prestation);
        }
    };

    const handleAffecter = async () => {
        if (
            typeof onAffecter !== 'function' ||
            isBloquee ||
            disabled
        ) {
            return;
        }

        try {
            await onAffecter(prestation);
        } catch (error) {
            Alert.alert(
                'Affectation impossible',
                error?.message ||
                'Une erreur est survenue pendant l’affectation.'
            );
        }
    };

    const progress =
        quantitePrevue !== null &&
            Number(quantitePrevue) > 0
            ? Math.min(
                100,
                Math.max(
                    0,
                    (
                        Number(quantiteRealisee || 0) /
                        Number(quantitePrevue)
                    ) * 100
                )
            )
            : 0;

    return (
        <View
            style={[
                styles.card,

                selected &&
                styles.cardSelected,

                isTerminee &&
                styles.cardDone,

                isAnnulee &&
                styles.cardCancelled,
            ]}
        >

            {/* ====================================================
                TOP
            ==================================================== */}

            <View style={styles.topRow}>

                <View style={styles.numberContainer}>

                    <View style={styles.numberIcon}>
                        <FileText
                            size={17}
                            color="#2563eb"
                        />
                    </View>

                    <View style={styles.numberInfo}>

                        <Text style={styles.numberLabel}>
                            PRESTATION
                        </Text>

                        <Text
                            style={styles.number}
                            numberOfLines={1}
                        >
                            {numeroPrestation}
                        </Text>

                    </View>

                </View>


                <View
                    style={[
                        styles.statusBadge,
                        getStatusStyle(statut),
                    ]}
                >
                    <Text style={styles.statusText}>
                        {getStatusLabel(statut)}
                    </Text>
                </View>

            </View>


            {/* ====================================================
                MAIN INFO
            ==================================================== */}

            <View style={styles.mainInfo}>

                <View style={styles.mainInfoItem}>

                    <Package
                        size={16}
                        color="#64748b"
                    />

                    <View style={styles.mainInfoText}>

                        <Text style={styles.label}>
                            Marchandise
                        </Text>

                        <Text
                            style={styles.value}
                            numberOfLines={1}
                        >
                            {marchandise?.nom || '--'}
                        </Text>

                    </View>

                </View>


                <View style={styles.mainInfoItem}>

                    <Truck
                        size={16}
                        color="#64748b"
                    />

                    <View style={styles.mainInfoText}>

                        <Text style={styles.label}>
                            Tracteur
                        </Text>

                        <Text
                            style={styles.value}
                            numberOfLines={1}
                        >
                            {tracteur}
                        </Text>

                    </View>

                </View>


                <View style={styles.mainInfoItem}>

                    <UserRound
                        size={16}
                        color="#64748b"
                    />

                    <View style={styles.mainInfoText}>

                        <Text style={styles.label}>
                            Chauffeur
                        </Text>

                        <Text
                            style={styles.value}
                            numberOfLines={1}
                        >
                            {chauffeurName}
                        </Text>

                    </View>

                </View>


                <View style={styles.mainInfoItem}>

                    <MapPin
                        size={16}
                        color="#64748b"
                    />

                    <View style={styles.mainInfoText}>

                        <Text style={styles.label}>
                            Zone
                        </Text>

                        <Text
                            style={styles.value}
                            numberOfLines={1}
                        >
                            {zone?.nom ||
                                zone?.code ||
                                emplacement}
                        </Text>

                    </View>

                </View>

            </View>


            {/* ====================================================
                QUANTITIES
            ==================================================== */}

            <View style={styles.quantitySection}>

                <View style={styles.quantityHeader}>

                    <View>

                        <Text style={styles.quantityTitle}>
                            Avancement
                        </Text>

                        <Text style={styles.quantitySubtitle}>
                            Quantité réalisée
                        </Text>

                    </View>

                    <Text style={styles.quantityPercentage}>
                        {Math.round(progress)}%
                    </Text>

                </View>


                <View style={styles.progressBackground}>

                    <View
                        style={[
                            styles.progressBar,
                            {
                                width: `${progress}%`,
                            },
                        ]}
                    />

                </View>


                <View style={styles.quantityValues}>

                    <View>

                        <Text style={styles.quantityLabel}>
                            PRÉVUE
                        </Text>

                        <Text style={styles.quantityValue}>
                            {formatNumber(
                                quantitePrevue
                            )} {unite}
                        </Text>

                    </View>


                    <View>

                        <Text style={styles.quantityLabel}>
                            RÉALISÉE
                        </Text>

                        <Text style={styles.quantityValue}>
                            {formatNumber(
                                quantiteRealisee
                            )} {unite}
                        </Text>

                    </View>


                    <View style={styles.remainingBox}>

                        <Text style={styles.quantityLabel}>
                            RESTANTE
                        </Text>

                        <Text style={styles.remainingValue}>
                            {formatNumber(
                                quantiteRestante
                            )} {unite}
                        </Text>

                    </View>

                </View>

            </View>


            {/* ====================================================
                META
            ==================================================== */}

            <View style={styles.metaRow}>

                <View style={styles.metaItem}>

                    <Text style={styles.metaLabel}>
                        TYPE
                    </Text>

                    <Text style={styles.metaValue}>
                        {typeOperation}
                    </Text>

                </View>


                <View style={styles.metaItem}>

                    <Text style={styles.metaLabel}>
                        PRIORITÉ
                    </Text>

                    <Text style={styles.metaValue}>
                        {prestation.priorite ?? '--'}
                    </Text>

                </View>


                <View style={styles.metaItem}>

                    <Text style={styles.metaLabel}>
                        DUM
                    </Text>

                    <Text
                        style={styles.metaValue}
                        numberOfLines={1}
                    >
                        {dum}
                    </Text>

                </View>

            </View>


            {/* ====================================================
                AUTHORIZATION / TRUCKS
            ==================================================== */}

            {(autorisations.length > 0 ||
                camionsPrestation.length > 0) && (

                    <View style={styles.authorizationBox}>

                        <View style={styles.authorizationHeader}>

                            <ShieldCheck
                                size={16}
                                color="#2563eb"
                            />

                            <Text style={styles.authorizationTitle}>
                                Autorisation opérationnelle
                            </Text>

                        </View>


                        <Text style={styles.authorizationText}>

                            {autorisations.length > 0
                                ? `${autorisations.length} autorisation${autorisations.length > 1 ? 's' : ''}`
                                : `${camionsPrestation.length} camion${camionsPrestation.length > 1 ? 's' : ''} affecté${camionsPrestation.length > 1 ? 's' : ''}`}

                        </Text>

                    </View>
                )}


            {/* ====================================================
                OBSERVATIONS
            ==================================================== */}

            {observations ? (

                <View style={styles.observationBox}>

                    <Text style={styles.observationLabel}>
                        OBSERVATIONS
                    </Text>

                    <Text style={styles.observationText}>
                        {observations}
                    </Text>

                </View>

            ) : null}


            {/* ====================================================
                ACTION
            ==================================================== */}

            {isBloquee ? (

                <View
                    style={[
                        styles.disabledButton,
                        isTerminee &&
                        styles.doneButton,
                        isAnnulee &&
                        styles.cancelledButton,
                    ]}
                >

                    <CheckCircle2
                        size={17}
                        color={
                            isTerminee
                                ? '#15803d'
                                : '#9ca3af'
                        }
                    />

                    <Text
                        style={[
                            styles.disabledButtonText,
                            isTerminee &&
                            styles.doneButtonText,
                        ]}
                    >
                        {isTerminee
                            ? 'PRESTATION TERMINÉE'
                            : 'PRESTATION INDISPONIBLE'}
                    </Text>

                </View>

            ) : isDejaAffectee ? (

                <View style={styles.alreadyAssignedButton}>

                    <CheckCircle2
                        size={17}
                        color="#15803d"
                    />

                    <Text style={styles.alreadyAssignedText}>
                        TICKET DÉJÀ AFFECTÉ
                    </Text>

                </View>

            ) : (

                <TouchableOpacity
                    style={[
                        styles.actionButton,
                        selected &&
                        styles.actionButtonSelected,
                    ]}
                    activeOpacity={0.85}
                    onPress={handleAffecter}
                    disabled={disabled}
                >

                    <View style={styles.actionLeft}>

                        <Text style={styles.actionText}>
                            AFFECTER AU TICKET
                        </Text>

                        <Text style={styles.actionSubtext}>
                            Sélectionner cette prestation
                        </Text>

                    </View>

                    <ChevronRight
                        size={20}
                        color="#ffffff"
                    />

                </TouchableOpacity>

            )}


            {/* ====================================================
                SELECTOR
            ==================================================== */}

            {!isBloquee &&
                !isDejaAffectee && (

                    <TouchableOpacity
                        style={[
                            styles.selectButton,
                            selected &&
                            styles.selectButtonSelected,
                        ]}
                        activeOpacity={0.8}
                        onPress={handleSelect}
                        disabled={disabled}
                    >

                        <Text
                            style={[
                                styles.selectButtonText,
                                selected &&
                                styles.selectButtonTextSelected,
                            ]}
                        >
                            {selected
                                ? 'PRESTATION SÉLECTIONNÉE'
                                : 'VOIR LES DÉTAILS'}
                        </Text>

                    </TouchableOpacity>

                )}

        </View>
    );
}


// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({

    card: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#0f172a',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        elevation: 2,
    },

    cardSelected: {
        borderColor: '#2563eb',
        borderWidth: 2,
        backgroundColor: '#f8fbff',
    },

    cardDone: {
        borderColor: '#bbf7d0',
        backgroundColor: '#f8fff9',
    },

    cardCancelled: {
        borderColor: '#fecaca',
        backgroundColor: '#fffafa',
    },


    // TOP

    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    numberContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        paddingRight: 10,
    },

    numberIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#eff6ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    numberInfo: {
        flex: 1,
    },

    numberLabel: {
        fontSize: 8,
        fontWeight: '900',
        color: '#94a3b8',
        letterSpacing: 0.8,
    },

    number: {
        marginTop: 2,
        fontSize: 15,
        fontWeight: '900',
        color: '#0f172a',
    },

    statusBadge: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },

    statusText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#334155',
    },

    statusCreated: {
        backgroundColor: '#f1f5f9',
    },

    statusDefault: {
        backgroundColor: '#f1f5f9',
    },

    statusWaiting: {
        backgroundColor: '#fef3c7',
    },

    statusProgress: {
        backgroundColor: '#dbeafe',
    },

    statusWeighing: {
        backgroundColor: '#ede9fe',
    },

    statusDone: {
        backgroundColor: '#dcfce7',
    },

    statusCancelled: {
        backgroundColor: '#fee2e2',
    },


    // MAIN INFO

    mainInfo: {
        marginTop: 16,
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -5,
    },

    mainInfoItem: {
        width: '50%',
        paddingHorizontal: 5,
        marginBottom: 14,
        flexDirection: 'row',
        alignItems: 'center',
    },

    mainInfoText: {
        flex: 1,
        marginLeft: 8,
    },

    label: {
        fontSize: 8,
        fontWeight: '800',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },

    value: {
        marginTop: 3,
        fontSize: 12,
        fontWeight: '800',
        color: '#0f172a',
    },


    // QUANTITY

    quantitySection: {
        marginTop: 3,
        padding: 13,
        borderRadius: 15,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },

    quantityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    quantityTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: '#0f172a',
    },

    quantitySubtitle: {
        marginTop: 2,
        fontSize: 10,
        color: '#64748b',
    },

    quantityPercentage: {
        fontSize: 17,
        fontWeight: '900',
        color: '#2563eb',
    },

    progressBackground: {
        height: 7,
        borderRadius: 999,
        backgroundColor: '#e2e8f0',
        overflow: 'hidden',
        marginTop: 12,
    },

    progressBar: {
        height: '100%',
        borderRadius: 999,
        backgroundColor: '#2563eb',
    },

    quantityValues: {
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    quantityLabel: {
        fontSize: 8,
        fontWeight: '900',
        color: '#94a3b8',
    },

    quantityValue: {
        marginTop: 3,
        fontSize: 11,
        fontWeight: '800',
        color: '#334155',
    },

    remainingBox: {
        alignItems: 'flex-end',
    },

    remainingValue: {
        marginTop: 3,
        fontSize: 11,
        fontWeight: '900',
        color: '#2563eb',
    },


    // META

    metaRow: {
        flexDirection: 'row',
        marginTop: 15,
        paddingTop: 13,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },

    metaItem: {
        flex: 1,
    },

    metaLabel: {
        fontSize: 8,
        fontWeight: '900',
        color: '#94a3b8',
    },

    metaValue: {
        marginTop: 3,
        fontSize: 10,
        fontWeight: '800',
        color: '#334155',
    },


    // AUTHORIZATION

    authorizationBox: {
        marginTop: 12,
        padding: 11,
        borderRadius: 12,
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#dbeafe',
        flexDirection: 'row',
        alignItems: 'center',
    },

    authorizationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },

    authorizationTitle: {
        marginLeft: 7,
        fontSize: 10,
        fontWeight: '900',
        color: '#1e40af',
    },

    authorizationText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#2563eb',
    },


    // OBSERVATION

    observationBox: {
        marginTop: 12,
        padding: 11,
        borderRadius: 12,
        backgroundColor: '#fafafa',
    },

    observationLabel: {
        fontSize: 8,
        fontWeight: '900',
        color: '#94a3b8',
    },

    observationText: {
        marginTop: 4,
        fontSize: 11,
        lineHeight: 17,
        color: '#475569',
    },


    // ACTION

    actionButton: {
        marginTop: 14,
        minHeight: 52,
        borderRadius: 14,
        backgroundColor: '#2563eb',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
    },

    actionButtonSelected: {
        backgroundColor: '#1d4ed8',
    },

    actionLeft: {
        flex: 1,
    },

    actionText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#ffffff',
    },

    actionSubtext: {
        marginTop: 2,
        fontSize: 9,
        color: '#dbeafe',
    },

    disabledButton: {
        marginTop: 14,
        minHeight: 48,
        borderRadius: 13,
        backgroundColor: '#f1f5f9',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
    },

    disabledButtonText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94a3b8',
    },

    doneButton: {
        backgroundColor: '#dcfce7',
    },

    doneButtonText: {
        color: '#15803d',
    },

    cancelledButton: {
        backgroundColor: '#fee2e2',
    },

    alreadyAssignedButton: {
        marginTop: 14,
        minHeight: 48,
        borderRadius: 13,
        backgroundColor: '#f0fdf4',
        borderWidth: 1,
        borderColor: '#bbf7d0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
    },

    alreadyAssignedText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#15803d',
    },


    // SELECT

    selectButton: {
        marginTop: 8,
        minHeight: 40,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },

    selectButtonSelected: {
        backgroundColor: '#eff6ff',
        borderColor: '#bfdbfe',
    },

    selectButtonText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#64748b',
        letterSpacing: 0.4,
    },

    selectButtonTextSelected: {
        color: '#2563eb',
    },

});