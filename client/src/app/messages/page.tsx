"use client";

import {
  FormEvent,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { io, Socket } from "socket.io-client";

import "./page.css";

import { createChatMessage, getChatMessages, getMyChats } from "@/shared/api/chatApi";
import { useAppSelector } from "@/shared/hooks/useReduxHooks";
import { getAccessToken } from "@/shared/lib/axiosInstance";
import { getLocalizedTitle } from "@/shared/lib/localized";
import { ChatMessageType, ChatType, ChatUserType } from "@/shared/types";

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

function formatMessageTime(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatBookingDate(date: string | undefined, locale: string, fallback: string) {
  if (!date) return fallback;

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getAvatarLetter(user?: ChatUserType | null) {
  return user?.name?.trim()?.[0]?.toUpperCase() ?? "T";
}

function getCompanionProfileHref(user?: ChatUserType | null) {
  return user?.role === "master" ? `/masters/${user.id}` : null;
}

function MessengerAvatar({
  className = "",
  user,
}: {
  className?: string;
  user?: ChatUserType | null;
}) {
  const content = user?.avatar ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={user.avatar} alt="" />
  ) : (
    <span>{getAvatarLetter(user)}</span>
  );
  const profileHref = getCompanionProfileHref(user);
  const avatarClassName = `messenger-avatar ${className}`.trim();

  if (!profileHref) {
    return <div className={avatarClassName}>{content}</div>;
  }

  return (
    <Link
      aria-label={`Открыть профиль ${user?.name ?? "мастера"}`}
      className={`${avatarClassName} messenger-avatar-link`}
      href={profileHref}
    >
      {content}
    </Link>
  );
}

function MessagesPageContent() {
  const t = useTranslations("messages");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { user, isInitialized } = useAppSelector((state) => state.user);
  const [chats, setChats] = useState<ChatType[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socketStatus, setSocketStatus] = useState<"offline" | "online">("offline");
  const socketRef = useRef<Socket | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) ?? null,
    [activeChatId, chats],
  );

  const activeCompanion = useMemo(() => {
    if (!activeChat || !user) return null;

    return activeChat.masterId === user.id ? activeChat.client : activeChat.master;
  }, [activeChat, user]);

  const loadChats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getMyChats();
      const requestedChatId = Number(searchParams.get("chatId"));
      const hasRequestedChat = data.some((chat) => chat.id === requestedChatId);
      setChats(data);
      setActiveChatId((currentId) =>
        hasRequestedChat ? requestedChatId : currentId ?? data[0]?.id ?? null,
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("loadChatsError"));
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, t]);

  useEffect(() => {
    if (!isInitialized || !user) return;

    void Promise.resolve().then(loadChats);
  }, [isInitialized, loadChats, user]);

  useEffect(() => {
    if (!user) return;

    const socket = io(API_ORIGIN, {
      auth: { token: getAccessToken() },
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => setSocketStatus("online"));
    socket.on("disconnect", () => setSocketStatus("offline"));
    socket.on("chat:history", (payload: { chatId: number; messages: ChatMessageType[] }) => {
      if (payload.chatId === activeChatId) {
        setMessages(payload.messages);
      }
    });
    socket.on("message:new", (payload: { chatId: number; message: ChatMessageType }) => {
      if (payload.chatId !== activeChatId) return;

      setMessages((currentMessages) => {
        if (currentMessages.some((message) => message.id === payload.message.id)) {
          return currentMessages;
        }

        return [...currentMessages, payload.message];
      });
    });
    socket.on("chat:error", (payload: { message?: string }) => {
      setError(payload.message ?? t("chatConnectError"));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [activeChatId, t, user]);

  useEffect(() => {
    if (!activeChatId) return;

    const loadMessages = async () => {
      try {
        setIsMessagesLoading(true);
        setError(null);
        const data = await getChatMessages(activeChatId);
        setMessages(data);
        socketRef.current?.emit("chat:join", { chatId: activeChatId });
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : t("loadMessagesError"),
        );
      } finally {
        setIsMessagesLoading(false);
      }
    };

    void loadMessages();
  }, [activeChatId, t]);

  useEffect(() => {
    threadRef.current?.scrollTo({
      top: threadRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const text = draft.trim();

    if (!activeChatId || !text) return;

    setDraft("");

    if (socketRef.current?.connected) {
      socketRef.current.emit("message:send", { chatId: activeChatId, text });
      return;
    }

    try {
      const message = await createChatMessage(activeChatId, text);
      setMessages((currentMessages) => [...currentMessages, message]);
    } catch (sendError) {
      setDraft(text);
      setError(sendError instanceof Error ? sendError.message : t("sendError"));
    }
  };

  if (isInitialized && !user) {
    return (
      <main className="messenger-page">
        <section className="messenger-empty">
          <h1>{t("title")}</h1>
          <p>{t("loginRequired")}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="messenger-page">
      <section className="messenger-shell">
        <div className="messenger-main">
          <header className="messenger-chat-head">
            <div className="messenger-peer">
              <MessengerAvatar user={activeCompanion} />
              <div>
                <h1>{activeCompanion?.name ?? t("selectChat")}</h1>
                <p>
                  {getLocalizedTitle(activeCompanion?.ProfileMaster ?? {}, locale) ??
                    getLocalizedTitle(activeChat?.Booking?.Servizi ?? {}, locale) ??
                    t("history")}
                </p>
              </div>
            </div>
            <span className={`messenger-status messenger-status--${socketStatus}`}>
              {socketStatus === "online" ? t("online") : t("connecting")}
            </span>
          </header>

          {activeChat?.Booking ? (
            <div className="messenger-booking">
              <span>{getLocalizedTitle(activeChat.Booking.Servizi ?? {}, locale) ?? t("booking")}</span>
              <strong>{formatBookingDate(activeChat.Booking.startTime, locale, t("bookingDateMissing"))}</strong>
            </div>
          ) : null}

          {error ? <p className="messenger-error">{error}</p> : null}

          <div className="messenger-thread" ref={threadRef}>
            {isMessagesLoading ? (
              <p className="messenger-state">{t("loadingMessages")}</p>
            ) : null}

            {!isMessagesLoading && messages.length === 0 ? (
              <p className="messenger-state">{t("emptyMessages")}</p>
            ) : null}

            {messages.map((message) => {
              const isMine = message.senderId === user?.id;

              return (
                <article
                  className={`messenger-bubble ${isMine ? "messenger-bubble--mine" : ""}`}
                  key={message.id}
                >
                  <p>{message.text}</p>
                  <time>{formatMessageTime(message.createdAt, locale)}</time>
                </article>
              );
            })}
          </div>

          <form className="messenger-compose" onSubmit={handleSubmit}>
            <input
              disabled={!activeChat}
              maxLength={1000}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t("placeholder")}
              type="text"
              value={draft}
            />
            <button disabled={!activeChat || !draft.trim()} type="submit">
              {t("send")}
            </button>
          </form>
        </div>

        <aside className="messenger-sidebar">
          <div className="messenger-sidebar-head">
            <span>{t("chats")}</span>
            <strong>{chats.length}</strong>
          </div>

          {isLoading ? <p className="messenger-state">{t("loadingChats")}</p> : null}

          {!isLoading && chats.length === 0 ? (
            <p className="messenger-state">{t("emptyChats")}</p>
          ) : null}

          <div className="messenger-chat-list">
            {chats.map((chat) => {
              const companion = chat.masterId === user?.id ? chat.client : chat.master;
              const lastMessage = chat.ChatMessages?.[0];
              const isActive = chat.id === activeChatId;

              return (
                <article
                  className={`messenger-chat-card ${isActive ? "is-active" : ""}`}
                  key={chat.id}
                >
                  <MessengerAvatar className="messenger-avatar--small" user={companion} />
                  <button
                    className="messenger-chat-card-content"
                    onClick={() => setActiveChatId(chat.id)}
                    type="button"
                  >
                    <strong>{companion?.name ?? t("user")}</strong>
                    <span>{getLocalizedTitle(chat.Booking?.Servizi ?? {}, locale) ?? t("privateChat")}</span>
                    <p>{lastMessage?.text ?? t("emptyMessages")}</p>
                  </button>
                </article>
              );
            })}
          </div>
        </aside>
      </section>
    </main>
  );
}

export default function MessagesPage() {
  const t = useTranslations("messages");

  return (
    <Suspense
      fallback={
        <main className="messenger-page">
          <section className="messenger-empty">
            <h1>{t("title")}</h1>
            <p>{t("loadingMessenger")}</p>
          </section>
        </main>
      }
    >
      <MessagesPageContent />
    </Suspense>
  );
}
