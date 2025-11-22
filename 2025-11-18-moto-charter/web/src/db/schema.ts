import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';

export const users = sqliteTable('users', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: text('role', { enum: ['user', 'admin'] }).default('user').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const listings = sqliteTable('listings', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').notNull().references(() => users.id),
    make: text('make').notNull(),
    model: text('model').notNull(),
    year: integer('year').notNull(),
    price: real('price').notNull(),
    description: text('description').notNull(),
    mileage: integer('mileage').notNull(),
    engineCc: integer('engine_cc').notNull(),
    location: text('location').notNull(),
    bikeType: text('bike_type', { enum: ['sport', 'naked', 'adventure', 'cruiser', 'touring', 'cafe-racer', 'other'] }).notNull(),
    status: text('status', { enum: ['active', 'sold', 'pending'] }).default('active').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const images = sqliteTable('images', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    listingId: text('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    isPrimary: integer('is_primary', { mode: 'boolean' }).default(false).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const serviceRecords = sqliteTable('service_records', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    listingId: text('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
    date: integer('date', { mode: 'timestamp' }).notNull(),
    odometer: integer('odometer').notNull(),
    description: text('description').notNull(),
    fileUrl: text('file_url'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

// Relations
export const listingsRelations = relations(listings, ({ many }) => ({
    images: many(images),
    serviceRecords: many(serviceRecords),
}));

export const imagesRelations = relations(images, ({ one }) => ({
    listing: one(listings, {
        fields: [images.listingId],
        references: [listings.id],
    }),
}));

export const serviceRecordsRelations = relations(serviceRecords, ({ one }) => ({
    listing: one(listings, {
        fields: [serviceRecords.listingId],
        references: [listings.id],
    }),
}));
