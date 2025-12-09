# Campus Dual Automation Script

Dieses Projekt automatisiert Abfragen an den Campus Dual Self-Service. Aufgrund einer fehlerhaften SSL-Konfiguration des Servers (fehlende Intermediate-Zertifikate) sind unter Linux zusätzliche Schritte nötig.

---

## 1. Zugangsdaten ermitteln (USER_ID & HASH)

Bevor du das Skript konfigurieren kannst, musst du deine USER_ID und deinen HASH aus dem Browser auslesen.

1. Logge dich ganz normal im Browser bei Campus Dual ein.
2. Rufe folgende Seite auf: https://selfservice.campus-dual.de/room/index
3. Öffne die Entwicklerwerkzeuge, indem du F12 drückst.
4. Wechsle in den Entwicklerwerkzeugen auf den Reiter Netzwerk (Network).
5. Lade die Seite neu (F5), falls die Liste leer ist.
6. Suche in der Liste nach einer Anfrage, die wie folgt beginnt: https://selfservice.campus-dual.de/room/json?...
7. Klicke auf diesen Eintrag. In der URL oder unter "Payload/Header" findest du die benötigten Werte.

**Wichtiger Hinweis zur USER_ID**: Die User-ID entspricht deiner Matrikelnummer. Trage jedoch nur die Zahlen ein, z.B. `500xyz`, NICHT `s500xyz`.

Die Nutzerdaten werden selbstverständlich nicht an mich übermittelt, sondern ausschließlich die Stundenpläne im JSON-Format.

## 2. Konfiguration (`.env`)

Navigiere in das Verzeichnis `/script` und erstelle eine Datei `.env` mit folgendem Inhalt:

```
BASE_URL=https://dhsn.deitazero.de/
USER_ID=<USER_ID>
HASH=<HASH>
SEMINAR_GROUP=<SEMINAR_GROUP>
```

**Erklärung:**

- **BASE_URL:** Basis-URL des Dienstes.
- **USER_ID:** Matrikelnummer.
- **HASH:** Persönlicher Authentifizierungs-Hash.
- **SEMINAR_GROUP:** Seminargruppe. z.B. `CS23-1`

---

## 3. Installation & Setup

Alle Befehle im Verzeichnis `/script` ausführen:

```bash
cd script
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 4. Manuelle Ausführung (Linux/Mac)

Der Server sendet eine unvollständige Zertifikatskette, daher muss Python manuell konfiguriert werden.

Das Skript `ssl.sh` lädt das fehlende Zertifikat temporär herunter und setzt die nötigen Umgebungsvariablen.

Vor jedem neuen Terminal-Start:

```bash
source ssl.sh
.venv/bin/python main.py
```

## 5. Automatisierung (Cronjob)

Richte einen Cronjob ein, um das Skript automatisch auszuführen.

Crontab öffnen:

```bash
crontab -e
```

Am Ende einfügen (Pfad anpassen!):

```
0 8 * * * cd /dein/pfad/zu/script && source ssl.sh && .venv/bin/python main.py >> cron.log 2>&1
```

**Erklärung:**

- **cd /dein/pfad/zu/script** – Wechselt ins Projektverzeichnis
- **source ssl.sh** – Lädt das SSL-Fix-Skript (Damit SSL funktioniert)
- **.venv/bin/python main.py** – Startet das Skript
- **>> cron.log 2>&1** – Loggt Ausgaben und Fehler
