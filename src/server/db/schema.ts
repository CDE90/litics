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
} from "drizzle-orm/mysql-core";
// import { type AdapterAccount } from "next-auth/adapters";
import type { AdapterAccount } from "@auth/core/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const mysqlTable = mysqlTableCreator((name) => `litics_${name}`);

export const sites = mysqlTable(
    "site",
    {
        id: varchar("id", { length: 255 }).notNull().primaryKey(),
        name: varchar("name", { length: 255 }),
        url: varchar("url", { length: 255 }),
        createdAt: timestamp("created_at")
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        updatedAt: timestamp("updated_at").onUpdateNow(),
    },
    (site) => ({
        urlIndex: index("url_idx").on(site.url),
    }),
);

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
    },
    (pageview) => ({
        siteIdIdx: index("site_id_idx").on(pageview.siteId),
        hostnameIdx: index("hostname_idx").on(pageview.hostname),
        pathnameIdx: index("pathname_idx").on(pageview.pathname),
        userSignatureIdx: index("user_signature_idx").on(
            pageview.userSignature,
        ),
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
    owner: one(users, { fields: [sites.id], references: [users.id] }),
    pageviews: many(pageviews),
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
