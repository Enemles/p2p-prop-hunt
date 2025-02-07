import { Peer, DataConnection } from "peerjs";
import { _listeners } from "./lib/events";
import { peerEventsSchema } from "./config";

export const peer = new Peer();

let _conn: DataConnection | null = null;

export const setConn = (connection: DataConnection) => {
  _conn = connection;
};

export const getConn = () => _conn;

export function createConnection(remoteId: string): DataConnection {
  const connection = peer.connect(remoteId);
  connection.on("open", function () {
    connection.on("data", function (data) {
      const parsedEvent = peerEventsSchema.parse(data);
      Object.entries(_listeners).forEach(([_clientId, listeners]) => {
        const eventListeners = listeners[parsedEvent.eventName];
        if (!eventListeners) return;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        eventListeners.forEach((listener) => listener(parsedEvent.payload));
      });
    });
  });
  return connection;
}
