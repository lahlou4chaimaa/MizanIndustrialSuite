# import cv2
# import easyocr
# import socketio
# import time
# import re
# from ultralytics import YOLO

# sio = socketio.Client()

# def connecter():
#     while not sio.connected:
#         try:
#             sio.connect('http://127.0.0.1:5000', transports=['websocket', 'polling'])
#             print("[OK] Connecté au serveur Node.js")
#         except Exception:
#             time.sleep(2)

# connecter()

# print("[INFO] Chargement YOLOv8 & EasyOCR...")
# model = YOLO('yolov8n.pt') 
# reader = easyocr.Reader(['ar', 'en'], gpu=False)

# # ⚠️ REMPLACE PAR TON ADRESSE IP WEBCAM
# URL_CAMERA_IP = "http://10.20.30.13:8080/video" 

# # PARAMÈTRES D'AFFICHAGE (Ajuste selon ton besoin)
# ROTATION = cv2.ROTATE_90_CLOCKWISE  # Choix : cv2.ROTATE_90_CLOCKWISE, cv2.ROTATE_90_COUNTERCLOCKWISE, ou None
# LARGEUR_FENETRE = 800  # Redimensionne la fenêtre pour éviter l'effet géant

# def ajuster_orientation_et_taille(frame):
#     # 1. Application de la rotation si nécessaire
#     if ROTATION is not None:
#         frame = cv2.rotate(frame, ROTATION)
    
#     # 2. Redimensionnement de la fenêtre
#     h, w = frame.shape[:2]
#     hauteur_calculee = int(h * (LARGEUR_FENETRE / w))
#     frame_resized = cv2.resize(frame, (LARGEUR_FENETRE, hauteur_calculee), interpolation=cv2.INTER_AREA)
#     return frame_resized

# def nettoyer_et_extraire(texte):
#     cleaned = re.sub(r'[^0-9\u0600-\u06FF]', ' ', texte)
#     numbers = re.findall(r'\d+', cleaned)
#     arabic = re.findall(r'[\u0600-\u06FF]', cleaned)

#     if len(numbers) >= 2 and arabic:
#         return f"{numbers[0]} | {arabic[0]} | {numbers[1]}"
#     elif len(numbers) >= 2:
#         return f"{numbers[0]}-{numbers[1]}"
#     elif len(numbers) == 1 and len(numbers[0]) >= 4:
#         return numbers[0]
#     return None

# cap = cv2.VideoCapture(URL_CAMERA_IP)

# while True:
#     ret, frame = cap.read()
#     if not ret:
#         print("[ATTENTION] Flux interrompu...")
#         time.sleep(1)
#         cap = cv2.VideoCapture(URL_CAMERA_IP)
#         continue

#     # Ajustement de l'image (sens + taille)
#     frame = ajuster_orientation_et_taille(frame)

#     # Détection YOLO + OCR
#     results = model(frame, stream=True, verbose=False)
#     matricule_trouvee = None

#     for r in results:
#         for box in r.boxes:
#             x1, y1, x2, y2 = map(int, box.xyxy[0])
#             roi = frame[y1:y2, x1:x2]
#             if roi.size == 0:
#                 continue

#             gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
#             ocr_res = reader.readtext(gray, detail=1)
#             texte_brut = " ".join([res[1] for res in ocr_res])
#             mat = nettoyer_et_extraire(texte_brut)

#             if mat:
#                 matricule_trouvee = mat
#                 cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
#                 cv2.putText(frame, mat, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

#     if matricule_trouvee:
#         sio.emit('matricule-detectee', {
#             "matriculeDetectee": matricule_trouvee,
#             "confiance": 90,
#             "stable": True
#         })

#     cv2.imshow("Flux IP Webcam Adjuste", frame)
#     if cv2.waitKey(1) & 0xFF == ord('q'):
#         break

# cap.release()
# cv2.destroyAllWindows()




import cv2
import numpy as np
import easyocr
from ultralytics import YOLO

