import React, { useState, useEffect } from "react";

import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import PeseeEntreeAvecVerification from "./components/PeseeEntreeAvecVerification";
import PeseeSortieApresVerification from "./components/PeseeSortieApresVerification";

export default function App() {
  const [utilisateur, setUtilisateur] = useState(null);
  const [verificationInitiale, setVerificationInitiale] = useState(true);

  const [vueActuelle, setVueActuelle] = useState("dashboard");

  // Pesée sélectionnée pour la sortie
  const [peseeSelectionnee, setPeseeSelectionnee] = useState(null);

  useEffect(() => {
    try {
      const token = sessionStorage.getItem("token");
      const user = sessionStorage.getItem("user");

      if (token && user && user !== "undefined") {
        setUtilisateur(JSON.parse(user));
      } else {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        setUtilisateur(null);
      }
    } catch (error) {
      console.error("Erreur session :", error);

      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");

      setUtilisateur(null);
    } finally {
      setVerificationInitiale(false);
    }
  }, []);

  /**
   * Connexion
   */
  const handleLoginSuccess = (user) => {
    setUtilisateur(user);
    setVueActuelle("dashboard");

    const token = localStorage.getItem("token");

    if (token) {
      sessionStorage.setItem("token", token);
    }

    sessionStorage.setItem("user", JSON.stringify(user));
  };

  /**
   * Déconnexion
   */
  const deconnexion = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUtilisateur(null);
    setPeseeSelectionnee(null);
    setVueActuelle("dashboard");
  };

  /**
   * Nouvelle pesée entrée
   */
  const ouvrirNouvellePesee = () => {
    console.log("[APP] Ouverture nouvelle pesée");

    setPeseeSelectionnee(null);
    setVueActuelle("pesee");
  };

  /**
   * Sélection d'une pesée pour effectuer la sortie
   */
  const ouvrirSortie = (pesee) => {
    console.log("[APP] Pesée sélectionnée pour sortie :", pesee);

    if (!pesee) {
      console.error("[APP] Aucune pesée reçue.");
      return;
    }

    // Le Dashboard peut envoyer soit un objet complet,
    // soit un objet contenant peseeId.
    const peseeId =
      pesee.id ??
      pesee.peseeId ??
      pesee.pesee_id ??
      null;

    if (!peseeId) {
      console.error(
        "[APP] Impossible d'ouvrir la sortie : ID pesée absent.",
        pesee
      );
      return;
    }

    const peseeNormalisee = {
      ...pesee,
      id: Number(peseeId),
    };

    console.log(
      "[APP] ID pesée transmis à la sortie :",
      peseeNormalisee.id
    );

    setPeseeSelectionnee(peseeNormalisee);
    setVueActuelle("sortie");
  };

  /**
   * Retour Dashboard depuis la pesée sortie
   */
  const retourDashboard = () => {
    console.log("[APP] Retour dashboard depuis sortie");

    setPeseeSelectionnee(null);
    setVueActuelle("dashboard");
  };

  /**
   * Écran de chargement initial
   */
  if (verificationInitiale) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f9ff]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#c3c7d3] border-t-[#326097]" />

          <p className="text-xs font-semibold uppercase tracking-wider text-[#434752]">
            Marsa Weigh IQ
          </p>
        </div>
      </div>
    );
  }

  /**
   * Pas connecté
   */
  if (!utilisateur) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  /**
   * DASHBOARD
   */
  if (vueActuelle === "dashboard") {
    return (
      <Dashboard
        utilisateur={utilisateur}

        onNavigatePesee={ouvrirNouvellePesee}

        onSelectPesee={ouvrirSortie}
      />
    );
  }

  /**
   * NOUVELLE PESÉE ENTRÉE
   *
   * Important :
   * Pas de prestationId hardcodé ici.
   */
  if (vueActuelle === "pesee") {
    return (
      <div className="w-screen min-h-screen m-0 p-0">
        <PeseeEntreeAvecVerification
          utilisateur={utilisateur}
          onRetourDashboard={() =>
            setVueActuelle("dashboard")
          }
          onDeconnexion={deconnexion}
        />
      </div>
    );
  }

  /**
   * PESÉE SORTIE
   */
  if (vueActuelle === "sortie") {
    console.log(
      "[APP] Rendu PeseeSortieApresVerification avec :",
      peseeSelectionnee
    );

    // Protection : aucune pesée sélectionnée
    if (!peseeSelectionnee?.id) {
      console.error(
        "[APP] Aucune pesée sélectionnée pour la sortie."
      );

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f9f9ff]">
          <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-8 max-w-md text-center">
            <h2 className="text-lg font-bold text-red-700 mb-2">
              Pesée introuvable
            </h2>

            <p className="text-sm text-gray-600 mb-6">
              Aucune pesée n'a été sélectionnée pour effectuer
              la sortie.
            </p>

            <button
              type="button"
              onClick={retourDashboard}
              className="px-5 py-3 rounded-xl bg-[#326097] text-white font-semibold"
            >
              Retour au dashboard
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="w-screen min-h-screen m-0 p-0">
        <PeseeSortieApresVerification
          peseeId={peseeSelectionnee.id}
          onRetourDashboard={retourDashboard}
        />
      </div>
    );
  }

  /**
   * Fallback
   */
  return (
    <Dashboard
      utilisateur={utilisateur}
      onNavigatePesee={ouvrirNouvellePesee}
      onSelectPesee={ouvrirSortie}
    />
  );
}