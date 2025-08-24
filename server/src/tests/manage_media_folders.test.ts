import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { mediaFoldersTable, mediaTable } from '../db/schema';
import { type CreateMediaFolderInput } from '../schema';
import { 
  createMediaFolder,
  getMediaFolders,
  getMediaFolder,
  updateMediaFolder,
  deleteMediaFolder
} from '../handlers/manage_media_folders';
import { eq } from 'drizzle-orm';

// Test inputs
const testFolderInput: CreateMediaFolderInput = {
  name: 'Test Folder',
  parent_id: null
};

const testSubFolderInput: CreateMediaFolderInput = {
  name: 'Sub Folder',
  parent_id: 1 // Will be set dynamically
};

describe('createMediaFolder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a root media folder', async () => {
    const result = await createMediaFolder(testFolderInput);

    expect(result.name).toEqual('Test Folder');
    expect(result.parent_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a subfolder with valid parent', async () => {
    // Create parent folder first
    const parentFolder = await createMediaFolder(testFolderInput);
    
    const subFolderInput = {
      ...testSubFolderInput,
      parent_id: parentFolder.id
    };

    const result = await createMediaFolder(subFolderInput);

    expect(result.name).toEqual('Sub Folder');
    expect(result.parent_id).toEqual(parentFolder.id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save folder to database', async () => {
    const result = await createMediaFolder(testFolderInput);

    const folders = await db.select()
      .from(mediaFoldersTable)
      .where(eq(mediaFoldersTable.id, result.id))
      .execute();

    expect(folders).toHaveLength(1);
    expect(folders[0].name).toEqual('Test Folder');
    expect(folders[0].parent_id).toBeNull();
  });

  it('should reject invalid parent folder', async () => {
    const invalidInput = {
      ...testSubFolderInput,
      parent_id: 999 // Non-existent parent
    };

    expect(createMediaFolder(invalidInput)).rejects.toThrow(/does not exist/i);
  });
});

describe('getMediaFolders', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no folders exist', async () => {
    const result = await getMediaFolders();
    expect(result).toEqual([]);
  });

  it('should return all folders', async () => {
    // Create multiple folders
    const folder1 = await createMediaFolder(testFolderInput);
    const folder2 = await createMediaFolder({
      name: 'Second Folder',
      parent_id: null
    });

    const result = await getMediaFolders();

    expect(result).toHaveLength(2);
    expect(result.map(f => f.id)).toContain(folder1.id);
    expect(result.map(f => f.id)).toContain(folder2.id);
  });

  it('should return folders in hierarchical structure', async () => {
    // Create parent and child folders
    const parentFolder = await createMediaFolder(testFolderInput);
    const childFolder = await createMediaFolder({
      ...testSubFolderInput,
      parent_id: parentFolder.id
    });

    const result = await getMediaFolders();

    expect(result).toHaveLength(2);
    
    const parent = result.find(f => f.id === parentFolder.id);
    const child = result.find(f => f.id === childFolder.id);
    
    expect(parent?.parent_id).toBeNull();
    expect(child?.parent_id).toEqual(parentFolder.id);
  });
});

describe('getMediaFolder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return folder by ID', async () => {
    const createdFolder = await createMediaFolder(testFolderInput);
    
    const result = await getMediaFolder(createdFolder.id);

    expect(result).toBeDefined();
    expect(result?.id).toEqual(createdFolder.id);
    expect(result?.name).toEqual('Test Folder');
    expect(result?.parent_id).toBeNull();
  });

  it('should return null for non-existent folder', async () => {
    const result = await getMediaFolder(999);
    expect(result).toBeNull();
  });
});

