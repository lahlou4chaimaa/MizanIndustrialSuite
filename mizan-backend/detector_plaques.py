# import cv2
# import easyocr
# import socketio
# import time
# import re
# import sys

# sio = socketio.Client()

# CONF_MIN = 35
# CONF_VERROU = 55
# STABILITE = 2

# buffer_lecture = []

# def connecter():
#     while not sio.connected:
#         try:
#             sio.connect('http://127.0.0.1:5000', transports=['websocket', 'polling'])
#             print("[OK] Connecté au serveur Node.js")
#         except Exception:
#             time.sleep(2)

# def initialiser_camera():
#     """ Teste les index 0, 1, 2 pour trouver la caméra Iriun """
#     for index in [1, 0, 2]:
#         print(f"[INFO] Essai d'ouverture de la caméra index {index}...")
#         cap = cv2.VideoCapture(index, cv2.CAP_DSHOW)
#         if cap.isOpened():
#             ret, frame = cap.read()
#             if ret and frame is not None:
#                 print(f"[OK] Caméra fonctionnelle trouvée sur l'index {index}")
#                 return cap
#             cap.release()
#     return None

# print("[INFO] Chargement OCR...")
# reader = easyocr.Reader(['ar', 'en'], gpu=False)
# print("[OK] OCR prêt.")

# def preprocess(frame):
#     h, w = frame.shape[:2]
#     frame = cv2.resize(frame, (w * 2, h * 2), interpolation=cv2.INTER_CUBIC)
#     return cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

# def merger_lignes(results, seuil_y=35):
#     if not results:
#         return []
#     items = []
#     for (bbox, text, prob) in results:
#         ys = [pt[1] for pt in bbox]
#         xs = [pt[0] for pt in bbox]
#         items.append({"text": text, "prob": prob, "y": sum(ys)/len(ys), "x": sum(xs)/len(xs)})
#     items.sort(key=lambda i: (i["y"], i["x"]))

#     groupes, groupe = [], [items[0]]
#     for item in items[1:]:
#         if abs(item["y"] - groupe[-1]["y"]) <= seuil_y:
#             groupe.append(item)
#         else:
#             groupes.append(groupe)
#             groupe = [item]
#     groupes.append(groupe)

#     fusionnes = []
#     for g in groupes:
#         g_sorted = sorted(g, key=lambda i: i["x"])
#         texte = ' '.join(i["text"] for i in g_sorted)
#         prob_min = min(i["prob"] for i in g_sorted)
#         fusionnes.append((texte.strip(), prob_min))
#     return fusionnes

# def extraire_matricule(texte):
#     """
#     Extrait la plaque marocaine : 11258 | أ | 40
#     """
#     cleaned = texte.replace('\n', ' ').replace('|', ' ').replace('-', ' ').replace('.', ' ')
#     numbers = re.findall(r'\d+', cleaned)
    
#     if not numbers:
#         return None

#     arabic_letters = re.findall(r'[\u0600-\u06FF]', cleaned)

#     # Si 2 groupes de chiffres et 1 lettre arabe (ex: 11258 | أ | 40)
#     if len(numbers) >= 2 and arabic_letters:
#         return f"{numbers[0]} | {arabic_letters[0]} | {numbers[1]}"

#     # Si 2 groupes de chiffres sans lettre (Remorque ex: 98765-72)
#     elif len(numbers) >= 2 and not arabic_letters:
#         return f"{numbers[0]}-{numbers[1]}"

#     # Un seul bloc de chiffres
#     elif len(numbers) == 1 and len(numbers[0]) >= 4:
#         return numbers[0]

#     return None

# def main():
#     connecter()
#     cap = initialiser_camera()
    
#     if cap is None:
#         print("[ERREUR] Impossible de lire le flux vidéo. Vérifiez qu'Iriun est bien démarré sur votre téléphone et PC.")
#         sys.exit(1)

#     print("\n========================================")
#     print("   OCR PONT-BASCULE — PRÊT")
#     print("========================================\n")

#     while True:
#         ret, frame = cap.read()
#         if not ret or frame is None:
#             print("[ATTENTION] Perte d'image...")
#             time.sleep(0.1)
#             continue

