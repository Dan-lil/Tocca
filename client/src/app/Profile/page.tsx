"use client";

import "./page.css";
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
import { axiosInstance } from "@/shared/lib/axiosInstance";
import type { ServerResponseType } from "@/shared/types";

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
    if (!isMaster) return;

    axiosInstance
      .get<ServerResponseType<ProfileMaster | null>>("/profile/me")
      .then((response) => {
        setMasterProfile(response.data.data ?? emptyMasterProfile);
      })
      .catch(() => {
        setProfileError("Не удалось загрузить профиль мастера");
      });
  }, [isMaster]);

  async function handleSaveMasterProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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

        <section className="profile-section">
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
                  onClick={async () => {
                    await dispatch(addServiceThunk(newService));
                    dispatch(fetchMasterServicesThunk());
                    setShowAddService(false);
                    setNewService({ title: "", description: "", price: 0, duration: 60, categoryId: 1 });
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
