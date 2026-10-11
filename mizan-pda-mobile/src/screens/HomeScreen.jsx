import React, {
    useState,
} from 'react';

import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    ScrollView,
    StatusBar,
} from 'react-native';

import {
    QrCode,
    ScanLine,
    Truck,
    Package,
    Weight,
    Clock3,
    ChevronRight,
    CircleCheck,
    ArrowUpRight,
    RefreshCw,
    MapPin,
    UserRound,
    Boxes,
    ClipboardList,
    ShieldCheck,
    FileText,
} from 'lucide-react-native';

import Header from '../components/Header';
import CaameraScanner from '../components/CaameraScanner';


/*
 * ================================================================
 * HOME SCREEN
 * ================================================================
 */

export default function HomeScreen({
    onDossierScanned,
    prestations = [],
    onLoadPrestations,
    onSelectPrestation,
}) {

    const [
        isScanning,
        setIsScanning,
    ] = useState(false);

    const [
        loading,
        setLoading,
    ] = useState(false);


    /*
     * ============================================================
     * QR DÉTECTÉ
     * ============================================================
     */

    const handleScanned = async ({
        data,
    }) => {

        if (
            !data ||
            loading
        ) {
            return;
        }

        const qrCode =
            String(
                data
            ).trim();


        if (!qrCode) {
            return;
        }


        console.log(
            '[HOME] QR Ticket détecté:',
            qrCode
        );


        setIsScanning(
            false
        );

        setLoading(
            true
        );


        try {

            await onDossierScanned(
                qrCode
            );

        } catch (error) {

            console.error(
                '[HOME] Erreur récupération prestation:',
                error
            );


            Alert.alert(
                'Ticket introuvable',
                error?.message ||
                'Aucune prestation ne correspond à ce QR code.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setIsScanning(
                                false
                            );
                        },
                    },
                ]
            );

        } finally {

            setLoading(
                false
            );
        }
    };


    /*
     * ============================================================
     * ANNULER SCAN
     * ============================================================
     */

    const handleCancelScan = () => {

        if (loading) {
            return;
        }

        console.log(
            '[HOME] Scan annulé'
        );

        setIsScanning(
            false
        );
    };


    /*
     * ============================================================
     * OUVRIR CAMÉRA
     * ============================================================
     */

    const handleStartScan = () => {

        if (loading) {
            return;
        }

        console.log(
            '[HOME] Ouverture du scanner'
        );

        setIsScanning(
            true
        );
    };


    /*
     * ============================================================
     * SCANNER
     * ============================================================
     */

    if (isScanning) {

        return (
            <View
                style={
                    styles.scannerScreen
                }
            >

                <StatusBar
                    barStyle="light-content"
                    backgroundColor="#07111F"
                />

                <CaameraScanner
                    onScanned={
                        handleScanned
                    }

                    onCancel={
                        handleCancelScan
                    }
                />

            </View>
        );
    }


    /*
     * ============================================================
     * CALCULS AFFICHAGE
     * ============================================================
     */

    const totalPrestations =
        prestations.length;

    const totalCamions =
        new Set(
            prestations
                .map(
                    prestation =>
                        prestation?.camion?.id ||
                        prestation?.camion_id
                )
                .filter(Boolean)
        ).size;

    const totalTerminees =
        prestations.filter(
            prestation =>
                String(
                    prestation?.statut || ''
                ).toUpperCase() === 'TERMINEE'
        ).length;


    /*
     * ============================================================
     * DASHBOARD
     * ============================================================
     */

    return (
        <View
            style={
                styles.container
            }
        >

            <StatusBar
                barStyle="dark-content"
                backgroundColor="#F5F8FC"
            />


            <Header />


            <ScrollView
                style={
                    styles.scroll
                }

                contentContainerStyle={
                    styles.content
                }

                showsVerticalScrollIndicator={
                    false
                }
            >

                {/* =================================================
                    INTRODUCTION
                ================================================= */}

                <View
                    style={
                        styles.intro
                    }
                >

                    <View
                        style={
                            styles.introText
                        }
                    >

                        <View
                            style={
                                styles.systemBadge
                            }
                        >

                            <View
                                style={
                                    styles.systemDot
                                }
                            />

                            <Text
                                style={
                                    styles.systemBadgeText
                                }
                            >
                                SYSTÈME OPÉRATIONNEL
                            </Text>

                        </View>


                        <Text
                            style={
                                styles.introTitle
                            }
                        >
                            Poste PDA
                        </Text>


                        <Text
                            style={
                                styles.introSubtitle
                            }
                        >
                            Gestion et affectation
                            des tickets de pesée
                        </Text>

                    </View>


                    <View
                        style={
                            styles.introIcon
                        }
                    >

                        <Weight
                            size={27}
                            color="#1769AA"
                            strokeWidth={1.8}
                        />

                    </View>

                </View>


                {/* =================================================
                    STATISTIQUES
                ================================================= */}

                <View
                    style={
                        styles.statsRow
                    }
                >

                    <View
                        style={
                            styles.statCard
                        }
                    >

                        <View
                            style={
                                [
                                    styles.statIcon,
                                    styles.statIconBlue,
                                ]
                            }
                        >

                            <ClipboardList
                                size={17}
                                color="#1769AA"
                            />

                        </View>


                        <View>

                            <Text
                                style={
                                    styles.statValue
                                }
                            >
                                {totalPrestations}
                            </Text>


                            <Text
                                style={
                                    styles.statLabel
                                }
                            >
                                Prestations
                            </Text>

                        </View>

                    </View>


                    <View
                        style={
                            styles.statCard
                        }
                    >

                        <View
                            style={
                                [
                                    styles.statIcon,
                                    styles.statIconSlate,
                                ]
                            }
                        >

                            <Truck
                                size={17}
                                color="#475569"
                            />

                        </View>


                        <View>

                            <Text
                                style={
                                    styles.statValue
                                }
                            >
                                {totalCamions}
                            </Text>


                            <Text
                                style={
                                    styles.statLabel
                                }
                            >
                                Camions
                            </Text>

                        </View>

                    </View>


                    <View
                        style={
                            styles.statCard
                        }
                    >

                        <View
                            style={
                                [
                                    styles.statIcon,
                                    styles.statIconGreen,
                                ]
                            }
                        >

                            <CircleCheck
                                size={17}
                                color="#15803D"
                            />

                        </View>


                        <View>

                            <Text
                                style={
                                    styles.statValue
                                }
                            >
                                {totalTerminees}
                            </Text>


                            <Text
                                style={
                                    styles.statLabel
                                }
                            >
                                Terminées
                            </Text>

                        </View>

                    </View>

                </View>


                {/* =================================================
                    SCANNER PRINCIPAL
                ================================================= */}

                <View
                    style={
                        styles.scannerCard
                    }
                >

                    <View
                        style={
                            styles.scannerHeader
                        }
                    >

                        <View
                            style={
                                styles.scannerIcon
                            }
                        >

                            <QrCode
                                size={27}
                                color="#FFFFFF"
                                strokeWidth={1.8}
                            />

                        </View>


                        <View
                            style={
                                styles.scannerHeaderText
                            }
                        >

                            <Text
                                style={
                                    styles.scannerEyebrow
                                }
                            >
                                ACTION PRINCIPALE
                            </Text>


                            <Text
                                style={
                                    styles.scannerTitle
                                }
                            >
                                Scanner un ticket
                            </Text>

                        </View>

                    </View>


                    <Text
                        style={
                            styles.scannerDescription
                        }
                    >
                        Scannez le QR code du ticket pour
                        récupérer automatiquement son dossier,
                        son camion, son chauffeur et les
                        prestations autorisées.
                    </Text>


                    <TouchableOpacity
                        style={
                            styles.scannerButton
                        }

                        onPress={
                            handleStartScan
                        }

                        disabled={
                            loading
                        }

                        activeOpacity={0.88}
                    >

                        <View
                            style={
                                styles.scannerButtonLeft
                            }
                        >

                            {loading ? (

                                <ActivityIndicator
                                    color="#FFFFFF"
                                    size="small"
                                />

                            ) : (

                                <ScanLine
                                    size={23}
                                    color="#FFFFFF"
                                    strokeWidth={2}
                                />

                            )}

                        </View>


                        <View
                            style={
                                styles.scannerButtonContent
                            }
                        >

                            <Text
                                style={
                                    styles.scannerButtonTitle
                                }
                            >
                                SCANNER LE TICKET
                            </Text>


                            <Text
                                style={
                                    styles.scannerButtonSubtitle
                                }
                            >
                                Lecture QR automatique
                            </Text>

                        </View>


                        <ArrowUpRight
                            size={21}
                            color="#FFFFFF"
                            strokeWidth={2}
                        />

                    </TouchableOpacity>


                    <View
                        style={
                            styles.scannerSecurity
                        }
                    >

                        <ShieldCheck
                            size={14}
                            color="#64748B"
                        />


                        <Text
                            style={
                                styles.scannerSecurityText
                            }
                        >
                            Identification sécurisée du dossier
                        </Text>

                    </View>

                </View>


                {/* =================================================
                    PRESTATIONS
                ================================================= */}

                <View
                    style={
                        styles.sectionHeader
                    }
                >

                    <View>

                        <Text
                            style={
                                styles.sectionEyebrow
                            }
                        >
                            DISPONIBILITÉ
                        </Text>


                        <Text
                            style={
                                styles.sectionTitle
                            }
                        >
                            Prestations disponibles
                        </Text>

                    </View>


                    <TouchableOpacity
                        style={
                            styles.refreshButton
                        }

                        activeOpacity={0.7}

                        onPress={() => {

                            if (
                                typeof onLoadPrestations ===
                                "function"
                            ) {
                                onLoadPrestations();
                            }

                        }}
                    >

                        <RefreshCw
                            size={17}
                            color="#475569"
                        />

                    </TouchableOpacity>

                </View>


                <View
                    style={
                        styles.prestationsList
                    }
                >

                    {
                        prestations.map(
                            (
                                prestation
                            ) => {

                                const camion =
                                    prestation.camion || {};

                                const chauffeur =
                                    prestation.chauffeur || {};

                                const marchandise =
                                    prestation.marchandise || {};

                                const zone =
                                    prestation.zone || {};


                                const quantitePrevue =
                                    Number(
                                        prestation.quantite_prevue ||
                                        0
                                    );

                                const quantiteRealisee =
                                    Number(
                                        prestation.quantite_realisee ||
                                        0
                                    );


                                const restante =
                                    Math.max(
                                        quantitePrevue -
                                        quantiteRealisee,
                                        0
                                    );


                                const progression =
                                    quantitePrevue > 0
                                        ? (
                                            quantiteRealisee /
                                            quantitePrevue
                                        ) * 100
                                        : 0;


                                const camionText =
                                    camion.immatriculation ||
                                    camion.matricule ||
                                    prestation.immatriculation_tracteur ||
                                    '--';


                                const chauffeurText =
                                    `${chauffeur.prenom || ''} ${chauffeur.nom || ''}`
                                        .trim() ||
                                    '--';


                                const marchandiseText =
                                    marchandise.nom ||
                                    marchandise.libelle ||
                                    '--';


                                const zoneText =
                                    zone.nom ||
                                    zone.code ||
                                    '--';


                                const numero =
                                    prestation.numero_prestation ||
                                    prestation.numero ||
                                    `PRESTATION #${prestation.id}`;


                                const statut =
                                    String(
                                        prestation.statut ||
                                        'CREEE'
                                    ).toUpperCase();


                                let statusStyle =
                                    styles.statusDefault;

                                let statusDotStyle =
                                    styles.statusDotDefault;

                                let statusTextStyle =
                                    styles.statusTextDefault;


                                if (
                                    statut === 'EN_COURS'
                                ) {

                                    statusStyle =
                                        styles.statusProgress;

                                    statusDotStyle =
                                        styles.statusDotProgress;

                                    statusTextStyle =
                                        styles.statusTextProgress;

                                } else if (
                                    statut === 'TERMINEE'
                                ) {

                                    statusStyle =
                                        styles.statusDone;

                                    statusDotStyle =
                                        styles.statusDotDone;

                                    statusTextStyle =
                                        styles.statusTextDone;

                                } else if (
                                    statut === 'ANNULEE' ||
                                    statut === 'CLOTUREE'
                                ) {

                                    statusStyle =
                                        styles.statusCancelled;

                                    statusDotStyle =
                                        styles.statusDotCancelled;

                                    statusTextStyle =
                                        styles.statusTextCancelled;

                                }


                                return (

                                    <TouchableOpacity
                                        key={
                                            prestation.id
                                        }

                                        style={
                                            styles.prestationCard
                                        }

                                        activeOpacity={
                                            0.84
                                        }

                                        onPress={() => {

                                            if (
                                                typeof onSelectPrestation ===
                                                "function"
                                            ) {

                                                onSelectPrestation(
                                                    prestation
                                                );

                                            }

                                        }}
                                    >

                                        {/* =========================
                                            CARD HEADER
                                        ========================= */}

                                        <View
                                            style={
                                                styles.prestationHeader
                                            }
                                        >

                                            <View
                                                style={
                                                    styles.prestationIcon
                                                }
                                            >

                                                <Package
                                                    size={20}
                                                    color="#1769AA"
                                                    strokeWidth={1.9}
                                                />

                                            </View>


                                            <View
                                                style={
                                                    styles.prestationTitleArea
                                                }
                                            >

                                                <Text
                                                    style={
                                                        styles.prestationNumber
                                                    }

                                                    numberOfLines={1}
                                                >
                                                    {numero}
                                                </Text>


                                                <Text
                                                    style={
                                                        styles.prestationProduct
                                                    }

                                                    numberOfLines={1}
                                                >
                                                    {marchandiseText}
                                                </Text>

                                            </View>


                                            <View
                                                style={[
                                                    styles.statusBadge,
                                                    statusStyle,
                                                ]}
                                            >

                                                <View
                                                    style={[
                                                        styles.statusDot,
                                                        statusDotStyle,
                                                    ]}
                                                />


                                                <Text
                                                    style={[
                                                        styles.statusText,
                                                        statusTextStyle,
                                                    ]}
                                                >
                                                    {statut}
                                                </Text>

                                            </View>

                                        </View>


                                        {/* =========================
                                            INFOS
                                        ========================= */}

                                        <View
                                            style={
                                                styles.infoGrid
                                            }
                                        >

                                            <View
                                                style={
                                                    styles.infoBlock
                                                }
                                            >

                                                <View
                                                    style={
                                                        styles.infoIcon
                                                    }
                                                >

                                                    <Truck
                                                        size={14}
                                                        color="#64748B"
                                                    />

                                                </View>


                                                <View
                                                    style={
                                                        styles.infoTextContainer
                                                    }
                                                >

                                                    <Text
                                                        style={
                                                            styles.infoLabel
                                                        }
                                                    >
                                                        CAMION
                                                    </Text>


                                                    <Text
                                                        style={
                                                            styles.infoValue
                                                        }

                                                        numberOfLines={
                                                            1
                                                        }
                                                    >
                                                        {camionText}
                                                    </Text>

                                                </View>

                                            </View>


                                            <View
                                                style={
                                                    styles.infoBlock
                                                }
                                            >

                                                <View
                                                    style={
                                                        styles.infoIcon
                                                    }
                                                >

                                                    <UserRound
                                                        size={14}
                                                        color="#64748B"
                                                    />

                                                </View>


                                                <View
                                                    style={
                                                        styles.infoTextContainer
                                                    }
                                                >

                                                    <Text
                                                        style={
                                                            styles.infoLabel
                                                        }
                                                    >
                                                        CHAUFFEUR
                                                    </Text>


                                                    <Text
                                                        style={
                                                            styles.infoValue
                                                        }

                                                        numberOfLines={
                                                            1
                                                        }
                                                    >
                                                        {chauffeurText}
                                                    </Text>

                                                </View>

                                            </View>


                                            <View
                                                style={
                                                    styles.infoBlock
                                                }
                                            >

                                                <View
                                                    style={
                                                        styles.infoIcon
                                                    }
                                                >

                                                    <MapPin
                                                        size={14}
                                                        color="#64748B"
                                                    />

                                                </View>


                                                <View
                                                    style={
                                                        styles.infoTextContainer
                                                    }
                                                >

                                                    <Text
                                                        style={
                                                            styles.infoLabel
                                                        }
                                                    >
                                                        ZONE
                                                    </Text>


                                                    <Text
                                                        style={
                                                            styles.infoValue
                                                        }

                                                        numberOfLines={
                                                            1
                                                        }
                                                    >
                                                        {zoneText}
                                                    </Text>

                                                </View>

                                            </View>

                                        </View>


                                        {/* =========================
                                            QUANTITÉ
                                        ========================= */}

                                        <View
                                            style={
                                                styles.quantitySection
                                            }
                                        >

                                            <View
                                                style={
                                                    styles.quantityHeader
                                                }
                                            >

                                                <View>

                                                    <Text
                                                        style={
                                                            styles.quantityLabel
                                                        }
                                                    >
                                                        QUANTITÉ RESTANTE
                                                    </Text>


                                                    <Text
                                                        style={
                                                            styles.quantityValue
                                                        }
                                                    >
                                                        {
                                                            restante.toLocaleString(
                                                                'fr-FR',
                                                                {
                                                                    maximumFractionDigits: 3,
                                                                }
                                                            )
                                                        }{' '}
                                                        {
                                                            prestation.unite ||
                                                            ''
                                                        }
                                                    </Text>

                                                </View>


                                                <View
                                                    style={
                                                        styles.progressPercentage
                                                    }
                                                >

                                                    <Text
                                                        style={
                                                            styles.progressPercentageText
                                                        }
                                                    >
                                                        {
                                                            Math.round(
                                                                Math.min(
                                                                    progression,
                                                                    100
                                                                )
                                                            )
                                                        }%
                                                    </Text>

                                                </View>

                                            </View>


                                            <View
                                                style={
                                                    styles.progressBackground
                                                }
                                            >

                                                <View
                                                    style={[
                                                        styles.progressFill,
                                                        {
                                                            width:
                                                                `${Math.min(
                                                                    progression,
                                                                    100
                                                                )}%`,
                                                        },
                                                    ]}
                                                />

                                            </View>


                                            <View
                                                style={
                                                    styles.quantityFooter
                                                }
                                            >

                                                <Text
                                                    style={
                                                        styles.quantitySmall
                                                    }
                                                >
                                                    Réalisé :{' '}
                                                    {
                                                        Number(
                                                            quantiteRealisee
                                                        ).toLocaleString(
                                                            'fr-FR',
                                                            {
                                                                maximumFractionDigits: 3,
                                                            }
                                                        )
                                                    }{' '}
                                                    {
                                                        prestation.unite ||
                                                        ''
                                                    }
                                                </Text>


                                                <Text
                                                    style={
                                                        styles.quantitySmall
                                                    }
                                                >
                                                    Prévu :{' '}
                                                    {
                                                        Number(
                                                            quantitePrevue
                                                        ).toLocaleString(
                                                            'fr-FR',
                                                            {
                                                                maximumFractionDigits: 3,
                                                            }
                                                        )
                                                    }{' '}
                                                    {
                                                        prestation.unite ||
                                                        ''
                                                    }
                                                </Text>

                                            </View>

                                        </View>


                                        {/* =========================
                                            FOOTER CARD
                                        ========================= */}

                                        <View
                                            style={
                                                styles.cardFooter
                                            }
                                        >

                                            <View
                                                style={
                                                    styles.operationInfo
                                                }
                                            >

                                                <FileText
                                                    size={14}
                                                    color="#94A3B8"
                                                />


                                                <Text
                                                    style={
                                                        styles.operationText
                                                    }
                                                >
                                                    Dossier opérationnel
                                                </Text>

                                            </View>


                                            <View
                                                style={
                                                    styles.openButton
                                                }
                                            >

                                                <Text
                                                    style={
                                                        styles.openButtonText
                                                    }
                                                >
                                                    OUVRIR
                                                </Text>


                                                <ChevronRight
                                                    size={17}
                                                    color="#1769AA"
                                                    strokeWidth={2}
                                                />

                                            </View>

                                        </View>

                                    </TouchableOpacity>

                                );

                            }
                        )
                    }


                    {
                        prestations.length === 0 && (

                            <View
                                style={
                                    styles.emptyCard
                                }
                            >

                                <View
                                    style={
                                        styles.emptyIcon
                                    }
                                >

                                    <Boxes
                                        size={23}
                                        color="#64748B"
                                    />

                                </View>


                                <Text
                                    style={
                                        styles.emptyTitle
                                    }
                                >
                                    Aucune prestation disponible
                                </Text>


                                <Text
                                    style={
                                        styles.emptyText
                                    }
                                >
                                    Les prestations autorisées
                                    apparaîtront ici.
                                </Text>


                                <TouchableOpacity
                                    style={
                                        styles.emptyRefreshButton
                                    }

                                    onPress={() => {

                                        if (
                                            typeof onLoadPrestations ===
                                            "function"
                                        ) {
                                            onLoadPrestations();
                                        }

                                    }}

                                    activeOpacity={0.8}
                                >

                                    <RefreshCw
                                        size={15}
                                        color="#1769AA"
                                    />


                                    <Text
                                        style={
                                            styles.emptyRefreshText
                                        }
                                    >
                                        ACTUALISER
                                    </Text>

                                </TouchableOpacity>

                            </View>

                        )
                    }

                </View>


                {/* =================================================
                    ACTIVITÉ
                ================================================= */}

                <View
                    style={
                        styles.sectionHeader
                    }
                >

                    <View>

                        <Text
                            style={
                                styles.sectionEyebrow
                            }
                        >
                            JOURNAL
                        </Text>


                        <Text
                            style={
                                styles.sectionTitle
                            }
                        >
                            Activité récente
                        </Text>

                    </View>

                </View>


                <View
                    style={
                        styles.activityCard
                    }
                >

                    <View
                        style={
                            styles.activityIcon
                        }
                    >

                        <Clock3
                            size={19}
                            color="#1769AA"
                            strokeWidth={1.8}
                        />

                    </View>


                    <View
                        style={
                            styles.activityContent
                        }
                    >

                        <Text
                            style={
                                styles.activityTitle
                            }
                        >
                            Aucune activité récente
                        </Text>


                        <Text
                            style={
                                styles.activityText
                            }
                        >
                            Les opérations liées aux tickets
                            apparaîtront ici.
                        </Text>

                    </View>

                </View>


                {/* =================================================
                    FOOTER
                ================================================= */}

                <View
                    style={
                        styles.footer
                    }
                >

                    <View
                        style={
                            styles.footerBrand
                        }
                    >

                        <View
                            style={
                                styles.footerBrandMark
                            }
                        >

                            <QrCode
                                size={13}
                                color="#1769AA"
                            />

                        </View>


                        <Text
                            style={
                                styles.footerBrandText
                            }
                        >
                            MIZAN
                        </Text>

                    </View>


                    <Text
                        style={
                            styles.footerText
                        }
                    >
                        POSTE PDA • MARSA MAROC
                    </Text>


                    <Text
                        style={
                            styles.footerSubtext
                        }
                    >
                        Système de contrôle opérationnel
                    </Text>

                </View>

            </ScrollView>

        </View>
    );
}


