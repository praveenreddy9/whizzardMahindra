import React, {Component} from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Image, Dimensions, BackHandler, Modal, Button, TextInput, Alert,
    NativeModules,
    PermissionsAndroid, Linking, Vibration,
} from "react-native";
import {Appbar, Colors, DefaultTheme, Card} from "react-native-paper";
import Config from "./common/Config";
import Services from "./common/Services";
import Utils from "./common/Utils";
import {Styles, LoadSVG, LoadImages, CSpinner} from "./common";
import AsyncStorage from "@react-native-community/async-storage";
import OfflineNotice from './common/OfflineNotice';
import MaterialIcons from "react-native-vector-icons/dist/MaterialIcons";
import Entypo from "react-native-vector-icons/dist/Entypo";
import OneSignal from "react-native-onesignal";
import HomeScreen from "./HomeScreen";
import Geolocation from "react-native-geolocation-service";
import RNAndroidLocationEnabler from "react-native-android-location-enabler";


const theme = {
    ...DefaultTheme,
    fonts: {
        medium: 'Muli-Regular'
    }
};

const ImageURL = "https://images-for-push-notifications.s3.ap-south-1.amazonaws.com/republic_mobile-push.png"
const windowWidth = Dimensions.get('window').width;

export class Notifications extends Component {

    constructor(props) {
        super(props);
        // this.requestLocationPermission()
        this.props.navigation.addListener(
            'willBlur', () => {
                OneSignal.removeEventListener('received', HomeScreen.prototype.onReceived);
                OneSignal.removeEventListener('opened', HomeScreen.prototype.onOpened.bind(this));
            }
        );
        this.props.navigation.addListener(
            'didFocus', () => {
                OneSignal.addEventListener('received', HomeScreen.prototype.onReceived);
                OneSignal.addEventListener('opened', HomeScreen.prototype.onOpened.bind(this));
            }
        );
        BackHandler.addEventListener('hardwareBackPress', this.onBack)
        this.state = {
            userActivitiesInfo: [],
            page: 1,
            spinnerBool: false,
            size: 10,
            isLoading: false,
            isRefreshing: false,
            notificationImage: '',
            showBirthdayCard: false,
            showButtons: false,
            userAttendanceModal: false, errorRejectReason: null, rejectReason: '', notificationData: '',
            // latitude: null,
            // longitude: null,
            GPSasked: false,
            swipeActivated: false,showOrderDetailsModal:false,
        };
    }

    onBack = () => {
         AsyncStorage.getItem('Whizzard:token').then((token) => {
             if (token) {
                if (this.state.notificationImage) {
                    this.setState({notificationImage:'',notificationData:''},()=>{
                        this.props.navigation.navigate('authNavigator');
                    })
                } else {
                    this.setState({notificationImage:'',notificationData:''},()=>{
                        this.props.navigation.navigate('HomeScreen');
                    })
                }
            } else {
                this.props.navigation.navigate('Login');
            }
        }).catch((error)=>{
            return this.props.navigation.navigate('authNavigator')
        });
    };


    async getItem() {
        return await AsyncStorage.getItem('Whizzard:token');
    }

