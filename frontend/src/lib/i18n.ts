export const supportedLocales = ["es", "en"] as const;

export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = "en";

export type LocalizedPath = `/${Locale}` | `/${Locale}/${string}`;

export function isLocale(value: string | undefined): value is Locale {
  return value === "es" || value === "en";
}

export function getLocaleFromPath(pathname: string): Locale | null {
  const [, maybeLocale] = pathname.split("/");
  return isLocale(maybeLocale) ? maybeLocale : null;
}

export function stripLocaleFromPath(pathname: string): string {
  const locale = getLocaleFromPath(pathname);
  if (!locale) {
    return pathname || "/";
  }

  const stripped = pathname.slice(`/${locale}`.length);
  return stripped.length > 0 ? stripped : "/";
}

export function withLocale(path: string, locale: Locale): LocalizedPath {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return normalizedPath === "/"
    ? `/${locale}`
    : (`/${locale}${normalizedPath}` as LocalizedPath);
}

export function switchLocalePath(pathname: string, locale: Locale): LocalizedPath {
  return withLocale(stripLocaleFromPath(pathname), locale);
}

export function getLocaleFromRequest(request: Request): Locale {
  const cookieLocale = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("portfolio_locale="))
    ?.split("=")[1];

  if (isLocale(cookieLocale)) {
    return cookieLocale;
  }

  const acceptLanguage = request.headers.get("accept-language") ?? "";
  return acceptLanguage.toLowerCase().startsWith("es") ? "es" : defaultLocale;
}

