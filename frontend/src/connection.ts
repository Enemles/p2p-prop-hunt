import { Peer } from "peerjs";
import { _listeners } from "./lib/events";
import { peerEventsSchema } from "./config";

export const peer = new Peer();

let _conn: Peer.DataConnection | null = null;

export const setConn = (connection: Peer.DataConnection) => {
  _conn = connection;
};

export const getConn = () => _conn;

export function createConnection(remoteId: string): Peer.DataConnection {
  const connection = peer.connect(remoteId);
  connection.on("open", function () {
    connection.on("data", function (data) {
      const parsedEvent = peerEventsSchema.parse(data);
      Object.entries(_listeners).forEach(([_clientId, listeners]) => {
        const eventListeners = listeners[parsedEvent.eventName];
        if (!eventListeners) return;
        eventListeners.forEach((listener) => listener(parsedEvent.payload));
      });
    });
  });
  return connection;
}
