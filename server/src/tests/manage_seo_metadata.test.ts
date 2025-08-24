import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { seoMetadataTable, blogPostsTable, staticPagesTable, projectsTable, mediaTable } from '../db/schema';
import { type CreateSeoMetadataInput, type UpdateSeoMetadataInput } from '../schema';
import { 
  createSeoMetadata, 
  getSeoMetadata, 
  updateSeoMetadata, 
  deleteSeoMetadata,
  generateSeoPreview
} from '../handlers/manage_seo_metadata';
import { eq } from 'drizzle-orm';

describe('SEO Metadata Management', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test content
  async function createTestContent() {
    // Create a blog post
    const [blogPost] = await db.insert(blogPostsTable)
      .values({
        title: 'Test Blog Post',
        slug: 'test-blog-post',
        content: 'Test content for blog post',
        excerpt: 'Test excerpt for blog post',
        status: 'published'
      })
      .returning()
      .execute();

    // Create a static page
    const [staticPage] = await db.insert(staticPagesTable)
      .values({
        title: 'Test Static Page',
        slug: 'test-static-page',
        content: 'Test content for static page',
        is_homepage: false,
        status: 'published'
      })
      .returning()
      .execute();

    // Create a project
    const [project] = await db.insert(projectsTable)
      .values({
        title: 'Test Project',
        slug: 'test-project',
        description: 'Test description for project',
        content: 'Test content for project',
        technologies: ['JavaScript', 'TypeScript'],
        status: 'published',
        sort_order: 1
      })
      .returning()
      .execute();

    // Create a test media file for social image
    const [media] = await db.insert(mediaTable)
      .values({
        filename: 'social-image.jpg',
        original_name: 'Social Image.jpg',
        mime_type: 'image/jpeg',
        size: 150000,
        width: 1200,
        height: 630,
        alt_text: 'Social media image'
      })
      .returning()
      .execute();

    return { blogPost, staticPage, project, media };
  }

  describe('createSeoMetadata', () => {
    it('should create SEO metadata for a blog post', async () => {
      const { blogPost, media } = await createTestContent();

      const testInput: CreateSeoMetadataInput = {
        content_type: 'blog_post',
        content_id: blogPost.id,
        meta_title: 'SEO Title for Blog Post',
        meta_description: 'SEO description for blog post',
        social_image_id: media.id,
        og_title: 'OG Title for Blog Post',
        og_description: 'OG description for blog post',
        twitter_title: 'Twitter Title for Blog Post',
        twitter_description: 'Twitter description for blog post',
        canonical_url: 'https://example.com/blog/test-blog-post',
        robots: 'index,follow'
      };

      const result = await createSeoMetadata(testInput);

      expect(result.id).toBeDefined();
      expect(result.content_type).toEqual('blog_post');
      expect(result.content_id).toEqual(blogPost.id);
      expect(result.meta_title).toEqual('SEO Title for Blog Post');
      expect(result.meta_description).toEqual('SEO description for blog post');
      expect(result.social_image_id).toEqual(media.id);
      expect(result.og_title).toEqual('OG Title for Blog Post');
      expect(result.og_description).toEqual('OG description for blog post');
      expect(result.twitter_title).toEqual('Twitter Title for Blog Post');
      expect(result.twitter_description).toEqual('Twitter description for blog post');
      expect(result.canonical_url).toEqual('https://example.com/blog/test-blog-post');
      expect(result.robots).toEqual('index,follow');
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create minimal SEO metadata with only required fields', async () => {
      const { staticPage } = await createTestContent();

      const testInput: CreateSeoMetadataInput = {
        content_type: 'static_page',
        content_id: staticPage.id,
        meta_title: null,
        meta_description: null,
        social_image_id: null,
        og_title: null,
        og_description: null,
        twitter_title: null,
        twitter_description: null,
        canonical_url: null,
        robots: null
      };

      const result = await createSeoMetadata(testInput);

      expect(result.content_type).toEqual('static_page');
      expect(result.content_id).toEqual(staticPage.id);
      expect(result.meta_title).toBeNull();
      expect(result.meta_description).toBeNull();
      expect(result.social_image_id).toBeNull();
    });

    it('should save SEO metadata to database', async () => {
      const { project } = await createTestContent();

      const testInput: CreateSeoMetadataInput = {
        content_type: 'project',
        content_id: project.id,
        meta_title: 'Project SEO Title',
        meta_description: 'Project SEO description',
        social_image_id: null,
        og_title: null,
        og_description: null,
        twitter_title: null,
        twitter_description: null,
        canonical_url: null,
        robots: null
      };

      const result = await createSeoMetadata(testInput);

      const saved = await db.select()
        .from(seoMetadataTable)
        .where(eq(seoMetadataTable.id, result.id))
        .execute();

      expect(saved).toHaveLength(1);
      expect(saved[0].content_type).toEqual('project');
      expect(saved[0].content_id).toEqual(project.id);
      expect(saved[0].meta_title).toEqual('Project SEO Title');
    });

    it('should throw error for non-existent content', async () => {
      const testInput: CreateSeoMetadataInput = {
        content_type: 'blog_post',
        content_id: 99999,
        meta_title: 'SEO Title',
        meta_description: null,
        social_image_id: null,
        og_title: null,
        og_description: null,
        twitter_title: null,
        twitter_description: null,
        canonical_url: null,
        robots: null
      };

      await expect(createSeoMetadata(testInput)).rejects.toThrow(/blog_post with id 99999 not found/i);
    });

    it('should throw error for non-existent social image', async () => {
      const { blogPost } = await createTestContent();

      const testInput: CreateSeoMetadataInput = {
        content_type: 'blog_post',
        content_id: blogPost.id,
        meta_title: 'SEO Title',
        meta_description: null,
        social_image_id: 99999,
        og_title: null,
        og_description: null,
        twitter_title: null,
        twitter_description: null,
        canonical_url: null,
        robots: null
      };

      await expect(createSeoMetadata(testInput)).rejects.toThrow(/social image with id 99999 not found/i);
    });
  });

  describe('getSeoMetadata', () => {
    it('should retrieve existing SEO metadata', async () => {
      const { blogPost } = await createTestContent();

      // Create SEO metadata first
      const testInput: CreateSeoMetadataInput = {
        content_type: 'blog_post',
        content_id: blogPost.id,
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

      await createSeoMetadata(testInput);

      const result = await getSeoMetadata('blog_post', blogPost.id);

      expect(result).not.toBeNull();
      expect(result!.content_type).toEqual('blog_post');
      expect(result!.content_id).toEqual(blogPost.id);
      expect(result!.meta_title).toEqual('Test SEO Title');
      expect(result!.meta_description).toEqual('Test SEO description');
    });

    it('should return null for non-existent SEO metadata', async () => {
      const { staticPage } = await createTestContent();

      const result = await getSeoMetadata('static_page', staticPage.id);

      expect(result).toBeNull();
    });
  });

  describe('updateSeoMetadata', () => {
    it('should update SEO metadata fields', async () => {
      const { project, media } = await createTestContent();

      // Create SEO metadata first
      const createInput: CreateSeoMetadataInput = {
        content_type: 'project',
        content_id: project.id,
        meta_title: 'Original Title',
        meta_description: 'Original description',
        social_image_id: null,
        og_title: null,
        og_description: null,
        twitter_title: null,
        twitter_description: null,
        canonical_url: null,
        robots: null
      };

      const created = await createSeoMetadata(createInput);

      const updateInput: UpdateSeoMetadataInput = {
        id: created.id,
        meta_title: 'Updated Title',
        meta_description: 'Updated description',
        social_image_id: media.id,
        og_title: 'Updated OG Title'
      };

      const result = await updateSeoMetadata(updateInput);

      expect(result.id).toEqual(created.id);
      expect(result.meta_title).toEqual('Updated Title');
      expect(result.meta_description).toEqual('Updated description');
      expect(result.social_image_id).toEqual(media.id);
      expect(result.og_title).toEqual('Updated OG Title');
      expect(result.updated_at.getTime()).toBeGreaterThan(created.updated_at.getTime());
    });

    it('should allow partial updates', async () => {
      const { blogPost } = await createTestContent();

      // Create SEO metadata first
      const createInput: CreateSeoMetadataInput = {
        content_type: 'blog_post',
        content_id: blogPost.id,
        meta_title: 'Original Title',
        meta_description: 'Original description',
        social_image_id: null,
        og_title: 'Original OG Title',
        og_description: null,
        twitter_title: null,
        twitter_description: null,
        canonical_url: null,
        robots: null
      };

      const created = await createSeoMetadata(createInput);

      const updateInput: UpdateSeoMetadataInput = {
        id: created.id,
        meta_title: 'Updated Title Only'
      };

      const result = await updateSeoMetadata(updateInput);

      expect(result.meta_title).toEqual('Updated Title Only');
      expect(result.meta_description).toEqual('Original description'); // Should remain unchanged
      expect(result.og_title).toEqual('Original OG Title'); // Should remain unchanged
    });

    it('should throw error for non-existent SEO metadata', async () => {
      const updateInput: UpdateSeoMetadataInput = {
        id: 99999,
        meta_title: 'Updated Title'
      };

      await expect(updateSeoMetadata(updateInput)).rejects.toThrow(/seo metadata with id 99999 not found/i);
    });

    it('should throw error for non-existent social image on update', async () => {
      const { blogPost } = await createTestContent();

      // Create SEO metadata first
      const createInput: CreateSeoMetadataInput = {
        content_type: 'blog_post',
        content_id: blogPost.id,
        meta_title: 'Original Title',
        meta_description: null,
        social_image_id: null,
        og_title: null,
        og_description: null,
        twitter_title: null,
        twitter_description: null,
        canonical_url: null,
        robots: null
      };

      const created = await createSeoMetadata(createInput);

      const updateInput: UpdateSeoMetadataInput = {
        id: created.id,
        social_image_id: 99999
      };

      await expect(updateSeoMetadata(updateInput)).rejects.toThrow(/social image with id 99999 not found/i);
    });
  });

  describe('deleteSeoMetadata', () => {
    it('should delete SEO metadata', async () => {
      const { staticPage } = await createTestContent();

      // Create SEO metadata first
      const testInput: CreateSeoMetadataInput = {
        content_type: 'static_page',
        content_id: staticPage.id,
        meta_title: 'Title to Delete',
        meta_description: null,
        social_image_id: null,
        og_title: null,
        og_description: null,
        twitter_title: null,
        twitter_description: null,
        canonical_url: null,
        robots: null
      };

      const created = await createSeoMetadata(testInput);

      await deleteSeoMetadata(created.id);

      const deleted = await db.select()
        .from(seoMetadataTable)
        .where(eq(seoMetadataTable.id, created.id))
        .execute();

      expect(deleted).toHaveLength(0);
    });

    it('should throw error for non-existent SEO metadata', async () => {
      await expect(deleteSeoMetadata(99999)).rejects.toThrow(/seo metadata with id 99999 not found/i);
    });
  });

  describe('generateSeoPreview', () => {
    it('should generate previews with SEO metadata', async () => {
      const { blogPost, media } = await createTestContent();

      // Create SEO metadata
      const testInput: CreateSeoMetadataInput = {
        content_type: 'blog_post',
        content_id: blogPost.id,
        meta_title: 'SEO Blog Title',
        meta_description: 'SEO blog description for search engines',
        social_image_id: media.id,
        og_title: 'Facebook Blog Title',
        og_description: 'Facebook blog description',
        twitter_title: 'Twitter Blog Title',
        twitter_description: 'Twitter blog description',
        canonical_url: 'https://example.com/blog/test-post',
        robots: null
      };

      await createSeoMetadata(testInput);

      const result = await generateSeoPreview('blog_post', blogPost.id);

      expect(result.googlePreview.title).toEqual('SEO Blog Title');
      expect(result.googlePreview.description).toEqual('SEO blog description for search engines');
      expect(result.googlePreview.url).toEqual('https://example.com/blog/test-post');

      expect(result.facebookPreview.title).toEqual('Facebook Blog Title');
      expect(result.facebookPreview.description).toEqual('Facebook blog description');
      expect(result.facebookPreview.image).toEqual('/uploads/social-image.jpg');

      expect(result.twitterPreview.title).toEqual('Twitter Blog Title');
      expect(result.twitterPreview.description).toEqual('Twitter blog description');
      expect(result.twitterPreview.image).toEqual('/uploads/social-image.jpg');
    });

    it('should generate previews with fallback values when no SEO metadata exists', async () => {
      const { project } = await createTestContent();

      const result = await generateSeoPreview('project', project.id);

      expect(result.googlePreview.title).toEqual('Test Project');
      expect(result.googlePreview.description).toEqual('Test description for project');
      expect(result.googlePreview.url).toEqual('https://example.com/projects/test-project');

      expect(result.facebookPreview.title).toEqual('Test Project');
      expect(result.facebookPreview.description).toEqual('Test description for project');
      expect(result.facebookPreview.image).toBeUndefined();

      expect(result.twitterPreview.title).toEqual('Test Project');
      expect(result.twitterPreview.description).toEqual('Test description for project');
      expect(result.twitterPreview.image).toBeUndefined();
    });

    it('should truncate long text in previews', async () => {
      const { staticPage } = await createTestContent();

      // Create very long SEO metadata
      const longTitle = 'This is a very long SEO title that exceeds the recommended length for search engine results and social media platforms';
      const longDescription = 'This is an extremely long SEO description that definitely exceeds the recommended character limits for search engines, Facebook, and Twitter. It contains way too much information and should be truncated appropriately by the preview generation function to ensure proper display across all platforms.';

      const testInput: CreateSeoMetadataInput = {
        content_type: 'static_page',
        content_id: staticPage.id,
        meta_title: longTitle,
        meta_description: longDescription,
        social_image_id: null,
        og_title: null,
        og_description: null,
        twitter_title: null,
        twitter_description: null,
        canonical_url: null,
        robots: null
      };

      await createSeoMetadata(testInput);

      const result = await generateSeoPreview('static_page', staticPage.id);

      expect(result.googlePreview.title.length).toBeLessThanOrEqual(60);
      expect(result.googlePreview.title).toMatch(/\.\.\.$/);
      expect(result.googlePreview.description.length).toBeLessThanOrEqual(160);
      expect(result.googlePreview.description).toMatch(/\.\.\.$/);

      expect(result.facebookPreview.title.length).toBeLessThanOrEqual(65);
      expect(result.facebookPreview.description.length).toBeLessThanOrEqual(125);

      expect(result.twitterPreview.title.length).toBeLessThanOrEqual(70);
      expect(result.twitterPreview.description.length).toBeLessThanOrEqual(200);
    });
  });
});