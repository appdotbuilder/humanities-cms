import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { staticPagesTable, mediaTable } from '../db/schema';
import { type CreateStaticPageInput } from '../schema';
import { createStaticPage } from '../handlers/create_static_page';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateStaticPageInput = {
  title: 'About Us',
  slug: 'about-us',
  content: 'This is our about page content with rich text and formatting.',
  featured_image_id: null,
  is_homepage: false,
  status: 'published'
};

const homepageInput: CreateStaticPageInput = {
  title: 'Homepage',
  slug: 'home',
  content: 'Welcome to our homepage with hero content.',
  featured_image_id: null,
  is_homepage: true,
  status: 'published'
};

describe('createStaticPage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a static page', async () => {
    const result = await createStaticPage(testInput);

    // Validate returned data
    expect(result.title).toEqual('About Us');
    expect(result.slug).toEqual('about-us');
    expect(result.content).toEqual(testInput.content);
    expect(result.featured_image_id).toBeNull();
    expect(result.is_homepage).toBe(false);
    expect(result.status).toEqual('published');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save static page to database', async () => {
    const result = await createStaticPage(testInput);

    const pages = await db.select()
      .from(staticPagesTable)
      .where(eq(staticPagesTable.id, result.id))
      .execute();

    expect(pages).toHaveLength(1);
    expect(pages[0].title).toEqual('About Us');
    expect(pages[0].slug).toEqual('about-us');
    expect(pages[0].content).toEqual(testInput.content);
    expect(pages[0].is_homepage).toBe(false);
    expect(pages[0].status).toEqual('published');
    expect(pages[0].created_at).toBeInstanceOf(Date);
    expect(pages[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle homepage designation correctly', async () => {
    const result = await createStaticPage(homepageInput);

    expect(result.is_homepage).toBe(true);
    expect(result.title).toEqual('Homepage');
    expect(result.slug).toEqual('home');

    // Verify it was saved as homepage
    const homepages = await db.select()
      .from(staticPagesTable)
      .where(eq(staticPagesTable.is_homepage, true))
      .execute();

    expect(homepages).toHaveLength(1);
    expect(homepages[0].id).toEqual(result.id);
  });

  it('should ensure only one homepage exists', async () => {
    // Create first homepage
    const firstHomepage = await createStaticPage(homepageInput);
    expect(firstHomepage.is_homepage).toBe(true);

    // Create second homepage
    const secondHomepageInput: CreateStaticPageInput = {
      ...homepageInput,
      title: 'New Homepage',
      slug: 'new-home'
    };
    const secondHomepage = await createStaticPage(secondHomepageInput);

    // Verify second homepage is set correctly
    expect(secondHomepage.is_homepage).toBe(true);

    // Verify only one homepage exists in database
    const homepages = await db.select()
      .from(staticPagesTable)
      .where(eq(staticPagesTable.is_homepage, true))
      .execute();

    expect(homepages).toHaveLength(1);
    expect(homepages[0].id).toEqual(secondHomepage.id);
    expect(homepages[0].title).toEqual('New Homepage');

    // Verify first homepage was unset
    const firstPageCheck = await db.select()
      .from(staticPagesTable)
      .where(eq(staticPagesTable.id, firstHomepage.id))
      .execute();

    expect(firstPageCheck[0].is_homepage).toBe(false);
  });

  it('should create page with featured image reference', async () => {
    // First create a media item
    const mediaResult = await db.insert(mediaTable)
      .values({
        filename: 'hero-image.jpg',
        original_name: 'hero-image.jpg',
        mime_type: 'image/jpeg',
        size: 1024000,
        width: 1920,
        height: 1080,
        alt_text: 'Hero image for static page'
      })
      .returning()
      .execute();

    const inputWithImage: CreateStaticPageInput = {
      ...testInput,
      title: 'Page with Image',
      slug: 'page-with-image',
      featured_image_id: mediaResult[0].id
    };

    const result = await createStaticPage(inputWithImage);

    expect(result.featured_image_id).toEqual(mediaResult[0].id);

    // Verify in database
    const savedPage = await db.select()
      .from(staticPagesTable)
      .where(eq(staticPagesTable.id, result.id))
      .execute();

    expect(savedPage[0].featured_image_id).toEqual(mediaResult[0].id);
  });

  it('should handle draft status correctly', async () => {
    const draftInput: CreateStaticPageInput = {
      ...testInput,
      title: 'Draft Page',
      slug: 'draft-page',
      status: 'draft'
    };

    const result = await createStaticPage(draftInput);

    expect(result.status).toEqual('draft');

    // Verify draft status in database
    const savedPage = await db.select()
      .from(staticPagesTable)
      .where(eq(staticPagesTable.id, result.id))
      .execute();

    expect(savedPage[0].status).toEqual('draft');
  });

  it('should handle archived status correctly', async () => {
    const archivedInput: CreateStaticPageInput = {
      ...testInput,
      title: 'Archived Page',
      slug: 'archived-page',
      status: 'archived'
    };

    const result = await createStaticPage(archivedInput);

    expect(result.status).toEqual('archived');
  });
});