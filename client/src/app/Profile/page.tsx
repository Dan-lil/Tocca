"use client";

import "./page.css";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";
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
  updateServiceThunk,
} from "@/entities/master/api/masterThunk";
import { deleteAccountThunk, updateUserProfileThunk } from "@/entities/user/api/UserApiThunk";
import { Servizi } from "@/entities/servizi/model/index";
import type { BookingToMaster } from "@/entities/master/model/index";
import { getBookingsByClient, updateBooking } from "@/shared/api/bookingApi";
import { getCategories } from "@/shared/api/categoryApi";
import { getMyMasterRecommendations } from "@/shared/api/aiApi";
import { createReview, getReviewsByClient, getReviewsByMaster } from "@/shared/api/ecoApi";
import {
  createMasterSocial,
  deleteMasterSocial,
  getMyMasterSocials,
} from "@/shared/api/masterSocialApi";
import { getPublicMasterProfile, updateMasterLocation } from "@/shared/api/profileMasterApi";
import { getServices } from "@/shared/api/serviziApi";
import { axiosInstance, getAccessToken } from "@/shared/lib/axiosInstance";
import {
  getLocalizedCategory,
  getLocalizedDescription,
  getLocalizedTitle,
} from "@/shared/lib/localized";
import { openBookingChat } from "@/shared/lib/openBookingChat";
import { expandPortfolioItems, getMediaUrl } from "@/shared/lib/media";
import type {
  BookingType,
  CategoryType,
  EcoReviewType,
  MasterSocialType,
  PublicMasterProfileType,
  RecommendedMasterType,
  ServerResponseType,
  ServiziType,
} from "@/shared/types";

const MasterGeoPicker = dynamic(
  () => import("@/features/master/ui/MasterGeoPicker/MasterGeoPicker"),
  {
    ssr: false,
    loading: () => <div className="profile-location-map-state">Карта загружается...</div>,
  },
);

type ProfileMaster = {
  id?: number;
  userId?: number;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  city: string;
  address: string;
  experience: number;
  category: string;
  categoryEn: string;
  rating: number;
  latitude?: number | null;
  longitude?: number | null;
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
  titleEn: "",
  description: "",
  descriptionEn: "",
  city: "",
  address: "",
  experience: 0,
  category: "",
  categoryEn: "",
  rating: 0,
  latitude: null,
  longitude: null,
};
const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

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

function isClientBookingCanceled(booking: BookingType) {
  const status = booking.status.toLowerCase();

  return status.includes("отмен") || status.includes("cancel");
}

function isClientBookingDone(booking: BookingType) {
  const status = booking.status.toLowerCase();

  return (
    status.includes("заверш") ||
    status.includes("done") ||
    status.includes("completed")
  );
}

function isClientBookingPast(booking: BookingType, now: number) {
  return (
    new Date(booking.endTime).getTime() < now ||
    isClientBookingCanceled(booking) ||
    isClientBookingDone(booking)
  );
}

function sortBookingsDesc(bookings: BookingType[]) {
  return [...bookings].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
  );
}

