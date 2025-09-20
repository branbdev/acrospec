// storage-adapter-import-placeholder
import 'dotenv/config'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Function to safely parse DATABASE_URL and ensure proper string types
// This fixes the SASL authentication issue: "client password must be a string"
function parseDatabaseConfig(databaseUrl: string | undefined) {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not defined')
  }

  try {
    const url = new URL(databaseUrl)
    
    // Explicitly ensure all string fields are proper strings
    // This is crucial for preventing SASL authentication errors
    const config = {
      host: String(url.hostname),
      port: Number(url.port) || 5432,
      database: String(url.pathname.slice(1)), // Remove leading '/'
      user: String(url.username),
      password: String(url.password || ''), // Explicitly convert to string
    }
    
    return config
  } catch (error) {
    console.error('Error parsing DATABASE_URL:', error)
    throw error
  }
}

// Parse the database configuration to ensure proper types
const databaseUrl = process.env.DATABASE_URL
const dbConfig = parseDatabaseConfig(databaseUrl)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      // Use explicit configuration to avoid any type issues with connectionString
      // This ensures the password is always treated as a string
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
      password: dbConfig.password, // Guaranteed to be a string
      ssl: false, // Disable SSL for local development (equivalent to sslmode=disable)
    },
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    // storage-adapter-placeholder
  ],
})
