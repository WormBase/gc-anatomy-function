import React from 'react';
import GraphicalCuration from "@wormbase/graphical-curation";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import {getAnnotations, getError, isLoading} from "./redux/selectors";
import {connect} from "react-redux";
import {loadPaper} from "./redux/actions";


class Main extends React.Component {
    constructor(props, context) {
        super(props, context);
        this.state = {
            paperId: undefined
        }
    }

    render() {
        return(
            <Container fluid>
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
                        <Button variant="light" onClick={() => {this.props.loadPaper(this.state.paperId)}}>Load
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
                        {this.props.annotations.length > 0 ?
                        <GraphicalCuration error={this.props.error} showExpressionCuration={false} showPhenotypeCuration={false}
                                           anatomyFunctionAnnotations={this.props.annotations}
                                           annotationsSaved={annotations => {alert('Annotations saved')}}
                                           loading={this.props.isLoading}
                        />
                        : ''}
                    </Col>
                </Row>

            </Container>
        );
    }
}

const mapStateToProps = state => ({
    annotations: getAnnotations(state),
    isLoading: isLoading(state),
    error: getError(state)
});

export default connect(mapStateToProps, {loadPaper})(Main);