export const copy = {
  es: {
    site: {
      defaultDescription:
        "Proyectos de ingeniería y análisis de datos con datos públicos. Cada caso de estudio incluye el código y lo que se midió.",
      unavailableTitle: "Proyecto no disponible"
    },
    nav: {
      projects: "Proyectos",
      stack: "Stack",
      contact: "Contacto",
      privacy: "Privacidad",
      homeLabel: "Inicio de Eduardo Anica González",
      primary: "Navegación principal",
      language: "Seleccionar idioma"
    },
    hero: {
      role: "Data & Analytics Engineer",
      headline: "Llevo datos de la fuente al tablero y pruebo cada paso.",
      summary:
        "Trabajo sobre todo con Python y SQL, y despliego en Google Cloud con Terraform. Los proyectos de este sitio usan datos públicos, y cada caso de estudio muestra las cifras que se midieron con ellos.",
      projectsCta: "Ver proyectos",
      contactCta: "Contactar",
      noteLabel: "Forma de trabajo",
      professionalNote:
        "Casi todo el trabajo pasa antes del tablero: entender de dónde salen los datos, validarlos y automatizar la carga para que nadie tenga que armar el reporte a mano."
    },
    home: {
      featuredTitle: "Casos de estudio destacados",
      featuredDescription:
        "Proyectos con el código en GitHub, la arquitectura explicada y las cifras que se midieron.",
      viewAllProjects: "Ver todos los proyectos",
      noFeaturedTitle: "Todavía no hay proyectos publicados.",
      noFeaturedMessage:
        "Los proyectos se están actualizando. Mientras tanto, el código está en mi GitHub.",
      latestTitle: "Últimos casos de estudio",
      latestDescription: "Los proyectos más recientes que no aparecen arriba."
    },
    about: {
      eyebrow: "Perfil",
      title: "Análisis de datos, BI y los pipelines que hay detrás.",
      body:
        "Tengo experiencia construyendo pipelines, dashboards, reportes automáticos y herramientas internas para equipos de operación, servicio y negocio. Uso sobre todo Python, SQL, pandas, Power BI, DAX, Looker Studio, PostgreSQL, BigQuery y APIs. Lo que más me importa de un proyecto es lo que queda después: un proceso que cualquiera del equipo pueda volver a correr y revisar.",
      photoAlt: "Retrato de Eduardo Anica González",
      photoPlaceholder: "Foto pendiente",
      toolsLabel: "Herramientas por área"
    },
    contact: {
      eyebrow: "Contacto",
      title: "¿Quieres platicar de un proyecto o de una vacante?",
      description:
        "Escríbeme por este formulario o por LinkedIn. Si es sobre un proyecto, ayuda saber de dónde vienen los datos y qué decisión tienen que apoyar.",
      linksLabel: "Perfiles",
      formTitle: "Enviar mensaje",
      nameLabel: "Nombre",
      namePlaceholder: "Tu nombre",
      emailLabel: "Email",
      emailPlaceholder: "tu@email.com",
      messageLabel: "Mensaje",
      messagePlaceholder: "Cuéntame qué necesitas y con qué datos cuentas.",
      companyLabel: "Empresa",
      submit: "Enviar mensaje",
      submitting: "Enviando...",
      success: "Mensaje enviado. Gracias, te respondo pronto.",
      error:
        "No se pudo enviar el mensaje. Intenta de nuevo o escríbeme por LinkedIn.",
      validationError:
        "Revisa los campos requeridos antes de enviar."
    },
    privacy: {
      pageTitle: "Privacidad",
      pageDescription:
        "Cómo este portafolio profesional trata datos personales, contacto, analítica y datasets demostrativos.",
      eyebrow: "Privacidad",
      headline: "Uso responsable de datos en este portafolio.",
      intro:
        "Este sitio web es un portafolio profesional orientado a Data Analytics, Data Engineering y Cloud.",
      updated: "Actualizada: 1 de septiembre de 2026",
      contactCta: "Ir a contacto",
      sections: [
        {
          title: "Datos recopilados",
          body:
            "El sitio recopila únicamente la información que envías de forma voluntaria mediante el formulario de contacto:",
          items: ["Nombre.", "Correo electrónico.", "Mensaje."]
        },
        {
          title: "Finalidad",
          body:
            "La información del formulario se utiliza exclusivamente para responder consultas, contacto profesional, posibles oportunidades laborales o colaboraciones."
        },
        {
          title: "Conservación",
          body:
            "Los datos se conservan solo durante el tiempo necesario para atender la comunicación correspondiente."
        },
        {
          title: "Compartición de datos",
          body:
            "Los datos personales no se venden. Resend procesa técnicamente los mensajes enviados por el formulario. Vercel aloja el sitio y proporciona analítica agregada del uso del portafolio."
        },
        {
          title: "Cookies y analítica",
          body:
            "Este sitio usa una cookie funcional llamada portfolio_locale para recordar el idioma seleccionado. También utiliza Vercel Web Analytics, que ofrece métricas agregadas y no usa cookies para identificar visitantes."
        },
        {
          title: "Proyectos y datasets",
          body:
            "Los proyectos publicados utilizan datos públicos, sintéticos, anonimizados o preparados específicamente para demostraciones. No se publican credenciales, información confidencial de empresas ni información personal identificable procedente de proyectos laborales."
        },
        {
          title: "Derechos y contacto",
          body:
            "Para solicitudes relacionadas con tus datos personales, utiliza el formulario de contacto de este sitio o el perfil de LinkedIn enlazado en el footer."
        }
      ]
    },
    projects: {
      pageTitle: "Proyectos",
      pageDescription:
        "Casos de estudio de ingeniería y análisis de datos, con el código y las cifras medidas de cada proyecto.",
      eyebrow: "Casos de estudio",
      headline: "Cada proyecto, con su código y lo que se midió.",
      description:
        "Cada caso explica el problema, cómo está armado el pipeline y qué se comprobó con datos reales. El código está en GitHub y puedes filtrar por herramienta.",
      filterLabel: "Filtrar proyectos por herramienta",
      all: "Todos",
      featured: "Destacado",
      readCaseStudy: "Leer caso de estudio",
      repo: "Repo",
      demo: "Demo",
      dashboard: "Dashboard",
      emptyTitle: "Ningún proyecto coincide con este filtro.",
      emptyMessage: "Prueba con otra herramienta o vuelve a la lista completa.",
      missingSlug: "Falta el slug del proyecto.",
      notFound: "Ese proyecto no existe o ya no está publicado.",
      loadError: "No se pudo cargar este proyecto. Intenta de nuevo en unos minutos.",
      unavailable: "Proyecto no disponible",
      back: "Volver a proyectos",
      date: "Fecha",
      tools: "Herramientas",
      links: "Enlaces",
      coverAlt: "Portada de {title}",
      dashboardTitle: "Dashboard de Looker Studio de {title}"
    },
    states: {
      dataUnavailable: "Los proyectos no cargaron.",
      dataUnavailableMessage:
        "Intenta en unos minutos. Mientras tanto, el código de cada proyecto está en mi GitHub.",
      noContentTitle: "Este caso de estudio todavía no tiene contenido.",
      noContentMessage:
        "Vuelve en unos minutos o revisa el repositorio del proyecto.",
      undated: "Sin fecha"
    },
    stackGroups: [
      {
        label: "Pipelines y datos",
        tools: [
          "Python",
          "pandas",
          "SQL",
          "PostgreSQL",
          "DuckDB",
          "Spark",
          "Delta Lake"
        ]
      },
      {
        label: "Nube e infraestructura",
        tools: [
          "BigQuery",
          "Cloud Run",
          "Cloud Storage",
          "Terraform",
          "Docker",
          "GitHub Actions"
        ]
      },
      {
        label: "BI y reportes",
        tools: [
          "Power BI",
          "DAX",
          "Looker Studio",
          "Google Sheets",
          "Diseño de KPIs"
        ]
      },
      {
        label: "Modelado y automatización",
        tools: [
          "statsmodels",
          "ARIMA",
          "Prophet",
          "scikit-learn",
          "Backtesting",
          "APIs",
          "Flask",
          "TypeScript"
        ]
      }
    ]
  },

  en: {
    site: {
      defaultDescription:
        "Data engineering and analytics projects built on public data. Each case study includes the code and what was measured.",
      unavailableTitle: "Project unavailable"
    },
    nav: {
      projects: "Projects",
      stack: "Stack",
      contact: "Contact",
      privacy: "Privacy",
      homeLabel: "Eduardo Anica González home",
      primary: "Primary navigation",
      language: "Select language"
    },
    hero: {
      role: "Data & Analytics Engineer",
      headline: "I take data from the source to the dashboard and test every step.",
      summary:
        "I mostly work in Python and SQL and deploy to Google Cloud with Terraform. The projects here use public data, and each case study shows the figures measured with it.",
      projectsCta: "View projects",
      contactCta: "Contact",
      noteLabel: "How I work",
      professionalNote:
        "Most of the work happens before the dashboard: understanding where the data comes from, validating it, and automating the load so nobody has to build the report by hand."
    },
    home: {
      featuredTitle: "Featured case studies",
      featuredDescription:
        "Projects with the code on GitHub, the architecture explained, and the figures that were measured.",
      viewAllProjects: "View all projects",
      noFeaturedTitle: "No projects published yet.",
      noFeaturedMessage:
        "The projects are being updated. In the meantime, the code is on my GitHub.",
      latestTitle: "Latest case studies",
      latestDescription: "The most recent projects not listed above."
    },
    about: {
      eyebrow: "Profile",
      title: "Data analysis, BI, and the pipelines behind them.",
      body:
        "I have experience building pipelines, dashboards, automated reports, and internal tools for operations, service, and business teams. I mostly use Python, SQL, pandas, Power BI, DAX, Looker Studio, PostgreSQL, BigQuery, and APIs. What I care about most in a project is what stays behind: a process anyone on the team can run again and check.",
      photoAlt: "Portrait of Eduardo Anica González",
      photoPlaceholder: "Photo pending",
      toolsLabel: "Tools by area"
    },
    contact: {
      eyebrow: "Contact",
      title: "Want to talk about a project or a role?",
      description:
        "Write to me through this form or on LinkedIn. If it's about a project, it helps to know where the data comes from and what decision it needs to support.",
      linksLabel: "Profiles",
      formTitle: "Send a message",
      nameLabel: "Name",
      namePlaceholder: "Your name",
      emailLabel: "Email",
      emailPlaceholder: "you@email.com",
      messageLabel: "Message",
      messagePlaceholder: "Tell me what you need and what data you have.",
      companyLabel: "Company",
      submit: "Send message",
      submitting: "Sending...",
      success: "Message sent. Thanks, I'll get back to you soon.",
      error:
        "The message could not be sent. Try again or reach me through LinkedIn.",
      validationError:
        "Check the required fields before sending."
    },
    privacy: {
      pageTitle: "Privacy",
      pageDescription:
        "How this professional portfolio handles personal data, contact messages, analytics, and demo datasets.",
      eyebrow: "Privacy",
      headline: "Responsible data practices for this portfolio.",
      intro:
        "This website is a professional portfolio focused on Data Analytics, Data Engineering, and Cloud.",
      updated: "Updated: September 1, 2026",
      contactCta: "Go to contact",
      sections: [
        {
          title: "Data collected",
          body:
            "The site only collects information you voluntarily send through the contact form:",
          items: ["Name.", "Email address.", "Message."]
        },
        {
          title: "Purpose",
          body:
            "Contact form information is used only to answer inquiries, support professional contact, and discuss potential job opportunities or collaborations."
        },
        {
          title: "Retention",
          body:
            "Data is kept only for the time needed to handle the related communication."
        },
        {
          title: "Data sharing",
          body:
            "Personal data is not sold. Resend technically processes messages sent through the contact form. Vercel hosts the site and provides aggregated portfolio analytics."
        },
        {
          title: "Cookies and analytics",
          body:
            "This site uses a functional cookie named portfolio_locale to remember the selected language. It also uses Vercel Web Analytics, which provides aggregated metrics and does not use cookies to identify visitors."
        },
        {
          title: "Projects and datasets",
          body:
            "Published projects use public, synthetic, anonymized, or demonstration-specific data. Credentials, confidential company information, and personally identifiable information from professional projects are not published."
        },
        {
          title: "Rights and contact",
          body:
            "For requests related to your personal data, use this site's contact form or the LinkedIn profile linked in the footer."
        }
      ]
    },
    projects: {
      pageTitle: "Projects",
      pageDescription:
        "Data engineering and analytics case studies, with the code and measured figures for each project.",
      eyebrow: "Case studies",
      headline: "Each project, with its code and what was measured.",
      description:
        "Each case explains the problem, how the pipeline is built, and what was checked against real data. The code is on GitHub, and you can filter by tool.",
      filterLabel: "Filter projects by tool",
      all: "All",
      featured: "Featured",
      readCaseStudy: "Read case study",
      repo: "Repo",
      demo: "Demo",
      dashboard: "Dashboard",
      emptyTitle: "No projects match this filter.",
      emptyMessage: "Try another tool or go back to the full list.",
      missingSlug: "The project slug is missing.",
      notFound: "That project doesn't exist or is no longer published.",
      loadError: "This project could not be loaded. Try again in a few minutes.",
      unavailable: "Project unavailable",
      back: "Back to projects",
      date: "Date",
      tools: "Tools",
      links: "Links",
      coverAlt: "{title} cover",
      dashboardTitle: "{title} Looker Studio dashboard"
    },
    states: {
      dataUnavailable: "The projects didn't load.",
      dataUnavailableMessage:
        "Try again in a few minutes. In the meantime, the code for every project is on my GitHub.",
      noContentTitle: "This case study has no content yet.",
      noContentMessage:
        "Check back in a few minutes or look at the project repository.",
      undated: "Undated"
    },
    stackGroups: [
      {
        label: "Pipelines and data",
        tools: [
          "Python",
          "pandas",
          "SQL",
          "PostgreSQL",
          "DuckDB",
          "Spark",
          "Delta Lake"
        ]
      },
      {
        label: "Cloud and infrastructure",
        tools: [
          "BigQuery",
          "Cloud Run",
          "Cloud Storage",
          "Terraform",
          "Docker",
          "GitHub Actions"
        ]
      },
      {
        label: "BI and reporting",
        tools: [
          "Power BI",
          "DAX",
          "Looker Studio",
          "Google Sheets",
          "KPI design"
        ]
      },
      {
        label: "Modeling and automation",
        tools: [
          "statsmodels",
          "ARIMA",
          "Prophet",
          "scikit-learn",
          "Backtesting",
          "APIs",
          "Flask",
          "TypeScript"
        ]
      }
    ]
  }
} as const;

export function interpolate(
  template: string,
  values: Record<string, string>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
}
