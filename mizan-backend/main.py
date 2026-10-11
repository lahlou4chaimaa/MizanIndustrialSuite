import csv
import os
import sys
import threading
from datetime import datetime
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
from dotenv import load_dotenv
from inference_sdk import InferenceConfiguration, InferenceHTTPClient
from PIL import Image, ImageDraw, ImageFont


# ============================================================
# Encodage Unicode du terminal Windows
# ============================================================

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass


# ============================================================
# Configuration
# ============================================================

load_dotenv()

API_KEY = os.getenv("ROBOFLOW_API_KEY", "").strip()
CAMERA_SOURCE_RAW = os.getenv("CAMERA_SOURCE", "0").strip()

API_URL = "https://serverless.roboflow.com"
WORKSPACE_NAME = "chaimaala"
WORKFLOW_ID = "moroccan-license-plate-ocr-1788096205153"

WINDOW_NAME = "Lecteur de plaques marocaines"
CSV_PATH = Path("plaques.csv")

# Temps d'attente après chaque analyse.
# Le Workflow contient trois étapes OCR ; il n'est donc pas nécessaire
# de traiter 30 images par seconde.
INFERENCE_INTERVAL_SECONDS = 1.0

# Nombre de nouvelles tentatives si Roboflow Cloud renvoie
# temporairement une erreur 520, 502, 503 ou 504.
MAX_CLOUD_ATTEMPTS = 4

# Polices Windows capables d'afficher un caractère arabe.
FONT_PATHS = [
    r"C:\Windows\Fonts\arial.ttf",
    r"C:\Windows\Fonts\tahoma.ttf",
    r"C:\Windows\Fonts\segoeui.ttf",
]


# ============================================================
# Configuration de la caméra
# ============================================================

def parse_camera_source(value: str):
    """
    CAMERA_SOURCE=0
        Webcam principale.

    CAMERA_SOURCE=1
        Deuxième webcam.

    CAMERA_SOURCE=rtsp://...
        Caméra réseau.
    """
    if value.isdigit():
        return int(value)

    return value


CAMERA_SOURCE = parse_camera_source(CAMERA_SOURCE_RAW)


# ============================================================
# Vérification de la clé API
# ============================================================

if not API_KEY:
    raise RuntimeError(
        "ROBOFLOW_API_KEY est absente.\n"
        "Crée un fichier .env contenant :\n"
        "ROBOFLOW_API_KEY=TA_VRAIE_CLE\n"
        "CAMERA_SOURCE=0"
    )


# ============================================================
# Client Roboflow Cloud
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
# État partagé entre la webcam et le thread OCR
# ============================================================

state_lock = threading.Lock()
stop_event = threading.Event()

latest_frame: Optional[np.ndarray] = None
latest_annotated_frame: Optional[np.ndarray] = None

latest_status = "Initialisation..."
latest_error = ""

latest_left = ""
latest_letter = ""
latest_right = ""
latest_full_plate = ""
latest_valid = False

last_saved_plate = ""


# ============================================================
# Gestion du CSV
# ============================================================

def initialize_csv():
    """
    Crée plaques.csv s'il n'existe pas.

    utf-8-sig permet à Excel d'afficher correctement
    les lettres arabes.
    """
    if CSV_PATH.exists():
        return

    with CSV_PATH.open(
        "w",
        newline="",
        encoding="utf-8-sig",
    ) as file:
        writer = csv.writer(file)

        writer.writerow(
            [
                "timestamp",
                "full_plate",
                "first_digits",
                "arabic_letter",
                "last_digits",
            ]
        )


def save_plate(plate: dict):
    """
    Enregistre immédiatement une nouvelle plaque valide.
    """
    global last_saved_plate

    full_plate = str(
        plate.get("full_plate", "")
    ).strip()

    if not full_plate:
        return

    # Ne pas enregistrer une lecture incomplète.
    if "?" in full_plate:
        return

    # Évite d'enregistrer la même plaque toutes les secondes.
    if full_plate == last_saved_plate:
        return

    last_saved_plate = full_plate

    with CSV_PATH.open(
        "a",
        newline="",
        encoding="utf-8-sig",
    ) as file:
        writer = csv.writer(file)

        writer.writerow(
            [
                datetime.now().isoformat(
                    timespec="seconds"
                ),
                full_plate,
                plate.get("first_digits", ""),
                plate.get("arabic_letter", ""),
                plate.get("last_digits", ""),
            ]
        )

    print("\n========================================")
    print("PLAQUE MAROCAINE ENREGISTRÉE")
    print("========================================")
    print("Matricule       :", full_plate)
    print(
        "Chiffres gauche :",
        plate.get("first_digits", ""),
    )
    print(
        "Lettre arabe    :",
        plate.get("arabic_letter", ""),
    )
    print(
        "Chiffres droite :",
        plate.get("last_digits", ""),
    )
    print("CSV             :", CSV_PATH.resolve())
    print("========================================\n")


