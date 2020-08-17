import React from 'react';
import Modal from "react-bootstrap/Modal";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import {diffAnatomyFunctionAnnotations, getAnnotationsDiffStatus} from "../utils";
import Badge from "react-bootstrap/Badge";
import {saveAnnotations} from "../redux/actions";
import {connect} from "react-redux";
import {getNewAnnotations, getOldAnnotations, getSaveStatus} from "../redux/selectors";

class ReviewChanges extends React.Component {

    constructor(props) {
        super(props);
        this.table1Ref = React.createRef();
        this.table2Ref = React.createRef();
    }

    render() {

        return (
            <Modal show={this.props.show} onHide={this.props.onHide}
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
                                     }}><AnnotationTable annotations={this.props.oldAnnotations}
                                                         annotationsDiffStatus={getAnnotationsDiffStatus(this.props.oldAannotations, this.props.newAnnotations)} /></div>
                            </Col>
                            <Col sm={6}>
                                <div ref={this.table2Ref} style={{height: "600px", width: "100%", overflow: 'scroll'}}
                                     onScroll={() => {
                                         this.table1Ref.current.scrollTop = this.table2Ref.current.scrollTop;
                                         this.table1Ref.current.scrollLeft = this.table2Ref.current.scrollLeft;
                                     }}><AnnotationTable annotations={this.props.newAnnotations}
                                                         annotationsDiffStatus={getAnnotationsDiffStatus(this.props.oldAnnotations, this.props.newAnnotations)} /></div>
                            </Col>
                        </Row>
                    </Container>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={() => {
                        let diff = diffAnatomyFunctionAnnotations(this.props.oldAnnotations, this.props.newAnnotations);
                        this.props.saveAnnotations(diff.diffAddOrMod, diff.diffDel);
                    }}>Save to DB</Button>
                </Modal.Footer>
            </Modal>
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
                {this.props.annotations.map(a => {
                    let rowClass = '';
                    if (this.props.annotationsDiffStatus.newIds.has(a.annotationId)) {
                        rowClass = 'addedAnnotationRow';
                    } else if (this.props.annotationsDiffStatus.deletedIds.has(a.annotationId)) {
                        rowClass = 'deletedAnnotationRow';
                    } else if (this.props.annotationsDiffStatus.modifiedIds.has(a.annotationId)) {
                        rowClass = 'modifiedAnnotationRow';
                    }
                    return (
                        <tr className={rowClass}>
                            <td>{a.annotationId.replace("existing", "").replace("notinvolved", "")}</td>
                            <td>{a.phenotype.value + ' ' + Object.entries(a.phenotype.options).map(([o, v]) => v ? '(' + o + ') ' : '').join('')}</td>
                            <td>{a.gene !== '' ? a.gene.value : ''}</td>
                            <td>{a.involved}</td>
                            <td>{a.anatomyTerms.map(a => <span><Badge
                                variant="primary">{a.value + ' ' + Object.entries(a.options).map(([o, v]) => v ? '(' + o + ') ' : '').join('')}</Badge>&nbsp;</span>)}</td>
                            <td><OverlayTrigger delay={{show: 250, hide: 400}} overlay={<Tooltip id="button-tooltip"><p
                                dangerouslySetInnerHTML={{__html: a.remarks.join('<br/><br/>')}}/></Tooltip>}><p
                                dangerouslySetInnerHTML={{__html: a.remarks.join('<br/><br/>')}} style={{
                                width: "100px",
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                                textOverflow: "ellipsis"
                            }}/></OverlayTrigger></td>
                            <td><OverlayTrigger delay={{show: 250, hide: 400}} overlay={<Tooltip id="button-tooltip"><p
                                dangerouslySetInnerHTML={{__html: a.noctuamodels.join('<br/><br/>')}}/></Tooltip>}><p
                                dangerouslySetInnerHTML={{__html: a.noctuamodels.join('<br/><br/>')}} style={{
                                width: "100px",
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                                textOverflow: "ellipsis"
                            }}/></OverlayTrigger></td>
                            <td><OverlayTrigger delay={{show: 250, hide: 400}} overlay={<Tooltip id="button-tooltip"><p
                                dangerouslySetInnerHTML={{__html: a.genotypes.join('<br/><br/>')}}/></Tooltip>}><p
                                dangerouslySetInnerHTML={{__html: a.genotypes.join('<br/><br/>')}} style={{
                                width: "100px",
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                                textOverflow: "ellipsis"
                            }}/></OverlayTrigger></td>
                            <td><OverlayTrigger delay={{show: 250, hide: 400}} overlay={<Tooltip id="button-tooltip"><p
                                dangerouslySetInnerHTML={{__html: a.authorstatements.join('<br/><br/>')}}/></Tooltip>}><p
                                dangerouslySetInnerHTML={{__html: a.authorstatements.join('<br/><br/>')}} style={{
                                width: "100px",
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                                textOverflow: "ellipsis"
                            }}/></OverlayTrigger></td>
                            <td>{a.assay.value}</td>
                        </tr>);
                    }
                )}
            </Table>
        );
    }
}

const mapStateToProps = state => ({
    newAnnotations: getNewAnnotations(state),
    oldAnnotations: getOldAnnotations(state),
    saveStatus: getSaveStatus(state)
});

export default connect(mapStateToProps, {saveAnnotations})(ReviewChanges);