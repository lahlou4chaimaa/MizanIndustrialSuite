# import socket
# import re
# import time
# import socketio

# # Connexion WebSocket directe avec le serveur Node
# sio = socketio.Client()

# HOST = '127.0.0.1'
# PORT = 6000  # Corrigé (était 9999)

# def extract_weight_and_status(raw_frame):
#     # Extrait la valeur numérique et le statut (ex: +011450 kg STABLE)
#     match = re.search(r'\+?(\d+)\s*kg\s*(\w+)', raw_frame)
#     if match:
#         return int(match.group(1)), match.group(2)
    
#     # Fallback si la trame est juste un nombre
#     numbers = re.findall(r'\d+', raw_frame)
#     if numbers:
#         return int(numbers[0]), "STABLE"
#     return None, None

# def connect_socketio():
#     while not sio.connected:
#         try:
#             print("🔌 Connexion à Node.js (http://127.0.0.1:5000)...")
#             sio.connect('http://127.0.0.1:5000', transports=['websocket', 'polling'])
#             print("✅ Connecté à Socket.io !")
#         except Exception:
#             print("❌ Node.js non disponible. Retentative dans 2s...")
#             time.sleep(2)

# def main():
#     connect_socketio()

#     while True:
#         try:
#             client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
#             client_socket.connect((HOST, PORT))
#             print(f"🔌 Connecté au simulateur TCP sur {HOST}:{PORT}")

#             buffer = ""
#             while True:
#                 data = client_socket.recv(1024).decode('utf-8', errors='ignore')
#                 if not data:
#                     break

#                 buffer += data
#                 while "\n" in buffer:
#                     line, buffer = buffer.split("\n", 1)
#                     poids, statut = extract_weight_and_status(line)

#                     if poids is not None:
#                         payload = {"poids": poids, "statut": statut}
#                         # Émission directe vers Node.js
#                         sio.emit('weight-update', payload)
#                         print(f"🚀 Transmis à Node.js : {payload}")

#         except Exception as e:
#             print(f"❌ Erreur connexion simulateur : {e}. Retentative dans 2s...")
#             time.sleep(2)

# if __name__ == "__main__":
#     main()


import socket
import re
import time
import socketio

HOST = "127.0.0.1"
PORT = 6000
NODE_URL = "http://127.0.0.1:5000"

sio = socketio.Client(
    reconnection=True,
    reconnection_attempts=0,
    reconnection_delay=2,
)


def extract_weight_and_status(raw_frame):
    match = re.search(r"\+?(\d+)\s*kg\s*(\w+)", raw_frame)
    if match:
        return int(match.group(1)), match.group(2)

    numbers = re.findall(r"\d+", raw_frame)
    if numbers:
        return int(numbers[0]), "STABLE"

    return None, None


@sio.event
def connect():
    print("✅ Bridge connecté à Socket.IO")


@sio.event
def disconnect():
    print("⚠️ Bridge déconnecté de Socket.IO")


def connect_socketio():
    while not sio.connected:
        try:
            print(f"🔌 Connexion à Node.js : {NODE_URL}")
            sio.connect(
                NODE_URL,
                transports=["websocket", "polling"],
            )
        except Exception as error:
            print(f"❌ Node.js indisponible : {error}")
            time.sleep(2)


def connect_tcp():
    while True:
        client_socket = None
        try:
            print(f"🔌 Connexion au simulateur TCP : {HOST}:{PORT}")
            client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            client_socket.settimeout(10)
            client_socket.connect((HOST, PORT))
            print("✅ Connecté au pont TCP")

            buffer = ""
            while True:
                data = client_socket.recv(1024)
                if not data:
                    print("⚠️ Connexion TCP fermée.")
                    break

                buffer += data.decode("utf-8", errors="ignore")

                while "\n" in buffer:
                    line, buffer = buffer.split("\n", 1)
                    line = line.strip()

                    if not line:
                        continue

                    poids, statut = extract_weight_and_status(line)
                    if poids is None:
                        continue

                    payload = {
                        "poids": poids,
                        "statut": statut,
                    }

                    print(f"🚀 Poids reçu : {payload}")

                    if not sio.connected:
                        connect_socketio()

                    if sio.connected:
                        sio.emit("weight-update", payload)

        except (socket.timeout, socket.error) as error:
            print(f"❌ Erreur TCP : {error}")
        except Exception as error:
            print(f"❌ Erreur inattendue : {error}")
        finally:
            if client_socket:
                try:
                    client_socket.close()
                except Exception:
                    pass

        print("🔄 Nouvelle tentative TCP dans 2 secondes...")
        time.sleep(2)


def main():
    print("========================================")
    print("     MIZAN BRIDGE TCP → SOCKET.IO")
    print("========================================")

    connect_socketio()
    try:
        connect_tcp()
    except KeyboardInterrupt:
        print("\n🛑 Arrêt du bridge par l'utilisateur.")
        if sio.connected:
            sio.disconnect()


if __name__ == "__main__":
    main()