# ============================================================
# Lecture de la réponse Roboflow
# ============================================================

def unwrap_output(result):
    """
    Roboflow retourne généralement :

        [
            {
                "plate_text": [...],
                "plate_detections": {...}
            }
        ]

    Cette fonction récupère le dictionnaire intérieur.
    """
    if isinstance(result, list):
        if not result:
            return {}

        result = result[0]

    if not isinstance(result, dict):
        return {}

    # Accepte aussi une éventuelle enveloppe "outputs".
    if "outputs" in result:
        outputs = result["outputs"]

        if isinstance(outputs, list):
            if not outputs:
                return {}

            return unwrap_output(outputs[0])

        if isinstance(outputs, dict):
            return outputs

    return result


def extract_plate_items(value):
    """
    Recherche récursivement les résultats produits
    par le parseur du Workflow.

    Format attendu :

        {
            "first_digits": "58540",
            "arabic_letter": "أ",
            "last_digits": "26",
            "full_plate": "58540 | أ | 26",
            "valid_format": true
        }
    """
    items = []

    if isinstance(value, list):
        for element in value:
            items.extend(
                extract_plate_items(element)
            )

    elif isinstance(value, dict):
        required_fields = {
            "first_digits",
            "arabic_letter",
            "last_digits",
            "full_plate",
            "valid_format",
        }

        if required_fields.issubset(value.keys()):
            items.append(value)
        else:
            for child in value.values():
                items.extend(
                    extract_plate_items(child)
                )

    return items


def extract_predictions(output: dict):
    """
    Extrait les boîtes de détection depuis plate_detections.
    """
    plate_detections = output.get(
        "plate_detections",
        {},
    )

    if isinstance(plate_detections, list):
        plate_detections = (
            plate_detections[0]
            if plate_detections
            else {}
        )

    if not isinstance(plate_detections, dict):
        return []

    predictions = plate_detections.get(
        "predictions",
        [],
    )

    if not isinstance(predictions, list):
        return []

    return predictions


# ============================================================
# Police et affichage Unicode arabe
# ============================================================

def load_unicode_font(size: int):
    """
    Charge la première police Windows disponible
    prenant en charge l'arabe.
    """
    for font_path in FONT_PATHS:
        if os.path.exists(font_path):
            return ImageFont.truetype(
                font_path,
                size=size,
            )

    print(
        "Attention : aucune police Unicode Windows "
        "n'a été trouvée."
    )

    return ImageFont.load_default()


def draw_unicode_text(
    frame: np.ndarray,
    text: str,
    position: tuple[int, int],
    font_size: int = 48,
    color=(255, 255, 255),
):
    """
    Affiche du texte Unicode avec Pillow.

    OpenCV seul ne sait pas afficher correctement
    les caractères arabes.
    """
    rgb_frame = cv2.cvtColor(
        frame,
        cv2.COLOR_BGR2RGB,
    )

    pil_image = Image.fromarray(rgb_frame)
    draw = ImageDraw.Draw(pil_image)
    font = load_unicode_font(font_size)

    # OpenCV utilise BGR, Pillow utilise RGB.
    rgb_color = (
        color[2],
        color[1],
        color[0],
    )

    draw.text(
        position,
        str(text),
        font=font,
        fill=rgb_color,
    )

    return cv2.cvtColor(
        np.array(pil_image),
        cv2.COLOR_RGB2BGR,
    )


# ============================================================
# Affichage des boîtes de détection
# ============================================================

