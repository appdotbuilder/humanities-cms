import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { staticPagesTable } from '../db/schema';
import { type CreateStaticPageInput } from '../schema';
import { getStaticPages, getStaticPage, getStaticPageBySlug, getHomepage } from '../handlers/get_static_pages';

// Test data
const testStaticPage1: CreateStaticPageInput = {
  title: 'About Us',
  slug: 'about-us',
  content: 'This is the about us page content.',
  featured_image_id: null,
  is_homepage: false,
  status: 'published'
};

const testStaticPage2: CreateStaticPageInput = {
  title: 'Contact',
  slug: 'contact',
  content: 'Contact us at example@test.com',
  featured_image_id: null,
  is_homepage: false,
  status: 'draft'
};

const testHomepage: CreateStaticPageInput = {
  title: 'Welcome Home',
  slug: 'home',
  content: 'Welcome to our homepage!',
  featured_image_id: null,
  is_homepage: true,
  status: 'published'
};

describe('getStaticPages', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no static pages exist', async () => {
    const result = await getStaticPages();
    expect(result).toEqual([]);
  });

  it('should return all static pages ordered by created_at desc', async () => {
    // Insert test data with delay to ensure different timestamps
    const page1 = await db.insert(staticPagesTable)
      .values(testStaticPage1)
      .returning()
      .execute();

    // Small delay to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const page2 = await db.insert(staticPagesTable)
      .values(testStaticPage2)
      .returning()
      .execute();

    const result = await getStaticPages();

    expect(result).toHaveLength(2);
    
    // Should be ordered by created_at desc (newest first)
    expect(result[0].title).toEqual('Contact'); // page2 was created later
    expect(result[1].title).toEqual('About Us'); // page1 was created first
    
    // Verify all fields are present
    expect(result[0].id).toBeDefined();
    expect(result[0].slug).toEqual('contact');
    expect(result[0].content).toEqual('Contact us at example@test.com');
    expect(result[0].status).toEqual('draft');
    expect(result[0].is_homepage).toEqual(false);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return pages with different statuses', async () => {
    await db.insert(staticPagesTable)
      .values([testStaticPage1, testStaticPage2, testHomepage])
      .execute();

    const result = await getStaticPages();

    expect(result).toHaveLength(3);
    
    const statuses = result.map(page => page.status);
    expect(statuses).toContain('published');
    expect(statuses).toContain('draft');
  });
});

describe('getStaticPage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when static page does not exist', async () => {
    const result = await getStaticPage(999);
    expect(result).toBeNull();
  });

  it('should return static page by ID', async () => {
    const inserted = await db.insert(staticPagesTable)
      .values(testStaticPage1)
      .returning()
      .execute();

    const result = await getStaticPage(inserted[0].id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(inserted[0].id);
    expect(result!.title).toEqual('About Us');
    expect(result!.slug).toEqual('about-us');
    expect(result!.content).toEqual('This is the about us page content.');
    expect(result!.status).toEqual('published');
    expect(result!.is_homepage).toEqual(false);
    expect(result!.featured_image_id).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return correct page when multiple pages exist', async () => {
    const inserted = await db.insert(staticPagesTable)
      .values([testStaticPage1, testStaticPage2])
      .returning()
      .execute();

    const result = await getStaticPage(inserted[1].id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(inserted[1].id);
    expect(result!.title).toEqual('Contact');
    expect(result!.slug).toEqual('contact');
  });
});

describe('getStaticPageBySlug', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when static page with slug does not exist', async () => {
    const result = await getStaticPageBySlug('nonexistent-slug');
    expect(result).toBeNull();
  });

  it('should return static page by slug', async () => {
    await db.insert(staticPagesTable)
      .values(testStaticPage1)
      .execute();

    const result = await getStaticPageBySlug('about-us');

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('About Us');
    expect(result!.slug).toEqual('about-us');
    expect(result!.content).toEqual('This is the about us page content.');
    expect(result!.status).toEqual('published');
    expect(result!.is_homepage).toEqual(false);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return correct page when multiple pages exist', async () => {
    await db.insert(staticPagesTable)
      .values([testStaticPage1, testStaticPage2])
      .execute();

    const result = await getStaticPageBySlug('contact');

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Contact');
    expect(result!.slug).toEqual('contact');
    expect(result!.content).toEqual('Contact us at example@test.com');
  });

  it('should be case sensitive for slug matching', async () => {
    await db.insert(staticPagesTable)
      .values(testStaticPage1)
      .execute();

    const result = await getStaticPageBySlug('ABOUT-US');
    expect(result).toBeNull();
  });
});

describe('getHomepage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when no homepage is set', async () => {
    // Insert regular pages but no homepage
    await db.insert(staticPagesTable)
      .values([testStaticPage1, testStaticPage2])
      .execute();

    const result = await getHomepage();
    expect(result).toBeNull();
  });

  it('should return the homepage when one exists', async () => {
    await db.insert(staticPagesTable)
      .values([testStaticPage1, testHomepage])
      .execute();

    const result = await getHomepage();

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Welcome Home');
    expect(result!.slug).toEqual('home');
    expect(result!.content).toEqual('Welcome to our homepage!');
    expect(result!.is_homepage).toEqual(true);
    expect(result!.status).toEqual('published');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return first homepage when multiple homepages exist', async () => {
    const homepage2: CreateStaticPageInput = {
      title: 'Another Homepage',
      slug: 'another-home',
      content: 'Another homepage content',
      featured_image_id: null,
      is_homepage: true,
      status: 'draft'
    };

    const inserted = await db.insert(staticPagesTable)
      .values([testHomepage, homepage2])
      .returning()
      .execute();

    const result = await getHomepage();

    expect(result).not.toBeNull();
    // Should return the first one found (database order)
    expect(result!.id).toEqual(inserted[0].id);
    expect(result!.title).toEqual('Welcome Home');
    expect(result!.is_homepage).toEqual(true);
  });

  it('should find homepage among regular pages', async () => {
    await db.insert(staticPagesTable)
      .values([testStaticPage1, testStaticPage2, testHomepage])
      .execute();

    const result = await getHomepage();

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Welcome Home');
    expect(result!.is_homepage).toEqual(true);
  });
});