import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { blogPostsTable, mediaTable } from '../db/schema';
import { type CreateBlogPostInput } from '../schema';
import { createBlogPost } from '../handlers/create_blog_post';
import { eq } from 'drizzle-orm';

// Basic test input
const testInput: CreateBlogPostInput = {
  title: 'My First Blog Post',
  slug: 'my-first-blog-post',
  content: '<p>This is the main content of my blog post with <strong>rich text</strong> formatting.</p>',
  excerpt: 'A brief summary of my blog post for previews.',
  featured_image_id: null,
  status: 'draft',
  published_at: null
};

// Published blog post input
const publishedInput: CreateBlogPostInput = {
  title: 'Published Blog Post',
  slug: 'published-blog-post',
  content: '<p>This blog post is ready to be published.</p>',
  excerpt: 'Published post excerpt.',
  featured_image_id: null,
  status: 'published',
  published_at: new Date('2024-01-15T10:00:00Z')
};

describe('createBlogPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a draft blog post', async () => {
    const result = await createBlogPost(testInput);

    // Basic field validation
    expect(result.title).toEqual('My First Blog Post');
    expect(result.slug).toEqual('my-first-blog-post');
    expect(result.content).toEqual('<p>This is the main content of my blog post with <strong>rich text</strong> formatting.</p>');
    expect(result.excerpt).toEqual('A brief summary of my blog post for previews.');
    expect(result.featured_image_id).toBeNull();
    expect(result.status).toEqual('draft');
    expect(result.published_at).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a published blog post with published_at date', async () => {
    const result = await createBlogPost(publishedInput);

    expect(result.title).toEqual('Published Blog Post');
    expect(result.slug).toEqual('published-blog-post');
    expect(result.status).toEqual('published');
    expect(result.published_at).toBeInstanceOf(Date);
    expect(result.published_at?.getTime()).toEqual(new Date('2024-01-15T10:00:00Z').getTime());
  });

  it('should save blog post to database', async () => {
    const result = await createBlogPost(testInput);

    // Query using proper drizzle syntax
    const blogPosts = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, result.id))
      .execute();

    expect(blogPosts).toHaveLength(1);
    expect(blogPosts[0].title).toEqual('My First Blog Post');
    expect(blogPosts[0].slug).toEqual('my-first-blog-post');
    expect(blogPosts[0].content).toEqual('<p>This is the main content of my blog post with <strong>rich text</strong> formatting.</p>');
    expect(blogPosts[0].status).toEqual('draft');
    expect(blogPosts[0].created_at).toBeInstanceOf(Date);
    expect(blogPosts[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create blog post with featured image reference', async () => {
    // First create a media record to reference
    const mediaResult = await db.insert(mediaTable)
      .values({
        filename: 'blog-featured.jpg',
        original_name: 'blog-featured.jpg',
        mime_type: 'image/jpeg',
        size: 2048000,
        width: 1200,
        height: 800,
        alt_text: 'Featured image for blog post',
        description: 'A beautiful featured image'
      })
      .returning()
      .execute();

    const mediaId = mediaResult[0].id;

    // Create blog post with featured image
    const inputWithImage: CreateBlogPostInput = {
      ...testInput,
      title: 'Blog Post with Image',
      slug: 'blog-post-with-image',
      featured_image_id: mediaId
    };

    const result = await createBlogPost(inputWithImage);

    expect(result.featured_image_id).toEqual(mediaId);

    // Verify in database
    const blogPosts = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, result.id))
      .execute();

    expect(blogPosts[0].featured_image_id).toEqual(mediaId);
  });

  it('should handle minimal blog post data', async () => {
    const minimalInput: CreateBlogPostInput = {
      title: 'Minimal Post',
      slug: 'minimal-post',
      content: 'Just the essential content.',
      excerpt: null,
      featured_image_id: null,
      status: 'draft',
      published_at: null
    };

    const result = await createBlogPost(minimalInput);

    expect(result.title).toEqual('Minimal Post');
    expect(result.content).toEqual('Just the essential content.');
    expect(result.excerpt).toBeNull();
    expect(result.featured_image_id).toBeNull();
    expect(result.published_at).toBeNull();
  });

  it('should handle archived blog post status', async () => {
    const archivedInput: CreateBlogPostInput = {
      title: 'Archived Post',
      slug: 'archived-post',
      content: 'This post is archived.',
      excerpt: 'Archived content.',
      featured_image_id: null,
      status: 'archived',
      published_at: null
    };

    const result = await createBlogPost(archivedInput);

    expect(result.status).toEqual('archived');
    expect(result.published_at).toBeNull();
  });

  it('should enforce unique slug constraint', async () => {
    // Create first blog post
    await createBlogPost(testInput);

    // Try to create second blog post with same slug
    const duplicateInput: CreateBlogPostInput = {
      ...testInput,
      title: 'Different Title, Same Slug'
    };

    // Should throw error due to unique constraint on slug
    await expect(createBlogPost(duplicateInput)).rejects.toThrow(/duplicate key value violates unique constraint/i);
  });

  it('should handle rich text content with various HTML elements', async () => {
    const richTextInput: CreateBlogPostInput = {
      title: 'Rich Text Blog Post',
      slug: 'rich-text-blog-post',
      content: `
        <h2>Introduction</h2>
        <p>This is a paragraph with <strong>bold text</strong> and <em>italic text</em>.</p>
        <ul>
          <li>First list item</li>
          <li>Second list item with <a href="https://example.com">a link</a></li>
        </ul>
        <blockquote>This is a quote from someone important.</blockquote>
        <pre><code>console.log('Hello, World!');</code></pre>
      `.trim(),
      excerpt: 'A blog post demonstrating rich text formatting capabilities.',
      featured_image_id: null,
      status: 'draft',
      published_at: null
    };

    const result = await createBlogPost(richTextInput);

    expect(result.content).toContain('<h2>Introduction</h2>');
    expect(result.content).toContain('<strong>bold text</strong>');
    expect(result.content).toContain('<em>italic text</em>');
    expect(result.content).toContain('<ul>');
    expect(result.content).toContain('<blockquote>');
    expect(result.content).toContain('<pre><code>');
  });
});