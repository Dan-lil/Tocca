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
import { useSearchParams } from "next/navigation";
import { io, Socket } from "socket.io-client";

import "./page.css";

import { createChatMessage, getChatMessages, getMyChats } from "@/shared/api/chatApi";
import { useAppSelector } from "@/shared/hooks/useReduxHooks";
import { getAccessToken } from "@/shared/lib/axiosInstance";
import { ChatMessageType, ChatType, ChatUserType } from "@/shared/types";

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

function formatMessageTime(date: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatBookingDate(date?: string) {
  if (!date) return "Дата записи не указана";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getAvatarLetter(user?: ChatUserType | null) {
  return user?.name?.trim()?.[0]?.toUpperCase() ?? "T";
}

function MessagesPageContent() {
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
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить чаты");
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

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
      setError(payload.message ?? "Ошибка подключения к чату");
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [activeChatId, user]);

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
          loadError instanceof Error ? loadError.message : "Не удалось загрузить сообщения",
        );
      } finally {
        setIsMessagesLoading(false);
      }
    };

    void loadMessages();
  }, [activeChatId]);

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
      setError(sendError instanceof Error ? sendError.message : "Не удалось отправить сообщение");
    }
  };

  if (isInitialized && !user) {
    return (
      <main className="messenger-page">
        <section className="messenger-empty">
          <h1>Сообщения</h1>
          <p>Войдите в аккаунт, чтобы открыть переписку с мастерами и клиентами.</p>
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
              <div className="messenger-avatar">
                {activeCompanion?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={activeCompanion.avatar} alt="" />
                ) : (
                  <span>{getAvatarLetter(activeCompanion)}</span>
                )}
              </div>
              <div>
                <h1>{activeCompanion?.name ?? "Выберите чат"}</h1>
                <p>
                  {activeCompanion?.ProfileMaster?.title ??
                    activeChat?.Booking?.Servizi?.title ??
                    "История переписки"}
                </p>
              </div>
            </div>
            <span className={`messenger-status messenger-status--${socketStatus}`}>
              {socketStatus === "online" ? "онлайн" : "подключение"}
            </span>
          </header>

          {activeChat ? (
            <div className="messenger-booking">
              <span>{activeChat.Booking?.Servizi?.title ?? "Запись"}</span>
              <strong>{formatBookingDate(activeChat.Booking?.startTime)}</strong>
            </div>
          ) : null}

          {error ? <p className="messenger-error">{error}</p> : null}

          <div className="messenger-thread" ref={threadRef}>
            {isMessagesLoading ? (
              <p className="messenger-state">Загружаю сообщения...</p>
            ) : null}

            {!isMessagesLoading && messages.length === 0 ? (
              <p className="messenger-state">Сообщений пока нет. Начните диалог.</p>
            ) : null}

            {messages.map((message) => {
              const isMine = message.senderId === user?.id;

              return (
                <article
                  className={`messenger-bubble ${isMine ? "messenger-bubble--mine" : ""}`}
                  key={message.id}
                >
                  <p>{message.text}</p>
                  <time>{formatMessageTime(message.createdAt)}</time>
                </article>
              );
            })}
          </div>

          <form className="messenger-compose" onSubmit={handleSubmit}>
            <input
              disabled={!activeChat}
              maxLength={1000}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Написать сообщение"
              type="text"
              value={draft}
            />
            <button disabled={!activeChat || !draft.trim()} type="submit">
              Отправить
            </button>
          </form>
        </div>

        <aside className="messenger-sidebar">
          <div className="messenger-sidebar-head">
            <span>Чаты</span>
            <strong>{chats.length}</strong>
          </div>

          {isLoading ? <p className="messenger-state">Загружаю чаты...</p> : null}

          {!isLoading && chats.length === 0 ? (
            <p className="messenger-state">Чаты появятся после создания записи.</p>
          ) : null}

          <div className="messenger-chat-list">
            {chats.map((chat) => {
              const companion = chat.masterId === user?.id ? chat.client : chat.master;
              const lastMessage = chat.ChatMessages?.[0];
              const isActive = chat.id === activeChatId;

              return (
                <button
                  className={`messenger-chat-card ${isActive ? "is-active" : ""}`}
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  type="button"
                >
                  <div className="messenger-avatar messenger-avatar--small">
                    {companion?.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={companion.avatar} alt="" />
                    ) : (
                      <span>{getAvatarLetter(companion)}</span>
                    )}
                  </div>
                  <div>
                    <strong>{companion?.name ?? "Пользователь"}</strong>
                    <span>{chat.Booking?.Servizi?.title ?? "Запись"}</span>
                    <p>{lastMessage?.text ?? "Сообщений пока нет"}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
      </section>
    </main>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <main className="messenger-page">
          <section className="messenger-empty">
            <h1>Сообщения</h1>
            <p>Загружаю мессенджер...</p>
          </section>
        </main>
      }
    >
      <MessagesPageContent />
    </Suspense>
  );
}