    componentDidMount() {
        // this.willBlur = this.props.navigation.addListener('willBlur', payload =>
        //     BackHandler.removeEventListener('hardwareBackPress', this.onBack)
        // );
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            // Services.checkMockLocationPermission((response) => {
            //     if (response) {
            //         this.props.navigation.navigate('Login')
            //     }
            // })
        // })
        this.requestLocationPermission();
        // AsyncStorage.getItem('Whizzard:userId').then((userId) => {
             const notificationImage = this.props.navigation.state.params.notificationImage
            const notificationData = this.props.navigation.state.params.notificationData
            this.setState({notificationImage: notificationImage, notificationData: notificationData})
            {
                notificationImage
                    ?
                    notificationImage === 'SHIFT_ATTENDANCE_NOTIFICATION'
                            ?
                            this.setState({userAttendanceModal: true, selectedActivity: notificationData}) : null
                    :
                    null
            }
            this.userNotifications();
        })
    }


    // componentWillUnmount() {
    //     this.didFocus.remove();
    //     this.willBlur.remove();
    //     BackHandler.removeEventListener('hardwareBackPress', this.onBack());
    // }

    componentWillUnmount() { // C
        // Linking.removeEventListener('url', this.handleOpenURL);
        OneSignal.removeEventListener('received', HomeScreen.prototype.onReceived);
        OneSignal.removeEventListener('opened', HomeScreen.prototype.onOpened.bind(this));
        OneSignal.removeEventListener('ids', HomeScreen.prototype.onIds);
        this.setState({notificationImage:''})
    }

    errorHandling(error) {
        // console.log("Notifications screen error", error, error.response);
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

    async requestLocationPermission() {
        // this.getCurrentLocation()
         try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                Geolocation.getCurrentPosition(
                    (position) => {
                        const currentLocation = position.coords;
                        this.setState({
                            currentLocation: currentLocation,
                            latitude: currentLocation.latitude,
                            longitude: currentLocation.longitude,
                        }, ()=> {
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
                        } else {
                            Utils.dialogBox(error.message, '')
                            this.props.navigation.goBack()
                        }
                    },
                    {enableHighAccuracy: true, timeout: 20000, maximumAge: 10000}
                );
            } else {
                Utils.dialogBox('Location permission denied', '');
                this.props.navigation.goBack();
            }
        } catch (err) {
            Utils.dialogBox(err, '')
        }
    }

    checkGPSpermission() {
        RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({interval: 10000, fastInterval: 5000})
            .then(data => {
                this.setState({GPSasked: true}, () => {
                    this.requestLocationPermission()
                })
            }).catch(err => {
            Utils.dialogBox('GPS permissions denied', '');
            this.props.navigation.goBack()
        });
    }

    validatingLocation() {
        if (this.state.longitude && this.state.latitude) {
            if (this.state.swipeActivated) {
                this.pickUpNotificationOrder()
            }
        } else {
            Alert.alert('', 'Your Location data is missing,Please check your Location Settings',
                [{
                    text: 'enable', onPress: () => {
                        this.requestLocationPermission();
                    }
                }]);
        }
    }

    pickUpNotificationOrder() {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.PICKUP_ORDER_NOTIFICATION_BASED;
        const body = {
            id:self.state.selectedActivity.orderId,
            userId :self.state.loggedUserId,
            latitude:self.state.latitude,
            longitude:self.state.longitude,
            status:self.state.selectedButton
        };
         this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'POST', body, function (response) {
                if (response.status === 200) {
                    Vibration.vibrate()
                     self.setState({
                        swipeActivated:false,
                        spinnerBool: false, showOrderDetailsModal: false, page: 1,
                        notificationImage: '', notificationData: '', userActivitiesInfo: []
                    }, () => {
                         self.state.selectedButton === 'REJECT'
                         ?
                             Utils.dialogBox('Order Rejected Successfully','')
                         :
                        Utils.dialogBox('Order Accepted Successfully','')
                        self.userNotifications();
                    })
                }
            }, function (error) {
                 self.errorHandling(error);
            })
        })
    };


    userAttendanceUpdate(type, shiftId, reason) {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.USER_ATTENDANCE_UPDATE + '?status=' + type + '&shiftId=' + shiftId + '&reason=' + reason;
        const body = {};
         this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'PUT', body, function (response) {
                if (response.status === 200) {
                     self.setState({
                        spinnerBool: false, userAttendanceModal: false, page: 1,
                        notificationImage: '', notificationData: '', userActivitiesInfo: []
                    }, () => {
                        self.userNotifications();
                    })

                }
            }, function (error) {
                 self.errorHandling(error);
            })
        })
    };

    userNotifications() {
        const {userActivitiesInfo, page} = this.state;
        this.setState({isLoading: true});
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.USER_NOTIFICATIONS;
        const body = {
            page: self.state.page,
            sort: "name,desc",
            size: 10
        };
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'POST', body, function (response) {
                if (response.status === 200) {
                    // console.log("user Notifications resp200", response.data.content);
                    self.setState({
                        userActivitiesInfo: page === 1 ? response.data.content : [...userActivitiesInfo, ...response.data.content],
                        totalPages: response.data.totalPages,
                        isRefreshing: false,
                        spinnerBool: false,
                        swipeActivated:false
                    })
                }
            }, function (error) {
                 self.errorHandling(error);
            })
        })
    };


    notificationList(item) {
        let Activity = item;
         return (
            <Card style={[Styles.bgWhite, styles.shadow,
                Activity.type === "NOT_MARKED_AT_SITE" || Activity.type === "NOT_ENDED_AT_SITE"
                    ?
                    {borderColor: "#FF4500"}
                    :
                    !Activity.accepted && (Activity.type === "ORDER_PICKUP" || Activity.type === "ATTENDANCE_PERMISSION") ? {borderColor: "#94ff66"}
                        :
                        Activity.type === "BIRTHDAY_WISHES" || Activity.type === "OCCASIONAL" ? {borderColor: "#94ff66"}
                            :
                            {
                                borderLeftColor: '#000',
                                borderRightColor: '#2B575757',
                                borderTopColor: '#2B575757',
                                borderBottomColor: '#2B575757'
                            },
                {
                    marginBottom: 15,
                    padding: 5,
                    borderWidth: 1,
                    borderLeftWidth: 3,
                    // height: 70
                }]}>
                <View
                    style={[Styles.flex1]}>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        style={[Styles.row, Styles.flex1]}
                        onPress={() => {
                            Activity.type === "ATTENDANCE_PERMISSION" && Activity.attrs.attendanceStatus === null
                                ?
                                this.setState({
                                    userAttendanceModal: true,
                                    selectedActivity: Activity,
                                    rejectReason: '',
                                    showRejectText: false,
                                    errorRejectReason: null
                                })
                                :
                                Activity.type === "NOT_MARKED_AT_SITE" || Activity.type === "NOT_ENDED_AT_SITE"
                                    ?
                                    this.props.navigation.navigate('ShiftSummary', {shiftId: Activity.shiftId})
                                    :
                                    Activity.type === "Trip_Verification"
                                        ?
                                        this.props.navigation.navigate('MyTrips', {shiftId: Activity.shiftId})
                                        // this.props.navigation.navigate('MyTrips', {shiftId:'615a440d9a058e1bb1d296af'})
                                        :
                                        Activity.type === "BIRTHDAY_WISHES" || Activity.type === "OCCASIONAL"
                                            ?
                                            this.setState({birthdayURL: Activity.attrs.ntfnVerticalImageUrl ? Activity.attrs.ntfnVerticalImageUrl : Activity.attrs.ntfnImageUrl}, () => this.setState({showBirthdayCard: true}))
                                            :
                                           !Activity.accepted && (Activity.type === "ORDER_PICKUP" || Activity.type === "ORDER_PICKUP_NOTIFICATION")
                                                ?
                                                this.setState({
                                                    showOrderDetailsModal: true,
                                                    selectedActivity: Activity,
                                                    loggedUserId:Activity.userId
                                                })
                                                :
                                                // Utils.dialogBox(Activity.activity, '')
                            null
                            // null
                        }}>
                        <View style={[Styles.aslCenter,]}>
                            {Services.returnNotificationIcons(Activity)}
                            <Text
                                style={[Styles.ffMregular, Styles.f12, Styles.pTop5, {
                                    // paddingRight: 30,
                                    // paddingLeft: 10
                                }]}>{Activity.activityTime}</Text>
                        </View>

                        {
                            Activity.type === "BIRTHDAY_WISHES" || Activity.type === "OCCASIONAL"
                                ?
                                <View>
                                    <Image
                                        // onLoadStart={() => this.setState({spinnerBool: true})}
                                        // onLoadEnd={() => this.setState({spinnerBool: false})}
                                        style={[{
                                            height: Dimensions.get('window').height / 5,
                                            width: Dimensions.get('window').width - 110
                                        }, Styles.ImgResizeModeContain]}
                                        source={Activity.attrs.ntfnImageUrl ? {uri: Activity.attrs.ntfnImageUrl} : LoadImages.whizzard_inverted}
                                    />
                                    <View>
                                        <Text
                                            style={[Styles.ffMregular, Styles.aslCenter, Styles.flex1, {
                                                paddingLeft: 10
                                            }]}>{Activity.activity}{Services.returnNotificationActivity(Activity)}</Text>
                                    </View>
                                </View>
                                :
                                <View style={[{width: windowWidth - (!Activity.accepted && (Activity.type === "ORDER_PICKUP"||Activity.type === "ORDER_PICKUP" || Activity.type === "NOT_MARKED_AT_SITE" || Activity.type === "NOT_ENDED_AT_SITE" || (Activity.type === "ATTENDANCE_PERMISSION" && Activity.attrs.attendanceStatus === null) || Activity.type === "BIRTHDAY_WISHES" || Activity.type === "OCCASIONAL") ? 115 : 95)}, Styles.aslStart]}>
                                    <Text
                                        style={[Styles.ffMregular, Styles.flex1, {
                                            paddingLeft: 10
                                        }]}>{Activity.activity}{Services.returnNotificationActivity(Activity)}</Text>
                                </View>
                        }
                        {
                           !Activity.accepted &&(Activity.type === "ORDER_PICKUP" || Activity.type === "NOT_MARKED_AT_SITE" || Activity.type === "NOT_ENDED_AT_SITE" || (Activity.type === "ATTENDANCE_PERMISSION" && Activity.attrs.attendanceStatus === null))
                                ?
                                <MaterialIcons name="chevron-right" size={35}
                                               style={[Styles.cBlk, Styles.p3, Styles.aslCenter]}/>
                                :
                                Activity.type === "BIRTHDAY_WISHES" || Activity.type === "OCCASIONAL"
                                    ?
                                    <Entypo name="chevron-down" size={35}
                                            style={[Styles.cBlk, Styles.p3, Styles.aslCenter]}/>
                                    :
                                    null
                        }
                    </TouchableOpacity>
                </View>
            </Card>
        )
    }

    handleLoadMore = () => {
         this.state.page < this.state.totalPages ?
            this.setState({
                page: this.state.page + 1
            }, () => {
                 this.userNotifications();
            })
            :
            null
    };

    renderFooter = () => {
        return (
            this.state.page < this.state.totalPages ?
                <View>
                    <ActivityIndicator animating size="large"/>
                </View> :
                null
        );
    };
    handleRefresh = () => {
        this.setState({
            isRefreshing: true,
        }, () => {
            this.userNotifications();
        });
    };

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    render() {
        const {userActivitiesInfo, isRefreshing, Notifications,selectedActivity,notificationImage,notificationData} = this.state;
        return (
            <View style={styles.container}>
                <OfflineNotice/>
                {this.renderSpinner()}
                <Appbar.Header theme={theme} style={styles.appbar}>
                    {/*<Appbar.BackAction onPress={() => this.props.navigation.goBack()}/>*/}
                    <Appbar.BackAction onPress={() => this.onBack()}/>
                    <Appbar.Content title="Notifications"/>
                </Appbar.Header>
                <View style={{flex: 1, padding: 10}}>
                    {
                        notificationImage && notificationData === ''
                            ?
                            <Image
                                onLoadStart={() => this.setState({spinnerBool: true})}
                                onLoadEnd={() => this.setState({spinnerBool: false})}
                                style={[{
                                    height: Dimensions.get('window').height - 80,
                                    width: Dimensions.get('window').width - 30
                                }, Styles.ImgResizeModeContain,]}
                                source={notificationImage ? {uri: notificationImage} : null}
                            />
                            :
                            userActivitiesInfo.length > 0 ?
                                <FlatList
                                    data={userActivitiesInfo}
                                    renderItem={({item}) => (this.notificationList(item))}
                                    keyExtractor={(item, index) => index.toString()}
                                    refreshing={isRefreshing}
                                    onRefresh={this.handleRefresh}
                                    onEndReached={this.handleLoadMore}
                                    onEndReachedThreshold={1}
                                    ListFooterComponent={this.renderFooter}
                                />
                                :
                                <Card.Title theme={theme} style={[Styles.bgDWhite, Styles.marV1, Styles.aslCenter, {
                                    fontFamily: "Muli-Regular",
                                    textAlign: "center"
                                }]}
                                            title="No Notifications Found.."
                                />
                    }
                </View>

                {/*MODALS START*/}

                {/*MODAL FOR ORDER PICKUP*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='fade'
                    visible={this.state.showOrderDetailsModal}
                    onRequestClose={() => {
                        this.setState({showOrderDetailsModal: false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        {this.state.spinnerBool === false ? null : <CSpinner/>}
                        <View style={[Styles.bw1, Styles.bgWhite,Styles.padV10,
                            {width: Dimensions.get('window').width - 20,heigth: Dimensions.get('window').height - 100,}]}>
                            <Image
                                style={[{
                                    height: 80,
                                    width: 80
                                }, Styles.ImgResizeModeContain,Styles.aslCenter]}
                                source={LoadImages.vehicle_two}
                            />

                            <Text
                                style={[Styles.ffMbold, Styles.aslCenter, Styles.f18, Styles.p10, Styles.cBlk]}>Order Details</Text>
                            {
                                this.state.selectedActivity
                                    ?
                                    <View>

                                        <Text
                                            style={[Styles.ffMbold, Styles.alignCenter, Styles.f16, Styles.p10, Styles.cBlk]}>{selectedActivity.activity}</Text>

                                        <View>
                                            {
                                                selectedActivity.pickUpAddress
                                                    ?
                                                    <View
                                                        style={[Styles.bgLWhite, Styles.OrdersScreenCardshadow, Styles.m10,Styles.padH5, Styles.padV5]}>
                                                        <Text
                                                            style={[Styles.ffMextrabold, Styles.alignCenter, Styles.f16, Styles.padV3, Styles.cBlk]}>Pick-up
                                                            Address:</Text>
                                                        <View style={[Styles.row, Styles.jSpaceBet]}>
                                                            <View>
                                                                <Text
                                                                    style={[Styles.ffMregular, Styles.f16, Styles.flexWrap, Styles.cBlk]}>{selectedActivity.pickUpAddress.streetAddress},</Text>
                                                                {
                                                                    selectedActivity.pickUpAddress.city
                                                                        ? <Text
                                                                            style={[Styles.ffMregular, Styles.f14, Styles.cBlk]}>{selectedActivity.pickUpAddress.city},</Text> : null
                                                                }
                                                                <Text
                                                                    style={[Styles.ffMregular, Styles.f16, Styles.cBlk]}>{selectedActivity.pickUpAddress.region}-{selectedActivity.pickUpAddress.postcode}</Text>
                                                            </View>
                                                            <View style={[Styles.aslCenter]}>
                                                                <MaterialIcons name="navigation"
                                                                               size={30}
                                                                               color={'#fff'}
                                                                               onPress={() => {
                                                                                   const location = selectedActivity.pickUpAddress.location;
                                                                                   if (location) {
                                                                                       Linking.openURL('google.navigation:q=' + location.latitude + '+' + location.longitude)
                                                                                   } else {
                                                                                       Utils.dialogBox('No Locations Found', '');
                                                                                   }
                                                                               }}
                                                                               style={[Styles.p3, Styles.bgBlueGreenMix, Styles.br5, Styles.aslCenter]}/>
                                                            </View>
                                                        </View>
                                                    </View>
                                                    :
                                                    null
                                            }

                                            {
                                                selectedActivity.deliveryAddress
                                                    ?
                                                    <View
                                                        style={[Styles.bgLWhite, Styles.OrdersScreenCardshadow, Styles.m10,Styles.padH5, Styles.padV5]}>
                                                        <Text
                                                            style={[Styles.ffMextrabold, Styles.alignCenter, Styles.f16, Styles.padV3, Styles.cBlk]}>Delivery
                                                            Address:</Text>
                                                        <View style={[Styles.row, Styles.jSpaceBet]}>
                                                            <View>
                                                                <Text
                                                                    style={[Styles.ffMregular, Styles.f16, Styles.flexWrap, Styles.cBlk]}>{selectedActivity.deliveryAddress.streetAddress},</Text>
                                                                {
                                                                    selectedActivity.deliveryAddress.city
                                                                        ? <Text
                                                                            style={[Styles.ffMregular, Styles.f14, Styles.cBlk]}>{selectedActivity.deliveryAddress.city},</Text> : null
                                                                }
                                                                <Text
                                                                    style={[Styles.ffMregular, Styles.f16, Styles.cBlk]}>{selectedActivity.deliveryAddress.region}-{selectedActivity.deliveryAddress.postcode}</Text>
                                                            </View>
                                                            <View style={[Styles.aslCenter]}>
                                                                <MaterialIcons name="navigation"
                                                                               size={30}
                                                                               color={'#fff'}
                                                                               onPress={() => {
                                                                                   const location = selectedActivity.deliveryAddress.location;
                                                                                   if (location) {
                                                                                       Linking.openURL('google.navigation:q=' + location.latitude + '+' + location.longitude)
                                                                                   } else {
                                                                                       Utils.dialogBox('No Locations Found', '');
                                                                                   }
                                                                               }}
                                                                               style={[Styles.p3, Styles.bgGrn72, Styles.br5, Styles.aslCenter]}/>
                                                            </View>
                                                        </View>
                                                    </View>
                                                    :
                                                    null
                                            }
                                        </View>

                                                <Card.Actions style={[Styles.row, Styles.jSpaceArd, Styles.pTop10]}>
                                                    <Button title='REJECT' color={'red'} compact={true}
                                                            style={[Styles.cBlk]}
                                                            onPress={() => {
                                                                Services.returnCurrentPosition((position)=>{
                                                                    this.setState({
                                                                        currentLocation: position,
                                                                        latitude: position.latitude,
                                                                        longitude: position.longitude,
                                                                        swipeActivated:true,
                                                                        selectedButton:'REJECT'
                                                                    },()=>{this.validatingLocation()})
                                                                })
                                                                // this.setState({showOrderDetailsModal: false,selectedButton:'REJECT'})
                                                            }}
                                                    />
                                                    <Button title='ACCEPT'
                                                            color={'green'}
                                                            compact={true}
                                                            onPress={() => {
                                                                Services.returnCurrentPosition((position)=>{
                                                                    this.setState({
                                                                        currentLocation: position,
                                                                        latitude: position.latitude,
                                                                        longitude: position.longitude,
                                                                        swipeActivated:true,
                                                                        selectedButton:'ACCEPT'
                                                                    },()=>{this.validatingLocation()})
                                                                })
                                                                // this.pickUpNotificationOrder()
                                                                // this.setState({swipeActivated:true},()=>{
                                                                //     this.validatingLocation()
                                                                // })
                                                            }}
                                                    />
                                                </Card.Actions>

                                    </View>
                                    :
                                    null
                            }


                        </View>
                        <TouchableOpacity onPress={() => {
                            this.setState({showOrderDetailsModal: false})
                        }} style={{marginTop: 20}}>
                            {LoadSVG.cancelIcon}
                        </TouchableOpacity>

                    </View>
                </Modal>

                {/*MODAL FOR USER ATTENDANCE APPROVAL*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='fade'
                    visible={this.state.userAttendanceModal}
                    onRequestClose={() => {
                        this.setState({userAttendanceModal: false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View style={[Styles.bw1, Styles.bgWhite, Styles.aslCenter, Styles.padV10,
                            {width: Dimensions.get('window').width - 20,}]}>
                            {
                                this.state.selectedActivity
                                    ?
                                    <View>
                                        <Text
                                            style={[Styles.ffMbold, Styles.alignCenter, Styles.f16, Styles.p10, Styles.colorBlue]}>{this.state.selectedActivity.activity}</Text>
                                        {
                                            this.state.selectedActivity.type === "ORDER_PICKUP_NOTIFICATION" ||this.state.selectedActivity.type === "ORDER_PICKUP"
                                                ?
                                                <Card.Actions style={[Styles.row, Styles.jSpaceArd, Styles.pTop10]}>
                                                    <Button title='CANCEL' color={'red'} compact={true}
                                                            style={[Styles.cBlk]}
                                                            onPress={() => {
                                                                this.setState({userAttendanceModal: false})
                                                            }}
                                                    />
                                                    <Button title='ACCEPT'
                                                            color={'green'}
                                                            compact={true}
                                                            onPress={() => {
                                                                // this.pickUpNotificationOrder()
                                                                this.setState({swipeActivated:true},()=>{
                                                                    this.validatingLocation()
                                                                })
                                                            }}
                                                    />
                                                </Card.Actions>
                                                :
                                                <View>
                                                    <Card.Actions style={[Styles.row, Styles.jSpaceArd, Styles.pTop10]}>
                                                        <Button title='REJECT' color={'red'} compact={true}
                                                                disabled={this.state.showRejectText}
                                                                style={[Styles.cBlk]}
                                                                onPress={() => {
                                                                    this.setState({showRejectText: true})
                                                                }}
                                                        />
                                                        <Button title='APPROVE'
                                                                disabled={this.state.showRejectText}
                                                                color={'green'}
                                                                compact={true}
                                                                onPress={() => {
                                                                    this.userAttendanceUpdate('ACCEPTED', this.state.selectedActivity.shiftId, null)
                                                                }}
                                                        />
                                                    </Card.Actions>
                                                    {
                                                        this.state.showRejectText
                                                            ?
                                                            <View>
                                                                <Text
                                                                    style={[Styles.colorBlue, Styles.f16, Styles.ffMbold, Styles.marH10]}>Enter
                                                                    Reason for Rejection</Text>
                                                                <View style={[]}>
                                                                    <TextInput
                                                                        style={[Styles.p5, Styles.m10, Styles.bw1,]}
                                                                        placeholder={'Enter Reason'}
                                                                        multiline={true}
                                                                        selectionColor={"black"}
                                                                        value={this.state.rejectReason}
                                                                        onChangeText={(rejectReason) => this.setState({rejectReason}, () => {
                                                                            let resp = {};
                                                                            resp = Utils.isValidReason(this.state.rejectReason);
                                                                            if (resp.status === true) {
                                                                                this.setState({errorRejectReason: null});
                                                                            } else {
                                                                                this.setState({errorRejectReason: resp.message});
                                                                            }
                                                                        })}/>
                                                                    {
                                                                        this.state.errorRejectReason ?
                                                                            <Text style={{
                                                                                color: 'red',
                                                                                fontFamily: 'Muli-Regular',
                                                                                paddingLeft: 20, marginBottom: 10
                                                                            }}>{this.state.errorRejectReason}</Text>
                                                                            :
                                                                            null
                                                                    }
                                                                </View>

                                                                {/*<TouchableOpacity*/}
                                                                {/*    onPress={() =>  this.userAttendanceUpdate('REJECTED', this.state.selectedActivity.shiftId, null)}*/}
                                                                {/*    style={[Styles.br5, Styles.aslCenter, Styles.bgRed, Styles.m3]}>*/}
                                                                {/*    <Text*/}
                                                                {/*        style={[Styles.f16, Styles.padH5, Styles.padV10, Styles.ffMextrabold, Styles.cWhite]}>REJECT</Text>*/}
                                                                {/*</TouchableOpacity>*/}

                                                                <Card.Actions
                                                                    style={[Styles.row, Styles.jSpaceArd, Styles.pTop10]}>
                                                                    <Button title='CANCEL' color={'#000'}
                                                                            compact={true}
                                                                            onPress={() => {
                                                                                this.setState({showRejectText: false})
                                                                            }}
                                                                    />
                                                                    <Button title='REJECT'
                                                                            color={'red'}
                                                                            compact={true}
                                                                            onPress={() => {
                                                                                let resp = {};
                                                                                resp = Utils.isValidReason(this.state.rejectReason);
                                                                                if (resp.status === true) {
                                                                                    this.setState({errorRejectReason: null});
                                                                                    this.userAttendanceUpdate('REJECTED', this.state.selectedActivity.shiftId, this.state.rejectReason)
                                                                                } else {
                                                                                    this.setState({errorRejectReason: resp.message});
                                                                                }
                                                                            }}
                                                                    />
                                                                </Card.Actions>

                                                            </View>
                                                            :
                                                            null
                                                    }
                                                </View>
                                        }

                                    </View>
                                    :
                                    null
                            }


                        </View>
                        <TouchableOpacity onPress={() => {
                            this.setState({userAttendanceModal: false})
                        }} style={{marginTop: 20}}>
                            {LoadSVG.cancelIcon}
                        </TouchableOpacity>

                    </View>
                </Modal>

                {/*MODAL FOR HBD IMAGE SHOW*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.showBirthdayCard}
                    onRequestClose={() => {
                        this.setState({showBirthdayCard: false, spinnerBool: false})
                    }}>
                    <View style={[Styles.modalfrontLightTransparent]}>
                        <TouchableOpacity onPress={() => {
                            this.setState({showBirthdayCard: false, spinnerBool: false})
                        }} style={[Styles.modalbgPosition]}>
                        </TouchableOpacity>
                        <Image
                            onLoadStart={() => this.setState({spinnerBool: true})}
                            onLoadEnd={() => this.setState({spinnerBool: false})}
                            style={[{
                                height: Dimensions.get('window').height - 80,
                                width: Dimensions.get('window').width - 30,
                            }, Styles.ImgResizeModeContain]}
                            source={this.state.birthdayURL ? {uri: this.state.birthdayURL} : LoadImages.whizzard_inverted}
                        />
                    </View>
                </Modal>

                {/*MODALS END*/}
            </View>
        );
    }
}

export default Notifications;

const styles = StyleSheet.create({
    appbar: {
        backgroundColor: "white"
    },
    section: {
        backgroundColor: "white"
    },
    container: {
        flex: 1,
        backgroundColor: "#f1f5f4"
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
