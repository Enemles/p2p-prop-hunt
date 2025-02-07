import { PeerEvents } from "../config";
import { getConn } from "../connection";

type ListenEventCallback<EventName extends keyof PeerEvents> = (
  payload: PeerEvents[EventName]
) => void;
type ListenEvent = <T extends keyof PeerEvents>(
  eventName: T,
  callback: ListenEventCallback<T>
) => void;

type ClientListeners = {
  [key in keyof PeerEvents]?: ListenEventCallback<key>[];
};

export const _listeners: Record<string, ClientListeners> = {};

export const listenEvent: ListenEvent = (eventName, callback) => {
  _listeners["0"] ??= {};
  _listeners["0"][eventName] ??= [];
  _listeners["0"][eventName]?.push(callback);
};

export const sendEvent = <T extends keyof PeerEvents>(
  eventName: T,
  payload: PeerEvents[T]
) => {
  const conn = getConn();

  if (!conn || !conn.open) {
    console.warn("La connexion n'est pas encore ouverte. L'événement", eventName, "n'a pas été envoyé.");
    return;
  }
  // const message = JSON.stringify({ eventName, payload });
  conn.send({ eventName, payload });
};
