import { type Project } from '../schema';

export async function getProjects(): Promise<Project[]> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is fetching all projects ordered by sort_order,
  // with optional filtering by status and technology tags.
  return [];
}

export async function getProject(id: number): Promise<Project | null> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is fetching a single project by ID
  // including all related data for editing.
  return null;
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is fetching a single project by slug
  // for public viewing with all related data.
  return null;
}