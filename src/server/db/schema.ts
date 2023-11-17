import { relations, sql } from "drizzle-orm";
import {
    index,
    int,
    mysqlTableCreator,
    primaryKey,
    text,
    timestamp,
    varchar,
    boolean,
    customType,
} from "drizzle-orm/mysql-core";
import type { AdapterAccount } from "@auth/core/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const mysqlTable = mysqlTableCreator((name) => `litics_${name}`);

// if getting error with pnpm db:push run the following command in db console
// drop table if exists litics_page_stats, litics_referrer_stats, litics_site_stats, litics_browser_stats, litics_device_type_stats, litics_location_stats;

export const sites = mysqlTable(
    "site",
    {
        id: varchar("id", { length: 255 }).notNull().primaryKey(),
        name: varchar("name", { length: 255 }),
        url: varchar("url", { length: 255 }),
        userId: varchar("user_id", { length: 255 }).notNull(),
        createdAt: timestamp("created_at")
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        updatedAt: timestamp("updated_at").onUpdateNow(),
    },
    (site) => ({
        urlIndex: index("url_idx").on(site.url),
    }),
);

const pageviewHashGenerated = customType<{
    data: string;
    notNull: true;
    default: true;
}>({
    dataType: () => {
        return `binary(16) generated always as (
            unhex(md5(concat_ws(
                "|",
                site_id,
                user_signature,
                pathname,
                has_exited
            )))
        ) stored`;
    },
});

export const pageviews = mysqlTable(
    "pageview",
    {
        id: varchar("id", { length: 255 }).notNull().primaryKey(),
        siteId: varchar("site_id", { length: 255 }).notNull(),
        hostname: varchar("hostname", { length: 255 }).notNull(),
        pathname: varchar("pathname", { length: 255 }).notNull(),
        userSignature: varchar("user_signature", { length: 255 }).notNull(),
        isNewVisit: boolean("is_new_visit").default(true).notNull(),
        isNewSession: boolean("is_new_session").default(true).notNull(),
        referrerHostname: varchar("referrer_hostname", { length: 255 }),
        referrerPathname: varchar("referrer_pathname", { length: 255 }),
        screenSize: varchar("screen_size", { length: 255 }),
        browser: varchar("browser", { length: 255 }),
        os: varchar("os", { length: 255 }),
        duration: int("duration").default(0).notNull(),
        timestamp: timestamp("timestamp")
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        locationId: varchar("location_id", { length: 255 }),
        hasExited: boolean("has_exited").default(false).notNull(),
        pageviewHash: pageviewHashGenerated("pageview_hash"),
    },
    (pageview) => ({
        timestampIdx: index("timestamp_idx").on(pageview.timestamp),
        siteIdTimestampIdx: index("site_id_timestamp_idx").on(
            pageview.siteId,
            pageview.timestamp,
        ),
        pageviewHashIdx: index("pageview_hash_idx").on(pageview.pageviewHash),
    }),
);

export const locations = mysqlTable(
    "location",
    {
        id: varchar("id", { length: 255 }).notNull().primaryKey(),
        region: varchar("region", { length: 255 }),
        country: varchar("country", { length: 255 }),
        city: varchar("city", { length: 255 }),
    },
    (location) => ({
        regionIdx: index("region_idx").on(location.region),
        countryIdx: index("country_idx").on(location.country),
        cityIdx: index("city_idx").on(location.city),
    }),
);

export const sitesRelations = relations(sites, ({ one, many }) => ({
    owner: one(users, { fields: [sites.userId], references: [users.id] }),
    pageviews: many(pageviews),
    pageStats: many(pageStats),
    referrerStats: many(referrerStats),
    siteStats: many(siteStats),
    browserStats: many(browserStats),
    deviceTypeStats: many(deviceTypeStats),
    locationStats: many(locationStats),
}));

export const pageviewsRelations = relations(pageviews, ({ one }) => ({
    site: one(sites, { fields: [pageviews.siteId], references: [sites.id] }),
    location: one(locations, {
        fields: [pageviews.locationId],
        references: [locations.id],
    }),
}));

