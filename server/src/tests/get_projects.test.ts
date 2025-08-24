import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable } from '../db/schema';
import { getProjects, getProject, getProjectBySlug } from '../handlers/get_projects';

describe('getProjects', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no projects exist', async () => {
    const result = await getProjects();
    expect(result).toEqual([]);
  });

  it('should return all projects ordered by sort_order', async () => {
    // Create test projects with different sort orders
    await db.insert(projectsTable).values([
      {
        title: 'Third Project',
        slug: 'third-project',
        description: 'Third description',
        content: 'Third content',
        technologies: ['React', 'Node.js'],
        status: 'published',
        sort_order: 3
      },
      {
        title: 'First Project',
        slug: 'first-project',
        description: 'First description',
        content: 'First content',
        technologies: ['Vue.js'],
        status: 'published',
        sort_order: 1
      },
      {
        title: 'Second Project',
        slug: 'second-project',
        description: 'Second description',
        content: 'Second content',
        technologies: ['Angular'],
        status: 'draft',
        sort_order: 2
      }
    ]).execute();

    const result = await getProjects();

    expect(result).toHaveLength(3);
    
    // Check ordering by sort_order
    expect(result[0].title).toBe('First Project');
    expect(result[0].sort_order).toBe(1);
    expect(result[1].title).toBe('Second Project');
    expect(result[1].sort_order).toBe(2);
    expect(result[2].title).toBe('Third Project');
    expect(result[2].sort_order).toBe(3);

    // Verify all fields are properly converted
    result.forEach(project => {
      expect(project.id).toBeDefined();
      expect(typeof project.title).toBe('string');
      expect(typeof project.slug).toBe('string');
      expect(typeof project.description).toBe('string');
      expect(Array.isArray(project.technologies)).toBe(true);
      expect(project.created_at).toBeInstanceOf(Date);
      expect(project.updated_at).toBeInstanceOf(Date);
      expect(['draft', 'published', 'archived'].includes(project.status)).toBe(true);
    });
  });

  it('should handle projects with null date fields', async () => {
    await db.insert(projectsTable).values({
      title: 'Test Project',
      slug: 'test-project',
      description: 'Test description',
      content: 'Test content',
      technologies: ['TypeScript'],
      status: 'published',
      sort_order: 1,
      start_date: null,
      end_date: null
    }).execute();

    const result = await getProjects();

    expect(result).toHaveLength(1);
    expect(result[0].start_date).toBeNull();
    expect(result[0].end_date).toBeNull();
  });

  it('should handle projects with valid date fields', async () => {
    const startDate = new Date('2023-01-01');
    const endDate = new Date('2023-06-01');

    await db.insert(projectsTable).values({
      title: 'Dated Project',
      slug: 'dated-project',
      description: 'Project with dates',
      content: 'Content with dates',
      technologies: ['Python'],
      status: 'published',
      sort_order: 1,
      start_date: startDate,
      end_date: endDate
    }).execute();

    const result = await getProjects();

    expect(result).toHaveLength(1);
    expect(result[0].start_date).toBeInstanceOf(Date);
    expect(result[0].end_date).toBeInstanceOf(Date);
    expect(result[0].start_date?.getTime()).toBe(startDate.getTime());
    expect(result[0].end_date?.getTime()).toBe(endDate.getTime());
  });

  it('should handle projects with empty technologies array', async () => {
    await db.insert(projectsTable).values({
      title: 'No Tech Project',
      slug: 'no-tech-project',
      description: 'Project without technologies',
      technologies: [],
      status: 'published',
      sort_order: 1
    }).execute();

    const result = await getProjects();

    expect(result).toHaveLength(1);
    expect(result[0].technologies).toEqual([]);
  });
});

