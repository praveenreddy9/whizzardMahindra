import React, {Component} from 'react';
import {View, Text, StyleSheet, Share, TouchableOpacity, Dimensions, Image, Clipboard, ScrollView} from 'react-native';
import Utils from './common/Utils';
import Config from "./common/Config";
import {Appbar, DefaultTheme, Button} from "react-native-paper";
import {CSpinner, LoadImages, Styles} from "./common";
import OfflineNotice from './common/OfflineNotice';
import Services from "./common/Services";
import OneSignal from "react-native-onesignal";
import HomeScreen from "./HomeScreen";


const theme = {
    ...DefaultTheme,
    fonts: {
        medium: 'Muli-Bold'
    }
};


class ReferAFriend extends Component {
    static navigationOptions = {
        title: 'ReferAFriend',
    }

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
        this.state = {inviteCode: '', referralData: ''}
    }

    componentDidMount() {
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            Services.checkMockLocationPermission((response) => {
                if (response){
                    this.props.navigation.navigate('Login')
                }
            })
        })
        this.getReferalCode();
    }

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }


    //API CALL to get Referral Code
    getReferalCode = () => {
        const self = this;
        const referralURL = Config.routes.BASE_URL + Config.routes.GET_REFERRAL_CODE;
        const body = '';
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(referralURL, 'GET', body, function (response) {
                if (response.status === 200) {
                    let referralCode = response.data;
                    // console.log('Config.BASE_URL',Config.routes.BASE_URL);
                    let referralData;
                    {
                        Config.routes.BASE_URL === "http://testing.whizzard.in"
                        ?
                            referralData =  "http://testing.whizzard.in" + '/referAFriend.html?code=' + referralCode
                        :
                        referralData =  "https://admin.whizzard.in" + '/referAFriend.html?code=' + referralCode
                    }
                      // console.warn('referralData', referralData);
                    self.setState({spinnerBool: false, referralData: referralData})
                }
            }, function (error) {
                if (error.response) {
                    if (error.response.status === 403) {
                        self.setState({spinnerBool: false});
                        Utils.dialogBox("Token Expired,Please Login Again", '');
                        self.props.navigation.navigate('Login');
                    } else if (error.response.status === 500) {
                        self.setState({spinnerBool: false});
                        Utils.dialogBox(error.response.data.message, '');
                    } else if (error.response.status === 400) {
                        self.setState({spinnerBool: false});
                        Utils.dialogBox(error.response.data.message, '');
                    } else {
                        self.setState({spinnerBool: false});
                        Utils.dialogBox("Error loading getting refferal link, Please contact Administrator ", '');
                    }
                } else {
                    self.setState({spinnerBool: false});
                    Utils.dialogBox(error.message, '');
                }
            })
        });
    };

    ShareMessage = () => {
        //Here is the Share API
        Share.share({
            message: this.state.referralData.toString(),
            title: "Sharing via Whizzard"
        })
            //after successful share return result
            .then(result => console.log('referralData result', result))
            //If any thing goes wrong it comes here
            .catch(errorMsg => console.log('errorMsg', errorMsg));
    };

    copyInviteLink = async (data) => {
        await Clipboard.setString(data);
        Utils.dialogBox('Invite Link Copied!', '');
    };

    render() {
        return (
            <View style={Styles.flex1}>
                <OfflineNotice/>
                {this.renderSpinner()}
                <View style={[Styles.appbarBorder]}>
                    <Appbar.Header theme={theme} style={[Styles.bgWhite]}>
                        <Appbar.Action icon="chevron-left" size={30} onPress={() => {
                            this.props.navigation.goBack()
                        }}/>
                        <Appbar.Content title="Refer a friend" subtitle=""/>
                    </Appbar.Header>
                </View>
                <ScrollView style={[Styles.flex1, ]}>
                    <View style={[Styles.alignCenter, Styles.padV20]}>
                        <Text
                            style={[{fontFamily: 'Muli-Bold', paddingBottom: 15, textAlign: 'center'}, Styles.f18]}>
                            Refer your Friends and help {"\n"} to grow this community
                        </Text>
                    </View>
                    <View style={[Styles.aslCenter]}>
                        <Image source={LoadImages.referralImage} style={{height: 271, width:  Dimensions.get('window').width}}/>
                    </View>
                    <View style={[Styles.m20]}>
                        <View style={[Styles.row, Styles.jSpaceBet, Styles.mBtm10]}>
                            <Text style={[Styles.f18, {fontFamily: 'Muli-Bold'}]}>Invite Link</Text>
                            <TouchableOpacity onPress={()=>this.copyInviteLink(this.state.referralData)}>
                                <Text style={[Styles.f16, {
                                    fontFamily: 'Muli-Regular',
                                    paddingHorizontal: 13,
                                    paddingVertical: 5,
                                    borderWidth: 1,
                                    borderColor: '#ccc',
                                    borderRadius: 3
                                }]}>Copy</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.input}>
                            <Text
                                style={[styles.f25, styles.cBlk, {
                                    fontFamily: 'Muli-Regular',
                                }]}>{this.state.referralData}</Text>
                        </View>
                        <Button style={[Styles.aslCenter, Styles.defaultbgColor, Styles.mTop30]}
                                contentStyle={[Styles.padV5, Styles.padH30]}
                                mode="contained" onPress={() => this.ShareMessage()}>
                            Share
                        </Button>
                    </View>
                </ScrollView>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    input: {
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 3,
        textAlign: 'center',
        padding: 15,
    },
    text: {
        margin: 19,
        fontSize: 22,
    },
    image: {
        width: 400,
        height: 400,
    },
});
export default ReferAFriend;
