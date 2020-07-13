import axios from 'axios';

export const LOAD_PAPER_REQUEST = "LOAD_PAPER_REQUEST";
export const LOAD_PAPER_SUCCESS = "LOAD_PAPER_SUCCESS";
export const LOAD_PAPER_ERROR = "LOAD_PAPER_ERROR";
export const DISMISS_ERROR = "DISMISS_ERROR";


export const loadPaper = paperId => {
    return dispatch => {
        dispatch(loadPaperRequest());
        let apiEndpoint = process.env.REACT_APP_API_ENDPOINT;
        axios
          .post(apiEndpoint, {paper_id: paperId})
          .then(res => {
              if (res.data.annotations) {
                  dispatch(loadPaperSuccess(res.data.annotations));
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

export const dismissError = () => ({
    type: DISMISS_ERROR
});