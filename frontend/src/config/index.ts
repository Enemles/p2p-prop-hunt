import { z } from "zod";

export const peerEventsSchema = z.union([
  z.object({
    eventName: z.literal("UPDATE_POS"),
    payload: z.object({
      x: z.number(),
      y: z.number(),
      asset: z.string(),
      role: z.enum(["prop", "hunter"]),
    }),
  }),
  z.object({
    eventName: z.literal("WIN"),
    payload: z.null(),
  }),
]);

export type PeerEvents = {
  [E in z.infer<typeof peerEventsSchema> as E["eventName"]]: E["payload"];
};

export const config = {
  events: {
    UPDATE_POS: "UPDATE_POS",
    WIN: "WIN",
  } satisfies Record<keyof PeerEvents, string>,
};
