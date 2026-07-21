# Development of a Language Training System for Dysarthric Speakers

## Introduction

This repository contains code and documentation for the development of a **dysarthric speaker training system**, which has been carried out in the Applied AI program at South Westphalia University of Applied Sciences.

This README primarily contains overview information regarding the developed application.<br />
For a comprehensive theoretical background, as well as more detailed information on the applied concepts, please check our paper.<br />
You can download a full example exercise showcasing the application features [here](https://fh-swf.sciebo.de/s/ZwyiDodiErJk6AL).<br />
Questionnaires and persona overviews can be accessed [here](Docs).

For training and evaluation of trained phoneme recognition models, a separate README exists [here](model_training/README.md).

## License

The application itself is released under the MIT License (see [LICENSE](LICENSE)). Pretrained model checkpoints are **not** covered by the MIT License. They are subject to the respective licenses and terms of use of underlying datasets.

## About the Application

### Main Features

- **Exercise Management**: Therapists can create exercises with words, sentences, or phrases
- **Recording & Analysis**: Patients record themselves speaking and receive AI-based feedback
- **Progress Tracking**: Detailed pronunciation analysis with phoneme recognition
- **Session Management**: Exercise sessions are documented and can be analyzed afterward
- **Role System**: Different permissions for admins, therapists, and patients

### Technology Stack

**Frontend:**

- Vue 3.5 + TypeScript 5.8
- Vite 6.2 (build tool)
- TailwindCSS v4 (styling)
- PrimeVue v4 (UI components)
- Pinia (state management)

**Backend:**

- FastAPI (Python 3.13)
- PostgreSQL + TimescaleDB + pgvector
- Whisper (speech-to-text)
- Wav2Vec2/WavLM (phoneme recognition)

**Infrastructure:**

- Docker Compose
- Hot reload for development

## Getting Started

### Requirements

- Docker Desktop (Windows/Mac) or Docker + Docker Compose (Linux)
- Git
- Node.js (for npm commands)

### Installation

1. **Clone the repository:**

2. **Configure environment variables:**

```bash
cp .env.example .env
# Adjust .env as needed
```

💡 **Recommended starting point for a new installation**: A prepared snapshot `backups/snapshots/initial/` exists, already containing a migrated database including roles and test users (see "First Login") as well as example media files. This removes the need to run the seed scripts manually. Set the following in `.env`:

```bash
RESTORE_SNAPSHOT=initial
```

3. **Start the containers:**

```bash
docker compose up -d
```

If `RESTORE_SNAPSHOT=initial` is set, the snapshot will be restored automatically on the first start (see `compose.yml`, backend command). Otherwise, it can also be restored manually at any time:

```bash
npm run restore initial
```

The application is now available at:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **pgAdmin**: http://localhost:5050

### First Login

Test credentials (can be filled quickly in the login form using buttons, see `frontend/vue/src/pages/login/app-login.vue`):

- **Admin**: `admin@example.com` / `Admin123!`
- **Therapist**: `therapist@example.com` / `Therapist123!`
- **Patient**: `user@example.com` / `User123!`

✅ Verified: The buttons fill in exactly these credentials.
⚠️ **Important on a fresh/empty database**: These users are **not** created automatically. `docker compose up -d` only runs migrations; there is no automatic seed step. The easiest approach is to restore the `initial` snapshot as described above (`RESTORE_SNAPSHOT=initial` or `npm run restore initial`). Alternatively, the users can be created manually:

```bash
docker compose exec backend python scripts/seed_rbac.py
docker compose exec backend python scripts/seed_test_users.py
```

Alternatively, an existing backup with already created users can be restored (see the section "Backup & Restore").

### Basic Workflows

**As a therapist:**

1. After login -> **Dashboard** -> "Neue Übung"
2. Create an exercise with a name, category, and exercise items
3. Add items (words/sentences + optional audio file)
4. Save the exercise and release it for patients

**As a patient:**

1. After login -> **Übungen**
2. Start an exercise -> grant microphone permission
3. Record the exercise items one by one
4. Finish the session and view the results

⚠️ **Verified limitation**: This workflow applies fully only to the `/exercise-practice` route (reachable, for example, via **Übungen**/**Übungsauswahl**). The "Weiter üben" button in the dashboard instead navigates to the new, still unfinished `/exercise-practice-revised` route, which currently **always shows a fixed mock exercise** and **does not save or analyze recordings**. Details are given in the last section of this document.

## Backup & Restore

The system offers a cross-platform backup solution (Windows/Mac/Linux).

### Create a Backup

```bash
# Automatically named backup (with timestamp)
npm run backup

# Named backup
npm run backup production_backup
```

This creates a snapshot with:

- Database dump (compressed)
- All media files
- Metadata (timestamp, file sizes)

Backups are stored in: `backups/snapshots/<name>/`

### Restore a Backup

```bash
# Show available snapshots
npm run restore

# Restore a specific snapshot
npm run restore production_backup
```

⚠️ **Warning**: Restore overwrites the current database and media files!

### Automatic Restore

For automatic restore on startup, add this to `.env`:

```bash
RESTORE_SNAPSHOT=production_backup
```

📌 **`initial` snapshot**: `backups/snapshots/initial/` is a deliberately named/renamed snapshot intended as the starting point for new installations (migrated database + roles + test users + sample media). For a fresh installation, use `RESTORE_SNAPSHOT=initial` or run `npm run restore initial` (see the "Installation" section above).

Detailed documentation: `backups/CROSS_PLATFORM_GUIDE.md`

## Development

### Backend

All backend commands run inside the Docker container:

```bash
# Apply migrations
docker compose exec backend alembic upgrade head

# Create a new migration
docker compose exec backend alembic revision --autogenerate -m "description"

# Run tests
docker compose exec backend pytest tests/ -v

# Restart the backend
docker compose restart backend

# Show logs
docker compose logs -f backend
```

### Frontend

```bash
cd frontend/vue

# Install dependencies
npm install

# Development server (already running in Docker)
npm run dev

# Tests
npm run test:unit              # Unit tests
npm run test:e2e               # End-to-end tests

# Production build
npm run build
```

## Frontend Notes

**Technology**

- Vue3 https://vuejs.org/
  - Frontend framework
- Tailwindcss https://tailwindcss.com/
  - CSS framework
- Primevue https://primevue.org/
  - Web components

## ⚠️ Known State: Frontend Refactor for Exercise Execution

There are currently **two parallel implementations** in the frontend for patients performing speech exercises:

| Route | File | Status |
| --- | --- | --- |
| `/exercise-practice` | `frontend/vue/src/pages/exercise-practice/app-exercise-practice.vue` | Production, fully integrated |
| `/exercise-practice-revised` | `frontend/vue/src/pages/exercise-practice-revised/app-exercise-practice-revised.vue` | New UI refactor, **not fully integrated** |

The "revised" page introduces a redesigned UI (instruction/content structure, collapsible panels, separate `AudioPlayer` and `VideoPlayer` components for phases 2/3 of the planned exercise presentation). It does reuse components and composables from the old page (`MicrophoneSettingsDialog`, `RecordingStatusDisplay`, `useAudioRecorder`, `useAudioDevices`, `useAudioQuality`), but it does not wire them fully into the rest of the application logic. The following concrete gaps exist in the code:

1. **No real exercise loading** – `app-exercise-practice-revised.vue` imports only a fixed mock file (`./uebungseinheit-01-transformed.json`) via `loadMockData()` in `onMounted()`. There is no call to an exercise service/API that resolves the exercise ID passed via the route. Every use of the page therefore always shows **the same sample exercise**, regardless of which exercise was actually meant to start.
2. **Dead path in the dashboard** – `app-dashboard.vue` (`handleContinueTraining`) correctly loads the next exercise for the patient via `exercisesApi.getFirstExercise()`, but then navigates to `/exercise-practice-revised` **without passing the resolved exercise ID**. Since the target page only loads mock data anyway, the real exercise assignment is completely lost here - the "Weiter üben" button effectively does not lead to the correct exercise.
3. **No session persistence** – unlike the old page (which uses the `practiceSession` store, including `completeSession()`/`abandonSession()`), `app-exercise-practice-revised.vue` contains **no reference whatsoever** to `practiceSession`. Recordings are kept only locally in the browser; there is no mechanism to send them to the backend when the session ends or the page is left.
4. **No live analysis** – the old page connects to the backend analysis WebSocket in `onMounted()` via `audioStreaming.connect()`. This call is completely missing from the revised page, so no AI-based phoneme/pronunciation analysis takes place.
5. **Dead UI indicator** – `useAudioQuality()` is instantiated and `audioQuality.metrics` is bound to the `AudioQualityIndicator` component, but `updateMetrics()` is never called. The display for signal-to-noise ratio, volume, and clipping therefore remains empty at all times.

**Assessment**: In its current state, the "revised" page is a **UI prototype** for the new exercise presentation (including video support), but not a functional replacement implementation for the therapy workflow.
