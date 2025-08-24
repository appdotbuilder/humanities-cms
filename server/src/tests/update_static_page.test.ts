import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { staticPagesTable, seoMetadataTable, socialSharingSettingsTable } from '../db/schema';
import { type UpdateStaticPageInput, type CreateStaticPageInput, type CreateSeoMetadataInput, type CreateSocialSharingSettingsInput } from '../schema';
import { updateStaticPage, deleteStaticPage } from '../handlers/update_static_page';
import { eq, and } from 'drizzle-orm';

// Test data
const testPage: CreateStaticPageInput = {
  title: 'Test Page',
  slug: 'test-page',
  content: 'Test content',
  featured_image_id: null,
  is_homepage: false,
  status: 'draft'
};

const testHomepage: CreateStaticPageInput = {
  title: 'Homepage',
  slug: 'homepage',
  content: 'Homepage content',
  featured_image_id: null,
  is_homepage: true,
  status: 'published'
};

describe('updateStaticPage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a static page with provided fields', async () => {
    // Create test page
    const created = await db.insert(staticPagesTable)
      .values(testPage)
      .returning()
      .execute();
    const pageId = created[0].id;

    // Update page
    const updateInput: UpdateStaticPageInput = {
      id: pageId,
      title: 'Updated Test Page',
      content: 'Updated content',
      status: 'published'
    };

    const result = await updateStaticPage(updateInput);

    expect(result.id).toEqual(pageId);
    expect(result.title).toEqual('Updated Test Page');
    expect(result.content).toEqual('Updated content');
    expect(result.status).toEqual('published');
    expect(result.slug).toEqual('test-page'); // Should remain unchanged
    expect(result.is_homepage).toEqual(false); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields and leave others unchanged', async () => {
    // Create test page
    const created = await db.insert(staticPagesTable)
      .values(testPage)
      .returning()
      .execute();
    const pageId = created[0].id;

    // Update only title
    const updateInput: UpdateStaticPageInput = {
      id: pageId,
      title: 'New Title Only'
    };

    const result = await updateStaticPage(updateInput);

    expect(result.title).toEqual('New Title Only');
    expect(result.slug).toEqual('test-page'); // Unchanged
    expect(result.content).toEqual('Test content'); // Unchanged
    expect(result.status).toEqual('draft'); // Unchanged
    expect(result.is_homepage).toEqual(false); // Unchanged
  });

  it('should handle setting page as homepage and unset other homepage', async () => {
    // Create existing homepage
    const homepageResult = await db.insert(staticPagesTable)
      .values(testHomepage)
      .returning()
      .execute();
    const homepageId = homepageResult[0].id;

    // Create another page
    const pageResult = await db.insert(staticPagesTable)
      .values(testPage)
      .returning()
      .execute();
    const pageId = pageResult[0].id;

    // Set the second page as homepage
    const updateInput: UpdateStaticPageInput = {
      id: pageId,
      is_homepage: true
    };

    const result = await updateStaticPage(updateInput);

    // Check that new page is homepage
    expect(result.is_homepage).toEqual(true);

    // Check that old homepage is no longer homepage
    const oldHomepage = await db.select()
      .from(staticPagesTable)
      .where(eq(staticPagesTable.id, homepageId))
      .execute();

    expect(oldHomepage[0].is_homepage).toEqual(false);
  });

  it('should allow setting is_homepage to false without affecting other pages', async () => {
    // Create homepage
    const homepageResult = await db.insert(staticPagesTable)
      .values(testHomepage)
      .returning()
      .execute();
    const homepageId = homepageResult[0].id;

    // Create another page
    const pageResult = await db.insert(staticPagesTable)
      .values({ ...testPage, is_homepage: true })
      .returning()
      .execute();
    const pageId = pageResult[0].id;

    // Set the page's homepage to false
    const updateInput: UpdateStaticPageInput = {
      id: pageId,
      is_homepage: false
    };

    const result = await updateStaticPage(updateInput);

    expect(result.is_homepage).toEqual(false);

    // Check that original homepage is still homepage
    const originalHomepage = await db.select()
      .from(staticPagesTable)
      .where(eq(staticPagesTable.id, homepageId))
      .execute();

    expect(originalHomepage[0].is_homepage).toEqual(true);
  });

  it('should throw error when updating non-existent page', async () => {
    const updateInput: UpdateStaticPageInput = {
      id: 999,
      title: 'Non-existent page'
    };

    await expect(updateStaticPage(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should save updated data to database', async () => {
    // Create test page
    const created = await db.insert(staticPagesTable)
      .values(testPage)
      .returning()
      .execute();
    const pageId = created[0].id;

    // Update page
    const updateInput: UpdateStaticPageInput = {
      id: pageId,
      title: 'Database Test',
      status: 'published'
    };

    await updateStaticPage(updateInput);

    // Verify in database
    const pages = await db.select()
      .from(staticPagesTable)
      .where(eq(staticPagesTable.id, pageId))
      .execute();

    expect(pages).toHaveLength(1);
    expect(pages[0].title).toEqual('Database Test');
    expect(pages[0].status).toEqual('published');
    expect(pages[0].updated_at).toBeInstanceOf(Date);
  });
});

