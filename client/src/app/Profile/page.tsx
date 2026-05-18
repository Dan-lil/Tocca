'use client';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/app/store/store';
import { fetchUpcomingBookingsThunk } from '@/entities/booking/api/BookingApiThunk';
import { fetchSalesForClientThunk } from '@/entities/sale/api/SaleApiThunk';
import { 
  fetchMasterStatsThunk, 
  fetchMasterMoneyThunk,
  fetchMasterServicesThunk,
  fetchMasterPortfolioThunk,
  fetchUpcomingBookingsForMasterThunk,
  addServiceThunk,
  deleteServiceThunk,
  addPortfolioItemThunk,
  deletePortfolioItemThunk
} from '@/entities/master/api/masterThunk';
import { Servizi } from '@/entities/servizi/model/index';
import type { PortfolioItem, BookingToMaster } from '@/entities/master/model/index';
import type { Sale } from '@/entities/sale/model';
import type { Booking } from '@/entities/booking/model';

const ProfilePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.user);
  
  // Данные клиента
  const { upcomingBookings } = useSelector((state: RootState) => state.booking);
  const { salesForClient } = useSelector((state: RootState) => state.sale);
  
  // Данные мастера
  const masterState = useSelector((state: RootState) => state.master);
  const { stats, earnings, services, portfolio, upcomingBookings: masterBookings, loading } = masterState;
  
  const [showAddService, setShowAddService] = useState(false);
  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [newService, setNewService] = useState({ 
    title: '', 
    description: '', 
    price: 0, 
    duration: 60, 
    categoryId: 1 
  });
  const [newPhoto, setNewPhoto] = useState({ 
    imageUrl: '', 
    title: '', 
    description: '' 
  });

  const isMaster = user?.role === 'master';

  // Загрузка данных в зависимости от роли
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
  }, [user, isMaster, dispatch]);

  if (!user) return <div>Загрузка...</div>;
  if (isMaster && loading) return <div>Загрузка данных мастера...</div>;

  // КЛИЕНТ
  if (!isMaster) {
    return (
      <div className="profile-page">
        <div className="container">
          <div className="profile-header">
            <h1>Личный кабинет</h1>
            <button onClick={() => alert('Редактирование профиля')}> Редактировать</button>
          </div>

          <section>
            <h2> Ближайшие записи</h2>
            {upcomingBookings.length === 0 ? (
              <p> Вы еще не записаны</p>
            ) : (
              upcomingBookings.map((booking: Booking) => (
                <div key={booking.id} className="booking-card">
                  {booking.date} в {booking.startTime}:00
                </div>
              ))
            )}
          </section>

          <section>
            <h2> Акции для вас</h2>
            {salesForClient.length === 0 ? (
              <p>Нет активных акций</p>
            ) : (
              salesForClient.map((sale: Sale) => (
                <div key={sale.id}>🔥 -{sale.discount}% {sale.comment}</div>
              ))
            )}
          </section>
        </div>
      </div>
    );
  }

  // МАСТЕР 
  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header">
          <h1>Личный кабинет мастера</h1>
          <button onClick={() => alert('Редактирование профиля')}> Редактировать</button>
        </div>

        {/* Статистика */}
        <div className="stats-grid">
          <div className="stat-card"> {earnings?.total || 0} ₽</div>
          <div className="stat-card"> {stats?.totalBookings || 0} записей</div>
          <div className="stat-card"> {stats?.rating || 0} рейтинг</div>
          <div className="stat-card"> {services.length} услуг</div>
          <div className="stat-card"> {portfolio.length} фото</div>
        </div>

        {/* Записи к мастеру */}
        <section>
          <h2>Ближайшие записи</h2>
          {masterBookings.length === 0 ? (
            <p>Пока нет записей</p>
          ) : (
            masterBookings.map((booking: BookingToMaster) => (
              <div key={booking.id} className="booking-card">
                {booking.date} в {booking.startTime}:00 - {booking.client.name} - {booking.service.title} ({booking.totalPrice}₽)
              </div>
            ))
          )}
        </section>

        {/* Услуги мастера */}
        <section>
          <h2>Мои услуги</h2>
          <button onClick={() => setShowAddService(true)}>+ Добавить услугу</button>
          
          {services.length === 0 ? (
            <p>У вас пока нет услуг</p>
          ) : (
            services.map((service: Servizi) => (
              <div key={service.id} className="service-card">
                <span>{service.title} - {service.price}₽ ({service.duration} мин)</span>
                <button onClick={() => dispatch(deleteServiceThunk(service.id))}>🗑️</button>
              </div>
            ))
          )}
        </section>

        {/* Портфолио */}
        <section>
          <h2>📸 Портфолио</h2>
          <button onClick={() => setShowAddPhoto(true)}>+ Добавить фото</button>
          
          <div className="portfolio-grid">
            {portfolio.length === 0 ? (
              <p>Портфолио пусто</p>
            ) : (
              portfolio.map((item: PortfolioItem) => (
                <div key={item.id} className="portfolio-item">
                  <img src={item.imageUrl} alt={item.title} width="100" />
                  <p>{item.title}</p>
                  <button onClick={() => dispatch(deletePortfolioItemThunk(item.id))}>🗑️</button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Модалка добавления услуги */}
        {showAddService && (
          <div className="modal">
            <h3>Добавить услугу</h3>
            <input 
              placeholder="Название" 
              onChange={(e) => setNewService({...newService, title: e.target.value})} 
            />
            <textarea 
              placeholder="Описание" 
              onChange={(e) => setNewService({...newService, description: e.target.value})} 
            />
            <input 
              placeholder="Цена" 
              type="number" 
              onChange={(e) => setNewService({...newService, price: Number(e.target.value)})} 
            />
            <input 
              placeholder="Длительность (мин)" 
              type="number" 
              onChange={(e) => setNewService({...newService, duration: Number(e.target.value)})} 
            />
            <button onClick={async () => {
              await dispatch(addServiceThunk(newService));
              dispatch(fetchMasterServicesThunk());
              setShowAddService(false);
              setNewService({ title: '', description: '', price: 0, duration: 60, categoryId: 1 });
            }}>Сохранить</button>
            <button onClick={() => setShowAddService(false)}>Отмена</button>
          </div>
        )}

        {/* Модалка добавления фото */}
        {showAddPhoto && (
          <div className="modal">
            <h3>Добавить фото</h3>
            <input 
              placeholder="URL фото" 
              onChange={(e) => setNewPhoto({...newPhoto, imageUrl: e.target.value})} 
            />
            <input 
              placeholder="Название" 
              onChange={(e) => setNewPhoto({...newPhoto, title: e.target.value})} 
            />
            <textarea 
              placeholder="Описание" 
              onChange={(e) => setNewPhoto({...newPhoto, description: e.target.value})} 
            />
            <button onClick={async () => {
              await dispatch(addPortfolioItemThunk(newPhoto));
              dispatch(fetchMasterPortfolioThunk());
              setShowAddPhoto(false);
              setNewPhoto({ imageUrl: '', title: '', description: '' });
            }}>Сохранить</button>
            <button onClick={() => setShowAddPhoto(false)}>Отмена</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;