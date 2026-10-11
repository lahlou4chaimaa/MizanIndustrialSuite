import os

import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("ROBOFLOW_API_KEY", "").strip()

if not api_key:
    raise RuntimeError("ROBOFLOW_API_KEY absente du fichier .env")

url = (
    "https://api.roboflow.com/chaimaala/agent/workflows/"
    "moroccan-license-plate-ocr-1788096205153/publish"
)

response = requests.post(
    url,
    params={"api_key": api_key},
    timeout=60,
)

if response.status_code == 400:
    print(
        "Aucun brouillon à publier, ou la dernière version "
        "est déjà publiée."
    )
    print(response.text)
else:
    response.raise_for_status()
    print("Workflow publié avec succès :")
    print(response.json())
