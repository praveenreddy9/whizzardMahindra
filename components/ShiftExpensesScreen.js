import React, {Component} from "react";
import {View, Text, StyleSheet, TextInput, Image, TouchableOpacity, ScrollView} from "react-native";
import {Appbar, Colors, DefaultTheme, Surface, Switch} from "react-native-paper";
import {CText, Styles} from "./common";
import OfflineNotice from './common/OfflineNotice';
import {Column as Col, Row} from "react-native-flexbox-grid";
import OneSignal from "react-native-onesignal";
import HomeScreen from "./HomeScreen";

const theme = {
    ...DefaultTheme,
    fonts: {
        medium: 'Muli-Regular'
    }
};

export class ShiftExpensesScreen extends Component {

    constructor(props) {
        super(props);
        this.props.navigation.addListener(
            'willBlur',() => {
                OneSignal.removeEventListener('received', HomeScreen.prototype.onReceived);
                OneSignal.removeEventListener('opened',HomeScreen.prototype.onOpened.bind(this));
            }
        );
        this.props.navigation.addListener(
            'didFocus',() => {
                OneSignal.addEventListener('received', HomeScreen.prototype.onReceived);
                OneSignal.addEventListener('opened',HomeScreen.prototype.onOpened.bind(this));
            }
        );
        this.state = {isSwitchOn: false};
    }

    render() {
        const {isSwitchOn} = this.state;
        return (
            <View style={styles.container}>
                <OfflineNotice/>
                <Appbar.Header theme={theme} style={styles.appbar}>
                    <Appbar.BackAction onPress={() => this.props.navigation.goBack()}/>
                    <Appbar.Content title="Shift Expenses List"/>
                </Appbar.Header>
                <View style={[Styles.aslCenter, Styles.marH30,Styles.marV15]}>
                    <Row size={12} style={[Styles.mBtm20]}>
                        <Col sm={5}>
                            <Text style={[Styles.f16, Styles.ffMregular, {textAlign:'right'}]}>Payment Hold</Text>
                        </Col>
                        <Col sm={1}></Col>
                        <Col sm={6}>
                            <Switch
                                value={isSwitchOn}
                                color='green'
                                onValueChange={() => {
                                    this.setState({isSwitchOn: !isSwitchOn});
                                }
                                }
                            />
                        </Col>
                    </Row>
                    <View style={[Styles.mBtm20]}><Text style={[Styles.ffMbold, Styles.f18]}>Expenses:</Text></View>
                    <Row size={12} style={[Styles.mBtm20]}>
                        <Col sm={5} style={[Styles.aslCenter]}>
                            <Text style={[Styles.f16, Styles.ffMregular, {textAlign:'right'}]}>Advance given:</Text>
                        </Col>
                        <Col sm={1}></Col>
                        <Col sm={6}>
                            <TextInput
                                style={[Styles.bw1, Styles.br5, {height:40}]}
                                keyboardType='numeric'
                                value={this.state.advanceGiven}
                                onChangeText={(advanceGiven) => {
                                    this.setState({advanceGiven: advanceGiven})
                                }}
                            />
                        </Col>
                    </Row>
                    <Row size={12} style={[Styles.mBtm20]}>
                        <Col sm={5} style={[Styles.aslCenter]}>
                            <Text style={[Styles.f16, Styles.ffMregular, {textAlign:'right'}]}>Toll:</Text>
                        </Col>
                        <Col sm={1}></Col>
                        <Col sm={6}>
                            <TextInput
                                style={[Styles.bw1, Styles.br5, {height:40}]}
                                keyboardType='numeric'
                                value={this.state.toll}
                                onChangeText={(toll) => {
                                    this.setState({toll: toll})
                                }}
                            />
                        </Col>
                    </Row>
                    <Row size={12} style={[Styles.mBtm20]}>
                        <Col sm={5} style={[Styles.aslCenter]}>
                            <Text style={[Styles.f16, Styles.ffMregular, {textAlign:'right'}]}>Labour Cost:</Text>
                        </Col>
                        <Col sm={1}></Col>
                        <Col sm={6}>
                            <TextInput
                                style={[Styles.bw1, Styles.br5, {height:40}]}
                                keyboardType='numeric'
                                value={this.state.labourCost}
                                onChangeText={(labourCost) => {
                                    this.setState({labourCost: labourCost})
                                }}
                            />
                        </Col>
                    </Row>
                    <View style={[Styles.mBtm20]}><Text style={[Styles.ffMbold, Styles.f18]}>Penalties:</Text></View>
                    <Row size={12} style={[Styles.mBtm20]}>
                        <Col sm={5} style={[Styles.aslCenter]}>
                            <Text style={[Styles.f16, Styles.ffMregular, {textAlign:'right'}]}>Other Penalty:</Text>
                        </Col>
                        <Col sm={1}></Col>
                        <Col sm={6}>
                            <TextInput
                                style={[Styles.bw1, Styles.br5, {height:40}]}
                                keyboardType='numeric'
                                value={this.state.otherPenalty}
                                onChangeText={(otherPenalty) => {
                                    this.setState({otherPenalty: otherPenalty})
                                }}
                            />
                        </Col>
                    </Row>
                    <Row size={12} style={[Styles.mBtm20]}>
                        <Col sm={5} style={[Styles.aslCenter]}>
                            <Text style={[Styles.f16, Styles.ffMregular, {textAlign:'right'}]}>Package Lost Penalty:</Text>
                        </Col>
                        <Col sm={1}></Col>
                        <Col sm={6}>
                            <TextInput
                                style={[Styles.bw1, Styles.br5, {height:40}]}
                                keyboardType='numeric'
                                value={this.state.plPenalty}
                                onChangeText={(plPenalty) => {
                                    this.setState({plPenalty: plPenalty})
                                }}
                            />
                        </Col>
                    </Row>
                    <TouchableOpacity
                        style={[Styles.mTop40,{backgroundColor:this.state.showLogin === false?'#cccccc': '#C91A1F'},Styles.bcRed,Styles.br5,]}>
                        <Text style={[Styles.f18,Styles.ffMbold,Styles.cWhite,Styles.padH10,Styles.padV10,Styles.aslCenter]}>Save</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }
}

export default ShiftExpensesScreen;

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
