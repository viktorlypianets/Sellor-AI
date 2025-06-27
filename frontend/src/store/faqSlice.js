import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
const backendURL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

export const fetchFaq = createAsyncThunk("/api/faq/all", async (id) => {
  try {
    console.log("Fetching repli data from backend...", backendURL);
    const res = await axios.get(backendURL + `/api/faq/all?product_id=${id}`);
    let response = res.data;
    console.log("Response from backend:", response);
    if (response.success) {
      console.log(response);
      return response.data;
    }
  } catch (error) {
    console.error(error);
  }
});

export const updateFaqs = createAsyncThunk("/faqs/update", async (data) => {
  try {
    console.log("Updating repli data from backend...", backendURL);
    const res = await axios.post(backendURL + `/api/faq/${data.id}`, {
      ...data,
    });
    console.log("Response from backend:", res.data);
    let response = res.data;
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.message || "Approval failed");
    }
  } catch (error) {
    throw error;
  }
});

export const deleteFaq = createAsyncThunk("/faqs/delete", async (id) => {
  try {
    const res = await axios.delete(backendURL + `/api/faq/${id}`);
    let response = res.data;
    if (response.success) {
      console.log("Response from backendasdf:", response.data);
      return response.data;
    } else {
      throw new Error(response.message || "Approval failed");
    }
  } catch (error) {
    throw error;
  }
});

const faqSlice = createSlice({
  name: "faqs",
  initialState: {
    items: [],
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFaq.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchFaq.fulfilled, (state, action) => {
        state.status = "successed";
        state.items = action.payload;
      })
      .addCase(fetchFaq.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(updateFaqs.fulfilled, (state, action) => {
        const updatedFaq = action.payload;
        const idx = state.items.findIndex((item) => item.id === updatedFaq.id);
        if (idx !== -1) {
          state.items[idx] = updatedFaq;
        }
      })
      .addCase(deleteFaq.fulfilled, (state, action) => {
        console.log("deleteFaq", action.payload);
        const deletedId = action.payload;
        console.log("deletedId", deletedId);
        state.items = state.items.filter((item) => item.id !== deletedId);
      });
  },
});

export const { approveFaq, editFaq } = faqSlice.actions;
export default faqSlice.reducer;
