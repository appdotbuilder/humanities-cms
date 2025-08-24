import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { blogPostsTable, mediaTable, seoMetadataTable, socialSharingSettingsTable } from '../db/schema';
import { type UpdateBlogPostInput, type CreateMediaInput, type CreateSeoMetadataInput, type CreateSocialSharingSettingsInput } from '../schema';
import { updateBlogPost, deleteBlogPost } from '../handlers/update_blog_post';
import { eq, and } from 'drizzle-orm';

// Test data
const testMediaInput: CreateMediaInput = {
  filename: 'test-image.jpg',
  original_name: 'test image.jpg',
  mime_type: 'image/jpeg',
  size: 1024000,
  width: 1920,
  height: 1080,
  alt_text: 'Test image',
  description: 'A test image for blog posts',
  folder_id: null
};

const createTestBlogPost = async (overrides: any = {}) => {
  const result = await db.insert(blogPostsTable)
    .values({
      title: 'Original Title',
      slug: 'original-slug',
      content: 'Original content here.',
      excerpt: 'Original excerpt',
      featured_image_id: null,
      status: 'draft',
      published_at: null,
      ...overrides
    })
    .returning()
    .execute();
  return result[0];
};

const createTestMedia = async () => {
  const result = await db.insert(mediaTable)
    .values(testMediaInput)
    .returning()
    .execute();
  return result[0];
};

const createTestSeoMetadata = async (blogPostId: number) => {
  const seoInput: CreateSeoMetadataInput = {
    content_type: 'blog_post',
    content_id: blogPostId,
    meta_title: 'SEO Title',
    meta_description: 'SEO Description',
    social_image_id: null,
    og_title: 'OG Title',
    og_description: 'OG Description',
    twitter_title: 'Twitter Title',
    twitter_description: 'Twitter Description',
    canonical_url: 'https://example.com/blog/test',
    robots: 'index,follow'
  };

  const result = await db.insert(seoMetadataTable)
    .values(seoInput)
    .returning()
    .execute();
  return result[0];
};

const createTestSocialSettings = async (blogPostId: number) => {
  const socialInput: CreateSocialSharingSettingsInput = {
    content_type: 'blog_post',
    content_id: blogPostId,
    enable_twitter: true,
    enable_facebook: true,
    enable_linkedin: false,
    enable_copy_link: true,
    custom_message: 'Check out this post!'
  };

  const result = await db.insert(socialSharingSettingsTable)
    .values(socialInput)
    .returning()
    .execute();
  return result[0];
};

describe('updateBlogPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update basic blog post fields', async () => {
    const blogPost = await createTestBlogPost();
    
    const updateInput: UpdateBlogPostInput = {
      id: blogPost.id,
      title: 'Updated Title',
      content: 'Updated content here.',
      status: 'published'
    };

    const result = await updateBlogPost(updateInput);

    expect(result.id).toEqual(blogPost.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.content).toEqual('Updated content here.');
    expect(result.status).toEqual('published');
    expect(result.slug).toEqual('original-slug'); // Should remain unchanged
    expect(result.excerpt).toEqual('Original excerpt'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(blogPost.updated_at.getTime());
  });

  it('should update all optional fields', async () => {
    const media = await createTestMedia();
    const blogPost = await createTestBlogPost();
    const publishedDate = new Date('2023-12-01T10:00:00Z');

    const updateInput: UpdateBlogPostInput = {
      id: blogPost.id,
      title: 'Complete Update',
      slug: 'complete-update-slug',
      content: 'Completely updated content.',
      excerpt: 'Updated excerpt here',
      featured_image_id: media.id,
      status: 'published',
      published_at: publishedDate
    };

    const result = await updateBlogPost(updateInput);

    expect(result.title).toEqual('Complete Update');
    expect(result.slug).toEqual('complete-update-slug');
    expect(result.content).toEqual('Completely updated content.');
    expect(result.excerpt).toEqual('Updated excerpt here');
    expect(result.featured_image_id).toEqual(media.id);
    expect(result.status).toEqual('published');
    expect(result.published_at).toEqual(publishedDate);
  });

  it('should handle null values for optional fields', async () => {
    const media = await createTestMedia();
    const blogPost = await createTestBlogPost({
      excerpt: 'Original excerpt',
      featured_image_id: media.id,
      published_at: new Date()
    });

    const updateInput: UpdateBlogPostInput = {
      id: blogPost.id,
      excerpt: null,
      featured_image_id: null,
      published_at: null
    };

    const result = await updateBlogPost(updateInput);

    expect(result.excerpt).toBeNull();
    expect(result.featured_image_id).toBeNull();
    expect(result.published_at).toBeNull();
  });

  it('should update only specified fields', async () => {
    const blogPost = await createTestBlogPost({
      title: 'Original Title',
      content: 'Original content',
      status: 'draft'
    });

    const updateInput: UpdateBlogPostInput = {
      id: blogPost.id,
      title: 'Only Title Updated'
    };

    const result = await updateBlogPost(updateInput);

    expect(result.title).toEqual('Only Title Updated');
    expect(result.content).toEqual('Original content'); // Unchanged
    expect(result.status).toEqual('draft'); // Unchanged
  });

  it('should persist changes to database', async () => {
    const blogPost = await createTestBlogPost();

    const updateInput: UpdateBlogPostInput = {
      id: blogPost.id,
      title: 'Database Persisted Title',
      status: 'published'
    };

    await updateBlogPost(updateInput);

    // Verify in database
    const savedPost = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, blogPost.id))
      .execute();

    expect(savedPost).toHaveLength(1);
    expect(savedPost[0].title).toEqual('Database Persisted Title');
    expect(savedPost[0].status).toEqual('published');
    expect(savedPost[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent blog post', async () => {
    const updateInput: UpdateBlogPostInput = {
      id: 99999,
      title: 'Non-existent Update'
    };

    await expect(updateBlogPost(updateInput)).rejects.toThrow(/Blog post with id 99999 not found/i);
  });

  it('should handle duplicate slug constraint violations', async () => {
    const blogPost1 = await createTestBlogPost();
    const blogPost2 = await createTestBlogPost({ title: 'Second Post', slug: 'second-post' });

    const updateInput: UpdateBlogPostInput = {
      id: blogPost2.id,
      slug: blogPost1.slug // Duplicate slug should violate unique constraint
    };

    await expect(updateBlogPost(updateInput)).rejects.toThrow();
  });
});

