"use client";

import "./page.css";
import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/store/store";
import { fetchUpcomingBookingsThunk } from "@/entities/booking/api/BookingApiThunk";
import { fetchSalesForClientThunk } from "@/entities/sale/api/SaleApiThunk";
import {
  addPortfolioItemThunk,
  addServiceThunk,
  deletePortfolioItemThunk,
  deleteServiceThunk,
  fetchMasterMoneyThunk,
  fetchMasterPortfolioThunk,
  fetchMasterServicesThunk,
  fetchMasterStatsThunk,
  fetchUpcomingBookingsForMasterThunk,
} from "@/entities/master/api/masterThunk";
import { updateUserProfileThunk } from "@/entities/user/api/UserApiThunk";
import { Servizi } from "@/entities/servizi/model/index";
import type { BookingToMaster, PortfolioItem } from "@/entities/master/model/index";
import type { Sale } from "@/entities/sale/model";
import type { Booking } from "@/entities/booking/model";
import { getBookingsByClient } from "@/shared/api/bookingApi";
import { getCategories } from "@/shared/api/categoryApi";
import { getMyMasterRecommendations } from "@/shared/api/aiApi";
import { createReview, getReviewsByClient, getReviewsByMaster } from "@/shared/api/ecoApi";
import {
  createMasterSocial,
  deleteMasterSocial,
  getMyMasterSocials,
} from "@/shared/api/masterSocialApi";
import { axiosInstance } from "@/shared/lib/axiosInstance";
import type {
  BookingType,
  CategoryType,
  EcoReviewType,
  MasterSocialType,
  RecommendedMasterType,
  ServerResponseType,
} from "@/shared/types";

type ProfileMaster = {
  id?: number;
  userId?: number;
  title: string;
  description: string;
  city: string;
  address: string;
  experience: number;
  category: string;
  rating: number;
};

type UploadedImage = {
  name: string;
  type: string;
  data: string;
};

type ClientProfileForm = {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  avatarFile: UploadedImage | null;
};

type ReviewDraft = {
  rating: number;
  text: string;
};

type MasterSocialForm = {
  telegram: string;
  vk: string;
  instagram: string;
};

const emptyMasterSocials: MasterSocialForm = {
  telegram: "",
  vk: "",
  instagram: "",
};

function normalizeSocialContact(network: string, value: string) {
  const contact = value.trim();

  if (!contact) return "";
  if (contact.startsWith("http://") || contact.startsWith("https://")) return contact;

  const username = contact.replace(/^@/, "");

  if (network === "telegram") {
    return `https://t.me/${username.replace(/^t\.me\//, "")}`;
  }

  if (network === "instagram") {
    return `https://instagram.com/${username.replace(/^instagram\.com\//, "")}`;
  }

  if (network === "vk") {
    return `https://vk.com/${username.replace(/^vk\.com\//, "")}`;
  }

  return contact;
}

