import { db } from '../db';
import { staticPagesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateStaticPageInput, type StaticPage } from '../schema';

export const createStaticPage = async (input: CreateStaticPageInput): Promise<StaticPage> => {
  try {
    // If this page is being set as homepage, first unset any existing homepage
    if (input.is_homepage) {
      await db.update(staticPagesTable)
        .set({ is_homepage: false })
        .where(eq(staticPagesTable.is_homepage, true))
        .execute();
    }

    // Insert the new static page
    const result = await db.insert(staticPagesTable)
      .values({
        title: input.title,
        slug: input.slug,
        content: input.content,
        featured_image_id: input.featured_image_id,
        is_homepage: input.is_homepage,
        status: input.status
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Static page creation failed:', error);
    throw error;
  }
};