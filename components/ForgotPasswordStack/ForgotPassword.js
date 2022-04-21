import React from "react";
import {
    StyleSheet,
    Text,
    View,
    Image,
    Dimensions,
    TouchableOpacity,
    KeyboardAvoidingView, ScrollView, FlatList, Modal, Keyboard
} from 'react-native';
import Utils from ".././common/Utils";
import Config from ".././common/Config";
import { CSpinner, CText, Styles } from '.././common';
import Icon from 'react-native-vector-icons/dist/MaterialIcons';
import Services from '.././common/Services';
import OfflineNotice from '.././common/OfflineNotice';
import {TextInput, Button, DefaultTheme, Surface, Appbar} from "react-native-paper";
import MaterialIcons from "react-native-vector-icons/dist/MaterialIcons";
import OneSignal from "react-native-onesignal";
import LoginScreen from "../LoginScreen";
const theme = {
    ...DefaultTheme,
    fonts: {
        ...DefaultTheme.fonts,
        regular: 'Muli-Regular',
    },
    colors: {
        ...DefaultTheme.colors,
        text: '#233167',
        primary: '#233167', underlineColor: 'transparent'
    }
};
export default class ForgotPassword extends React.Component {

    constructor(props) {
        super(props)
        this.props.navigation.addListener(
            'willBlur',() => {
                OneSignal.removeEventListener('received', LoginScreen.prototype.onReceived);
                OneSignal.removeEventListener('opened',LoginScreen.prototype.onOpened.bind(this));
            }
        );
        this.props.navigation.addListener(
            'didFocus',() => {
                OneSignal.addEventListener('received', LoginScreen.prototype.onReceived);
                OneSignal.addEventListener('opened',LoginScreen.prototype.onOpened.bind(this));
            }
        );
        this.keyboardWillShow = this.keyboardWillShow.bind(this)
        this.keyboardWillHide = this.keyboardWillHide.bind(this)
    }
    state = {
        phoneNumber: "",
        spinnerBool: false, KeyboardVisible: true,
        isValidphoneNumber: null,
        errorphoneNumber: null,showButton:false,
     };

    componentDidMount() {
        this.keyboardWillShowSub = Keyboard.addListener('keyboardDidShow', this.keyboardWillShow)
        this.keyboardWillHideSub = Keyboard.addListener('keyboardDidHide', this.keyboardWillHide)
    }

    componentWillUnmount() {
        this.keyboardWillShowSub.remove()
        this.keyboardWillHideSub.remove()
    }

