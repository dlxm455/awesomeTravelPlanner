import React from 'react';
import {
    Form, Row, Col, Input, Button, Icon, message
} from 'antd';
import {API_ROOT, GOOGLE_GEOCODE_API, PLACE_API_K} from "../constants";

class AdvancedSearchForm extends React.Component {
    startPoints=[];
    testingStartPoints = [
        {placeID: "ChIJgzD7uFVYwokavdeEdvGu-wA", type: "start", lat: 40.7829, lon: -73.9654, name: "aa", imageURL: "", day:0, intradayIndex: 0},
        {placeID: "ChIJgzcdsFVYwokRXCoEdvGu-aA", type: "start", lat: 40.7829, lon: -73.9654, name: "bb", imageURL: "", day:1, intradayIndex: 0},
        {placeID: "ChIJgzD7uFfdskRXCoEdvGud-dv", type: "start", lat: 40.7829, lon: -73.9654, name: "cc", imageURL: "", day:2, intradayIndex: 0},
    ];
    generatedPoints=[];
    // To generate mock Form.Item

    state = {
        expand: false,
    };

    getFields() {
        const count = this.state.expand ? this.props.totalDays : 1;
        const { getFieldDecorator } = this.props.form;
        const children = [];
        for (let i = 0; i < this.props.totalDays; i++) {
            children.push(
                <Col span={24} key={i} style={{ display: i < count ? 'block' : 'none' }}>
                    <Form.Item label={`Day ${i + 1} Start Address`}>
                        {getFieldDecorator(`day_${i}`, {
                            initialValue:"370 Canal St, New York, NY 10013",

                            rules: [{
                                required: i == 0 ? true : false,
                                message: i == 0 ? 'Must fill in start place address for at least one day' : null
                            }],
                        })(
                            <div>
                            <Input placeholder={"370 Canal St, New York, NY 10013"}/>
                            </div>
                        )}
                    </Form.Item>
                </Col>
            );
        }
        return children;
    }

    handleSearch = (e) => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            //console.log("generate paths button pressed");
            //console.log('Received values of form: ', values);
            const endPoint = 'GeneratePaths';
            Promise.all(
                Object.entries(values).map((entry) =>
                    fetch(`${GOOGLE_GEOCODE_API}?address=${encodeURI(entry[1])}&key=${PLACE_API_K}`)
                    .then((response) => {
                        if (response.ok) {
                            return response.json();
                        }
                    }).then((data) => {
                        //console.log(data);
                        this.startPoints.push({
                        placeID: data['results'][0]['place_id'],
                        type: "start",
                        lat: data['results'][0]['geometry']['location']['lat'],
                        lon: data['results'][0]['geometry']['location']['lng'],
                        name: "",
                        imageURL: "",
                        day: entry[0],
                        intradayIndex: 0 })
                    }).catch(err => message.error(`${entry[0]} address is not valid`))
                )
            )
            .then((data)=> {
                fetch(`${API_ROOT}/${endPoint}`, {
                    method: 'POST',
                    body: JSON.stringify({"userID": this.props.userID, "startPlaces": this.startPoints}),
                    headers: {
                        'Constent-Type': 'application/json'
                    }
                }).then((response) => {
                    if (response.ok) {
                        return response.json();
                    }
                }).then((data) => {
                    this.generatedPoints = data.places;
                    this.props.onGeneratePathsButtonPressed(this.generatedPoints);
                }).catch((e) => {
                    console.log(e.message);
                })
            });
            // bypass Google Geocoding api for testing
            /*fetch(`${API_ROOT}/${endPoint}`, {
                method: 'POST',
                body: JSON.stringify({"userID": this.props.userID, "startPlaces": this.testingStartPoints}),
                headers: {
                    'Constent-Type': 'application/json'
                }
            }).then((response) => {
                if (response.ok) {
                    return response.json();
                }
            }).then((data) => {
                this.generatedPoints = data.places;
                this.props.onGeneratePathsButtonPressed(this.generatedPoints);
            }).catch((e) => {
                console.log(e.message);
            })*/
            //this.props.onGeneratePathsButtonPressed(this.generatedPoints); // for testing
        });
    }

    handleReset = () => {
        this.props.form.resetFields();
    }

    toggle = () => {
        const { expand } = this.state;
        this.setState({ expand: !expand });
    }

    render() {
        return (
            <Form
                className="ant-advanced-search-form"
                onSubmit={this.handleSearch}
            >
                <Row gutter={16}>{this.getFields()}</Row>
                <Row>
                    <Col span={8} style={{ textAlign: 'right' }}>
                        <Button type="primary" htmlType="submit">GeneratePaths</Button>
                        <Button style={{ marginLeft: 8 }} onClick={this.handleReset}>
                            Clear
                        </Button>
                        <a style={{ marginLeft: 8, fontSize: 12 }} onClick={this.toggle}>
                            Collapse <Icon type={this.state.expand ? 'up' : 'down'} />
                        </a>
                    </Col>
                </Row>
            </Form>
        );
    }
}

export const StartAddressInputForm = Form.create({ name: 'advanced_search' })(AdvancedSearchForm);