#         processed = preprocess(frame)
#         results = reader.readtext(processed, detail=1, paragraph=False)
#         lignes = merger_lignes(results)

#         meilleure_lecture, meilleure_conf = None, 0
#         for texte, prob in lignes:
#             conf = int(prob * 100)
#             if conf < CONF_MIN:
#                 continue
#             mat = extraire_matricule(texte)
#             if mat and conf > meilleure_conf:
#                 meilleure_lecture, meilleure_conf = mat, conf

#         display = frame.copy()
#         h, w = display.shape[:2]

#         # Cadre unique de cadrage
#         cv2.rectangle(display, (int(w*0.1), int(h*0.3)), (int(w*0.9), int(h*0.7)), (0, 255, 0), 2)
#         cv2.putText(display, "Placer la plaque ici", (int(w*0.1), int(h*0.28)), 
#                     cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

#         if meilleure_lecture:
#             cv2.putText(display, f"Lecture: {meilleure_lecture} ({meilleure_conf}%)",
#                         (20, h - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
            
#             sio.emit('matricule-detectee', {
#                 "matriculeDetectee": meilleure_lecture,
#                 "confiance": meilleure_conf,
#                 "stable": True
#             })
#             print(f"[DÉTECTION] {meilleure_lecture} ({meilleure_conf}%)")
#         else:
#             cv2.putText(display, "Lecture: ...", (20, h - 30),
#                         cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)

#         cv2.imshow('OCR Pont-Bascule', display)
#         if cv2.waitKey(1) & 0xFF == ord('q'):
#             break

#     cap.release()
#     cv2.destroyAllWindows()

# if __name__ == "__main__":
#     main()


import io
import os
from typing import Any, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from inference_sdk import InferenceConfiguration, InferenceHTTPClient
from PIL import Image, ImageOps


# ============================================================
# CONFIGURATION
# ============================================================

load_dotenv()

API_KEY = os.getenv("ROBOFLOW_API_KEY", "").strip()

API_URL = "https://serverless.roboflow.com"
WORKSPACE = "chaimaala"

# Plaque marocaine : chiffres | lettre arabe | chiffres
WORKFLOW_TRACTEUR = "moroccan-license-plate-ocr-1788096205153"

# Plaque rouge de remorque
WORKFLOW_REMORQUE = "lecture-plaques-remorques-maroc-1788177816517"

if not API_KEY:
    raise RuntimeError(
        "ROBOFLOW_API_KEY est absente. "
        "Ajoute une Private API Key dans le fichier .env."
    )


# ============================================================
# CLIENT ROBOFLOW
# ============================================================

