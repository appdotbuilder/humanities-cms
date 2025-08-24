import { db } from '../db';
import { projectsTable, seoMetadataTable, socialSharingSettingsTable } from '../db/schema';
import { type UpdateProjectInput, type Project } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateProject(input: UpdateProjectInput): Promise<Project> {
  try {
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.title !== undefined) updateData.title = input.title;
    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.content !== undefined) updateData.content = input.content;
    if (input.featured_image_id !== undefined) updateData.featured_image_id = input.featured_image_id;
    if (input.project_url !== undefined) updateData.project_url = input.project_url;
    if (input.github_url !== undefined) updateData.github_url = input.github_url;
    if (input.technologies !== undefined) updateData.technologies = input.technologies;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.start_date !== undefined) updateData.start_date = input.start_date;
    if (input.end_date !== undefined) updateData.end_date = input.end_date;
    if (input.sort_order !== undefined) updateData.sort_order = input.sort_order;

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update the project record
    const result = await db.update(projectsTable)
      .set(updateData)
      .where(eq(projectsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Project with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Project update failed:', error);
    throw error;
  }
}

export async function deleteProject(id: number): Promise<void> {
  try {
    // Delete related SEO metadata first
    await db.delete(seoMetadataTable)
      .where(eq(seoMetadataTable.content_id, id))
      .execute();

    // Delete related social sharing settings
    await db.delete(socialSharingSettingsTable)
      .where(eq(socialSharingSettingsTable.content_id, id))
      .execute();

    // Delete the project record
    const result = await db.delete(projectsTable)
      .where(eq(projectsTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Project with id ${id} not found`);
    }
  } catch (error) {
    console.error('Project deletion failed:', error);
    throw error;
  }
}