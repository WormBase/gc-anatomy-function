import {createReducer} from '@reduxjs/toolkit'


const initialState = {
    annotations: [],
    isLoading: false,
    error: null
};

export const annotationsReducer = createReducer(initialState, {
    LOAD_PAPER_REQUEST: (state, action) => {state.isLoading = true},
    LOAD_PAPER_SUCCESS: (state, action) => {
        state.annotations = action.payload.annotations;
        state.isLoading = false;
        state.error = null;
    },
    LOAD_PAPERS_ERROR: (state, action) => {
        state.isLoading = false;
        state.error = action.payload.error
    },
    DISMISS_ERROR: (state, action) => {
        state.error = null
    }
});