import os
import cv2

from inference_sdk import InferenceHTTPClient, InferenceConfiguration
from inference_sdk.webrtc import WebcamSource, StreamConfig


API_KEY = os.environ["ROBOFLOW_API_KEY"]

WORKSPACE = "chaimaala"
WORKFLOW_ID = "lecture-plaques-remorques-maroc-1788177816517"


client = InferenceHTTPClient(
    api_url="https://serverless.roboflow.com",
    api_key=API_KEY,
).configure(
    InferenceConfiguration(api_key_transport="header")
)


session = client.webrtc.stream(
    source=WebcamSource(),
    workspace=WORKSPACE,
    workflow=WORKFLOW_ID,
    image_input="image",
    config=StreamConfig(
        # Image avec le rectangle autour de la plaque
        stream_output=["output_image"],

        # Résultats reçus sous forme de données
        data_output=["plate_text", "predictions"],
    ),
)


last_plate = None


@session.on_frame
def display_frame(frame, metadata):
    """Affiche le résultat annoté renvoyé par le Workflow."""
    cv2.imshow("Detection plaques remorques Maroc", frame)

    # Appuyez sur Q pour fermer l'application.
    if cv2.waitKey(1) & 0xFF == ord("q"):
        session.close()


@session.on_data("plate_text")
def receive_plate_text(value, metadata):
    """Reçoit le ou les numéros lus par GLM-OCR."""
    global last_plate

    # Le Workflow peut retourner une liste, puisqu'il peut détecter
    # plusieurs plaques dans une image.
    values = value if isinstance(value, list) else [value]

    for plate in values:
        if plate is None:
            continue

        plate = str(plate).strip()

        # Ignore les réponses vides et évite d'imprimer la même
        # plaque à chaque image.
        if plate and plate != last_plate:
            last_plate = plate
            print(
                f"Plaque détectée : {plate} "
                f"| image no {metadata.frame_id}"
            )

            # Ajoutez ici votre logique métier :
            # enregistrer_plaque(plate)
            # ouvrir_barriere()
            # envoyer_au_serveur(plate)


@session.on_data("predictions")
def receive_predictions(predictions, metadata):
    """Résultats bruts de localisation de la plaque."""
    if predictions:
        print(f"Détection présente sur l'image {metadata.frame_id}")


try:
    print("Démarrage de la caméra...")
    print("Présentez une plaque rouge devant la webcam.")
    print("Appuyez sur Q pour quitter.")
    session.run()
finally:
    cv2.destroyAllWindows()
