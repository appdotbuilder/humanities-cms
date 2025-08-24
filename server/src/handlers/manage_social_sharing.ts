import { db } from '../db';
import { socialSharingSettingsTable, blogPostsTable, staticPagesTable, projectsTable } from '../db/schema';
import { type CreateSocialSharingSettingsInput, type SocialSharingSettings } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function createSocialSharingSettings(input: CreateSocialSharingSettingsInput): Promise<SocialSharingSettings> {
  try {
    // Validate content exists before creating social sharing settings
    await validateContentExists(input.content_type, input.content_id);

    const result = await db.insert(socialSharingSettingsTable)
      .values({
        content_type: input.content_type,
        content_id: input.content_id,
        enable_twitter: input.enable_twitter,
        enable_facebook: input.enable_facebook,
        enable_linkedin: input.enable_linkedin,
        enable_copy_link: input.enable_copy_link,
        custom_message: input.custom_message
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Social sharing settings creation failed:', error);
    throw error;
  }
}

export async function getSocialSharingSettings(contentType: 'blog_post' | 'static_page' | 'project', contentId: number): Promise<SocialSharingSettings | null> {
  try {
    const results = await db.select()
      .from(socialSharingSettingsTable)
      .where(
        and(
          eq(socialSharingSettingsTable.content_type, contentType),
          eq(socialSharingSettingsTable.content_id, contentId)
        )
      )
      .execute();

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Failed to fetch social sharing settings:', error);
    throw error;
  }
}

interface UpdateSocialSharingSettingsInput {
  id: number;
  enable_twitter?: boolean;
  enable_facebook?: boolean;
  enable_linkedin?: boolean;
  enable_copy_link?: boolean;
  custom_message?: string | null;
}

export async function updateSocialSharingSettings(input: UpdateSocialSharingSettingsInput): Promise<SocialSharingSettings> {
  try {
    const updateData: any = {};

    // Only include fields that are explicitly provided
    if (input.enable_twitter !== undefined) updateData.enable_twitter = input.enable_twitter;
    if (input.enable_facebook !== undefined) updateData.enable_facebook = input.enable_facebook;
    if (input.enable_linkedin !== undefined) updateData.enable_linkedin = input.enable_linkedin;
    if (input.enable_copy_link !== undefined) updateData.enable_copy_link = input.enable_copy_link;
    if (input.custom_message !== undefined) updateData.custom_message = input.custom_message;

    // Always update the timestamp
    updateData.updated_at = new Date();

    const result = await db.update(socialSharingSettingsTable)
      .set(updateData)
      .where(eq(socialSharingSettingsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Social sharing settings with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Social sharing settings update failed:', error);
    throw error;
  }
}

export async function generateSharingUrls(contentType: 'blog_post' | 'static_page' | 'project', contentId: number, baseUrl: string): Promise<{
  twitter: string;
  facebook: string;
  linkedin: string;
  copyLink: string;
}> {
  try {
    // Get content details for sharing
    const content = await getContentDetails(contentType, contentId);
    
    if (!content) {
      throw new Error(`Content not found: ${contentType}/${contentId}`);
    }

    // Get custom message if available
    const settings = await getSocialSharingSettings(contentType, contentId);
    
    const contentUrl = `${baseUrl}/${contentType}/${contentId}`;
    const encodedUrl = encodeURIComponent(contentUrl);
    const title = content.title;
    const encodedTitle = encodeURIComponent(title);
    
    // Use custom message or fallback to title
    const message = settings?.custom_message || title;
    const encodedMessage = encodeURIComponent(message);

    return {
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedMessage}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}`,
      copyLink: contentUrl
    };
  } catch (error) {
    console.error('Failed to generate sharing URLs:', error);
    throw error;
  }
}

// Helper function to validate content exists
async function validateContentExists(contentType: 'blog_post' | 'static_page' | 'project', contentId: number): Promise<void> {
  let result;

  switch (contentType) {
    case 'blog_post':
      result = await db.select().from(blogPostsTable).where(eq(blogPostsTable.id, contentId)).execute();
      break;
    case 'static_page':
      result = await db.select().from(staticPagesTable).where(eq(staticPagesTable.id, contentId)).execute();
      break;
    case 'project':
      result = await db.select().from(projectsTable).where(eq(projectsTable.id, contentId)).execute();
      break;
    default:
      throw new Error(`Invalid content type: ${contentType}`);
  }

  if (result.length === 0) {
    throw new Error(`Content not found: ${contentType} with id ${contentId}`);
  }
}

// Helper function to get content details for sharing
async function getContentDetails(contentType: 'blog_post' | 'static_page' | 'project', contentId: number): Promise<{ title: string } | null> {
  let result;

  switch (contentType) {
    case 'blog_post':
      result = await db.select({ title: blogPostsTable.title })
        .from(blogPostsTable)
        .where(eq(blogPostsTable.id, contentId))
        .execute();
      break;
    case 'static_page':
      result = await db.select({ title: staticPagesTable.title })
        .from(staticPagesTable)
        .where(eq(staticPagesTable.id, contentId))
        .execute();
      break;
    case 'project':
      result = await db.select({ title: projectsTable.title })
        .from(projectsTable)
        .where(eq(projectsTable.id, contentId))
        .execute();
      break;
    default:
      return null;
  }

  return result.length > 0 ? result[0] : null;
}