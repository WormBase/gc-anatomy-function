import React from 'react';
import GraphicalCuration from "@wormbase/graphical-curation";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import {getAnnotations, getMessage, isLoading} from "./redux/selectors";
import {connect} from "react-redux";
import {dismissMessage, loadPaper, saveAnnotations} from "./redux/actions";
import {WBAutocomplete} from "@wormbase/graphical-curation/lib/autocomplete.js"
import Modal from "react-bootstrap/Modal";
import './Main.css';
import ReviewChanges from "./components/ReviewChanges";
import {diffAnatomyFunctionAnnotations} from "./utils";


class Main extends React.Component {
    constructor(props, context) {
        super(props, context);
        this.state = {
            paperId: undefined,
            evidence: undefined,
            showDiff: false,
            showNoDiff: false,
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.message !== prevProps.message) {
            if (this.props.message === null) {
                this.setState({showDiff: false});
            } else if (this.props.message === "Annotations saved") {
                this.props.loadPaper(this.state.paperId);
            }
        }
    }

    render() {

        const entities = {
            ANATOMY_FUNCTION_ASSAYS: [{value: 'Expression_mosaic'}, {value: 'Genetic_mosaic'}, {value: 'Laser_ablation'},
                {value: 'Optogenetic'}, {value: 'Blastomere_isolation'}, {value: 'Genetic_ablation'},
                {value: 'Chemogenetics'}, {value: 'Neuronal_genetics'}]
        }

        return(
            <Container fluid>
                <Row>
                    <Col sm={2}>
                        &nbsp;
                    </Col>
                </Row>
                <Row>
                    <Col sm={12}>
                        <h3>Anatomy Function Annotation Tool</h3>
                    </Col>
                </Row>
                <Row>
                    <Col sm={2}>
                        &nbsp;
                    </Col>
                </Row>
                <Row>
                    <Col sm={2}>
                        <Form.Control inline type="text" placeholder="WBPaperID"
                                      value={this.state.paperId} onChange={(event) => {
                                          this.setState({paperId: event.target.value})
                                      }}/>
                    </Col>
                    <Col sm={1}>
                        <Button variant="light" onClick={() => {
                            const paperId = this.state.paperId.replace('WBPaper', '');
                            this.props.loadPaper(paperId); this.setState({evidence: paperId, paperId: paperId})}}>Load
                        </Button>
                    </Col>
                </Row>
                <Row>
                    <Col sm={2}>
                        &nbsp;
                    </Col>
                </Row>
                <Row>
                    <Col>
                        {this.state.evidence !== undefined ?
                        <GraphicalCuration error={this.props.error} showExpressionCuration={false} showPhenotypeCuration={false}
                                           entities={entities}
                                           anatomyFunctionAnnotations={this.props.annotations}
                                           annotationsSaved={annotations => {this.setState({
                                               newAnnotations: annotations.anatomyFunction,
                                               showDiff: diffAnatomyFunctionAnnotations(this.props.annotations, annotations.anatomyFunction).numChanges > 0,
                                               showNoDiff: diffAnatomyFunctionAnnotations(this.props.annotations, annotations.anatomyFunction).numChanges === 0
                                           })}}
                                           showAnnotationIds={true}
                                           evidence={"WBPaper" + this.state.evidence}
                                           autocompleteObj={new WBAutocomplete('http://tazendra.caltech.edu/~azurebrd/cgi-bin/forms/datatype_objects.cgi?action=autocompleteXHR&objectType=')}
                        />
                        : ''}
                    </Col>
                </Row>
                <Modal show={this.props.message !== null} onHide={this.props.dismissMessage} centered>
                    <Modal.Header closeButton>
                        <Modal.Title id="contained-modal-title-vcenter">
                            {this.props.message === "Annotations saved" ? "Success": "Error"}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {this.props.message}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={this.props.dismissMessage}>Close</Button>
                    </Modal.Footer>
                </Modal><Modal show={this.state.showNoDiff} onHide={() => this.setState({showNoDiff: false})} centered>
                    <Modal.Header closeButton>
                        <Modal.Title id="contained-modal-title-vcenter">
                            Warning
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        No changes need to be saved.
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => this.setState({showNoDiff: false})}>Close</Button>
                    </Modal.Footer>
                </Modal>
                <ReviewChanges show={this.state.showDiff} onHide={this.setState({showDiff: false})} oldAnnotations={this.props.oldAnnotations} newAnnotations={this.state.newAnnotations} saveAnnotations={this.props.saveAnnotations}/>
            </Container>
        );
    }
}

const mapStateToProps = state => ({
    annotations: getAnnotations(state),
    isLoading: isLoading(state),
    message: getMessage(state)
});

export default connect(mapStateToProps, {loadPaper, dismissMessage, saveAnnotations})(Main);