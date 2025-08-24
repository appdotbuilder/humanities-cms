import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { mediaTable, imageGalleriesTable, galleryImagesTable, mediaFoldersTable } from '../db/schema';
import { type CreateGalleryImageInput } from '../schema';
import { 
  addImageToGallery,
  removeImageFromGallery,
  updateGalleryImageOrder,
  updateGalleryImageCaption 
} from '../handlers/manage_gallery_images';
import { eq, and } from 'drizzle-orm';

// Test data
const testMediaFolder = {
  name: 'Test Folder'
};

const testMedia = {
  filename: 'test.jpg',
  original_name: 'test-image.jpg',
  mime_type: 'image/jpeg',
  size: 1024000,
  width: 1920,
  height: 1080,
  alt_text: 'Test image',
  description: 'A test image'
};

const testGallery = {
  title: 'Test Gallery',
  description: 'A test gallery',
  slug: 'test-gallery',
  status: 'published' as const
};

describe('Gallery Image Management', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('addImageToGallery', () => {
    it('should add an image to a gallery', async () => {
      // Create prerequisite data
      const [folder] = await db.insert(mediaFoldersTable)
        .values(testMediaFolder)
        .returning()
        .execute();

      const [media] = await db.insert(mediaTable)
        .values({
          ...testMedia,
          folder_id: folder.id
        })
        .returning()
        .execute();

      const [gallery] = await db.insert(imageGalleriesTable)
        .values(testGallery)
        .returning()
        .execute();

      const input: CreateGalleryImageInput = {
        gallery_id: gallery.id,
        media_id: media.id,
        caption: 'Test caption',
        sort_order: 1
      };

      const result = await addImageToGallery(input);

      // Verify result
      expect(result.id).toBeDefined();
      expect(result.gallery_id).toBe(gallery.id);
      expect(result.media_id).toBe(media.id);
      expect(result.caption).toBe('Test caption');
      expect(result.sort_order).toBe(1);
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should save gallery image to database', async () => {
      // Create prerequisite data
      const [folder] = await db.insert(mediaFoldersTable)
        .values(testMediaFolder)
        .returning()
        .execute();

      const [media] = await db.insert(mediaTable)
        .values({
          ...testMedia,
          folder_id: folder.id
        })
        .returning()
        .execute();

      const [gallery] = await db.insert(imageGalleriesTable)
        .values(testGallery)
        .returning()
        .execute();

      const input: CreateGalleryImageInput = {
        gallery_id: gallery.id,
        media_id: media.id,
        caption: 'Database test caption',
        sort_order: 2
      };

      const result = await addImageToGallery(input);

      // Verify in database
      const galleryImages = await db.select()
        .from(galleryImagesTable)
        .where(eq(galleryImagesTable.id, result.id))
        .execute();

      expect(galleryImages).toHaveLength(1);
      expect(galleryImages[0].gallery_id).toBe(gallery.id);
      expect(galleryImages[0].media_id).toBe(media.id);
      expect(galleryImages[0].caption).toBe('Database test caption');
      expect(galleryImages[0].sort_order).toBe(2);
    });

    it('should handle null caption', async () => {
      // Create prerequisite data
      const [folder] = await db.insert(mediaFoldersTable)
        .values(testMediaFolder)
        .returning()
        .execute();

      const [media] = await db.insert(mediaTable)
        .values({
          ...testMedia,
          folder_id: folder.id
        })
        .returning()
        .execute();

      const [gallery] = await db.insert(imageGalleriesTable)
        .values(testGallery)
        .returning()
        .execute();

      const input: CreateGalleryImageInput = {
        gallery_id: gallery.id,
        media_id: media.id,
        caption: null,
        sort_order: 0
      };

      const result = await addImageToGallery(input);

      expect(result.caption).toBeNull();
    });

    it('should throw error when gallery does not exist', async () => {
      // Create media but no gallery
      const [folder] = await db.insert(mediaFoldersTable)
        .values(testMediaFolder)
        .returning()
        .execute();

      const [media] = await db.insert(mediaTable)
        .values({
          ...testMedia,
          folder_id: folder.id
        })
        .returning()
        .execute();

      const input: CreateGalleryImageInput = {
        gallery_id: 999,
        media_id: media.id,
        caption: 'Test caption',
        sort_order: 1
      };

      expect(addImageToGallery(input)).rejects.toThrow(/gallery.*not found/i);
    });

    it('should throw error when media does not exist', async () => {
      // Create gallery but no media
      const [gallery] = await db.insert(imageGalleriesTable)
        .values(testGallery)
        .returning()
        .execute();

      const input: CreateGalleryImageInput = {
        gallery_id: gallery.id,
        media_id: 999,
        caption: 'Test caption',
        sort_order: 1
      };

      expect(addImageToGallery(input)).rejects.toThrow(/media.*not found/i);
    });
  });

  describe('removeImageFromGallery', () => {
    it('should remove an image from gallery', async () => {
      // Create prerequisite data
      const [folder] = await db.insert(mediaFoldersTable)
        .values(testMediaFolder)
        .returning()
        .execute();

      const [media] = await db.insert(mediaTable)
        .values({
          ...testMedia,
          folder_id: folder.id
        })
        .returning()
        .execute();

      const [gallery] = await db.insert(imageGalleriesTable)
        .values(testGallery)
        .returning()
        .execute();

      const [galleryImage] = await db.insert(galleryImagesTable)
        .values({
          gallery_id: gallery.id,
          media_id: media.id,
          caption: 'To be removed',
          sort_order: 1
        })
        .returning()
        .execute();

      await removeImageFromGallery(galleryImage.id);

      // Verify removal
      const remaining = await db.select()
        .from(galleryImagesTable)
        .where(eq(galleryImagesTable.id, galleryImage.id))
        .execute();

      expect(remaining).toHaveLength(0);
    });

    it('should not delete the actual media file', async () => {
      // Create prerequisite data
      const [folder] = await db.insert(mediaFoldersTable)
        .values(testMediaFolder)
        .returning()
        .execute();

      const [media] = await db.insert(mediaTable)
        .values({
          ...testMedia,
          folder_id: folder.id
        })
        .returning()
        .execute();

      const [gallery] = await db.insert(imageGalleriesTable)
        .values(testGallery)
        .returning()
        .execute();

      const [galleryImage] = await db.insert(galleryImagesTable)
        .values({
          gallery_id: gallery.id,
          media_id: media.id,
          caption: 'To be removed',
          sort_order: 1
        })
        .returning()
        .execute();

      await removeImageFromGallery(galleryImage.id);

      // Verify media still exists
      const mediaStillExists = await db.select()
        .from(mediaTable)
        .where(eq(mediaTable.id, media.id))
        .execute();

      expect(mediaStillExists).toHaveLength(1);
    });

    it('should throw error when gallery image does not exist', async () => {
      expect(removeImageFromGallery(999)).rejects.toThrow(/gallery image.*not found/i);
    });
  });

  describe('updateGalleryImageOrder', () => {
    it('should update sort order of multiple images', async () => {
      // Create prerequisite data
      const [folder] = await db.insert(mediaFoldersTable)
        .values(testMediaFolder)
        .returning()
        .execute();

      const [media1] = await db.insert(mediaTable)
        .values({
          ...testMedia,
          filename: 'test1.jpg',
          folder_id: folder.id
        })
        .returning()
        .execute();

      const [media2] = await db.insert(mediaTable)
        .values({
          ...testMedia,
          filename: 'test2.jpg',
          folder_id: folder.id
        })
        .returning()
        .execute();

      const [gallery] = await db.insert(imageGalleriesTable)
        .values(testGallery)
        .returning()
        .execute();

      const [galleryImage1] = await db.insert(galleryImagesTable)
        .values({
          gallery_id: gallery.id,
          media_id: media1.id,
          caption: 'Image 1',
          sort_order: 1
        })
        .returning()
        .execute();

      const [galleryImage2] = await db.insert(galleryImagesTable)
        .values({
          gallery_id: gallery.id,
          media_id: media2.id,
          caption: 'Image 2',
          sort_order: 2
        })
        .returning()
        .execute();

      // Update order (swap positions)
      const newOrder = [
        { id: galleryImage1.id, sort_order: 2 },
        { id: galleryImage2.id, sort_order: 1 }
      ];

      await updateGalleryImageOrder(gallery.id, newOrder);

      // Verify new order
      const updatedImages = await db.select()
        .from(galleryImagesTable)
        .where(eq(galleryImagesTable.gallery_id, gallery.id))
        .execute();

      const image1 = updatedImages.find(img => img.id === galleryImage1.id);
      const image2 = updatedImages.find(img => img.id === galleryImage2.id);

      expect(image1?.sort_order).toBe(2);
      expect(image2?.sort_order).toBe(1);
    });

    it('should throw error when gallery does not exist', async () => {
      const imageOrders = [{ id: 1, sort_order: 1 }];

      expect(updateGalleryImageOrder(999, imageOrders))
        .rejects.toThrow(/gallery.*not found/i);
    });

    it('should throw error when gallery image does not exist', async () => {
      // Create gallery but no images
      const [gallery] = await db.insert(imageGalleriesTable)
        .values(testGallery)
        .returning()
        .execute();

      const imageOrders = [{ id: 999, sort_order: 1 }];

      expect(updateGalleryImageOrder(gallery.id, imageOrders))
        .rejects.toThrow(/gallery image.*not found/i);
    });

    it('should throw error when image belongs to different gallery', async () => {
      // Create two galleries
      const [gallery1] = await db.insert(imageGalleriesTable)
        .values(testGallery)
        .returning()
        .execute();

      const [gallery2] = await db.insert(imageGalleriesTable)
        .values({
          ...testGallery,
          title: 'Gallery 2',
          slug: 'test-gallery-2'
        })
        .returning()
        .execute();

      const [folder] = await db.insert(mediaFoldersTable)
        .values(testMediaFolder)
        .returning()
        .execute();

      const [media] = await db.insert(mediaTable)
        .values({
          ...testMedia,
          folder_id: folder.id
        })
        .returning()
        .execute();

      // Add image to gallery2
      const [galleryImage] = await db.insert(galleryImagesTable)
        .values({
          gallery_id: gallery2.id,
          media_id: media.id,
          caption: 'Wrong gallery',
          sort_order: 1
        })
        .returning()
        .execute();

      // Try to update order using gallery1 id
      const imageOrders = [{ id: galleryImage.id, sort_order: 2 }];

      expect(updateGalleryImageOrder(gallery1.id, imageOrders))
        .rejects.toThrow(/gallery image.*not found in gallery/i);
    });
  });

  describe('updateGalleryImageCaption', () => {
    it('should update image caption', async () => {
      // Create prerequisite data
      const [folder] = await db.insert(mediaFoldersTable)
        .values(testMediaFolder)
        .returning()
        .execute();

      const [media] = await db.insert(mediaTable)
        .values({
          ...testMedia,
          folder_id: folder.id
        })
        .returning()
        .execute();

      const [gallery] = await db.insert(imageGalleriesTable)
        .values(testGallery)
        .returning()
        .execute();

      const [galleryImage] = await db.insert(galleryImagesTable)
        .values({
          gallery_id: gallery.id,
          media_id: media.id,
          caption: 'Original caption',
          sort_order: 1
        })
        .returning()
        .execute();

      const result = await updateGalleryImageCaption(galleryImage.id, 'Updated caption');

      expect(result.id).toBe(galleryImage.id);
      expect(result.caption).toBe('Updated caption');
      expect(result.sort_order).toBe(1); // Should remain unchanged
    });

    it('should set caption to null', async () => {
      // Create prerequisite data
      const [folder] = await db.insert(mediaFoldersTable)
        .values(testMediaFolder)
        .returning()
        .execute();

      const [media] = await db.insert(mediaTable)
        .values({
          ...testMedia,
          folder_id: folder.id
        })
        .returning()
        .execute();

      const [gallery] = await db.insert(imageGalleriesTable)
        .values(testGallery)
        .returning()
        .execute();

      const [galleryImage] = await db.insert(galleryImagesTable)
        .values({
          gallery_id: gallery.id,
          media_id: media.id,
          caption: 'To be cleared',
          sort_order: 1
        })
        .returning()
        .execute();

      const result = await updateGalleryImageCaption(galleryImage.id, null);

      expect(result.caption).toBeNull();
    });

    it('should save updated caption to database', async () => {
      // Create prerequisite data
      const [folder] = await db.insert(mediaFoldersTable)
        .values(testMediaFolder)
        .returning()
        .execute();

      const [media] = await db.insert(mediaTable)
        .values({
          ...testMedia,
          folder_id: folder.id
        })
        .returning()
        .execute();

      const [gallery] = await db.insert(imageGalleriesTable)
        .values(testGallery)
        .returning()
        .execute();

      const [galleryImage] = await db.insert(galleryImagesTable)
        .values({
          gallery_id: gallery.id,
          media_id: media.id,
          caption: 'Original caption',
          sort_order: 1
        })
        .returning()
        .execute();

      await updateGalleryImageCaption(galleryImage.id, 'Database updated caption');

      // Verify in database
      const updated = await db.select()
        .from(galleryImagesTable)
        .where(eq(galleryImagesTable.id, galleryImage.id))
        .execute();

      expect(updated).toHaveLength(1);
      expect(updated[0].caption).toBe('Database updated caption');
    });

    it('should throw error when gallery image does not exist', async () => {
      expect(updateGalleryImageCaption(999, 'New caption'))
        .rejects.toThrow(/gallery image.*not found/i);
    });
  });
});