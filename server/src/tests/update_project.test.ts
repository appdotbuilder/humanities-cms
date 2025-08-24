import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable, mediaTable, seoMetadataTable, socialSharingSettingsTable } from '../db/schema';
import { type UpdateProjectInput, type CreateMediaInput, type CreateSeoMetadataInput, type CreateSocialSharingSettingsInput } from '../schema';
import { updateProject, deleteProject } from '../handlers/update_project';
import { eq } from 'drizzle-orm';

describe('updateProject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestProject = async () => {
    const result = await db.insert(projectsTable)
      .values({
        title: 'Original Project',
        slug: 'original-project',
        description: 'Original description',
        content: 'Original content',
        project_url: 'https://original.com',
        github_url: 'https://github.com/original',
        technologies: ['React', 'Node.js'],
        status: 'draft',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-06-01'),
        sort_order: 1
      })
      .returning()
      .execute();

    return result[0];
  };

  const createTestMedia = async (): Promise<number> => {
    const mediaInput: CreateMediaInput = {
      filename: 'test-image.jpg',
      original_name: 'Test Image.jpg',
      mime_type: 'image/jpeg',
      size: 1024,
      width: 800,
      height: 600,
      alt_text: 'Test image',
      description: 'A test image',
      folder_id: null
    };

    const result = await db.insert(mediaTable)
      .values(mediaInput)
      .returning()
      .execute();

    return result[0].id;
  };

  it('should update project with all fields', async () => {
    const project = await createTestProject();
    const mediaId = await createTestMedia();

    const updateInput: UpdateProjectInput = {
      id: project.id,
      title: 'Updated Project',
      slug: 'updated-project',
      description: 'Updated description',
      content: 'Updated content',
      featured_image_id: mediaId,
      project_url: 'https://updated.com',
      github_url: 'https://github.com/updated',
      technologies: ['Vue.js', 'Express', 'PostgreSQL'],
      status: 'published',
      start_date: new Date('2024-02-01'),
      end_date: new Date('2024-08-01'),
      sort_order: 5
    };

    const result = await updateProject(updateInput);

    expect(result.id).toBe(project.id);
    expect(result.title).toBe('Updated Project');
    expect(result.slug).toBe('updated-project');
    expect(result.description).toBe('Updated description');
    expect(result.content).toBe('Updated content');
    expect(result.featured_image_id).toBe(mediaId);
    expect(result.project_url).toBe('https://updated.com');
    expect(result.github_url).toBe('https://github.com/updated');
    expect(result.technologies).toEqual(['Vue.js', 'Express', 'PostgreSQL']);
    expect(result.status).toBe('published');
    expect(result.start_date).toEqual(new Date('2024-02-01'));
    expect(result.end_date).toEqual(new Date('2024-08-01'));
    expect(result.sort_order).toBe(5);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(project.updated_at.getTime());
  });

  it('should update project with partial fields', async () => {
    const project = await createTestProject();

    const updateInput: UpdateProjectInput = {
      id: project.id,
      title: 'Partially Updated',
      status: 'published',
      technologies: ['React', 'TypeScript']
    };

    const result = await updateProject(updateInput);

    expect(result.id).toBe(project.id);
    expect(result.title).toBe('Partially Updated');
    expect(result.slug).toBe('original-project'); // Should remain unchanged
    expect(result.description).toBe('Original description'); // Should remain unchanged
    expect(result.status).toBe('published');
    expect(result.technologies).toEqual(['React', 'TypeScript']);
    expect(result.project_url).toBe('https://original.com'); // Should remain unchanged
  });

  it('should update project with nullable fields set to null', async () => {
    const project = await createTestProject();

    const updateInput: UpdateProjectInput = {
      id: project.id,
      content: null,
      project_url: null,
      github_url: null,
      start_date: null,
      end_date: null,
      featured_image_id: null
    };

    const result = await updateProject(updateInput);

    expect(result.content).toBeNull();
    expect(result.project_url).toBeNull();
    expect(result.github_url).toBeNull();
    expect(result.start_date).toBeNull();
    expect(result.end_date).toBeNull();
    expect(result.featured_image_id).toBeNull();
  });

  it('should update technologies array correctly', async () => {
    const project = await createTestProject();

    const updateInput: UpdateProjectInput = {
      id: project.id,
      technologies: []
    };

    const result = await updateProject(updateInput);

    expect(result.technologies).toEqual([]);
  });

  it('should save updated project to database', async () => {
    const project = await createTestProject();

    const updateInput: UpdateProjectInput = {
      id: project.id,
      title: 'Database Test Update',
      sort_order: 10
    };

    await updateProject(updateInput);

    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, project.id))
      .execute();

    expect(projects).toHaveLength(1);
    expect(projects[0].title).toBe('Database Test Update');
    expect(projects[0].sort_order).toBe(10);
  });

  it('should throw error when updating non-existent project', async () => {
    const updateInput: UpdateProjectInput = {
      id: 99999,
      title: 'Non-existent'
    };

    await expect(updateProject(updateInput)).rejects.toThrow(/not found/i);
  });
});