def draw_detections(
    frame: np.ndarray,
    predictions: list[dict],
):
    annotated = frame.copy()

    for prediction in predictions:
        try:
            x = float(prediction["x"])
            y = float(prediction["y"])
            width = float(prediction["width"])
            height = float(prediction["height"])

            confidence = float(
                prediction.get("confidence", 0)
            )

            x1 = max(
                0,
                int(x - width / 2),
            )

            y1 = max(
                0,
                int(y - height / 2),
            )

            x2 = min(
                annotated.shape[1] - 1,
                int(x + width / 2),
            )

            y2 = min(
                annotated.shape[0] - 1,
                int(y + height / 2),
            )

            cv2.rectangle(
                annotated,
                (x1, y1),
                (x2, y2),
                (0, 255, 0),
                3,
            )

            cv2.putText(
                annotated,
                f"Plaque {confidence:.1%}",
                (x1, max(30, y1 - 10)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 255, 0),
                2,
                cv2.LINE_AA,
            )

        except (
            KeyError,
            TypeError,
            ValueError,
        ):
            continue

    return annotated


# ============================================================
# Affichage du matricule complet
# ============================================================

def draw_plate_panel(
    frame: np.ndarray,
    left: str,
    letter: str,
    right: str,
    valid: bool,
):
    """
    Affiche en bas de la fenêtre :

        58540 | أ | 26
    """
    display = frame.copy()

    height, width = display.shape[:2]

    panel_height = 135
    panel_top = max(
        0,
        height - panel_height,
    )

    overlay = display.copy()

    cv2.rectangle(
        overlay,
        (0, panel_top),
        (width, height),
        (0, 0, 0),
        -1,
    )

    display = cv2.addWeighted(
        overlay,
        0.80,
        display,
        0.20,
        0,
    )

    if valid:
        title = "PLAQUE MAROCAINE VALIDE"
        status_color = (0, 255, 0)
    else:
        title = "LECTURE OCR"
        status_color = (0, 200, 255)

    cv2.putText(
        display,
        title,
        (20, panel_top + 30),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.70,
        status_color,
        2,
        cv2.LINE_AA,
    )

    left_value = left or "?"
    letter_value = letter or "?"
    right_value = right or "?"

    # Chiffres gauche
    cv2.putText(
        display,
        left_value,
        (30, panel_top + 100),
        cv2.FONT_HERSHEY_SIMPLEX,
        1.35,
        (255, 255, 255),
        3,
        cv2.LINE_AA,
    )

    # Premier séparateur
    cv2.putText(
        display,
        "|",
        (205, panel_top + 100),
        cv2.FONT_HERSHEY_SIMPLEX,
        1.35,
        (255, 255, 255),
        3,
        cv2.LINE_AA,
    )

    # Lettre arabe avec Pillow
    display = draw_unicode_text(
        display,
        letter_value,
        (250, panel_top + 47),
        font_size=54,
        color=(255, 255, 255),
    )

    # Deuxième séparateur
    cv2.putText(
        display,
        "|",
        (330, panel_top + 100),
        cv2.FONT_HERSHEY_SIMPLEX,
        1.35,
        (255, 255, 255),
        3,
        cv2.LINE_AA,
    )

    # Chiffres droite
    cv2.putText(
        display,
        right_value,
        (375, panel_top + 100),
        cv2.FONT_HERSHEY_SIMPLEX,
        1.35,
        (255, 255, 255),
        3,
        cv2.LINE_AA,
    )

    validation_text = (
        "FORMAT VALIDE"
        if valid
        else "LECTURE INCOMPLETE"
    )

    cv2.putText(
        display,
        validation_text,
        (
            max(20, width - 260),
            panel_top + 95,
        ),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.60,
        status_color,
        2,
        cv2.LINE_AA,
    )

    return display


# ============================================================
# Appel du Workflow Roboflow
# ============================================================

