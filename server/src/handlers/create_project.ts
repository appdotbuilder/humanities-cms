import { db } from '../db';
import { projectsTable } from '../db/schema';
import { type CreateProjectInput, type Project } from '../schema';

export const createProject = async (input: CreateProjectInput): Promise<Project> => {
  try {
    // Insert project record
    const result = await db.insert(projectsTable)
      .values({
        title: input.title,
        slug: input.slug,
        description: input.description,
        content: input.content,
        featured_image_id: input.featured_image_id,
        project_url: input.project_url,
        github_url: input.github_url,
        technologies: input.technologies,
        status: input.status,
        start_date: input.start_date,
        end_date: input.end_date,
        sort_order: input.sort_order
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Project creation failed:', error);
    throw error;
  }
};