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
      contact: "Contacto",
      privacy: "Privacidad",
      legal: "Aviso legal",
      cookies: "Cookies",
      footer: "Pie de página",
      homeLabel: "Inicio de Eduardo Anica González",
      primary: "Navegación principal",
      language: "Seleccionar idioma"
    },
    hero: {
      role: "Data & Analytics Engineer",
      summary:
        "Soy ingeniero de datos y analítica. Estos son problemas que resolví con datos públicos, cada uno con su código.",
      indexLabel: "Proyectos en esta página"
    },
    home: {
      featuredTitle: "Proyectos",
      viewAllProjects: "Todos los proyectos",
      noFeaturedTitle: "Todavía no hay proyectos publicados.",
      noFeaturedMessage:
        "Los proyectos se están actualizando. Mientras tanto, el código está en mi GitHub.",
      latestTitle: "Más proyectos"
    },
    about: {
      title: "Sobre mí",
      body:
        "He trabajado con equipos de operación, servicio y negocio haciendo pipelines, dashboards, reportes automáticos y herramientas internas. Me gusta dejar procesos que cualquiera del equipo pueda volver a correr y revisar.",
      toolsLabel: "Herramientas por área"
    },
    contact: {
      title: "Contacto",
      description: "Si tienes una vacante o un proyecto, mándame un mensaje aquí",
      orOn: "o por",
      nameLabel: "Nombre",
      namePlaceholder: "Tu nombre",
      emailLabel: "Email",
      emailPlaceholder: "tu@email.com",
      messageLabel: "Mensaje",
      messagePlaceholder: "Cuéntame qué necesitas y con qué datos cuentas.",
      companyLabel: "Empresa",
      submit: "Enviar",
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
      headline: "Uso responsable de datos en este portafolio.",
      intro:
        "Este sitio web es un portafolio profesional orientado a Data Analytics, Data Engineering y Cloud.",
      updated: "Actualizada: 30 de octubre de 2026",
      contactCta: "Ir a contacto",
      sections: [
        {
          title: "Responsable",
          body:
            "El responsable de los datos que envías por este sitio es Eduardo Anica González, titular del portafolio."
        },
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
            "Este sitio usa una cookie funcional llamada portfolio_locale para recordar el idioma seleccionado. También utiliza Vercel Web Analytics, que ofrece métricas agregadas y no usa cookies para identificar visitantes. El detalle está en el aviso de cookies."
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
    legal: {
      pageTitle: "Aviso legal",
      pageDescription:
        "Titular, condiciones de uso y propiedad intelectual de este portafolio profesional.",
      headline: "Aviso legal.",
      intro: "Quién está detrás de este sitio y en qué condiciones puedes usarlo.",
      updated: "Actualizado: 30 de octubre de 2026",
      contactCta: "Ir a contacto",
      sections: [
        {
          title: "Titular",
          body:
            "Este sitio es el portafolio profesional de Eduardo Anica González, a título personal. No vende productos ni servicios en línea. Para cualquier comunicación, usa el formulario de contacto."
        },
        {
          title: "Objeto",
          body:
            "El sitio presenta proyectos de ingeniería y análisis de datos con fines informativos y de presentación profesional."
        },
        {
          title: "Propiedad intelectual",
          body:
            "Los textos, el diseño y los casos de estudio son de su autor, salvo que se indique otra cosa. El código de cada proyecto se publica en GitHub con la licencia indicada en su repositorio. Los datasets públicos conservan la licencia de su fuente original."
        },
        {
          title: "Enlaces externos",
          body:
            "El sitio enlaza a GitHub, LinkedIn, Kaggle, Looker Studio y otras páginas de terceros. Su contenido y sus políticas de privacidad dependen de cada servicio."
        },
        {
          title: "Responsabilidad",
          body:
            "Las cifras de cada proyecto se presentan tal como se midieron en su momento y con fines demostrativos. No son asesoría profesional. Intento mantener la información correcta y al día, pero puede contener errores."
        },
        {
          title: "Datos personales y cookies",
          body:
            "Cómo se tratan tus datos está en la política de privacidad, y qué cookies se usan, en el aviso de cookies."
        }
      ]
    },
    cookies: {
      pageTitle: "Aviso de cookies",
      pageDescription:
        "Qué cookies usa este portafolio, para qué sirven y cómo eliminarlas.",
      headline: "Cookies en este sitio.",
      intro: "El sitio usa una sola cookie, y es funcional.",
      updated: "Actualizado: 30 de octubre de 2026",
      contactCta: "Ir a contacto",
      sections: [
        {
          title: "La cookie que se usa",
          body:
            "portfolio_locale guarda el idioma de la última página que visitaste (es o en) para mostrarte el sitio en ese idioma la próxima vez.",
          items: [
            "Nombre: portfolio_locale.",
            "Tipo: propia y funcional.",
            "Duración: 1 año.",
            "Contenido: solo el código de idioma, sin datos personales."
          ]
        },
        {
          title: "Analítica sin cookies",
          body:
            "Las visitas se miden con Vercel Web Analytics, que no usa cookies ni identificadores persistentes. Las métricas son agregadas y no permiten identificarte."
        },
        {
          title: "Por qué no hay banner",
          body:
            "La única cookie recuerda una preferencia de idioma y no se usa para analítica, publicidad ni seguimiento. Por eso el sitio no pide consentimiento."
        },
        {
          title: "Cómo eliminarla",
          body:
            "Puedes borrarla o bloquearla desde la configuración de tu navegador. El sitio sigue funcionando y elige el idioma según la configuración de tu navegador."
        }
      ]
    },
    notFound: {
      pageTitle: "Página no encontrada",
      pageDescription: "La página que buscas no existe.",
      label: "Error 404",
      headline: "Esta página no existe.",
      body:
        "Puede que el enlace esté mal escrito o que la página se haya movido. Los proyectos siguen en su lugar.",
      home: "Ir al inicio",
      projects: "Ver proyectos"
    },
    projects: {
      pageTitle: "Proyectos",
      pageDescription:
        "Casos de estudio de ingeniería y análisis de datos, con el código y las cifras medidas de cada proyecto.",
      headline: "Proyectos",
      description:
        "Cada uno explica el problema, cómo lo resolví y qué medí. El código está en GitHub y puedes filtrar por herramienta.",
      filterLabel: "Filtrar proyectos por herramienta",
      all: "Todos",
      featured: "Destacado",
      readCaseStudy: "Leer el caso",
      linksLabel: "Enlaces de {title}",
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
        label: "Datos",
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
        label: "Nube",
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
        label: "Reportes",
        tools: [
          "Power BI",
          "DAX",
          "Looker Studio",
          "Google Sheets",
          "Diseño de KPIs"
        ]
      },
      {
        label: "Modelos",
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
      contact: "Contact",
      privacy: "Privacy",
      legal: "Legal notice",
      cookies: "Cookies",
      footer: "Footer",
      homeLabel: "Eduardo Anica González home",
      primary: "Primary navigation",
      language: "Select language"
    },
    hero: {
      role: "Data & Analytics Engineer",
      summary:
        "I'm a data and analytics engineer. These are problems I solved with public data, each one with its code.",
      indexLabel: "Projects on this page"
    },
    home: {
      featuredTitle: "Projects",
      viewAllProjects: "All projects",
      noFeaturedTitle: "No projects published yet.",
      noFeaturedMessage:
        "The projects are being updated. In the meantime, the code is on my GitHub.",
      latestTitle: "More projects"
    },
    about: {
      title: "About me",
      body:
        "I've worked with operations, service, and business teams building pipelines, dashboards, automated reports, and internal tools. I like to leave behind processes anyone on the team can run again and check.",
      toolsLabel: "Tools by area"
    },
    contact: {
      title: "Contact",
      description: "If you have a role or a project, send me a message here",
      orOn: "or on",
      nameLabel: "Name",
      namePlaceholder: "Your name",
      emailLabel: "Email",
      emailPlaceholder: "you@email.com",
      messageLabel: "Message",
      messagePlaceholder: "Tell me what you need and what data you have.",
      companyLabel: "Company",
      submit: "Send",
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
      headline: "Responsible data practices for this portfolio.",
      intro:
        "This website is a professional portfolio focused on Data Analytics, Data Engineering, and Cloud.",
      updated: "Updated: October 30, 2026",
      contactCta: "Go to contact",
      sections: [
        {
          title: "Data controller",
          body:
            "The person responsible for the data you send through this site is Eduardo Anica González, owner of this portfolio."
        },
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
            "This site uses a functional cookie named portfolio_locale to remember the selected language. It also uses Vercel Web Analytics, which provides aggregated metrics and does not use cookies to identify visitors. Details are in the cookie notice."
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
    legal: {
      pageTitle: "Legal notice",
      pageDescription:
        "Owner, terms of use, and intellectual property of this professional portfolio.",
      headline: "Legal notice.",
      intro: "Who runs this site and the terms under which you can use it.",
      updated: "Updated: October 30, 2026",
      contactCta: "Go to contact",
      sections: [
        {
          title: "Owner",
          body:
            "This site is the personal professional portfolio of Eduardo Anica González. It does not sell products or services online. For any communication, use the contact form."
        },
        {
          title: "Purpose",
          body:
            "The site presents data engineering and analytics projects for informational and professional purposes."
        },
        {
          title: "Intellectual property",
          body:
            "Texts, design, and case studies belong to their author unless stated otherwise. Each project's code is published on GitHub under the license stated in its repository. Public datasets keep the license of their original source."
        },
        {
          title: "External links",
          body:
            "The site links to GitHub, LinkedIn, Kaggle, Looker Studio, and other third-party pages. Their content and privacy policies are up to each service."
        },
        {
          title: "Liability",
          body:
            "Project figures are presented as they were measured at the time and for demonstration purposes. They are not professional advice. I try to keep the information accurate and current, but it may contain errors."
        },
        {
          title: "Personal data and cookies",
          body:
            "How your data is handled is explained in the privacy policy, and which cookies are used, in the cookie notice."
        }
      ]
    },
    cookies: {
      pageTitle: "Cookie notice",
      pageDescription:
        "Which cookies this portfolio uses, what they are for, and how to remove them.",
      headline: "Cookies on this site.",
      intro: "The site uses a single cookie, and it is functional.",
      updated: "Updated: October 30, 2026",
      contactCta: "Go to contact",
      sections: [
        {
          title: "The cookie in use",
          body:
            "portfolio_locale stores the language of the last page you visited (es or en) so the site opens in that language next time.",
          items: [
            "Name: portfolio_locale.",
            "Type: first-party, functional.",
            "Duration: 1 year.",
            "Content: only the language code, no personal data."
          ]
        },
        {
          title: "Cookieless analytics",
          body:
            "Visits are measured with Vercel Web Analytics, which uses no cookies or persistent identifiers. Metrics are aggregated and cannot identify you."
        },
        {
          title: "Why there is no banner",
          body:
            "The only cookie remembers a language preference and is not used for analytics, advertising, or tracking. That is why the site does not ask for consent."
        },
        {
          title: "How to remove it",
          body:
            "You can delete or block it in your browser settings. The site keeps working and picks the language from your browser settings."
        }
      ]
    },
    notFound: {
      pageTitle: "Page not found",
      pageDescription: "The page you are looking for does not exist.",
      label: "Error 404",
      headline: "This page doesn't exist.",
      body:
        "The link may be mistyped or the page may have moved. The projects are still where they were.",
      home: "Go home",
      projects: "See projects"
    },
    projects: {
      pageTitle: "Projects",
      pageDescription:
        "Data engineering and analytics case studies, with the code and measured figures for each project.",
      headline: "Projects",
      description:
        "Each one explains the problem, how I solved it, and what I measured. The code is on GitHub, and you can filter by tool.",
      filterLabel: "Filter projects by tool",
      all: "All",
      featured: "Featured",
      readCaseStudy: "Read the case",
      linksLabel: "{title} links",
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
        label: "Data",
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
        label: "Cloud",
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
        label: "Reporting",
        tools: [
          "Power BI",
          "DAX",
          "Looker Studio",
          "Google Sheets",
          "KPI design"
        ]
      },
      {
        label: "Models",
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
