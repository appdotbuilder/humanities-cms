import { db } from '../db';
import { imageGalleriesTable } from '../db/schema';
import { type CreateImageGalleryInput, type ImageGallery } from '../schema';

export const createImageGallery = async (input: CreateImageGalleryInput): Promise<ImageGallery> => {
  try {
    // Insert image gallery record
    const result = await db.insert(imageGalleriesTable)
      .values({
        title: input.title,
        description: input.description,
        slug: input.slug,
        status: input.status
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Image gallery creation failed:', error);
    throw error;
  }
};