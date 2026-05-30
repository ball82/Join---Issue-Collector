# Join – KI-gestütztes Kanban Task Management

Eine moderne, responsive Task-Management-Anwendung auf Basis von Vanilla JavaScript, HTML5 und CSS3. Join hilft Teams, ihren Workflow mit einem intuitiven Kanban-Board, Kontaktverwaltung und Echtzeit-Kollaboration zu organisieren.

Das Projekt wurde um einen **KI-gestützten Issue Collector** erweitert: Stakeholder können Feature Requests und Bug-Meldungen per E-Mail einreichen. Die KI analysiert jede E-Mail automatisch, bestimmt Kategorie, Priorität und Deadline und legt das Ticket direkt im Board an.

---

## Inhaltsverzeichnis

- [Funktionen](#funktionen)
- [KI-gestützter Issue Collector](#ki-gestützter-issue-collector)
- [Tech Stack](#tech-stack)
- [Demo-Anleitung](#demo-anleitung)
- [Setup](#setup)
- [Projektstruktur](#projektstruktur)
- [Entwicklungsrichtlinien](#entwicklungsrichtlinien)
- [Team](#team)

---

## Funktionen

### Kanban-Board
- **Triage-Spalte** – Backlog für neu eingehende Tickets (manuell und per KI)
- **Drag & Drop** – Aufgaben zwischen Spalten verschieben (To Do, In Progress, Await Feedback, Done)
- **Status-Benachrichtigung** – Ersteller wird per E-Mail informiert, wenn sich der Status ändert
- **Ersteller-Anzeige** – Jedes Ticket zeigt den Ersteller mit intern/extern-Badge
- **Suche & Filter** – Echtzeit-Suche über alle Spalten

### Aufgabenverwaltung
- **Aufgaben anlegen** – Titel, Beschreibung, Fälligkeitsdatum, Priorität und Bearbeiter
- **Unteraufgaben** – Aufgaben in kleinere, nachverfolgbare Schritte aufteilen
- **Prioritätsstufen** – Urgent, Medium und Low mit farbigen Indikatoren
- **Mobile Support** – Responsives Design mit mobilem Verschiebe-Menü

### Kontaktverwaltung
- Kontakte anlegen, bearbeiten, löschen
- Kontakte als Aufgaben-Bearbeiter zuweisen

### Dashboard & Übersicht
- KPI-Karten mit Aufgaben nach Status
- Nächste dringende Deadline
- Personalisierte Begrüßung

### Benutzerverwaltung
- Firebase Authentication (Login, Registrierung)
- Gast-Login für schnellen Zugang
- Benutzerprofil mit Namensanzeige
- Welcome-Overlay beim Start (Rollen-Weiche: Stakeholder vs. Teammitglied)

---

## KI-gestützter Issue Collector

### Überblick

Stakeholder können Feature Requests und Bug-Meldungen per E-Mail an ein dediziertes Postfach senden. Ein n8n-Workflow empfängt die Mail, lässt sie von einer KI (Groq / Llama 3.3) analysieren und legt automatisch ein Ticket in der Triage-Spalte des Boards an.

```
E-Mail einreichen
      │
      ▼
n8n: Tageslimit prüfen (max. 10/Tag – Kostenairbag)
      │ Limit erreicht → Hinweismail an Absender → STOP
      │ Noch Platz ↓
      ▼
Groq KI analysiert: Titel · Kategorie · Priorität · Deadline
      │
      ▼
Ticket in Firebase anlegen (Status: Triage, Ersteller: extern)
      │
      ▼
Bestätigungsmail an Absender
      │
      ▼
Bei Statuswechsel im Board → E-Mail-Benachrichtigung an Ersteller
```

### Features des Issue Collectors

- **Automatische Kategorisierung** – Bug vs. User Story / Feature Request
- **Intelligente Priorisierung** – erkennt deutsche und englische Dringlichkeitswörter (dringend, sehr wichtig, urgent, asap …)
- **Deadline-Extraktion** – erkennt relative Angaben wie „bis Ende Monat" oder „bis am 15. Juli"
- **Mehrsprachig** – Titel und Beschreibung bleiben in der Sprache der eingereichten E-Mail
- **KI-Hinweis** – Jedes automatisch erzeugte Ticket trägt den Vermerk „Dieses Ticket wurde KI-generiert"
- **Kostenairbag** – maximal 10 Tickets pro Tag; KI wird erst nach dem Limit-Check aufgerufen
- **Fehlerpfad** – bei Verarbeitungsproblemen landet die Mail in einem separaten Ordner und der Absender bekommt eine Rückmeldung
- **Status-Benachrichtigung** – der Ersteller wird per n8n-Webhook informiert, wenn sein Ticket verschoben wird
- **Stakeholder-Landing-Page** – erklärt den Prozess, zeigt die E-Mail-Adresse und das Tageslimit

### n8n-Workflows

Die Workflows liegen als exportierte JSON-Dateien im Ordner `n8n/` und können direkt in jede n8n-Installation importiert werden:

| Datei | Beschreibung |
|---|---|
| `n8n/join_issue_collector.json` | Haupt-Workflow: E-Mail empfangen → KI-Analyse → Ticket anlegen |
| `n8n/join_status_notification.json` | Webhook-Workflow: Status-Benachrichtigung bei Spaltenwechsel |

> **Hinweis:** Die Workflows enthalten keine Zugangsdaten (API-Keys, SMTP-Passwörter). Diese werden nach dem Import in n8n als Credentials hinterlegt.

---

## Tech Stack

### Frontend
- **HTML5** – Semantisches Markup
- **CSS3** – Flexbox/Grid, CSS-Variablen
- **JavaScript (ES6+)** – Modulares Vanilla JavaScript, kein Framework

### Backend & Datenbank
- **Firebase Realtime Database** – Echtzeit-Datensynchronisation
- **Firebase Authentication** – Benutzerverwaltung

### KI & Automatisierung
- **n8n** – Workflow-Automatisierung (selbst gehostet via Docker)
- **Groq API** – KI-Analyse (Llama 3.3-70b), kostenfreier Tier
- **IMAP/SMTP** – E-Mail-Empfang und -Versand

### Architektur
- **Modulares Design** – JavaScript-Module, je ≤ 400 Zeilen
- **Clean Code** – camelCase, englische Kommentare, JSDoc für komplexe Module
- **Responsiv** – Mobile-first (320 px – 1920 px)

---

## Demo-Anleitung

### Als Stakeholder einen Feature Request einreichen

1. Öffne die Anwendung und wähle im Welcome-Overlay **„Create request"** – du landest auf der Landing Page.
2. Schick eine formlose E-Mail an das Postfach (Adresse auf der Landing Page).
3. Schreibe auf Deutsch oder Englisch, was du dir wünschst. Erwähne optional eine Deadline (z. B. „bis Ende Monat") oder Dringlichkeit (z. B. „sehr wichtig", „dringend").
4. Innerhalb kurzer Zeit erhältst du eine Bestätigungsmail.
5. Das Ticket erscheint automatisch in der **Triage-Spalte** des Boards – mit korrektem Titel, Priorität und Deadline.

> Das Tageslimit beträgt **10 Anfragen pro Tag**. Bei Überschreitung erhältst du eine automatische Rückmeldung.

### Als Teammitglied das Board erkunden

1. Öffne die Anwendung und wähle **„Member log in"**.
2. Logge dich ein oder nutze den Gast-Zugang.
3. Im Board siehst du alle Tickets, inklusive der KI-generierten in der Triage-Spalte.
4. Verschiebe ein Ticket mit externem Ersteller in eine andere Spalte – der Ersteller erhält eine automatische Status-Benachrichtigung per E-Mail.

---

## Setup

### Voraussetzungen
- Moderner Browser (Chrome, Firefox, Safari, Edge)
- Internetverbindung für Firebase
- n8n (selbst gehostet, z. B. via Docker) für den Issue Collector
- Groq-API-Key (kostenlos unter [console.groq.com](https://console.groq.com))

### Installation

1. **Repository klonen**
   ```bash
   git clone https://github.com/ball82/Join---Issue-Collector.git
   cd Join---Issue-Collector
   ```

2. **Firebase konfigurieren**

   Firebase-Credentials in `scripts/config.js` eintragen (eigenes Firebase-Projekt empfohlen):
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     databaseURL: "YOUR_DATABASE_URL",
     // ...
   };
   ```

3. **Anwendung starten**
   ```bash
   # Empfohlen: lokaler Server
   python3 -m http.server 8000
   # dann http://localhost:8000 öffnen
   ```

4. **n8n-Workflows importieren**
   - n8n starten (Docker: `docker run -d --name n8n --restart unless-stopped -p 5678:5678 -v n8n_data:/home/node/.n8n -e N8N_SECURE_COOKIE=false n8nio/n8n:latest`)
   - In n8n: **Import from File** → `n8n/join_issue_collector.json` und `n8n/join_status_notification.json`
   - Credentials hinterlegen: Groq-Key (Header Auth), SMTP, IMAP
   - Webhook-URL aus dem Status-Notification-Workflow in `scripts/tasks_API.js` eintragen (`STATUS_WEBHOOK_URL`)
   - Beide Workflows über den **Active-Schalter** aktivieren

5. **Landing Page**

   In `landing.html` die E-Mail-Adresse des dedizierten Postfachs eintragen (Suche nach `YOUR-ADDRESS@example.com`).

---

## Projektstruktur

```
Join---Issue-Collector/
├── index.html                  # Login-Seite mit Welcome-Overlay (Rollen-Weiche)
├── landing.html                # Stakeholder-Landing-Page
├── board.html                  # Kanban-Board
├── add_task.html               # Aufgabe anlegen
├── summary.html                # Dashboard
├── contacts.html               # Kontaktverwaltung
├── css/
│   ├── style.css               # Globale Styles
│   ├── board.css               # Board + Ersteller-Badge-Styles
│   ├── landing.css             # Landing-Page-Styles
│   ├── welcome_overlay.css     # Welcome-Overlay-Styles
│   └── ...
├── scripts/
│   ├── config.js               # Firebase-Konfiguration (⚠ nicht committen)
│   ├── tasks_API.js            # Task-CRUD + Status-Webhook-Aufruf
│   ├── board.js                # Board-Logik, Spalten, Drag & Drop
│   ├── task_form.js            # Formular-Logik (Default: Triage-Spalte)
│   ├── task_templates_detail.js # Detail-Overlay inkl. Ersteller-Anzeige
│   ├── welcome_overlay.js      # Rollen-Weiche beim Login
│   └── ...
├── n8n/
│   ├── join_issue_collector.json       # n8n-Workflow: Issue Collector
│   └── join_status_notification.json  # n8n-Workflow: Status-Benachrichtigung
├── img/
└── templates/
```

---

## Entwicklungsrichtlinien

- **Max. 400 Zeilen** pro JavaScript-Datei
- **camelCase** für Variablen und Funktionen, **UPPER_CASE** für Konstanten
- **Englische Kommentare**, JSDoc für komplexe Funktionen
- **Kein `console.log`** in Produktion (nur `console.error`)
- **Keine Inline-Scripts/-Styles** in HTML
- **Secrets nie committen** – `scripts/config.js`, API-Keys und SMTP-Passwörter bleiben lokal

---

## Sicherheitshinweise

- Firebase-Credentials (`scripts/config.js`) sind in `.gitignore` aufgeführt und dürfen nicht ins Repo
- n8n-Credentials (Groq-Key, SMTP-Passwort, IMAP-Passwort) werden ausschließlich in n8n hinterlegt und sind nicht in den exportierten Workflow-JSONs enthalten
- Der Kostenairbag (10 Anfragen/Tag) schützt vor unerwartet hohen KI-API-Kosten

---

## Team

Dieses Projekt wurde entwickelt von:

- **Joannis Ballos** – Entwickler (Issue Collector, n8n-Integration, Board-Erweiterungen)
- **Raphael Neuberger** – Entwickler (ursprüngliches Join-Kanban-Board)

---

## Lizenz

Dieses Projekt ist Teil des Developer Akademie Frontend-Moduls.

---

**Version:** 2.0.0 – Issue Collector Edition
**Letzte Aktualisierung:** Mai 2026