describe('deleteProject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestProject = async () => {
    const result = await db.insert(projectsTable)
      .values({
        title: 'Test Project',
        slug: 'test-project',
        description: 'Test description',
        technologies: ['React'],
        status: 'draft',
        sort_order: 1
      })
      .returning()
      .execute();

    return result[0];
  };

  const createTestSeoMetadata = async (projectId: number) => {
    const seoInput: CreateSeoMetadataInput = {
      content_type: 'project',
      content_id: projectId,
      meta_title: 'Test SEO Title',
      meta_description: 'Test SEO Description',
      social_image_id: null,
      og_title: null,
      og_description: null,
      twitter_title: null,
      twitter_description: null,
      canonical_url: null,
      robots: null
    };

    const result = await db.insert(seoMetadataTable)
      .values(seoInput)
      .returning()
      .execute();

    return result[0];
  };

  const createTestSocialSettings = async (projectId: number) => {
    const socialInput: CreateSocialSharingSettingsInput = {
      content_type: 'project',
      content_id: projectId,
      enable_twitter: true,
      enable_facebook: true,
      enable_linkedin: false,
      enable_copy_link: true,
      custom_message: 'Check out this project!'
    };

    const result = await db.insert(socialSharingSettingsTable)
      .values(socialInput)
      .returning()
      .execute();

    return result[0];
  };

  it('should delete project successfully', async () => {
    const project = await createTestProject();

    await deleteProject(project.id);

    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, project.id))
      .execute();

    expect(projects).toHaveLength(0);
  });

  it('should delete project and related SEO metadata', async () => {
    const project = await createTestProject();
    const seoMetadata = await createTestSeoMetadata(project.id);

    await deleteProject(project.id);

    // Check project is deleted
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, project.id))
      .execute();

    expect(projects).toHaveLength(0);

    // Check SEO metadata is deleted
    const seoRecords = await db.select()
      .from(seoMetadataTable)
      .where(eq(seoMetadataTable.content_id, project.id))
      .execute();

    expect(seoRecords).toHaveLength(0);
  });

  it('should delete project and related social sharing settings', async () => {
    const project = await createTestProject();
    const socialSettings = await createTestSocialSettings(project.id);

    await deleteProject(project.id);

    // Check project is deleted
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, project.id))
      .execute();

    expect(projects).toHaveLength(0);

    // Check social settings are deleted
    const socialRecords = await db.select()
      .from(socialSharingSettingsTable)
      .where(eq(socialSharingSettingsTable.content_id, project.id))
      .execute();

    expect(socialRecords).toHaveLength(0);
  });

  it('should delete project and all related data', async () => {
    const project = await createTestProject();
    const seoMetadata = await createTestSeoMetadata(project.id);
    const socialSettings = await createTestSocialSettings(project.id);

    await deleteProject(project.id);

    // Check all records are deleted
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, project.id))
      .execute();

    const seoRecords = await db.select()
      .from(seoMetadataTable)
      .where(eq(seoMetadataTable.content_id, project.id))
      .execute();

    const socialRecords = await db.select()
      .from(socialSharingSettingsTable)
      .where(eq(socialSharingSettingsTable.content_id, project.id))
      .execute();

    expect(projects).toHaveLength(0);
    expect(seoRecords).toHaveLength(0);
    expect(socialRecords).toHaveLength(0);
  });

  it('should throw error when deleting non-existent project', async () => {
    await expect(deleteProject(99999)).rejects.toThrow(/not found/i);
  });

  it('should handle deletion when no related data exists', async () => {
    const project = await createTestProject();

    // Should not throw error even if no related SEO/social data exists
    await expect(deleteProject(project.id)).resolves.toBeUndefined();

    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, project.id))
      .execute();

    expect(projects).toHaveLength(0);
  });
});