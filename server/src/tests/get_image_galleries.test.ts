import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { imageGalleriesTable } from '../db/schema';
import { getImageGalleries, getImageGallery, getImageGalleryBySlug } from '../handlers/get_image_galleries';
import { eq } from 'drizzle-orm';

describe('getImageGalleries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no galleries exist', async () => {
    const result = await getImageGalleries();
    expect(result).toEqual([]);
  });

  it('should return all image galleries', async () => {
    // Create test galleries
    await db.insert(imageGalleriesTable).values([
      {
        title: 'Gallery 1',
        description: 'First test gallery',
        slug: 'gallery-1',
        status: 'published'
      },
      {
        title: 'Gallery 2',
        description: 'Second test gallery',
        slug: 'gallery-2',
        status: 'draft'
      }
    ]).execute();

    const result = await getImageGalleries();

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Gallery 1');
    expect(result[0].description).toEqual('First test gallery');
    expect(result[0].slug).toEqual('gallery-1');
    expect(result[0].status).toEqual('published');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].title).toEqual('Gallery 2');
    expect(result[1].description).toEqual('Second test gallery');
    expect(result[1].slug).toEqual('gallery-2');
    expect(result[1].status).toEqual('draft');
  });

  it('should handle galleries with null description', async () => {
    await db.insert(imageGalleriesTable).values({
      title: 'Gallery without description',
      description: null,
      slug: 'no-desc-gallery',
      status: 'published'
    }).execute();

    const result = await getImageGalleries();

    expect(result).toHaveLength(1);
    expect(result[0].description).toBeNull();
  });
});

describe('getImageGallery', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when gallery does not exist', async () => {
    const result = await getImageGallery(999);
    expect(result).toBeNull();
  });

  it('should return gallery by id', async () => {
    // Create test gallery
    const insertResult = await db.insert(imageGalleriesTable).values({
      title: 'Test Gallery',
      description: 'A gallery for testing',
      slug: 'test-gallery',
      status: 'published'
    }).returning().execute();

    const galleryId = insertResult[0].id;
    const result = await getImageGallery(galleryId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(galleryId);
    expect(result!.title).toEqual('Test Gallery');
    expect(result!.description).toEqual('A gallery for testing');
    expect(result!.slug).toEqual('test-gallery');
    expect(result!.status).toEqual('published');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return correct gallery when multiple exist', async () => {
    // Create multiple test galleries
    const insertResult = await db.insert(imageGalleriesTable).values([
      {
        title: 'Gallery 1',
        description: 'First gallery',
        slug: 'gallery-1',
        status: 'published'
      },
      {
        title: 'Gallery 2',
        description: 'Second gallery',
        slug: 'gallery-2',
        status: 'draft'
      }
    ]).returning().execute();

    const secondGalleryId = insertResult[1].id;
    const result = await getImageGallery(secondGalleryId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(secondGalleryId);
    expect(result!.title).toEqual('Gallery 2');
    expect(result!.description).toEqual('Second gallery');
    expect(result!.slug).toEqual('gallery-2');
    expect(result!.status).toEqual('draft');
  });
});

describe('getImageGalleryBySlug', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when gallery with slug does not exist', async () => {
    const result = await getImageGalleryBySlug('nonexistent-slug');
    expect(result).toBeNull();
  });

  it('should return gallery by slug', async () => {
    // Create test gallery
    const insertResult = await db.insert(imageGalleriesTable).values({
      title: 'Slug Test Gallery',
      description: 'Testing slug retrieval',
      slug: 'slug-test-gallery',
      status: 'published'
    }).returning().execute();

    const result = await getImageGalleryBySlug('slug-test-gallery');

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(insertResult[0].id);
    expect(result!.title).toEqual('Slug Test Gallery');
    expect(result!.description).toEqual('Testing slug retrieval');
    expect(result!.slug).toEqual('slug-test-gallery');
    expect(result!.status).toEqual('published');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return correct gallery when multiple exist with different slugs', async () => {
    // Create multiple test galleries
    await db.insert(imageGalleriesTable).values([
      {
        title: 'Gallery A',
        description: 'First gallery',
        slug: 'gallery-a',
        status: 'published'
      },
      {
        title: 'Gallery B',
        description: 'Second gallery',
        slug: 'gallery-b',
        status: 'draft'
      },
      {
        title: 'Gallery C',
        description: 'Third gallery',
        slug: 'gallery-c',
        status: 'archived'
      }
    ]).execute();

    const result = await getImageGalleryBySlug('gallery-b');

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Gallery B');
    expect(result!.description).toEqual('Second gallery');
    expect(result!.slug).toEqual('gallery-b');
    expect(result!.status).toEqual('draft');
  });

  it('should handle case-sensitive slug matching', async () => {
    // Create test gallery with lowercase slug
    await db.insert(imageGalleriesTable).values({
      title: 'Case Test Gallery',
      description: 'Testing case sensitivity',
      slug: 'case-test-gallery',
      status: 'published'
    }).execute();

    // Should find with exact match
    const exactMatch = await getImageGalleryBySlug('case-test-gallery');
    expect(exactMatch).not.toBeNull();
    expect(exactMatch!.slug).toEqual('case-test-gallery');

    // Should not find with different case
    const wrongCase = await getImageGalleryBySlug('Case-Test-Gallery');
    expect(wrongCase).toBeNull();
  });

  it('should verify gallery is persisted in database after retrieval', async () => {
    // Create test gallery
    const insertResult = await db.insert(imageGalleriesTable).values({
      title: 'Persistence Test',
      description: 'Testing database persistence',
      slug: 'persistence-test',
      status: 'published'
    }).returning().execute();

    // Retrieve via handler
    const handlerResult = await getImageGalleryBySlug('persistence-test');

    // Verify directly in database
    const dbResult = await db.select()
      .from(imageGalleriesTable)
      .where(eq(imageGalleriesTable.slug, 'persistence-test'))
      .execute();

    expect(dbResult).toHaveLength(1);
    expect(handlerResult!.id).toEqual(dbResult[0].id);
    expect(handlerResult!.title).toEqual(dbResult[0].title);
    expect(handlerResult!.slug).toEqual(dbResult[0].slug);
  });
});