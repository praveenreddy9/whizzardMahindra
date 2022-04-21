import React from 'react';
import {
    Text,
    View,
    Dimensions,
    Modal,
    Vibration,
    PermissionsAndroid, TextInput, TouchableOpacity
} from 'react-native';
import {CText, Styles, CSpinner} from '../common'
import Utils from '../common/Utils';
import {Appbar, Card, Button, DefaultTheme} from "react-native-paper";
import MaterialIcons from 'react-native-vector-icons/dist/MaterialIcons';
import QRCodeScanner from 'react-native-qrcode-scanner';
import OfflineNotice from '../common/OfflineNotice';
import Geolocation from "react-native-geolocation-service";
import Services from "../common/Services";

const theme = {
    ...DefaultTheme,
    fonts: {
        medium: 'Muli-Regular'
    }
};

export default class userQRcode extends React.Component {

    constructor(properties) {
        super(properties);
        this.state = {
            spinnerBool: false,
            QRVisible: true,
            scannedDetailsModal: false,
            InvalidQRscannedModal: false,
            skipScan:false
        };
    }

    async requestLocationPermission() {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                // {
                //     title: Services.returnLocationTitle(),
                //     message:Services.returnLocationMessage(),
                //     // buttonNeutral: "Ask Me Later",
                //     // buttonNegative: "Cancel",
                //     buttonPositive: "OK"
                // },
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                await this.requestCameraPermission();
                await Geolocation.getCurrentPosition(
                    (position) => {
                        const currentLocation = position.coords;
                        this.setState({
                            currentLocation: currentLocation,
                            latitude: currentLocation.latitude,
                            longitude: currentLocation.longitude,
                        }, function (data) {
                        });
                    },
                    (error) => {
                        console.log(error.code, error.message);
                    }
                );
            } else {
                Utils.dialogBox('Location permission denied', '');
                this.props.navigation.goBack();
            }
        } catch (err) {
            console.warn(err);
            Utils.dialogBox(err, '')
        }
    }



    async requestCameraPermission() {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.CAMERA,
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                this.setState({QRVisible: true, granted: granted})
            } else {
                Utils.dialogBox('Camera permission denied', '');
                this.props.navigation.goBack();
            }
        } catch (err) {
            Utils.dialogBox('err', '');
            console.warn(err);
        }
    }


    componentDidMount(): void {
        this.requestLocationPermission();
        const self = this;
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            self.setState({QRVisible: true})

        });
    }

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    barcodeReceived(e) {
        console.log("e", typeof (e.data))
        const self = this;

        if (e) {
            if (e.data && e.data != null)
                if(/^\d+$/.test(e.data)) {
                    Vibration.vibrate();
                    this.props.navigation.navigate('getUserHistory', {empId: e.data, location:this.state.currentLocation})
                    self.setState({QRVisible: false})
                }else{
                    self.setState({QRVisible: false, InvalidQRscannedModal: true})
            } else {
                self.setState({QRVisible: false, InvalidQRscannedModal: true})
            }
        }
    }

    validateInput(){
        let resp = {};
        let result = {};
        resp = Utils.isValidNumber(this.state.empId);
        if (resp.status === true) {
            result.empId = resp.message;
            this.setState({
                QRVisible: false,
                skipScan: false
            }, function () {
                this.props.navigation.navigate('getUserHistory', {empId: this.state.empId, location:this.state.currentLocation})
            })
        }else{
            Utils.dialogBox('Please enter a valid Emp Id', '')
        }
    }


    render() {
        return (
            <View style={[Styles.flex1, Styles.bgWhite]}>
                <OfflineNotice/>
                {/*InvalidQRscannedModal*/}
                <Modal
                    transparent={true}
                    visible={this.state.InvalidQRscannedModal}
                    onRequestClose={() => {
                    }}>
                    {/* onRequestClose={() => { this.setState({ InvalidQRscannedModal: false }) }}> */}
                    <View style={[Styles.modalfrontPosition]}>
                        <View
                            style={[Styles.bw1, Styles.bgLGrey, Styles.aslCenter, Styles.br10, {width: Dimensions.get('window').width - 70}]}>

                            <Card>
                                <Card.Content>
                                    <View>
                                        <MaterialIcons
                                            style={[Styles.aslCenter, {paddingRight: 10}]}
                                            name="cancel" size={50} color="red"/>
                                    </View>
                                    <View style={[Styles.aslCenter, Styles.p5]}>
                                        <CText
                                            cStyle={[Styles.cBlk, Styles.aslCenter, Styles.f18, {fontFamily: "Muli-Bold"}]}>
                                            Invalid QR code scanned, Please scan Swiggy User QR Code</CText>
                                    </View>
                                    <View>
                                        <Button
                                            style={[Styles.aslCenter, Styles.bgBlue, Styles.padH25, Styles.marV10]}
                                            mode="contained" onPress={() => {
                                            this.setState({
                                                QRVisible: true, InvalidQRscannedModal: false
                                            })
                                        }}>
                                            RETRY
                                        </Button>
                                        <Button color={'#000'} style={[Styles.aslCenter]}
                                                onPress={() => {
                                                    this.setState({
                                                        QRVisible: false,
                                                        InvalidQRscannedModal: false
                                                    }, () => {
                                                        // this.props.navigation.navigate('HomeScreen')
                                                        this.props.navigation.goBack()
                                                    })
                                                }}>
                                            Cancel
                                        </Button>
                                    </View>
                                </Card.Content>
                            </Card>
                        </View>
                    </View>
                </Modal>

                {/*Modal to Skip Scanning*/}
                <Modal
                    transparent={true}
                    visible={this.state.skipScan}
                    onRequestClose={() => {this.setState({skipScan:false})}}>
                    <View style={[Styles.modalfrontPosition]}>
                        <TouchableOpacity onPress={() => {
                            this.setState({skipScan: false, QRVisible:true})
                        }} style={[Styles.modalbgPosition]}>
                        </TouchableOpacity>
                        <View
                            style={[Styles.bw1, Styles.bgLGrey, Styles.aslCenter, Styles.br10, {width: Dimensions.get('window').width - 70}]}>

                            <Card>
                                <Card.Content>
                                    <View style={[Styles.aslCenter, Styles.mBtm5, Styles.marH10]}>
                                        <Text>Please enter Emp Id</Text>
                                    </View>
                                    <View style={[Styles.aslCenter, Styles.p5, Styles.mBtm10,{width:170}]}>
                                        <TextInput
                                            style={[Styles.bw1, Styles.p5, Styles.br5]}
                                        placeholder='Enter Emp Id'
                                        keyboardType='numeric'
                                        value={this.state.empId}
                                        onChangeText={(empId)=>this.setState({empId:empId})}/>
                                    </View>
                                    <View>
                                        <Button color='#fff'  style={[Styles.aslCenter, Styles.bgDarkRed, Styles.padH25, Styles.marV10]}
                                                onPress={() => {this.validateInput();}}>
                                            Submit
                                        </Button>
                                    </View>
                                </Card.Content>
                            </Card>
                        </View>
                    </View>
                </Modal>
                {this.renderSpinner()}
                {

                    this.state.granted && this.state.QRVisible === true
                        ?
                        <View style={[Styles.flex1, Styles.bgWhite]}>

                            <Appbar.Header theme={theme} style={[Styles.bgWhite]}>
                                <Appbar.BackAction onPress={() => this.props.navigation.goBack()}/>
                                <Appbar.Content theme={theme} title="Scan Swiggy User"/>
                                <Button mode="text"
                                        onPress={() => this.setState({skipScan:true, QRVisible:false})}>
                                    <Text style={{
                                        fontSize: 18,
                                        textAlign: 'right',
                                        fontWeight: 'bold',
                                        color: '#5220f0'
                                    }}>Skip</Text>
                                </Button>
                            </Appbar.Header>
                            {
                                this.state.granted && this.state.QRVisible === true
                                    ?
                                    <QRCodeScanner
                                        onRead={this.barcodeReceived.bind(this)}
                                        style={{flex: 1}}
                                        cameraStyle={{height: Dimensions.get('window').height}}
                                        showMarker={false}
                                        fadeIn={false}
                                        reactivate={true}
                                        cameraType={"back"}
                                    />
                                    :
                                    <View style={{backgroundColor: '#000', flex: 1}}>
                                        <Text>No QR CODE
                                        </Text>
                                    </View>
                            }
                        </View>
                            :
                            <CSpinner/>
                }
            </View>
        );
    }
}
