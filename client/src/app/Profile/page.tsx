"use client";

import "./page.css";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { type FormEvent, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/store/store";
import { fetchUpcomingBookingsThunk } from "@/entities/booking/api/BookingApiThunk";
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
import type { BookingToMaster } from "@/entities/master/model/index";
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
import { expandPortfolioItems, getMediaUrl } from "@/shared/lib/media";
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
  const t = useTranslations("profile");
  const commonT = useTranslations("common");
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.user);
  const { upcomingBookings } = useSelector((state: RootState) => state.booking);
  const { stats, earnings, services, portfolio, upcomingBookings: masterBookings, loading } =
    useSelector((state: RootState) => state.master);
  const expandedPortfolio = expandPortfolioItems(portfolio);

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
          error instanceof Error ? error.message : t("errorPastBookings"),
        );
      }
    };

    void loadClientHistory();
  }, [isMaster, t, user]);

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
          error instanceof Error ? error.message : t("errorRecommendations"),
        );
      } finally {
        setRecommendationsLoading(false);
      }
    };

    void loadRecommendations();
  }, [isMaster, t, user]);

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
        setProfileError(t("errorMasterProfile"));
      }
    };

    void loadMasterProfile();
  }, [isMaster, t]);

  useEffect(() => {
    if (!user || !isMaster) return;

    const loadMasterReviews = async () => {
      try {
        setMasterReviewsError(null);
        const reviewsData = await getReviewsByMaster(user.id);

        setMasterReviews(reviewsData);
      } catch (error) {
        setMasterReviewsError(
          error instanceof Error ? error.message : t("errorReviews"),
        );
      }
    };

    void loadMasterReviews();
  }, [isMaster, t, user]);

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
          error instanceof Error ? error.message : t("errorCategories"),
        );
      }
    };

    void loadCategories();
  }, [isMaster, t, user]);

  async function handleSaveMasterProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setProfileError(t("errorUser"));
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
      setProfileError(t("errorSaveMasterProfile"));
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
      setProfileError(typeof error === "string" ? error : t("errorSaveProfile"));
    } finally {
      setIsProfileSaving(false);
    }
  }

  async function handleCreateReview(booking: BookingType) {
    const draft = reviewDrafts[booking.id] ?? { rating: 5, text: "" };

    if (!draft.text.trim()) {
      setClientHistoryError(t("errorReviewText"));
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
        error instanceof Error ? error.message : t("errorSaveReview"),
      );
    } finally {
      setReviewSavingId(null);
    }
  }

  if (!user) return <div className="profile-page">{commonT("loading")}</div>;
  if (isMaster && loading) return <div className="profile-page">{t("loadingMasterData")}</div>;

  if (!isMaster) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-header">
            <div>
              <h1>{t("clientTitle")}</h1>
              <p>{user.name}</p>
            </div>
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="profile-avatar" src={getMediaUrl(user.avatar)} alt={t("profilePhoto")} />
            ) : null}
            <Link className="profile-link-button" href="/messages">
              {commonT("chat")}
            </Link>
            <button type="button" onClick={handleOpenClientProfileModal}>
              {commonT("edit")}
            </button>
          </div>

          {profileError && <p className="profile-error">{profileError}</p>}

          <div className="client-profile-summary">
            <div>
              <span>{t("name")}</span>
              <strong>{user.name || commonT("notSpecified")}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{user.email || commonT("notSpecifiedMale")}</strong>
            </div>
            <div>
              <span>{t("phone")}</span>
              <strong>{user.phone || commonT("notSpecifiedMale")}</strong>
            </div>
          </div>

          <section className="profile-section">
            <h2>{t("upcomingBookings")}</h2>
            {upcomingBookings.length === 0 ? (
              <p>{t("noUpcomingBookings")}</p>
            ) : (
              upcomingBookings.map((booking: Booking) => (
                <div key={booking.id} className="booking-card">
                  {formatDateTime(booking.startTime)}
                </div>
              ))
            )}
          </section>

          <section className="profile-section">
            <h2>{t("pastBookings")}</h2>
            {clientHistoryError ? <p className="profile-error">{clientHistoryError}</p> : null}
            {clientPastBookings.length === 0 ? (
              <p>{t("noPastBookings")}</p>
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
                          <strong>{t("masterNumber", { id: booking.masterId })}</strong>
                          <span>{formatDateTime(booking.startTime)}</span>
                        </div>
                        <span>{t("serviceNumber", { id: booking.serviziId })}</span>
                      </div>

                      {existingReview ? (
                        <div className="client-review-saved">
                          <strong>{"★".repeat(existingReview.rating)}</strong>
                          <p>{existingReview.text}</p>
                        </div>
                      ) : (
                        <div className="client-review-form">
                          <label>
                            <span>{t("reviewRating")}</span>
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
                            <span>{t("review")}</span>
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
                              placeholder={t("reviewPlaceholder")}
                              rows={3}
                            />
                          </label>
                          <button
                            type="button"
                            disabled={reviewSavingId === booking.id}
                            onClick={() => void handleCreateReview(booking)}
                          >
                            {reviewSavingId === booking.id ? commonT("saving") : t("leaveReview")}
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
            <h2>{t("recommendedMasters")}</h2>
            {recommendationsError ? <p className="profile-error">{recommendationsError}</p> : null}
            {recommendationsLoading ? (
              <p>{t("recommendationsLoading")}</p>
            ) : recommendedMasters.length === 0 ? (
              <p>{t("recommendationsEmpty")}</p>
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
                          <span>{master.city || t("cityMissing")}</span>
                        </div>
                      </div>

                      <div className="recommended-master-card__rating">
                        <strong>{master.rating.toFixed(1)}</strong>
                        <span>{t("reviewsCount", { count: master.reviewCount })}</span>
                      </div>
                    </div>

                    <p className="recommended-master-card__reason">{master.reason}</p>
                    <p className="recommended-master-card__description">
                      {master.description || t("recommendedDescription")}
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
                              {service.price.toLocaleString("ru-RU")} {commonT("currencyRub")} • {service.duration} {commonT("minutes")}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <Link className="profile-link-button" href={`/masters/${master.id}`}>
                      {t("openMasterProfile")}
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
                  <h2>{t("clientProfile")}</h2>
                  <button
                    type="button"
                    onClick={() => setIsClientProfileModalOpen(false)}
                    aria-label={commonT("close")}
                  >
                    x
                  </button>
                </div>

                <label>
                  <span>{t("name")}</span>
                  <input
                    value={clientProfile.name}
                    onChange={(event) =>
                      setClientProfile((profile) => ({ ...profile, name: event.target.value }))
                    }
                    placeholder={t("yourName")}
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
                  <span>{t("phone")}</span>
                  <input
                    value={clientProfile.phone}
                    onChange={(event) =>
                      setClientProfile((profile) => ({ ...profile, phone: event.target.value }))
                    }
                    placeholder="+7 999 000-00-00"
                  />
                </label>

                <label>
                  <span>{t("profilePhotoInput")}</span>
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
                    {clientProfile.avatarFile?.name || t("choosePhoto")}
                  </p>
                </label>

                {clientProfile.avatar || clientProfile.avatarFile ? (
                  <div className="profile-avatar-preview">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={clientProfile.avatarFile?.data || getMediaUrl(clientProfile.avatar)}
                      alt={t("previewProfilePhoto")}
                    />
                  </div>
                ) : null}

                <div className="modal-actions">
                  <button type="submit" disabled={isProfileSaving}>
                    {isProfileSaving ? commonT("saving") : commonT("save")}
                  </button>
                  <button type="button" onClick={() => setIsClientProfileModalOpen(false)}>
                    {commonT("cancel")}
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
            <h1>{t("masterTitle")}</h1>
            <p>{masterProfile.title || user.name}</p>
          </div>
          {user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="profile-avatar" src={getMediaUrl(user.avatar)} alt={t("profilePhoto")} />
          ) : null}
          <Link className="profile-link-button" href="/calendarMaster">
            {t("viewCalendar")}
          </Link>
          <Link className="profile-link-button" href="/messages">
            {commonT("chat")}
          </Link>
          <button type="button" onClick={handleOpenMasterProfileModal}>
            {commonT("edit")}
          </button>
        </div>

        {profileError && <p className="profile-error">{profileError}</p>}

        <div className="master-profile-summary">
          <div>
            <span>{t("city")}</span>
            <strong>{masterProfile.city || commonT("notSpecifiedMale")}</strong>
          </div>
          <div>
            <span>{t("address")}</span>
            <strong>{masterProfile.address || commonT("notSpecifiedMale")}</strong>
          </div>
          <div>
            <span>{t("category")}</span>
            <strong>{masterProfile.category || commonT("notSpecifiedFemale")}</strong>
          </div>
          <div>
            <span>{t("experience")}</span>
            <strong>{masterProfile.experience || 0} {commonT("years")}</strong>
          </div>
        </div>

        <section className="profile-section">
          <h2>{t("socials")}</h2>
          {masterSocials.length === 0 ? (
            <p>{t("socialsEmpty")}</p>
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
          <div className="stat-card">{earnings?.total || 0} {commonT("currencyRub")}</div>
          <div className="stat-card">{t("totalBookings", { count: stats?.totalBookings || 0 })}</div>
          <div className="stat-card">{t("ratingStat", { value: stats?.rating || 0 })}</div>
          <div className="stat-card">{t("servicesStat", { count: services.length })}</div>
          <div className="stat-card">{t("photosStat", { count: expandedPortfolio.length })}</div>
        </div>

        <section className="profile-section">
          <h2>{t("upcomingBookings")}</h2>
          {masterBookings.length === 0 ? (
            <p>{t("noMasterBookings")}</p>
          ) : (
            masterBookings.map((booking: BookingToMaster) => (
              <div key={booking.id} className="booking-card">
                {formatDateTime(booking.startTime)} - {booking.client.name} -{" "}
                {booking.service?.title ?? t("serviceFallback")} ({booking.totalPrice} {commonT("currencyRub")})
              </div>
            ))
          )}
        </section>

        <section className="profile-section profile-section--services">
          <div className="section-header">
            <h2>{t("myServices")}</h2>
            <button type="button" onClick={() => setShowAddService(true)}>
              {t("addService")}
            </button>
          </div>

          {services.length === 0 ? (
            <p>{t("noServices")}</p>
          ) : (
            <div className="services-list">
              {services.map((service: Servizi) => (
                <div key={service.id} className="service-card">
                  <span>
                    {service.title} - {service.price} {commonT("currencyRub")} ({service.duration} {commonT("minutes")})
                  </span>
                  <button type="button" onClick={() => dispatch(deleteServiceThunk(service.id))}>
                    {commonT("delete")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="profile-section">
          <h2>{t("clientReviews")}</h2>
          {masterReviewsError ? <p className="profile-error">{masterReviewsError}</p> : null}
          {masterReviews.length === 0 ? (
            <p>{t("noReviews")}</p>
          ) : (
            <div className="master-reviews-list">
              {masterReviews.map((review) => (
                <article className="master-review-card" key={review.id}>
                  <div className="master-review-card__head">
                    <strong>{t("clientNumber", { id: review.clientId })}</strong>
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
            <h2>{t("portfolio")}</h2>
            <button type="button" onClick={() => setShowAddPhoto(true)}>
              {t("addPhoto")}
            </button>
          </div>

          <div className="portfolio-grid">
            {expandedPortfolio.length === 0 ? (
              <p>{t("portfolioEmpty")}</p>
            ) : (
              expandedPortfolio.map((item) => (
                <div key={item.id} className="portfolio-item">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getMediaUrl(item.imageUrl)} alt={item.title || t("portfolioPhoto")} />
                  ) : (
                    <div className="portfolio-placeholder">{t("noPhoto")}</div>
                  )}
                  <p>{item.title}</p>
                  <button type="button" onClick={() => dispatch(deletePortfolioItemThunk(item.sourceId))}>
                    {commonT("delete")}
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
                <h2>{t("masterProfile")}</h2>
                <button type="button" onClick={() => setIsProfileModalOpen(false)} aria-label={commonT("close")}>
                  x
                </button>
              </div>

              <label>
                <span>{t("masterNameLabel")}</span>
                <input
                  value={masterProfile.title}
                  onChange={(event) =>
                    setMasterProfile((profile) => ({ ...profile, title: event.target.value }))
                  }
                  placeholder={t("yourName")}
                />
              </label>

              <label>
                <span>{t("description")}</span>
                <textarea
                  value={masterProfile.description}
                  onChange={(event) =>
                    setMasterProfile((profile) => ({ ...profile, description: event.target.value }))
                  }
                  placeholder={t("masterDescriptionPlaceholder")}
                  rows={4}
                />
              </label>

              <label>
                <span>{t("profilePhotoInput")}</span>
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
                  {clientProfile.avatarFile?.name || t("choosePhoto")}
                </p>
              </label>

              {clientProfile.avatar || clientProfile.avatarFile ? (
                <div className="profile-avatar-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={clientProfile.avatarFile?.data || getMediaUrl(clientProfile.avatar)}
                    alt={t("previewProfilePhoto")}
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
                  <span>{t("city")}</span>
                  <input
                    value={masterProfile.city}
                    onChange={(event) =>
                      setMasterProfile((profile) => ({ ...profile, city: event.target.value }))
                    }
                    placeholder={t("yourCity")}
                  />
                </label>

                <label>
                  <span>{t("address")}</span>
                  <input
                    value={masterProfile.address}
                    onChange={(event) =>
                      setMasterProfile((profile) => ({ ...profile, address: event.target.value }))
                    }
                    placeholder={t("yourAddress")}
                  />
                </label>
              </div>

              <div className="profile-form-row">
                <label>
                  <span>{t("experienceYears")}</span>
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
                  <span>{t("category")}</span>
                  <input
                    value={masterProfile.category}
                    onChange={(event) =>
                      setMasterProfile((profile) => ({ ...profile, category: event.target.value }))
                    }
                    placeholder={t("yourServices")}
                  />
                </label>
              </div>

              <label>
                <span>{t("rating")}</span>
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
                  {isProfileSaving ? commonT("saving") : commonT("save")}
                </button>
                <button type="button" onClick={() => setIsProfileModalOpen(false)}>
                  {commonT("cancel")}
                </button>
              </div>
            </form>
          </div>
        )}

        {showAddService && (
          <div className="profile-modal-backdrop" role="presentation">
            <div className="profile-modal">
              <h2>{t("addService")}</h2>
              <label>
                <span>{t("category")}</span>
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
                      {categoriesError ? t("categoriesNotLoaded") : t("categoriesLoading")}
                    </option>
                  )}
                </select>
                {categoriesError ? <p className="file-note">{categoriesError}</p> : null}
              </label>
              <label>
                <span>{t("serviceTitle")}</span>
                <input
                  placeholder={t("serviceTitlePlaceholder")}
                  value={newService.title}
                  onChange={(event) => setNewService({ ...newService, title: event.target.value })}
                />
              </label>
              <label>
                <span>{t("serviceDescription")}</span>
                <textarea
                  placeholder={t("serviceDescriptionPlaceholder")}
                  value={newService.description}
                  onChange={(event) => setNewService({ ...newService, description: event.target.value })}
                />
              </label>
              <div className="profile-form-row">
                <label>
                  <span>{t("priceRub")}</span>
                  <input
                    placeholder={t("pricePlaceholder")}
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
                  <span>{t("durationMinutes")}</span>
                  <input
                    placeholder={t("durationPlaceholder")}
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
                  {commonT("save")}
                </button>
                <button type="button" onClick={() => setShowAddService(false)}>
                  {commonT("cancel")}
                </button>
              </div>
            </div>
          </div>
        )}

        {showAddPhoto && (
          <div className="profile-modal-backdrop" role="presentation">
            <div className="profile-modal">
              <h2>{t("addPhotoTitle")}</h2>
              <label>
                <span>{t("photoFromComputer")}</span>
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
                <p className="file-note">{t("selectedFile")} {newPhoto.imageFile.name}</p>
              ) : null}
              <label>
                <span>{t("photoTitle")}</span>
                <input
                  placeholder={t("photoTitlePlaceholder")}
                  value={newPhoto.title}
                  onChange={(event) => setNewPhoto({ ...newPhoto, title: event.target.value })}
                />
              </label>
              <label>
                <span>{t("photoDescription")}</span>
                <textarea
                  placeholder={t("photoDescriptionPlaceholder")}
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
                  {commonT("save")}
                </button>
                <button type="button" onClick={() => setShowAddPhoto(false)}>
                  {commonT("cancel")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
