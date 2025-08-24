import { db } from '../db';
import { galleryImagesTable, mediaTable, imageGalleriesTable } from '../db/schema';
import { type CreateGalleryImageInput, type GalleryImage } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function addImageToGallery(input: CreateGalleryImageInput): Promise<GalleryImage> {
  try {
    // Verify gallery exists
    const gallery = await db.select()
      .from(imageGalleriesTable)
      .where(eq(imageGalleriesTable.id, input.gallery_id))
      .execute();

    if (gallery.length === 0) {
      throw new Error(`Gallery with id ${input.gallery_id} not found`);
    }

    // Verify media exists
    const media = await db.select()
      .from(mediaTable)
      .where(eq(mediaTable.id, input.media_id))
      .execute();

    if (media.length === 0) {
      throw new Error(`Media with id ${input.media_id} not found`);
    }

    // Insert gallery image record
    const result = await db.insert(galleryImagesTable)
      .values({
        gallery_id: input.gallery_id,
        media_id: input.media_id,
        caption: input.caption,
        sort_order: input.sort_order
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Adding image to gallery failed:', error);
    throw error;
  }
}

export async function removeImageFromGallery(galleryImageId: number): Promise<void> {
  try {
    // Verify gallery image exists
    const galleryImage = await db.select()
      .from(galleryImagesTable)
      .where(eq(galleryImagesTable.id, galleryImageId))
      .execute();

    if (galleryImage.length === 0) {
      throw new Error(`Gallery image with id ${galleryImageId} not found`);
    }

    // Delete gallery image record (this doesn't delete the actual media file)
    await db.delete(galleryImagesTable)
      .where(eq(galleryImagesTable.id, galleryImageId))
      .execute();
  } catch (error) {
    console.error('Removing image from gallery failed:', error);
    throw error;
  }
}

export async function updateGalleryImageOrder(galleryId: number, imageOrders: { id: number; sort_order: number }[]): Promise<void> {
  try {
    // Verify gallery exists
    const gallery = await db.select()
      .from(imageGalleriesTable)
      .where(eq(imageGalleriesTable.id, galleryId))
      .execute();

    if (gallery.length === 0) {
      throw new Error(`Gallery with id ${galleryId} not found`);
    }

    // Update each gallery image's sort order
    for (const imageOrder of imageOrders) {
      // Verify gallery image exists and belongs to the specified gallery
      const galleryImage = await db.select()
        .from(galleryImagesTable)
        .where(
          and(
            eq(galleryImagesTable.id, imageOrder.id),
            eq(galleryImagesTable.gallery_id, galleryId)
          )
        )
        .execute();

      if (galleryImage.length === 0) {
        throw new Error(`Gallery image with id ${imageOrder.id} not found in gallery ${galleryId}`);
      }

      // Update sort order
      await db.update(galleryImagesTable)
        .set({ sort_order: imageOrder.sort_order })
        .where(eq(galleryImagesTable.id, imageOrder.id))
        .execute();
    }
  } catch (error) {
    console.error('Updating gallery image order failed:', error);
    throw error;
  }
}

export async function updateGalleryImageCaption(galleryImageId: number, caption: string | null): Promise<GalleryImage> {
  try {
    // Verify gallery image exists
    const existingGalleryImage = await db.select()
      .from(galleryImagesTable)
      .where(eq(galleryImagesTable.id, galleryImageId))
      .execute();

    if (existingGalleryImage.length === 0) {
      throw new Error(`Gallery image with id ${galleryImageId} not found`);
    }

    // Update caption
    const result = await db.update(galleryImagesTable)
      .set({ caption })
      .where(eq(galleryImagesTable.id, galleryImageId))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Updating gallery image caption failed:', error);
    throw error;
  }
}