import { Peer } from "peerjs";
import { _listeners } from "./lib/events";
import { peerEventsSchema } from "./config";

const peer = new Peer();

export const conn = peer.connect("another-peer-id");

conn.on("open", function () {
  conn.on("data", function (data) {
    const parsedEvent = peerEventsSchema.parse(data);

    Object.entries(_listeners).forEach(([_clientId, listeners]) => {
      const eventListeners = listeners[parsedEvent.eventName];

      if (!eventListeners) {
        return;
      }

      eventListeners.forEach((listener) => {
        listener(parsedEvent.payload);
      });
    });
  });
});