describe('getProject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when project does not exist', async () => {
    const result = await getProject(999);
    expect(result).toBeNull();
  });

  it('should return project by id with all fields', async () => {
    const insertResult = await db.insert(projectsTable).values({
      title: 'Test Project',
      slug: 'test-project',
      description: 'Test description',
      content: 'Test content',
      featured_image_id: null,
      project_url: 'https://example.com',
      github_url: 'https://github.com/example/repo',
      technologies: ['React', 'TypeScript', 'Node.js'],
      status: 'published',
      start_date: new Date('2023-01-01'),
      end_date: new Date('2023-06-01'),
      sort_order: 5
    }).returning().execute();

    const projectId = insertResult[0].id;
    const result = await getProject(projectId);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(projectId);
    expect(result!.title).toBe('Test Project');
    expect(result!.slug).toBe('test-project');
    expect(result!.description).toBe('Test description');
    expect(result!.content).toBe('Test content');
    expect(result!.featured_image_id).toBeNull();
    expect(result!.project_url).toBe('https://example.com');
    expect(result!.github_url).toBe('https://github.com/example/repo');
    expect(result!.technologies).toEqual(['React', 'TypeScript', 'Node.js']);
    expect(result!.status).toBe('published');
    expect(result!.start_date).toBeInstanceOf(Date);
    expect(result!.end_date).toBeInstanceOf(Date);
    expect(result!.sort_order).toBe(5);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle project with minimal required fields', async () => {
    const insertResult = await db.insert(projectsTable).values({
      title: 'Minimal Project',
      slug: 'minimal-project',
      description: 'Minimal description',
      technologies: ['JavaScript'],
      status: 'draft',
      sort_order: 1
    }).returning().execute();

    const projectId = insertResult[0].id;
    const result = await getProject(projectId);

    expect(result).not.toBeNull();
    expect(result!.title).toBe('Minimal Project');
    expect(result!.slug).toBe('minimal-project');
    expect(result!.description).toBe('Minimal description');
    expect(result!.content).toBeNull();
    expect(result!.featured_image_id).toBeNull();
    expect(result!.project_url).toBeNull();
    expect(result!.github_url).toBeNull();
    expect(result!.start_date).toBeNull();
    expect(result!.end_date).toBeNull();
    expect(result!.technologies).toEqual(['JavaScript']);
    expect(result!.status).toBe('draft');
  });
});

describe('getProjectBySlug', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when project with slug does not exist', async () => {
    const result = await getProjectBySlug('non-existent-slug');
    expect(result).toBeNull();
  });

  it('should return project by slug with all fields', async () => {
    await db.insert(projectsTable).values({
      title: 'Slug Test Project',
      slug: 'slug-test-project',
      description: 'Project found by slug',
      content: 'Detailed project content',
      featured_image_id: null,
      project_url: 'https://slugtest.com',
      github_url: 'https://github.com/test/slug-project',
      technologies: ['Vue.js', 'Express'],
      status: 'published',
      start_date: new Date('2023-03-01'),
      end_date: null, // ongoing project
      sort_order: 10
    }).execute();

    const result = await getProjectBySlug('slug-test-project');

    expect(result).not.toBeNull();
    expect(result!.title).toBe('Slug Test Project');
    expect(result!.slug).toBe('slug-test-project');
    expect(result!.description).toBe('Project found by slug');
    expect(result!.content).toBe('Detailed project content');
    expect(result!.project_url).toBe('https://slugtest.com');
    expect(result!.github_url).toBe('https://github.com/test/slug-project');
    expect(result!.technologies).toEqual(['Vue.js', 'Express']);
    expect(result!.status).toBe('published');
    expect(result!.start_date).toBeInstanceOf(Date);
    expect(result!.end_date).toBeNull();
    expect(result!.sort_order).toBe(10);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should find project with exact slug match', async () => {
    // Create projects with similar slugs
    await db.insert(projectsTable).values([
      {
        title: 'Project One',
        slug: 'project',
        description: 'First project',
        technologies: ['HTML'],
        status: 'published',
        sort_order: 1
      },
      {
        title: 'Project Two',
        slug: 'project-two',
        description: 'Second project',
        technologies: ['CSS'],
        status: 'published',
        sort_order: 2
      }
    ]).execute();

    const result = await getProjectBySlug('project');

    expect(result).not.toBeNull();
    expect(result!.title).toBe('Project One');
    expect(result!.slug).toBe('project');
  });

  it('should handle case-sensitive slug matching', async () => {
    await db.insert(projectsTable).values({
      title: 'Case Test',
      slug: 'case-test-project',
      description: 'Case sensitivity test',
      technologies: ['Python'],
      status: 'published',
      sort_order: 1
    }).execute();

    // Should find exact match
    const exactMatch = await getProjectBySlug('case-test-project');
    expect(exactMatch).not.toBeNull();
    expect(exactMatch!.title).toBe('Case Test');

    // Should not find with different case
    const noMatch = await getProjectBySlug('Case-Test-Project');
    expect(noMatch).toBeNull();
  });
});