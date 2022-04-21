import React from 'react';
import {
    Text,
    View,
    Dimensions,
    Alert,
    Modal,
    Vibration,
    PermissionsAndroid
} from 'react-native';
import {CText, Styles, CSpinner} from '../common'
import Utils from '../common/Utils';
import Config from "../common/Config"
import Services from "../common/Services";
import {Appbar, Card, Button, DefaultTheme,} from "react-native-paper";
import FontAwesome from 'react-native-vector-icons/dist/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/dist/MaterialIcons';
import Geolocation from 'react-native-geolocation-service';
import QRCodeScanner from 'react-native-qrcode-scanner';
import HomeNoticeScreen from '../common/HomeNoticeScreen';
import RNAndroidLocationEnabler from "react-native-android-location-enabler";
import OneSignal from "react-native-onesignal";
import HomeScreen from "../HomeScreen";


const theme = {
    ...DefaultTheme,
    fonts: {
        medium: 'Muli-Regular'
    }
};

export default class ScanQRcode extends React.Component {

    constructor(properties) {
        super(properties);
        this.props.navigation.addListener(
            'didFocus', () => {
                OneSignal.addEventListener('received', HomeScreen.prototype.onReceived);
                OneSignal.addEventListener('opened', HomeScreen.prototype.onOpened.bind(this));
            }
        );
        this.props.navigation.addListener(
            'willBlur', () => {
                OneSignal.removeEventListener('received', HomeScreen.prototype.onReceived);
                OneSignal.removeEventListener('opened', HomeScreen.prototype.onOpened.bind(this));
            }
        );
        this.state = {
            spinnerBool: false,
            location: null,
            QRVisible: true,
            scannedDetailsModal: false,
            scannedData: null,
            InvalidQRscannedModal: false,
            latitude: null,
            longitude: null,
        };
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


    componentDidMount() {
        const self = this;
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            this.setState({
                orderId: self.props.navigation.state.params.orderData,
            })
            // Services.checkMockLocationPermission((response) => {
            //     if (response){
            //         this.props.navigation.navigate('Login')
            //     }
            // })
        })
    }

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    barcodeReceived(e) {
        const self = this;
        if (e) {
            if (e.data) {
                Vibration.vibrate();
                // console.log('scan data e', e);
                self.setState({
                    scannedData: e.data,
                    QRVisible: false
                }, () => {
                    self.validatingLocation();
                })
            } else {
                self.setState({QRVisible: false, InvalidQRscannedModal: true})
            }
        }
    }


    //API CALL for QR LOCATION and ALERT
    //Here Scanned data will be validated
    QR_Location = () => {
        let data = this.state.scannedData;
        // var numberFormat = /^[0-9]+$/;
        // var format = /[ !@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
        // if (numberFormat.test(data)) {
        //     this.setState({QRVisible: false, InvalidQRscannedModal: true})
        // } else {
            const self = this;
            const apiURL = Config.routes.BASE_URL + Config.routes.START_ORDER + '?id=' + data;
            const body = {"latitude": this.state.latitude, "longitude": this.state.longitude}
            // console.log('body', body)
            self.setState({spinnerBool: true}, () => {
                    Services.AuthHTTPRequest(apiURL, "PUT", body, function (response) {
                        if (response.status === 200) {
                            // console.log('start Order rep200====', response.data);
                            self.setState({spinnerBool: false, swipeActivated: false, selectedOrderList: []})
                            Utils.dialogBox('Order Started', '');
                            self.props.navigation.goBack();
                        } else {
                            self.setState({spinnerBool: false, QRVisible: false})
                        }
                    }, function (error) {
                        // console.log("err", error.response)
                        if (error.response) {
                            if (error.response.status === 403) {
                                self.setState({spinnerBool: false});
                                Utils.dialogBox("Token Expired,Please Login Again", '');
                                self.props.navigation.navigate('Login');
                            } else if (error.response.status === 500) {
                                self.setState({spinnerBool: false, QRVisible: false, InvalidQRscannedModal: true})
                                // Utils.dialogBox(error.response.data.message, '');
                            } else if (error.response.status === 400) {
                                self.setState({spinnerBool: false, QRVisible: true});
                                Utils.dialogBox(error.response.data.message, '');
                            } else if (error.response.status === 404) {
                                self.setState({spinnerBool: false, QRVisible: true});
                                Utils.dialogBox(error.response.data.error, '');
                            } else {
                                self.setState({spinnerBool: false, QRVisible: true});
                                Utils.dialogBox("Error loading Shift Data, Please contact Administrator ", '');
                            }
                        } else {
                            self.setState({spinnerBool: false, QRVisible: true});
                            Utils.dialogBox(error.message, '');
                        }
                    })
                }
            );
        // }
    };


    validatingLocation() {
        // console.log('Location validation', this.state.longitude, this.state.latitude, this.state.scannedData,  this.state.orderId.id)
        if (this.state.longitude === null && this.state.latitude === null) {
            Alert.alert('', 'Your Location data is missing, Please check your Location Settings',
                [{
                    text: 'enable', onPress: () => {
                        this.requestLocationPermission();
                    }
                }]);
        } else {
            if(this.state.scannedData === this.state.orderId.id) {
                this.QR_Location()
            }else{
                this.setState({QRVisible:true})
                Utils.dialogBox('Please scan proper bar code', '')
            }
        }
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
                this.requestCameraPermission();
                Geolocation.getCurrentPosition(
                    (position) => {
                        const currentLocation = position.coords;
                        this.setState({
                            currentLocation: currentLocation,
                            latitude: currentLocation.latitude,
                            longitude: currentLocation.longitude,
                        }, function () {
                            if (currentLocation.latitude === null && currentLocation.longitude === null) {
                                this.state.GPSasked === true
                                    ?
                                    Alert.alert('', 'Your Location data is missing, Please clear cache in GOOGLE MAPS',
                                        [{
                                            text: 'GO BACK', onPress: () => {
                                                this.props.navigation.goBack()
                                            }
                                        }])
                                    :
                                    Alert.alert('', 'Your Location data is missing, Please check your GPS  Settings',
                                        [
                                            {
                                                text: 'ASK GPS', onPress: () => {
                                                    this.checkGPSpermission();
                                                }
                                            },
                                            {
                                                text: 'GO BACK', onPress: () => {
                                                    this.props.navigation.goBack()
                                                }
                                            }
                                        ]
                                    )
                            } else if (this.state.swipeActivated === true && currentLocation.latitude && currentLocation.longitude) {
                                this.validatingLocation()
                            }
                        });
                    },
                    (error) => {
                        // console.log(error.code, error.message);
                        // console.log('start shift error perms lat long',this.state.latitude,this.state.longitude)
                        if (error.code === 2 && this.state.latitude === null && this.state.longitude === null) {
                            Alert.alert('', 'Your Location data is missing, Please check your GPS  Settings',
                                [
                                    {
                                        text: 'ASK GPS', onPress: () => {
                                            this.checkGPSpermission();
                                        }
                                    },
                                    {
                                        text: 'GO BACK', onPress: () => {
                                            this.props.navigation.goBack()
                                        }
                                    }
                                ]
                            )
                            // this.checkGPSpermission();
                        } else {
                            // console.log(error.code, error.message);
                            Utils.dialogBox(error.message, '')
                            this.props.navigation.goBack()
                        }
                    },
                    {enableHighAccuracy: false, timeout: 10000, maximumAge: 100000}
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

    checkGPSpermission() {
        RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({interval: 10000, fastInterval: 5000})
            .then(data => {
                // console.log('inside GPS check',data);
                // console.log('inside GPS check lat long',this.state.longitude,this.state.latitude);
                this.setState({GPSasked: true}, () => {
                    this.requestLocationPermission()
                })
            }).catch(err => {
            // console.log('error GPS check',err);
            // console.log('error code GPS check ',err.code);
            Utils.dialogBox('GPS permissions denied', '');
            this.props.navigation.goBack()
        });
    }


    render() {
        return (
            <View style={[Styles.flex1, Styles.bgWhite]}>
                <HomeNoticeScreen/>

                {/* MODAL FOR Scanned Detials Show(if our QR scans)*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.scannedDetailsModal}
                    onRequestClose={() => {
                    }}>
                    {/* onRequestClose={() => { this.setState({ scannedDetailsModal: false }) }}> */}
                    <View style={[Styles.modalfrontPosition]}>
                        <View
                            style={[Styles.bw1, Styles.bgLGrey, Styles.aslCenter, Styles.br10, {width: Dimensions.get('window').width - 70}]}>

                            <Card>
                                <Card.Content>
                                    <View style={[Styles.aslCenter, Styles.p5]}>
                                        <FontAwesome
                                            style={[Styles.aslCenter, Styles.marH15, {fontFamily: "Muli-Bold"}]}
                                            name="qrcode" size={50} color="#000"/>
                                        <CText
                                            cStyle={[Styles.cBlk, Styles.aslCenter, Styles.f18, {fontFamily: "Muli-Bold"}]}>Mark
                                            Attendance </CText>

                                        <CText
                                            cStyle={[Styles.cBlk, Styles.aslStart, Styles.f18, Styles.marV10, {fontFamily: "Muli-Bold"}]}>Site
                                            Name : {this.state.ScanResponseName}</CText>
                                        <CText
                                            cStyle={[Styles.cBlk, Styles.aslStart, Styles.f18, Styles.marV10, {fontFamily: "Muli-Bold"}]}>Site
                                            Code : {this.state.ScanResponseSiteCode || 'NA'}</CText>
                                        <CText
                                            cStyle={[Styles.cBlk, Styles.aslStart, Styles.f18, {fontFamily: "Muli-Bold"}]}>Address
                                            : {this.state.ScanResponseAddress} ?</CText>
                                    </View>
                                    <View>
                                        <Button
                                            style={[Styles.aslCenter, Styles.bgBlue, Styles.padH25, Styles.marV10]}
                                            mode="contained" onPress={() => {
                                            this.setState({
                                                scannedDetailsModal: false,
                                                QRVisible: true,
                                                QRstatus: 'scannedQR'
                                            }, () => {
                                                this.validatingLocation()
                                            })
                                        }}>
                                            OK
                                        </Button>
                                        <Button color={'#000'} style={[Styles.aslCenter]}
                                                onPress={() => {
                                                    this.props.navigation.goBack();
                                                    this.setState({
                                                        QRVisible: false,
                                                        scannedDetailsModal: false,
                                                        scannedData: ''
                                                    })
                                                }}>
                                            CANCEL
                                        </Button>
                                    </View>
                                </Card.Content>
                            </Card>
                        </View>
                    </View>
                </Modal>


                {/*Invalid QR Code Scanned*/}
                {/* MODAL FOR Invalid QR CODE SCANNED(other QR,alphabets) */}
                {/*InvalidQRscannedModal*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.InvalidQRscannedModal}
                    onRequestClose={() => {
                    }}>
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
                                            Invalid QR code scanned</CText>
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
                {this.renderSpinner()}

                <View style={[Styles.flex1, Styles.bgWhite]}>
                    <Appbar.Header theme={theme} style={[Styles.bgWhite]}>
                        <Appbar.BackAction onPress={() => this.props.navigation.goBack()}/>
                        <Appbar.Content theme={theme} title="Scan Bar Code"/>
                    </Appbar.Header>
                    <View style={[Styles.bgWhite]}>
                        <CText
                            cStyle={[Styles.f18, Styles.marH20, Styles.marV10, {fontFamily: "Muli-Regular"}]}>Scan
                            Barcode to Pickup Order </CText>
                        {/*<CText*/}
                        {/*    cStyle={[Styles.f18, Styles.marV5, {fontFamily: "Muli-Bold"}]}>{this.state.siteLocation}({this.state.siteCode})</CText></CText>*/}
                    </View>
                    {
                        this.state.QRVisible === true
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
            </View>
        );
    }
}