client = InferenceHTTPClient(
    api_url=API_URL,
    api_key=API_KEY,
).configure(
    InferenceConfiguration(
        api_key_transport="header"
    )
)


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(
    title="API Détection Plaques Marocaines",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# NORMALISATION DE LA RÉPONSE ROBOFLOW
# ============================================================

def unwrap_output(result: Any) -> dict:
    """
    Récupère le dictionnaire de sorties, quelle que soit la forme
    retournée par inference-sdk.
    """

    while isinstance(result, list):
        if not result:
            return {}
        result = result[0]

    if not isinstance(result, dict):
        return {}

    outputs = result.get("outputs")

    if outputs is not None:
        return unwrap_output(outputs)

    return result


# ============================================================
# EXTRACTION PLAQUE TRACTEUR
# ============================================================

PLATE_FIELDS = {
    "first_digits",
    "arabic_letter",
    "last_digits",
    "full_plate",
    "valid_format",
}


def find_plate_result(value: Any) -> Optional[dict]:
    """
    Recherche récursivement le résultat Parse_Moroccan_Plate.
    """

    if isinstance(value, dict):
        if PLATE_FIELDS.issubset(value.keys()):
            return value

        for child in value.values():
            found = find_plate_result(child)

            if found is not None:
                return found

    elif isinstance(value, list):
        for child in value:
            found = find_plate_result(child)

            if found is not None:
                return found

    return None


def extract_tracteur_plate(result: Any) -> Optional[dict]:
    output = unwrap_output(result)

    if not output:
        return None

    # Important : si le recadrage n'a pas trouvé de plaque,
    # on refuse une éventuelle réponse OCR hallucinée.
    plate_found = output.get("plate_found")

    if plate_found is False:
        return None

    plate_text = output.get("plate_text")

    if plate_text is None:
        return None

    plate = find_plate_result(plate_text)

    if plate is None:
        return None

    first_digits = str(
        plate.get("first_digits") or ""
    ).strip()

    arabic_letter = str(
        plate.get("arabic_letter") or ""
    ).strip()

    last_digits = str(
        plate.get("last_digits") or ""
    ).strip()

    full_plate = str(
        plate.get("full_plate") or ""
    ).strip()

    valid_format = bool(
        plate.get("valid_format", False)
    )

    # On n'annonce pas de succès si la lecture n'est pas complète.
    if not valid_format:
        return {
            "first_digits": first_digits,
            "arabic_letter": arabic_letter,
            "last_digits": last_digits,
            "full_plate": full_plate,
            "valid_format": False,
        }

    return {
        "first_digits": first_digits,
        "arabic_letter": arabic_letter,
        "last_digits": last_digits,
        "full_plate": full_plate,
        "valid_format": True,
    }


# ============================================================
# EXTRACTION PLAQUE REMORQUE
# ============================================================

def first_non_empty_text(value: Any) -> Optional[str]:
    if value is None:
        return None

    if isinstance(value, str):
        text = value.strip()
        return text if text else None

    if isinstance(value, list):
        for child in value:
            text = first_non_empty_text(child)

            if text:
                return text

        return None

    if isinstance(value, dict):
        # Cherche en priorité les champs textuels habituels.
        preferred_keys = (
            "full_plate",
            "plate_text",
            "text",
            "result",
            "parsed_output",
        )

        for key in preferred_keys:
            if key in value:
                text = first_non_empty_text(value[key])

                if text:
                    return text

        for child in value.values():
            text = first_non_empty_text(child)

            if text:
                return text

        return None

    text = str(value).strip()
    return text if text else None


def extract_remorque_plate(result: Any) -> Optional[str]:
    output = unwrap_output(result)

    if not output:
        return None

    plate_text = output.get("plate_text")

    if plate_text is None:
        return None

    return first_non_empty_text(plate_text)


# ============================================================
# EXÉCUTION DES WORKFLOWS
# ============================================================

def run_workflow(image: Image.Image, workflow_id: str) -> Any:
    """
    Chaque requête envoie l'image originale au Workflow demandé.
    Aucun mélange entre tracteur et remorque.
    """

    return client.run_workflow(
        workspace_name=WORKSPACE,
        workflow_id=workflow_id,
        images={
            "image": image
        },
        # Désactivé pendant les tests caméra pour toujours traiter
        # la capture courante.
        use_cache=False,
    )


def run_tracteur(image: Image.Image) -> Any:
    print("\n----------------------------------------")
    print("WORKFLOW TRACTEUR")
    print(WORKFLOW_TRACTEUR)
    print("----------------------------------------")

    return run_workflow(
        image=image,
        workflow_id=WORKFLOW_TRACTEUR,
    )


def run_remorque(image: Image.Image) -> Any:
    print("\n----------------------------------------")
    print("WORKFLOW REMORQUE")
    print(WORKFLOW_REMORQUE)
    print("----------------------------------------")

    return run_workflow(
        image=image,
        workflow_id=WORKFLOW_REMORQUE,
    )


# ============================================================
# PRÉPARATION DE L'IMAGE
# ============================================================

async def lire_image(file: UploadFile) -> Image.Image:
    contents = await file.read()

    if not contents:
        raise ValueError("L'image reçue est vide.")

    try:
        with Image.open(io.BytesIO(contents)) as source:
            # Important pour les photos de téléphone :
            # applique correctement la rotation EXIF.
            image = ImageOps.exif_transpose(source)

            # Le Workflow reçoit une image RGB complète.
            image = image.convert("RGB")

            # Copie indépendante avant fermeture du flux.
            image = image.copy()

        width, height = image.size

        if width < 100 or height < 100:
            raise ValueError(
                f"Résolution trop faible : {width}x{height}"
            )

        return image

    except ValueError:
        raise

    except Exception as exc:
        raise ValueError(
            f"Image invalide : {exc}"
        ) from exc


# ============================================================
# ENDPOINT TRACTEUR
# ============================================================

@app.post("/api/detecter-tracteur")
async def detecter_tracteur(
    file: UploadFile = File(...)
):
    print("\n========================================")
    print("CAPTURE MATRICULE TRACTEUR")
    print("========================================")

    try:
        image = await lire_image(file)

        print(
            f"Image reçue en résolution originale : "
            f"{image.width}x{image.height}"
        )

        # Le client HTTP est synchrone : on l'exécute hors de
        # la boucle asynchrone de FastAPI.
        result = await run_in_threadpool(
            run_tracteur,
            image,
        )

        tracteur = extract_tracteur_plate(result)

        if tracteur is None:
            return {
                "succes": False,
                "matricule_tracteur": None,
                "tracteur": None,
                "erreur": (
                    "Aucune plaque tracteur n'a été "
                    "correctement détectée et recadrée."
                ),
            }

        if not tracteur["valid_format"]:
            print(
                "Lecture tracteur incomplète :",
                tracteur["full_plate"],
            )

            return {
                "succes": False,
                "matricule_tracteur": None,
                "tracteur": tracteur,
                "erreur": (
                    "Plaque détectée, mais la lecture des trois "
                    "parties n'est pas suffisamment fiable."
                ),
            }

        print(
            "Matricule tracteur :",
            tracteur["full_plate"],
        )
        print(
            "Chiffres gauche :",
            tracteur["first_digits"],
        )
        print(
            "Lettre arabe :",
            tracteur["arabic_letter"],
        )
        print(
            "Chiffres droite :",
            tracteur["last_digits"],
        )

        return {
            "succes": True,
            "matricule_tracteur": tracteur["full_plate"],
            "tracteur": tracteur,
            "erreur": None,
        }

    except Exception as exc:
        print("[ERREUR API TRACTEUR]", exc)

        return {
            "succes": False,
            "matricule_tracteur": None,
            "tracteur": None,
            "erreur": str(exc),
        }


# ============================================================
# ENDPOINT REMORQUE
# ============================================================

@app.post("/api/detecter-remorque")
async def detecter_remorque(
    file: UploadFile = File(...)
):
    print("\n========================================")
    print("CAPTURE MATRICULE REMORQUE")
    print("========================================")

    try:
        image = await lire_image(file)

        print(
            f"Image reçue en résolution originale : "
            f"{image.width}x{image.height}"
        )

        result = await run_in_threadpool(
            run_remorque,
            image,
        )

        remorque = extract_remorque_plate(result)

        if not remorque:
            return {
                "succes": False,
                "matricule_remorque": None,
                "erreur": (
                    "Aucune plaque remorque reconnue."
                ),
            }

        print("Matricule remorque :", remorque)

        return {
            "succes": True,
            "matricule_remorque": remorque,
            "erreur": None,
        }

    except Exception as exc:
        print("[ERREUR API REMORQUE]", exc)

        return {
            "succes": False,
            "matricule_remorque": None,
            "erreur": str(exc),
        }


# ============================================================
# ÉTAT DE L'API
# ============================================================

@app.get("/")
def root():
    return {
        "api": "Détection plaques marocaines",
        "status": "online",
        "workflow_tracteur": WORKFLOW_TRACTEUR,
        "workflow_remorque": WORKFLOW_REMORQUE,
        "endpoints": {
            "tracteur": "/api/detecter-tracteur",
            "remorque": "/api/detecter-remorque",
        },
    }


# ============================================================
# LANCEMENT
# ============================================================

if __name__ == "__main__":
    import uvicorn

    print("========================================")
    print("API DÉTECTION PLAQUES")
    print("========================================")
    print("Tracteur :", WORKFLOW_TRACTEUR)
    print("Remorque :", WORKFLOW_REMORQUE)
    print("API : http://127.0.0.1:8000")
    print("========================================")

    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
    )