describe('deleteStaticPage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a static page', async () => {
    // Create test page
    const created = await db.insert(staticPagesTable)
      .values(testPage)
      .returning()
      .execute();
    const pageId = created[0].id;

    // Delete page
    await deleteStaticPage(pageId);

    // Verify page is deleted
    const pages = await db.select()
      .from(staticPagesTable)
      .where(eq(staticPagesTable.id, pageId))
      .execute();

    expect(pages).toHaveLength(0);
  });

  it('should delete related SEO metadata when deleting page', async () => {
    // Create test page
    const pageResult = await db.insert(staticPagesTable)
      .values(testPage)
      .returning()
      .execute();
    const pageId = pageResult[0].id;

    // Create related SEO metadata
    const seoInput: CreateSeoMetadataInput = {
      content_type: 'static_page',
      content_id: pageId,
      meta_title: 'Test SEO Title',
      meta_description: 'Test SEO description',
      social_image_id: null,
      og_title: null,
      og_description: null,
      twitter_title: null,
      twitter_description: null,
      canonical_url: null,
      robots: null
    };

    await db.insert(seoMetadataTable)
      .values(seoInput)
      .execute();

    // Delete page
    await deleteStaticPage(pageId);

    // Verify SEO metadata is deleted
    const seoMetadata = await db.select()
      .from(seoMetadataTable)
      .where(
        and(
          eq(seoMetadataTable.content_type, 'static_page'),
          eq(seoMetadataTable.content_id, pageId)
        )
      )
      .execute();

    expect(seoMetadata).toHaveLength(0);
  });

  it('should delete related social sharing settings when deleting page', async () => {
    // Create test page
    const pageResult = await db.insert(staticPagesTable)
      .values(testPage)
      .returning()
      .execute();
    const pageId = pageResult[0].id;

    // Create related social sharing settings
    const socialInput: CreateSocialSharingSettingsInput = {
      content_type: 'static_page',
      content_id: pageId,
      enable_twitter: true,
      enable_facebook: true,
      enable_linkedin: false,
      enable_copy_link: true,
      custom_message: null
    };

    await db.insert(socialSharingSettingsTable)
      .values(socialInput)
      .execute();

    // Delete page
    await deleteStaticPage(pageId);

    // Verify social sharing settings are deleted
    const socialSettings = await db.select()
      .from(socialSharingSettingsTable)
      .where(
        and(
          eq(socialSharingSettingsTable.content_type, 'static_page'),
          eq(socialSharingSettingsTable.content_id, pageId)
        )
      )
      .execute();

    expect(socialSettings).toHaveLength(0);
  });

  it('should delete page and all related data in single operation', async () => {
    // Create test page
    const pageResult = await db.insert(staticPagesTable)
      .values(testPage)
      .returning()
      .execute();
    const pageId = pageResult[0].id;

    // Create related data
    const seoInput: CreateSeoMetadataInput = {
      content_type: 'static_page',
      content_id: pageId,
      meta_title: 'Test SEO',
      meta_description: null,
      social_image_id: null,
      og_title: null,
      og_description: null,
      twitter_title: null,
      twitter_description: null,
      canonical_url: null,
      robots: null
    };

    const socialInput: CreateSocialSharingSettingsInput = {
      content_type: 'static_page',
      content_id: pageId,
      enable_twitter: false,
      enable_facebook: true,
      enable_linkedin: true,
      enable_copy_link: false,
      custom_message: 'Custom message'
    };

    await db.insert(seoMetadataTable).values(seoInput).execute();
    await db.insert(socialSharingSettingsTable).values(socialInput).execute();

    // Delete page
    await deleteStaticPage(pageId);

    // Verify everything is deleted
    const pages = await db.select()
      .from(staticPagesTable)
      .where(eq(staticPagesTable.id, pageId))
      .execute();

    const seoData = await db.select()
      .from(seoMetadataTable)
      .where(
        and(
          eq(seoMetadataTable.content_type, 'static_page'),
          eq(seoMetadataTable.content_id, pageId)
        )
      )
      .execute();

    const socialData = await db.select()
      .from(socialSharingSettingsTable)
      .where(
        and(
          eq(socialSharingSettingsTable.content_type, 'static_page'),
          eq(socialSharingSettingsTable.content_id, pageId)
        )
      )
      .execute();

    expect(pages).toHaveLength(0);
    expect(seoData).toHaveLength(0);
    expect(socialData).toHaveLength(0);
  });

  it('should throw error when deleting non-existent page', async () => {
    await expect(deleteStaticPage(999)).rejects.toThrow(/not found/i);
  });
});