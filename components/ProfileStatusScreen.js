import React, {Component} from "react";
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity, Alert, BackHandler, Modal, Linking, FlatList, ScrollView
} from "react-native";
import AsyncStorage from '@react-native-community/async-storage';
import {Card, DefaultTheme, List} from "react-native-paper";
import {CText, LoadImages, LoadSVG, Styles} from "./common";
import MaterialIcons from 'react-native-vector-icons/dist/MaterialIcons';
import OfflineNotice from './common/OfflineNotice';
import {CDismissButton} from "./common/CDismissButton";
import FontAwesome from "react-native-vector-icons/dist/FontAwesome";
import OneSignal from "react-native-onesignal";
import HomeScreen from "./HomeScreen";
import LoginScreen from "./LoginScreen";
import Config from "./common/Config";
import Services from "./common/Services";
import Utils from "./common/Utils";


const theme = {
    ...DefaultTheme,
    fonts: {
        medium: 'Muli-Regular'
    }
};
export default class ProfileStatusScreen extends Component {

    constructor(props) {
        super(props);
        this.props.navigation.addListener(
            'willBlur', () => {
                OneSignal.removeEventListener('received', LoginScreen.prototype.onReceived);
                OneSignal.removeEventListener('opened', LoginScreen.prototype.onOpened.bind(this));
            }
        );
        this.props.navigation.addListener(
            'didFocus', () => {
                OneSignal.addEventListener('received', LoginScreen.prototype.onReceived);
                OneSignal.addEventListener('opened', LoginScreen.prototype.onOpened.bind(this));
            }
        );
        this.state = {listPopUp: false, pendingFields: []}
        this.didFocus = props.navigation.addListener('didFocus', payload =>
            BackHandler.addEventListener('hardwareBackPress', this.onBack)
        );
    }

    componentDidMount() {
        this.willBlur = this.props.navigation.addListener('willBlur', payload =>
            BackHandler.removeEventListener('hardwareBackPress', this.onBack)
        );
        const self = this;
        // this._subscribe = this.props.navigation.addListener('didFocus', () => {
        //     self.setState({pendingFields: this.props.navigation.state.params.pendingFields}, () => {
        //         {
        //             self.state.pendingFields.length > 0
        //                 ?
        //                 self.setState({listPopUp: true})
        //                 :
        //                 self.setState({listPopUp: false})
        //         }
        //     })
        // });

    }

    onBack = () => {
        return BackHandler.exitApp();
    };

    componentWillUnmount() {
        this.didFocus.remove();
        this.willBlur.remove();
        BackHandler.removeEventListener('hardwareBackPress', this.onBack);
    }

    logout() {
        AsyncStorage.clear();
        // this.props.navigation.navigate('authNavigator');
        this.props.navigation.navigate('Login');
    }

    errorHandling(error) {
        // console.log("profile status screen error", error, error.response);
        const self = this;
        if (error.response) {
            if (error.response.status === 403) {
                self.setState({spinnerBool: false});
                Utils.dialogBox("Token Expired,Please Login Again", '');
                self.props.navigation.navigate('Login');
            } else if (error.response.status === 500) {
                self.setState({spinnerBool: false});
                if (error.response.data.message) {
                    Utils.dialogBox(error.response.data.message, '');
                } else {
                    Utils.dialogBox(error.response.data[0], '');
                }
            } else if (error.response.status === 400) {
                self.setState({spinnerBool: false});
                if (error.response.data.message) {
                    Utils.dialogBox(error.response.data.message, '');
                } else {
                    Utils.dialogBox(error.response.data[0], '');
                }
            } else if (error.response.status === 413) {
                self.setState({spinnerBool: false}, () => {
                    Utils.dialogBox('Request Entity Too Large', '');
                })
            } else if (error.response.status === 404) {
                self.setState({spinnerBool: false}, () => {
                    Utils.dialogBox(error.response.data.error, '');
                })
            } else {
                self.setState({spinnerBool: false});
                Utils.dialogBox("Error loading Shift Data, Please contact Administrator ", '');
            }
        } else {
            self.setState({spinnerBool: false});
            Utils.dialogBox(error.message, '');
        }
    }