/*
 * =================================================================
 * STYLES
 * =================================================================
 */

const styles =
    StyleSheet.create({

        /*
         * ==========================================================
         * GLOBAL
         * ==========================================================
         */

        container: {
            flex: 1,
            backgroundColor: '#F5F8FC',
        },

        scroll: {
            flex: 1,
        },

        content: {
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: 42,
        },


        /*
         * ==========================================================
         * INTRO
         * ==========================================================
         */

        intro: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
        },

        introText: {
            flex: 1,
            paddingRight: 12,
        },

        systemBadge: {
            alignSelf: 'flex-start',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 9,
            paddingVertical: 5,
            borderRadius: 20,
            backgroundColor: '#EAF6EF',
            marginBottom: 8,
        },

        systemDot: {
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: '#16A34A',
            marginRight: 6,
        },

        systemBadgeText: {
            color: '#15803D',
            fontSize: 8,
            fontWeight: '900',
            letterSpacing: 0.65,
        },

        introTitle: {
            color: '#0B1F33',
            fontSize: 27,
            fontWeight: '900',
            letterSpacing: -0.7,
        },

        introSubtitle: {
            color: '#64748B',
            fontSize: 12,
            lineHeight: 17,
            marginTop: 3,
        },

        introIcon: {
            width: 58,
            height: 58,
            borderRadius: 18,
            backgroundColor: '#EAF4FB',
            borderWidth: 1,
            borderColor: '#D5E8F5',
            alignItems: 'center',
            justifyContent: 'center',
        },


        /*
         * ==========================================================
         * STATS
         * ==========================================================
         */

        statsRow: {
            flexDirection: 'row',
            marginBottom: 18,
        },

        statCard: {
            flex: 1,
            minHeight: 67,
            backgroundColor: '#FFFFFF',
            borderRadius: 15,
            borderWidth: 1,
            borderColor: '#E3EAF2',
            marginRight: 8,
            paddingHorizontal: 10,
            flexDirection: 'row',
            alignItems: 'center',
        },

        statCardLast: {
            marginRight: 0,
        },

        statIcon: {
            width: 34,
            height: 34,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8,
        },

        statIconBlue: {
            backgroundColor: '#EAF4FB',
        },

        statIconSlate: {
            backgroundColor: '#F1F5F9',
        },

        statIconGreen: {
            backgroundColor: '#ECFDF3',
        },

        statValue: {
            color: '#0F172A',
            fontSize: 18,
            fontWeight: '900',
        },

        statLabel: {
            color: '#64748B',
            fontSize: 8,
            fontWeight: '700',
            marginTop: 1,
        },


        /*
         * ==========================================================
         * SCANNER
         * ==========================================================
         */

        scannerCard: {
            backgroundColor: '#FFFFFF',
            borderRadius: 22,
            borderWidth: 1,
            borderColor: '#DCE7F0',
            padding: 17,
            marginBottom: 26,
        },

        scannerHeader: {
            flexDirection: 'row',
            alignItems: 'center',
        },

        scannerIcon: {
            width: 49,
            height: 49,
            borderRadius: 15,
            backgroundColor: '#1769AA',
            alignItems: 'center',
            justifyContent: 'center',
        },

        scannerHeaderText: {
            flex: 1,
            marginLeft: 12,
        },

        scannerEyebrow: {
            color: '#1769AA',
            fontSize: 8,
            fontWeight: '900',
            letterSpacing: 1,
            marginBottom: 3,
        },

        scannerTitle: {
            color: '#0F172A',
            fontSize: 19,
            fontWeight: '900',
            letterSpacing: -0.3,
        },

        scannerDescription: {
            color: '#64748B',
            fontSize: 11,
            lineHeight: 17,
            marginTop: 12,
            marginBottom: 15,
        },

        scannerButton: {
            minHeight: 63,
            borderRadius: 16,
            backgroundColor: '#1769AA',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10,
            paddingVertical: 8,
            elevation: 3,
            shadowColor: '#0B1F33',
            shadowOpacity: 0.16,
            shadowRadius: 7,
            shadowOffset: {
                width: 0,
                height: 3,
            },
        },

        scannerButtonLeft: {
            width: 45,
            height: 45,
            borderRadius: 13,
            backgroundColor: 'rgba(255,255,255,0.13)',
            alignItems: 'center',
            justifyContent: 'center',
        },

        scannerButtonContent: {
            flex: 1,
            marginLeft: 11,
        },

        scannerButtonTitle: {
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: '900',
            letterSpacing: 0.3,
        },

        scannerButtonSubtitle: {
            color: '#DCEEFF',
            fontSize: 9,
            fontWeight: '600',
            marginTop: 3,
        },

        scannerSecurity: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 11,
            paddingLeft: 2,
        },

        scannerSecurityText: {
            color: '#64748B',
            fontSize: 9,
            marginLeft: 5,
            fontWeight: '600',
        },


        /*
         * ==========================================================
         * SECTION HEADERS
         * ==========================================================
         */

        sectionHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 11,
        },

        sectionEyebrow: {
            color: '#1769AA',
            fontSize: 8,
            fontWeight: '900',
            letterSpacing: 1,
            marginBottom: 3,
        },

        sectionTitle: {
            color: '#0F172A',
            fontSize: 19,
            fontWeight: '900',
            letterSpacing: -0.3,
        },

        refreshButton: {
            width: 37,
            height: 37,
            borderRadius: 12,
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#DCE5EE',
            alignItems: 'center',
            justifyContent: 'center',
        },


        /*
         * ==========================================================
         * PRESTATIONS
         * ==========================================================
         */

        prestationsList: {
            marginBottom: 25,
        },

        prestationCard: {
            backgroundColor: '#FFFFFF',
            borderRadius: 19,
            borderWidth: 1,
            borderColor: '#E1E8F0',
            padding: 15,
            marginBottom: 10,
        },

        prestationHeader: {
            flexDirection: 'row',
            alignItems: 'center',
        },

        prestationIcon: {
            width: 43,
            height: 43,
            borderRadius: 13,
            backgroundColor: '#EAF4FB',
            alignItems: 'center',
            justifyContent: 'center',
        },

        prestationTitleArea: {
            flex: 1,
            marginLeft: 10,
            marginRight: 7,
        },

        prestationNumber: {
            color: '#0F172A',
            fontSize: 12,
            fontWeight: '900',
        },

        prestationProduct: {
            color: '#64748B',
            fontSize: 10,
            fontWeight: '600',
            marginTop: 3,
        },


        /*
         * STATUS
         */

        statusBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 8,
            paddingVertical: 5,
            borderRadius: 20,
        },

        statusDefault: {
            backgroundColor: '#F1F5F9',
        },

        statusProgress: {
            backgroundColor: '#EAF4FB',
        },

        statusDone: {
            backgroundColor: '#ECFDF3',
        },

        statusCancelled: {
            backgroundColor: '#FEF2F2',
        },

        statusDot: {
            width: 5,
            height: 5,
            borderRadius: 3,
            marginRight: 5,
        },

        statusDotDefault: {
            backgroundColor: '#64748B',
        },

        statusDotProgress: {
            backgroundColor: '#1769AA',
        },

        statusDotDone: {
            backgroundColor: '#16A34A',
        },

        statusDotCancelled: {
            backgroundColor: '#DC2626',
        },

        statusText: {
            fontSize: 7,
            fontWeight: '900',
        },

        statusTextDefault: {
            color: '#475569',
        },

        statusTextProgress: {
            color: '#1769AA',
        },

        statusTextDone: {
            color: '#15803D',
        },

        statusTextCancelled: {
            color: '#B91C1C',
        },


        /*
         * ==========================================================
         * INFOS
         * ==========================================================
         */

        infoGrid: {
            flexDirection: 'row',
            marginTop: 14,
            paddingTop: 13,
            borderTopWidth: 1,
            borderTopColor: '#EEF2F6',
        },

        infoBlock: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: 7,
        },

        infoIcon: {
            width: 27,
            height: 27,
            borderRadius: 8,
            backgroundColor: '#F4F7FA',
            alignItems: 'center',
            justifyContent: 'center',
        },

        infoTextContainer: {
            flex: 1,
            marginLeft: 6,
        },

        infoLabel: {
            color: '#94A3B8',
            fontSize: 7,
            fontWeight: '900',
            letterSpacing: 0.4,
        },

        infoValue: {
            color: '#334155',
            fontSize: 9,
            fontWeight: '700',
            marginTop: 2,
        },


        /*
         * ==========================================================
         * QUANTITÉ
         * ==========================================================
         */

        quantitySection: {
            marginTop: 14,
            paddingTop: 13,
            borderTopWidth: 1,
            borderTopColor: '#EEF2F6',
        },

        quantityHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
        },

        quantityLabel: {
            color: '#64748B',
            fontSize: 8,
            fontWeight: '900',
            letterSpacing: 0.5,
        },

        quantityValue: {
            color: '#0F172A',
            fontSize: 15,
            fontWeight: '900',
            marginTop: 2,
        },

        progressPercentage: {
            minWidth: 38,
            height: 28,
            borderRadius: 9,
            backgroundColor: '#EAF4FB',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 6,
        },

        progressPercentageText: {
            color: '#1769AA',
            fontSize: 9,
            fontWeight: '900',
        },

        progressBackground: {
            height: 6,
            borderRadius: 10,
            backgroundColor: '#E8EEF4',
            overflow: 'hidden',
        },

        progressFill: {
            height: '100%',
            borderRadius: 10,
            backgroundColor: '#1769AA',
        },

        quantityFooter: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 7,
        },

        quantitySmall: {
            color: '#94A3B8',
            fontSize: 8,
            fontWeight: '600',
        },


        /*
         * ==========================================================
         * CARD FOOTER
         * ==========================================================
         */

        cardFooter: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 13,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: '#EEF2F6',
        },

        operationInfo: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
        },

        operationText: {
            color: '#94A3B8',
            fontSize: 8,
            fontWeight: '600',
            marginLeft: 5,
        },

        openButton: {
            flexDirection: 'row',
            alignItems: 'center',
        },

        openButtonText: {
            color: '#1769AA',
            fontSize: 8,
            fontWeight: '900',
            letterSpacing: 0.3,
        },


        /*
         * ==========================================================
         * EMPTY
         * ==========================================================
         */

        emptyCard: {
            backgroundColor: '#FFFFFF',
            borderRadius: 19,
            borderWidth: 1,
            borderColor: '#E1E8F0',
            paddingVertical: 27,
            paddingHorizontal: 18,
            alignItems: 'center',
            marginBottom: 25,
        },

        emptyIcon: {
            width: 48,
            height: 48,
            borderRadius: 15,
            backgroundColor: '#F1F5F9',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10,
        },

        emptyTitle: {
            color: '#334155',
            fontSize: 12,
            fontWeight: '900',
        },

        emptyText: {
            color: '#94A3B8',
            fontSize: 9,
            textAlign: 'center',
            lineHeight: 14,
            marginTop: 4,
            maxWidth: 230,
        },

        emptyRefreshButton: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 14,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 10,
            backgroundColor: '#EAF4FB',
        },

        emptyRefreshText: {
            color: '#1769AA',
            fontSize: 8,
            fontWeight: '900',
            marginLeft: 5,
        },


        /*
         * ==========================================================
         * ACTIVITÉ
         * ==========================================================
         */

        activityCard: {
            backgroundColor: '#FFFFFF',
            borderRadius: 18,
            borderWidth: 1,
            borderColor: '#E1E8F0',
            padding: 15,
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 4,
        },

        activityIcon: {
            width: 42,
            height: 42,
            borderRadius: 13,
            backgroundColor: '#EAF4FB',
            alignItems: 'center',
            justifyContent: 'center',
        },

        activityContent: {
            flex: 1,
            marginLeft: 11,
        },

        activityTitle: {
            color: '#334155',
            fontSize: 11,
            fontWeight: '800',
        },

        activityText: {
            color: '#94A3B8',
            fontSize: 9,
            lineHeight: 13,
            marginTop: 3,
        },


        /*
         * ==========================================================
         * FOOTER
         * ==========================================================
         */

        footer: {
            alignItems: 'center',
            paddingTop: 29,
            paddingBottom: 8,
        },

        footerBrand: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 6,
        },

        footerBrandMark: {
            width: 24,
            height: 24,
            borderRadius: 7,
            backgroundColor: '#EAF4FB',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 6,
        },

        footerBrandText: {
            color: '#0B1F33',
            fontSize: 12,
            fontWeight: '900',
            letterSpacing: 1.2,
        },

        footerText: {
            color: '#64748B',
            fontSize: 8,
            fontWeight: '900',
            letterSpacing: 0.8,
        },

        footerSubtext: {
            color: '#A1AAB8',
            fontSize: 8,
            marginTop: 3,
        },


        /*
         * ==========================================================
         * SCANNER
         * ==========================================================
         */

        scannerScreen: {
            flex: 1,
            backgroundColor: '#000000',
        },

    });