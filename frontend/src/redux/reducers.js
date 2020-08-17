import {createReducer} from '@reduxjs/toolkit'


const initialState = {
    oldAnnotations: [],
    newAnnotations: [],
    isLoading: false,
    loadStatus: null,
    saveStatus: null
};

export const annotationsReducer = createReducer(initialState, {
    LOAD_PAPER_REQUEST: (state, action) => {state.isLoading = true},
    LOAD_PAPER_SUCCESS: (state, action) => {
        state.oldAnnotations = [...action.payload.annotations];
        state.newAnnotations = [...action.payload.annotations];
        state.isLoading = false;
        state.loadStatus = "Success";
    },
    LOAD_PAPER_ERROR: (state, action) => {
        state.isLoading = false;
        state.loadStatus = action.payload.error
    },
    DISMISS_ERROR: (state, action) => {
        state.loadStatus = null
    },
    SAVE_REQUEST: (state, action) => {state.isLoading = true},
    SAVE_SUCCESS: (state, action) => {
        state.isLoading = false;
        state.saveStatus = "Success";
    },
    SAVE_ERROR: (state, action) => {
        state.isLoading = false;
        state.saveStatus = action.payload.error
    },
    RESET_LOAD_STATUS: (state, action) => {
        state.loadStatus = null;
    },
    RESET_SAVE_STATUS: (state, action) => {
        state.saveStatus = null;
    },
    SET_NEW_ANNOTATIONS: (state, action) => {
        state.newAnnotations = action.payload.annotations;
    },

});