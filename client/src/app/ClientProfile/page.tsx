'use client'
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/app/store/store';
import {fetchUpcomingBookingsThunk, cancelBookingThunk,} from '@/entities/booking/api/BookingApiThunk';
import { fetchSalesForClientThunk } from '@/entities/sale/api/SaleApiThunk';


const ClientProfile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  const { upcomingBookings, loading } = useSelector((state: RootState) => state.booking);
  const { salesForClient } = useSelector((state: RootState) => state.sale);

  useEffect(() => {
    dispatch(fetchUpcomingBookingsThunk());
    dispatch(fetchSalesForClientThunk());
  }, [dispatch]);

  if (loading) return <div>Загрузка...</div>;

  const hasBookings = upcomingBookings.length > 0;

  return (
    <div>
      <h1>Личный кабинет</h1>

      <section>
        <h2>Ближайшие записи</h2>
        {!hasBookings ? (
          <p>✨ Вы еще не записаны</p>
        ) : (
          upcomingBookings.map((booking) => (
            <div key={booking.id}>
              <p>{booking.date} {booking.startTime}:00</p>
              {/* <p>{booking.servizi?.title}</p> */}
            </div>
          ))
        )}
      </section>

      <section>
        <h2>Акции для вас</h2>
        {salesForClient.length === 0 ? (
          <p>Нет активных акций</p>
        ) : (
          salesForClient.map((sale) => (
            <div key={sale.id}>-{sale.discount}% {sale.comment}</div>
          ))
        )}
      </section>
    </div>
  );
};

export default ClientProfile;