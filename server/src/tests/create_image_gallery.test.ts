import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { imageGalleriesTable } from '../db/schema';
import { type CreateImageGalleryInput } from '../schema';
import { createImageGallery } from '../handlers/create_image_gallery';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateImageGalleryInput = {
  title: 'Test Gallery',
  description: 'A gallery for testing purposes',
  slug: 'test-gallery',
  status: 'published'
};

// Minimal test input
const minimalInput: CreateImageGalleryInput = {
  title: 'Minimal Gallery',
  description: null,
  slug: 'minimal-gallery',
  status: 'draft'
};

describe('createImageGallery', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an image gallery with all fields', async () => {
    const result = await createImageGallery(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Gallery');
    expect(result.description).toEqual('A gallery for testing purposes');
    expect(result.slug).toEqual('test-gallery');
    expect(result.status).toEqual('published');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an image gallery with minimal fields', async () => {
    const result = await createImageGallery(minimalInput);

    // Validate minimal fields
    expect(result.title).toEqual('Minimal Gallery');
    expect(result.description).toBeNull();
    expect(result.slug).toEqual('minimal-gallery');
    expect(result.status).toEqual('draft');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save image gallery to database', async () => {
    const result = await createImageGallery(testInput);

    // Query using proper drizzle syntax
    const galleries = await db.select()
      .from(imageGalleriesTable)
      .where(eq(imageGalleriesTable.id, result.id))
      .execute();

    expect(galleries).toHaveLength(1);
    expect(galleries[0].title).toEqual('Test Gallery');
    expect(galleries[0].description).toEqual('A gallery for testing purposes');
    expect(galleries[0].slug).toEqual('test-gallery');
    expect(galleries[0].status).toEqual('published');
    expect(galleries[0].created_at).toBeInstanceOf(Date);
    expect(galleries[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple galleries with different slugs', async () => {
    const input1: CreateImageGalleryInput = {
      title: 'First Gallery',
      description: 'First test gallery',
      slug: 'first-gallery',
      status: 'published'
    };

    const input2: CreateImageGalleryInput = {
      title: 'Second Gallery',
      description: 'Second test gallery',
      slug: 'second-gallery',
      status: 'draft'
    };

    const result1 = await createImageGallery(input1);
    const result2 = await createImageGallery(input2);

    // Verify both galleries were created with different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.slug).toEqual('first-gallery');
    expect(result2.slug).toEqual('second-gallery');
    expect(result1.status).toEqual('published');
    expect(result2.status).toEqual('draft');

    // Verify both exist in database
    const galleries = await db.select()
      .from(imageGalleriesTable)
      .execute();

    expect(galleries).toHaveLength(2);
  });

  it('should handle duplicate slug constraint violation', async () => {
    // Create first gallery
    await createImageGallery(testInput);

    // Attempt to create second gallery with same slug
    const duplicateInput: CreateImageGalleryInput = {
      title: 'Duplicate Gallery',
      description: 'Should fail due to duplicate slug',
      slug: 'test-gallery', // Same slug as testInput
      status: 'draft'
    };

    // Should throw error due to unique constraint on slug
    await expect(createImageGallery(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should handle all status values correctly', async () => {
    const draftInput: CreateImageGalleryInput = {
      title: 'Draft Gallery',
      description: 'Draft status gallery',
      slug: 'draft-gallery',
      status: 'draft'
    };

    const publishedInput: CreateImageGalleryInput = {
      title: 'Published Gallery',
      description: 'Published status gallery',
      slug: 'published-gallery',
      status: 'published'
    };

    const archivedInput: CreateImageGalleryInput = {
      title: 'Archived Gallery',
      description: 'Archived status gallery',
      slug: 'archived-gallery',
      status: 'archived'
    };

    const draftResult = await createImageGallery(draftInput);
    const publishedResult = await createImageGallery(publishedInput);
    const archivedResult = await createImageGallery(archivedInput);

    expect(draftResult.status).toEqual('draft');
    expect(publishedResult.status).toEqual('published');
    expect(archivedResult.status).toEqual('archived');
  });
});