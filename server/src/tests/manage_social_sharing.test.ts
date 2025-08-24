import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { socialSharingSettingsTable, blogPostsTable, staticPagesTable, projectsTable } from '../db/schema';
import { type CreateSocialSharingSettingsInput } from '../schema';
import { 
  createSocialSharingSettings, 
  getSocialSharingSettings, 
  updateSocialSharingSettings, 
  generateSharingUrls 
} from '../handlers/manage_social_sharing';
import { eq } from 'drizzle-orm';

// Test data
const testBlogPost = {
  title: 'Test Blog Post',
  slug: 'test-blog-post',
  content: 'This is a test blog post content',
  status: 'published' as const
};

const testStaticPage = {
  title: 'Test Page',
  slug: 'test-page',
  content: 'This is a test page content',
  is_homepage: false,
  status: 'published' as const
};

const testProject = {
  title: 'Test Project',
  slug: 'test-project',
  description: 'A test project description',
  technologies: ['TypeScript', 'React'],
  status: 'published' as const,
  sort_order: 0
};

const testSocialSharingInput: CreateSocialSharingSettingsInput = {
  content_type: 'blog_post',
  content_id: 1,
  enable_twitter: true,
  enable_facebook: true,
  enable_linkedin: false,
  enable_copy_link: true,
  custom_message: 'Check out this awesome blog post!'
};

