import type { FastifyInstance } from "fastify";

import type { ProjectRepository } from "../db/projectRepository.js";

export async function registerProjectRoutes(
  app: FastifyInstance,
  projects: ProjectRepository
): Promise<void> {
  app.get("/projects", async () => {
    return projects.list();
  });

  app.get<{ Params: { slug: string } }>("/projects/:slug", async (request, reply) => {
    const project = await projects.findBySlug(request.params.slug);

    if (!project) {
      return reply.code(404).send({
        error: "not_found",
        message: "Project not found."
      });
    }

    return project;
  });
}
