import { db } from '../db';
import { timelineEntriesTable } from '../db/schema';
import { type CreateTimelineEntryInput, type TimelineEntry } from '../schema';

export const createTimelineEntry = async (input: CreateTimelineEntryInput): Promise<TimelineEntry> => {
  try {
    const result = await db.insert(timelineEntriesTable)
      .values({
        title: input.title,
        organization: input.organization,
        description: input.description,
        start_date: input.start_date,
        end_date: input.end_date,
        is_current: input.is_current,
        entry_type: input.entry_type,
        location: input.location,
        sort_order: input.sort_order
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Timeline entry creation failed:', error);
    throw error;
  }
};