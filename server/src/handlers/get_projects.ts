import { db } from '../db';
import { projectsTable } from '../db/schema';
import { type Project } from '../schema';
import { eq, asc } from 'drizzle-orm';

export async function getProjects(): Promise<Project[]> {
  try {
    const results = await db.select()
      .from(projectsTable)
      .orderBy(asc(projectsTable.sort_order))
      .execute();

    // Convert dates and return projects
    return results.map(project => ({
      ...project,
      technologies: project.technologies || [], // Ensure technologies is always an array
      created_at: new Date(project.created_at),
      updated_at: new Date(project.updated_at),
      start_date: project.start_date ? new Date(project.start_date) : null,
      end_date: project.end_date ? new Date(project.end_date) : null
    }));
  } catch (error) {
    console.error('Failed to get projects:', error);
    throw error;
  }
}

export async function getProject(id: number): Promise<Project | null> {
  try {
    const results = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const project = results[0];
    return {
      ...project,
      technologies: project.technologies || [], // Ensure technologies is always an array
      created_at: new Date(project.created_at),
      updated_at: new Date(project.updated_at),
      start_date: project.start_date ? new Date(project.start_date) : null,
      end_date: project.end_date ? new Date(project.end_date) : null
    };
  } catch (error) {
    console.error('Failed to get project by id:', error);
    throw error;
  }
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  try {
    const results = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.slug, slug))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const project = results[0];
    return {
      ...project,
      technologies: project.technologies || [], // Ensure technologies is always an array
      created_at: new Date(project.created_at),
      updated_at: new Date(project.updated_at),
      start_date: project.start_date ? new Date(project.start_date) : null,
      end_date: project.end_date ? new Date(project.end_date) : null
    };
  } catch (error) {
    console.error('Failed to get project by slug:', error);
    throw error;
  }
}