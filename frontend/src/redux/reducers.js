import {createReducer} from '@reduxjs/toolkit'


const initialState = {
    annotations: [],
    isLoading: false,
    message: null
};

export const annotationsReducer = createReducer(initialState, {
    LOAD_PAPER_REQUEST: (state, action) => {state.isLoading = true},
    LOAD_PAPER_SUCCESS: (state, action) => {
        state.annotations = action.payload.annotations;
        state.isLoading = false;
        state.message = null;
    },
    LOAD_PAPER_ERROR: (state, action) => {
        state.isLoading = false;
        state.message = action.payload.error
    },
    DISMISS_MESSAGE: (state, action) => {
        state.message = null
    },
    SAVE_REQUEST: (state, action) => {state.isLoading = true},
    SAVE_SUCCESS: (state, action) => {state.isLoading = false; state.message = "Annotations saved"},
    SAVE_ERROR: (state, action) => {state.isLoading = false; state.message = action.payload.error},
});