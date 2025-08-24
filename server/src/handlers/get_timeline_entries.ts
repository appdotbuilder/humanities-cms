import { db } from '../db';
import { timelineEntriesTable } from '../db/schema';
import { type TimelineEntry } from '../schema';
import { eq, desc, asc, and } from 'drizzle-orm';

export async function getTimelineEntries(): Promise<TimelineEntry[]> {
  try {
    const results = await db.select()
      .from(timelineEntriesTable)
      .orderBy(
        asc(timelineEntriesTable.sort_order),
        desc(timelineEntriesTable.start_date)
      )
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch timeline entries:', error);
    throw error;
  }
}

export async function getCareerEntries(): Promise<TimelineEntry[]> {
  try {
    const results = await db.select()
      .from(timelineEntriesTable)
      .where(eq(timelineEntriesTable.entry_type, 'career'))
      .orderBy(
        asc(timelineEntriesTable.sort_order),
        desc(timelineEntriesTable.start_date)
      )
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch career entries:', error);
    throw error;
  }
}

export async function getEducationEntries(): Promise<TimelineEntry[]> {
  try {
    const results = await db.select()
      .from(timelineEntriesTable)
      .where(eq(timelineEntriesTable.entry_type, 'education'))
      .orderBy(
        asc(timelineEntriesTable.sort_order),
        desc(timelineEntriesTable.start_date)
      )
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch education entries:', error);
    throw error;
  }
}

export async function getTimelineEntry(id: number): Promise<TimelineEntry | null> {
  try {
    const results = await db.select()
      .from(timelineEntriesTable)
      .where(eq(timelineEntriesTable.id, id))
      .execute();

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Failed to fetch timeline entry:', error);
    throw error;
  }
}