const emptyMasterProfile: ProfileMaster = {
  title: "",
  description: "",
  city: "",
  address: "",
  experience: 0,
  category: "",
  rating: 0,
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

function getMediaUrl(value?: string | null) {
  if (!value) return "";

  if (value.startsWith("http") || value.startsWith("data:") || value.startsWith("blob:")) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${apiBaseUrl}${value}`;
  }

  return value;
}

function formatDateTime(value: string | number) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.user);
  const { upcomingBookings } = useSelector((state: RootState) => state.booking);
  const { salesForClient } = useSelector((state: RootState) => state.sale);
  const { stats, earnings, services, portfolio, upcomingBookings: masterBookings, loading } =
    useSelector((state: RootState) => state.master);

  const [showAddService, setShowAddService] = useState(false);
  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isClientProfileModalOpen, setIsClientProfileModalOpen] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [masterProfile, setMasterProfile] = useState<ProfileMaster>(emptyMasterProfile);
  const [clientProfile, setClientProfile] = useState<ClientProfileForm>({
    name: "",
    email: "",
    phone: "",
    avatar: "",
    avatarFile: null,
  });
  const [clientPastBookings, setClientPastBookings] = useState<BookingType[]>([]);
  const [clientReviews, setClientReviews] = useState<EcoReviewType[]>([]);
  const [recommendedMasters, setRecommendedMasters] = useState<RecommendedMasterType[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);
  const [reviewDrafts, setReviewDrafts] = useState<Record<number, ReviewDraft>>({});
  const [reviewSavingId, setReviewSavingId] = useState<number | null>(null);
  const [clientHistoryError, setClientHistoryError] = useState<string | null>(null);
  const [masterReviews, setMasterReviews] = useState<EcoReviewType[]>([]);
  const [masterReviewsError, setMasterReviewsError] = useState<string | null>(null);
  const [masterSocials, setMasterSocials] = useState<MasterSocialType[]>([]);
  const [masterSocialForm, setMasterSocialForm] =
    useState<MasterSocialForm>(emptyMasterSocials);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [newService, setNewService] = useState({
    title: "",
    description: "",
    price: 0,
    duration: 60,
    categoryId: 1,
  });
  const [newPhoto, setNewPhoto] = useState({
    imageFile: null as UploadedImage | null,
    title: "",
    description: "",
  });

  const isMaster = user?.role === "master";

  useEffect(() => {
    if (!user) return;

    if (isMaster) {
      dispatch(fetchMasterStatsThunk());
      dispatch(fetchMasterMoneyThunk());
      dispatch(fetchMasterServicesThunk());
      dispatch(fetchMasterPortfolioThunk());
      dispatch(fetchUpcomingBookingsForMasterThunk());
    } else {
      dispatch(fetchUpcomingBookingsThunk());
      dispatch(fetchSalesForClientThunk());
    }
  }, [dispatch, isMaster, user]);

  useEffect(() => {
    if (!user || isMaster) return;

    const loadClientHistory = async () => {
      try {
        setClientHistoryError(null);

        const [bookingsData, reviewsData] = await Promise.all([
          getBookingsByClient(user.id),
          getReviewsByClient(user.id),
        ]);
        const now = Date.now();

        setClientPastBookings(
          bookingsData
            .filter((booking) => new Date(booking.endTime).getTime() < now)
            .sort(
              (a, b) =>
                new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
            ),
        );
        setClientReviews(reviewsData);
      } catch (error) {
        setClientHistoryError(
          error instanceof Error ? error.message : "Не удалось загрузить прошлые записи",
        );
      }
    };

    void loadClientHistory();
  }, [isMaster, user]);

  useEffect(() => {
    if (!user || isMaster) return;

    const loadRecommendations = async () => {
      try {
        setRecommendationsLoading(true);
        setRecommendationsError(null);

        const recommendations = await getMyMasterRecommendations(6);

        setRecommendedMasters(recommendations);
      } catch (error) {
        setRecommendationsError(
          error instanceof Error ? error.message : "Не удалось загрузить рекомендации",
        );
      } finally {
        setRecommendationsLoading(false);
      }
    };

    void loadRecommendations();
  }, [isMaster, user]);

  useEffect(() => {
    if (!isMaster) return;

    const loadMasterProfile = async () => {
      try {
        const [profileResponse, socialsData] = await Promise.all([
          axiosInstance.get<ServerResponseType<ProfileMaster | null>>("/profile/me"),
          getMyMasterSocials(),
        ]);

        setMasterProfile(profileResponse.data.data ?? emptyMasterProfile);
        setMasterSocials(socialsData);
        setMasterSocialForm({
          telegram:
            socialsData.find((social) => social.network === "telegram")?.contact ?? "",
          vk: socialsData.find((social) => social.network === "vk")?.contact ?? "",
          instagram:
            socialsData.find((social) => social.network === "instagram")?.contact ?? "",
        });
      } catch {
        setProfileError("Не удалось загрузить профиль мастера");
      }
    };

    void loadMasterProfile();
  }, [isMaster]);

  useEffect(() => {
    if (!user || !isMaster) return;

    const loadMasterReviews = async () => {
      try {
        setMasterReviewsError(null);
        const reviewsData = await getReviewsByMaster(user.id);

        setMasterReviews(reviewsData);
      } catch (error) {
        setMasterReviewsError(
          error instanceof Error ? error.message : "Не удалось загрузить отзывы",
        );
      }
    };

    void loadMasterReviews();
  }, [isMaster, user]);

  useEffect(() => {
    if (!user || !isMaster) return;

    const loadCategories = async () => {
      try {
        setCategoriesError(null);
        const categoriesData = await getCategories();

        setCategories(categoriesData);
        setNewService((currentService) => ({
          ...currentService,
          categoryId: currentService.categoryId || categoriesData[0]?.id || 1,
        }));
      } catch (error) {
        setCategoriesError(
          error instanceof Error ? error.message : "Не удалось загрузить категории",
        );
      }
    };

    void loadCategories();
  }, [isMaster, user]);

  async function handleSaveMasterProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setProfileError("Не удалось определить пользователя");
      return;
    }

    setIsProfileSaving(true);
    setProfileError(null);

    try {
      await dispatch(
        updateUserProfileThunk({
          name: user.name,
          email: user.email,
          phone: user.phone ?? "",
          avatar: user.avatar ?? "",
          avatarFile: clientProfile.avatarFile ?? undefined,
        }),
      ).unwrap();

      const response = await axiosInstance.put<ServerResponseType<ProfileMaster>>(
        "/profile/update",
        masterProfile,
      );

      if (response.data.data) {
        setMasterProfile(response.data.data);
      }

      await Promise.all(masterSocials.map((social) => deleteMasterSocial(social.id)));

      const nextSocials = Object.entries(masterSocialForm)
        .map(([network, contact]) => ({
          network,
          contact: normalizeSocialContact(network, contact),
        }))
        .filter((social) => social.contact);

      const savedSocials = await Promise.all(nextSocials.map(createMasterSocial));

      setMasterSocials(savedSocials);
      dispatch(fetchMasterStatsThunk());
      setIsProfileModalOpen(false);
    } catch {
      setProfileError("Не удалось сохранить профиль мастера");
    } finally {
      setIsProfileSaving(false);
    }
  }

  function handleOpenClientProfileModal() {
    if (!user) return;

    setClientProfile({
      name: user.name ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      avatar: user.avatar ?? "",
      avatarFile: null,
    });
    setIsClientProfileModalOpen(true);
  }

  function handleOpenMasterProfileModal() {
    if (!user) return;

    setClientProfile({
      name: user.name ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      avatar: user.avatar ?? "",
      avatarFile: null,
    });
    setIsProfileModalOpen(true);
  }

  async function handleSaveClientProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsProfileSaving(true);
    setProfileError(null);

    try {
      await dispatch(
        updateUserProfileThunk({
          ...clientProfile,
          avatarFile: clientProfile.avatarFile ?? undefined,
        }),
      ).unwrap();
      setIsClientProfileModalOpen(false);
    } catch (error) {
      setProfileError(typeof error === "string" ? error : "Не удалось сохранить профиль");
    } finally {
      setIsProfileSaving(false);
    }
  }

  async function handleCreateReview(booking: BookingType) {
    const draft = reviewDrafts[booking.id] ?? { rating: 5, text: "" };

    if (!draft.text.trim()) {
      setClientHistoryError("Напишите текст отзыва");
      return;
    }

    try {
      setReviewSavingId(booking.id);
      setClientHistoryError(null);

      const review = await createReview({
        masterId: booking.masterId,
        bookingId: booking.id,
        rating: draft.rating,
        text: draft.text.trim(),
      });

      setClientReviews((currentReviews) => [review, ...currentReviews]);
      setReviewDrafts((currentDrafts) => ({
        ...currentDrafts,
        [booking.id]: { rating: 5, text: "" },
      }));
    } catch (error) {
      setClientHistoryError(
        error instanceof Error ? error.message : "Не удалось сохранить отзыв",
      );
    } finally {
      setReviewSavingId(null);
    }
  }

  if (!user) return <div className="profile-page">Загрузка...</div>;
  if (isMaster && loading) return <div className="profile-page">Загрузка данных мастера...</div>;

  if (!isMaster) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-header">
            <div>
              <h1>Личный кабинет</h1>
              <p>{user.name}</p>
            </div>
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="profile-avatar" src={getMediaUrl(user.avatar)} alt="Фото профиля" />
            ) : null}
            <button type="button" onClick={handleOpenClientProfileModal}>
              Редактировать
            </button>
          </div>

          {profileError && <p className="profile-error">{profileError}</p>}

          <div className="client-profile-summary">
            <div>
              <span>Имя</span>
              <strong>{user.name || "Не указано"}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{user.email || "Не указан"}</strong>
            </div>
            <div>
              <span>Телефон</span>
              <strong>{user.phone || "Не указан"}</strong>
            </div>
          </div>

          <section className="profile-section">
            <h2>Ближайшие записи</h2>
            {upcomingBookings.length === 0 ? (
              <p>Вы еще не записаны</p>
            ) : (
              upcomingBookings.map((booking: Booking) => (
                <div key={booking.id} className="booking-card">
                  {formatDateTime(booking.startTime)}
                </div>
              ))
            )}
          </section>

          <section className="profile-section">
            <h2>Прошлые записи</h2>
            {clientHistoryError ? <p className="profile-error">{clientHistoryError}</p> : null}
            {clientPastBookings.length === 0 ? (
              <p>Прошлых записей пока нет</p>
            ) : (
              <div className="client-history-list">
                {clientPastBookings.map((booking) => {
                  const existingReview = clientReviews.find(
                    (review) => review.bookingId === booking.id,
                  );
                  const draft = reviewDrafts[booking.id] ?? { rating: 5, text: "" };

                  return (
                    <article className="client-history-card" key={booking.id}>
                      <div className="client-history-card__top">
                        <div>
                          <strong>Мастер #{booking.masterId}</strong>
                          <span>{formatDateTime(booking.startTime)}</span>
                        </div>
                        <span>Услуга #{booking.serviziId}</span>
                      </div>

                      {existingReview ? (
                        <div className="client-review-saved">
                          <strong>{"★".repeat(existingReview.rating)}</strong>
                          <p>{existingReview.text}</p>
                        </div>
                      ) : (
                        <div className="client-review-form">
                          <label>
                            <span>Оценка</span>
                            <select
                              value={draft.rating}
                              onChange={(event) =>
                                setReviewDrafts((currentDrafts) => ({
                                  ...currentDrafts,
                                  [booking.id]: {
                                    ...draft,
                                    rating: Number(event.target.value),
                                  },
                                }))
                              }
                            >
                              {[5, 4, 3, 2, 1].map((rating) => (
                                <option key={rating} value={rating}>
                                  {rating}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            <span>Отзыв</span>
                            <textarea
                              value={draft.text}
                              onChange={(event) =>
                                setReviewDrafts((currentDrafts) => ({
                                  ...currentDrafts,
                                  [booking.id]: {
                                    ...draft,
                                    text: event.target.value,
                                  },
                                }))
                              }
                              placeholder="Расскажите, как прошла запись"
                              rows={3}
                            />
                          </label>
                          <button
                            type="button"
                            disabled={reviewSavingId === booking.id}
                            onClick={() => void handleCreateReview(booking)}
                          >
                            {reviewSavingId === booking.id ? "Сохранение..." : "Оставить отзыв"}
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="profile-section">
            <h2>Акции для вас</h2>
            {salesForClient.length === 0 ? (
              <p>Нет активных акций</p>
            ) : (
              salesForClient.map((sale: Sale) => (
                <div key={sale.id} className="sale-card">
                  Скидка {sale.discount}% {sale.comment}
                </div>
              ))
            )}
          </section>

          <section className="profile-section">
            <h2>Рекомендованные мастера</h2>
            {recommendationsError ? <p className="profile-error">{recommendationsError}</p> : null}
            {recommendationsLoading ? (
              <p>Подбираем мастеров для вас...</p>
            ) : recommendedMasters.length === 0 ? (
              <p>Пока не удалось подобрать рекомендации</p>
            ) : (
              <div className="recommended-masters-list">
                {recommendedMasters.map((master) => (
                  <article className="recommended-master-card" key={master.id}>
                    <div className="recommended-master-card__head">
                      <div className="recommended-master-card__identity">
                        {master.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={getMediaUrl(master.avatar)}
                            alt={master.title || master.name}
                          />
                        ) : (
                          <div className="recommended-master-card__avatar-fallback">
                            {(master.title || master.name).slice(0, 1).toUpperCase()}
                          </div>
                        )}

                        <div>
                          <strong>{master.title || master.name}</strong>
                          <span>{master.city || "Город не указан"}</span>
                        </div>
                      </div>

                      <div className="recommended-master-card__rating">
                        <strong>{master.rating.toFixed(1)}</strong>
                        <span>{master.reviewCount} отзывов</span>
                      </div>
                    </div>

                    <p className="recommended-master-card__reason">{master.reason}</p>
                    <p className="recommended-master-card__description">
                      {master.description || "Мастер пока не добавил описание, но уже подходит вам по профилю услуг."}
                    </p>

                    {master.categoryTitles.length > 0 ? (
                      <div className="recommended-master-card__tags">
                        {master.categoryTitles.map((categoryTitle) => (
                          <span key={`${master.id}-${categoryTitle}`}>{categoryTitle}</span>
                        ))}
                      </div>
                    ) : null}

                    {master.services.length > 0 ? (
                      <div className="recommended-master-card__services">
                        {master.services.map((service) => (
                          <div key={service.id}>
                            <strong>{service.title}</strong>
                            <span>
                              {service.price.toLocaleString("ru-RU")} руб. • {service.duration} мин
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <Link className="profile-link-button" href={`/masters/${master.id}`}>
                      Открыть профиль мастера
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </section>

          {isClientProfileModalOpen && (
            <div className="profile-modal-backdrop" role="presentation">
              <form className="profile-modal" onSubmit={handleSaveClientProfile}>
                <div className="modal-header">
                  <h2>Профиль клиента</h2>
                  <button
                    type="button"
                    onClick={() => setIsClientProfileModalOpen(false)}
                    aria-label="Закрыть"
                  >
                    x
                  </button>
                </div>

                <label>
                  <span>Имя</span>
                  <input
                    value={clientProfile.name}
                    onChange={(event) =>
                      setClientProfile((profile) => ({ ...profile, name: event.target.value }))
                    }
                    placeholder="Ваше имя"
                  />
                </label>

                <label>
                  <span>Email</span>
                  <input
                    type="email"
                    value={clientProfile.email}
                    onChange={(event) =>
                      setClientProfile((profile) => ({ ...profile, email: event.target.value }))
                    }
                    placeholder="email@example.com"
                  />
                </label>

                <label>
                  <span>Телефон</span>
                  <input
                    value={clientProfile.phone}
                    onChange={(event) =>
                      setClientProfile((profile) => ({ ...profile, phone: event.target.value }))
                    }
                    placeholder="+7 999 000-00-00"
                  />
                </label>

                <label>
                  <span>Фото профиля</span>
                  <input
                    accept="image/*"
                    type="file"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];

                      if (!file) return;

                      const data = await readFileAsDataUrl(file);

                      setClientProfile((profile) => ({
                        ...profile,
                        avatarFile: {
                          name: file.name,
                          type: file.type,
                          data,
                        },
                      }));
                    }}
                  />
                  <p className="file-note">
                    {clientProfile.avatarFile?.name || "Выберите фото с компьютера"}
                  </p>
                </label>

                {clientProfile.avatar || clientProfile.avatarFile ? (
                  <div className="profile-avatar-preview">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={clientProfile.avatarFile?.data || getMediaUrl(clientProfile.avatar)}
                      alt="Предпросмотр фото профиля"
                    />
                  </div>
                ) : null}

                <div className="modal-actions">
                  <button type="submit" disabled={isProfileSaving}>
                    {isProfileSaving ? "Сохранение..." : "Сохранить"}
                  </button>
                  <button type="button" onClick={() => setIsClientProfileModalOpen(false)}>
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div>
            <h1>Личный кабинет мастера</h1>
            <p>{masterProfile.title || user.name}</p>
          </div>
          {user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="profile-avatar" src={getMediaUrl(user.avatar)} alt="Фото профиля" />
          ) : null}
          <Link className="profile-link-button" href="/calendarMaster">
            Посмотреть календарь
          </Link>
          <button type="button" onClick={handleOpenMasterProfileModal}>
            Редактировать
          </button>
        </div>

        {profileError && <p className="profile-error">{profileError}</p>}

        <div className="master-profile-summary">
          <div>
            <span>Город</span>
            <strong>{masterProfile.city || "Не указан"}</strong>
          </div>
          <div>
            <span>Адрес</span>
            <strong>{masterProfile.address || "Не указан"}</strong>
          </div>
          <div>
            <span>Категория</span>
            <strong>{masterProfile.category || "Не указана"}</strong>
          </div>
          <div>
            <span>Опыт</span>
            <strong>{masterProfile.experience || 0} лет</strong>
          </div>
        </div>

        <section className="profile-section">
          <h2>Социальные сети</h2>
          {masterSocials.length === 0 ? (
            <p>Социальные сети пока не указаны</p>
          ) : (
            <div className="master-social-list">
              {masterSocials.map((social) => (
                <a
                  className="master-social-link"
                  href={social.contact}
                  key={social.id}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span>{social.network}</span>
                  <strong>{social.contact}</strong>
                </a>
              ))}
            </div>
          )}
        </section>

        <div className="stats-grid">
          <div className="stat-card">{earnings?.total || 0} руб.</div>
          <div className="stat-card">{stats?.totalBookings || 0} записей</div>
          <div className="stat-card">{stats?.rating || 0} рейтинг</div>
          <div className="stat-card">{services.length} услуг</div>
          <div className="stat-card">{portfolio.length} фото</div>
        </div>

        <section className="profile-section">
          <h2>Ближайшие записи</h2>
          {masterBookings.length === 0 ? (
            <p>Пока нет записей</p>
          ) : (
            masterBookings.map((booking: BookingToMaster) => (
              <div key={booking.id} className="booking-card">
                {formatDateTime(booking.startTime)} - {booking.client.name} -{" "}
                {booking.service?.title ?? "Услуга"} ({booking.totalPrice} руб.)
              </div>
            ))
          )}
        </section>

        <section className="profile-section profile-section--services">
          <div className="section-header">
            <h2>Мои услуги</h2>
            <button type="button" onClick={() => setShowAddService(true)}>
              Добавить услугу
            </button>
          </div>

          {services.length === 0 ? (
            <p>У вас пока нет услуг</p>
          ) : (
            <div className="services-list">
              {services.map((service: Servizi) => (
                <div key={service.id} className="service-card">
                  <span>
                    {service.title} - {service.price} руб. ({service.duration} мин)
                  </span>
                  <button type="button" onClick={() => dispatch(deleteServiceThunk(service.id))}>
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="profile-section">
          <h2>Отзывы клиентов</h2>
          {masterReviewsError ? <p className="profile-error">{masterReviewsError}</p> : null}
          {masterReviews.length === 0 ? (
            <p>Отзывов пока нет</p>
          ) : (
            <div className="master-reviews-list">
              {masterReviews.map((review) => (
                <article className="master-review-card" key={review.id}>
                  <div className="master-review-card__head">
                    <strong>Клиент #{review.clientId}</strong>
                    <span>
                      {"★".repeat(review.rating)}
                      {"☆".repeat(Math.max(0, 5 - review.rating))}
                    </span>
                  </div>
                  <p>{review.text}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="profile-section">
          <div className="section-header">
            <h2>Портфолио</h2>
            <button type="button" onClick={() => setShowAddPhoto(true)}>
              Добавить фото
            </button>
          </div>

          <div className="portfolio-grid">
            {portfolio.length === 0 ? (
              <p>Портфолио пусто</p>
            ) : (
              portfolio.map((item: PortfolioItem) => (
                <div key={item.id} className="portfolio-item">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getMediaUrl(item.imageUrl)} alt={item.title || "Фото портфолио"} />
                  ) : (
                    <div className="portfolio-placeholder">Нет фото</div>
                  )}
                  <p>{item.title}</p>
                  <button type="button" onClick={() => dispatch(deletePortfolioItemThunk(item.id))}>
                    Удалить
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {isProfileModalOpen && (
          <div className="profile-modal-backdrop" role="presentation">
            <form className="profile-modal" onSubmit={handleSaveMasterProfile}>
              <div className="modal-header">
                <h2>Профиль мастера</h2>
                <button type="button" onClick={() => setIsProfileModalOpen(false)} aria-label="Закрыть">
                  x
                </button>
              </div>

              <label>
                <span>Имя и фамилия / название профиля</span>
                <input
                  value={masterProfile.title}
                  onChange={(event) =>
                    setMasterProfile((profile) => ({ ...profile, title: event.target.value }))
                  }
                  placeholder="Ваше имя"
                />
              </label>

              <label>
                <span>Описание</span>
                <textarea
                  value={masterProfile.description}
                  onChange={(event) =>
                    setMasterProfile((profile) => ({ ...profile, description: event.target.value }))
                  }
                  placeholder="Расскажите о себе, опыте и подходе к клиентам"
                  rows={4}
                />
              </label>

              <label>
                <span>Фото профиля</span>
                <input
                  accept="image/*"
                  type="file"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];

                    if (!file) return;

                    const data = await readFileAsDataUrl(file);

                    setClientProfile((profile) => ({
                      ...profile,
                      avatarFile: {
                        name: file.name,
                        type: file.type,
                        data,
                      },
                    }));
                  }}
                />
                <p className="file-note">
                  {clientProfile.avatarFile?.name || "Выберите фото с компьютера"}
                </p>
              </label>

              {clientProfile.avatar || clientProfile.avatarFile ? (
                <div className="profile-avatar-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={clientProfile.avatarFile?.data || getMediaUrl(clientProfile.avatar)}
                    alt="Предпросмотр фото профиля"
                  />
                </div>
              ) : null}

              <div className="profile-form-row">
                <label>
                  <span>Telegram</span>
                  <input
                    value={masterSocialForm.telegram}
                    onChange={(event) =>
                      setMasterSocialForm((socials) => ({
                        ...socials,
                        telegram: event.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  <span>VK</span>
                  <input
                    value={masterSocialForm.vk}
                    onChange={(event) =>
                      setMasterSocialForm((socials) => ({
                        ...socials,
                        vk: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <label>
                <span>Instagram</span>
                <input
                  value={masterSocialForm.instagram}
                  onChange={(event) =>
                    setMasterSocialForm((socials) => ({
                      ...socials,
                      instagram: event.target.value,
                    }))
                  }
                />
              </label>

              <div className="profile-form-row">
                <label>
                  <span>Город</span>
                  <input
                    value={masterProfile.city}
                    onChange={(event) =>
                      setMasterProfile((profile) => ({ ...profile, city: event.target.value }))
                    }
                    placeholder="Ваш город"
                  />
                </label>

                <label>
                  <span>Адрес</span>
                  <input
                    value={masterProfile.address}
                    onChange={(event) =>
                      setMasterProfile((profile) => ({ ...profile, address: event.target.value }))
                    }
                    placeholder="Ваш адрес"
                  />
                </label>
              </div>

              <div className="profile-form-row">
                <label>
                  <span>Опыт, лет</span>
                  <input
                    min={0}
                    step={0.5}
                    type="number"
                    value={masterProfile.experience || ""}
                    onChange={(event) =>
                      setMasterProfile((profile) => ({
                        ...profile,
                        experience: event.target.value === "" ? 0 : Number(event.target.value),
                      }))
                    }
                  />
                </label>

                <label>
                  <span>Категория</span>
                  <input
                    value={masterProfile.category}
                    onChange={(event) =>
                      setMasterProfile((profile) => ({ ...profile, category: event.target.value }))
                    }
                    placeholder="Ваши услуги"
                  />
                </label>
              </div>

              <label>
                <span>Рейтинг</span>
                <input
                  min={0}
                  max={5}
                  step={0.1}
                  type="number"
                  value={masterProfile.rating}
                  onChange={(event) =>
                    setMasterProfile((profile) => ({ ...profile, rating: Number(event.target.value) }))
                  }
                />
              </label>

              <div className="modal-actions">
                <button type="submit" disabled={isProfileSaving}>
                  {isProfileSaving ? "Сохранение..." : "Сохранить"}
                </button>
                <button type="button" onClick={() => setIsProfileModalOpen(false)}>
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        {showAddService && (
          <div className="profile-modal-backdrop" role="presentation">
            <div className="profile-modal">
              <h2>Добавить услугу</h2>
              <label>
                <span>Категория</span>
                <select
                  value={newService.categoryId}
                  disabled={categories.length === 0}
                  onChange={(event) =>
                    setNewService({
                      ...newService,
                      categoryId: Number(event.target.value),
                    })
                  }
                >
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.title}
                      </option>
                    ))
                  ) : (
                    <option value={newService.categoryId}>
                      {categoriesError ? "Категории не загрузились" : "Загрузка категорий..."}
                    </option>
                  )}
                </select>
                {categoriesError ? <p className="file-note">{categoriesError}</p> : null}
              </label>
              <label>
                <span>Название услуги</span>
                <input
                  placeholder="Маникюр с покрытием"
                  value={newService.title}
                  onChange={(event) => setNewService({ ...newService, title: event.target.value })}
                />
              </label>
              <label>
                <span>Описание услуги</span>
                <textarea
                  placeholder="Что входит в процедуру"
                  value={newService.description}
                  onChange={(event) => setNewService({ ...newService, description: event.target.value })}
                />
              </label>
              <div className="profile-form-row">
                <label>
                  <span>Сумма, руб.</span>
                  <input
                    placeholder="Например, 2500"
                    type="number"
                    value={newService.price || ""}
                    onChange={(event) =>
                      setNewService({
                        ...newService,
                        price: event.target.value === "" ? 0 : Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label>
                  <span>Длительность процедуры, мин.</span>
                  <input
                    placeholder="Например, 90"
                    type="number"
                    value={newService.duration || ""}
                    onChange={(event) =>
                      setNewService({
                        ...newService,
                        duration: event.target.value === "" ? 0 : Number(event.target.value),
                      })
                    }
                  />
                </label>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  disabled={categories.length === 0}
                  onClick={async () => {
                    await dispatch(addServiceThunk(newService));
                    dispatch(fetchMasterServicesThunk());
                    setShowAddService(false);
                    setNewService({
                      title: "",
                      description: "",
                      price: 0,
                      duration: 60,
                      categoryId: categories[0]?.id || 1,
                    });
                  }}
                >
                  Сохранить
                </button>
                <button type="button" onClick={() => setShowAddService(false)}>
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {showAddPhoto && (
          <div className="profile-modal-backdrop" role="presentation">
            <div className="profile-modal">
              <h2>Добавить фото</h2>
              <label>
                <span>Фото с компьютера</span>
                <input
                  accept="image/*"
                  type="file"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];

                    if (!file) {
                      setNewPhoto((photo) => ({ ...photo, imageFile: null }));
                      return;
                    }

                    const data = await readFileAsDataUrl(file);
                    setNewPhoto((photo) => ({
                      ...photo,
                      imageFile: {
                        name: file.name,
                        type: file.type,
                        data,
                      },
                    }));
                  }}
                />
              </label>
              {newPhoto.imageFile ? (
                <p className="file-note">Выбрано: {newPhoto.imageFile.name}</p>
              ) : null}
              <label>
                <span>Название фото</span>
                <input
                  placeholder="Работа после процедуры"
                  value={newPhoto.title}
                  onChange={(event) => setNewPhoto({ ...newPhoto, title: event.target.value })}
                />
              </label>
              <label>
                <span>Описание фото</span>
                <textarea
                  placeholder="Короткое описание результата"
                  value={newPhoto.description}
                  onChange={(event) => setNewPhoto({ ...newPhoto, description: event.target.value })}
                />
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  disabled={!newPhoto.imageFile}
                  onClick={async () => {
                    await dispatch(addPortfolioItemThunk({
                      imageFile: newPhoto.imageFile ?? undefined,
                      title: newPhoto.title.trim(),
                    }));
                    dispatch(fetchMasterPortfolioThunk());
                    setShowAddPhoto(false);
                    setNewPhoto({ imageFile: null, title: "", description: "" });
                  }}
                >
                  Сохранить
                </button>
                <button type="button" onClick={() => setShowAddPhoto(false)}>
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
