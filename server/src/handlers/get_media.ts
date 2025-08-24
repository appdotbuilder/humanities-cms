import { db } from '../db';
import { mediaTable } from '../db/schema';
import { type Media } from '../schema';
import { eq, desc, ilike, or, isNull } from 'drizzle-orm';

export async function getMedia(): Promise<Media[]> {
  try {
    const results = await db.select()
      .from(mediaTable)
      .orderBy(desc(mediaTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch media:', error);
    throw error;
  }
}

export async function getMediaById(id: number): Promise<Media | null> {
  try {
    const results = await db.select()
      .from(mediaTable)
      .where(eq(mediaTable.id, id))
      .execute();

    return results[0] || null;
  } catch (error) {
    console.error('Failed to fetch media by ID:', error);
    throw error;
  }
}

export async function getMediaByFolder(folderId: number): Promise<Media[]> {
  try {
    const results = await db.select()
      .from(mediaTable)
      .where(eq(mediaTable.folder_id, folderId))
      .orderBy(desc(mediaTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch media by folder:', error);
    throw error;
  }
}

export async function getMediaInRootFolder(): Promise<Media[]> {
  try {
    const results = await db.select()
      .from(mediaTable)
      .where(isNull(mediaTable.folder_id))
      .orderBy(desc(mediaTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch media in root folder:', error);
    throw error;
  }
}

export async function searchMedia(query: string): Promise<Media[]> {
  try {
    const searchPattern = `%${query}%`;
    
    const results = await db.select()
      .from(mediaTable)
      .where(
        or(
          ilike(mediaTable.filename, searchPattern),
          ilike(mediaTable.original_name, searchPattern),
          ilike(mediaTable.alt_text, searchPattern),
          ilike(mediaTable.description, searchPattern)
        )
      )
      .orderBy(desc(mediaTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to search media:', error);
    throw error;
  }
}