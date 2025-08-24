import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable, mediaTable } from '../db/schema';
import { type CreateProjectInput } from '../schema';
import { createProject } from '../handlers/create_project';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateProjectInput = {
  title: 'My Awesome Project',
  slug: 'my-awesome-project',
  description: 'A comprehensive project showcasing modern web development',
  content: 'This is the detailed content of the project...',
  featured_image_id: null,
  project_url: 'https://example.com/project',
  github_url: 'https://github.com/user/project',
  technologies: ['React', 'TypeScript', 'Node.js'],
  status: 'published',
  start_date: new Date('2023-01-15'),
  end_date: new Date('2023-06-30'),
  sort_order: 1
};

describe('createProject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a project with all fields', async () => {
    const result = await createProject(testInput);

    // Basic field validation
    expect(result.title).toEqual('My Awesome Project');
    expect(result.slug).toEqual('my-awesome-project');
    expect(result.description).toEqual(testInput.description);
    expect(result.content).toEqual(testInput.content);
    expect(result.featured_image_id).toBeNull();
    expect(result.project_url).toEqual('https://example.com/project');
    expect(result.github_url).toEqual('https://github.com/user/project');
    expect(result.technologies).toEqual(['React', 'TypeScript', 'Node.js']);
    expect(result.status).toEqual('published');
    expect(result.start_date).toEqual(new Date('2023-01-15'));
    expect(result.end_date).toEqual(new Date('2023-06-30'));
    expect(result.sort_order).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save project to database', async () => {
    const result = await createProject(testInput);

    // Query database to verify project was saved
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, result.id))
      .execute();

    expect(projects).toHaveLength(1);
    expect(projects[0].title).toEqual('My Awesome Project');
    expect(projects[0].slug).toEqual('my-awesome-project');
    expect(projects[0].description).toEqual(testInput.description);
    expect(projects[0].content).toEqual(testInput.content);
    expect(projects[0].project_url).toEqual('https://example.com/project');
    expect(projects[0].github_url).toEqual('https://github.com/user/project');
    expect(projects[0].technologies).toEqual(['React', 'TypeScript', 'Node.js']);
    expect(projects[0].status).toEqual('published');
    expect(projects[0].sort_order).toEqual(1);
    expect(projects[0].created_at).toBeInstanceOf(Date);
    expect(projects[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create project with minimal required fields', async () => {
    const minimalInput: CreateProjectInput = {
      title: 'Minimal Project',
      slug: 'minimal-project',
      description: 'Simple description',
      content: null,
      featured_image_id: null,
      project_url: null,
      github_url: null,
      technologies: [],
      status: 'draft',
      start_date: null,
      end_date: null,
      sort_order: 0
    };

    const result = await createProject(minimalInput);

    expect(result.title).toEqual('Minimal Project');
    expect(result.slug).toEqual('minimal-project');
    expect(result.description).toEqual('Simple description');
    expect(result.content).toBeNull();
    expect(result.featured_image_id).toBeNull();
    expect(result.project_url).toBeNull();
    expect(result.github_url).toBeNull();
    expect(result.technologies).toEqual([]);
    expect(result.status).toEqual('draft');
    expect(result.start_date).toBeNull();
    expect(result.end_date).toBeNull();
    expect(result.sort_order).toEqual(0);
    expect(result.id).toBeDefined();
  });

  it('should create project with featured image reference', async () => {
    // First create a media record to reference
    const mediaResult = await db.insert(mediaTable)
      .values({
        filename: 'project-image.jpg',
        original_name: 'Project Image.jpg',
        mime_type: 'image/jpeg',
        size: 1024000,
        width: 1920,
        height: 1080,
        alt_text: 'Project featured image',
        description: null,
        folder_id: null
      })
      .returning()
      .execute();

    const mediaId = mediaResult[0].id;

    const inputWithImage: CreateProjectInput = {
      ...testInput,
      featured_image_id: mediaId
    };

    const result = await createProject(inputWithImage);

    expect(result.featured_image_id).toEqual(mediaId);

    // Verify in database
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, result.id))
      .execute();

    expect(projects[0].featured_image_id).toEqual(mediaId);
  });

  it('should handle different project statuses', async () => {
    const statuses: Array<'draft' | 'published' | 'archived'> = ['draft', 'published', 'archived'];

    for (const status of statuses) {
      const input: CreateProjectInput = {
        ...testInput,
        slug: `project-${status}`,
        status
      };

      const result = await createProject(input);
      expect(result.status).toEqual(status);
    }
  });

  it('should handle empty technologies array', async () => {
    const inputWithEmptyTech: CreateProjectInput = {
      ...testInput,
      slug: 'project-no-tech',
      technologies: []
    };

    const result = await createProject(inputWithEmptyTech);
    expect(result.technologies).toEqual([]);
  });

  it('should handle single technology in array', async () => {
    const inputWithSingleTech: CreateProjectInput = {
      ...testInput,
      slug: 'project-single-tech',
      technologies: ['JavaScript']
    };

    const result = await createProject(inputWithSingleTech);
    expect(result.technologies).toEqual(['JavaScript']);
  });

  it('should preserve sort order for project organization', async () => {
    const projects = [
      { ...testInput, slug: 'project-1', sort_order: 3 },
      { ...testInput, slug: 'project-2', sort_order: 1 },
      { ...testInput, slug: 'project-3', sort_order: 2 }
    ];

    const results = [];
    for (const project of projects) {
      results.push(await createProject(project));
    }

    expect(results[0].sort_order).toEqual(3);
    expect(results[1].sort_order).toEqual(1);
    expect(results[2].sort_order).toEqual(2);
  });

  it('should handle date objects correctly', async () => {
    const startDate = new Date('2023-03-15T10:00:00Z');
    const endDate = new Date('2023-09-30T18:00:00Z');

    const inputWithDates: CreateProjectInput = {
      ...testInput,
      slug: 'project-with-dates',
      start_date: startDate,
      end_date: endDate
    };

    const result = await createProject(inputWithDates);

    expect(result.start_date).toBeInstanceOf(Date);
    expect(result.end_date).toBeInstanceOf(Date);
    expect(result.start_date?.getTime()).toEqual(startDate.getTime());
    expect(result.end_date?.getTime()).toEqual(endDate.getTime());
  });
});