def run_workflow(
    frame: np.ndarray,
    max_attempts: int = MAX_CLOUD_ATTEMPTS,
):
    """
    Envoie l'image complète au Workflow Roboflow.

    Le Workflow effectue lui-même :
      1. détection de la plaque ;
      2. recadrage ;
      3. agrandissement ;
      4. lecture des chiffres gauche ;
      5. lecture de la lettre arabe ;
      6. lecture des chiffres droite ;
      7. validation du matricule.
    """
    global latest_status
    global latest_error

    last_error = None

    for attempt in range(
        1,
        max_attempts + 1,
    ):
        if stop_event.is_set():
            return {}

        try:
            with state_lock:
                latest_status = (
                    f"Analyse Roboflow "
                    f"{attempt}/{max_attempts}..."
                )
                latest_error = ""

            print(
                f"Analyse Roboflow "
                f"(tentative {attempt}/{max_attempts})..."
            )

            result = client.run_workflow(
                workspace_name=WORKSPACE_NAME,
                workflow_id=WORKFLOW_ID,
                images={
                    "image": frame,
                },

                # IMPORTANT :
                # récupère immédiatement la version corrigée
                # de la découpe de la lettre arabe.
                use_cache=False,
            )

            output = unwrap_output(result)

            if not output:
                raise RuntimeError(
                    "Le Workflow a retourné "
                    "une réponse vide."
                )

            return output

        except Exception as error:
            last_error = error

            with state_lock:
                latest_error = str(error)
                latest_status = (
                    "Cloud temporairement indisponible"
                )

            print(
                f"\nÉchec Roboflow "
                f"{attempt}/{max_attempts}:"
            )
            print(error)

            if attempt < max_attempts:
                # Attente de 2 s, puis 4 s, puis 8 s.
                wait_seconds = 2 ** attempt

                print(
                    f"Nouvelle tentative dans "
                    f"{wait_seconds} secondes..."
                )

                if stop_event.wait(wait_seconds):
                    return {}

    raise RuntimeError(
        "Roboflow Cloud ne répond pas après "
        f"{max_attempts} tentatives. "
        f"Dernière erreur : {last_error}"
    )


# ============================================================
# Thread d'analyse OCR
# ============================================================

def inference_worker():
    global latest_annotated_frame
    global latest_status
    global latest_error

    global latest_left
    global latest_letter
    global latest_right
    global latest_full_plate
    global latest_valid

    while not stop_event.is_set():
        with state_lock:
            if latest_frame is None:
                frame = None
            else:
                frame = latest_frame.copy()

        if frame is None:
            stop_event.wait(0.05)
            continue

        try:
            output = run_workflow(frame)

            if not output:
                stop_event.wait(
                    INFERENCE_INTERVAL_SECONDS
                )
                continue

            print(
                "Sorties reçues :",
                list(output.keys()),
            )

            predictions = extract_predictions(
                output
            )

            plate_items = extract_plate_items(
                output.get("plate_text")
            )

            annotated = draw_detections(
                frame,
                predictions,
            )

            left = ""
            letter = ""
            right = ""
            full_plate = ""
            valid = False

            if plate_items:
                # Nous traitons une seule plaque standard
                # visible à la fois.
                plate = plate_items[0]

                left = str(
                    plate.get(
                        "first_digits",
                        "",
                    )
                    or ""
                ).strip()

                letter = str(
                    plate.get(
                        "arabic_letter",
                        "",
                    )
                    or ""
                ).strip()

                right = str(
                    plate.get(
                        "last_digits",
                        "",
                    )
                    or ""
                ).strip()

                full_plate = str(
                    plate.get(
                        "full_plate",
                        "",
                    )
                    or ""
                ).strip()

                valid = bool(
                    plate.get(
                        "valid_format",
                        False,
                    )
                )

                print("\nRésultat OCR :")
                print(
                    "  Chiffres gauche :",
                    left or "?",
                )
                print(
                    "  Lettre arabe    :",
                    letter or "?",
                )
                print(
                    "  Chiffres droite :",
                    right or "?",
                )
                print(
                    "  Matricule       :",
                    full_plate or "?",
                )
                print(
                    "  Format valide   :",
                    valid,
                )

                if valid:
                    save_plate(plate)

            elif predictions:
                print(
                    "La plaque est détectée, mais "
                    "plate_text est vide."
                )

            annotated = draw_plate_panel(
                annotated,
                left,
                letter,
                right,
                valid,
            )

            if not predictions:
                status = "Aucune plaque détectée"

            elif not plate_items:
                status = "Plaque détectée - OCR vide"

            elif valid:
                status = (
                    f"Plaque valide : {full_plate}"
                )

            else:
                status = (
                    f"Lecture partielle : "
                    f"{left or '?'} | "
                    f"{letter or '?'} | "
                    f"{right or '?'}"
                )

            with state_lock:
                latest_annotated_frame = annotated

                latest_left = left
                latest_letter = letter
                latest_right = right
                latest_full_plate = full_plate
                latest_valid = valid

                latest_status = status
                latest_error = ""

        except Exception as error:
            print("\nErreur pendant l'analyse :")
            print(error)
            print(
                "Le programme continuera "
                "et réessaiera automatiquement."
            )

            with state_lock:
                latest_error = str(error)
                latest_status = (
                    "Erreur Cloud - nouvelle tentative"
                )

        stop_event.wait(
            INFERENCE_INTERVAL_SECONDS
        )


