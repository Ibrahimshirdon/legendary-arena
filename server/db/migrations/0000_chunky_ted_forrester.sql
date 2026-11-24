CREATE TABLE "bootstrap" (
	"id" boolean PRIMARY KEY DEFAULT true NOT NULL,
	"claimed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" text PRIMARY KEY NOT NULL,
	"tournament_id" text NOT NULL,
	"room_id" text NOT NULL,
	"round" text NOT NULL,
	"round_order" integer NOT NULL,
	"player1_id" text NOT NULL,
	"player2_id" text NOT NULL,
	"score1" integer,
	"score2" integer,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"scheduled_at" bigint NOT NULL,
	"submission1_score1" integer,
	"submission1_score2" integer,
	"submission1_at" bigint,
	"submission2_score1" integer,
	"submission2_score2" integer,
	"submission2_at" bigint,
	"winner_id" text,
	"is_draw" boolean DEFAULT false NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_reactions" (
	"message_id" text NOT NULL,
	"emoji" text NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "message_reactions_message_id_emoji_user_id_pk" PRIMARY KEY("message_id","emoji","user_id")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"text" text DEFAULT '' NOT NULL,
	"reply_to_id" text,
	"is_announcement" boolean DEFAULT false NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"link" text DEFAULT '',
	"read" boolean DEFAULT false NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_announcements" (
	"id" text PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"author_id" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_members" (
	"room_id" text NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "room_members_room_id_user_id_pk" PRIMARY KEY("room_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "room_pending_requests" (
	"room_id" text NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "room_pending_requests_room_id_user_id_pk" PRIMARY KEY("room_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"banner_url" text DEFAULT '' NOT NULL,
	"invite_code" text NOT NULL,
	"owner_id" text NOT NULL,
	"created_at" bigint NOT NULL,
	CONSTRAINT "rooms_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "tournament_participants" (
	"tournament_id" text NOT NULL,
	"participant_id" text NOT NULL,
	CONSTRAINT "tournament_participants_tournament_id_participant_id_pk" PRIMARY KEY("tournament_id","participant_id")
);
--> statement-breakpoint
CREATE TABLE "tournament_registrations" (
	"tournament_id" text NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "tournament_registrations_tournament_id_user_id_pk" PRIMARY KEY("tournament_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "tournament_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"requester_id" text NOT NULL,
	"name" text NOT NULL,
	"format" text NOT NULL,
	"num_players" integer NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"proposed_date" bigint NOT NULL,
	"message" text DEFAULT '',
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_note" text,
	"linked_tournament_id" text,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" text PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"name" text NOT NULL,
	"banner_url" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"format" text NOT NULL,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"start_date" bigint NOT NULL,
	"registration_deadline" bigint NOT NULL,
	"max_players" integer NOT NULL,
	"rules" text DEFAULT '' NOT NULL,
	"point_win" integer DEFAULT 3 NOT NULL,
	"point_draw" integer DEFAULT 1 NOT NULL,
	"point_loss" integer DEFAULT 0 NOT NULL,
	"created_by" text NOT NULL,
	"created_at" bigint NOT NULL,
	"champion_id" text,
	"runner_up_id" text,
	"third_place_id" text
);
--> statement-breakpoint
CREATE TABLE "trophies" (
	"id" text PRIMARY KEY NOT NULL,
	"tournament_id" text NOT NULL,
	"tournament_name" text NOT NULL,
	"room_id" text NOT NULL,
	"format" text NOT NULL,
	"winner_id" text NOT NULL,
	"runner_up_id" text NOT NULL,
	"third_place_id" text,
	"date" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"username_lower" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"avatar_url" text DEFAULT '' NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"favorite_team" text,
	"bio" text,
	"online" boolean DEFAULT false NOT NULL,
	"last_seen" bigint DEFAULT 0 NOT NULL,
	"created_at" bigint NOT NULL,
	"tournaments_played" integer DEFAULT 0 NOT NULL,
	"matches_played" integer DEFAULT 0 NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"losses" integer DEFAULT 0 NOT NULL,
	"draws" integer DEFAULT 0 NOT NULL,
	"goals_for" integer DEFAULT 0 NOT NULL,
	"goals_against" integer DEFAULT 0 NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"trophies" integer DEFAULT 0 NOT NULL,
	"runner_ups" integer DEFAULT 0 NOT NULL,
	"third_places" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "users_username_lower_unique" UNIQUE("username_lower"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_announcements" ADD CONSTRAINT "room_announcements_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_announcements" ADD CONSTRAINT "room_announcements_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_members" ADD CONSTRAINT "room_members_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_members" ADD CONSTRAINT "room_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_pending_requests" ADD CONSTRAINT "room_pending_requests_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_pending_requests" ADD CONSTRAINT "room_pending_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_registrations" ADD CONSTRAINT "tournament_registrations_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_registrations" ADD CONSTRAINT "tournament_registrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_requests" ADD CONSTRAINT "tournament_requests_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_requests" ADD CONSTRAINT "tournament_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trophies" ADD CONSTRAINT "trophies_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trophies" ADD CONSTRAINT "trophies_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trophies" ADD CONSTRAINT "trophies_winner_id_users_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trophies" ADD CONSTRAINT "trophies_runner_up_id_users_id_fk" FOREIGN KEY ("runner_up_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trophies" ADD CONSTRAINT "trophies_third_place_id_users_id_fk" FOREIGN KEY ("third_place_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;