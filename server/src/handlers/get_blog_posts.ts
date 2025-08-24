import { db } from '../db';
import { blogPostsTable } from '../db/schema';
import { type BlogPost } from '../schema';
import { eq, desc, sql } from 'drizzle-orm';

export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const results = await db.select()
      .from(blogPostsTable)
      .orderBy(
        sql`${blogPostsTable.published_at} DESC NULLS LAST`,
        desc(blogPostsTable.created_at)
      )
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch blog posts:', error);
    throw error;
  }
}

export async function getBlogPost(id: number): Promise<BlogPost | null> {
  try {
    const results = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, id))
      .limit(1)
      .execute();

    return results[0] || null;
  } catch (error) {
    console.error('Failed to fetch blog post:', error);
    throw error;
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const results = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.slug, slug))
      .limit(1)
      .execute();

    return results[0] || null;
  } catch (error) {
    console.error('Failed to fetch blog post by slug:', error);
    throw error;
  }
}