function getRecommendedMasterReason(master: RecommendedMasterType, locale: string) {
  if (locale !== "en") return master.reason;
  if (master.reasonEn?.trim()) return master.reasonEn;

  if (master.categoryTitlesEn?.length) {
    return `Matches your favorite categories: ${master.categoryTitlesEn.join(", ")}`;
  }

  return "Recommended by rating and popularity";
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function getDistinctServiceField(value: string | null | undefined, title: string | null | undefined) {
  const fieldValue = value?.trim() ?? "";
  const titleValue = title?.trim() ?? "";
  const normalize = (text: string) =>
    text
      .normalize("NFKC")
      .replace(/\s+/g, "")
      .toLowerCase();

  if (!fieldValue) return "";

  return titleValue && normalize(fieldValue) === normalize(titleValue) ? "" : fieldValue;
}

function sanitizeServiceDraft<T extends {
  title: string;
  titleEn?: string | null;
  description: string;
  descriptionEn?: string | null;
}>(service: T) {
  return {
    ...service,
    titleEn: getDistinctServiceField(service.titleEn, service.title),
    description: getDistinctServiceField(service.description, service.title),
    descriptionEn: getDistinctServiceField(service.descriptionEn, service.title),
  };
}

export default function ProfilePage() {
  const t = useTranslations("profile");
  const commonT = useTranslations("common");
  const locale = useLocale();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.user);
  const { stats, earnings, services, portfolio, upcomingBookings: masterBookings, loading } =
    useSelector((state: RootState) => state.master);
  const expandedPortfolio = expandPortfolioItems(portfolio);

  const [showAddService, setShowAddService] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isClientProfileModalOpen, setIsClientProfileModalOpen] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isAccountDeleting, setIsAccountDeleting] = useState(false);
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
  const [clientBookings, setClientBookings] = useState<BookingType[]>([]);
  const [clientNowTimestamp, setClientNowTimestamp] = useState(0);
  const [clientServices, setClientServices] = useState<ServiziType[]>([]);
  const [clientMasterProfiles, setClientMasterProfiles] = useState<
    Record<number, PublicMasterProfileType>
  >({});
  const [clientReviews, setClientReviews] = useState<EcoReviewType[]>([]);
  const [recommendedMasters, setRecommendedMasters] = useState<RecommendedMasterType[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);
  const [reviewDrafts, setReviewDrafts] = useState<Record<number, ReviewDraft>>({});
  const [reviewSavingId, setReviewSavingId] = useState<number | null>(null);
  const [openingChatBookingId, setOpeningChatBookingId] = useState<number | string | null>(null);
  const [cancelingBookingId, setCancelingBookingId] = useState<number | null>(null);
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
    titleEn: "",
    description: "",
    descriptionEn: "",
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

  function getEmptyServiceDraft() {
    return {
      title: "",
      titleEn: "",
      description: "",
      descriptionEn: "",
      price: 0,
      duration: 60,
      categoryId: categories[0]?.id || 1,
    };
  }

  function handleOpenAddServiceModal() {
    setEditingServiceId(null);
    setNewService(getEmptyServiceDraft());
    setShowAddService(true);
  }

  function handleOpenEditServiceModal(service: Servizi) {
    setEditingServiceId(service.id);
    setNewService(sanitizeServiceDraft({
      title: service.title ?? "",
      titleEn: service.titleEn ?? "",
      description: service.description ?? "",
      descriptionEn: service.descriptionEn ?? "",
      price: Number(service.price) || 0,
      duration: Number(service.duration) || 60,
      categoryId: service.categoryId || categories[0]?.id || 1,
    }));
    setShowAddService(true);
  }

  function handleCloseServiceModal() {
    setShowAddService(false);
    setEditingServiceId(null);
    setNewService(getEmptyServiceDraft());
  }

  const clientUpcomingBookings = useMemo(() => {
    return clientBookings
      .filter(
        (booking) =>
          new Date(booking.endTime).getTime() >= clientNowTimestamp &&
          !isClientBookingCanceled(booking) &&
          !isClientBookingDone(booking),
      )
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [clientBookings, clientNowTimestamp]);

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

    const loadClientBookings = async () => {
      try {
        setClientHistoryError(null);

        const [bookingsData, reviewsData, servicesData] = await Promise.all([
          getBookingsByClient(user.id),
          getReviewsByClient(user.id),
          getServices(),
        ]);
        const now = Date.now();
        const uniqueMasterIds = Array.from(
          new Set(bookingsData.map((booking) => booking.masterId)),
        );
        const masterProfilesEntries = await Promise.all(
          uniqueMasterIds.map(async (masterId) => {
            try {
              const profile = await getPublicMasterProfile(masterId);

              return [masterId, profile] as const;
            } catch {
              return null;
            }
          }),
        );

        setClientBookings(bookingsData);
        setClientNowTimestamp(now);
        setClientServices(servicesData);
        setClientMasterProfiles(
          Object.fromEntries(
            masterProfilesEntries.filter(
              (entry): entry is readonly [number, PublicMasterProfileType] => entry !== null,
            ),
          ),
        );
        setClientPastBookings(
          bookingsData
            .filter(
              (booking) => isClientBookingPast(booking, now),
            )
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

    void loadClientBookings();
  }, [isMaster, t, user]);

  useEffect(() => {
    if (!user) return;

    const socket = io(API_ORIGIN, {
      auth: { token: getAccessToken() },
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("booking:updated", (updatedBooking: BookingType) => {
      if (isMaster) {
        void dispatch(fetchUpcomingBookingsForMasterThunk());
        return;
      }

      setClientBookings((currentBookings) =>
        currentBookings.map((booking) =>
          booking.id === updatedBooking.id ? updatedBooking : booking,
        ),
      );
      setClientPastBookings((currentBookings) => {
        const nextBookings = currentBookings.filter(
          (booking) => booking.id !== updatedBooking.id,
        );
        const isPastOrCanceled = isClientBookingPast(updatedBooking, clientNowTimestamp);

        return isPastOrCanceled ? sortBookingsDesc([updatedBooking, ...nextBookings]) : nextBookings;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [clientNowTimestamp, dispatch, isMaster, user]);

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
        {
          ...masterProfile,
          rating: undefined,
        },
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

  async function handleMasterLocationChange(lat: number, lon: number) {
    try {
      setProfileError(null);
      const location = await updateMasterLocation({
        lat,
        lon,
        address: masterProfile.address,
      });

      setMasterProfile((profile) => ({
        ...profile,
        latitude: location.lat,
        longitude: location.lon,
      }));
    } catch (error) {
      setProfileError(
        error instanceof Error ? error.message : "Не удалось сохранить локацию мастера",
      );
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

  async function handleDeleteAccount() {
    const confirmed = window.confirm(t("deleteAccountConfirm"));

    if (!confirmed) return;

    try {
      setIsAccountDeleting(true);
      setProfileError(null);
      await dispatch(deleteAccountThunk()).unwrap();
      router.push("/auth");
    } catch (error) {
      setProfileError(typeof error === "string" ? error : t("deleteAccountError"));
    } finally {
      setIsAccountDeleting(false);
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

  function getBookingService(booking: BookingType) {
    return clientServices.find((service) => service.id === booking.serviziId) ?? null;
  }

  function getBookingMasterName(booking: BookingType) {
    const profile = clientMasterProfiles[booking.masterId];
    const service = getBookingService(booking);

    return (
      getLocalizedTitle(profile?.profile ?? {}, locale)?.trim() ||
      profile?.user.name ||
      service?.masterName?.trim() ||
      t("masterNumber", { id: booking.masterId })
    );
  }

  async function handleOpenBookingChat(booking: BookingType) {
    try {
      setOpeningChatBookingId(booking.id);
      setClientHistoryError(null);
      await openBookingChat(router, booking);
    } catch (error) {
      setClientHistoryError(error instanceof Error ? error.message : t("chatError"));
    } finally {
      setOpeningChatBookingId(null);
    }
  }

  async function handleOpenMasterBookingChat(booking: BookingToMaster) {
    try {
      setOpeningChatBookingId(booking.id);
      setProfileError(null);
      await openBookingChat(router, {
        id: booking.id,
        clientId: booking.clientId,
        masterId: booking.masterId,
        serviziId: booking.serviziId,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        clientComment: booking.clientComment,
      });
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : t("chatError"));
    } finally {
      setOpeningChatBookingId(null);
    }
  }

  async function handleCancelClientBooking(booking: BookingType) {
    const shouldCancel = window.confirm(t("cancelBookingConfirm"));

    if (!shouldCancel) return;

    try {
      setCancelingBookingId(booking.id);
      setClientHistoryError(null);

      const updatedBooking = await updateBooking(booking.id, {
        status: "Отменена клиентом",
        cancelReason: "Отменено клиентом",
      });

      setClientBookings((currentBookings) =>
        currentBookings.map((currentBooking) =>
          currentBooking.id === updatedBooking.id ? updatedBooking : currentBooking,
        ),
      );
      setClientPastBookings((currentBookings) => {
        const nextBookings = currentBookings.filter(
          (currentBooking) => currentBooking.id !== updatedBooking.id,
        );

        return [updatedBooking, ...nextBookings].sort(
          (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
        );
      });
    } catch (error) {
      setClientHistoryError(error instanceof Error ? error.message : t("cancelBookingError"));
    } finally {
      setCancelingBookingId(null);
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
            <button
              className="profile-danger-button"
              type="button"
              disabled={isAccountDeleting}
              onClick={() => void handleDeleteAccount()}
            >
              {isAccountDeleting ? t("deletingAccount") : t("deleteAccount")}
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
            {clientHistoryError ? <p className="profile-error">{clientHistoryError}</p> : null}
            {clientUpcomingBookings.length === 0 ? (
              <p>{t("noUpcomingBookings")}</p>
            ) : (
              <div className="client-history-list">
                {clientUpcomingBookings.map((booking) => {
                  const service = getBookingService(booking);
                  const masterName = getBookingMasterName(booking);

                  return (
                    <article key={booking.id} className="booking-card booking-card--detailed">
                      <div className="booking-card__info">
                        <strong>{getLocalizedTitle(service ?? {}, locale) ?? t("serviceNumber", { id: booking.serviziId })}</strong>
                        <span>{masterName}</span>
                        <time>{formatDateTime(booking.startTime)}</time>
                        <small>{booking.status}</small>
                      </div>
                      <div className="booking-card__actions">
                        <button
                          type="button"
                          disabled={openingChatBookingId === booking.id}
                          onClick={() => void handleOpenBookingChat(booking)}
                        >
                          {openingChatBookingId === booking.id ? commonT("opening") : commonT("chat")}
                        </button>
                        <button
                          type="button"
                          disabled={cancelingBookingId === booking.id}
                          onClick={() => void handleCancelClientBooking(booking)}
                        >
                          {cancelingBookingId === booking.id ? commonT("saving") : commonT("cancel")}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
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
                          <strong>
                            {getLocalizedTitle(getBookingService(booking) ?? {}, locale) ??
                              t("serviceNumber", { id: booking.serviziId })}
                          </strong>
                          <span>{getBookingMasterName(booking)}</span>
                          <span>{formatDateTime(booking.startTime)}</span>
                        </div>
                        <span>{booking.status}</span>
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
                            alt={getLocalizedTitle(master, locale) || master.name}
                          />
                        ) : (
                          <div className="recommended-master-card__avatar-fallback">
                            {(getLocalizedTitle(master, locale) || master.name).slice(0, 1).toUpperCase()}
                          </div>
                        )}

                        <div>
                          <strong>{getLocalizedTitle(master, locale) || master.name}</strong>
                          <span>{master.city || t("cityMissing")}</span>
                        </div>
                      </div>

                      <div className="recommended-master-card__rating">
                        <strong>{master.rating.toFixed(1)}</strong>
                        <span>{t("reviewsCount", { count: master.reviewCount })}</span>
                      </div>
                    </div>

                    <p className="recommended-master-card__reason">
                      {getRecommendedMasterReason(master, locale)}
                    </p>
                    <p className="recommended-master-card__description">
                      {getLocalizedDescription(master, locale) || t("recommendedDescription")}
                    </p>

                    {(locale === "en" && master.categoryTitlesEn?.length
                      ? master.categoryTitlesEn
                      : master.categoryTitles
                    ).length > 0 ? (
                      <div className="recommended-master-card__tags">
                        {(locale === "en" && master.categoryTitlesEn?.length
                          ? master.categoryTitlesEn
                          : master.categoryTitles
                        ).map((categoryTitle) => (
                          <span key={`${master.id}-${categoryTitle}`}>{categoryTitle}</span>
                        ))}
                      </div>
                    ) : null}

                    {master.services.length > 0 ? (
                      <div className="recommended-master-card__services">
                        {master.services.map((service) => (
                          <div key={service.id}>
                            <strong>{getLocalizedTitle(service, locale) ?? service.title}</strong>
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
            <p>{getLocalizedTitle(masterProfile, locale) || user.name}</p>
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
          <button
            className="profile-danger-button"
            type="button"
            disabled={isAccountDeleting}
            onClick={() => void handleDeleteAccount()}
          >
            {isAccountDeleting ? t("deletingAccount") : t("deleteAccount")}
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
            <strong>{getLocalizedCategory(masterProfile, locale) || commonT("notSpecifiedFemale")}</strong>
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
          <div className="stat-card">
            <span>{t("earningsStatTitle")}</span>
            <strong>{earnings?.total || 0} {commonT("currencyRub")}</strong>
          </div>
          <div className="stat-card">
            <span>{t("bookingsStatTitle")}</span>
            <strong>{t("totalBookings", { count: stats?.totalBookings || 0 })}</strong>
          </div>
          <div className="stat-card">
            <span>{t("ratingStatTitle")}</span>
            <strong>{t("ratingStat", { value: stats?.rating || 0 })}</strong>
          </div>
          <div className="stat-card">
            <span>{t("servicesStatTitle")}</span>
            <strong>{t("servicesStat", { count: services.length })}</strong>
          </div>
          <div className="stat-card">
            <span>{t("photosStatTitle")}</span>
            <strong>{t("photosStat", { count: expandedPortfolio.length })}</strong>
          </div>
        </div>

        <section className="profile-section">
          <h2>{t("upcomingBookings")}</h2>
          {masterBookings.length === 0 ? (
            <p>{t("noMasterBookings")}</p>
          ) : (
            <div className="client-history-list">
              {masterBookings.map((booking: BookingToMaster) => (
                <article key={booking.id} className="booking-card booking-card--detailed">
                  <div className="booking-card__info">
                    <strong>{getLocalizedTitle(booking.service ?? {}, locale) ?? t("serviceFallback")}</strong>
                    <span>{booking.client.name || t("clientNumber", { id: booking.clientId })}</span>
                    <time>{formatDateTime(booking.startTime)}</time>
                    <small>
                      {booking.client.phone
                        ? `${t("phone")}: ${booking.client.phone}`
                        : commonT("notSpecifiedMale")}
                    </small>
                    <small>{booking.status}</small>
                  </div>
                  <div className="booking-card__actions">
                    <button
                      type="button"
                      disabled={openingChatBookingId === booking.id}
                      onClick={() => void handleOpenMasterBookingChat(booking)}
                    >
                      {openingChatBookingId === booking.id ? commonT("opening") : commonT("chat")}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="profile-section profile-section--services">
          <div className="section-header">
            <h2>{t("myServices")}</h2>
            <button type="button" onClick={handleOpenAddServiceModal}>
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
                    {getLocalizedTitle(service, locale) ?? service.title} - {service.price} {commonT("currencyRub")} ({service.duration} {commonT("minutes")})
                  </span>
                  <div className="service-card__actions">
                    <button type="button" onClick={() => handleOpenEditServiceModal(service)}>
                      {commonT("edit")}
                    </button>
                    <button type="button" onClick={() => dispatch(deleteServiceThunk(service.id))}>
                      {commonT("delete")}
                    </button>
                  </div>
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
                <span>{t("masterNameEnLabel")}</span>
                <input
                  value={masterProfile.titleEn}
                  onChange={(event) =>
                    setMasterProfile((profile) => ({ ...profile, titleEn: event.target.value }))
                  }
                  placeholder={t("masterNameEnPlaceholder")}
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
                <span>{t("descriptionEn")}</span>
                <textarea
                  value={masterProfile.descriptionEn}
                  onChange={(event) =>
                    setMasterProfile((profile) => ({
                      ...profile,
                      descriptionEn: event.target.value,
                    }))
                  }
                  placeholder={t("masterDescriptionEnPlaceholder")}
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

              <div className="profile-location-picker">
                <div>
                  <strong>Точка на карте</strong>
                  <span>
                    Выберите место, где клиентам удобнее искать вас рядом с собой
                  </span>
                </div>
                <MasterGeoPicker
                  initialLat={masterProfile.latitude ?? 55.751244}
                  initialLon={masterProfile.longitude ?? 37.618423}
                  onChange={(lat, lon) => {
                    void handleMasterLocationChange(lat, lon);
                  }}
                />
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

                <label>
                  <span>{t("categoryEn")}</span>
                  <input
                    value={masterProfile.categoryEn}
                    onChange={(event) =>
                      setMasterProfile((profile) => ({ ...profile, categoryEn: event.target.value }))
                    }
                    placeholder={t("yourServicesEn")}
                  />
                </label>
              </div>

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
              <h2>{editingServiceId ? t("editService") : t("addService")}</h2>
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
                        {getLocalizedTitle(category, locale) ?? category.title}
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
                <span>{t("serviceTitleEn")}</span>
                <input
                  placeholder={t("serviceTitleEnPlaceholder")}
                  value={
                    editingServiceId
                      ? getDistinctServiceField(newService.titleEn, newService.title)
                      : newService.titleEn
                  }
                  onChange={(event) => setNewService({ ...newService, titleEn: event.target.value })}
                />
              </label>
              <label>
                <span>{t("serviceDescription")}</span>
                <textarea
                  placeholder={t("serviceDescriptionPlaceholder")}
                  value={
                    editingServiceId
                      ? getDistinctServiceField(newService.description, newService.title)
                      : newService.description
                  }
                  onChange={(event) => setNewService({ ...newService, description: event.target.value })}
                />
              </label>
              <label>
                <span>{t("serviceDescriptionEn")}</span>
                <textarea
                  placeholder={t("serviceDescriptionEnPlaceholder")}
                  value={
                    editingServiceId
                      ? getDistinctServiceField(newService.descriptionEn, newService.title)
                      : newService.descriptionEn
                  }
                  onChange={(event) =>
                    setNewService({ ...newService, descriptionEn: event.target.value })
                  }
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
                    const servicePayload = editingServiceId
                      ? sanitizeServiceDraft(newService)
                      : newService;

                    if (editingServiceId) {
                      await dispatch(updateServiceThunk({ id: editingServiceId, ...servicePayload }));
                    } else {
                      await dispatch(addServiceThunk(servicePayload));
                    }
                    dispatch(fetchMasterServicesThunk());
                    handleCloseServiceModal();
                  }}
                >
                  {commonT("save")}
                </button>
                <button type="button" onClick={handleCloseServiceModal}>
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
