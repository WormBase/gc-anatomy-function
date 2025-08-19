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
            const paperId = this.state.paperId.replace('WBPaper', '').trim();
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
                            const paperId = this.state.paperId.replace('WBPaper', '').trim();
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
                                               // Process annotations to handle manual entries
                                               const processedAnnotations = annotations.anatomyFunction.map(annot => {
                                                   const manualEntries = [];
                                                   
                                                   // Process anatomy terms (involved tissues)
                                                   const validAnatomyTerms = [];
                                                   if (annot.anatomyTerms && annot.anatomyTerms.length > 0) {
                                                       annot.anatomyTerms.forEach(term => {
                                                           if (!term.modId || term.modId === '') {
                                                               manualEntries.push(`Manual anatomy term: ${term.value}`);
                                                           } else {
                                                               validAnatomyTerms.push(term);
                                                           }
                                                       });
                                                   }
                                                   
                                                   // Process gene - keep the entity but clear the ID for manual entries
                                                   let validGene = annot.gene;
                                                   if (annot.gene && annot.gene.value && (!annot.gene.modId || annot.gene.modId === '')) {
                                                       manualEntries.push(`Manual gene: ${annot.gene.value}`);
                                                       validGene = {...annot.gene, modId: ''};
                                                   }
                                                   
                                                   // Process phenotype - keep the entity but clear the ID for manual entries
                                                   let validPhenotype = annot.phenotype;
                                                   if (annot.phenotype && (!annot.phenotype.modId || annot.phenotype.modId === '')) {
                                                       manualEntries.push(`Manual phenotype: ${annot.phenotype.value}`);
                                                       validPhenotype = {...annot.phenotype, modId: ''};
                                                   }
                                                   
                                                   // Create updated annotation
                                                   const updatedAnnot = {
                                                       ...annot,
                                                       anatomyTerms: validAnatomyTerms,
                                                       gene: validGene,
                                                       phenotype: validPhenotype
                                                   };
                                                   
                                                   // Add manual entries to remarks
                                                   if (manualEntries.length > 0) {
                                                       updatedAnnot.remarks = [
                                                           ...(annot.remarks || []),
                                                           ...manualEntries
                                                       ];
                                                   }
                                                   
                                                   return updatedAnnot;
                                               });
                                               
                                               // Filter out null annotations from early validation
                                               const validProcessedAnnotations = processedAnnotations.filter(annot => annot !== null);
                                               
                                               // Mark annotations as invalid if they don't have required entities
                                               const annotationsWithValidation = validProcessedAnnotations.map((annot, index) => {
                                                   // Check if annotation has all required entities with valid IDs
                                                   const hasValidAnatomyTerms = annot.anatomyTerms.length > 0 && 
                                                                               annot.anatomyTerms.every(term => term && term.modId && term.modId !== '');
                                                   const hasValidGene = !annot.gene || annot.gene === '' || (annot.gene.modId && annot.gene.modId !== '');
                                                   const hasValidPhenotype = annot.phenotype && annot.phenotype.modId && annot.phenotype.modId !== '';
                                                   
                                                   const isValid = hasValidAnatomyTerms && hasValidGene && hasValidPhenotype;
                                                   
                                                   if (!isValid) {
                                                       const missingFields = [];
                                                       if (!hasValidAnatomyTerms) {
                                                           if (annot.anatomyTerms.length === 0) {
                                                               missingFields.push('anatomy terms');
                                                           } else {
                                                               missingFields.push('anatomy terms with valid IDs');
                                                           }
                                                       }
                                                       if (!hasValidGene) missingFields.push('gene with valid ID');
                                                       if (!hasValidPhenotype) missingFields.push('phenotype with valid ID');
                                                       
                                                       console.warn(`Annotation at index ${index} has missing valid IDs for: ${missingFields.join(', ')}`);
                                                       
                                                       // Add validation flag and warning to remarks
                                                       const warningMessage = `⚠️ WARNING: This annotation cannot be saved - missing valid IDs for: ${missingFields.join(', ')}`;
                                                       const existingRemarks = annot.remarks || [];
                                                       const hasWarning = existingRemarks.some(remark => remark.startsWith('⚠️ WARNING:'));
                                                       
                                                       return {
                                                           ...annot,
                                                           _isInvalid: true,
                                                           remarks: hasWarning ? existingRemarks : [...existingRemarks, warningMessage]
                                                       };
                                                   }
                                                   
                                                   return annot;
                                               });
                                               
                                               
                                               let diff = getAnnotationDiff(this.props.oldAnnotations, annotationsWithValidation);
                                               this.setState({
                                                   showDiff: (diff.newIds.size + diff.modifiedIds.size + diff.deletedIds.size) > 0,
                                                   showNoDiff: (diff.newIds.size + diff.modifiedIds.size + diff.deletedIds.size) === 0
                                               });
                                               this.props.setNewAnnotations(annotationsWithValidation)
                                           }}
                                           showAnnotationIds={true}
                                           evidence={"WBPaper" + this.state.evidence}
                                           autocompleteObj={new WBAutocomplete('https://caltech-curation.textpressolab.com/pub/cgi-bin/forms/datatype_objects.cgi?action=autocompleteXHR&objectType=')}
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