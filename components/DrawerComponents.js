import React from "react";
import {ScrollView, View, Text, Image, TouchableOpacity, Alert} from "react-native";
import {
    List,
    Card,
    Divider,
    DefaultTheme,
    Provider as PaperProvider
} from "react-native-paper";
import {SafeAreaView} from "react-navigation";
import Utils, {Styles} from './common'
import AsyncStorage from "@react-native-community/async-storage";
import Config from "./common/Config";
import Services from "./common/Services";
import MaterialCommunityIcons from "react-native-vector-icons/dist/MaterialCommunityIcons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import Entypo from "react-native-vector-icons/Entypo";


const theme = {
    ...DefaultTheme,
    fonts: {
        Regular: 'Muli-Regular'
    }
};


class DrawerComponents extends React.Component {

    constructor() {
        super();
        this.state = {active: "first", showUserLogButton: false,hideSupervisorRoleButtons:true,userRole:'',supervisorAccess:false};
    }

    componentDidMount() {
        const { navigation } = this.props;
        this.focusListener = navigation.addListener('didFocus', () => {
            // The screen is focused
            // Call any action
            // this.validateUserLog();
            this.checkUserRole();
            Services.checkMockLocationPermission((response) => {
                if (response){
                    this.props.navigation.navigate('Login')
                }
            })
        });
    }

    componentWillUnmount() {
        // Remove the event listener
        this.focusListener.remove();
    }

