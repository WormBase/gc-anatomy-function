import React from 'react';
import Modal from "react-bootstrap/Modal";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import {diffAnatomyFunctionAnnotations, getAnnotationsDiffStatus} from "../utils";
import {saveAnnotations} from "../redux/actions";
import {connect} from "react-redux";
import {getNewAnnotations, getOldAnnotations, getSaveStatus} from "../redux/selectors";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import Table from "react-bootstrap/Table";
import Badge from "react-bootstrap/Badge";
import './ReviewChanges.css';

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
                                     }}><AnatomyFunctionAnnotationTable annotations={this.props.oldAnnotations}
                                                                        annotationsDiffStatus={getAnnotationsDiffStatus(this.props.oldAnnotations, this.props.newAnnotations)} /></div>
                            </Col>
                            <Col sm={6}>
                                <div ref={this.table2Ref} style={{height: "600px", width: "100%", overflow: 'scroll'}}
                                     onScroll={() => {
                                         this.table1Ref.current.scrollTop = this.table2Ref.current.scrollTop;
                                         this.table1Ref.current.scrollLeft = this.table2Ref.current.scrollLeft;
                                     }}><AnatomyFunctionAnnotationTable annotations={this.props.newAnnotations}
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

class AnatomyFunctionAnnotationTable extends React.Component {
    render() {

        return (
            <Table striped bordered hover size="sm">
                <thead>
                    <tr style={{backgroundColor: 'lightgray'}}>
                        <th>ID</th>
                        <th>Phenotype</th>
                        <th width="100px">Gene</th>
                        <th>Involved/Not Involved in</th>
                        <th>Anatomy Terms</th>
                        <th>Remarks</th>
                        <th>Noctua Models</th>
                        <th>Genotypes</th>
                        <th>Author Statements</th>
                        <th>Assay</th>
                        <th>Date Assigned</th>
                    </tr>
                </thead>
                <tbody>
                {this.props.annotations.length === 0 ? 'No Annotations' :
                    this.props.annotations.map((a, idx) => {
                        let rowClass = '';
                        if (this.props.annotationsDiffStatus.newIds.has(a.annotationId)) {
                            rowClass = 'addedAnnotationRow';
                        } else if (this.props.annotationsDiffStatus.deletedIds.has(a.annotationId)) {
                            rowClass = 'deletedAnnotationRow';
                        } else if (this.props.annotationsDiffStatus.modifiedIds.has(a.annotationId)) {
                            rowClass = 'modifiedAnnotationRow';
                        }
                        return(
                        <tr className={rowClass}>
                            <td className={rowClass}><p style={{width: "100px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis"}}>{a.annotationId}</p></td>
                            <td className={rowClass}>
                                <OverlayTrigger trigger="click" delay={{ show: 250, hide: 400 }} overlay={<Tooltip id="button-tooltip">{a.phenotype.modId}</Tooltip>}>
                                    <span>{a.phenotype.value + ' ' + Object.entries(a.phenotype.options).map(([o, v]) => v ? '(' + o + ') ' : '').join('')}</span>
                                </OverlayTrigger>
                            </td>
                            <td className={rowClass}>
                                {a.gene !== '' ?
                                    <OverlayTrigger trigger="click" delay={{ show: 250, hide: 400 }} overlay={<Tooltip id="button-tooltip">{a.gene.modId}</Tooltip>}>
                                        <span>{a.gene.value}</span>
                                    </OverlayTrigger>
                                    : ''}
                            </td>
                            <td className={rowClass}>
                                {a.involved}
                            </td>
                            <td className={rowClass}>
                                {a.anatomyTerms.map(a =>
                                    <OverlayTrigger trigger="click" delay={{ show: 250, hide: 400 }} overlay={<Tooltip id="button-tooltip">{a.modId}</Tooltip>}>
                                        <span><Badge variant="primary">{a.value + ' ' + Object.entries(a.options).map(([o, v]) => v ? '(' + o + ') ' : '').join('')}</Badge>&nbsp;</span>
                                    </OverlayTrigger>)}
                            </td>
                            <td className={rowClass}>
                                <p dangerouslySetInnerHTML={{ __html: a.remarks.join('<br/><br/>')}}/>
                            </td>
                            <td className={rowClass}>
                                <p dangerouslySetInnerHTML={{ __html: a.noctuamodels.join('<br/><br/>')}}/>
                            </td>
                            <td className={rowClass}>
                                <p dangerouslySetInnerHTML={{ __html: a.genotypes.join('<br/><br/>')}}/>
                            </td>
                            <td className={rowClass}>
                                <p dangerouslySetInnerHTML={{ __html: a.authorstatements.join('<br/><br/>')}}/>
                            </td>
                            <td className={rowClass}>
                                {a.assay.value}
                            </td>
                            <td className={rowClass}>
                                {((date)=>date.getFullYear() + '/' + date.getMonth() + '/' + date.getDate() + ' ' + String(date.getHours()).padStart(2, "0") + ':' + String(date.getMinutes()).padStart(2, "0") + ':' + String(date.getSeconds()).padStart(2, "0"))(new Date(a.dateAssigned))}
                            </td>
                        </tr>)})}
                </tbody>
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