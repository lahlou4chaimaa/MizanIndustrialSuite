import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import ExecutionScreen from './src/screens/ExecutionScreen';

import {
  connectSocket,
  disconnectSocket,
  onPrestationStatutChange,
  onPrestationAffectee,
} from './src/services/socket';

import {
  fetchPrestationByQr,
  fetchPrestationById,
  fetchPrestationsPDA,
  affecterPrestationAuTicket,
} from './src/services/api';


// ============================================================
// APP
// ============================================================

export default function App() {

  // ========================================================
  // STATE
  // ========================================================

  const [dossier, setDossier] = useState(null);

  const [selectedPrestationId, setSelectedPrestationId] =
    useState(null);

  const [prestations, setPrestations] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [affecting, setAffecting] =
    useState(false);


  // ========================================================
  // LOAD PRESTATIONS
  // ========================================================

  const loadPrestations = useCallback(
    async () => {

      try {

        const result =
          await fetchPrestationsPDA();

        const list =
          Array.isArray(result)
            ? result
            : Array.isArray(result?.prestations)
              ? result.prestations
              : [];

        setPrestations(list);

      } catch (error) {

        console.error(
          '[APP] Erreur chargement prestations:',
          error
        );

      }

    },
    []
  );


  // ========================================================
  // INITIAL LOAD
  // ========================================================

  useEffect(() => {

    let mounted = true;

    const initialize = async () => {

      try {

        await loadPrestations();

      } catch (error) {

        console.error(
          '[APP] Initialisation impossible:',
          error
        );

      } finally {

        if (mounted) {
          setLoading(false);
        }

      }

    };

    initialize();

    return () => {
      mounted = false;
    };

  }, [
    loadPrestations,
  ]);


  // ========================================================
  // SOCKET
  // ========================================================

  useEffect(() => {

    let mounted = true;

    const initializeSocket = async () => {

      try {

        await connectSocket();

        if (!mounted) {
          return;
        }

        // ---------------------------------------------
        // PRESTATION STATUS
        // ---------------------------------------------

        onPrestationStatutChange(() => {

          loadPrestations();

        });


        // ---------------------------------------------
        // PRESTATION AFFECTÉE
        // ---------------------------------------------

        onPrestationAffectee(() => {

          loadPrestations();

        });

      } catch (error) {

        console.error(
          '[APP] Socket impossible:',
          error
        );

      }

    };

    initializeSocket();

    return () => {

      mounted = false;

      try {
        disconnectSocket();
      } catch (error) {
        console.error(
          '[APP] Déconnexion socket:',
          error
        );
      }

    };

  }, [
    loadPrestations,
  ]);


  // ========================================================
  // SCAN TICKET
  // ========================================================

  const handleDossierScanned = useCallback(
    async (qrCode) => {

      if (!qrCode) {
        throw new Error(
          'Code QR invalide.'
        );
      }

      console.log(
        '[APP] Scan ticket:',
        qrCode
      );


      const result =
        await fetchPrestationByQr(
          qrCode
        );


      console.log(
        '[APP] Réponse QR:',
        result
      );


      if (!result?.success) {

        throw new Error(
          result?.message ||
          'Impossible de récupérer le ticket.'
        );

      }


      const ticket =
        result.ticket ||
        null;


      const resultPrestations =
        Array.isArray(result.prestations)
          ? result.prestations
          : [];


      // ------------------------------------------------
      // Ticket déjà affecté
      // ------------------------------------------------

      if (
        result.deja_affecte &&
        resultPrestations.length === 0
      ) {

        throw new Error(
          'Ce ticket est déjà affecté à une prestation, mais les informations de la prestation sont indisponibles.'
        );

      }


      // ------------------------------------------------
      // Aucun candidat
      // ------------------------------------------------

      if (
        resultPrestations.length === 0
      ) {

        throw new Error(
          'Aucune prestation active et autorisée pour ce ticket.'
        );

      }


      // ------------------------------------------------
      // Préparation du dossier
      // ------------------------------------------------

      const dossierData = {

        ...result,

        qrCode,

        ticket,

        prestations:
          resultPrestations,

        prestation:
          resultPrestations[0] ||
          null,

        deja_affecte:
          Boolean(
            result.deja_affecte
          ),

      };


      setDossier(
        dossierData
      );


      // ------------------------------------------------
      // Si déjà affecté :
      // sélectionner automatiquement la prestation
      // ------------------------------------------------

      if (
        result.deja_affecte &&
        resultPrestations[0]?.id
      ) {

        setSelectedPrestationId(
          resultPrestations[0].id
        );

      } else {

        setSelectedPrestationId(
          null
        );

      }


      await loadPrestations();

    },
    [
      loadPrestations,
    ]
  );


  // ========================================================
  // SELECT PRESTATION
  // ========================================================

  // ========================================================
  // SELECT / OUVRIR PRESTATION
  // ========================================================

  const handleSelectPrestation =
    useCallback(
      async (prestation) => {

        if (!prestation?.id) {
          console.warn(
            '[APP] Prestation invalide:',
            prestation
          );

          return;
        }

        console.log(
          '[APP] Ouverture prestation:',
          prestation.id
        );

        try {

          // ------------------------------------------------
          // Sélection immédiate
          // ------------------------------------------------

          setSelectedPrestationId(
            prestation.id
          );


          // ------------------------------------------------
          // Charger la prestation complète
          // ------------------------------------------------

          const result =
            await fetchPrestationById(
              prestation.id
            );


          console.log(
            '[APP] Détail prestation reçu:',
            result
          );


          const fullPrestation =
            result?.prestation ||
            result?.data ||
            result;


          if (
            !fullPrestation ||
            !fullPrestation.id
          ) {

            throw new Error(
              'Impossible de récupérer les détails de la prestation.'
            );

          }


          console.log(
            '[APP] Prestation complète:',
            fullPrestation
          );


          // ------------------------------------------------
          // CAS 1 :
          // On vient de HOME
          // Aucun dossier/ticket n'existe encore
          // ------------------------------------------------

          setDossier(
            (previous) => {

              // ============================================
              // Aucun dossier existant
              // ============================================

              if (!previous) {

                console.log(
                  '[APP] Ouverture directe de la prestation depuis HOME'
                );


                return {

                  success: true,

                  // Pas de ticket lorsqu'on ouvre
                  // directement une prestation
                  ticket: null,

                  qrCode: null,

                  deja_affecte: false,

                  // Prestation principale
                  prestation:
                    fullPrestation,

                  // Liste des prestations
                  prestations: [
                    fullPrestation,
                  ],

                  // Indique qu'on consulte simplement
                  // la prestation
                  mode: 'PRESTATION_DETAIL',

                };

              }


              // ============================================
              // Dossier déjà existant
              // Exemple : ticket scanné
              // ============================================

              const oldPrestations =
                Array.isArray(
                  previous.prestations
                )
                  ? previous.prestations
                  : [];


              const exists =
                oldPrestations.some(
                  (item) =>
                    Number(item?.id) ===
                    Number(fullPrestation.id)
                );


              const updatedPrestations =
                exists
                  ? oldPrestations.map(
                    (item) =>
                      Number(item?.id) ===
                        Number(fullPrestation.id)
                        ? fullPrestation
                        : item
                  )
                  : [
                    ...oldPrestations,
                    fullPrestation,
                  ];


              console.log(
                '[APP] Mise à jour prestation dans dossier existant'
              );


              return {

                ...previous,

                prestation:
                  fullPrestation,

                prestations:
                  updatedPrestations,

              };

            }
          );


        } catch (error) {

          console.error(
            '[APP] Erreur ouverture prestation:',
            error
          );


          setSelectedPrestationId(
            null
          );


          Alert.alert(
            'Erreur',
            error?.message ||
            'Impossible de charger les détails de la prestation.'
          );

        }

      },
      []
    );


  // ========================================================
  // AFFECTER TICKET À PRESTATION
  // ========================================================

  const handleAffecterPrestation =
    useCallback(
      async (prestation) => {

        if (!prestation?.id) {

          throw new Error(
            'Prestation invalide.'
          );

        }


        if (!dossier?.ticket?.id) {

          throw new Error(
            'Ticket introuvable.'
          );

        }


        if (dossier?.deja_affecte) {

          throw new Error(
            'Ce ticket est déjà affecté à une prestation.'
          );

        }


        const prestationId =
          prestation.id;

        const ticketId =
          dossier.ticket.id;


        console.log(
          '[APP] Affectation:',
          {
            ticketId,
            prestationId,
          }
        );


        setAffecting(true);


        try {

          // -----------------------------------------
          // Backend effectue la vraie validation
          // -----------------------------------------

          const result =
            await affecterPrestationAuTicket(
              prestationId,
              ticketId
            );


          console.log(
            '[APP] Résultat affectation:',
            result
          );


          if (
            result?.success === false
          ) {

            throw new Error(
              result?.message ||
              'L’affectation a été refusée.'
            );

          }


          // -----------------------------------------
          // Recharger prestation
          // -----------------------------------------

          let updatedPrestation =
            result?.prestation ||
            null;


          try {

            const refreshed =
              await fetchPrestationById(
                prestationId
              );


            updatedPrestation =
              refreshed?.prestation ||
              refreshed?.data ||
              refreshed ||
              updatedPrestation;

          } catch (refreshError) {

            console.warn(
              '[APP] Impossible de recharger la prestation:',
              refreshError
            );

          }


          // -----------------------------------------
          // Mettre à jour le dossier
          // -----------------------------------------

          setDossier(
            (previous) => {

              if (!previous) {
                return previous;
              }


              const prestationFinale =
                updatedPrestation ||
                prestation;


              return {

                ...previous,

                deja_affecte:
                  true,

                prestation:
                  prestationFinale,

                prestations: [
                  prestationFinale,
                ],

                affectationSuccess:
                  true,

              };

            }
          );


          setSelectedPrestationId(
            prestationId
          );


          await loadPrestations();


          Alert.alert(
            'Affectation réussie',
            `Le ticket ${dossier.ticket.numero_ticket || ''} est maintenant associé à la prestation ${prestation.numero_prestation ||
            `#${prestation.id}`
            }.`
          );


        } catch (error) {

          console.error(
            '[APP] Affectation impossible:',
            error
          );


          throw error;

        } finally {

          setAffecting(false);

        }

      },
      [
        dossier,
        loadPrestations,
      ]
    );


  // ========================================================
  // CLOSE DOSSIER
  // ========================================================

  const handleCloseDossier =
    useCallback(
      () => {

        setDossier(
          null
        );

        setSelectedPrestationId(
          null
        );

        setAffecting(
          false
        );

        loadPrestations();

      },
      [
        loadPrestations,
      ]
    );


  // ========================================================
  // LOADING
  // ========================================================

  if (loading) {

    return (
      <View style={styles.loadingScreen}>

        <View style={styles.loadingLogo}>

          <Text style={styles.loadingLogoText}>
            M
          </Text>

        </View>


        <Text style={styles.loadingTitle}>
          MIZAN
        </Text>

        <Text style={styles.loadingSubtitle}>
          Initialisation du poste PDA
        </Text>


        <ActivityIndicator
          size="small"
          color="#2563eb"
          style={styles.loadingIndicator}
        />

      </View>
    );

  }


  // ========================================================
  // HOME
  // ========================================================

  if (!dossier) {

    return (
      <HomeScreen
        prestations={prestations}
        onLoadPrestations={loadPrestations}
        onDossierScanned={
          handleDossierScanned
        }
        onSelectPrestation={
          handleSelectPrestation
        }
      />
    );

  }


  // ========================================================
  // EXECUTION / DOSSIER
  // ========================================================

  return (
    <ExecutionScreen

      dossier={dossier}

      selectedPrestationId={
        selectedPrestationId
      }

      onSelectPrestation={
        handleSelectPrestation
      }

      onAffecterPrestation={
        handleAffecterPrestation
      }

      onBack={
        handleCloseDossier
      }

      affecting={
        affecting
      }

    />
  );
}


// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({

  loadingScreen: {
    flex: 1,
    backgroundColor: '#f4f7fb',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  loadingLogo: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#0b1f3a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  loadingLogoText: {
    fontSize: 31,
    fontWeight: '900',
    color: '#ffffff',
  },

  loadingTitle: {
    fontSize: 23,
    fontWeight: '900',
    color: '#0b1f3a',
    letterSpacing: 2,
  },

  loadingSubtitle: {
    marginTop: 5,
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },

  loadingIndicator: {
    marginTop: 22,
  },

});