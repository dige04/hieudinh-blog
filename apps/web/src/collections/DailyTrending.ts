import type { CollectionConfig } from 'payload'

export const DailyTrending: CollectionConfig = {
  slug: 'daily-trending',
  admin: {
    useAsTitle: 'batchId',
    defaultColumns: ['batchId', 'date', 'status', 'itemCount'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'batchId',
      type: 'text',
      required: true,
      unique: true,
      // format: "2026-02-16T08" (ISO date + hour)
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Collected', value: 'collected' },
        { label: 'Scored', value: 'scored' },
        { label: 'Processed', value: 'processed' },
        { label: 'Merged', value: 'merged' },
      ],
      defaultValue: 'collected',
      admin: { position: 'sidebar' },
    },
    {
      name: 'itemCount',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
    {
      name: 'items',
      type: 'json',
      required: true,
      // ScoredItem[] serialized as JSON
    },
    {
      name: 'sourceStats',
      type: 'json',
      // { hackernews: 12, rss: 8, arxiv: 5, github: 3, x: 0 }
    },
    {
      name: 'pipelineLog',
      type: 'json',
      // PipelineLog
    },
  ],
}