describe('updateMediaFolder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update folder name', async () => {
    const folder = await createMediaFolder(testFolderInput);
    
    const result = await updateMediaFolder({
      id: folder.id,
      name: 'Updated Folder Name'
    });

    expect(result.name).toEqual('Updated Folder Name');
    expect(result.parent_id).toEqual(folder.parent_id);
    expect(result.id).toEqual(folder.id);
  });

  it('should update parent folder', async () => {
    const parentFolder = await createMediaFolder(testFolderInput);
    const childFolder = await createMediaFolder({
      name: 'Child Folder',
      parent_id: null
    });
    
    const result = await updateMediaFolder({
      id: childFolder.id,
      parent_id: parentFolder.id
    });

    expect(result.parent_id).toEqual(parentFolder.id);
    expect(result.name).toEqual(childFolder.name);
  });

  it('should update both name and parent', async () => {
    const parentFolder = await createMediaFolder(testFolderInput);
    const childFolder = await createMediaFolder({
      name: 'Child Folder',
      parent_id: null
    });
    
    const result = await updateMediaFolder({
      id: childFolder.id,
      name: 'Updated Child',
      parent_id: parentFolder.id
    });

    expect(result.name).toEqual('Updated Child');
    expect(result.parent_id).toEqual(parentFolder.id);
  });

  it('should reject invalid folder ID', async () => {
    expect(updateMediaFolder({
      id: 999,
      name: 'Updated Name'
    })).rejects.toThrow(/not found/i);
  });

  it('should reject invalid parent folder ID', async () => {
    const folder = await createMediaFolder(testFolderInput);
    
    expect(updateMediaFolder({
      id: folder.id,
      parent_id: 999
    })).rejects.toThrow(/does not exist/i);
  });

  it('should reject circular parent reference', async () => {
    const folder = await createMediaFolder(testFolderInput);
    
    expect(updateMediaFolder({
      id: folder.id,
      parent_id: folder.id
    })).rejects.toThrow(/cannot be its own parent/i);
  });

  it('should save updates to database', async () => {
    const folder = await createMediaFolder(testFolderInput);
    
    await updateMediaFolder({
      id: folder.id,
      name: 'Database Updated'
    });

    const dbFolder = await db.select()
      .from(mediaFoldersTable)
      .where(eq(mediaFoldersTable.id, folder.id))
      .execute();

    expect(dbFolder[0].name).toEqual('Database Updated');
  });
});

describe('deleteMediaFolder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete empty folder', async () => {
    const folder = await createMediaFolder(testFolderInput);
    
    await deleteMediaFolder(folder.id);

    const result = await getMediaFolder(folder.id);
    expect(result).toBeNull();
  });

  it('should reject deletion of non-existent folder', async () => {
    expect(deleteMediaFolder(999)).rejects.toThrow(/not found/i);
  });

  it('should reject deletion of folder with subfolders', async () => {
    const parentFolder = await createMediaFolder(testFolderInput);
    await createMediaFolder({
      ...testSubFolderInput,
      parent_id: parentFolder.id
    });

    expect(deleteMediaFolder(parentFolder.id)).rejects.toThrow(/contains subfolders/i);
  });

  it('should move media files to parent folder when deleting', async () => {
    // Create parent folder
    const parentFolder = await createMediaFolder({
      name: 'Parent',
      parent_id: null
    });
    
    // Create child folder
    const childFolder = await createMediaFolder({
      name: 'Child',
      parent_id: parentFolder.id
    });

    // Create a media file in the child folder
    const mediaResult = await db.insert(mediaTable)
      .values({
        filename: 'test.jpg',
        original_name: 'test.jpg',
        mime_type: 'image/jpeg',
        size: 1000,
        folder_id: childFolder.id
      })
      .returning()
      .execute();

    // Delete the child folder
    await deleteMediaFolder(childFolder.id);

    // Verify media file was moved to parent folder
    const updatedMedia = await db.select()
      .from(mediaTable)
      .where(eq(mediaTable.id, mediaResult[0].id))
      .execute();

    expect(updatedMedia[0].folder_id).toEqual(parentFolder.id);
  });

  it('should move media files to null when deleting root folder', async () => {
    // Create root folder
    const rootFolder = await createMediaFolder(testFolderInput);

    // Create a media file in the root folder
    const mediaResult = await db.insert(mediaTable)
      .values({
        filename: 'test.jpg',
        original_name: 'test.jpg',
        mime_type: 'image/jpeg',
        size: 1000,
        folder_id: rootFolder.id
      })
      .returning()
      .execute();

    // Delete the root folder
    await deleteMediaFolder(rootFolder.id);

    // Verify media file was moved to null (no folder)
    const updatedMedia = await db.select()
      .from(mediaTable)
      .where(eq(mediaTable.id, mediaResult[0].id))
      .execute();

    expect(updatedMedia[0].folder_id).toBeNull();
  });

  it('should remove folder from database', async () => {
    const folder = await createMediaFolder(testFolderInput);
    
    await deleteMediaFolder(folder.id);

    const dbFolders = await db.select()
      .from(mediaFoldersTable)
      .where(eq(mediaFoldersTable.id, folder.id))
      .execute();

    expect(dbFolders).toHaveLength(0);
  });
});