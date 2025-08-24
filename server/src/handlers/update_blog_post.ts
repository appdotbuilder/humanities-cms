import { db } from '../db';
import { blogPostsTable, seoMetadataTable, socialSharingSettingsTable } from '../db/schema';
import { type UpdateBlogPostInput, type BlogPost } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function updateBlogPost(input: UpdateBlogPostInput): Promise<BlogPost> {
  try {
    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.slug !== undefined) {
      updateData.slug = input.slug;
    }
    if (input.content !== undefined) {
      updateData.content = input.content;
    }
    if (input.excerpt !== undefined) {
      updateData.excerpt = input.excerpt;
    }
    if (input.featured_image_id !== undefined) {
      updateData.featured_image_id = input.featured_image_id;
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    if (input.published_at !== undefined) {
      updateData.published_at = input.published_at;
    }

    // Update the blog post
    const result = await db.update(blogPostsTable)
      .set(updateData)
      .where(eq(blogPostsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Blog post with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Blog post update failed:', error);
    throw error;
  }
}

export async function deleteBlogPost(id: number): Promise<void> {
  try {
    // Delete related SEO metadata first
    await db.delete(seoMetadataTable)
      .where(
        and(
          eq(seoMetadataTable.content_type, 'blog_post'),
          eq(seoMetadataTable.content_id, id)
        )
      )
      .execute();

    // Delete related social sharing settings
    await db.delete(socialSharingSettingsTable)
      .where(
        and(
          eq(socialSharingSettingsTable.content_type, 'blog_post'),
          eq(socialSharingSettingsTable.content_id, id)
        )
      )
      .execute();

    // Delete the blog post
    const result = await db.delete(blogPostsTable)
      .where(eq(blogPostsTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Blog post with id ${id} not found`);
    }
  } catch (error) {
    console.error('Blog post deletion failed:', error);
    throw error;
  }
}