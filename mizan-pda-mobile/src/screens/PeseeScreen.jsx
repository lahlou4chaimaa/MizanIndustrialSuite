import React from 'react';

import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';


export default function PrestationCard({
    prestation,
    onSelect,
}) {

    if (!prestation) {
        return null;
    }


    /*
     * ============================================================
     * DONNÉES PRINCIPALES
     * ============================================================
     */

    const statut = String(
        prestation.statut || ''
    ).toUpperCase();


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


    const isTerminee =
        statut === 'TERMINEE';


    const isAnnulee =
        statut === 'ANNULEE';


    /*
     * ============================================================
     * STATUTS
     *
     * CREEE :
     *   consultation autorisée
     *   mais pas de pesée
     *
     * AFFECTEE :
     *   consultation / ouverture
     *
     * EN_ATTENTE :
     *   consultation / ouverture
     *
     * EN_COURS :
     *   pesée
     *
     * PESAGE_ENTREE :
     *   pesée entrée
     *
     * PESAGE_SORTIE :
     *   pesée sortie
     * ============================================================
     */

    const isSelectable = [
        'CREEE',
        'AFFECTEE',
        'EN_ATTENTE',
        'EN_COURS',
        'PESAGE_ENTREE',
        'PESAGE_SORTIE',
    ].includes(
        statut
    );


    /*
     * ============================================================
     * LABEL STATUT
     * ============================================================
     */

    const getStatusLabel = () => {

        switch (statut) {

            case 'CREEE':
                return 'Créée';


            case 'AFFECTEE':
                return 'Affectée';


            case 'EN_ATTENTE':
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


            default:
                return (
                    prestation.statut ||
                    'Inconnu'
                );
        }
    };


    /*
     * ============================================================
     * STYLE STATUT
     * ============================================================
     */

    const getStatusStyle = () => {

        switch (statut) {

            case 'TERMINEE':
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
                return styles.statusWaiting;


            case 'CREEE':
                return styles.statusCreated;


            default:
                return styles.statusDefault;
        }
    };


    /*
     * ============================================================
     * LABEL BOUTON
     * ============================================================
     */

    const getButtonLabel = () => {

        switch (statut) {

            case 'CREEE':
                return 'Voir la prestation';


            case 'AFFECTEE':
                return 'Ouvrir la prestation';


            case 'EN_ATTENTE':
                return 'Ouvrir la prestation';


            case 'EN_COURS':
                return 'Commencer le pesage';


            case 'PESAGE_ENTREE':
                return 'Ouvrir le pesage';


            case 'PESAGE_SORTIE':
                return 'Continuer le pesage';


            case 'TERMINEE':
                return 'Terminée';


            case 'ANNULEE':
                return 'Annulée';


            default:
                return 'Indisponible';
        }
    };


    /*
     * ============================================================
     * STYLE BOUTON
     * ============================================================
     */

    const getButtonStyle = () => {

        if (isTerminee) {
            return styles.buttonDone;
        }


        if (isAnnulee) {
            return styles.buttonDisabled;
        }


        /*
         * CREEE peut être consultée,
         * mais elle n'est pas encore affectée.
         */

        if (statut === 'CREEE') {
            return styles.buttonView;
        }


        return styles.buttonActive;
    };


    /*
     * ============================================================
     * STYLE TEXTE BOUTON
     * ============================================================
     */

    const getButtonTextStyle = () => {

        if (isTerminee) {
            return styles.buttonTextDone;
        }


        if (isAnnulee) {
            return styles.buttonTextDisabled;
        }


        if (statut === 'CREEE') {
            return styles.buttonTextView;
        }


        return styles.buttonTextActive;
    };


    /*
     * ============================================================
     * CLICK
     * ============================================================
     */

    const handlePress = () => {

        if (
            !isSelectable ||
            typeof onSelect !== 'function'
        ) {
            return;
        }


        console.log(
            '[PRESTATION CARD] Sélection:',
            prestation.id,
            prestation.numero_prestation,
            statut
        );


        onSelect(
            prestation
        );
    };


    /*
     * ============================================================
     * CHAUFFEUR
     * ============================================================
     */

    const chauffeurName =
        chauffeur
            ? `${chauffeur.prenom || ''} ${chauffeur.nom || ''}`.trim()
            : (
                prestation.chauffeur_nom ||
                '--'
            );


    /*
     * ============================================================
     * TRACTEUR
     * ============================================================
     */

    const tracteur =
        camion?.immatriculation ||
        camion?.matricule ||
        prestation.immatriculation_tracteur ||
        prestation.immatriculation_tracteur_scanned ||
        prestation.matriculeTracteur ||
        '--';


    /*
     * ============================================================
     * REMORQUE
     * ============================================================
     */

    const remorque =
        camion?.immatriculation_remorque ||
        camion?.matricule_remorque ||
        prestation.immatriculation_remorque ||
        prestation.immatriculation_remorque_scanned ||
        prestation.matriculeRemorque ||
        '--';


    /*
     * ============================================================
     * QUANTITÉ PRÉVUE
     * ============================================================
     */

    const quantitePrevue =
        prestation.quantite_prevue ??
        prestation.quantitePrevue ??
        null;


    /*
     * ============================================================
     * QUANTITÉ RÉALISÉE
     * ============================================================
     */

    const quantiteRealisee =
        prestation.quantite_realisee ??
        prestation.quantiteRealisee ??
        0;


    /*
     * ============================================================
     * UNITÉ
     * ============================================================
     */

    const unite =
        prestation.unite ||
        marchandise?.unite ||
        '';


    /*
     * ============================================================
     * FORMAT QUANTITÉ
     * ============================================================
     */

    const formattedQuantity =
        quantitePrevue !== null &&
            quantitePrevue !== undefined &&
            quantitePrevue !== ''
            ? `${Number(
                quantitePrevue
            ).toLocaleString(
                'fr-FR'
            )}${unite ? ` ${unite}` : ''}`
            : '--';


    /*
     * ============================================================
     * FORMAT QUANTITÉ RÉALISÉE
     * ============================================================
     */

    const formattedRealizedQuantity =
        Number(
            quantiteRealisee || 0
        ).toLocaleString(
            'fr-FR'
        );


    /*
     * ============================================================
     * TYPE PRESTATION
     * ============================================================
     */

    const typePrestation =
        prestation.type ||
        prestation.type_prestation ||
        prestation.type_operation ||
        'Prestation';


    /*
     * ============================================================
     * NUMÉRO PRESTATION
     * ============================================================
     */

    const numeroPrestation =
        prestation.numero_prestation ||
        prestation.numeroPrestation ||
        `Prestation #${prestation.id}`;


    return (

        <View
            style={[
                styles.card,
                isTerminee &&
                styles.cardDone,
                isAnnulee &&
                styles.cardCancelled,
            ]}
        >

            {/* ====================================================
                HEADER
            ==================================================== */}

            <View
                style={
                    styles.header
                }
            >

                <View
                    style={
                        styles.headerInfo
                    }
                >

                    <Text
                        style={
                            styles.title
                        }

                        numberOfLines={1}
                    >
                        {numeroPrestation}
                    </Text>


                    <Text
                        style={
                            styles.type
                        }
                    >
                        {typePrestation}
                    </Text>

                </View>


                <View
                    style={[
                        styles.statusBadge,
                        getStatusStyle(),
                    ]}
                >

                    <Text
                        style={
                            styles.statusText
                        }
                    >
                        {getStatusLabel()}
                    </Text>

                </View>

            </View>


            {/* ====================================================
                SEPARATOR
            ==================================================== */}

            <View
                style={
                    styles.separator
                }
            />


            {/* ====================================================
                INFORMATIONS
            ==================================================== */}

            <View
                style={
                    styles.infoGrid
                }
            >

                {/* MARCHANDISE */}

                <View
                    style={
                        styles.infoItem
                    }
                >

                    <Text
                        style={
                            styles.infoLabel
                        }
                    >
                        Marchandise
                    </Text>


                    <Text
                        style={
                            styles.infoValue
                        }

                        numberOfLines={1}
                    >
                        {
                            marchandise?.nom ||
                            marchandise?.libelle ||
                            prestation.marchandise_nom ||
                            '--'
                        }
                    </Text>

                </View>


                {/* ZONE */}

                <View
                    style={
                        styles.infoItem
                    }
                >

                    <Text
                        style={
                            styles.infoLabel
                        }
                    >
                        Zone
                    </Text>


                    <Text
                        style={
                            styles.infoValue
                        }

                        numberOfLines={1}
                    >
                        {
                            zone?.nom ||
                            zone?.code ||
                            prestation.zone_nom ||
                            '--'
                        }
                    </Text>

                </View>


                {/* TRACTEUR */}

                <View
                    style={
                        styles.infoItem
                    }
                >

                    <Text
                        style={
                            styles.infoLabel
                        }
                    >
                        Tracteur
                    </Text>


                    <Text
                        style={
                            styles.infoValue
                        }

                        numberOfLines={1}
                    >
                        {tracteur}
                    </Text>

                </View>


                {/* REMORQUE */}

                <View
                    style={
                        styles.infoItem
                    }
                >

                    <Text
                        style={
                            styles.infoLabel
                        }
                    >
                        Remorque
                    </Text>


                    <Text
                        style={
                            styles.infoValue
                        }

                        numberOfLines={1}
                    >
                        {remorque}
                    </Text>

                </View>


                {/* CHAUFFEUR */}

                <View
                    style={
                        styles.infoItem
                    }
                >

                    <Text
                        style={
                            styles.infoLabel
                        }
                    >
                        Chauffeur
                    </Text>


                    <Text
                        style={
                            styles.infoValue
                        }

                        numberOfLines={1}
                    >
                        {chauffeurName}
                    </Text>

                </View>


                {/* QUANTITÉ PRÉVUE */}

                <View
                    style={
                        styles.infoItem
                    }
                >

                    <Text
                        style={
                            styles.infoLabel
                        }
                    >
                        Quantité prévue
                    </Text>


                    <Text
                        style={
                            styles.infoValue
                        }

                        numberOfLines={1}
                    >
                        {formattedQuantity}
                    </Text>

                </View>


                {/* QUANTITÉ RÉALISÉE */}

                <View
                    style={
                        styles.infoItem
                    }
                >

                    <Text
                        style={
                            styles.infoLabel
                        }
                    >
                        Quantité réalisée
                    </Text>


                    <Text
                        style={
                            styles.infoValue
                        }

                        numberOfLines={1}
                    >
                        {formattedRealizedQuantity}
                        {
                            unite
                                ? ` ${unite}`
                                : ''
                        }
                    </Text>

                </View>


                {/* ID */}

                <View
                    style={
                        styles.infoItem
                    }
                >

                    <Text
                        style={
                            styles.infoLabel
                        }
                    >
                        Référence
                    </Text>


                    <Text
                        style={
                            styles.infoValue
                        }

                        numberOfLines={1}
                    >
                        #{prestation.id}
                    </Text>

                </View>

            </View>


            {/* ====================================================
                ACTION
            ==================================================== */}

            <TouchableOpacity
                style={[
                    styles.actionButton,
                    getButtonStyle(),
                ]}

                onPress={
                    handlePress
                }

                disabled={
                    !isSelectable
                }

                activeOpacity={
                    isSelectable
                        ? 0.75
                        : 1
                }
            >

                <Text
                    style={[
                        styles.actionButtonText,
                        getButtonTextStyle(),
                    ]}
                >
                    {getButtonLabel()}
                </Text>

            </TouchableOpacity>

        </View>
    );
}