try:
    from huggingface_hub import hf_hub_download
    model_path = hf_hub_download(repo_id="joker5914/yolov8n-license-plate", filename="best.pt")
    model = YOLO(model_path)
except Exception:
    model = YOLO('yolov8n.pt')

reader = easyocr.Reader(['en', 'ar'], gpu=False)


def detecter_couleur_rouge(crop_bgr):
    hsv = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2HSV)
    lower_red1 = np.array([0, 50, 50])
    upper_red1 = np.array([10, 255, 255])
    lower_red2 = np.array([170, 50, 50])
    upper_red2 = np.array([180, 255, 255])
    mask = cv2.bitwise_or(
        cv2.inRange(hsv, lower_red1, upper_red1),
        cv2.inRange(hsv, lower_red2, upper_red2)
    )
    return (np.sum(mask > 0) / (crop_bgr.shape[0] * crop_bgr.shape[1])) > 0.35


def lire_plaque_une_fois(crop_bgr):
    """Une seule lecture, sur une seule image figée -- pas de boucle continue
    qui change de résultat à chaque frame. Le résultat sert de PRE-REMPLISSAGE,
    l'agent corrige ensuite ce qui est faux."""
    crop_large = cv2.resize(crop_bgr, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    gray = cv2.cvtColor(crop_large, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    gray = clahe.apply(gray)

    resultats = reader.readtext(gray, detail=1, allowlist='0123456789')
    resultats.sort(key=lambda r: sum(pt[0] for pt in r[0]) / len(r[0]))
    groupes = [text for (_, text, _) in resultats if text.strip()]
    return groupes


# 2. Ouverture de la caméra
cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

print("========================================")
print("  Positionne la plaque, puis appuie sur")
print("  ESPACE pour capturer et lire.")
print("  'Q' pour quitter.")
print("========================================\n")

dernier_crop = None
dernier_type = None

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        print("Erreur d'accès à la caméra")
        break

    results = model(frame, conf=0.4, verbose=False)[0]
    display = frame.copy()

    for box in results.boxes.xyxy:
        x1, y1, x2, y2 = map(int, box)
        h, w, _ = frame.shape
        x1_pad, y1_pad = max(0, x1 - 8), max(0, y1 - 8)
        x2_pad, y2_pad = min(w, x2 + 8), min(h, y2 + 8)

        crop = frame[y1_pad:y2_pad, x1_pad:x2_pad]
        if crop.size == 0 or crop.shape[0] < 15 or crop.shape[1] < 15:
            continue

        est_remorque = detecter_couleur_rouge(crop)
        dernier_crop = crop
        dernier_type = "REMORQUE" if est_remorque else "TRACTEUR"

        couleur = (0, 0, 255) if est_remorque else (0, 255, 0)
        cv2.rectangle(display, (x1, y1), (x2, y2), couleur, 2)
        cv2.putText(display, dernier_type, (x1, max(y1 - 10, 20)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, couleur, 2)

    cv2.putText(display, "ESPACE = capturer  |  Q = quitter", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

    cv2.imshow("Detection Plaques", display)

    touche = cv2.waitKey(1) & 0xFF
    if touche == ord('q'):
        break
    elif touche == ord(' '):
        if dernier_crop is None:
            print("Aucune plaque détectée à l'écran, réessaie.")
            continue

        groupes = lire_plaque_une_fois(dernier_crop)

        if dernier_type == "REMORQUE":
            matricule = "".join(groupes)
            print(f"\n[CAPTURE - {dernier_type}] Résultat : {matricule}")
            print("-> À valider/corriger côté interface avant envoi.\n")
        else:
            if len(groupes) >= 2:
                matricule = f"{groupes[0]} | _ | {groupes[-1]}"
            elif len(groupes) == 1:
                matricule = f"{groupes[0]} | _ | ???"
            else:
                matricule = "??? | _ | ???"
            print(f"\n[CAPTURE - {dernier_type}] Résultat : {matricule}")
            print("-> Complète la lettre et corrige si besoin côté interface.\n")

cap.release()
cv2.destroyAllWindows()