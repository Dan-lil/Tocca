import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Servizi } from '@/entities/servizi/model/index';
import type { MasterState, MasterStats, MasterEarnings, PortfolioItem,BookingToMaster} from '@/entities/master/model/index';
import {fetchMasterStatsThunk, fetchMasterMoneyThunk, fetchMasterServicesThunk, addServiceThunk, updateServiceThunk, deleteServiceThunk, fetchMasterPortfolioThunk, addPortfolioItemThunk, deletePortfolioItemThunk, fetchUpcomingBookingsForMasterThunk } from '@/entities/master/api/masterThunk';

const initialState: MasterState = {
  stats: null,
  earnings: null,
  services: [],
  portfolio: [],
  upcomingBookings: [],
  loading: false,
  error: null,
};

const masterSlice = createSlice({
  name: 'master',
  initialState,
  reducers: {
    clearMasterData: (state) => {
      state.stats = null;
      state.earnings = null;
      state.services = [];
      state.portfolio = [];
      state.upcomingBookings = [];
      state.error = null;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateServiceLocally: (state, action: PayloadAction<Servizi>) => {
      const index = state.services.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.services[index] = action.payload;
      }
    },
    removeServiceLocally: (state, action: PayloadAction<number>) => {
      state.services = state.services.filter(s => s.id !== action.payload);
      if (state.stats) {
        state.stats.activeServices = state.services.length;
      }
    },
  },

  extraReducers: (builder) => {
    builder.addCase(fetchMasterStatsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      builder.addCase(fetchMasterStatsThunk.fulfilled, (state, action: PayloadAction<MasterStats>) => {
        state.loading = false;
        state.stats = action.payload;
      })
      builder.addCase(fetchMasterStatsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      builder.addCase(fetchMasterMoneyThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      builder.addCase(fetchMasterMoneyThunk.fulfilled, (state, action: PayloadAction<MasterEarnings>) => {
        state.loading = false;
        state.earnings = action.payload;
      })
      builder.addCase(fetchMasterMoneyThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })


      builder.addCase(fetchMasterServicesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      builder.addCase(fetchMasterServicesThunk.fulfilled, (state, action: PayloadAction<Servizi[]>) => {
        state.loading = false;
        state.services = action.payload;
        if (state.stats) {
          state.stats.activeServices = action.payload.length;
        }
      })
      builder.addCase(fetchMasterServicesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      builder.addCase(addServiceThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      builder.addCase(addServiceThunk.fulfilled, (state, action: PayloadAction<Servizi>) => {
        state.loading = false;
        state.services.push(action.payload);
        if (state.stats) {
          state.stats.activeServices = state.services.length;
        }
      })
      builder.addCase(addServiceThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      builder.addCase(updateServiceThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      builder.addCase(updateServiceThunk.fulfilled, (state, action: PayloadAction<Servizi>) => {
        state.loading = false;
        const index = state.services.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.services[index] = action.payload;
        }
      })
      builder.addCase(updateServiceThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

     builder.addCase(deleteServiceThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      builder.addCase(deleteServiceThunk.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.services = state.services.filter(s => s.id !== action.payload);
        if (state.stats) {
          state.stats.activeServices = state.services.length;
        }
      })
      builder.addCase(deleteServiceThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })


      builder.addCase(fetchMasterPortfolioThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      builder.addCase(fetchMasterPortfolioThunk.fulfilled, (state, action: PayloadAction<PortfolioItem[]>) => {
        state.loading = false;
        state.portfolio = action.payload;
        if (state.stats) {
          state.stats.portfolioCount = action.payload.length;
        }
      })
      builder.addCase(fetchMasterPortfolioThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

     builder .addCase(addPortfolioItemThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      builder.addCase(addPortfolioItemThunk.fulfilled, (state, action: PayloadAction<PortfolioItem>) => {
        state.loading = false;
        state.portfolio.unshift(action.payload); // новое фото в начало
        if (state.stats) {
          state.stats.portfolioCount = state.portfolio.length;
        }
      })
      builder.addCase(addPortfolioItemThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      builder.addCase(deletePortfolioItemThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      builder.addCase(deletePortfolioItemThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.portfolio = state.portfolio.filter(item => item.id !== action.payload);
        if (state.stats) {
          state.stats.portfolioCount = state.portfolio.length;
        }
      })
      builder.addCase(deletePortfolioItemThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })


       builder.addCase(fetchUpcomingBookingsForMasterThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      builder.addCase(fetchUpcomingBookingsForMasterThunk.fulfilled, (state, action: PayloadAction<BookingToMaster[]>) => {
        state.loading = false;
        state.upcomingBookings = action.payload;
      })
      builder.addCase(fetchUpcomingBookingsForMasterThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

      export const { 
      clearMasterData, 
      clearError, 
      updateServiceLocally, 
      removeServiceLocally 
    } = masterSlice.actions;

export default masterSlice.reducer;
    

