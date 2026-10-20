export type NotificationType =
  | "matchday_opened"
  | "matchday_closed"
  | "season_ended"
  | "league_started"
  | "attempt_purchased"
  | "ad_reward_granted"
  | "match_result"
  | "general";

export interface CreateNotificationInput {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, unknown>;
}

export interface SendPushInput {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}
