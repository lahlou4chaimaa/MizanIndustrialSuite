import socket
import time
import random


# ============================================================
# CONFIGURATION TCP
# ============================================================

HOST = "127.0.0.1"
PORT = 6000


# ============================================================
# CONFIGURATION SIMULATION
# ============================================================

# ------------------------------------------------------------
# POIDS DE SIMULATION
# ------------------------------------------------------------

# Première montée :
# 0 kg -> 16 000 kg
TARE_CIBLE = 16000

# Deuxième montée :
# 0 kg -> 40 000 kg
BRUT_CIBLE = 40000


# ------------------------------------------------------------
# MARCHANDISE
# ------------------------------------------------------------

# Utilisé uniquement pour afficher le net attendu.
# 40 000 - 16 000 = 24 000 kg
MARCHANDISE = BRUT_CIBLE - TARE_CIBLE


# ------------------------------------------------------------
# Durées
# ------------------------------------------------------------

DUREE_MONTEE = 12
DUREE_STABLE = 20
DUREE_ZERO = 8
DUREE_ZERO_STABLE = 4


# ------------------------------------------------------------
# Intervalle entre les trames
# ------------------------------------------------------------

INTERVALLE = 0.5


# ============================================================
# OUTILS
# ============================================================

def envoyer_poids(conn, poids, statut):
    """
    Envoie une trame dans le format attendu
    par le Bridge TCP.

    Exemple :

        +012350 kg STABLE
        +023410 kg INSTABLE
    """

    # Petit bruit uniquement lorsque le poids est stable.
    if statut == "STABLE" and poids > 100:
        bruit = random.uniform(-3, 3)
    else:
        bruit = 0

    poids_affiche = max(
        0,
        int(round(poids + bruit))
    )

    trame = (
        f"+{poids_affiche:06d} kg "
        f"{statut}\r\n"
    )

    try:
        conn.sendall(
            trame.encode("utf-8")
        )
    except (BrokenPipeError, ConnectionResetError):
        raise

    print(
        f"📡 {trame.strip()}",
        end="\r",
        flush=True
    )


def maintenir_stable(conn, poids, duree):
    """
    Maintient le poids stable pendant la durée demandée.
    """

    debut = time.time()

    while time.time() - debut < duree:

        envoyer_poids(
            conn,
            poids,
            "STABLE"
        )

        time.sleep(INTERVALLE)


def simuler_montee(conn, depart, cible, duree):
    """
    Simule une montée progressive.

    Exemple :

        0 kg
        ↓
        1000
        ↓
        5000
        ↓
        10000
        ↓
        16000 kg
    """

    debut = time.time()

    while True:

        temps = time.time() - debut

        if temps >= duree:
            break

        progression = min(
            temps / duree,
            1.0
        )

        # Courbe douce :
        # accélération puis ralentissement.
        progression = (
            progression
            * progression
            * (3 - 2 * progression)
        )

        poids_actuel = (
            depart
            + (
                cible - depart
            )
            * progression
        )

        envoyer_poids(
            conn,
            poids_actuel,
            "INSTABLE"
        )

        time.sleep(INTERVALLE)

    # Dernière valeur exacte avant STABLE.
    envoyer_poids(
        conn,
        cible,
        "STABLE"
    )


def simuler_descente(conn, depart, cible, duree):
    """
    Simule une descente progressive.

    Exemple :

        16000 kg
        ↓
        10000
        ↓
        5000
        ↓
        0 kg
    """

    debut = time.time()

    while True:

        temps = time.time() - debut

        if temps >= duree:
            break

        progression = min(
            temps / duree,
            1.0
        )

        # Courbe douce.
        progression = (
            progression
            * progression
            * (3 - 2 * progression)
        )

        poids_actuel = (
            depart
            + (
                cible - depart
            )
            * progression
        )

        envoyer_poids(
            conn,
            poids_actuel,
            "INSTABLE"
        )

        time.sleep(INTERVALLE)

    # Dernière valeur exacte.
    envoyer_poids(
        conn,
        cible,
        "STABLE"
    )


# ============================================================
# AFFICHAGE DU SCÉNARIO
# ============================================================

def afficher_scenario(numero):

    print()
    print()
    print("=" * 70)
    print(
        f"🚛 SCÉNARIO AUTOMATIQUE #{numero}"
    )
    print("=" * 70)

    print(
        f"⚖️ Première montée : "
        f"{TARE_CIBLE:,} kg "
        f"({TARE_CIBLE / 1000:.0f} T)"
    )

    print(
        f"📦 Marchandise simulée : "
        f"{MARCHANDISE:,} kg "
        f"({MARCHANDISE / 1000:.0f} T)"
    )

    print(
        f"⚖️ Deuxième montée : "
        f"{BRUT_CIBLE:,} kg "
        f"({BRUT_CIBLE / 1000:.0f} T)"
    )

    print(
        f"🧮 Net attendu : "
        f"{BRUT_CIBLE - TARE_CIBLE:,} kg"
    )

    print("=" * 70)


# ============================================================
# CYCLE COMPLET
# ============================================================