describe('deleteBlogPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete blog post successfully', async () => {
    const blogPost = await createTestBlogPost();

    await deleteBlogPost(blogPost.id);

    // Verify blog post is deleted
    const posts = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, blogPost.id))
      .execute();

    expect(posts).toHaveLength(0);
  });

  it('should delete related SEO metadata', async () => {
    const blogPost = await createTestBlogPost();
    const seoMetadata = await createTestSeoMetadata(blogPost.id);

    await deleteBlogPost(blogPost.id);

    // Verify SEO metadata is deleted
    const seoRecords = await db.select()
      .from(seoMetadataTable)
      .where(
        and(
          eq(seoMetadataTable.content_type, 'blog_post'),
          eq(seoMetadataTable.content_id, blogPost.id)
        )
      )
      .execute();

    expect(seoRecords).toHaveLength(0);
  });

  it('should delete related social sharing settings', async () => {
    const blogPost = await createTestBlogPost();
    const socialSettings = await createTestSocialSettings(blogPost.id);

    await deleteBlogPost(blogPost.id);

    // Verify social sharing settings are deleted
    const socialRecords = await db.select()
      .from(socialSharingSettingsTable)
      .where(
        and(
          eq(socialSharingSettingsTable.content_type, 'blog_post'),
          eq(socialSharingSettingsTable.content_id, blogPost.id)
        )
      )
      .execute();

    expect(socialRecords).toHaveLength(0);
  });

  it('should delete all related data in correct order', async () => {
    const blogPost = await createTestBlogPost();
    await createTestSeoMetadata(blogPost.id);
    await createTestSocialSettings(blogPost.id);

    await deleteBlogPost(blogPost.id);

    // Verify all records are deleted
    const posts = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, blogPost.id))
      .execute();

    const seoRecords = await db.select()
      .from(seoMetadataTable)
      .where(
        and(
          eq(seoMetadataTable.content_type, 'blog_post'),
          eq(seoMetadataTable.content_id, blogPost.id)
        )
      )
      .execute();

    const socialRecords = await db.select()
      .from(socialSharingSettingsTable)
      .where(
        and(
          eq(socialSharingSettingsTable.content_type, 'blog_post'),
          eq(socialSharingSettingsTable.content_id, blogPost.id)
        )
      )
      .execute();

    expect(posts).toHaveLength(0);
    expect(seoRecords).toHaveLength(0);
    expect(socialRecords).toHaveLength(0);
  });

  it('should not delete unrelated SEO metadata', async () => {
    const blogPost1 = await createTestBlogPost();
    const blogPost2 = await createTestBlogPost({ title: 'Other Post', slug: 'other-post' });
    
    const seo1 = await createTestSeoMetadata(blogPost1.id);
    const seo2 = await createTestSeoMetadata(blogPost2.id);

    await deleteBlogPost(blogPost1.id);

    // Verify only related SEO metadata is deleted
    const remainingSeo = await db.select()
      .from(seoMetadataTable)
      .where(
        and(
          eq(seoMetadataTable.content_type, 'blog_post'),
          eq(seoMetadataTable.content_id, blogPost2.id)
        )
      )
      .execute();

    expect(remainingSeo).toHaveLength(1);
    expect(remainingSeo[0].id).toEqual(seo2.id);
  });

  it('should throw error for non-existent blog post', async () => {
    await expect(deleteBlogPost(99999)).rejects.toThrow(/Blog post with id 99999 not found/i);
  });

  it('should handle deletion when no related data exists', async () => {
    const blogPost = await createTestBlogPost();

    // Should not throw error even without related data
    await expect(deleteBlogPost(blogPost.id)).resolves.toBeUndefined();

    // Verify blog post is still deleted
    const posts = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, blogPost.id))
      .execute();

    expect(posts).toHaveLength(0);
  });
});