export const locationsRelations = relations(locations, ({ many }) => ({
    pageview: many(pageviews),
}));

// Aggregates

export const pageStats = mysqlTable(
    "page_stats",
    {
        id: int("id").autoincrement().primaryKey(),
        siteId: varchar("site_id", { length: 255 }).notNull(),
        pathname: varchar("pathname", { length: 255 }).notNull(),
        pageviews: int("pageviews").default(0).notNull(),
        uniquePageviews: int("unique_pageviews").default(0).notNull(),
        avgDuration: int("avg_duration").default(0).notNull(),
        timestamp: timestamp("timestamp").notNull(),
    },
    (pageStat) => ({
        pathnameIdx: index("pathname_idx").on(pageStat.pathname),
        timestampIdx: index("timestamp_idx").on(pageStat.timestamp),
    }),
);

export const referrerStats = mysqlTable(
    "referrer_stats",
    {
        id: int("id").autoincrement().primaryKey(),
        siteId: varchar("site_id", { length: 255 }).notNull(),
        pathname: varchar("pathname", { length: 255 }).notNull(),
        referrerHostname: varchar("referrer_hostname", { length: 255 }),
        pageviews: int("pageviews").default(0).notNull(),
        uniquePageviews: int("unique_pageviews").default(0).notNull(),
        avgDuration: int("avg_duration").default(0).notNull(),
        timestamp: timestamp("timestamp").notNull(),
    },
    (referrerStat) => ({
        pathnameIdx: index("pathname_idx").on(referrerStat.pathname),
        timestampIdx: index("timestamp_idx").on(referrerStat.timestamp),
    }),
);

export const siteStats = mysqlTable(
    "site_stats",
    {
        id: int("id").autoincrement().primaryKey(),
        siteId: varchar("site_id", { length: 255 }).notNull(),
        pageviews: int("pageviews").default(0).notNull(),
        uniquePageviews: int("unique_pageviews").default(0).notNull(),
        avgDuration: int("avg_duration").default(0).notNull(),
        timestamp: timestamp("timestamp").notNull(),
    },
    (siteStat) => ({
        siteIdIdx: index("site_id_idx").on(siteStat.siteId),
        timestampIdx: index("timestamp_idx").on(siteStat.timestamp),
    }),
);

export const browserStats = mysqlTable(
    "browser_stats",
    {
        id: int("id").autoincrement().primaryKey(),
        siteId: varchar("site_id", { length: 255 }).notNull(),
        pathname: varchar("pathname", { length: 255 }).notNull(),
        browserName: varchar("browser_name", { length: 255 }).notNull(),
        pageviews: int("pageviews").default(0).notNull(),
        uniquePageviews: int("unique_pageviews").default(0).notNull(),
        avgDuration: int("avg_duration").default(0).notNull(),
        timestamp: timestamp("timestamp").notNull(),
    },
    (browserStat) => ({
        pathnameIdx: index("pathname_idx").on(browserStat.pathname),
        timestampIdx: index("timestamp_idx").on(browserStat.timestamp),
    }),
);

export const deviceTypeStats = mysqlTable(
    "device_type_stats",
    {
        id: int("id").autoincrement().primaryKey(),
        siteId: varchar("site_id", { length: 255 }).notNull(),
        os: varchar("os", { length: 255 }).notNull(),
        deviceType: varchar("device_type", { length: 255 }).notNull(), // either mobile, tablet, or desktop
        pathname: varchar("pathname", { length: 255 }).notNull(),
        pageviews: int("pageviews").default(0).notNull(),
        uniquePageviews: int("unique_pageviews").default(0).notNull(),
        avgDuration: int("avg_duration").default(0).notNull(),
        timestamp: timestamp("timestamp").notNull(),
    },
    (deviceTypeStat) => ({
        pathnameIdx: index("pathname_idx").on(deviceTypeStat.pathname),
        timestampIdx: index("timestamp_idx").on(deviceTypeStat.timestamp),
    }),
);