def executer_cycle(conn):
    """
    Cycle complet du simulateur :

        0
        ↓
        16 T
        ↓
        0
        ↓
        40 T
        ↓
        0
    """

    # ========================================================
    # 1. BALANCE À 0
    # ========================================================

    print()
    print("=" * 70)
    print("⚖️ BALANCE VIDE")
    print("=" * 70)

    maintenir_stable(
        conn,
        0,
        DUREE_ZERO_STABLE
    )

    # ========================================================
    # 2. MONTEE VERS 16 T
    # ========================================================

    print()
    print("🟢 PREMIÈRE PESÉE")
    print()
    print(
        "🚛 Camion arrive..."
    )

    print(
        f"⚖️ Montée : "
        f"0 kg → {TARE_CIBLE:,} kg"
    )

    simuler_montee(
        conn,
        0,
        TARE_CIBLE,
        DUREE_MONTEE
    )

    # ========================================================
    # 3. STABLE À 16 T
    # ========================================================

    print()
    print()
    print(
        f"✅ POIDS STABLE : "
        f"{TARE_CIBLE:,} kg "
        f"({TARE_CIBLE / 1000:.0f} T)"
    )

    print(
        f"⏱️ Maintien pendant "
        f"{DUREE_STABLE} secondes."
    )

    maintenir_stable(
        conn,
        TARE_CIBLE,
        DUREE_STABLE
    )

    # ========================================================
    # 4. DESCENTE 16 T → 0
    # ========================================================

    print()
    print(
        "🚛 Camion quitte le pont..."
    )

    print(
        f"⚖️ Descente : "
        f"{TARE_CIBLE:,} kg → 0 kg"
    )

    simuler_descente(
        conn,
        TARE_CIBLE,
        0,
        DUREE_ZERO
    )

    # ========================================================
    # 5. STABLE À 0
    # ========================================================

    maintenir_stable(
        conn,
        0,
        DUREE_ZERO_STABLE
    )

    print()
    print(
        "✅ Retour à zéro."
    )

    # ========================================================
    # 6. PETITE PAUSE
    # ========================================================

    print()
    print(
        "⏳ Préparation de la deuxième pesée..."
    )

    time.sleep(3)

    # ========================================================
    # 7. MONTEE VERS 40 T
    # ========================================================

    print()
    print("🔵 DEUXIÈME PESÉE")
    print()
    print(
        "🚛 Camion chargé arrive..."
    )

    print(
        f"⚖️ Montée : "
        f"0 kg → {BRUT_CIBLE:,} kg"
    )

    simuler_montee(
        conn,
        0,
        BRUT_CIBLE,
        DUREE_MONTEE
    )

    # ========================================================
    # 8. STABLE À 40 T
    # ========================================================

    print()
    print()
    print(
        f"✅ POIDS STABLE : "
        f"{BRUT_CIBLE:,} kg "
        f"({BRUT_CIBLE / 1000:.0f} T)"
    )

    print(
        f"⏱️ Maintien pendant "
        f"{DUREE_STABLE} secondes."
    )

    maintenir_stable(
        conn,
        BRUT_CIBLE,
        DUREE_STABLE
    )

    # ========================================================
    # 9. DESCENTE 40 T → 0
    # ========================================================

    print()
    print(
        "🚛 Camion quitte le pont..."
    )

    print(
        f"⚖️ Descente : "
        f"{BRUT_CIBLE:,} kg → 0 kg"
    )

    simuler_descente(
        conn,
        BRUT_CIBLE,
        0,
        DUREE_ZERO
    )

    # ========================================================
    # 10. STABLE À 0
    # ========================================================

    maintenir_stable(
        conn,
        0,
        DUREE_ZERO_STABLE
    )

    print()
    print("=" * 70)
    print("✅ CYCLE COMPLET TERMINÉ")
    print("=" * 70)

    print(
        f"   Première pesée : "
        f"{TARE_CIBLE:,} kg"
    )

    print(
        f"   Deuxième pesée : "
        f"{BRUT_CIBLE:,} kg"
    )

    print(
        f"   Net théorique : "
        f"{MARCHANDISE:,} kg"
    )

    print("=" * 70)


# ============================================================
# SERVEUR
# ============================================================

def run_simulator():

    server = socket.socket(
        socket.AF_INET,
        socket.SOCK_STREAM
    )

    server.setsockopt(
        socket.SOL_SOCKET,
        socket.SO_REUSEADDR,
        1
    )

    server.bind(
        (HOST, PORT)
    )

    server.listen(1)

    print()
    print("=" * 70)
    print(
        "🚀 SIMULATEUR PONT-BASCULE MIZAN"
    )
    print("=" * 70)

    print(
        f"📡 TCP : {HOST}:{PORT}"
    )

    print(
        "⏳ En attente du Bridge..."
    )

    conn, addr = server.accept()

    print()
    print(
        f"🤝 Bridge connecté : {addr}"
    )

    numero_cycle = 1

    try:

        while True:

            # ====================================================
            # AFFICHAGE DU SCÉNARIO
            # ====================================================

            afficher_scenario(
                numero_cycle
            )

            # ====================================================
            # CYCLE
            # ====================================================

            executer_cycle(
                conn
            )

            # ====================================================
            # FIN
            # ====================================================

            print()
            print(
                f"🔄 Préparation du cycle "
                f"#{numero_cycle + 1}..."
            )

            time.sleep(5)

            numero_cycle += 1

    except KeyboardInterrupt:

        print()
        print(
            "\n🛑 Simulateur arrêté "
            "par l'utilisateur."
        )

    except ConnectionResetError:

        print()
        print(
            "\n⚠️ Connexion avec le Bridge perdue."
        )

    except BrokenPipeError:

        print()
        print(
            "\n⚠️ Le Bridge a fermé la connexion."
        )

    except Exception as error:

        print()
        print(
            f"\n❌ Erreur simulateur : "
            f"{error}"
        )

    finally:

        try:
            conn.close()
        except Exception:
            pass

        try:
            server.close()
        except Exception:
            pass

        print(
            "\n🔌 Serveur TCP fermé."
        )


# ============================================================
# DÉMARRAGE
# ============================================================

if __name__ == "__main__":
    run_simulator()