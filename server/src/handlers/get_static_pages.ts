import { db } from '../db';
import { staticPagesTable } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { type StaticPage } from '../schema';

export async function getStaticPages(): Promise<StaticPage[]> {
  try {
    const result = await db.select()
      .from(staticPagesTable)
      .orderBy(desc(staticPagesTable.created_at))
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to fetch static pages:', error);
    throw error;
  }
}

export async function getStaticPage(id: number): Promise<StaticPage | null> {
  try {
    const result = await db.select()
      .from(staticPagesTable)
      .where(eq(staticPagesTable.id, id))
      .execute();

    return result[0] || null;
  } catch (error) {
    console.error('Failed to fetch static page by ID:', error);
    throw error;
  }
}

export async function getStaticPageBySlug(slug: string): Promise<StaticPage | null> {
  try {
    const result = await db.select()
      .from(staticPagesTable)
      .where(eq(staticPagesTable.slug, slug))
      .execute();

    return result[0] || null;
  } catch (error) {
    console.error('Failed to fetch static page by slug:', error);
    throw error;
  }
}

export async function getHomepage(): Promise<StaticPage | null> {
  try {
    const result = await db.select()
      .from(staticPagesTable)
      .where(eq(staticPagesTable.is_homepage, true))
      .execute();

    return result[0] || null;
  } catch (error) {
    console.error('Failed to fetch homepage:', error);
    throw error;
  }
}