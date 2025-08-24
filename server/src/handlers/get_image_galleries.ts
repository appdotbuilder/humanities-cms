import { db } from '../db';
import { imageGalleriesTable, galleryImagesTable, mediaTable } from '../db/schema';
import { type ImageGallery } from '../schema';
import { eq } from 'drizzle-orm';

export async function getImageGalleries(): Promise<ImageGallery[]> {
  try {
    const results = await db.select()
      .from(imageGalleriesTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch image galleries:', error);
    throw error;
  }
}

export async function getImageGallery(id: number): Promise<ImageGallery | null> {
  try {
    const results = await db.select()
      .from(imageGalleriesTable)
      .where(eq(imageGalleriesTable.id, id))
      .execute();

    return results[0] || null;
  } catch (error) {
    console.error('Failed to fetch image gallery:', error);
    throw error;
  }
}

export async function getImageGalleryBySlug(slug: string): Promise<ImageGallery | null> {
  try {
    const results = await db.select()
      .from(imageGalleriesTable)
      .where(eq(imageGalleriesTable.slug, slug))
      .execute();

    return results[0] || null;
  } catch (error) {
    console.error('Failed to fetch image gallery by slug:', error);
    throw error;
  }
}