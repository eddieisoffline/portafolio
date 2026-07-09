import type { FastifyInstance } from "fastify";

import type { ProjectRepository } from "../db/projectRepository.js";
import { normalizeLocale } from "../i18n/locales.js";

export async function registerProjectRoutes(
  app: FastifyInstance,
  projects: ProjectRepository
): Promise<void> {
  app.get<{ Querystring: { lang?: string } }>("/projects", async (request) => {
    return projects.list(normalizeLocale(request.query.lang));
  });

  app.get<{ Params: { slug: string }; Querystring: { lang?: string } }>(
    "/projects/:slug",
    async (request, reply) => {
      const project = await projects.findBySlug(
        request.params.slug,
        normalizeLocale(request.query.lang)
      );

      if (!project) {
        return reply.code(404).send({
          error: "not_found",
          message: "Project not found."
        });
      }

      return project;
    }
  );
}
