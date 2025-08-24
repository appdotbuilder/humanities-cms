import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { blogPostsTable, mediaTable } from '../db/schema';
import { type CreateBlogPostInput } from '../schema';
import { getBlogPosts, getBlogPost, getBlogPostBySlug } from '../handlers/get_blog_posts';

// Test data
const testBlogPost1: CreateBlogPostInput = {
  title: 'First Blog Post',
  slug: 'first-blog-post',
  content: 'This is the content of the first blog post.',
  excerpt: 'First post excerpt',
  featured_image_id: null,
  status: 'published',
  published_at: new Date('2023-01-01T10:00:00Z')
};

const testBlogPost2: CreateBlogPostInput = {
  title: 'Second Blog Post',
  slug: 'second-blog-post',
  content: 'This is the content of the second blog post.',
  excerpt: 'Second post excerpt',
  featured_image_id: null,
  status: 'draft',
  published_at: null
};

const testBlogPost3: CreateBlogPostInput = {
  title: 'Third Blog Post',
  slug: 'third-blog-post',
  content: 'This is the content of the third blog post.',
  excerpt: null,
  featured_image_id: null,
  status: 'published',
  published_at: new Date('2023-02-01T10:00:00Z')
};

describe('getBlogPosts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no blog posts exist', async () => {
    const result = await getBlogPosts();
    expect(result).toEqual([]);
  });

  it('should return all blog posts ordered by published_at desc', async () => {
    // Create test blog posts with specific timing to ensure predictable created_at order
    await db.insert(blogPostsTable).values(testBlogPost1).execute();
    // Small delay to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    await db.insert(blogPostsTable).values(testBlogPost2).execute();
    await new Promise(resolve => setTimeout(resolve, 10));
    await db.insert(blogPostsTable).values(testBlogPost3).execute();

    const result = await getBlogPosts();
    
    expect(result).toHaveLength(3);
    
    // Should be ordered by published_at desc with NULLS LAST
    // Third post: published_at = 2023-02-01 (latest)
    // First post: published_at = 2023-01-01 (earlier) 
    // Second post: published_at = null (comes last due to NULLS LAST)
    expect(result[0].title).toBe('Third Blog Post');
    expect(result[1].title).toBe('First Blog Post');
    expect(result[2].title).toBe('Second Blog Post');
  });

  it('should return blog posts with all required fields', async () => {
    await db.insert(blogPostsTable).values(testBlogPost1).execute();

    const result = await getBlogPosts();
    
    expect(result).toHaveLength(1);
    const blogPost = result[0];
    
    expect(blogPost.id).toBeDefined();
    expect(blogPost.title).toBe('First Blog Post');
    expect(blogPost.slug).toBe('first-blog-post');
    expect(blogPost.content).toBe('This is the content of the first blog post.');
    expect(blogPost.excerpt).toBe('First post excerpt');
    expect(blogPost.featured_image_id).toBeNull();
    expect(blogPost.status).toBe('published');
    expect(blogPost.published_at).toBeInstanceOf(Date);
    expect(blogPost.created_at).toBeInstanceOf(Date);
    expect(blogPost.updated_at).toBeInstanceOf(Date);
  });

  it('should handle blog posts with featured images', async () => {
    // Create a media record first
    const mediaResult = await db.insert(mediaTable).values({
      filename: 'test-image.jpg',
      original_name: 'test-image.jpg',
      mime_type: 'image/jpeg',
      size: 1024,
      width: 800,
      height: 600,
      alt_text: 'Test image',
      description: 'A test image',
      folder_id: null
    }).returning().execute();

    const mediaId = mediaResult[0].id;

    // Create blog post with featured image
    await db.insert(blogPostsTable).values({
      ...testBlogPost1,
      featured_image_id: mediaId
    }).execute();

    const result = await getBlogPosts();
    
    expect(result).toHaveLength(1);
    expect(result[0].featured_image_id).toBe(mediaId);
  });
});

describe('getBlogPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when blog post does not exist', async () => {
    const result = await getBlogPost(999);
    expect(result).toBeNull();
  });

  it('should return blog post by id', async () => {
    const insertResult = await db.insert(blogPostsTable)
      .values(testBlogPost1)
      .returning()
      .execute();
    
    const blogPostId = insertResult[0].id;
    const result = await getBlogPost(blogPostId);
    
    expect(result).not.toBeNull();
    expect(result!.id).toBe(blogPostId);
    expect(result!.title).toBe('First Blog Post');
    expect(result!.slug).toBe('first-blog-post');
    expect(result!.content).toBe('This is the content of the first blog post.');
    expect(result!.excerpt).toBe('First post excerpt');
    expect(result!.status).toBe('published');
    expect(result!.published_at).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return correct blog post when multiple posts exist', async () => {
    const insertResult = await db.insert(blogPostsTable)
      .values([testBlogPost1, testBlogPost2])
      .returning()
      .execute();
    
    const secondPostId = insertResult[1].id;
    const result = await getBlogPost(secondPostId);
    
    expect(result).not.toBeNull();
    expect(result!.id).toBe(secondPostId);
    expect(result!.title).toBe('Second Blog Post');
    expect(result!.slug).toBe('second-blog-post');
    expect(result!.status).toBe('draft');
    expect(result!.published_at).toBeNull();
  });
});

describe('getBlogPostBySlug', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when blog post with slug does not exist', async () => {
    const result = await getBlogPostBySlug('non-existent-slug');
    expect(result).toBeNull();
  });

  it('should return blog post by slug', async () => {
    await db.insert(blogPostsTable).values(testBlogPost1).execute();
    
    const result = await getBlogPostBySlug('first-blog-post');
    
    expect(result).not.toBeNull();
    expect(result!.title).toBe('First Blog Post');
    expect(result!.slug).toBe('first-blog-post');
    expect(result!.content).toBe('This is the content of the first blog post.');
    expect(result!.excerpt).toBe('First post excerpt');
    expect(result!.status).toBe('published');
    expect(result!.published_at).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return correct blog post when multiple posts exist', async () => {
    await db.insert(blogPostsTable)
      .values([testBlogPost1, testBlogPost2, testBlogPost3])
      .execute();
    
    const result = await getBlogPostBySlug('second-blog-post');
    
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Second Blog Post');
    expect(result!.slug).toBe('second-blog-post');
    expect(result!.status).toBe('draft');
    expect(result!.published_at).toBeNull();
  });

  it('should handle blog posts with null excerpt', async () => {
    await db.insert(blogPostsTable).values(testBlogPost3).execute();
    
    const result = await getBlogPostBySlug('third-blog-post');
    
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Third Blog Post');
    expect(result!.excerpt).toBeNull();
  });

  it('should be case-sensitive for slug matching', async () => {
    await db.insert(blogPostsTable).values(testBlogPost1).execute();
    
    // Should not match uppercase
    const upperResult = await getBlogPostBySlug('FIRST-BLOG-POST');
    expect(upperResult).toBeNull();
    
    // Should match exact case
    const exactResult = await getBlogPostBySlug('first-blog-post');
    expect(exactResult).not.toBeNull();
    expect(exactResult!.slug).toBe('first-blog-post');
  });
});