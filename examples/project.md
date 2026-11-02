---
title:
  es: "Nombre del proyecto en español"
  en: "Project name in English"
slug: "nombre-del-proyecto"
summary:
  es: "Qué hace el pipeline, con qué datos y dónde corre. 220 caracteres como máximo: la tarjeta lo corta a 3 líneas."
  en: "What the pipeline does, which data it uses and where it runs. 220 characters at most: the card cuts it to 3 lines."
tools:
  - Python
  - pandas
  - SQL
  - BigQuery
  - Cloud Storage
  - Cloud Run
repo_url: "https://github.com/eddieisoffline/nombre-del-proyecto"
cover_image: "https://raw.githubusercontent.com/eddieisoffline/nombre-del-proyecto/main/docs/img/captura.png"
featured: true
date: "2026-01-15"
---

:::es
## Problema

Qué pregunta responde el proyecto y para quién. Una o dos frases.

## Estado

Solo si el proyecto está en curso. Una tabla con lo que ya se ejecutó, sin lo planeado.

| Pieza | Estado |
|-------|--------|
| Ingesta diaria | funciona desde AAAA-MM-DD |

## Arquitectura

```text
fuente ─► Cloud Storage ─► BigQuery ─► dashboard
```

## Dashboard

Enlace absoluto al dashboard o a la evidencia: [Ver el dashboard](https://example.com).

## Metodología

Cómo se limpia, se modela o se valida. Si el proyecto aún no tiene modelo, esta sección se llama "Lo que ya funciona".

## Hallazgos sobre la fuente

Problemas reales de los datos: huecos, cambios de formato, revisiones.

## Lo que dicen los datos

Cifras con fecha y fuente.

## Decisiones de diseño

Qué se eligió, qué se descartó y por qué.

## Stack

Python, pandas, SQL, BigQuery, Cloud Storage y Cloud Run.

## Datos

Fuente, licencia, atribución y enlace a los docs del repo.
:::

:::en
## Problem

What question the project answers and for whom. One or two sentences.

## Status

Only if the project is in progress. A table with what has already run, not what is planned.

| Piece | Status |
|-------|--------|
| Daily ingestion | running since YYYY-MM-DD |

## Architecture

```text
source ─► Cloud Storage ─► BigQuery ─► dashboard
```

## Dashboard

Absolute link to the dashboard or the evidence: [Open the dashboard](https://example.com).

## Methodology

How the data is cleaned, modeled or validated. If there is no model yet, this section is called "What already works".

## Findings about the source

Real problems in the data: gaps, format changes, revisions.

## What the data shows

Figures with a date and a source.

## Design decisions

What was chosen, what was ruled out and why.

## Stack

Python, pandas, SQL, BigQuery, Cloud Storage and Cloud Run.

## Data

Source, license, attribution and a link to the repo docs (in Spanish, if they are).
:::
