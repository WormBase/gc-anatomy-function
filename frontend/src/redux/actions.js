import axios from 'axios';

export const LOAD_PAPER_REQUEST = "LOAD_PAPER_REQUEST";
export const LOAD_PAPER_SUCCESS = "LOAD_PAPER_SUCCESS";
export const LOAD_PAPER_ERROR = "LOAD_PAPER_ERROR";
export const SAVE_REQUEST = "SAVE_REQUEST";
export const SAVE_SUCCESS = "SAVE_SUCCESS";
export const SAVE_ERROR = "SAVE_ERROR";
export const RESET_LOAD_STATUS = "RESET_LOAD_STATUS";
export const RESET_SAVE_STATUS = "RESET_SAVE_STATUS";
export const SET_NEW_ANNOTATIONS = "SET_NEW_ANNOTATIONS";


export const loadPaper = paperId => {
    return dispatch => {
        dispatch(loadPaperRequest());
        let apiEndpoint = process.env.REACT_APP_API_ENDPOINT_READ;
        axios
          .post(apiEndpoint, {paper_id: paperId})
          .then(res => {
              if (res.data.annotations) {
                  if (res.data.annotations.length > 0) {
                      dispatch(loadPaperSuccess(res.data.annotations));
                  }
                  else {
                      dispatch(loadPaperSuccess([]));
                  }
              }
              else {
                  dispatch(loadPaperError('Paper not found'));
              }
          })
          .catch(err => {
            dispatch(loadPaperError(err.message));
          });
    };
};

export const saveAnnotations = (addOrModAnnotations, delAnnotations) => {
    return dispatch => {
        dispatch(saveRequest());
        let apiEndpoint = process.env.REACT_APP_API_ENDPOINT_WRITE;
        axios
          .post(apiEndpoint, {addOrModAnnotations: addOrModAnnotations, delAnnotations: delAnnotations})
          .then(res => {
              dispatch(saveSuccess());
          })
          .catch(err => {
            dispatch(saveError(err.message));
          });
    };
};

export const loadPaperRequest = () => ({
    type: LOAD_PAPER_REQUEST
});

export const loadPaperSuccess = (annotations) => ({
    type: LOAD_PAPER_SUCCESS,
    payload: { annotations }
});

export const loadPaperError = error => ({
    type: LOAD_PAPER_ERROR,
    payload: { error }
});

export const saveRequest = () => ({
    type: SAVE_REQUEST
});

export const saveSuccess = () => ({
    type: SAVE_SUCCESS
});

export const saveError = error => ({
    type: SAVE_ERROR,
    payload: { error }
});

export const resetLoadStatus = () => ({
    type: RESET_LOAD_STATUS
});

export const resetSaveStatus = () => ({
    type: RESET_SAVE_STATUS
});

export const setNewAnnotations = newAnnotations => ({
    type: SET_NEW_ANNOTATIONS,
    payload: {annotations: newAnnotations}
})