    keyboardWillShow = event => {
        this.setState({
            KeyboardVisible: false
        })
    }
    keyboardWillHide = event => {
        this.setState({
            KeyboardVisible: true
        })
    }
    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner />;
        return false;
    }

    ValidateForgotPassword() {
        const self = this;
        let resp = {};
        let result = {};
        resp = Utils.isValidMobileNumber(this.state.phoneNumber);
        if (resp.status === true) {
            result.phoneNumber = resp.message;
            this.setState({isValidphoneNumber: true, errorphoneNumber: '',showButton:true});
            Keyboard.dismiss()

        } else {
            // Utils.dialogBox(resp.message, '')
            this.phoneNumber.focus();
            this.setState({isValidphoneNumber: false, errorphoneNumber: resp.message,showButton:false});
        }
    }

    requestForgotPassword(){
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_SMS + '?' + 'phoneNumber' + '=' + self.state.phoneNumber;
        const body = {};
        this.setState({ spinnerBool: true }, () => {
            Services.NoAuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response) {
                    self.setState({spinnerBool: false});
                    // console.log('res', response);
                    var data = response.data;
                    Utils.dialogBox(data.message, '');
                    self.props.navigation.navigate('OTPverificationScreen', { phoneNumber: self.state.phoneNumber });
                }
            },function (error) {
                if (error.response) {
                    // console.log('errorr', error, error.response)
                    if (error.response.status === 403) {
                        self.setState({spinnerBool: false});
                        Utils.dialogBox("Token Expired,Please Login Again", '');
                        this.props.navigation.navigate('Login');
                    } else if (error.response.status === 500) {
                        self.setState({spinnerBool: false});
                        Utils.dialogBox(error.response.data.message, '');
                    } else if (error.response.status === 400) {
                        self.setState({spinnerBool: false});
                        Utils.dialogBox(error.response.data.message, '');
                    } else {
                        self.setState({spinnerBool: false});
                        Utils.dialogBox("Error loading Shift Data, Please contact Administrator ", '');
                    }
                } else {
                    self.setState({spinnerBool: false});
                    Utils.dialogBox(error.message, '');
                }
            });
        });
    }
    render() {
        return (
            <View style={[Styles.flex1,Styles.bgWhite]}>
                <OfflineNotice/>
                {this.renderSpinner()}
                <Appbar.Header style={[Styles.bgWhite]}>
                    <Appbar.Action icon="chevron-left" size={50}
                                   onPress={() => this.props.navigation.goBack()}/>
                </Appbar.Header>
                <ScrollView style={[Styles.marH20]}>
                <View style={[Styles.marV20]}>
                    <Text style={[Styles.colorBlue, Styles.f30, Styles.ffMbold]}>
                        Forgot,
                    </Text>
                    <Text style={[Styles.colorBlue, Styles.f28, Styles.ffMregular]}>
                        Your Password ?
                    </Text>
                    <Text style={[Styles.ffMregular,Styles.f18,Styles.colorBlue,Styles.marV10]}>Please enter your phone number below,{"\n"}
                        we will send verification code to your {"\n"}registered phone number.
                    </Text>
                </View>
                     <KeyboardAvoidingView style={[Styles.flex1]} >

                        <View >
                            <TextInput label='Mobile Number*'
                                       theme={theme}
                                       maxLength={10}
                                       mode='outlined'
                                       returnKeyType="next"
                                       blurOnSubmit={false}
                                       keyboardType='numeric'
                                       ref={(input) => {
                                           this.phoneNumber = input;
                                       }}
                                       onSubmitEditing={() => {Keyboard.dismiss(),this.ValidateForgotPassword();}}
                                       onChangeText={(phoneNumber) => this.setState({phoneNumber},()=>{this.ValidateForgotPassword()})}
                                       value={this.state.phoneNumber}/>
                            {
                                this.state.errorphoneNumber ?
                                    <Text style={{
                                        color: 'red',
                                        fontFamily: 'Muli-Regular',
                                        paddingLeft: 20, marginBottom: 10
                                    }}>{this.state.errorphoneNumber}</Text>
                                    :
                                    <Text/>
                            }
                            {
                                this.state.isValidphoneNumber === true ?
                                    Services.successIcon()
                                    :
                                    this.state.isValidphoneNumber === false ?
                                        Services.errorIcon()
                                        : null
                            }
                        </View>
                    </KeyboardAvoidingView>

                    <TouchableOpacity
                         onPress={() => this.requestForgotPassword()}
                         disabled={this.state.showButton === false}
                        style={[Styles.mTop40,Styles.mBtm10,{backgroundColor:this.state.showButton === false?'#cccccc': '#C91A1F'},Styles.bcRed,Styles.br5,]}>
                        <Text style={[Styles.f18,Styles.ffMbold,Styles.cWhite,Styles.padH10,Styles.padV10,Styles.aslCenter]}>NEXT</Text>
                    </TouchableOpacity>

                 </ScrollView>
            </View>
        );
    };
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        textAlign: 'center',
        backgroundColor: '#140a25',
        color: 'red',
    },
    input: {
        height: 40,
        backgroundColor: 'rgba(225,225,225,0.2)',
        marginBottom: 20,
        padding: 10,
        color: '#fff',
        fontFamily: 'Muli-Regular'
    },
    submitButton: {
        backgroundColor: '#f3cc14',
        marginTop: 40,
        height: 40,
    },
    submitButtonText: {
        color: '#000',
        textAlign: 'center',
        fontSize: 20,
        lineHeight: 40,
        fontFamily: 'Muli-Bold'
    },
    proceedButton: {
        backgroundColor: '#f3cc14',
        marginTop: 10,
        // height: 30,
    },
    proceedButtonText: {
        color: '#000',
        textAlign: 'center',
        fontSize: 15,
        lineHeight: 20,
        fontFamily: 'Muli-Bold'
    }
});
