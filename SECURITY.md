# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| latest  | ✅        |

## Reporting a Vulnerability

Pour signaler une vulnérabilité, ouvrez une issue confidentielle GitHub ou
contactez le mainteneur directement.

---

## Audit des Risques — 20 avril 2026

### ✅ Risques corrigés

| Domaine             | Risque                                           | Criticité   | Correction appliquée                                                                                               |
| ------------------- | ------------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------ |
| PII → LLM Cloud     | SIREN/SIRET, noms clients envoyés bruts à Gemini | 🔴 CRITIQUE | `src/lib/piiAnonymizer.ts` — seuls des indicateurs booléens et pseudonymes de session sont transmis (RGPD Art. 28) |
| Secrets en clair    | `.env` non exclu du dépôt git                    | 🔴 CRITIQUE | `.gitignore` — ajout de `.env` et `.env.*` (sauf `.env.example`)                                                   |
| Flottants fiscaux   | Arithmétique JS IEEE 754 dans facturX.ts         | 🟠 ÉLEVÉ    | `src/lib/facturX.ts` — intégralité des calculs (sous-total, TVA, totaux lignes) migrée vers `Decimal.js`           |
| Factur-X non-validé | PDF/A-3 malformé → rejet PPF (sept. 2026)        | 🟠 ÉLEVÉ    | `src/lib/facturX.ts` — `validateFacturXXML()` vérifie les éléments requis EN 16931 avant injection                 |

### ✅ Risques N/A pour cette architecture PWA

| Domaine          | Risque                                   | Raison N/A                                                                                                |
| ---------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Docker root      | Container UID 0 → escalade de privilèges | Ce projet est une **PWA pure** (React + Vite + Firebase + IndexedDB). Aucun Docker, aucun conteneur.      |
| Port 5432 exposé | PostgreSQL accessible depuis internet    | Ce projet n'utilise **pas PostgreSQL**. Persistance locale via IndexedDB (Dexie.js) + Firebase Firestore. |

> **Note si un backend est ajouté :** en cas d'ajout d'un service Docker/PostgreSQL, appliquer impérativement :
>
> - `USER 1001` dans le Dockerfile (jamais root)
> - Secrets via Docker secrets ou Vault (jamais `.env` dans l'image)
> - PostgreSQL bindé sur `127.0.0.1:5432` uniquement (jamais `0.0.0.0`)
> - Réseau Docker dédié, port 5432 non publié vers l'hôte
