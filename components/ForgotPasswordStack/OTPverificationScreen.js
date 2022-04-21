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
import {CSpinner, CText, Styles} from '.././common';
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
export default class OTPverificationScreen extends React.Component {
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
        spinnerBool: false, KeyboardVisible: true,
        otp1: '', otp2: '', otp3: '', otp4: '', otp5: '', otp6: '', timer:300
    };

    componentDidMount() {
        this.otp1.focus();
        this.keyboardWillShowSub = Keyboard.addListener('keyboardDidShow', this.keyboardWillShow);
        this.keyboardWillHideSub = Keyboard.addListener('keyboardDidHide', this.keyboardWillHide);
        this.setState({'phoneNumber': this.props.navigation.state.params.phoneNumber}, function () {
            this.interval = setInterval(
                () => this.setState((prevState)=> ({ timer: prevState.timer - 1 })),
                1000
            );
        })
    }

    componentDidUpdate(){
        if(this.state.timer === 1){
            clearInterval(this.interval);
        }
    }

    componentWillUnmount() {
        clearInterval(this.interval);
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
            return <CSpinner/>;
        return false;
    }

    errorHandling(error) {
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

    resendOtp(){
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_SMS + '?' + 'phoneNumber' + '=' + self.state.phoneNumber;
        console.log("url", apiUrl);
        const body = JSON.stringify({});
        this.setState({ spinnerBool: true }, () => {
            Services.NoAuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response) {
                    // console.log('sadsad', response);
                    var data = response.data;
                    self.setState({spinnerBool: false,otp1: '', otp2: '', otp3: '', otp4: '', otp5: '', otp6: '',timer:300});
                    Utils.dialogBox(data.message, '');
                }
            },function (error) {
                self.errorHandling(error)
            });
        });
    }
    validateOTP() {
        const otp1 = this.state.otp1;
        const otp2 = this.state.otp2;
        const otp3 = this.state.otp3;
        const otp4 = this.state.otp4;
        const otp5 = this.state.otp5;
        const otp6 = this.state.otp6;
        let finalOTP = otp1 + otp2 + otp3 + otp4 + otp5 + otp6;
        if (finalOTP) {
            const self = this;
            const apiUrl = Config.routes.BASE_URL + Config.routes.OTP_VERIFICATION + '?' + 'phoneNumber' + '=' + self.state.phoneNumber + '&' + 'code' + '=' + finalOTP;
            const body = JSON.stringify({});
            this.setState({spinnerBool: true}, () => {
                Services.NoAuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                    if (response) {
                        self.setState({spinnerBool: false});
                        // console.log("OTP Verification", response)
                        self.props.navigation.navigate('ResetPassword', {
                            phoneNumber: self.state.phoneNumber,
                            code: finalOTP
                        })
                    }
                }, function (error) {
                    self.errorHandling(error)
                });
            });
        }else {
            Utils.dialogBox('please enter 6 digit OTP','');
        }
    }


    render() {
        return (
            <View style={[Styles.flex1, Styles.bgWhite]}>
                <OfflineNotice/>
                {this.renderSpinner()}
                <Appbar.Header style={[Styles.bgWhite]}>
                    <Appbar.Action icon="chevron-left" size={50}
                                   onPress={() => this.props.navigation.goBack()}/>
                </Appbar.Header>
                <ScrollView style={Styles.marH20}>
                <View style={[Styles.marV20]}>
                    <Text style={[Styles.colorBlue, Styles.f28, Styles.ffMregular]}>
                        Enter 6-digit,
                    </Text>
                    <Text style={[Styles.colorBlue, Styles.f25, Styles.ffMbold]}>
                        recovery code ?
                    </Text>
                    <Text style={[Styles.ffMregular, Styles.f18, Styles.colorBlue, Styles.marV10]}>The recovery code was
                        sent to your {"\n"}mobile number. Please enter the code</Text>
                </View>

                    <KeyboardAvoidingView style={{flex: 1}}>

                        <View style={[Styles.row, Styles.jSpaceArd, Styles.marV15]}>
                            <TextInput
                                style={[Styles.br5, Styles.bw1, Styles.bgWhite]}
                                theme={theme}
                                maxLength={1}
                                returnKeyType="next"
                                keyboardType='numeric'
                                blurOnSubmit={false}
                                ref={(input) => {
                                    this.otp1 = input;
                                }}
                                onSubmitEditing={() => {
                                    this.otp2.focus();
                                }}
                                onChangeText={(otp1) => this.setState({otp1}, () => {
                                    otp1 === '' ? null : this.otp2.focus()
                                })}
                                value={this.state.otp1}/>
                            <TextInput
                                style={[Styles.br5, Styles.bw1, Styles.bgWhite]}
                                maxLength={1}
                                theme={theme}
                                returnKeyType="next"
                                keyboardType='numeric'
                                blurOnSubmit={false}
                                ref={(input) => {
                                    this.otp2 = input;
                                }}
                                onSubmitEditing={() => {
                                    this.otp3.focus();
                                }}
                                onChangeText={(otp2) => this.setState({otp2}, () => {
                                    otp2 === '' ? null : this.otp3.focus()
                                })}
                                value={this.state.otp2}/>
                            <TextInput
                                style={[Styles.br5, Styles.bw1, Styles.bgWhite]}
                                maxLength={1}
                                returnKeyType="next"
                                keyboardType='numeric'
                                blurOnSubmit={false}
                                ref={(input) => {
                                    this.otp3 = input;
                                }}
                                onSubmitEditing={() => {
                                    this.otp4.focus();
                                }}
                                onChangeText={(otp3) => this.setState({otp3}, () => {
                                    otp3 === '' ? null : this.otp4.focus()
                                })}
                                value={this.state.otp3}/>
                            <TextInput
                                style={[Styles.br5, Styles.bw1, Styles.bgWhite]}
                                maxLength={1}
                                theme={theme}
                                returnKeyType="next"
                                keyboardType='numeric'
                                blurOnSubmit={false}
                                ref={(input) => {
                                    this.otp4 = input;
                                }}
                                onSubmitEditing={() => {
                                    this.otp5.focus();
                                }}
                                onChangeText={(otp4) => this.setState({otp4}, () => {
                                    otp4 === '' ? null : this.otp5.focus()
                                })}
                                value={this.state.otp4}/>
                            <TextInput
                                style={[Styles.br5, Styles.bw1, Styles.bgWhite]}
                                maxLength={1}
                                theme={theme}
                                returnKeyType="next"
                                keyboardType='numeric'
                                blurOnSubmit={false}
                                ref={(input) => {
                                    this.otp5 = input;
                                }}
                                onSubmitEditing={() => {
                                    this.otp6.focus();
                                }}
                                onChangeText={(otp5) => this.setState({otp5}, () => {
                                    otp5 === '' ? null : this.otp6.focus();
                                })}
                                value={this.state.otp5}/>
                            <TextInput
                                style={[Styles.br5, Styles.bw1, Styles.bgWhite]}
                                maxLength={1}
                                theme={theme}
                                returnKeyType="next"
                                keyboardType='numeric'
                                blurOnSubmit={false}
                                ref={(input) => {
                                    this.otp6 = input;
                                }}
                                onSubmitEditing={() => {
                                    Keyboard.dismiss()
                                }}
                                onChangeText={(otp6) => this.setState({otp6}, () => {
                                    otp6 === ' ' ? null : Keyboard.dismiss()
                                })}
                                value={this.state.otp6}/>
                        </View>

                    </KeyboardAvoidingView>

                    <View style={[Styles.marV10]}>
                        <Text style={[Styles.colorBlue, Styles.f18, Styles.ffMregular]}>
                            {'\u2022'} The OTP will be expired in {this.state.timer} sec,
                        </Text>
                        <View style={[Styles.row, Styles.padV10]}>
                            <Text style={[Styles.colorBlue, Styles.f18, Styles.ffMregular]}>
                                {'\u2022'} Didn't receive the code?
                            </Text>

                                <TouchableOpacity disabled={this.state.timer > 1} onPress={()=>this.resendOtp()}>
                                    <Text style={[ {color:this.state.timer > 1?'#b2beb5':'#36A84C'}, Styles.f18, Styles.ffMregular]}>{' '}Resend OTP</Text>
                                </TouchableOpacity>

                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => this.validateOTP()}
                        disabled={this.state.showButton === false}
                        style={[Styles.mTop40,Styles.mBtm10, Styles.bgDarkRed, Styles.bcRed, Styles.br5,]}>
                        <Text
                            style={[Styles.f18, Styles.ffMbold, Styles.cWhite, Styles.padH10, Styles.padV10, Styles.aslCenter]}>NEXT</Text>
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
