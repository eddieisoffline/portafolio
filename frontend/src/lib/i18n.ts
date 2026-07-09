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
        "Portafolio profesional de análisis de datos, BI, automatización y productos internos.",
      unavailableTitle: "Proyecto no disponible"
    },
    nav: {
      projects: "Proyectos",
      stack: "Stack",
      impact: "Impacto",
      contact: "Contacto",
      homeLabel: "Inicio de Eduardo Anica González",
      primary: "Navegación principal",
      language: "Seleccionar idioma"
    },
    hero: {
      role: "Data Analyst / Analytics Engineering",
      headline:
        "Construyo soluciones de datos para entender, medir y mejorar procesos.",
      summary:
        "Trabajo con Python, SQL, BI, automatización y backend para convertir información dispersa en reportes, pipelines y herramientas que ayudan a tomar mejores decisiones.",
      projectsCta: "Ver proyectos",
      contactCta: "Contactar",
      noteLabel: "Forma de trabajo",
      professionalNote:
        "Me enfoco en resolver problemas reales de operación: limpiar datos, conectar fuentes, automatizar reportes, diseñar KPIs y construir dashboards o servicios internos que sean claros, mantenibles y útiles para los equipos."
    },
    home: {
      featuredTitle: "Casos de estudio destacados",
      featuredDescription:
        "Proyectos seleccionados por impacto, claridad técnica y utilidad práctica.",
      viewAllProjects: "Ver todos los proyectos",
      noFeaturedTitle: "Aún no hay proyectos destacados.",
      noFeaturedMessage:
        "Sincroniza proyectos desde el backend y marca los casos más sólidos como destacados.",
      latestTitle: "Últimos case studies",
      latestDescription:
        "Proyectos recientes con contexto técnico, herramientas utilizadas y explicación del problema resuelto.",
      latestEmptyTitle: "Aún no hay case studies recientes.",
      latestEmptyMessage:
        "Cuando el backend sincronice proyectos, los más recientes aparecerán aquí.",
      impactTitle:
        "El impacto se nota cuando el trabajo manual baja y las decisiones son más claras.",
      impactDescription:
        "Este portafolio muestra proyectos donde los datos pasan de estar dispersos a convertirse en procesos, reportes o herramientas que se pueden usar."
    },
    about: {
      eyebrow: "Perfil",
      title: "Trabajo entre análisis de datos, automatización y BI.",
      body:
        "Soy Analista de Datos con experiencia construyendo pipelines, dashboards, reportes automatizados y herramientas internas para equipos de operación, servicio y negocio. Trabajo principalmente con Python, SQL, pandas, Power BI, DAX, Looker Studio, PostgreSQL, BigQuery y APIs. Me interesa crear soluciones que no sólo respondan una pregunta puntual, sino que dejen un proceso más claro, repetible y fácil de mantener.",
      photoAlt: "Retrato de Eduardo Anica González",
      photoPlaceholder: "Foto pendiente",
      toolsLabel: "Herramientas por área"
    },
    contact: {
      eyebrow: "Contacto",
      title: "Hablemos de datos que necesitan volverse útiles.",
      description:
        "Puedo apoyar en proyectos de análisis, BI, automatización, limpieza de datos, pipelines, reporting ejecutivo o herramientas internas para equipos que necesitan ordenar información y tomar mejores decisiones.",
      linksLabel: "Perfiles",
      formTitle: "Enviar mensaje",
      nameLabel: "Nombre",
      namePlaceholder: "Tu nombre",
      emailLabel: "Email",
      emailPlaceholder: "tu@email.com",
      messageLabel: "Mensaje",
      messagePlaceholder:
        "Cuéntame brevemente qué necesitas analizar, automatizar o mejorar.",
      companyLabel: "Empresa",
      submit: "Enviar mensaje",
      submitting: "Enviando...",
      success:
        "Mensaje enviado. Te responderé cuando revise el contexto.",
      error:
        "No se pudo enviar el mensaje. Intenta de nuevo o escríbeme por LinkedIn.",
      validationError:
        "Revisa los campos requeridos antes de enviar."
    },
    projects: {
      pageTitle: "Proyectos",
      pageDescription:
        "Proyectos de análisis de datos, BI, automatización, dashboards, backend y casos de estudio.",
      eyebrow: "Casos de estudio",
      headline:
        "Proyectos enfocados en resolver problemas con datos, no sólo en mostrar gráficas.",
      description:
        "Explora proyectos construidos con datos reales, scripts, dashboards, APIs, modelos y documentación técnica. Cada caso busca explicar el problema, el proceso y el resultado.",
      filterLabel: "Filtrar proyectos por herramienta",
      all: "Todos",
      featured: "Destacado",
      readCaseStudy: "Leer case study",
      repo: "Repo",
      demo: "Demo",
      dashboard: "Dashboard",
      emptyTitle: "Ningún proyecto coincide con este filtro.",
      emptyMessage:
        "Elige otra herramienta o limpia el filtro para ver todos los proyectos devueltos por la API.",
      missingSlug: "Falta el slug del proyecto.",
      notFound: "No se encontró el proyecto solicitado.",
      loadError: "No se pudo cargar el proyecto desde la API del backend.",
      unavailable: "Proyecto no disponible",
      back: "Volver a proyectos",
      date: "Fecha",
      tools: "Herramientas",
      links: "Enlaces",
      coverAlt: "Portada de {title}",
      dashboardTitle: "Dashboard de Looker Studio de {title}"
    },
    states: {
      dataUnavailable: "Los datos del portafolio no están disponibles.",
      dataUnavailableMessage:
        "Verifica que el backend esté corriendo y que PUBLIC_API_URL apunte a la API correcta.",
      noContentTitle: "Este case study aún no tiene contenido.",
      noContentMessage:
        "Sincroniza un archivo Markdown desde el backend para renderizar HTML sanitizado aquí.",
      undated: "Sin fecha"
    },
    stackGroups: [
      {
        label: "Data pipelines",
        tools: [
          "Python",
          "pandas",
          "SQL",
          "PostgreSQL",
          "BigQuery",
          "ETL"
        ]
      },
      {
        label: "Analytics & BI",
        tools: [
          "Power BI",
          "DAX",
          "Looker Studio",
          "Diseño de KPIs",
          "Reporting",
          "Forecasting"
        ]
      },
      {
        label: "Automatización",
        tools: [
          "APIs",
          "Flask",
          "TypeScript",
          "Google Sheets",
          "Cloud services",
          "GitHub"
        ]
      },
      {
        label: "Modelado",
        tools: [
          "scikit-learn",
          "Prophet",
          "ARIMA",
          "Validación",
          "Limpieza de datos",
          "Documentación"
        ]
      }
    ],
    impactStats: [
      {
        value: "-70%",
        label: "Reducción de trabajo manual",
        detail:
          "Automatización de procesos repetitivos de limpieza, cruce, actualización y reporting."
      },
      {
        value: "-85%",
        label: "Reducción de errores",
        detail:
          "Validaciones, reglas de negocio y normalización de datos para mejorar la confiabilidad de los reportes."
      },
      {
        value: "BI",
        label: "Información lista para decisión",
        detail:
          "Dashboards y reportes diseñados para que los equipos entiendan qué está pasando y qué necesitan revisar."
      }
    ]
  },

  en: {
    site: {
      defaultDescription:
        "Professional portfolio focused on data analysis, BI, automation, and internal data products.",
      unavailableTitle: "Project unavailable"
    },
    nav: {
      projects: "Projects",
      stack: "Stack",
      impact: "Impact",
      contact: "Contact",
      homeLabel: "Eduardo Anica González home",
      primary: "Primary navigation",
      language: "Select language"
    },
    hero: {
      role: "Data Analyst / Analytics Engineering",
      headline:
        "I build data solutions to understand, measure, and improve processes.",
      summary:
        "I work with Python, SQL, BI, automation, and backend tools to turn scattered information into reports, pipelines, and tools that support better decisions.",
      projectsCta: "View projects",
      contactCta: "Contact",
      noteLabel: "Working approach",
      professionalNote:
        "I focus on solving real operational problems: cleaning data, connecting sources, automating reports, designing KPIs, and building dashboards or internal services that are clear, maintainable, and useful for teams."
    },
    home: {
      featuredTitle: "Featured case studies",
      featuredDescription:
        "Selected projects based on impact, technical clarity, and practical value.",
      viewAllProjects: "View all projects",
      noFeaturedTitle: "No featured projects yet.",
      noFeaturedMessage:
        "Sync projects from the backend and mark the strongest case studies as featured.",
      latestTitle: "Latest case studies",
      latestDescription:
        "Recent projects with technical context, tools used, and a clear explanation of the problem solved.",
      latestEmptyTitle: "No recent case studies yet.",
      latestEmptyMessage:
        "When the backend syncs projects, the newest work will appear here.",
      impactTitle:
        "Impact shows up when manual work decreases and decisions become clearer.",
      impactDescription:
        "This portfolio shows projects where scattered data becomes processes, reports, or tools that teams can actually use."
    },
    about: {
      eyebrow: "Profile",
      title: "I work between data analysis, automation, and BI.",
      body:
        "I am a Data Analyst with experience building pipelines, dashboards, automated reports, and internal tools for operations, service, and business teams. I mainly work with Python, SQL, pandas, Power BI, DAX, Looker Studio, PostgreSQL, BigQuery, and APIs. I care about creating solutions that do not just answer one question, but leave behind a clearer, repeatable, and maintainable process.",
      photoAlt: "Portrait of Eduardo Anica González",
      photoPlaceholder: "Photo pending",
      toolsLabel: "Tools by area"
    },
    contact: {
      eyebrow: "Contact",
      title: "Let's talk about data that needs to become useful.",
      description:
        "I can help with analysis, BI, automation, data cleaning, pipelines, executive reporting, or internal tools for teams that need to organize information and make better decisions.",
      linksLabel: "Profiles",
      formTitle: "Send a message",
      nameLabel: "Name",
      namePlaceholder: "Your name",
      emailLabel: "Email",
      emailPlaceholder: "you@email.com",
      messageLabel: "Message",
      messagePlaceholder:
        "Briefly describe what you need to analyze, automate, or improve.",
      companyLabel: "Company",
      submit: "Send message",
      submitting: "Sending...",
      success:
        "Message sent. I will reply after reviewing the context.",
      error:
        "The message could not be sent. Try again or reach me through LinkedIn.",
      validationError:
        "Check the required fields before sending."
    },
    projects: {
      pageTitle: "Projects",
      pageDescription:
        "Projects in data analysis, BI, automation, dashboards, backend, and case studies.",
      eyebrow: "Case studies",
      headline:
        "Projects focused on solving problems with data, not just showing charts.",
      description:
        "Explore projects built with real data, scripts, dashboards, APIs, models, and technical documentation. Each case explains the problem, the process, and the outcome.",
      filterLabel: "Filter projects by tool",
      all: "All",
      featured: "Featured",
      readCaseStudy: "Read case study",
      repo: "Repo",
      demo: "Demo",
      dashboard: "Dashboard",
      emptyTitle: "No projects match this filter.",
      emptyMessage:
        "Choose another tool or clear the filter to see every project returned by the API.",
      missingSlug: "The project slug is missing.",
      notFound: "The requested project was not found.",
      loadError: "The project could not be loaded from the backend API.",
      unavailable: "Project unavailable",
      back: "Back to projects",
      date: "Date",
      tools: "Tools",
      links: "Links",
      coverAlt: "{title} cover",
      dashboardTitle: "{title} Looker Studio dashboard"
    },
    states: {
      dataUnavailable: "The portfolio data is unavailable.",
      dataUnavailableMessage:
        "Check that the backend is running and that PUBLIC_API_URL points to the correct API.",
      noContentTitle: "This case study has no content yet.",
      noContentMessage:
        "Sync a Markdown file through the backend so it can render sanitized HTML here.",
      undated: "Undated"
    },
    stackGroups: [
      {
        label: "Data pipelines",
        tools: [
          "Python",
          "pandas",
          "SQL",
          "PostgreSQL",
          "BigQuery",
          "ETL"
        ]
      },
      {
        label: "Analytics & BI",
        tools: [
          "Power BI",
          "DAX",
          "Looker Studio",
          "KPI design",
          "Reporting",
          "Forecasting"
        ]
      },
      {
        label: "Automation",
        tools: [
          "APIs",
          "Flask",
          "TypeScript",
          "Google Sheets",
          "Cloud services",
          "GitHub"
        ]
      },
      {
        label: "Modeling",
        tools: [
          "scikit-learn",
          "Prophet",
          "ARIMA",
          "Validation",
          "Data cleaning",
          "Documentation"
        ]
      }
    ],
    impactStats: [
      {
        value: "-70%",
        label: "Less manual work",
        detail:
          "Automation of repetitive cleaning, joining, updating, and reporting processes."
      },
      {
        value: "-85%",
        label: "Fewer errors",
        detail:
          "Validations, business rules, and data normalization to improve reporting reliability."
      },
      {
        value: "BI",
        label: "Decision-ready information",
        detail:
          "Dashboards and reports designed to help teams understand what is happening and what needs attention."
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