    //API CALL TO GET PROFILE MISSING FIELDS
    getMissingFields() {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_PROFILE_MISSING_FIELDS;
        const body = {};
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response) {
                    // var data = response.data;
                    // console.log('profile resp 200', response.data);
                    self.setState({ spinnerBool: false,listPopUp:true,pendingFields:response.data})
                }
            }, function (error) {
                // console.log('missing fields error', error, error.response);
                self.errorHandling(error)
            });
        });
    }



    render() {
        const {pendingFields} = this.state
        return (
            <View style={[Styles.flex1, {backgroundColor: '#140a25',}]}>
                <OfflineNotice/>
                <TouchableOpacity onPress={() => Alert.alert('Are you sure you want to logout?', alert,
                    [{text: 'Cancel'}, {
                        text: 'OK', onPress: () => {
                            this.logout();
                        }
                    }]
                )}>
                    <Text style={[{
                        fontSize: 20,
                        color: '#fff',
                        margin: 10,
                        marginTop: 30,
                        textAlign: 'right'
                    }, Styles.jEnd]}>Logout</Text></TouchableOpacity>
                <View style={[Styles.flex1, {
                    backgroundColor: '#140a25',
                    justifyContent: 'center',
                    alignSelf: 'center',
                    textAlign: 'center'
                }]}>

                    <View style={[Styles.padH10]}>
                        <MaterialIcons style={{textAlign: 'center'}} name="block" size={100} color="red"/>
                        <CText
                            cStyle={[Styles.f22, Styles.cWhite, Styles.marV5, Styles.txtAlignCen, {fontFamily: 'Muli-Regular'}]}>Your
                            registration needs to be approved by Supervisor. </CText>
                        <CText cStyle={[Styles.f22, Styles.cWhite, Styles.txtAlignCen, {fontFamily: 'Muli-Regular'}]}>Please,
                            update your
                            profile</CText>
                    </View>

                    <View style={[Styles.aslCenter, Styles.mTop40]}>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            style={[Styles.bgLYellow, Styles.alignCenter, Styles.br5,Styles.width150]}
                                           onPress={() => this.props.navigation.navigate('NewProfileScreen', {
                                              UserStatus: 'PENDING',
                                              UserFlow: 'PENDING',
                                              UserID: " ",
                                              selectedProfileUserID: '',
                                              onFocusPendingItem:null
                                          })}>
                            <Text style={[Styles.cBlk, Styles.ffMregular, Styles.f18, Styles.p5, Styles.padV10]}>Update
                                Profile</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[Styles.aslCenter, Styles.mTop40]}>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            style={[Styles.alignCenter]}
                                          onPress={() => this.getMissingFields()}>
                            <Text style={[Styles.colorOrangeYellow, Styles.ffMregular, Styles.f16, {
                                borderBottomWidth: 1,
                                borderBottomColor: '#fff'
                            }]}>Click to see the pending list</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.listPopUp}
                    onRequestClose={() => {
                        this.setState({listPopUp: false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View
                            style={[Styles.bw1, Styles.bgWhite, Styles.p15, {width: Dimensions.get('window').width - 50}]}>

                            <View style={[Styles.aslCenter, Styles.p5, Styles.row]}>
                                <CText
                                    cStyle={[Styles.cRed, Styles.aslCenter, Styles.f16, Styles.ffMbold]}>Pending Items
                                    ({pendingFields.length})</CText>
                            </View>

                            <View style={{borderBottomWidth: 1, borderBottomColor: '#b2beb5', marginVertical: 5,}}>
                            </View>

                            <ScrollView
                                showsVerticalScrollIndicator={true}
                                style={[Styles.aslCenter, {height: Dimensions.get('window').height / (pendingFields.length === 0 ? 2.5 : 2)}]}>
                                {
                                    pendingFields.length > 0
                                        ?
                                        <FlatList
                                            data={pendingFields}
                                            renderItem={({item}) => (  <TouchableOpacity
                                                disabled={true}
                                             style={[Styles.aslCenter, Styles.bw1, Styles.bcAsh, Styles.p10, Styles.marV5, {width: Dimensions.get('window').width - 95}]}>
                                                <Text
                                                    style={[Styles.f14, Styles.ffMbold, Styles.aslCenter, Styles.colorBlue]}>{item}</Text>
                                            </TouchableOpacity>)}
                                            keyExtractor={(item, index) => index.toString()}
                                        />
                                        :
                                        <Text
                                            style={[Styles.f18, Styles.ffMbold, Styles.aslCenter, Styles.pTop20, Styles.colorBlue]}>No
                                            Pending Fields</Text>
                                }
                            </ScrollView>

                        </View>
                        <TouchableOpacity style={{marginTop: 20}} onPress={() => {
                            this.setState({listPopUp: false})
                        }}>
                            {LoadSVG.cancelIcon}
                        </TouchableOpacity>
                    </View>
                </Modal>

            </View>
        );
    }
}

const styles = StyleSheet.create({
    appbar: {
        backgroundColor: "white"
    },
    container: {
        flex: 1,
        alignItems: "center"
    }
});