# ============================================================
# Barre de statut
# ============================================================

def draw_status_panel(
    frame: np.ndarray,
):
    display = frame.copy()

    with state_lock:
        status = latest_status
        error = latest_error

    overlay = display.copy()

    cv2.rectangle(
        overlay,
        (0, 0),
        (display.shape[1], 80),
        (0, 0, 0),
        -1,
    )

    display = cv2.addWeighted(
        overlay,
        0.65,
        display,
        0.35,
        0,
    )

    if error:
        color = (0, 0, 255)

    elif "plaque valide" in status.lower():
        color = (0, 255, 0)

    else:
        color = (0, 220, 255)

    # Le matricule arabe complet est déjà affiché
    # dans le panneau inférieur avec Pillow.
    safe_status = status.encode(
        "ascii",
        errors="replace",
    ).decode("ascii")

    cv2.putText(
        display,
        safe_status,
        (20, 35),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.70,
        color,
        2,
        cv2.LINE_AA,
    )

    cv2.putText(
        display,
        "Q: quitter | S: enregistrer une capture",
        (20, 67),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.50,
        (255, 255, 255),
        1,
        cv2.LINE_AA,
    )

    return display


# ============================================================
# Programme principal
# ============================================================

def main():
    global latest_frame

    initialize_csv()

    print("========================================")
    print("Lecteur de plaques marocaines")
    print("========================================")
    print("Mode      : Roboflow Cloud")
    print("Workspace :", WORKSPACE_NAME)
    print("Workflow  :", WORKFLOW_ID)
    print("Caméra    :", CAMERA_SOURCE)
    print("CSV       :", CSV_PATH.resolve())
    print("Q         : quitter")
    print("S         : enregistrer une capture")
    print("========================================")

    capture = cv2.VideoCapture(
        CAMERA_SOURCE
    )

    if not capture.isOpened():
        raise RuntimeError(
            f"Impossible d'ouvrir la caméra : "
            f"{CAMERA_SOURCE}"
        )

    # Demande une résolution 1280 × 720.
    capture.set(
        cv2.CAP_PROP_FRAME_WIDTH,
        1280,
    )

    capture.set(
        cv2.CAP_PROP_FRAME_HEIGHT,
        720,
    )

    actual_width = int(
        capture.get(cv2.CAP_PROP_FRAME_WIDTH)
    )

    actual_height = int(
        capture.get(cv2.CAP_PROP_FRAME_HEIGHT)
    )

    print(
        f"Résolution réelle : "
        f"{actual_width} × {actual_height}"
    )

    worker = threading.Thread(
        target=inference_worker,
        daemon=True,
    )

    worker.start()

    try:
        while not stop_event.is_set():
            success, frame = capture.read()

            if not success or frame is None:
                print(
                    "Impossible de lire une image "
                    "de la caméra."
                )
                break

            with state_lock:
                latest_frame = frame.copy()

                if latest_annotated_frame is not None:
                    display = (
                        latest_annotated_frame.copy()
                    )
                else:
                    display = frame.copy()

            display = draw_status_panel(
                display
            )

            cv2.imshow(
                WINDOW_NAME,
                display,
            )

            key = cv2.waitKey(1) & 0xFF

            if key == ord("q"):
                stop_event.set()
                break

            if key == ord("s"):
                filename = datetime.now().strftime(
                    "capture_%Y%m%d_%H%M%S.jpg"
                )

                cv2.imwrite(
                    filename,
                    frame,
                )

                print(
                    "Capture enregistrée :",
                    filename,
                )

    except KeyboardInterrupt:
        stop_event.set()

    finally:
        stop_event.set()

        capture.release()
        cv2.destroyAllWindows()

        worker.join(timeout=3)

        print("Programme arrêté.")


if __name__ == "__main__":
    main()