export const locationStats = mysqlTable(
    "location_stats",
    {
        id: int("id").autoincrement().primaryKey(),
        siteId: varchar("site_id", { length: 255 }).notNull(),
        pathname: varchar("pathname", { length: 255 }).notNull(),
        country: varchar("country", { length: 255 }),
        region: varchar("region", { length: 255 }),
        city: varchar("city", { length: 255 }),
        pageviews: int("pageviews").default(0).notNull(),
        uniquePageviews: int("unique_pageviews").default(0).notNull(),
        avgDuration: int("avg_duration").default(0).notNull(),
        timestamp: timestamp("timestamp").notNull(),
    },
    (locationStat) => ({
        pathnameIdx: index("pathname_idx").on(locationStat.pathname),
        timestampIdx: index("timestamp_idx").on(locationStat.timestamp),
    }),
);

export const pageStatsRelations = relations(pageStats, ({ one }) => ({
    site: one(sites, { fields: [pageStats.siteId], references: [sites.id] }),
}));

export const referrerStatsRelations = relations(referrerStats, ({ one }) => ({
    site: one(sites, {
        fields: [referrerStats.siteId],
        references: [sites.id],
    }),
}));

export const siteStatsRelations = relations(siteStats, ({ one }) => ({
    site: one(sites, { fields: [siteStats.siteId], references: [sites.id] }),
}));

export const browserStatsRelations = relations(browserStats, ({ one }) => ({
    site: one(sites, { fields: [browserStats.siteId], references: [sites.id] }),
}));

export const deviceTypeStatsRelations = relations(
    deviceTypeStats,
    ({ one }) => ({
        site: one(sites, {
            fields: [deviceTypeStats.siteId],
            references: [sites.id],
        }),
    }),
);

export const locationStatsRelations = relations(locationStats, ({ one }) => ({
    site: one(sites, {
        fields: [locationStats.siteId],
        references: [sites.id],
    }),
}));

// Authentication Models

export const users = mysqlTable("user", {
    id: varchar("id", { length: 255 }).notNull().primaryKey(),
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 255 }).notNull(),
    emailVerified: timestamp("emailVerified", {
        mode: "date",
        fsp: 3,
    }).default(sql`CURRENT_TIMESTAMP(3)`),
    image: varchar("image", { length: 255 }),
});

export const usersRelations = relations(users, ({ many }) => ({
    accounts: many(accounts),
    sites: many(sites),
}));

export const accounts = mysqlTable(
    "account",
    {
        userId: varchar("userId", { length: 255 }).notNull(),
        type: varchar("type", { length: 255 })
            .$type<AdapterAccount["type"]>()
            .notNull(),
        provider: varchar("provider", { length: 255 }).notNull(),
        providerAccountId: varchar("providerAccountId", {
            length: 255,
        }).notNull(),
        refresh_token: text("refresh_token"),
        access_token: text("access_token"),
        expires_at: int("expires_at"),
        token_type: varchar("token_type", { length: 255 }),
        scope: varchar("scope", { length: 255 }),
        id_token: text("id_token"),
        session_state: varchar("session_state", { length: 255 }),
    },
    (account) => ({
        compoundKey: primaryKey(account.provider, account.providerAccountId),
        userIdIdx: index("userId_idx").on(account.userId),
    }),
);

export const accountsRelations = relations(accounts, ({ one }) => ({
    user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = mysqlTable(
    "session",
    {
        sessionToken: varchar("sessionToken", { length: 255 })
            .notNull()
            .primaryKey(),
        userId: varchar("userId", { length: 255 }).notNull(),
        expires: timestamp("expires", { mode: "date" }).notNull(),
    },
    (session) => ({
        userIdIdx: index("userId_idx").on(session.userId),
    }),
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = mysqlTable(
    "verificationToken",
    {
        identifier: varchar("identifier", { length: 255 }).notNull(),
        token: varchar("token", { length: 255 }).notNull(),
        expires: timestamp("expires", { mode: "date" }).notNull(),
    },
    (vt) => ({
        compoundKey: primaryKey(vt.identifier, vt.token),
    }),
);
