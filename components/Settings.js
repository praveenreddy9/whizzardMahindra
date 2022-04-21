import * as React from "react";
import {View, StyleSheet, Alert, NativeModules, Linking, Text, TouchableOpacity, BackHandler} from "react-native";
import {Appbar, List, Divider, DefaultTheme, Provider as PaperProvider} from "react-native-paper";
import Icon from 'react-native-vector-icons/dist/MaterialIcons';
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import AsyncStorage from '@react-native-community/async-storage';
import OfflineNotice from './common/OfflineNotice';
import Utils from "./common/Utils";
import Config from "./common/Config";
import Services from "./common/Services";
import OneSignal from "react-native-onesignal";
import HomeScreen from "./HomeScreen";
import {Styles} from "./common";
import axios from "axios";

var LocationService = NativeModules.LocationService; //LOCATIONS SERIVCES CALL


const theme = {
    ...DefaultTheme,
    fonts: {
        medium: 'Muli-Bold'
    }
};

export default class Settings extends React.Component {

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
        this.state={
            showPolicy:false,showTerms:false
        }
    }

    componentDidMount() {
        const self = this;
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            Services.checkMockLocationPermission((response) => {
                if (response){
                    this.props.navigation.navigate('Login')
                }
            })
        });
    }

    // componentWillUnmount() {
    //     this.didFocus.remove();
    // }

    errorHandling(error) {
        // console.log("screen error", error, error.response);
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

    userLogout() {
        // console.log('welcome userLogout');
        const self = this;
        AsyncStorage.getItem('Whizzard:userId').then((userId) => {
            // console.log('CurrentuserId before parse', userId,typeof(userId));
            // console.log('userId settings', userId);
                const logoutURL = Config.routes.BASE_URL + Config.routes.LOGOUT_MOBILE;
                const body = {userId: userId};
                // console.log('logout body', body);
                this.setState({spinnerBool: true}, () => {
                    Services.AuthHTTPRequest(logoutURL, 'PUT', body, function (response) {
                        if (response.status === 200) {
                            // console.log("logoutURL resp 200", response);
                            self.setState({spinnerBool: false})
                            self.removeToken();
                        }
                    }, function (error) {
                        self.errorHandling(error)
                    })
                })
            });
    };


    async removeToken() {
        this.stopLocation()
        try {
            await AsyncStorage.removeItem("Whizzard:token");
            await AsyncStorage.removeItem("Whizzard:userId");
            await AsyncStorage.removeItem("Whizzard:shiftId");
            await AsyncStorage.removeItem("Whizzard:currentShiftStatus");
            await AsyncStorage.removeItem("Whizzard:locationStatus");
            await AsyncStorage.removeItem("Whizzard:userRole");
            await AsyncStorage.removeItem("Whizzard:userStatus");   //===>for canEditTextput check in profile
            await AsyncStorage.removeItem("Whizzard:selectedUserSiteDetails");   //===>TeamListing
            await AsyncStorage.removeItem("Whizzard:selectedSiteDetails"); //===>sitelisting
            await AsyncStorage.removeItem("Whizzard:profilePicUrl");       //===>profilePicUrl Authnav
            // this.props.navigation.navigate('authNavigator');
            this.props.navigation.navigate('Login')
            return true;
        } catch (exception) {
            return false;
        }
    }


    //STOP LOCATION
    async stopLocation() {
        // console.warn('stopLocation SETTINGS');
        await LocationService.stopLocation((err) => {
            console.log('inside', err)
        }, (msg) => {
            console.log('outside', msg)
            Utils.setToken('locationStatus', JSON.stringify(msg), function () {
            });
        });
    }

    render() {
        return (
            <View style={styles.container}>
                <OfflineNotice/>
                <Appbar.Header theme={theme} style={styles.appbar}>
                    <Appbar.Action icon="menu" size={30} onPress={() => {
                        this.props.navigation.openDrawer();
                    }}/>
                    <Appbar.Content title="Settings"/>
                    <Appbar.Action
                        icon={() => (
                            <Icon
                                name="forum"
                                size={28}
                                color="black"
                            />
                        )}
                    />
                </Appbar.Header>
                <List.Section style={styles.section}>
                    <List.Item theme={theme}
                               title="Language (English)"
                               titleStyle={{fontFamily: 'Muli-Regular'}}
                               left={() => <List.Icon icon="language"/>}
                               right={() => <List.Icon icon="chevron-right"/>}
                    />
                    <Divider/>
                    <List.Item theme={theme}
                               title="FAQs"
                               titleStyle={{fontFamily: 'Muli-Regular'}}
                               left={() => <List.Icon icon="help"/>}
                               right={() => <List.Icon icon="chevron-right"/>}
                               onPress={() => this.props.navigation.navigate("Faqs")}
                    />
                    <Divider/>

                    <List.Item
                        title="Terms of use"
                        titleStyle={{fontFamily: 'Muli-Regular'}}
                        left={() => <List.Icon icon="assignment"/>}
                        right={() => <List.Icon icon={this.state.showTerms ? "keyboard-arrow-down":"chevron-right"}/>}
                        // onPress={() => Linking.openURL(`https://docs.google.com/document/d/e/2PACX-1vQOmqz0IMPq5e4b5Nv36CXcaDuqWLym8kOpLIHvm45H4o7XV4A0OxYO96I-C2knR4TI4AUFJp_MXSdD/pub`)}
                        onPress={() =>this.setState({showTerms:!this.state.showTerms,showPolicy:false})}
                    />
                    {
                        this.state.showTerms
                            ?
                            <View style={[Styles.padH10,Styles.pBtm5]}>
                                <Text style={[Styles.f14,Styles.cBlk,Styles.ffMregular]}>Whizzard ("Website" or "Whizzard.in") is owned by Zipzap Logistics Private Limited. ('Whizzard' or 'we' or 'us'). In using the Whizzard.in service, you are deemed to have accepted the Terms and Conditions of the agreement listed below or as may be revised from time to time, which is, for an indefinite period and you understand and agree that you are bound by such terms till the time you access this website. We reserve the right to change these terms & conditions from time to time without any obligation to inform you and it is your responsibility to look through them as often as possible.</Text>
                                <TouchableOpacity activeOpacity={0.6}
                                                  onPress={() => {
                                                      // this.setState({showPolicy: !this.state.showPolicy})
                                                      Linking.openURL('https://whizzard.in/terms')
                                                      // Linking.openURL('https://docs.google.com/document/d/1tOv7x7VKCVqk10vgeQaAbZV9q_VkIYEBnFlQIu1mKnQ/edit?usp=sharing')
                                                  }}
                                                  style={[ {width:100},  Styles.m5, ]}>
                                    <Text
                                        style={[Styles.ffMbold,Styles.colorOrangeYellow]}>READ MORE</Text>
                                </TouchableOpacity>
                            </View>
                            :
                            null
                    }
                    <Divider/>

                    <List.Item
                        title="Privacy policy"
                        titleStyle={{fontFamily: 'Muli-Regular'}}
                        left={() => <List.Icon icon="security"/>}
                        right={() => <List.Icon icon={this.state.showPolicy ? "keyboard-arrow-down":"chevron-right"}/>}
                        // onPress={() => Linking.openURL(`https://docs.google.com/document/d/e/2PACX-1vQOmqz0IMPq5e4b5Nv36CXcaDuqWLym8kOpLIHvm45H4o7XV4A0OxYO96I-C2knR4TI4AUFJp_MXSdD/pub`)}
                        // onPress={() =>this.props.navigation.navigate('Privacy')}
                        onPress={() =>this.setState({showPolicy:!this.state.showPolicy,showTerms:false})}
                    />
                    {
                        this.state.showPolicy
                        ?
                            <View style={[Styles.padH10,Styles.pBtm5]}>
                                <Text style={[Styles.f14,Styles.cBlk,Styles.ffMregular]}>We at Zipzap Logistics Private Limited (“Whizzard”) consider customer trust as our top priority. We deliver services to millions of customers across the country. Our customers trust us with some of their most sensitive information. This policy informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Services and the choices you have associated with that data.</Text>
                                <TouchableOpacity activeOpacity={0.6}
                                                  onPress={() => {
                                                      // this.setState({showPolicy: !this.state.showPolicy})
                                                      // Linking.openURL('https://whizzard.in/privacypolicy')
                                                      Linking.openURL('https://privacy.whizzard.in/')
                                                      // Linking.openURL('https://docs.google.com/document/d/1E6u2zH8ebvDzBMUxNY5Rh8YmxtXjGvG8pJV7enQyBRc/edit?usp=sharing')
                                                  }}
                                                  style={[ {width:100},  Styles.marV5, ]}>
                                    <Text
                                        style={[Styles.ffMbold,Styles.colorOrangeYellow]}>READ MORE</Text>
                                </TouchableOpacity>
                            </View>
                            :
                            null
                    }
                    <Divider/>

                    <List.Item theme={theme}
                               onPress={() => Alert.alert('Are you sure you want to logout?', alert,
                                   [{text: 'Cancel'}, {
                                       text: 'OK', onPress: () => {
                                           this.userLogout()
                                       }
                                   }]
                               )}
                               title="Logout"
                               titleStyle={{fontFamily: 'Muli-Regular'}}
                               left={() => <List.Icon icon="exit-to-app"/>}
                        // right={() => <List.Icon icon="chevron-right" />}
                    />
                    <Divider/>
                </List.Section>
            </View>
        );
    }
};

const styles = StyleSheet.create({
    appbar: {
        backgroundColor: "white"
    },
    section: {
        backgroundColor: "white",
        fontFamily: 'Muli-Regular',
        fontSize: 30
    },
    container: {
        flex: 1,
        backgroundColor: "#f1f5f4"
    }
});
