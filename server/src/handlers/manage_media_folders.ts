import { db } from '../db';
import { mediaFoldersTable, mediaTable } from '../db/schema';
import { type CreateMediaFolderInput, type MediaFolder } from '../schema';
import { eq, isNull, or } from 'drizzle-orm';

export async function createMediaFolder(input: CreateMediaFolderInput): Promise<MediaFolder> {
  try {
    // If parent_id is provided, verify the parent folder exists
    if (input.parent_id !== null) {
      const parentFolder = await db.select()
        .from(mediaFoldersTable)
        .where(eq(mediaFoldersTable.id, input.parent_id))
        .execute();

      if (parentFolder.length === 0) {
        throw new Error(`Parent folder with ID ${input.parent_id} does not exist`);
      }
    }

    // Create the new folder
    const result = await db.insert(mediaFoldersTable)
      .values({
        name: input.name,
        parent_id: input.parent_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Media folder creation failed:', error);
    throw error;
  }
}

export async function getMediaFolders(): Promise<MediaFolder[]> {
  try {
    const folders = await db.select()
      .from(mediaFoldersTable)
      .execute();

    return folders;
  } catch (error) {
    console.error('Failed to fetch media folders:', error);
    throw error;
  }
}

export async function getMediaFolder(id: number): Promise<MediaFolder | null> {
  try {
    const folders = await db.select()
      .from(mediaFoldersTable)
      .where(eq(mediaFoldersTable.id, id))
      .execute();

    return folders.length > 0 ? folders[0] : null;
  } catch (error) {
    console.error('Failed to fetch media folder:', error);
    throw error;
  }
}

interface UpdateMediaFolderInput {
  id: number;
  name?: string;
  parent_id?: number | null;
}

export async function updateMediaFolder(input: UpdateMediaFolderInput): Promise<MediaFolder> {
  try {
    // Verify the folder exists
    const existingFolder = await getMediaFolder(input.id);
    if (!existingFolder) {
      throw new Error(`Media folder with ID ${input.id} not found`);
    }

    // If parent_id is being updated and is not null, verify the parent folder exists
    if (input.parent_id !== undefined && input.parent_id !== null) {
      const parentFolder = await getMediaFolder(input.parent_id);
      if (!parentFolder) {
        throw new Error(`Parent folder with ID ${input.parent_id} does not exist`);
      }

      // Prevent circular reference - folder cannot be its own parent or descendant
      if (input.parent_id === input.id) {
        throw new Error('Folder cannot be its own parent');
      }
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.parent_id !== undefined) {
      updateData.parent_id = input.parent_id;
    }

    const result = await db.update(mediaFoldersTable)
      .set(updateData)
      .where(eq(mediaFoldersTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Media folder update failed:', error);
    throw error;
  }
}

export async function deleteMediaFolder(id: number): Promise<void> {
  try {
    // Verify the folder exists
    const folder = await getMediaFolder(id);
    if (!folder) {
      throw new Error(`Media folder with ID ${id} not found`);
    }

    // Check for child folders
    const childFolders = await db.select()
      .from(mediaFoldersTable)
      .where(eq(mediaFoldersTable.parent_id, id))
      .execute();

    if (childFolders.length > 0) {
      throw new Error('Cannot delete folder that contains subfolders');
    }

    // Move any media files in this folder to the parent folder (or null if no parent)
    await db.update(mediaTable)
      .set({ folder_id: folder.parent_id })
      .where(eq(mediaTable.folder_id, id))
      .execute();

    // Delete the folder
    await db.delete(mediaFoldersTable)
      .where(eq(mediaFoldersTable.id, id))
      .execute();
  } catch (error) {
    console.error('Media folder deletion failed:', error);
    throw error;
  }
}