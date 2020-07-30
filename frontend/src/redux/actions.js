import axios from 'axios';

export const LOAD_PAPER_REQUEST = "LOAD_PAPER_REQUEST";
export const LOAD_PAPER_SUCCESS = "LOAD_PAPER_SUCCESS";
export const LOAD_PAPER_ERROR = "LOAD_PAPER_ERROR";
export const SAVE_REQUEST = "SAVE_REQUEST";
export const SAVE_SUCCESS = "SAVE_SUCCESS";
export const SAVE_ERROR = "SAVE_ERROR";
export const DISMISS_MESSAGE = "DISMISS_MESSAGE";


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

export const saveAnnotations = annotations => {
    return dispatch => {
        dispatch(saveRequest());
        let apiEndpoint = process.env.REACT_APP_API_ENDPOINT_WRITE;
        axios
          .post(apiEndpoint, {annotations: annotations})
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

export const dismissMessage = () => ({
    type: DISMISS_MESSAGE
});