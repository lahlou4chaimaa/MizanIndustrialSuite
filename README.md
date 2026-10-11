# MIZAN Industrial Suite
### Smart Industrial Weighing, OCR Recognition & Fleet Management

MIZAN Industrial Suite is a web-based industrial weighing management system designed to digitize and streamline truck weighing operations. It combines a centralized web platform, a backend REST API, a PostgreSQL database, OCR-assisted vehicle identification, QR-code ticket generation, and a mobile PDA interface for operational workflows.

The project was developed in the context of an industrial digitalization project focused on improving traceability, reducing manual data entry, and centralizing weighing operations.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Core Modules](#core-modules)
- [Weighing Workflow](#weighing-workflow)
- [OCR Recognition Pipeline](#ocr-recognition-pipeline)
- [Database Design](#database-design)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation and Setup](#installation-and-setup)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [API Overview](#api-overview)
- [Security and Data Protection](#security-and-data-protection)
- [Future Improvements](#future-improvements)
- [Author](#author)

---

## Overview

Industrial weighing operations require accurate vehicle identification, reliable weight recording, and traceable transaction management.

MIZAN aims to centralize these processes in a single application. It connects weighing operations with truck and driver information, service authorizations, digital tickets, and operational monitoring.

The system is organized into three main components:

- **Web application:** provides an interface for managing and monitoring weighing operations.
- **Backend API:** implements business rules, validates requests, and coordinates database operations.
- **PDA mobile application:** supports field operations and mobile workflows.

OCR and QR-code technologies help reduce manual input and facilitate the identification and tracking of operational records.

## Key Features

### Industrial Weighing Management
- Recording vehicle entry and exit weights.
- Managing gross weight, tare weight, and net weight.
- Linking weighing records to trucks, drivers, goods, and services.
- Tracking weighing operations throughout their lifecycle.
- Maintaining a history of weighing transactions.

### Vehicle Identification with OCR
- Capturing or uploading vehicle registration plate images.
- Detecting and recognizing license plates using a trained computer vision workflow.
- Processing recognition results for Moroccan license plate formats.
- Normalizing OCR output before using it in vehicle identification workflows.
- Supporting tractor and trailer plate recognition.

### Service and Authorization Management
- Associating vehicles with industrial services or prestations.
- Managing vehicle authorization records.
- Checking whether a vehicle is authorized for a service.
- Linking weighing operations to the relevant service when applicable.

### Digital Tickets and QR Codes
- Generating QR codes associated with weighing tickets.
- Producing PDF weighing tickets.
- Connecting ticket records to weighing operations.
- Supporting traceability through ticket identifiers and QR-code data.

### Driver Management
- Managing driver information.
- Supporting driver identification and QR-code-related workflows.
- Associating drivers with vehicles and weighing operations.

### Operational Dashboard
- Displaying weighing activity and operational information.
- Monitoring entry and exit operations.
- Refreshing dashboard data and integrating real-time events where configured.

### PDA Mobile Application
- Providing a mobile interface for field operations.
- Supporting QR-code scanning and service lookup workflows.
- Communicating with the backend API.
- Supporting mobile access to relevant weighing and authorization information.

---

## System Architecture

MIZAN follows a client-server architecture with a relational database.

```text
+------------------------+
|    Web Frontend        |
| React / JavaScript     |
+-----------+------------+
            |
            | HTTP / REST API
            |
+-----------v------------+
|     Backend API        |
| Node.js / Express      |
| Business Logic         |
| Authentication         |
| Weighing Operations    |
+-----------+------------+
            |
            | Sequelize ORM
            |
+-----------v------------+
|      PostgreSQL        |
| Relational Database    |
+------------------------+

+------------------------+
|     PDA Mobile App     |
| React Native / Expo    |
+-----------+------------+
            |
            | HTTP / API
            |
            +-----------> Backend API

+------------------------+
|    OCR Service         |
| Computer Vision        |
| License Plate Workflow |
+-----------+------------+
            |
            +-----------> Backend Integration

Backend services also handle QR-code generation,
PDF ticket generation, and real-time events where configured.
```

The backend centralizes business validation and database access. The frontend and PDA communicate with it through API endpoints instead of directly accessing the database.

The OCR component assists with plate recognition, while the backend remains responsible for validating and associating recognized information with application records.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, JavaScript, Vite |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| ORM | Sequelize |
| Mobile | React Native, Expo |
| Computer Vision / OCR | Roboflow workflows, license plate recognition |
| Digital Tickets | QR-code generation, PDF generation |
| Real-Time Communication | Socket.IO |
| API Testing | Postman or equivalent API testing tools |
| Development Tools | Visual Studio Code, Git, GitHub |

*The exact libraries, versions, OCR deployment method, and available features may vary according to the current project configuration.*

---

## Core Modules

### 1. Weighing Management

The weighing module manages entry and exit measurements and associates them with the relevant vehicle and operational records.

The main data includes:
- Entry weight.
- Exit weight.
- Net weight.
- Vehicle identification.
- Associated service and driver, when applicable.
- Ticket and weighing status.

The net weight is generally calculated as:

**Net Weight = Gross Weight − Tare Weight**

The exact meaning of gross and tare depends on the order in which the vehicle is weighed and the operational rules applied.

### 2. Vehicle and Driver Management

This module centralizes vehicle and driver information, allowing the system to associate weighing transactions with the relevant operational entities.

It also supports vehicle identification based on registration plate information.

### 3. Service Authorization

The authorization module links services to eligible vehicles and supports validation before an operation proceeds.

Authorization rules are handled by the backend to maintain consistent business logic.

### 4. OCR Integration

The OCR integration helps identify vehicle registration plates from images. The recognized text can then be normalized and used to search for the corresponding vehicle.

OCR output should be treated as a recognition result, not as unquestionable ground truth. Validation is important when recognition is uncertain.

### 5. Ticket Management

The ticket module associates digital tickets with weighing operations and can generate a QR code and a PDF document for traceability.

### 6. PDA Operations

The PDA application provides a mobile interface for field workflows, including QR-code scanning and communication with the backend.

---

## Weighing Workflow

A typical weighing workflow follows these stages:

1. **Vehicle identification:** the vehicle's registration plate is entered manually or identified with OCR.
2. **Authorization verification:** the backend checks the relevant service and vehicle authorization when required.
3. **Entry weighing:** the initial weight is recorded.
4. **Record creation:** the backend associates the weighing operation with the relevant entities and creates the corresponding records.
5. **Ticket generation:** a digital ticket and QR code can be generated for the operation.
6. **Exit weighing:** the second weight is recorded.
7. **Net weight calculation:** the system derives the net weight according to the weighing sequence.
8. **Traceability:** the weighing record and associated ticket can be consulted for operational tracking.

The exact sequence may vary according to the weighing mode and the configured business rules.

---

## OCR Recognition Pipeline

The OCR workflow is designed to reduce manual vehicle plate entry.

```text
Vehicle Plate Image
        |
        v
Image Submission
        |
        v
OCR / Plate Recognition Workflow
        |
        v
Recognized Text
        |
        v
Text Normalization
        |
        v
Vehicle Lookup
        |
        v
Validation and Weighing Workflow
```

The recognition workflow is intended to handle Moroccan license plate formats, including Arabic characters and numeric components.

Normalization helps standardize recognition output before database lookup. It does not replace validation of the detected registration number.

The project integrates plate-recognition workflows for tractors and trailers. Recognition accuracy depends on image quality, plate visibility, and the trained model or workflow.

---

## Database Design

MIZAN uses PostgreSQL to store structured operational data.

The principal entities include:

| Entity | Purpose |
|---|---|
| `utilisateurs` | Application users and account information |
| `chauffeurs` | Driver information |
| `camions` | Vehicle information |
| `prestations` | Industrial services or operational assignments |
| `prestation_autorisations` | Authorization relationships between services and eligible entities |
| `pesees` | Weighing operations and weight records |
| `tickets` | Digital ticket information |
| `marchandises` | Goods associated with weighing operations |

Sequelize is used as the Object-Relational Mapping (ORM) layer to represent database entities in JavaScript and manage database interactions.

The backend is responsible for enforcing application rules and maintaining relationships between records.

---

## Project Structure

The repository is organized around the principal application components:

```text
MizanIndustrialSuite/
├── mizan-backend/
│   ├── server.js
│   ├── package.json
│   ├── src/
│   │   ├── models/
│   │   ├── routes/
│   │   └── ...
│   ├── uploads/
│   └── ...
│
├── mizan-frontend/
│   ├── package.json
│   ├── src/
│   ├── public/
│   └── ...
│
├── mizan-pda-mobile/
│   ├── package.json
│   ├── App.js
│   └── ...
│
├── .gitignore
└── README.md
```

The tree above is a simplified overview. Consult the actual repository for the complete file structure.

---

## Prerequisites

Install the following tools before running the application:

- Node.js and npm.
- PostgreSQL.
- Git.
- A code editor such as Visual Studio Code.
- Expo Go or an appropriate mobile development environment for the PDA application.

Additional configuration may be required for the OCR service, image uploads, PDF generation, and any external integrations.

---

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/lahlou4chaimaa/MizanIndustrialSuite.git
cd MizanIndustrialSuite
```

### 2. Configure PostgreSQL

Create a PostgreSQL database for the project, for example:

```sql
CREATE DATABASE mizan_db;
```

Configure the database connection using the backend's environment variables or the configuration mechanism already implemented in the project.

Do not commit database passwords or production credentials.

### 3. Install backend dependencies

```bash
cd mizan-backend
npm install
```

Configure the required environment variables before starting the backend.

### 4. Install frontend dependencies

Open another terminal:

```bash
cd mizan-frontend
npm install
```

Configure the API base URL to point to the running backend.

### 5. Install PDA dependencies

Open another terminal:

```bash
cd mizan-pda-mobile
npm install
```

Configure the API URL for the device or emulator. When testing on a physical device, the backend must be reachable over the local network, and the device must use the computer's reachable IP address rather than `localhost`.

---

## Environment Configuration

Create local environment files according to the requirements of each application component.

Typical settings may include:

```env
# Example placeholders only
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mizan_db
DB_USER=your_database_user
DB_PASSWORD=your_database_password
```

These variables are illustrative. Use the actual variable names expected by the project's backend configuration.

For local development, configure the frontend and PDA API URLs to reach the backend. Configure the OCR service URL and credentials separately if required.

**Never publish real passwords, API keys, access tokens, private credentials, or production `.env` files.**

---

## Running the Application

### Backend

From `mizan-backend`:

```bash
npm start
```

Use `npm run` to inspect the scripts available in `package.json` if the `start` script is not defined.

### Frontend

From `mizan-frontend`:

```bash
npm run dev
```

Vite will display the local URL in the terminal.

### PDA Mobile Application

From `mizan-pda-mobile`:

```bash
npx expo start
```

Follow the Expo instructions to run the app on a device or emulator.

### OCR Service

Start the OCR component using the deployment method and configuration currently used by the project. Configure its endpoint and credentials before testing plate recognition.

These commands describe the typical development workflow. Actual scripts, environment variables, ports, and service startup requirements must match the current repository configuration.

---

## API Overview

The backend exposes REST endpoints for application operations.

The main route groups include:

| Route group | Responsibility |
|---|---|
| `/api/auth` | Authentication-related operations |
| `/api/pesee` | Weighing entry, exit, and related operations |
| `/api/ticket` | Ticket management |
| `/api/marchandise` | Goods management |
| `/api/chauffeur` | Driver management |
| `/api/camion` | Vehicle management |
| `/api/prestation` | Service management |
| `/api/prestation-autorisations` | Authorization validation and management |

The exact endpoints, HTTP methods, request bodies, and authentication requirements should be verified in the backend route definitions.

The backend handles validation and coordinates persistence through Sequelize and PostgreSQL.

---

## Security and Data Protection

Security considerations for MIZAN include:

- Keeping credentials and API tokens outside version control.
- Validating incoming API requests.
- Enforcing authorization rules in the backend.
- Restricting database access to trusted application components.
- Validating uploaded files and controlling upload access.
- Avoiding exposure of sensitive operational information in logs.
- Using HTTPS and appropriate access controls in production.

OCR recognition results should be validated before they are used in important operational decisions.

---

## Future Improvements

Potential areas for further development include:

- More comprehensive automated tests.
- Improved OCR confidence handling and manual correction workflows.
- More detailed audit logs and operational reporting.
- Stronger role-based access control.
- Expanded real-time monitoring.
- Improved mobile error handling and offline resilience.
- Deployment automation and production monitoring.
- Technical documentation for all API endpoints.

These items are potential improvements and should not be interpreted as already implemented features.

---

## Author

**Chaimaa Lahlou**

Computer Science and Network Engineering Student  
École Marocaine des Sciences de l'Ingénieur (EMSI), Casablanca, Morocco

**GitHub:** [@lahlou4chaimaa](https://github.com/lahlou4chaimaa)

---

## Project

**MIZAN Industrial Suite**  
Industrial Weighing Management · OCR-Assisted Vehicle Identification · Digital Traceability

This project explores how software engineering, computer vision, database management, and mobile interfaces can be combined to support industrial digitalization.
