import React from 'react';
import GraphicalCuration from "@wormbase/graphical-curation";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import {getLoadStatus, getNewAnnotations, getOldAnnotations, getSaveStatus, isLoading} from "./redux/selectors";
import {connect} from "react-redux";
import {loadPaper, resetLoadStatus, resetSaveStatus, saveAnnotations, setNewAnnotations} from "./redux/actions";
import {WBAutocomplete} from "@wormbase/graphical-curation/lib/autocomplete.js"
import Modal from "react-bootstrap/Modal";
import './Main.css';
import ReviewChanges from "./components/ReviewChanges";
import {getAnnotationDiff} from "./utils";


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
        if (this.props.saveStatus !== prevProps.saveStatus && this.props.saveStatus === "Success") {
            this.setState({showDiff: false});
            const paperId = this.state.paperId.replace('WBPaper', '');
            this.props.loadPaper(paperId);
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
                                           anatomyFunctionAnnotations={this.props.newAnnotations}
                                           annotationsSaved={annotations => {
                                               let diff = getAnnotationDiff(this.props.oldAnnotations, annotations.anatomyFunction);
                                               this.setState({
                                                   showDiff: (diff.newIds.size + diff.modifiedIds.size + diff.deletedIds.size) > 0,
                                                   showNoDiff: (diff.newIds.size + diff.modifiedIds.size + diff.deletedIds.size) === 0
                                               });
                                               this.props.setNewAnnotations(annotations.anatomyFunction)
                                           }}
                                           showAnnotationIds={true}
                                           evidence={"WBPaper" + this.state.evidence}
                                           autocompleteObj={new WBAutocomplete('http://caltech-curation.textpressolab.com/pub/cgi-bin/forms/datatype_objects.cgi?action=autocompleteXHR&objectType=')}
                        />
                        : ''}
                    </Col>
                </Row>
                <Modal show={this.props.saveStatus !== null} onHide={() => {
                    this.props.resetSaveStatus();
                    if (this.props.saveStatus === "Success") {
                        this.setState({showDiff: false});
                    }
                }} centered>
                    <Modal.Header closeButton>
                        <Modal.Title id="contained-modal-title-vcenter">
                            {this.props.saveStatus === "Success" ? "Success": "Error"}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {this.props.saveStatus === "Success" ? "Annotations Saved to DB" : this.props.saveStatus}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={this.props.resetSaveStatus}>Close</Button>
                    </Modal.Footer>
                </Modal>
                <Modal show={this.props.loadStatus !== null && this.props.loadStatus !== "Success"}
                       onHide={() => this.props.resetLoadStatus()} centered>
                    <Modal.Header closeButton>
                        <Modal.Title id="contained-modal-title-vcenter">
                            {this.props.loadStatus === "Success" ? "Success": "Error"}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {this.props.loadStatus === "Success" ? "Annotations loaded from DB" : this.props.loadStatus}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={this.props.resetLoadStatus}>Close</Button>
                    </Modal.Footer>
                </Modal>
                <Modal show={this.state.showNoDiff} onHide={() => this.setState({showNoDiff: false})} centered>
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
                <ReviewChanges show={this.state.showDiff} onHide={() => this.setState({showDiff: false})}/>
            </Container>
        );
    }
}

const mapStateToProps = state => ({
    newAnnotations: getNewAnnotations(state),
    oldAnnotations: getOldAnnotations(state),
    isLoading: isLoading(state),
    loadStatus: getLoadStatus(state),
    saveStatus: getSaveStatus(state)
});

export default connect(mapStateToProps, {loadPaper, saveAnnotations, setNewAnnotations, resetSaveStatus, resetLoadStatus})(Main);