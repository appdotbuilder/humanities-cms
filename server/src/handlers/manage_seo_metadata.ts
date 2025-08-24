import { db } from '../db';
import { seoMetadataTable, blogPostsTable, staticPagesTable, projectsTable, mediaTable } from '../db/schema';
import { type CreateSeoMetadataInput, type UpdateSeoMetadataInput, type SeoMetadata } from '../schema';
import { eq, and } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export async function createSeoMetadata(input: CreateSeoMetadataInput): Promise<SeoMetadata> {
  try {
    // Verify that the referenced content exists
    await verifyContentExists(input.content_type, input.content_id);

    // Verify social image exists if provided
    if (input.social_image_id) {
      await verifySocialImageExists(input.social_image_id);
    }

    const result = await db.insert(seoMetadataTable)
      .values({
        content_type: input.content_type,
        content_id: input.content_id,
        meta_title: input.meta_title,
        meta_description: input.meta_description,
        social_image_id: input.social_image_id,
        og_title: input.og_title,
        og_description: input.og_description,
        twitter_title: input.twitter_title,
        twitter_description: input.twitter_description,
        canonical_url: input.canonical_url,
        robots: input.robots
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('SEO metadata creation failed:', error);
    throw error;
  }
}

export async function getSeoMetadata(contentType: 'blog_post' | 'static_page' | 'project', contentId: number): Promise<SeoMetadata | null> {
  try {
    const results = await db.select()
      .from(seoMetadataTable)
      .where(and(
        eq(seoMetadataTable.content_type, contentType),
        eq(seoMetadataTable.content_id, contentId)
      ))
      .execute();

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('SEO metadata retrieval failed:', error);
    throw error;
  }
}

export async function updateSeoMetadata(input: UpdateSeoMetadataInput): Promise<SeoMetadata> {
  try {
    // Verify SEO metadata exists
    const existing = await db.select()
      .from(seoMetadataTable)
      .where(eq(seoMetadataTable.id, input.id))
      .execute();

    if (existing.length === 0) {
      throw new Error(`SEO metadata with id ${input.id} not found`);
    }

    // Verify social image exists if provided
    if (input.social_image_id !== undefined && input.social_image_id !== null) {
      await verifySocialImageExists(input.social_image_id);
    }

    // Build update object with only defined fields
    const updateData: Record<string, any> = {};
    
    if (input.meta_title !== undefined) updateData['meta_title'] = input.meta_title;
    if (input.meta_description !== undefined) updateData['meta_description'] = input.meta_description;
    if (input.social_image_id !== undefined) updateData['social_image_id'] = input.social_image_id;
    if (input.og_title !== undefined) updateData['og_title'] = input.og_title;
    if (input.og_description !== undefined) updateData['og_description'] = input.og_description;
    if (input.twitter_title !== undefined) updateData['twitter_title'] = input.twitter_title;
    if (input.twitter_description !== undefined) updateData['twitter_description'] = input.twitter_description;
    if (input.canonical_url !== undefined) updateData['canonical_url'] = input.canonical_url;
    if (input.robots !== undefined) updateData['robots'] = input.robots;

    // Always update the updated_at timestamp
    updateData['updated_at'] = new Date();

    const result = await db.update(seoMetadataTable)
      .set(updateData)
      .where(eq(seoMetadataTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('SEO metadata update failed:', error);
    throw error;
  }
}

export async function deleteSeoMetadata(id: number): Promise<void> {
  try {
    const result = await db.delete(seoMetadataTable)
      .where(eq(seoMetadataTable.id, id))
      .execute();

    if (result.rowCount === 0) {
      throw new Error(`SEO metadata with id ${id} not found`);
    }
  } catch (error) {
    console.error('SEO metadata deletion failed:', error);
    throw error;
  }
}

export async function generateSeoPreview(contentType: 'blog_post' | 'static_page' | 'project', contentId: number): Promise<{
  googlePreview: { title: string; url: string; description: string };
  facebookPreview: { title: string; description: string; image?: string };
  twitterPreview: { title: string; description: string; image?: string };
}> {
  try {
    // Get SEO metadata
    const seoData = await getSeoMetadata(contentType, contentId);
    
    // Get content data
    const contentData = await getContentData(contentType, contentId);
    
    // Get social image if available
    const socialImageUrl = seoData?.social_image_id ? 
      await getSocialImageUrl(seoData.social_image_id) : undefined;

    // Generate previews with fallbacks
    const googleTitle = seoData?.meta_title || contentData.title || 'Untitled';
    const googleDescription = seoData?.meta_description || contentData.description || contentData.excerpt || 'No description available';
    const googleUrl = seoData?.canonical_url || `https://example.com/${contentType.replace('_', '-')}s/${contentData.slug || contentId}`;

    const facebookTitle = seoData?.og_title || seoData?.meta_title || contentData.title || 'Untitled';
    const facebookDescription = seoData?.og_description || seoData?.meta_description || contentData.description || contentData.excerpt || 'No description available';

    const twitterTitle = seoData?.twitter_title || seoData?.og_title || seoData?.meta_title || contentData.title || 'Untitled';
    const twitterDescription = seoData?.twitter_description || seoData?.og_description || seoData?.meta_description || contentData.description || contentData.excerpt || 'No description available';

    return {
      googlePreview: {
        title: truncateText(googleTitle, 60),
        url: googleUrl,
        description: truncateText(googleDescription, 160)
      },
      facebookPreview: {
        title: truncateText(facebookTitle, 65),
        description: truncateText(facebookDescription, 125),
        image: socialImageUrl
      },
      twitterPreview: {
        title: truncateText(twitterTitle, 70),
        description: truncateText(twitterDescription, 200),
        image: socialImageUrl
      }
    };
  } catch (error) {
    console.error('SEO preview generation failed:', error);
    throw error;
  }
}

// Helper functions
async function verifyContentExists(contentType: 'blog_post' | 'static_page' | 'project', contentId: number): Promise<void> {
  let table;
  switch (contentType) {
    case 'blog_post':
      table = blogPostsTable;
      break;
    case 'static_page':
      table = staticPagesTable;
      break;
    case 'project':
      table = projectsTable;
      break;
  }

  const results = await db.select({ id: table.id })
    .from(table)
    .where(eq(table.id, contentId))
    .execute();

  if (results.length === 0) {
    throw new Error(`${contentType} with id ${contentId} not found`);
  }
}

async function verifySocialImageExists(imageId: number): Promise<void> {
  const results = await db.select({ id: mediaTable.id })
    .from(mediaTable)
    .where(eq(mediaTable.id, imageId))
    .execute();

  if (results.length === 0) {
    throw new Error(`Social image with id ${imageId} not found`);
  }
}

async function getContentData(contentType: 'blog_post' | 'static_page' | 'project', contentId: number): Promise<any> {
  let table;
  switch (contentType) {
    case 'blog_post':
      table = blogPostsTable;
      break;
    case 'static_page':
      table = staticPagesTable;
      break;
    case 'project':
      table = projectsTable;
      break;
  }

  const results = await db.select()
    .from(table)
    .where(eq(table.id, contentId))
    .execute();

  return results[0] || {};
}

async function getSocialImageUrl(imageId: number): Promise<string | undefined> {
  const results = await db.select({ filename: mediaTable.filename })
    .from(mediaTable)
    .where(eq(mediaTable.id, imageId))
    .execute();

  return results.length > 0 ? `/uploads/${results[0].filename}` : undefined;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}