describe('Social Sharing Settings Management', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createSocialSharingSettings', () => {
    it('should create social sharing settings for a blog post', async () => {
      // Create prerequisite blog post
      const blogResult = await db.insert(blogPostsTable).values(testBlogPost).returning().execute();
      const blogId = blogResult[0].id;

      const input = { ...testSocialSharingInput, content_id: blogId };
      const result = await createSocialSharingSettings(input);

      expect(result.content_type).toEqual('blog_post');
      expect(result.content_id).toEqual(blogId);
      expect(result.enable_twitter).toEqual(true);
      expect(result.enable_facebook).toEqual(true);
      expect(result.enable_linkedin).toEqual(false);
      expect(result.enable_copy_link).toEqual(true);
      expect(result.custom_message).toEqual('Check out this awesome blog post!');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create social sharing settings for a static page', async () => {
      // Create prerequisite static page
      const pageResult = await db.insert(staticPagesTable).values(testStaticPage).returning().execute();
      const pageId = pageResult[0].id;

      const input: CreateSocialSharingSettingsInput = {
        content_type: 'static_page',
        content_id: pageId,
        enable_twitter: false,
        enable_facebook: true,
        enable_linkedin: true,
        enable_copy_link: false,
        custom_message: null
      };

      const result = await createSocialSharingSettings(input);

      expect(result.content_type).toEqual('static_page');
      expect(result.content_id).toEqual(pageId);
      expect(result.enable_twitter).toEqual(false);
      expect(result.enable_facebook).toEqual(true);
      expect(result.enable_linkedin).toEqual(true);
      expect(result.enable_copy_link).toEqual(false);
      expect(result.custom_message).toBeNull();
    });

    it('should create social sharing settings for a project', async () => {
      // Create prerequisite project
      const projectResult = await db.insert(projectsTable).values(testProject).returning().execute();
      const projectId = projectResult[0].id;

      const input: CreateSocialSharingSettingsInput = {
        content_type: 'project',
        content_id: projectId,
        enable_twitter: true,
        enable_facebook: false,
        enable_linkedin: true,
        enable_copy_link: true,
        custom_message: 'Check out my latest project!'
      };

      const result = await createSocialSharingSettings(input);

      expect(result.content_type).toEqual('project');
      expect(result.content_id).toEqual(projectId);
      expect(result.custom_message).toEqual('Check out my latest project!');
    });

    it('should save social sharing settings to database', async () => {
      // Create prerequisite blog post
      const blogResult = await db.insert(blogPostsTable).values(testBlogPost).returning().execute();
      const blogId = blogResult[0].id;

      const input = { ...testSocialSharingInput, content_id: blogId };
      const result = await createSocialSharingSettings(input);

      // Verify in database
      const settings = await db.select()
        .from(socialSharingSettingsTable)
        .where(eq(socialSharingSettingsTable.id, result.id))
        .execute();

      expect(settings).toHaveLength(1);
      expect(settings[0].content_type).toEqual('blog_post');
      expect(settings[0].content_id).toEqual(blogId);
      expect(settings[0].enable_twitter).toEqual(true);
      expect(settings[0].custom_message).toEqual('Check out this awesome blog post!');
    });

    it('should throw error when content does not exist', async () => {
      const input = { ...testSocialSharingInput, content_id: 99999 };

      await expect(createSocialSharingSettings(input)).rejects.toThrow(/Content not found/i);
    });
  });

  describe('getSocialSharingSettings', () => {
    it('should return social sharing settings for existing content', async () => {
      // Create prerequisite blog post and settings
      const blogResult = await db.insert(blogPostsTable).values(testBlogPost).returning().execute();
      const blogId = blogResult[0].id;

      const input = { ...testSocialSharingInput, content_id: blogId };
      const created = await createSocialSharingSettings(input);

      const result = await getSocialSharingSettings('blog_post', blogId);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(created.id);
      expect(result!.content_type).toEqual('blog_post');
      expect(result!.content_id).toEqual(blogId);
      expect(result!.enable_twitter).toEqual(true);
      expect(result!.custom_message).toEqual('Check out this awesome blog post!');
    });

    it('should return null when no settings exist', async () => {
      // Create blog post but no settings
      const blogResult = await db.insert(blogPostsTable).values(testBlogPost).returning().execute();
      const blogId = blogResult[0].id;

      const result = await getSocialSharingSettings('blog_post', blogId);

      expect(result).toBeNull();
    });

    it('should return correct settings for different content types', async () => {
      // Create project and settings
      const projectResult = await db.insert(projectsTable).values(testProject).returning().execute();
      const projectId = projectResult[0].id;

      const input: CreateSocialSharingSettingsInput = {
        content_type: 'project',
        content_id: projectId,
        enable_twitter: false,
        enable_facebook: false,
        enable_linkedin: true,
        enable_copy_link: false,
        custom_message: 'Project sharing message'
      };

      await createSocialSharingSettings(input);

      const result = await getSocialSharingSettings('project', projectId);

      expect(result).not.toBeNull();
      expect(result!.content_type).toEqual('project');
      expect(result!.enable_linkedin).toEqual(true);
      expect(result!.enable_twitter).toEqual(false);
      expect(result!.custom_message).toEqual('Project sharing message');
    });
  });

  describe('updateSocialSharingSettings', () => {
    it('should update social sharing settings', async () => {
      // Create prerequisite blog post and settings
      const blogResult = await db.insert(blogPostsTable).values(testBlogPost).returning().execute();
      const blogId = blogResult[0].id;

      const input = { ...testSocialSharingInput, content_id: blogId };
      const created = await createSocialSharingSettings(input);

      const updateInput = {
        id: created.id,
        enable_twitter: false,
        enable_linkedin: true,
        custom_message: 'Updated message'
      };

      const result = await updateSocialSharingSettings(updateInput);

      expect(result.id).toEqual(created.id);
      expect(result.enable_twitter).toEqual(false);
      expect(result.enable_facebook).toEqual(true); // Unchanged
      expect(result.enable_linkedin).toEqual(true);
      expect(result.enable_copy_link).toEqual(true); // Unchanged
      expect(result.custom_message).toEqual('Updated message');
      expect(result.updated_at).not.toEqual(created.updated_at);
    });

    it('should update only provided fields', async () => {
      // Create prerequisite blog post and settings
      const blogResult = await db.insert(blogPostsTable).values(testBlogPost).returning().execute();
      const blogId = blogResult[0].id;

      const input = { ...testSocialSharingInput, content_id: blogId };
      const created = await createSocialSharingSettings(input);

      const updateInput = {
        id: created.id,
        enable_twitter: false
      };

      const result = await updateSocialSharingSettings(updateInput);

      expect(result.enable_twitter).toEqual(false);
      expect(result.enable_facebook).toEqual(true); // Unchanged
      expect(result.custom_message).toEqual('Check out this awesome blog post!'); // Unchanged
    });

    it('should handle null custom message', async () => {
      // Create prerequisite blog post and settings
      const blogResult = await db.insert(blogPostsTable).values(testBlogPost).returning().execute();
      const blogId = blogResult[0].id;

      const input = { ...testSocialSharingInput, content_id: blogId };
      const created = await createSocialSharingSettings(input);

      const updateInput = {
        id: created.id,
        custom_message: null
      };

      const result = await updateSocialSharingSettings(updateInput);

      expect(result.custom_message).toBeNull();
    });

    it('should throw error when settings do not exist', async () => {
      const updateInput = {
        id: 99999,
        enable_twitter: false
      };

      await expect(updateSocialSharingSettings(updateInput)).rejects.toThrow(/not found/i);
    });
  });

  describe('generateSharingUrls', () => {
    it('should generate sharing URLs with custom message', async () => {
      // Create prerequisite blog post and settings
      const blogResult = await db.insert(blogPostsTable).values(testBlogPost).returning().execute();
      const blogId = blogResult[0].id;

      const input = { ...testSocialSharingInput, content_id: blogId };
      await createSocialSharingSettings(input);

      const baseUrl = 'https://example.com';
      const result = await generateSharingUrls('blog_post', blogId, baseUrl);

      const expectedUrl = `${baseUrl}/blog_post/${blogId}`;
      const encodedUrl = encodeURIComponent(expectedUrl);
      const encodedMessage = encodeURIComponent('Check out this awesome blog post!');
      const encodedTitle = encodeURIComponent('Test Blog Post');

      expect(result.twitter).toEqual(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedMessage}`);
      expect(result.facebook).toEqual(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`);
      expect(result.linkedin).toEqual(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}`);
      expect(result.copyLink).toEqual(expectedUrl);
    });

    it('should generate sharing URLs without custom message', async () => {
      // Create prerequisite blog post without settings
      const blogResult = await db.insert(blogPostsTable).values(testBlogPost).returning().execute();
      const blogId = blogResult[0].id;

      const baseUrl = 'https://example.com';
      const result = await generateSharingUrls('blog_post', blogId, baseUrl);

      const expectedUrl = `${baseUrl}/blog_post/${blogId}`;
      const encodedUrl = encodeURIComponent(expectedUrl);
      const encodedTitle = encodeURIComponent('Test Blog Post');

      expect(result.twitter).toEqual(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`);
      expect(result.facebook).toEqual(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`);
      expect(result.linkedin).toEqual(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}`);
      expect(result.copyLink).toEqual(expectedUrl);
    });

    it('should generate URLs for different content types', async () => {
      // Create project
      const projectResult = await db.insert(projectsTable).values(testProject).returning().execute();
      const projectId = projectResult[0].id;

      const baseUrl = 'https://example.com';
      const result = await generateSharingUrls('project', projectId, baseUrl);

      const expectedUrl = `${baseUrl}/project/${projectId}`;
      const encodedUrl = encodeURIComponent(expectedUrl);
      const encodedTitle = encodeURIComponent('Test Project');

      expect(result.twitter).toContain(encodedUrl);
      expect(result.twitter).toContain(encodedTitle);
      expect(result.copyLink).toEqual(expectedUrl);
    });

    it('should handle URL encoding correctly', async () => {
      // Create blog post with special characters
      const specialBlogPost = {
        title: 'Test & Special "Characters" in Title',
        slug: 'test-special-chars',
        content: 'Content',
        status: 'published' as const
      };

      const blogResult = await db.insert(blogPostsTable).values(specialBlogPost).returning().execute();
      const blogId = blogResult[0].id;

      const input: CreateSocialSharingSettingsInput = {
        content_type: 'blog_post',
        content_id: blogId,
        enable_twitter: true,
        enable_facebook: true,
        enable_linkedin: true,
        enable_copy_link: true,
        custom_message: 'Message with & special chars!'
      };

      await createSocialSharingSettings(input);

      const baseUrl = 'https://example.com';
      const result = await generateSharingUrls('blog_post', blogId, baseUrl);

      const expectedUrl = `${baseUrl}/blog_post/${blogId}`;

      expect(result.twitter).toContain(encodeURIComponent('Message with & special chars!'));
      expect(result.linkedin).toContain(encodeURIComponent('Test & Special "Characters" in Title'));
      expect(result.copyLink).toEqual(expectedUrl);
    });

    it('should throw error when content does not exist', async () => {
      const baseUrl = 'https://example.com';

      await expect(generateSharingUrls('blog_post', 99999, baseUrl)).rejects.toThrow(/Content not found/i);
    });
  });
});