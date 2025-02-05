import { z } from "zod";

export const peerEventsSchema = z.union([
  z.object({
    eventName: z.literal("UPDATE_POS"),
    payload: z.object({
      x: z.number(),
      y: z.number(),
    }),
  }),
  z.object({
    eventName: z.literal("USER_CLICK"),
    payload: z.object({
      x: z.number(),
      y: z.number(),
    }),
  }),
]);

export type PeerEvents = {
  [E in z.infer<typeof peerEventsSchema> as E["eventName"]]: E["payload"];
};

export const config = {
  events: {
    UPDATE_POS: "UPDATE_POS",
    USER_CLICK: "USER_CLICK",
  } satisfies Record<keyof PeerEvents, string>,
};
