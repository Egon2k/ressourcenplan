# Ressourcenplan

Web-App zur Verwaltung von Mitarbeiterzuordnungen auf Projekte mit monatlicher Auslastungsplanung.

---

## Für Anwender

### Schnellstart (ohne Installation)

1. Datei `dist/index.html` herunterladen
2. Per Doppelklick im Browser öffnen – fertig

Kein Server, kein Node.js, keine Installation notwendig.

> **Daten** werden im `localStorage` des Browsers gespeichert. Immer denselben Browser verwenden, damit die Daten erhalten bleiben. Für Backups den CSV-Export nutzen.

---

### Bedienung

#### Mitarbeiter

Unter **Mitarbeiter** können Sie Mitarbeiter anlegen, bearbeiten und löschen.  
Jeder Mitarbeiter hat einen Namen und optional eine Rolle/Position.

#### Projekte

Unter **Projekte** können Sie Projekte anlegen, bearbeiten und löschen.  
Jedes Projekt hat:
- **Name**
- **Projektleiter** (Freitext, muss kein Mitarbeiter in der App sein)
- **Kategorie**: `ES-DEV`, `Simplify` oder `Research`

#### Zuordnungen

Über den **Detail**-Link eines Projekts gelangen Sie zur Projektdetailansicht.  
Dort können Sie Mitarbeiter dem Projekt zuordnen und deren monatliche Auslastung (in Prozent) eintragen.

- Klick auf **+ Mitarbeiter zuordnen** öffnet eine durchsuchbare Liste aller noch nicht zugeordneten Mitarbeiter
- In der Tabelle können Sie für jeden Monat einen Prozentwert (0–100) eintragen
- Mit dem Jahresumschalter (← JJJJ →) wechseln Sie zwischen den Jahren
- Die Spalte **Ø** zeigt den Jahresdurchschnitt (Summe aller Monatswerte ÷ 12)

#### Übersicht

Die Übersichtsseite zeigt:
- **Oben**: Gesamtauslastung je Mitarbeiter über alle Monate des gewählten Jahres  
  – Grün = ≤ 100 %, Rot = überlastet
- **Darunter**: Auslastung je Projekt mit allen zugeordneten Mitarbeitern

Mit dem Jahresumschalter oben rechts wechseln Sie das angezeigte Jahr.

---

### Export / Import

Unter **Export / Import** gibt es drei getrennte Bereiche:

| Bereich | Exportdatei | Spalten |
|---|---|---|
| Mitarbeiter | `mitarbeiter.csv` | Name; Rolle |
| Projekte | `projekte.csv` | Name; Projektleiter; Kategorie |
| Zuordnungen | `ressourcenplan.csv` | Mitarbeiter; Projekt; JJJJ-MM; … |

- **Export**: Klick auf „Exportieren" lädt die CSV-Datei herunter
- **Import**: CSV-Datei auswählen → Vorschau prüfen → „Importieren" klicken  
  Bestehende Daten werden nicht gelöscht, sondern zusammengeführt

> **Hinweis**: Die CSV-Dateien verwenden `;` als Trennzeichen und UTF-8-Kodierung mit BOM – dadurch öffnet Excel Umlaute korrekt.

---

## Für Entwickler

### Technologie-Stack

| | |
|---|---|
| Framework | React 18 |
| Build-Tool | Vite 6 |
| Routing | React Router 6 (HashRouter) |
| Persistenz | `localStorage` (kein Backend) |
| Styling | Plain CSS |
| Single-File-Build | `vite-plugin-singlefile` |

### Projektstruktur

```
src/
├── main.jsx              # Einstiegspunkt, HashRouter
├── App.jsx               # Routing, Navigation
├── store.js              # localStorage-Hooks + Datenmigration
├── index.css             # Globales CSS
└── pages/
    ├── Overview.jsx       # Jahresübersicht (Mitarbeiter × Monate)
    ├── Employees.jsx      # Mitarbeiter CRUD
    ├── Projects.jsx       # Projekte CRUD + CategoryBadge-Komponente
    ├── ProjectDetail.jsx  # Monatliche Zuordnungsmatrix
    └── ImportExport.jsx   # CSV Export/Import (3 Bereiche)
```

### Datenmodell (localStorage)

```js
// rp_employees
[{ id, name, role }]

// rp_projects
[{ id, name, leader, category }]  // category: 'ES-DEV' | 'Simplify' | 'Research' | ''

// rp_assignments
[{ id, projectId, employeeId, months: { "2026-01": 50, "2026-06": 80 } }]
```

### Lokale Entwicklung

```bash
git clone https://github.com/Egon2k/ressourcenplan
cd ressourcenplan
git checkout claude/gracious-meitner-x2f44a
npm install
npm run dev        # Entwicklungsserver auf http://localhost:5173
```

### Build (Single-File HTML)

```bash
npm run build      # erzeugt dist/index.html (alles inline)
```

Die erzeugte `dist/index.html` enthält JS und CSS vollständig inline und kann ohne Server direkt im Browser geöffnet werden (`file://`-Protokoll).

### Neue Projektkategorie hinzufügen

In `src/pages/Projects.jsx`:

```js
const CATEGORIES = ['ES-DEV', 'Simplify', 'Research', 'NeueKategorie']

const CATEGORY_STYLE = {
  // ...
  'NeueKategorie': { background: '#faf5ff', color: '#553c9a' },
}
```

### Datenmigration

`store.js` enthält eine automatische Migration: Alte Zuordnungen im Format `{ percentage: 50 }` werden beim ersten Start in das neue Format `{ months: { "JJJJ-MM": 50 } }` umgewandelt.
