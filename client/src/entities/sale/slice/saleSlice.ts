import { createSlice } from '@reduxjs/toolkit';
import { fetchSalesForClientThunk } from '@/entities/sale/api/SaleApiThunk';
import { Sale, SaleState } from "@/entities/sale/model";


const initialState: SaleState = {
  salesForClient: [],
  loading: false,
  error: null,
};

const saleSlice = createSlice({
  name: 'sale',
  initialState,
  reducers: {
    clearSaleError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchSalesForClientThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      builder.addCase(fetchSalesForClientThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.salesForClient = action.payload;
      })
      builder.addCase(fetchSalesForClientThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Ошибка загрузки акций';
      });
  },
});

export const { clearSaleError } = saleSlice.actions;
export const saleReducer = saleSlice.reducer;