const styles =
    StyleSheet.create({

        /* ================= CARD ================= */

        card: {
            backgroundColor: '#ffffff',
            borderRadius: 16,
            padding: 16,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: '#e5e7eb',
        },

        cardDone: {
            borderColor: '#bbf7d0',
            backgroundColor: '#f0fdf4',
        },

        cardCancelled: {
            borderColor: '#fecaca',
            backgroundColor: '#fef2f2',
        },


        /* ================= HEADER ================= */

        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
        },

        headerInfo: {
            flex: 1,
            paddingRight: 10,
        },

        title: {
            fontSize: 16,
            fontWeight: '900',
            color: '#111827',
        },

        type: {
            marginTop: 4,
            fontSize: 12,
            color: '#6b7280',
            fontWeight: '600',
        },


        /* ================= STATUS ================= */

        statusBadge: {
            borderRadius: 20,
            paddingHorizontal: 10,
            paddingVertical: 6,
            maxWidth: 130,
        },

        statusCreated: {
            backgroundColor: '#f3f4f6',
        },

        statusDefault: {
            backgroundColor: '#f3f4f6',
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

        statusText: {
            fontSize: 10,
            fontWeight: '900',
            color: '#374151',
        },


        /* ================= SEPARATOR ================= */

        separator: {
            height: 1,
            backgroundColor: '#f1f5f9',
            marginVertical: 14,
        },


        /* ================= INFO GRID ================= */

        infoGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginHorizontal: -5,
        },

        infoItem: {
            width: '50%',
            paddingHorizontal: 5,
            marginBottom: 13,
        },

        infoLabel: {
            fontSize: 10,
            color: '#9ca3af',
            fontWeight: '700',
            textTransform: 'uppercase',
        },

        infoValue: {
            marginTop: 3,
            fontSize: 13,
            color: '#111827',
            fontWeight: '700',
        },


        /* ================= ACTION ================= */

        actionButton: {
            minHeight: 46,
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 3,
            paddingHorizontal: 12,
        },

        buttonActive: {
            backgroundColor: '#111827',
        },

        buttonView: {
            backgroundColor: '#eff6ff',
            borderWidth: 1,
            borderColor: '#bfdbfe',
        },

        buttonDone: {
            backgroundColor: '#dcfce7',
        },

        buttonDisabled: {
            backgroundColor: '#f3f4f6',
        },

        actionButtonText: {
            fontSize: 12,
            fontWeight: '900',
            textAlign: 'center',
        },

        buttonTextActive: {
            color: '#ffffff',
        },

        buttonTextView: {
            color: '#2563eb',
        },

        buttonTextDone: {
            color: '#166534',
        },

        buttonTextDisabled: {
            color: '#9ca3af',
        },

    });