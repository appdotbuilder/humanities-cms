import { db } from '../db';
import { staticPagesTable, seoMetadataTable, socialSharingSettingsTable } from '../db/schema';
import { type UpdateStaticPageInput, type StaticPage } from '../schema';
import { eq, ne, and } from 'drizzle-orm';

export async function updateStaticPage(input: UpdateStaticPageInput): Promise<StaticPage> {
  try {
    // If setting this page as homepage, first unset any existing homepage
    if (input.is_homepage === true) {
      await db.update(staticPagesTable)
        .set({ is_homepage: false })
        .where(ne(staticPagesTable.id, input.id))
        .execute();
    }

    // Prepare update data with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.title !== undefined) updateData.title = input.title;
    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.content !== undefined) updateData.content = input.content;
    if (input.featured_image_id !== undefined) updateData.featured_image_id = input.featured_image_id;
    if (input.is_homepage !== undefined) updateData.is_homepage = input.is_homepage;
    if (input.status !== undefined) updateData.status = input.status;

    // Update the static page
    const result = await db.update(staticPagesTable)
      .set(updateData)
      .where(eq(staticPagesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Static page with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Static page update failed:', error);
    throw error;
  }
}

export async function deleteStaticPage(id: number): Promise<void> {
  try {
    // Delete related SEO metadata
    await db.delete(seoMetadataTable)
      .where(
        and(
          eq(seoMetadataTable.content_type, 'static_page'),
          eq(seoMetadataTable.content_id, id)
        )
      )
      .execute();

    // Delete related social sharing settings
    await db.delete(socialSharingSettingsTable)
      .where(
        and(
          eq(socialSharingSettingsTable.content_type, 'static_page'),
          eq(socialSharingSettingsTable.content_id, id)
        )
      )
      .execute();

    // Delete the static page
    const result = await db.delete(staticPagesTable)
      .where(eq(staticPagesTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Static page with id ${id} not found`);
    }
  } catch (error) {
    console.error('Static page deletion failed:', error);
    throw error;
  }
}