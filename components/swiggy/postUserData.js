import React, {Component} from "react";
import {View, Text, StyleSheet, TextInput, Image, TouchableOpacity, ScrollView} from "react-native";
import {Appbar, Colors, DefaultTheme, Surface, Switch} from "react-native-paper";
import {CSpinner, CText, Styles} from "../common";
import OfflineNotice from '../common/OfflineNotice';
import {Column as Col, Row} from "react-native-flexbox-grid";
import Utils from "../common/Utils";
import Config from "../common/Config";
import Services from "../common/Services";
import ImagePicker from "react-native-image-picker";

const theme = {
    ...DefaultTheme,
    fonts: {
        medium: 'Muli-Regular'
    }
};

const options = {
    title: 'Select Avatar',
    storageOptions: {
        skipBackup: true,
        path: 'images',
    },
    maxWidth: 1200, maxHeight: 800,
};

export class postUserData extends Component {
    constructor(props) {
        super(props);
        this.state = {
            spinnerBool: false,
            empId: '', empName: '', faceMasksCount: '0', sanitizerCount: '0', grandTotal: '0',
            longitude: null, latitude: null
        };
    }

    componentDidMount(): void {
        const self = this;
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            self.setState({
                empId: self.props.navigation.state.params.empId,
                location: self.props.navigation.state.params.location
            })
        })
    }

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    httpPostData(result) {
        const self = this;
        const apiurl = Config.routes.BASE_URL + Config.routes.POST_SWIGGY_USER_WITH_FILE +
            '?empId=' + result.empId +
            '&empName=' + result.empName +
            '&faceMasksCount=' + result.faceMasksCount
            + '&sanitizerCount=' + result.sanitizerCount
            + '&latitude=' + this.state.location.latitude
            + '&longitude=' + this.state.location.longitude;
        const body = this.state.formData;
        self.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiurl, "POST", body, function (response) {
                if (response.data) {
                    const data = response.data;
                    self.setState({result: data, spinnerBool: false});
                    Utils.dialogBox('Data uploaded Successfuly', '')
                    self.props.navigation.navigate('getUserHistory')
                }
            }, function (error) {
                console.log('service img error', error)
                if (error.response) {
                    if (error.response.status === 403) {
                        self.setState({spinnerBool: false}, () => {
                            Utils.dialogBox("Token Expired,Please Login Again", '');
                            self.props.navigation.navigate('Login');
                        })
                    } else if (error.response.status === 500) {
                        self.setState({spinnerBool: false}, () => {
                            Utils.dialogBox(error.response.data.message, '');
                        })
                    } else if (error.response.status === 400) {
                        self.setState({spinnerBool: false}, () => {
                            Utils.dialogBox(error.response.data.message, '');
                        })
                    } else if (error.response.status === 413) {
                        self.setState({spinnerBool: false}, () => {
                            Utils.dialogBox('Request Entity Too Large', '');
                        })
                    } else {
                        self.setState({spinnerBool: false}, () => {
                            Utils.dialogBox("Image Not Uploaded..!", '');
                        })
                    }
                } else {
                    self.setState({spinnerBool: false}, () => {
                        Utils.dialogBox(error.message, '');
                    })

                }
            })
        })
    }

    validateFields() {
        const self = this;
        let resp = {};
        this
        let result = {empId: this.state.empId};
        resp = Utils.isValidName(this.state.empName);
        if (resp.status === true) {
            result.empName = resp.message;
            resp = Utils.isValidNumber(this.state.faceMasksCount);
            if (resp.status === true) {
                result.faceMasksCount = resp.message;
                resp = Utils.isValidNumber(this.state.sanitizerCount);
                if (resp.status === true) {
                    result.sanitizerCount = resp.message;
                    if (this.state.formData) {
                        {
                            this.httpPostData(result)
                        }
                    } else {
                        Utils.dialogBox('Please Upload Image', '')
                    }
                } else {
                    Utils.dialogBox('Please enter Sanitizers Count', '')
                }
            } else {
                Utils.dialogBox('Please enter Face Masks Count', '')
            }
        } else {
            Utils.dialogBox(resp.message, '')
        }
    }

    uploadImage() {
        ImagePicker.showImagePicker(options, (response) => {
            this.setState({fileName: response.fileName})
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            } else if (response.customButton) {
                console.log('User tapped custom button: ', response.customButton);
            } else if (response.fileSize > 2000000) {
                console.log('pic resposne 2000000', response.fileSize);
                Utils.dialogBox('Image Size should be less than 2 MB', '');
            } else {
                const self = this;
                let formData = new FormData();
                formData.append('files', {
                    uri: response.uri,
                    type: response.type,
                    name: response.fileName
                });
                console.log(' postImages imagas formData', formData)
                self.setState({formData: formData})
            }
        })
    }


    render() {
        return (
            <View style={styles.container}>
                <OfflineNotice/>
                <Appbar.Header theme={theme} style={styles.appbar}>
                    <Appbar.BackAction onPress={() => this.props.navigation.goBack()}/>
                    <Appbar.Content title="Add Entry"/>
                </Appbar.Header>
                {this.renderSpinner()}
                <View style={[Styles.aslCenter, Styles.marH30, Styles.marV15]}>
                    <Row size={12} style={[Styles.mBtm20]}>
                        <Col sm={5} style={[Styles.aslCenter]}>
                            <Text style={[Styles.f16, Styles.ffMregular, {textAlign: 'right'}]}>Employee Id*</Text>
                        </Col>
                        <Col sm={1}></Col>
                        <Col sm={6}>
                            <TextInput
                                style={[Styles.bw1, Styles.br5, Styles.p5, {height: 40}]}
                                keyboardType='numeric'
                                value={this.state.empId}
                                editable={false}
                            />
                        </Col>
                    </Row>
                    <Row size={12} style={[Styles.mBtm20]}>
                        <Col sm={5} style={[Styles.aslCenter]}>
                            <Text style={[Styles.f16, Styles.ffMregular, {textAlign: 'right'}]}>Employee Name*</Text>
                        </Col>
                        <Col sm={1}></Col>
                        <Col sm={6}>
                            <TextInput
                                style={[Styles.bw1, Styles.br5, Styles.p5, Styles.p5, {height: 40}]}
                                keyboardType='default'
                                placeholder='enter emp name'
                                onChangeText={(empName) => {
                                    this.setState({empName: empName})
                                }}
                            />
                        </Col>
                    </Row>
                    <Row size={12} style={[Styles.mBtm20]}>
                        <Col sm={5} style={[Styles.aslCenter]}>
                            <Text style={[Styles.f16, Styles.ffMregular, {textAlign: 'right'}]}>Facemasks Count*</Text>
                        </Col>
                        <Col sm={1}></Col>
                        <Col sm={6}>
                            <TextInput
                                style={[Styles.bw1, Styles.br5, Styles.p5, {height: 40}]}
                                keyboardType='numeric'
                                value={this.state.faceMasksCount}
                                onChangeText={(faceMasksCount) => {
                                    this.setState({faceMasksCount: faceMasksCount})
                                }}
                            />
                        </Col>
                    </Row>
                    <Row size={12} style={[Styles.mBtm20]}>
                        <Col sm={5} style={[Styles.aslCenter]}>
                            <Text style={[Styles.f16, Styles.ffMregular, {textAlign: 'right'}]}>Sanitizers Count*</Text>
                        </Col>
                        <Col sm={1}></Col>
                        <Col sm={6}>
                            <TextInput
                                style={[Styles.bw1, Styles.br5, Styles.p5, {height: 40}]}
                                keyboardType='numeric'
                                value={this.state.sanitizerCount}
                                onChangeText={(sanitizerCount) => {
                                    this.setState({sanitizerCount: sanitizerCount})
                                }}
                            />
                        </Col>
                    </Row>
                    <Row size={12} style={[Styles.mBtm20]}>
                        <Col sm={5} style={[Styles.aslCenter]}>
                            <Text style={[Styles.f16, Styles.ffMregular, {textAlign: 'right'}]}>Grand Total*</Text>
                        </Col>
                        <Col sm={1}></Col>
                        <Col sm={6}>
                            <Text>{this.state.faceMasksCount || this.state.sanitizerCount ? parseInt(this.state.faceMasksCount) + parseInt(this.state.sanitizerCount) : null}</Text>
                        </Col>
                    </Row>
                    <Row size={12} style={[Styles.mBtm20]}>
                        <Col sm={5} style={[Styles.aslCenter]}>
                            <Text style={[Styles.f16, Styles.ffMregular, {textAlign: 'right'}]}>Image Upload:</Text>
                        </Col>
                        <Col sm={1}></Col>
                        <Col sm={6}>
                            <TouchableOpacity onPress={() => this.uploadImage()}>
                                <Text
                                    style={[Styles.p10, Styles.bgAshW, Styles.br5]}>{this.state.fileName ? this.state.fileName : 'Pic Upload'}</Text>
                            </TouchableOpacity>
                        </Col>
                    </Row>

                    <TouchableOpacity
                        onPress={() => this.validateFields()}
                        style={[Styles.mTop40, {backgroundColor: this.state.showLogin === false ? '#cccccc' : '#C91A1F'}, Styles.bcRed, Styles.br5,]}>
                        <Text
                            style={[Styles.f18, Styles.ffMbold, Styles.cWhite, Styles.padH10, Styles.padV10, Styles.aslCenter]}>Save</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }
}

export default postUserData;

const styles = StyleSheet.create({
    appbar: {
        backgroundColor: "white"
    },
    section: {
        backgroundColor: "white"
    },
    container: {
        flex: 1,
        backgroundColor: "#fff"
    },
    time: {
        marginTop: 20,
        marginRight: 10
    },
    item: {
        borderBottomColor: Colors.grey200,
        borderBottomWidth: 1
    }
});