    checkUserRole() {
        AsyncStorage.getItem('Whizzard:userRole').then((userRole) => {
            let tempRole = JSON.parse(userRole);

             if (tempRole >= 27) {   //roles more than 27
                  this.setState({showUserLogButton: true,userRole:tempRole})
            } else {
                  this.setState({showUserLogButton: false,userRole:tempRole})
            }

            if (tempRole >=19 ) {   //roles more than 19
                this.setState({supervisorAccess: true})
            } else {
                this.setState({supervisorAccess: false})
            }
        })
    }

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
        const self = this;
        AsyncStorage.getItem('Whizzard:userId').then((userId) => {
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
            // console.log('inside', err)
        }, (msg) => {
            // console.log('outside', msg)
            Utils.setToken('locationStatus', JSON.stringify(msg), function () {
            });
        });
    }


    render() {
        const {userRole} = this.state;
        return (
            <PaperProvider theme={theme}>
                <View style={[Styles.flex1]}>
                    <SafeAreaView style={[Styles.flex1]}
                                  forceInset={{top: "always", horizontal: "never"}}>
                        <TouchableOpacity onPress={() => {
                            this.props.navigation.toggleDrawer();
                        }}>
                            <Card.Title title="Menu"
                                        style={{height:50}}
                                        titleStyle={{fontFamily: 'Muli-Regular', fontSize: 16, paddingLeft: 15}}
                                        left={() => <List.Icon icon="close" color={"#000"}/>}
                            />
                        </TouchableOpacity>
                        <Divider style={{height:0.5}}/>
                        <ScrollView style={[Styles.flex1]}>
                            <TouchableOpacity onPress={() => {
                                this.props.navigation.closeDrawer();
                                this.props.navigation.navigate('HomeScreen');
                            }}>
                                <Card.Title
                                    title="Home"
                                    style={{height:60}}
                                    titleStyle={{fontFamily: 'Muli-Regular', fontSize: 16, paddingLeft: 15}}
                                    left={() => <List.Icon icon="home" color={"#000"}/>}
                                />
                            </TouchableOpacity>
                            <Divider style={{height:0.5}}/>
                            {
                                this.state.showUserLogButton === true
                                    ?
                                    <TouchableOpacity onPress={() => {
                                        this.props.navigation.closeDrawer();
                                        this.props.navigation.navigate('UserLogHistory');
                                    }}>
                                        <Card.Title
                                            title="Log Attendance"
                                            style={{height:60}}
                                            titleStyle={{fontFamily: 'Muli-Regular', fontSize: 16, paddingLeft: 15}}
                                            left={() => <List.Icon icon="store-mall-directory" color={"#000"}/>}
                                            // right={() => <List.Icon icon="chevron-right" />}
                                        />
                                    </TouchableOpacity>
                                    :
                                    <TouchableOpacity onPress={() => {
                                        this.props.navigation.closeDrawer();
                                        // this.props.navigation.navigate('MyTrips')
                                        this.props.navigation.navigate('MyTrips', {shiftId:''})
                                    }}>
                                        <Card.Title
                                            title="My Trips"
                                            style={{height:60}}
                                            titleStyle={{fontFamily: 'Muli-Regular', fontSize: 16, paddingLeft: 15}}
                                            // left={() => <List.Icon icon="pin-drop" color={"#000"}/>}
                                            leftStyle={[{paddingLeft:20}]}
                                            left={() => <Entypo name="colours" size={20} color={"#000"} />}
                                            // right={() => <List.Icon icon="chevron-right" />}
                                        />
                                    </TouchableOpacity>
                            }
                            <Divider style={{height:0.5}}/>
                            <TouchableOpacity onPress={() => {
                                this.props.navigation.navigate('CalendarShifts',{userId:''});
                                this.props.navigation.closeDrawer();
                            }}>
                                <Card.Title
                                    title="Calendar Shifts"
                                    style={{height:60}}
                                    titleStyle={{fontFamily: 'Muli-Regular', fontSize: 16, paddingLeft: 15}}
                                    leftStyle={[{paddingLeft:20}]}
                                    left={() => <FontAwesome name="calendar" size={20} color={"#000" }/>}
                                />
                            </TouchableOpacity>
                            <Divider style={{height:0.5}}/>
                            <TouchableOpacity onPress={() => {
                                this.props.navigation.closeDrawer();
                                this.props.navigation.navigate('NewProfileScreen',
                                    {UserStatus: 'ACTIVATED', selectedProfileUserID: "",UserFlow: 'NORMAL',onFocusPendingItem:null})
                            }}>
                                <Card.Title
                                    title="Profile"
                                    style={{height:60}}
                                    titleStyle={{fontFamily: 'Muli-Regular', fontSize: 16, paddingLeft: 15}}
                                    left={() => <List.Icon icon="person" color={"#000"}/>}
                                    // right={() => <List.Icon icon="chevron-right" />}
                                />
                            </TouchableOpacity>
                            {
                                this.state.supervisorAccess === true
                                    ?
                                    <View>
                                        {/*<Divider style={{height:0.5}}/>*/}
                                        {/*<TouchableOpacity onPress={() => {*/}
                                        {/*    this.props.navigation.closeDrawer();*/}
                                        {/*    this.props.navigation.navigate('TripSummaryReport',{userId:''});*/}
                                        {/*}}>*/}
                                        {/*    <Card.Title*/}
                                        {/*        title="Trip Summary Report"*/}
                                        {/*        style={{height:60}}*/}
                                        {/*        titleStyle={{fontFamily: 'Muli-Regular', fontSize: 16, paddingLeft: 15}}*/}
                                        {/*        leftStyle={[{paddingLeft:20}]}*/}
                                        {/*        left={() => <FontAwesome name="file-text" size={20} color={"#000" }/>}*/}
                                        {/*    />*/}
                                        {/*</TouchableOpacity>*/}
                                        <Divider style={{height:0.5}}/>
                                        {
                                            // userRole >= 27
                                            userRole >= 30 || userRole === 27
                                            ?
                                                <TouchableOpacity onPress={() => {
                                                    this.props.navigation.closeDrawer();
                                                    this.props.navigation.navigate('ReimbursementExpenses');
                                                }}>
                                                    <Card.Title
                                                        // title="Reimbursement"
                                                        title="Add Expenses"
                                                        style={{height:60}}
                                                        titleStyle={{fontFamily: 'Muli-Regular', fontSize: 16, paddingLeft: 15}}
                                                        leftStyle={[{paddingLeft:20}]}
                                                        left={() => <FontAwesome name="address-card" size={22} color={"#000" }/>}
                                                    />
                                                </TouchableOpacity>
                                                :
                                                null
                                        }

                                        <Divider style={{height:0.5}}/>
                                        <TouchableOpacity onPress={() => {
                                            this.props.navigation.closeDrawer();
                                            this.props.navigation.navigate('PendingUsersScreen')
                                        }}>
                                            <Card.Title
                                                title="Pending Users"
                                                style={{height:60}}
                                                titleStyle={{fontFamily: 'Muli-Regular', fontSize: 16, paddingLeft: 15}}
                                                left={() => <List.Icon icon="accessibility" color={"#000"}/>}
                                                // right={() => <List.Icon icon="chevron-right" />}
                                            />
                                        </TouchableOpacity>
                                    </View>

                                    :
                                    <View>
                                        <Divider style={{height:0.5}}/>
                                        <TouchableOpacity onPress={() => {
                                            this.props.navigation.closeDrawer();
                                            this.props.navigation.navigate('MyPlans')
                                        }}>
                                            <Card.Title
                                                title="My Plans"
                                                style={{height:60}}
                                                titleStyle={{fontFamily: 'Muli-Regular', fontSize: 16, paddingLeft: 15}}
                                                left={() => <List.Icon icon="local-parking" color={"#000"}/>}
                                                // right={() => <List.Icon icon="chevron-right" />}
                                            />
                                        </TouchableOpacity>
                                    </View>
                            }

                            <Divider style={{height:0.5}}/>
                            <TouchableOpacity onPress={() => {
                                this.props.navigation.closeDrawer();
                                this.props.navigation.navigate('MyVouchers')
                            }}>
                                <Card.Title
                                    title="My Vouchers"
                                    style={{height:60}}
                                    titleStyle={{fontFamily: 'Muli-Regular', fontSize: 16, paddingLeft: 15}}
                                    left={() => <List.Icon icon="receipt" color={"#000"}/>}
                                    // right={() => <List.Icon icon="chevron-right" />}
                                />
                            </TouchableOpacity>

                            <Divider style={{height:0.5}}/>
                            <TouchableOpacity onPress={() => {
                                this.props.navigation.closeDrawer();
                                this.props.navigation.navigate('ReferAFriend');
                            }}>
                                <Card.Title
                                    title="Refer a Friend"
                                    style={{height:60}}
                                    titleStyle={{fontFamily: 'Muli-Regular', fontSize: 16, paddingLeft: 15}}
                                    left={() => <List.Icon icon="share" color={"#000"}/>}
                                    // right={() => <List.Icon icon="chevron-right" />}
                                />
                            </TouchableOpacity>
                            <Divider style={{height:0.5}}/>
                            <TouchableOpacity onPress={() => {
                                this.props.navigation.closeDrawer();
                                this.props.navigation.navigate('ReferredList');
                            }}>
                                <Card.Title
                                    title="Referred List"
                                    style={{height:60}}
                                    titleStyle={{fontFamily: 'Muli-Regular', fontSize: 16, paddingLeft: 15}}
                                    left={() => <List.Icon icon="list" color={"#000"}/>}
                                    // right={() => <List.Icon icon="chevron-right" />}
                                />
                            </TouchableOpacity>
                            <Divider style={{height:0.5}}/>
                            <TouchableOpacity onPress={() => {
                                this.props.navigation.closeDrawer();
                                this.props.navigation.navigate('Settings')
                            }}>
                                <Card.Title
                                    title="Settings"
                                    style={{height:60}}
                                    titleStyle={{fontFamily: 'Muli-Regular', fontSize: 16, paddingLeft: 15}}
                                    left={() => <List.Icon icon="settings" color={"#000"}/>}
                                    // right={() => <List.Icon icon="chevron-right" />}
                                />
                            </TouchableOpacity>
                            <Divider style={{height:0.5}}/>
                        </ScrollView>
                    </SafeAreaView>
                    <View style={[Styles.aslCenter, {marginBottom: 40, marginTop: 25}]}>
                        <Image style={[{height: 40, width: 200,}]}
                               source={require("../assets/images/whizzard-inverted.png")}/>
                        <View style={[{height: 40, width: 200,},Styles.mTop5,Styles.row]}>
                            <Text style={[Styles.ffMextrabold,Styles.f18,Styles.cDarkRed]}>MAHINDRA </Text>
                            <Text style={[Styles.ffMbold,Styles.f18,Styles.cAsh]}>Logistics</Text>
                        </View>
                               <View style={[Styles.row,Styles.jSpaceArd]}>
                                   <Text style={[Styles.ffMblack, {color:Services.returnServerBasedColor()}, Styles.alignCenter, Styles.aslCenter,Styles.mTop10]}>v.{Config.routes.APP_VERSION_NUMBER}</Text>
                                   <TouchableOpacity onPress={() => Alert.alert('Are you sure you want to logout?', alert,
                                       [{text: 'Cancel'}, {
                                           text: 'OK', onPress: () => {
                                               this.userLogout()
                                           }
                                       }]
                                   )}>
                                       <Text style={[Styles.f16,Styles.ffMbold,Styles.colorBlue,Styles.alignCenter, Styles.aslCenter,Styles.mTop10]}>Logout</Text>
                                   </TouchableOpacity>
                               </View>
                    </View>
                    {Services.returnAPKdate()}
                </View>
            </PaperProvider>
        );
    }
}


export default DrawerComponents;
