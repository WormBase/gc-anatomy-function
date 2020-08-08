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
import Table from "react-bootstrap/Table";
import Badge from "react-bootstrap/Badge";
import './Main.css';
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";


class Main extends React.Component {
    constructor(props, context) {
        super(props, context);
        this.state = {
            paperId: undefined,
            evidence: undefined,
            showDiff: false,
            showNoDiff: false,
        }
        this.table1Ref = React.createRef();
        this.table2Ref = React.createRef();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.message !== prevProps.message) {
            if (this.props.message === null) {
                this.setState({showDiff: false});
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
                <Modal show={this.state.showDiff} onHide={() => this.setState({showDiff: false})}
                       dialogClassName="your-dialog-classname" centered aria-labelledby="example-custom-modal-styling-title">
                    <Modal.Header closeButton>
                        <Modal.Title id="example-custom-modal-styling-title">Review Changes</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Container fluid>
                            <Row>
                                <Col sm={6}><h6>Old Annotations</h6></Col>
                                <Col sm={6}><h6>New Annotations</h6></Col>
                            </Row>
                            <Row>
                                <Col sm={6}>
                                    <div ref={this.table1Ref} style={{height: "600px", width: "100%", overflow: 'scroll'}}
                                         onScroll={() => {
                                             this.table2Ref.current.scrollTop = this.table1Ref.current.scrollTop;
                                             this.table2Ref.current.scrollLeft = this.table1Ref.current.scrollLeft;
                                         }}><AnnotationTable annotations={this.props.annotations} /></div>
                                </Col>
                                <Col sm={6}>
                                    <div ref={this.table2Ref} style={{height: "600px", width: "100%", overflow: 'scroll'}}
                                         onScroll={() => {
                                             this.table1Ref.current.scrollTop = this.table2Ref.current.scrollTop;
                                             this.table1Ref.current.scrollLeft = this.table2Ref.current.scrollLeft;
                                         }}><AnnotationTable annotations={this.state.newAnnotations} /></div>
                                </Col>
                            </Row>
                        </Container>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={() => {
                            let diff = diffAnatomyFunctionAnnotations(this.props.annotations, this.state.newAnnotations);
                            this.props.saveAnnotations(diff.diffAddOrMod, diff.diffDel);
                        }}>Save to DB</Button>
                    </Modal.Footer>
                </Modal>
            </Container>
        );
    }
}

class AnnotationTable extends React.Component {
    render() {

        return (
            <Table>
                <thead>
                <tr>
                    <th>Annotation Id</th>
                    <th>Phenotype</th>
                    <th>Gene</th>
                    <th>Involved/Not involved</th>
                    <th>Anatomy Terms</th>
                    <th>Remarks</th>
                    <th>Noctua Models</th>
                    <th>Genotypes</th>
                    <th>Author Statements</th>
                    <th>Assay</th>
                </tr>
                </thead>
                {this.props.annotations.map(a =>
                <tr>
                    <td>{a.annotationId.replace("existing", "").replace("notinvolved", "")}</td>
                    <td>{a.phenotype.value + ' ' + Object.entries(a.phenotype.options).map(([o, v]) => v ? '(' + o + ') ' : '').join('')}</td>
                    <td>{a.gene !== '' ? a.gene.value : ''}</td>
                    <td>{a.involved}</td>
                    <td>{a.anatomyTerms.map(a => <span><Badge variant="primary">{a.value + ' ' + Object.entries(a.options).map(([o, v]) => v ? '(' + o + ') ' : '').join('')}</Badge>&nbsp;</span>)}</td>
                    <td><OverlayTrigger delay={{ show: 250, hide: 400 }} overlay={<Tooltip id="button-tooltip"><p dangerouslySetInnerHTML={{ __html: a.remarks.join('<br/><br/>')}}/></Tooltip>}><p dangerouslySetInnerHTML={{ __html: a.remarks.join('<br/><br/>')}} style={{width: "100px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis"}}/></OverlayTrigger></td>
                    <td><p dangerouslySetInnerHTML={{ __html: a.noctuamodels.join('<br/><br/>')}}/></td>
                    <td><p dangerouslySetInnerHTML={{ __html: a.genotypes.join('<br/><br/>')}}/></td>
                    <td><p dangerouslySetInnerHTML={{ __html: a.authorstatements.join('<br/><br/>')}}/></td>
                    <td>{a.assay.value}</td>
                </tr>
                )}
            </Table>
        );
    }
}

const entitiesAreEqual = (e1, e2) => {
    return e1.value === e2.value && e1.modId === e2.modId && (e1.options === undefined && e2.options === undefined || Object.entries(e1.options).every(([k, v]) => e2.options[k] === v))
}

const anatomyFnctAnnotationsAreEqual = (a1, a2) => {
    return a1.annotationId === a2.annotationId
        && entitiesAreEqual(a1.phenotype, a2.phenotype) && entitiesAreEqual(a1.gene, a2.gene)
        && a1.anatomyTerms.every((t, idx) => {return entitiesAreEqual(t, a2.anatomyTerms[idx])})
        && a1.remarks.every((r, idx) => {return r === a2.remarks[idx]}) && a1.genotypes.every((r, idx) => {return r === a2.genotypes[idx]})
        && a1.noctuamodels.every((r, idx) => {return r === a2.noctuamodels[idx]})
        && a1.authorstatements.every((r, idx) => {return r === a2.authorstatements[idx]}) && a1.assay.value === a2.assay.value
        && a1.evidence === a2.evidence && a1.dateAssigned === a2.dateAssigned;
}

const annotationDiffStatus = (oldAnnotations, newAnnotations) => {
    let modifiedAnnotIds = []
    let newIds = new Set([...newAnnotations.map(a => a.annotationId)]);
    let oldIds = new Set([...newAnnotations.map(a => a.annotationId)]);
    let deletedAnnotIds = [...(oldIds - newIds)];
    let addedAnnotIds = [...(newIds - oldIds)];
    newAnnotations.forEach((newAnnot) => {
        if (!oldAnnotations.some((oldAnnot) => anatomyFnctAnnotationsAreEqual(newAnnot, oldAnnot))) {
            modifiedAnnotIds.push(newAnnot.annotationId);
        }
    });
    modifiedAnnotIds = [...(new Set(modifiedAnnotIds) - addedAnnotIds)];
    return {modifiedIds: modifiedAnnotIds, newIds: newIds, deletedIds: deletedAnnotIds};
}

const diffAnatomyFunctionAnnotations = (oldAnnotations, newAnnotations) => {
    let diffAddOrMod = []
    let diffDel = []
    newAnnotations.forEach((newAnnot) => {
        if (!oldAnnotations.some((oldAnnot) => anatomyFnctAnnotationsAreEqual(newAnnot, oldAnnot))) {
            diffAddOrMod.push(newAnnot);
        }
    });
    oldAnnotations.forEach((oldAnnot) => {
        if (!newAnnotations.some((newAnnot) => anatomyFnctAnnotationsAreEqual(oldAnnot, newAnnot)) &&
            !diffAddOrMod.some((annotToMod) => {return annotToMod.annotationId === oldAnnot.annotationId})) {
            diffDel.push(oldAnnot);
        }
    });
    return {numChanges: diffAddOrMod.length + diffDel.length, diffAddOrMod: diffAddOrMod, diffDel: diffDel};
}

const mapStateToProps = state => ({
    annotations: getAnnotations(state),
    isLoading: isLoading(state),
    message: getMessage(state)
});

export default connect(mapStateToProps, {loadPaper, dismissMessage, saveAnnotations})(Main);