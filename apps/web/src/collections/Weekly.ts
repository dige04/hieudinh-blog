import type { CollectionConfig } from 'payload'

export const Weekly: CollectionConfig = {
  slug: 'weekly',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'publishedAt', 'status'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'tag',
      type: 'select',
      options: [
        { label: 'AI Weekly', value: 'ai-weekly' },
        { label: 'Tech', value: 'tech' },
        { label: 'Tutorial', value: 'tutorial' },
      ],
      defaultValue: 'ai-weekly',
    },
    {
      name: 'tagColor',
      type: 'select',
      options: ['pink', 'orange', 'green', 'blue', 'purple', 'yellow'],
      defaultValue: 'blue',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'readTime',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Review', value: 'review' },
        { label: 'Published', value: 'published' },
      ],
      defaultValue: 'draft',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'personalInsight',
      type: 'richText',
      label: 'Góc nhìn của mình',
      admin: {
        description: 'Personal commentary section',
      },
    },
  ],
}
