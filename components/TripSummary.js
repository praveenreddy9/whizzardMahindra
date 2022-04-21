import * as React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Platform,
    FlatList,
    Modal,
    Dimensions,
    TextInput,
    Keyboard,
    Button,
    Picker,
    Alert,
    Image,
    ActivityIndicator,
    KeyboardAvoidingView,
    RefreshControl, StyleSheet, ImageBackground, Linking
} from "react-native";
import {Appbar, Card, Chip, DefaultTheme, List, TextInput as Input, Title, RadioButton,Checkbox} from "react-native-paper";
import OneSignal from "react-native-onesignal";
import HomeScreen from './HomeScreen';
import {CDismissButton, CSpinner, LoadImages, LoadSVG, Styles} from "./common";
import Utils from './common/Utils';
import OfflineNotice from "./common/OfflineNotice";
import Config from "./common/Config";
import Services from "./common/Services";
import {Column as Col, Row} from "react-native-flexbox-grid";
import MaterialCommunityIcons from "react-native-vector-icons/dist/MaterialCommunityIcons";
import MaterialIcons from "react-native-vector-icons/dist/MaterialIcons";
import Ionicons from "react-native-vector-icons/dist/Ionicons";
import FontAwesome from "react-native-vector-icons/dist/FontAwesome";
import AsyncStorage from "@react-native-community/async-storage";
import _ from 'lodash';
import ImageZoom from "react-native-image-pan-zoom";
import Swiper from 'react-native-deck-swiper'
import FastImage from "react-native-fast-image";
// import {CheckBox} from "react-native-elements";


const colors = ['#D6D1B4', '#F3F2F2', '#FFEE93', '#ccf6d8', '#ECF3AB', '#F8F1EC', '#F4EDAB'];

const theme = {
    ...DefaultTheme,
    fonts: {
        ...DefaultTheme.fonts,
        regular: 'Muli-Regular',
    },
    colors: {
        ...DefaultTheme.colors,
        text: '#233167',
        primary: '#233167', fontWeight: 'bold'
    },

};

// demo purposes only
function* range(start, end) {
    for (let i = start; i <= end; i++) {
        yield i
    }
}

const windowWidth = Dimensions.get('window').width;
const editModalHeight = Dimensions.get('window').height / 1.5;
const subEditHeightBy60 = editModalHeight-60;
const subEditDetialsWidth = windowWidth /2;

export default class TripSummary extends React.Component {

    constructor(props) {
        super(props);
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
        this.state = {
            reportsList: [],
            page: 1,
            size: 20,
            totalElements: 0,
            refreshing: false,
            spinnerBool: false,

            //latest
            imagePreview: false,
            imagePreviewURL: '',
            imageRotate: '0',
            dateBasedCountModal: false,
            tripDetailsCardModal: false,
            // cards: [...range(1, 5)],
            cards: [],
            siteInfo: [],
            pendingDatesInfo: [],
            swipedAllCards: false,
            swipeDirection: '',
            cardIndex: 0,
            editTripDetailsModal: false,
            clientUserIdDetailsUpdated: false,tripSheetIdDetailsUpdated: false,kilometerDetailsUpdated: false,packageDetailsUpdated: false,
            shortCashDetailsUpdated: false,penaltyDetailsUpdated: false,
            rejectTripModal: false,clientUserIdReason:false,tripSheetIdReason:false,packageReason:false,kilometerReason:false,
            plannedLeave:false,unPlannedLeave :false,notWorked:false,
            infinite:false
        }
    }

    componentDidMount() {
        const self = this;
        AsyncStorage.getItem('Whizzard:userRole').then((userRole) => {
            let tempRole = JSON.parse(userRole)
            // console.log('userRole', tempRole, typeof (tempRole))
            self.setState({userRole: tempRole}, () => {
                self.getmappedSitesTripCount()
            })
        })
    }

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
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

    //API mapped sites trip count
    getmappedSitesTripCount() {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_SITES_TRIPS_COUNT;
        const body = {
            // endDateStr: '2021-07-19',
            // startDateStr: '2021-07-19',
        }
        // console.log('get site mapped trips apiURL', apiURL, body)
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "POST", body, (response) => {
                if (response.status === 200) {
                    let responseList = response.data
                    // console.log(' get site mapped trips count resp200', responseList);
                    self.setState({
                        spinnerBool: false,
                        siteInfo: responseList.reports,
                        totalReports: responseList.totalReports,
                    });
                }
            }, (error) => {
                self.errorHandling(error)
            })
        });
    }


    //API to get date trip count
    getDateListTripCount() {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_DATES_LIST_TRIPS_COUNT + '?siteId=' + self.state.filterSiteId;
        const body = {}
        // console.log('get dates trips count apiURL', apiURL, body)
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "POST", body, (response) => {
                if (response.status === 200) {
                    let responseList = response.data
                    // console.log(' get dates trips count resp200', responseList);
                    self.setState({
                        spinnerBool: false,
                        pendingDatesInfo: responseList,
                        swipedAllCards: false,
                        dateBasedCountModal: true,
                    });
                }
            }, (error) => {
                console.log('error in get dates trips count');
                self.errorHandling(error)
            })
        });
    }


    // //API to get all trips list
    getUnverifiedTripList() {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_UN_VERIFIED_TRIPS_LIST;
        const body = {
            siteId:self.state.filterSiteId,
            reportDateStr:self.state.filterDate,

            // siteId:self.state.filterSiteId,
            // date:self.state.filterDate ,


            // reportDateStr: "2021-08-02",
            // siteId: "60f93beaceba2c474a4ede6f"
        }
        // const tempBody = {
        //     siteId:self.state.filterSiteId,
        //     reportDateStr:self.state.filterDate
        // }
        // const body = JSON.stringify(tempBody)
        // console.log('get Unverified Trip List apiURL', apiURL, body)
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "POST", body, (response) => {
                if (response.status === 200) {
                    let responseList = response.data
                    // console.log('get Unverified Trip List resp200', responseList);
                    self.setState({
                        spinnerBool: false,
                        cards: response.data,
                        swipedAllCards: false,
                        tripDetailsCardModal: true,
                        cardIndex:0
                    },()=>{
                        if (this.state.editTripDetailsModal){
                            self.useSelectedDataReport(responseList[self.state.tempCardIndex],self.state.editButton)
                        }
                    });
                }
            }, (error) => {
                console.log('error in get Unverified Trip List');
                self.errorHandling(error)
            })
        });
    }

    //API CALL to verify trip
    verifyTripDetails(tripID) {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.VERIFY_TRIP_DETAILS + tripID;
        const body = {}
        // console.log('verify Trip Details apiURL', apiURL, body)
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "PUT", body, (response) => {
                if (response.status === 200) {
                    // console.log(' verify Trip Details List 200', response.data);
                    self.setState({
                        spinnerBool: false
                    }, () => {
                        Utils.dialogBox("Trip Verified Succesfully", '');
                        this.swipeRight()
                    });
                }
            }, (error) => {
                // console.log('error in verify Trip Details');
                self.errorHandling(error)
            })
        });
    }

    //API CALL to reject trip
    rejectTripDetails() {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.REJECT_TRIP_DETAILS;
        let tempReasonsList = [];
        if (this.state.clientUserIdReason){
            tempReasonsList.push('clientUserId')
        }
        if (this.state.tripSheetIdReason){
            tempReasonsList.push('tripSheetId')
        }
        if (this.state.packageReason){
            tempReasonsList.push('package_type')
        }
        if (this.state.kilometerReason){
            tempReasonsList.push('kilometer')
        }
        if (this.state.plannedLeave){
            tempReasonsList.push('planned_leave')
        }
        if (this.state.unPlannedLeave){
            tempReasonsList.push('unPlanned_leave')
        }
        if (this.state.notWorked){
            tempReasonsList.push('reported_but_notWorked')
        }
        // || this.state.plannedLeave || this.state.unPlannedLeave || this.state.notWorked
        const body = {
            "tripSummaryReportId":self.state.rejectCardDetails.id,
            "rejectionReasons":tempReasonsList
        };
        // console.log('reject Trip Details apiURL', apiURL, body)
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "PUT", body, (response) => {
                if (response.status === 200) {
                    // console.log(' reject Trip Details List 200', response.data);
                    self.setState({
                        spinnerBool: false,
                        rejectTripModal:false
                    }, () => {
                        Utils.dialogBox("Trip Rejected Succesfully", '');
                        this.swipeLeft()
                    });
                }
            }, (error) => {
                // console.log('error in reject Trip Details');
                self.errorHandling(error)
            })
        });
    }

    //API CALL to update trip
    updateDataInTrip(tripId) {
        const self = this;
        // const apiURL = Config.routes.BASE_URL + Config.routes.UPDATE_TRIP_DETAILS;
        // const apiURL = Config.routes.BASE_URL + Config.routes.UPDATE_VERIFY_TRIP+/'reportDate='+self.state.filterDate;
        const apiURL = Config.routes.BASE_URL + Config.routes.UPDATE_VERIFY_TRIP+'reportDate='+ self.state.filterDate;
        let tempBody = {
            "tripSummaryReportId": tripId,
            // "id": tripId,
            "tripSheetId": self.state.finalTripSheetId,
            "clientUserId": self.state.finalClientUserID,
            "startingKM": self.state.finalStartingKM,
            "endingKm": self.state.finalEndingKm,
            "packages": self.state.finalTotalDeliveredCount,
            "deliveredPackages": self.state.finalDeliveredPackages,
            "shortCash": self.state.finalShortCash,
            "penalty": self.state.finalPenaltyAmount,
            "penaltyReason": self.state.finalPenaltyReason,
        }
        const body = JSON.stringify(tempBody);
        // console.log('update Trip apiURL', apiURL, body)
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "PUT", body, (response) => {
                if (response.status === 200) {
                    // console.log('update Trip List 200', response.data);
                    // self.setState({
                    //     spinnerBool: false,
                    // },()=>{
                    //     this.verifyTripDetails(tripId)
                    // });

                    self.setState({
                        spinnerBool: false
                    }, () => {
                        Utils.dialogBox("Trip Verified Succesfully", '');
                        this.swipeRight()
                    });
                }
            }, (error) => {
                console.log('error in update Trip');
                self.errorHandling(error)
            })
        });
    };


    rotate() {
        let newRotation = JSON.parse(this.state.imageRotate) + 90;
        if (newRotation >= 360) {
            newRotation = -360;
        }
        this.setState({
            imageRotate: JSON.stringify(newRotation),
        })
    }

    renderCard = (card, index) => {
        // console.log('render card',card);
        // console.log('render card index',index);
        const {
            clientUserIdDetailsUpdated,
            tripSheetIdDetailsUpdated,
            kilometerDetailsUpdated,
            packageDetailsUpdated,
            shortCashDetailsUpdated,
            penaltyDetailsUpdated
        } = this.state
        if (card) {
            return (
                <View style={{
                    width: Dimensions.get('window').width,
                    height: Dimensions.get('window').height,
                    alignSelf: 'center',
                    // backgroundColor: 'rgba(0,0,0,0.5)'
                    backgroundColor: '#000'
                }}>
                    <View style={[Styles.alignEndEnd, Styles.padH10,]}>
                        <Text style={[Styles.ffRBold, Styles.f18, Styles.padH15, Styles.br10, Styles.marV10, {
                            backgroundColor: '#D1FFE9',
                            color: '#03B675'
                        }]}>{index + 1}/{this.state.cards.length}</Text>
                    </View>
                    <View style={{
                        width: Dimensions.get('window').width - 10,
                        height: Dimensions.get('window').height - 70,
                        alignSelf: 'center',
                        // justifyContent: 'center',
                        backgroundColor: '#fff',
                        // marginTop:20
                    }}>
                        <View style={[Styles.flex1]}>
                            <View style={[Styles.flex1, Styles.p10]}>
                                <FontAwesome name="phone" size={24} color="black" style={[Styles.m8]}
                                             onPress={() => {
                                                 Linking.openURL(`tel:${card.attrs.phoneNumber}`)
                                             }}
                                />
                                <View style={[Styles.bgLBlueWhite, Styles.br10, Styles.pBtm10]}>
                                    <View style={[Styles.posAbsolute, {top: -35}]}>
                                        {
                                            card.attrs.profilePicUrl
                                                ?
                                                <View
                                                    style={[Styles.row, Styles.aslCenter, Styles.br50, Styles.bw3, Styles.bcWhite, Styles.OrdersScreenCardshadow]}>
                                                    <ImageBackground
                                                        style={[Styles.img70, Styles.aslCenter, Styles.br50]}
                                                        source={LoadImages.Thumbnail}>
                                                        <Image
                                                            style={[Styles.img70, Styles.aslCenter, Styles.br50]}
                                                            source={card.attrs.profilePicUrl ? {uri: card.attrs.profilePicUrl} : null}/>
                                                    </ImageBackground>
                                                </View>
                                                :
                                                <FastImage
                                                    style={[Styles.aslCenter, Styles.img70, Styles.bw3, Styles.bcWhite, Styles.br50, Styles.OrdersScreenCardshadow]}
                                                    source={LoadImages.user_pic}/>
                                        }
                                    </View>
                                    <Text
                                        numberOfLines={2}
                                        style={[Styles.f24, Styles.cDarkBlue, Styles.txtAlignCen, Styles.ffRMedium,Styles.pTop45]}>{_.startCase(card.attrs.userName)}</Text>

                                    <Text
                                        style={[Styles.f12, Styles.cLightBlue, Styles.txtAlignCen, Styles.ffRMedium]}>{Services.getUserRoles(card.role)}</Text>
                                    <View style={[Styles.row, Styles.padH30, Styles.jSpaceBet,Styles.mTop10]}>
                                        <View style={[Styles.aslCenter]}>
                                            <Text
                                                style={[Styles.f24, Styles.cDarkBlue, Styles.aslStart, Styles.ffRMedium,]}>{card.attrs.siteCode}</Text>
                                            <Text
                                                style={[Styles.f14, Styles.cLightBlue, Styles.aslCenter, Styles.ffRRegular]}>Shift{' '}
                                                {card.tripNumber || '--'}/{card.attrs.totalUserShiftsInADay || '--'}</Text>
                                        </View>

                                        {
                                            card.vehicleType
                                                ?
                                                <View style={[Styles.aslCenter, Styles.pTop5]}>
                                                    <View
                                                        style={[Styles.aslCenter,Styles.bgLBlueAsh,{ width:46,height:32}]}>{Services.returnVehicleType(card.vehicleType)}</View>
                                                    {/*<View*/}
                                                    {/*    style={[Styles.aslCenter]}>*/}
                                                    {/*    <Image*/}
                                                    {/*        style={[{height: 50, width: 50}]}*/}
                                                    {/*        source={card.vehicleType === 2 ? LoadImages.vehicle_two_wheeler : card.vehicleType === 3 ? LoadImages.vehicle_three_wheeler :*/}
                                                    {/*            card.vehicleType === 4 ? LoadImages.vehicle_four_wheeler : null}*/}
                                                    {/*    />*/}
                                                    {/*</View>*/}
                                                    {
                                                        card.vehicleType
                                                            ?
                                                            <Text
                                                                style={[Styles.f12, Styles.cLightBlue, Styles.aslCenter, Styles.ffRRegular,{letterSpacing:1}]}>{card.attrs.vehicleRegNo}</Text>
                                                            // <Text style={[Styles.f12, Styles.cDarkBlue, Styles.aslCenter, Styles.ffRRegular]}>AA-AA-AA-1234</Text>
                                                            :
                                                            null
                                                    }
                                                </View>
                                                :
                                                <View style={[Styles.aslCenter, {width: 70}]}>
                                                </View>
                                        }
                                    </View>

                                    <View
                                        style={[Styles.row, Styles.bgWhite, Styles.padV10,Styles.padH5, Styles.marV20, Styles.marH10, Styles.br10]}>
                                        <View style={[Styles.flex1, Styles.alignCenter]}>
                                            <Text
                                                style={[Styles.f14, Styles.cDarkBlue, Styles.aslCenter, Styles.ffRMedium]}>{card.attrs.shiftStartedTimeIn24HrsFormat || '--'}</Text>
                                        </View>
                                        <View style={[Styles.flex1, Styles.alignCenter]}>
                                            <Text
                                                style={[Styles.f24, Styles.cDarkBlue, Styles.aslCenter, Styles.ffRMedium]}>{card.attrs.shiftDurationString || '--'}</Text>
                                            <Text
                                                style={[Styles.f12, Styles.cDarkBlue, Styles.aslCenter, Styles.ffRMedium]}>{_.startCase(_.toLower(card.attrs.shiftType)) || '--'} Trip</Text>
                                        </View>
                                        <View style={[Styles.flex1, Styles.alignCenter]}>
                                            <Text
                                                style={[Styles.f14, Styles.cDarkBlue, Styles.aslCenter, Styles.ffRMedium]}>{card.attrs.shiftEndedTimeIn24HrsFormat || '--'}</Text>
                                        </View>
                                    </View>
                                    <Text
                                        style={[Styles.f12, Styles.cLightBlue, Styles.txtAlignCen, Styles.ffRMedium, Styles.mBtm5]}>{_.startCase(_.lowerCase(card.attrs.shiftStatus)) || '--'}</Text>
                                </View>


                                <ScrollView>
                                    <View style={[Styles.row, Styles.flexWrap, Styles.alignCenter, Styles.marV15,Styles.padV5]}>
                                        {
                                            card.attrs.requiresClientUserId === 'true'
                                                ?
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        this.setState({tempCardIndex:index,cardIndex:index},()=>{
                                                            this.useSelectedDataReport(card, 'CLIENT_USER_ID')
                                                        })
                                                    }}
                                                    activeOpacity={0.7}
                                                    style={[Styles.row, Styles.mTop5,]}>
                                                    <View
                                                        style={[Styles.bw1,card.clientUserId ? Styles.bcAsh :Styles.bcLightRed, Styles.br5, Styles.marH5, Styles.mBtm10]}>
                                                        <View
                                                            style={[card.clientUserId ? Styles.bgLBlueWhite : Styles.bgLPink, Styles.padV10, Styles.alignCenter, {
                                                                // width: Dimensions.get('window').width/3.6,
                                                                // width: Dimensions.get('window').width/4,
                                                                width: Dimensions.get('window').width / 3.8,
                                                                height: 55
                                                            }]}>
                                                            <Text
                                                                numberOfLines={1}
                                                                style={[Styles.f14, card.clientUserId ? Styles.cLightNavyBlue : Styles.cLightRed, Styles.aslCenter, Styles.ffRRegular]}>{card.clientUserId || '--'}</Text>
                                                        </View>
                                                        <View
                                                            style={[Styles.bgWhite, Styles.padV10, Styles.aslCenter, {
                                                                // width: 110,
                                                                // width: Dimensions.get('window').width/4,
                                                                height: 36
                                                            }]}>
                                                            <Text
                                                                style={[Styles.f12, Styles.cLightBlue, Styles.aslCenter, Styles.ffRRegular]}>Client
                                                                User ID</Text>
                                                        </View>
                                                        <View style={[Styles.posAbsolute, {top: 46, left: Dimensions.get('window').width/8.5}]}>
                                                            {Services.returnCardStatusIcon(clientUserIdDetailsUpdated)}
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                                :
                                                null
                                        }

                                        <TouchableOpacity
                                            onPress={() => {
                                                this.setState({tempCardIndex:index,cardIndex:index},()=>{
                                                    this.useSelectedDataReport(card, 'TRIP_SHEET_ID')
                                                })
                                            }}
                                            activeOpacity={0.7}
                                            style={[Styles.row, Styles.mTop5]}>
                                            <View
                                                style={[Styles.bw1,card.tripSheetId ? Styles.bcAsh :Styles.bcLightRed, Styles.br5, Styles.marH5, Styles.mBtm10]}>
                                                <View
                                                    style={[card.tripSheetId ? Styles.bgLBlueWhite : Styles.bgLPink, Styles.padV10, Styles.alignCenter, {
                                                        // width: 115,
                                                        // height: 70
                                                        // width: Dimensions.get('window').width/3.6,
                                                        // width: Dimensions.get('window').width/4,
                                                        width: Dimensions.get('window').width / 3.8,
                                                        height: 55
                                                    }]}>
                                                    <Text
                                                        numberOfLines={1}
                                                        style={[Styles.f14, card.tripSheetId ? Styles.cLightNavyBlue : Styles.cLightRed, Styles.aslCenter, Styles.ffRRegular]}>{card.tripSheetId || '--'}</Text>
                                                </View>
                                                <View style={[Styles.bgWhite, Styles.padV10, Styles.aslCenter, {
                                                    // width: 115,
                                                    // height: 36
                                                    // width: Dimensions.get('window').width/4,
                                                    height: 36
                                                }]}>
                                                    <Text
                                                        style={[Styles.f12, Styles.cLightBlue, Styles.aslCenter, Styles.ffRRegular]}>Trip
                                                        Sheet ID</Text>
                                                </View>
                                                <View style={[Styles.posAbsolute,{top: 46, left: Dimensions.get('window').width/8.5}]}>
                                                    {Services.returnCardStatusIcon(tripSheetIdDetailsUpdated)}
                                                </View>
                                            </View>
                                        </TouchableOpacity>

                                        {
                                            card.role === 1 || card.role === 10
                                                ?
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        this.setState({tempCardIndex:index,cardIndex:index},()=>{
                                                            this.useSelectedDataReport(card, 'PACKAGES')
                                                        })
                                                    }}
                                                    activeOpacity={0.7}
                                                    style={[Styles.row, Styles.mTop5]}>
                                                    <View
                                                        style={[Styles.bw1,card.packages > 0 ? Styles.bcAsh : Styles.bcLightRed, Styles.br5, Styles.marH5, Styles.mBtm10]}>
                                                        <View
                                                            style={[card.packages > 0 ? Styles.bgLBlueWhite : Styles.bgLPink, Styles.padV10, Styles.alignCenter, {
                                                                // width: 115,
                                                                // height: 70
                                                                // width: Dimensions.get('window').width/3.6,
                                                                // width: Dimensions.get('window').width/4,
                                                                width: Dimensions.get('window').width / 3.8,
                                                                height: 55
                                                            }]}>
                                                            <Text
                                                                style={[Styles.f14, card.packages > 0 ? Styles.cLightNavyBlue : Styles.cLightRed, Styles.aslCenter, Styles.ffRRegular]}>Delivery</Text>
                                                        </View>
                                                        <View
                                                            style={[Styles.bgWhite, Styles.padV10, Styles.aslCenter, {
                                                                // width: 115,
                                                                // height: 36
                                                                // width: Dimensions.get('window').width/4,
                                                                height: 36
                                                            }]}>
                                                            <Text
                                                                style={[Styles.f12, Styles.cLightBlue, Styles.aslCenter, Styles.ffRRegular]}>Package Type</Text>
                                                        </View>
                                                        <View style={[Styles.posAbsolute,{top: 46, left: Dimensions.get('window').width/8.5}]}>
                                                            {Services.returnCardStatusIcon(packageDetailsUpdated)}
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                                :
                                                null
                                        }

                                        {
                                            card.role === 5 || card.role === 10
                                                ?
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        this.setState({tempCardIndex:index,cardIndex:index},()=>{
                                                            this.useSelectedDataReport(card, 'KILOMETER')
                                                        })
                                                    }}
                                                    activeOpacity={0.7}
                                                    style={[Styles.row, Styles.mTop5]}>
                                                    <View
                                                        style={[Styles.bw1,card.tripDistance > 0 ? Styles.bcAsh : Styles.bcLightRed, Styles.br5, Styles.marH5, Styles.mBtm10]}>
                                                        <View
                                                            style={[card.tripDistance >0 ? Styles.bgLBlueWhite : Styles.bgLPink, Styles.padV10, Styles.alignCenter, {
                                                                // width: 115,
                                                                // height: 70
                                                                // width: Dimensions.get('window').width/3.6,
                                                                // width: Dimensions.get('window').width/4,
                                                                width: Dimensions.get('window').width / 3.8,
                                                                height: 55
                                                            }]}>
                                                            <Text
                                                                style={[Styles.f14, card.tripDistance >0 ? Styles.cLightNavyBlue : Styles.cLightRed, Styles.aslCenter, Styles.ffRRegular]}>{card.tripDistance}</Text>
                                                        </View>
                                                        <View
                                                            style={[Styles.bgWhite, Styles.padV10, Styles.aslCenter, {
                                                                // width: 115,
                                                                // height: 36
                                                                // width: Dimensions.get('window').width/4,
                                                                height: 36
                                                            }]}>
                                                            <Text
                                                                style={[Styles.f12, Styles.cLightBlue, Styles.aslCenter, Styles.ffRRegular]}>Kilometer</Text>
                                                        </View>
                                                        <View style={[Styles.posAbsolute,{top: 46, left: Dimensions.get('window').width/8.5}]}>
                                                            {Services.returnCardStatusIcon(kilometerDetailsUpdated)}
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                                :
                                                null
                                        }

                                        <TouchableOpacity
                                            onPress={() => {
                                                this.setState({tempCardIndex:index,cardIndex:index},()=>{
                                                    this.useSelectedDataReport(card, 'SHORT_CASH')
                                                })
                                            }}
                                            activeOpacity={0.7}
                                            style={[Styles.row, Styles.mTop5]}>
                                            <View
                                                style={[Styles.bw1,card.shortCash > 0 ? Styles.bcAsh : Styles.bcLightRed, Styles.br5, Styles.marH5, Styles.mBtm10]}>
                                                <View
                                                    style={[card.shortCash >0 ? Styles.bgLBlueWhite : Styles.bgLPink, Styles.padV10, Styles.alignCenter, {
                                                        width: Dimensions.get('window').width / 3.8,
                                                        height: 55
                                                    }]}>
                                                    <Text
                                                        style={[Styles.f14, card.shortCash >0 ? Styles.cLightNavyBlue : Styles.cLightRed, Styles.aslCenter, Styles.ffRRegular]}>{card.shortCash || '--'}</Text>
                                                </View>
                                                <View
                                                    style={[Styles.bgWhite, Styles.padV10, Styles.aslCenter, {
                                                        height: 36
                                                    }]}>
                                                    <Text
                                                        style={[Styles.f12, Styles.cLightBlue, Styles.aslCenter, Styles.ffRRegular]}>Short Cash</Text>
                                                </View>
                                                <View style={[Styles.posAbsolute,{top: 46, left: Dimensions.get('window').width/8.5}]}>
                                                    {Services.returnCardStatusIcon(shortCashDetailsUpdated)}
                                                </View>
                                            </View>
                                        </TouchableOpacity>


                                        <TouchableOpacity
                                            onPress={() => {
                                                this.setState({tempCardIndex:index,cardIndex:index},()=>{
                                                    this.useSelectedDataReport(card, 'PENALTY')
                                                })
                                            }}

                                            activeOpacity={0.7}
                                            style={[Styles.row, Styles.mTop5]}>
                                            <View
                                                style={[Styles.bw1,card.penalty > 0 ? Styles.bcAsh : Styles.bcLightRed, Styles.br5, Styles.marH5, Styles.mBtm10]}>
                                                <View
                                                    style={[card.penalty >0 ? Styles.bgLBlueWhite : Styles.bgLPink, Styles.padV10, Styles.alignCenter, {
                                                        width: Dimensions.get('window').width / 3.8,
                                                        height: 55
                                                    }]}>
                                                    <Text
                                                        style={[Styles.f14, card.penalty >0 ? Styles.cLightNavyBlue : Styles.cLightRed, Styles.aslCenter, Styles.ffRRegular]}>{card.penalty || '--'}</Text>
                                                </View>
                                                <View
                                                    style={[Styles.bgWhite, Styles.padV10, Styles.aslCenter, {
                                                        height: 36
                                                    }]}>
                                                    <Text
                                                        style={[Styles.f12, Styles.cLightBlue, Styles.aslCenter, Styles.ffRRegular]}>penalty</Text>
                                                </View>
                                                <View style={[Styles.posAbsolute,{top: 46, left: Dimensions.get('window').width/8.5}]}>
                                                    {Services.returnCardStatusIcon(penaltyDetailsUpdated)}
                                                </View>
                                            </View>
                                        </TouchableOpacity>

                                    </View>
                                </ScrollView>

                            </View>

                            {/*FOOTER BUTTONS*/}
                            <View style={[Styles.aslStretch, {bottom: 30}]}>
                                <View style={[Styles.row, Styles.jSpaceBet,Styles.marH20]}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            // this.swipeLeft()
                                            this.setState({rejectTripModal: true, rejectCardDetails: card})
                                        }}
                                        style={[Styles.alignCenter,Styles.padV3, Styles.bgWhite,Styles.br3,Styles.bw1,Styles.bcLightWhite,
                                            Styles.OrdersScreenCardshadow, {width:windowWidth/3.6}]}>
                                        <Text
                                            style={[Styles.f14, Styles.padV8, Styles.ffRuBold, Styles.fWbold, Styles.cGrey33]}>Reject</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => {
                                            this.swipeTop()
                                        }}
                                        style={[Styles.alignCenter,Styles.padV3, Styles.bgWhite,Styles.br3,Styles.bw1,Styles.bcLightWhite,
                                            Styles.OrdersScreenCardshadow, {width:windowWidth/3.6}]}>
                                        <Text
                                            style={[Styles.f14, Styles.padV8, Styles.ffRuBold, Styles.fWbold, Styles.cGrey33]}>Skip
                                            For Later</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        //     clientUserIdDetailsUpdated,
                                        // tripSheetIdDetailsUpdated,
                                        // kilometerDetailsUpdated,
                                        // packageDetailsUpdated
                                        onPress={() => {
                                            // this.swipeRight()
                                            if (card.role === 10) {
                                                if ((card.attrs.requiresClientUserId === 'true' ? (clientUserIdDetailsUpdated) : true) &&
                                                    (tripSheetIdDetailsUpdated) && (kilometerDetailsUpdated) && (packageDetailsUpdated) && (shortCashDetailsUpdated) && (penaltyDetailsUpdated) ) {
                                                    // this.verifyTripDetails(card.id)
                                                    this.updateDataInTrip(card.id)
                                                } else {
                                                    Utils.dialogBox('Please update the details', '');
                                                }
                                            } else if (card.role === 5) {
                                                if ((card.attrs.requiresClientUserId === 'true' ? (clientUserIdDetailsUpdated) : true) &&
                                                    (tripSheetIdDetailsUpdated) && (kilometerDetailsUpdated) && (shortCashDetailsUpdated) && (penaltyDetailsUpdated)) {
                                                    // this.verifyTripDetails(card.id)
                                                    this.updateDataInTrip(card.id)
                                                } else {
                                                    Utils.dialogBox('Please update the details', '');
                                                }
                                            } else if (card.role === 1) {
                                                if ((card.attrs.requiresClientUserId === 'true' ? (clientUserIdDetailsUpdated) : true) &&
                                                    (tripSheetIdDetailsUpdated) && (packageDetailsUpdated) && (shortCashDetailsUpdated) && (penaltyDetailsUpdated)) {
                                                    // this.verifyTripDetails(card.id)
                                                    this.updateDataInTrip(card.id)
                                                } else {
                                                    Utils.dialogBox('Please update the details', '');
                                                }
                                            } else {
                                                if ((tripSheetIdDetailsUpdated) && (shortCashDetailsUpdated) && (penaltyDetailsUpdated)) {
                                                    // this.verifyTripDetails(card.id)
                                                    this.updateDataInTrip(card.id)
                                                } else {
                                                    Utils.dialogBox('Please update the details', '');
                                                }
                                            }
                                        }}
                                        style={[Styles.alignCenter,Styles.padV3, Styles.bgDarkRed,Styles.br3,Styles.bw1,Styles.bcLightRed,
                                            Styles.OrdersScreenCardshadow, {width:windowWidth/3.6}]}>
                                        <Text
                                            style={[Styles.f14, Styles.padV8,Styles.ffRuBold, Styles.fWbold,Styles.cWhite]}>Verify</Text>
                                    </TouchableOpacity>


                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            )
        }
    };

    onSwiped = (type) => {
        // console.log(`on swiped ${type}`)
        this.setState({
            cardIndex:this.state.cardIndex-1,
            clientUserIdDetailsUpdated: false,
            tripSheetIdDetailsUpdated: false,
            kilometerDetailsUpdated: false,
            packageDetailsUpdated: false,
            shortCashDetailsUpdated: false,
            penaltyDetailsUpdated: false,
            clientUserIdReason:false,
            tripSheetIdReason:false,
            packageReason:false,
            kilometerReason:false,

            finalClientUserID:'',finalTripSheetId:'',finalStartingKM:'',finalEndingKm:'',finalKmDifference:'',
            finalDeliveredPackages:[],finalTotalDeliveredCount:'',
            finalPenaltyAmount:'',finalPenaltyReason:'',finalShortCash:'',
        })
    }

    onSwipedAllCards = () => {
        // console.log('swiped all')
        this.setState({
            swipedAllCards: true
        })
    };

    swipeLeft = () => {
        this.swiper.swipeLeft()
    };

    swipeRight = () => {
        this.swiper.swipeRight()
    };

    swipeTop = () => {
        this.swiper.swipeTop()
    };

    OdometerReadingValidate(item, operator, settingValue) {
        // console.log('validation settingvalue', settingValue, 'item', item);
        // endingKm
        if (operator === 'onChange') {
            var value = Math.trunc(parseInt(item));
            // console.log('value Tin',value)
            const initialValue = JSON.stringify(value)

            let num = initialValue.replace('-', '').replace(/[&\/\\#,+()$~%!@^a-zA-Z_=.'":*?<>{}]/g, '').replace(/\s+/g, '');
            if (num > 0) {
                if (num >= 999999) {
                    const tempValue = 999998;
                    if (settingValue === 'startingKM') {
                        this.setState({tempStartingKM: JSON.stringify(tempValue)})
                    } else if (settingValue === 'endingKm') {
                        this.setState({tempEndingKm: JSON.stringify(tempValue)})
                    }
                } else {
                    if (settingValue === 'startingKM') {
                        this.setState({tempStartingKM: num})
                    } else if (settingValue === 'endingKm') {
                        this.setState({tempEndingKm: num})
                    }
                }
            } else {
                if (settingValue === 'startingKM') {
                    this.setState({tempStartingKM: num})
                } else if (settingValue === 'endingKm') {
                    this.setState({tempEndingKm: num})
                }
            }
        } else {
            if (item === '') {
                item = 0;
                if (settingValue === 'startingKM') {
                    this.setState({tempStartingKM: JSON.stringify(item)})
                } else if (settingValue === 'endingKm') {
                    this.setState({tempEndingKm: JSON.stringify(item)})
                }
            } else {
                let value = Math.trunc(parseInt(item));
                if (operator === 'Increment') {
                    if (value >= 999998) {
                        const tempValue = 999998;
                        if (settingValue === 'startingKM') {
                            this.setState({tempStartingKM: JSON.stringify(tempValue)})
                        } else if (settingValue === 'endingKm') {
                            this.setState({tempEndingKm: JSON.stringify(tempValue)})
                        }
                        Utils.dialogBox('Reached Maximum Value', '');
                    } else {
                        const tempValue = value + 1;
                        if (settingValue === 'startingKM') {
                            this.setState({tempStartingKM: JSON.stringify(tempValue)})
                        } else if (settingValue === 'endingKm') {
                            this.setState({tempEndingKm: JSON.stringify(tempValue)})
                        }
                    }
                } else if (operator === 'Decrement') {
                    if (value <= 0) {
                        // const tempValue = 0;
                        if (settingValue === 'startingKM') {
                            this.setState({tempStartingKM: JSON.stringify(value)})
                        } else if (settingValue === 'endingKm') {
                            this.setState({tempEndingKm: JSON.stringify(value)})
                        }
                        // Utils.dialogBox('Reached Minimum Value', '');
                    } else if (value > 999999) {
                        const tempValue = 999999 - 1;
                        if (settingValue === 'startingKM') {
                            this.setState({tempStartingKM: JSON.stringify(tempValue)})
                        } else if (settingValue === 'endingKm') {
                            this.setState({tempEndingKm: JSON.stringify(tempValue)})
                        }
                        Utils.dialogBox('Reached Maximum Value', '');
                    } else {
                        const tempValue = value - 1;
                        if (tempValue === 0) {
                            if (settingValue === 'startingKM') {
                                this.setState({tempStartingKM: JSON.stringify(tempValue)})
                            } else if (settingValue === 'endingKm') {
                                this.setState({tempEndingKm: JSON.stringify(tempValue)})
                            }
                        } else {
                            if (settingValue === 'startingKM') {
                                this.setState({tempStartingKM: JSON.stringify(tempValue)})
                            } else if (settingValue === 'endingKm') {
                                this.setState({tempEndingKm: JSON.stringify(tempValue)})
                            }
                        }
                    }
                }
            }
        }
    }

    deliveredPackageValidation(count, counter, type, index) {
        // console.log('deliver validations count',count,'counter===>',counter,'type===',type,'index==>',index);
        let TargetValue = Math.trunc(parseInt(this.state.pickupPackages));
        if (counter === 'Decrement') {
            if (count === '') {
                Utils.dialogBox('Please enter a value', '');
            } else {
                let value = Math.trunc(parseInt(count));
                if (value < 1) {
                    Utils.dialogBox('Minimum value is 0', '');
                } else {
                    let tempItem = (Math.trunc(Number(count) - 1));
                    let tempDeliveredPackages = [...this.state.tempDeliveredPackages]
                    tempDeliveredPackages[index] = {
                        ...tempDeliveredPackages[index],
                        count: tempItem
                    }
                    // console.log('tempDeliveredPackages decrement',tempDeliveredPackages);
                    this.calculatePackages(tempDeliveredPackages)
                    // this.setState({tempDeliveredPackages})
                }
            }

        } else if (counter === 'Increment') {
            let value = Math.trunc(parseInt(count));
            // if (value > TargetValue - 1) {
            //     Utils.dialogBox('Maximum value is ' + TargetValue, '');
            // } else {
            let tempItem = (Math.trunc(Number(count) + 1));

            let tempDeliveredPackages = [...this.state.tempDeliveredPackages]
            tempDeliveredPackages[index] = {
                ...tempDeliveredPackages[index],
                count: tempItem
            }
            // console.log('tempDeliveredPackages increment',tempDeliveredPackages);
            this.calculatePackages(tempDeliveredPackages)
            // this.setState({tempDeliveredPackages})

            // }
        } else {
            let value = count;
            // if (value > TargetValue) {
            //     Utils.dialogBox('Maximum value is ' + TargetValue, '');
            // } else
            if (value < 0) {
                // Utils.dialogBox('Minimum value is ' + tempItem.minimumValue, '');
            } else if (count === '') {
                Utils.dialogBox('Please enter a value', '');
            } else {
                let tempItem = ''
                if (isNaN(value)) {
                    tempItem = value.replace('-', '').replace(/[&\/\\#,+()$~%!@^a-zA-Z_=.'":*?<>{}]/g, '').replace(/\s+/g, '');
                } else {
                    tempItem = value === '' ? '' : parseInt(value.replace('-', '').replace(/[&\/\\#,+()$~%!@^a-zA-Z_=.'":*?<>{}]/g, '').replace(/\s+/g, ''));
                }

                let tempDeliveredPackages = [...this.state.tempDeliveredPackages]
                tempDeliveredPackages[index] = {
                    ...tempDeliveredPackages[index],
                    count: tempItem
                }
                // console.log('tempDeliveredPackages increment',tempDeliveredPackages);
                this.calculatePackages(tempDeliveredPackages)
                // this.setState({tempDeliveredPackages})

            }
        }
    }

    // calculatePackages(deliveredPackages, attempts, rejectedCount, cReturnPickedUp) {
    calculatePackages(packagesList) {
        // console.log('calculate pcakagesList',packagesList)
        let tempSum = packagesList.reduce((n, {count}) => n + count, 0);

        // console.log('calculate tempSum',tempSum)

        this.setState({totalDeliveredCount: JSON.stringify(tempSum), tempDeliveredPackages: packagesList})
    }

    revertValues() {
        let oldData = this.state.selectedCardTripDetails;
        // console.log('revert values',oldData);
        // let tempTotal = oldData.attempts + oldData.totalDeliveries + oldData.customerReturnsPickedUpCount + oldData.rejectedCount
        let tempPackages = oldData.deliveredPackages;
        let tempSum = tempPackages.reduce((n, {count}) => n + count, 0);
        this.setState({
            pickupPackages: JSON.stringify(oldData.packages),
            totalDeliveredCount: JSON.stringify(tempSum),
            packageSelectionModal: false,
            tempDeliveredPackages: oldData.deliveredPackages,
            packageDetailsUpdated: false
        })
    }

    //API CALL to update trip
    updateTrip() {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.UPDATE_TRIP_DETAILS;
        const {editButton} = self.state
        let tempData = self.state.selectedCardTripDetails
        let tempBody = {
            "tripSummaryReportId": tempData.id,
            "tripType": tempData.tripType,
            "tripSheetId": self.state.tempTripSheetId,
            "clientUserId": self.state.tempClientUserId,
            "startingKM": self.state.tempStartingKM ? JSON.parse(self.state.tempStartingKM) : '',
            "endingKm": self.state.tempEndingKm ? JSON.parse(self.state.tempEndingKm) : '',
            // "packages": tempData.packages,
            "packages": this.state.totalDeliveredCount,
            "deliveredPackages": this.state.tempDeliveredPackages,
            // "deliveredPackages":  tempData.deliveredPackages,
        }
        const body = [tempBody];
        // console.log('update Trip apiURL', apiURL, body)
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "PUT", body, (response) => {
                if (response.status === 200) {
                    console.log('update Trip List 200', response.data);

                    if (editButton === 'CLIENT_USER_ID') {
                        self.setState({clientUserIdDetailsUpdated: true})
                    } else if (editButton === 'TRIP_SHEET_ID') {
                        self.setState({tripSheetIdDetailsUpdated: true})
                    } else if (editButton === 'KILOMETER') {
                        self.setState({kilometerDetailsUpdated: true})
                    } else if (editButton === 'PACKAGES') {
                        self.setState({packageDetailsUpdated: true})
                    } else if (editButton === 'SHORT_CASH') {
                        self.setState({shortCashDetailsUpdated: true})
                    } else if (editButton === 'PENALTY') {
                        self.setState({penaltyDetailsUpdated: true})
                    }

                    self.setState({
                        spinnerBool: false,
                        // editTripDetailsModal:false,
                    }, () => {
                        Utils.dialogBox('Details Updated', '');
                        this.getUnverifiedTripList()
                        // this.useSelectedDataReport(response.data,self.state.editButton)
                    });
                }
            }, (error) => {
                console.log('error in update Trip');
                self.errorHandling(error)
            })
        });
    };

    useSelectedDataReport(item, selectedButton) {
        // let tempTotal = item.attempts + item.totalDeliveries + item.customerReturnsPickedUpCount + item.rejectedCount
        // console.log('selected item', item);
        // let tempPackages = item.deliveredPackages;
        // let tempSum = tempPackages.reduce((n, {count}) => n + count, 0);

        // console.log('tempSum==',tempSum);
        const {
            clientUserIdDetailsUpdated,
            tripSheetIdDetailsUpdated,
            kilometerDetailsUpdated,
            packageDetailsUpdated
        } = this.state;

        this.setState({
            // // clientUserIdDetailsUpdated:false,tripSheetIdDetailsUpdated:false,kilometerDetailsUpdated:false,packageDetailsUpdated:false,
            // // shortCashDetailsUpdated:false,penaltyDetailsUpdated:false,
            // selectedCardTripDetails: item,
            // tempClientUserId: clientUserIdDetailsUpdated ? this.state.tempClientUserId : item.clientUserId,
            // tempTripSheetId: tripSheetIdDetailsUpdated ? this.state.tempTripSheetId : item.tripSheetId,
            // tempStartingKM: kilometerDetailsUpdated ? this.state.tempStartingKM : JSON.stringify(item.startingKM),
            // tempEndingKm: kilometerDetailsUpdated ? this.state.tempEndingKm : JSON.stringify(item.endingKm),
            // pickupPackages: packageDetailsUpdated ? this.state.pickup : JSON.stringify(item.packages),
            // totalDeliveredCount: packageDetailsUpdated ? this.state.totalDeliveredCount : JSON.stringify(item.packages),
            // // totalDeliveredCount: packageDetailsUpdated ? this.state.totalDeliveredCount : JSON.stringify(tempSum),
            // // totalDeliveredCount: JSON.stringify(tempSum),
            // tempDeliveredPackages: packageDetailsUpdated ? this.state.tempDeliveredPackages : item.deliveredPackages,
            // tempTripType: item.tripType,
            // editTripDetailsModal: true,
            // editButton: selectedButton


            selectedCardTripDetails: item,
            tempClientUserId:  item.clientUserId,
            tempTripSheetId:   item.tripSheetId,
            tempStartingKM: JSON.stringify(item.startingKM),
            tempEndingKm: JSON.stringify(item.endingKm),
            pickupPackages: JSON.stringify(item.packages),
            totalDeliveredCount: JSON.stringify(item.packages),
            // totalDeliveredCount: packageDetailsUpdated ? this.state.totalDeliveredCount : JSON.stringify(tempSum),
            // totalDeliveredCount: JSON.stringify(tempSum),
            tempDeliveredPackages: item.deliveredPackages,
            // tempTripType: item.tripType,
            tempRole:item.role,
            penalty: item.penalty ? JSON.stringify(item.penalty) :'',
            penaltyReason:item.penaltyReason,
            shortCash:item.shortCash ? JSON.stringify(item.shortCash) :'',

            editTripDetailsModal: true,
            editButton: selectedButton
        })
    };

    checkSwipeCondition() {
        const {
            clientUserIdDetailsUpdated,
            tripSheetIdDetailsUpdated,
            kilometerDetailsUpdated,
            packageDetailsUpdated
        } = this.state;
        if (this.state.cards[this.state.cardIndex]) {
            if (this.state.cards[this.state.cardIndex].role === 10) {
                if ((this.state.cards[this.state.cardIndex].attrs.requiresClientUserId === 'true' ? clientUserIdDetailsUpdated : true) && tripSheetIdDetailsUpdated && kilometerDetailsUpdated && packageDetailsUpdated) {
                    return true
                } else {
                    return true
                }
            } else if (this.state.cards[this.state.cardIndex].role === 5) {
                if ((this.state.cards[this.state.cardIndex].attrs.requiresClientUserId === 'true' ? clientUserIdDetailsUpdated : true) && tripSheetIdDetailsUpdated && kilometerDetailsUpdated) {
                    return false
                } else {
                    return true
                }
            } else if (this.state.cards[this.state.cardIndex].role === 1) {
                if ((this.state.cards[this.state.cardIndex].attrs.requiresClientUserId === 'true' ? clientUserIdDetailsUpdated : true) && tripSheetIdDetailsUpdated && packageDetailsUpdated) {
                    return false
                } else {
                    return true
                }
            } else {
                if (tripSheetIdDetailsUpdated) {
                    return false
                } else {
                    return true
                }
            }
        } else {
            return true
        }
    }

    swipeAfterDataUpdated() {
        if (this.state.cards[this.state.cardIndex].role === 10) {
            if ((this.state.cards[this.state.cardIndex].attrs.requiresClientUserId === 'true' ? clientUserIdDetailsUpdated : true) && tripSheetIdDetailsUpdated && kilometerDetailsUpdated && packageDetailsUpdated) {
                this.verifyTripDetails(this.state.cards[this.state.cardIndex].id)
            } else {
                Utils.dialogBox('Please update all details', '');
            }
        } else if (this.state.cards[this.state.cardIndex].role === 5) {
            if ((this.state.cards[this.state.cardIndex].attrs.requiresClientUserId === 'true' ? clientUserIdDetailsUpdated : true) && tripSheetIdDetailsUpdated && kilometerDetailsUpdated) {
                this.verifyTripDetails(this.state.cards[this.state.cardIndex].id)
            } else {
                Utils.dialogBox('Please update all details', '');
            }
        } else if (this.state.cards[this.state.cardIndex].role === 1) {
            if ((this.state.cards[this.state.cardIndex].attrs.requiresClientUserId === 'true' ? clientUserIdDetailsUpdated : true) && tripSheetIdDetailsUpdated && packageDetailsUpdated) {
                this.verifyTripDetails(this.state.cards[this.state.cardIndex].id)
            } else {
                Utils.dialogBox('Please update all details', '');
            }
        } else {
            if (tripSheetIdDetailsUpdated) {
                this.verifyTripDetails(this.state.cards[this.state.cardIndex].id)
            } else {
                Utils.dialogBox('Please update all details', '');
            }
        }
    }

    deckSwiperData(){
        const { cardIndex,infinite } = this.state;
        return(
            <Swiper
                ref={swiper => {
                    this.swiper = swiper
                }}
                backgroundColor={'#000'}
                onSwiped={() => this.onSwiped('general')}
                onSwipedLeft={() => this.onSwiped('left')}
                onSwipedRight={() => this.onSwiped('right')}
                // onSwipedRight={() => this.verifyTripDetails(this.state.cards[this.state.cardIndex].id)}
                // onSwipedRight={() => this.swipeAfterDataUpdated()}
                onSwipedTop={() => this.onSwiped('top')}
                onSwipedBottom={() => this.onSwiped('bottom')}
                disableBottomSwipe={true}
                // disableRightSwipe={this.checkSwipeCondition()}
                disableRightSwipe={true}
                disableLeftSwipe={true}
                // infinite={true}
                infinite={infinite}
                // onTapCard={this.swipeLeft}
                cards={this.state.cards}
                // cardIndex={this.state.cardIndex}
                cardIndex={cardIndex}
                cardVerticalMargin={0}
                renderCard={this.renderCard}
                onSwipedAll={this.onSwipedAllCards}
                stackSize={10}
                stackSeparation={15}
                animateOverlayLabelsOpacity
                animateCardOpacity
                swipeBackCard
            >
            </Swiper>
        )
    }

    storeFinalValues(){
        const {finalClientUserID,finalTripSheetId,finalStartingKM,finalEndingKm,finalKmDifference,
            finalDeliveredPackages,finalTotalDeliveredCount,
            finalPenaltyAmount,finalPenaltyReason,finalShortCash,

            clientUserIdDetailsUpdated,
            tripSheetIdDetailsUpdated,
            kilometerDetailsUpdated,
            packageDetailsUpdated,
            shortCashDetailsUpdated,
            penaltyDetailsUpdated,

            tempClientUserId,
            tempTripSheetId,

            tempStartingKM,
            tempEndingKm,

            tempDeliveredPackages,
            totalDeliveredCount,

            shortCash,
            penalty,
            penaltyReason
        } =this.state;


        let totalCards = this.state.cards
        let tempIndex = this.state.cardIndex
        // console.log('tempIndex==>',tempIndex);

        let tempData = totalCards[tempIndex]


        {
            clientUserIdDetailsUpdated
                ?
                tempData.clientUserId = clientUserIdDetailsUpdated ? finalClientUserID : tempClientUserId
                :
                null
        }
        {
            tripSheetIdDetailsUpdated
                ?
                tempData.tripSheetId = tripSheetIdDetailsUpdated ? finalTripSheetId : tempTripSheetId
                :
                null
        }
        {
            kilometerDetailsUpdated
                ?
                tempData.startingKM = kilometerDetailsUpdated ? finalStartingKM ? JSON.parse(finalStartingKM) :'' : tempStartingKM ? JSON.parse(tempStartingKM) :''
                :
                null
        }
        {
            kilometerDetailsUpdated
                ?
                tempData.endingKm = kilometerDetailsUpdated ? finalEndingKm ? JSON.parse(finalEndingKm) :'' : tempEndingKm ? JSON.parse(tempEndingKm) :''
                :
                null
        }
        {
            kilometerDetailsUpdated
                ?
                tempData.tripDistance = kilometerDetailsUpdated ? finalKmDifference ? JSON.parse(finalKmDifference): '' : tempData.tripDistance ? JSON.parse(tempData.tripDistance) :''
                :
                null
        }

        {
            packageDetailsUpdated
                ?
                tempData.deliveredPackages = packageDetailsUpdated ? finalDeliveredPackages : tempDeliveredPackages
                :
                null
        }
        {
            packageDetailsUpdated
                ?
                tempData.packages = packageDetailsUpdated ? finalTotalDeliveredCount ? JSON.parse(finalTotalDeliveredCount) :'' : totalDeliveredCount ? JSON.parse(totalDeliveredCount):''
                :
                null
        }

        {
            penaltyDetailsUpdated
                ?
                tempData.penalty = penaltyDetailsUpdated ? finalPenaltyAmount ? JSON.parse(finalPenaltyAmount) : '' : penalty ? JSON.parse(penalty) :''
                :
                null
        }
        {
            penaltyDetailsUpdated
                ?
                tempData.penaltyReason = penaltyDetailsUpdated ? finalPenaltyReason : penaltyReason
                :
                null
        }
        {
            shortCashDetailsUpdated
                ?
                tempData.shortCash = shortCashDetailsUpdated ? finalShortCash ? JSON.parse(finalShortCash) :'' : shortCash ? JSON.parse(shortCash) :''
                :
                null
        }


        // console.log('tempData',tempData);
        // console.log('totalCards',totalCards);
        this.setState({cards:totalCards,
            cardIndex:tempIndex+1,
            editTripDetailsModal:false
        })
    }


    render() {
        const {
            reportsList,
            selectedReportData,
            accessToEditData,
            tempDeliveredPackages,
            selectedCardTripDetails,
            editButton,
            clientUserIdDetailsUpdated,
            tripSheetIdDetailsUpdated,
            kilometerDetailsUpdated,
            packageDetailsUpdated,
            shortCashDetailsUpdated,
            penaltyDetailsUpdated,
            tempRole,
            cardIndex
        } = this.state;
        // console.log('render cardIndex',cardIndex)
        // const colors = ['#D6D1B4', '#F3F2F2', '#FFEE93', '#ccf6d8', '#F8F1EC', '#ECF3AB', '#F4EDAB'];
        return (
            <View style={[Styles.flex1, Styles.bgWhite]}>
                {this.renderSpinner()}
                <OfflineNotice/>
                <Appbar.Header style={[Styles.bgDarkRed,Styles.jSpaceBet]}>
                    <Appbar.BackAction onPress={() => this.props.navigation.goBack()}/>
                    <Text
                        style={[Styles.ffRMedium,Styles.cLightWhite,Styles.aslCenter,Styles.f18]}>Trip Verification</Text>
                    <View style={[Styles.padH15]}/>
                </Appbar.Header>
                {/*<View style={{borderBottomWidth: 1, marginBottom: 5,marginTop:5, borderBottomColor: '#E1E1E1'}}/>*/}
                {this.renderSpinner()}
                <View style={[Styles.flex1, Styles.bgWhite]}>
                    {
                        this.state.siteInfo
                            ?
                            <ScrollView style={[Styles.marV15]}>
                                <TouchableOpacity
                                    onPress={() => {
                                        this.setState({filterSiteId: '',filterSiteCode:'ALL'}, () => {
                                            this.getDateListTripCount()
                                        })
                                    }}
                                    activeOpacity={0.7}
                                    style={[Styles.marH20, Styles.marV7, Styles.row, Styles.aslCenter, Styles.jSpaceBet, Styles.br5, Styles.padH20,Styles.padV15,
                                        Styles.bgLBlueWhite,Styles.TripReportsCardMainshadow, {
                                            width: Dimensions.get('window').width - 36
                                        }]}>

                                    <View style={[Styles.aslCenter]}>
                                        <Text
                                            style={[Styles.f18, Styles.ffRMedium, Styles.cGrey33, Styles.aslCenter]}>All</Text>
                                    </View>
                                    <View style={[Styles.alignCenter, Styles.row]}>
                                        <Text
                                            style={[Styles.f22, Styles.ffRMedium, Styles.cOrange, Styles.aslStart]}>{this.state.totalReports ? this.state.totalReports : 0}</Text>
                                        <MaterialIcons
                                            style={[Styles.aslCenter, Styles.mLt15, Styles.br8, {backgroundColor: '#F2F2F2'}, Styles.p3]}
                                            name="chevron-right" size={24} color="#4F4F4F"/>
                                    </View>
                                </TouchableOpacity>
                                <View style={{
                                    borderBottomWidth: 1,
                                    marginHorizontal: 16,
                                    marginVertical: 5,
                                    borderBottomColor: '#E1E1E1'
                                }}/>
                                <FlatList
                                    // style={[Styles.aslCenter]}
                                    data={this.state.siteInfo}
                                    renderItem={({item, index}) => {
                                        return (
                                            <TouchableOpacity
                                                onPress={() => {
                                                    this.setState({filterSiteId: item.siteId,filterSiteCode:item.siteCode}, () => {
                                                        this.getDateListTripCount()
                                                    })
                                                }}
                                                activeOpacity={0.7}
                                                style={[Styles.marH20, Styles.marV7, Styles.row, Styles.aslCenter, Styles.jSpaceBet, Styles.br5, Styles.padH20,Styles.padV15,
                                                    Styles.bgLBlueWhite,Styles.TripReportsCardMainshadow, {
                                                        width: Dimensions.get('window').width - 36
                                                    }]}>

                                                <View style={[Styles.aslCenter]}>
                                                    {/*<Text style={[Styles.f24, Styles.ffRMedium,Styles.cBlk,Styles.aslCenter ]}>{_.startCase(item.siteCode)}</Text>*/}
                                                    <Text
                                                        style={[Styles.f18, Styles.ffRMedium, Styles.cGrey33, Styles.aslCenter]}>{item.siteCode}</Text>
                                                </View>
                                                <View style={[Styles.alignCenter, Styles.row]}>
                                                    <Text
                                                        style={[Styles.f22, Styles.ffRMedium, Styles.cOrange, Styles.aslStart]}>{item.unverifiedCount ? item.unverifiedCount : 0}</Text>
                                                    <MaterialIcons
                                                        style={[Styles.aslCenter, Styles.mLt15, Styles.br8, {backgroundColor: '#F2F2F2'}, Styles.p3]}
                                                        name="chevron-right" size={24} color="#4F4F4F"/>
                                                </View>
                                            </TouchableOpacity>
                                        )
                                    }}
                                    extraData={this.state}
                                    keyExtractor={(item, index) => index.toString()}/>
                            </ScrollView>
                            :
                            <View style={[Styles.flex1, Styles.aitCenter, Styles.jCenter]}>
                                <Text style={[Styles.ffRBold, Styles.f20, Styles.alignCenter]}>No Shifts Found..</Text>
                            </View>
                    }

                </View>


                {/*MODALS START*/}

                {/*Trip Details Show Modal*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.tripDetailsCardModal}
                    onRequestClose={() => {
                        this.setState({tripDetailsCardModal: false},()=>{
                            this.getDateListTripCount()
                        })
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View style={[Styles.flex1, Styles.bgBlk, {
                            width: Dimensions.get('window').width,
                            height: Dimensions.get('window').height
                        }]}>
                            {this.state.spinnerBool === false ? null : <CSpinner/>}
                            <View style={[Styles.bgWhite, Styles.aslCenter, {
                                width: Dimensions.get('window').width,
                                height: Dimensions.get('window').height
                            }]}>
                                <View style={[Styles.flex1, Styles.bgWhite]}>
                                    <View style={{
                                        flex: 1,
                                        backgroundColor: 'rgba(0,0,0,0.5)'
                                    }}>
                                        {
                                            this.state.swipedAllCards === true || this.state.cards.length === 0
                                                ?
                                                <View style={{
                                                    width: Dimensions.get('window').width,
                                                    height: Dimensions.get('window').height,
                                                    alignSelf: 'center',
                                                    // backgroundColor: 'rgba(0,0,0,0.5)'
                                                }}>
                                                    <View style={[Styles.alignEndEnd, Styles.padH10, Styles.marV5]}>
                                                        <Text
                                                            style={[Styles.ffRBold, Styles.f18, Styles.padH15, Styles.br10, {
                                                                backgroundColor: '#D1FFE9',
                                                                color: '#03B675'
                                                            }]}>{this.state.cards.length}/{this.state.cards.length}</Text>
                                                    </View>
                                                    <View style={{
                                                        width: Dimensions.get('window').width - 20,
                                                        height: Dimensions.get('window').height - 70,
                                                        alignSelf: 'center',
                                                        backgroundColor: '#fff',
                                                        // margin:30,
                                                    }}>
                                                        <View style={[Styles.flex1, {padding: 10}]}>
                                                            <View
                                                                style={[Styles.flex1, Styles.aitCenter, Styles.jCenter]}>
                                                                <View style={[Styles.aitCenter, Styles.jCenter]}>
                                                                    {LoadSVG.thumps_Up_Icon}
                                                                </View>
                                                                <Text
                                                                    style={[Styles.f18, Styles.padH5, Styles.pTop15, Styles.ffRRegular, {color: 'rgba(0, 0, 0, 0.68)'}]}>All
                                                                    Done !</Text>
                                                            </View>

                                                            {/*FOOTER BUTTONS*/}
                                                            <View style={[Styles.aitEnd]}>
                                                                <View style={[Styles.row, Styles.jSpaceBet]}>
                                                                    <TouchableOpacity
                                                                        onPress={() => {
                                                                            this.setState({tripDetailsCardModal: false,}, () => {
                                                                                this.getDateListTripCount()
                                                                            })
                                                                        }}
                                                                        style={[Styles.alignCenter, Styles.marH10, Styles.padV5, {backgroundColor: '#C91A1F'}, Styles.OrdersScreenCardshadow, {flex: 3}]}>
                                                                        <Text
                                                                            style={[Styles.f18, Styles.padH5, Styles.padV5, Styles.ffRBold, Styles.cWhite]}>Go
                                                                            to Report</Text>
                                                                    </TouchableOpacity>
                                                                </View>
                                                            </View>
                                                        </View>
                                                    </View>
                                                </View>
                                                :
                                                this.deckSwiperData()
                                        }
                                    </View>
                                </View>


                            </View>


                        </View>
                    </View>
                </Modal>

                {/*EDIT TRIP DETAILS Modal*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.editTripDetailsModal}
                    onRequestClose={() => {
                        // this.setState({editTripDetailsModal: false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View>
                            <View style={[Styles.flex1]}/>
                            <View style={[Styles.bgWhite,{
                                width: Dimensions.get('window').width,
                                height: editModalHeight
                            }]}>
                                {this.state.spinnerBool === false ? null : <CSpinner/>}
                                <View style={[Styles.flex1, Styles.bgWhite,{borderTopRightRadius:10,
                                    borderTopLeftRadius:10}]}>
                                    <View
                                        style={[Styles.row, Styles.jSpaceBet, Styles.bgWhite, Styles.padV10, Styles.brdrBtm1, {borderBottomColor: '#D1D1D1',
                                            borderTopRightRadius:10,
                                            borderTopLeftRadius:10}]}>
                                        <Text style={[Styles.ffRMedium, Styles.f16, Styles.aslCenter, Styles.padH20,Styles.cBlack87,Styles.padV8]}>Edit
                                            Trip Information</Text>
                                        {/*<MaterialCommunityIcons name="window-close" size={32}*/}
                                        {/*                        color="#90c9e2" style={{marginRight: 10}}*/}
                                        {/*                        onPress={() =>*/}
                                        {/*                            this.storeFinalValues()*/}
                                        {/*                            // this.setState({editTripDetailsModal:false},()=>{*/}
                                        {/*                            //     this.getUnverifiedTripList()*/}
                                        {/*                            // })*/}
                                        {/*                        }/>*/}
                                    </View>

                                    {
                                        selectedCardTripDetails
                                            ?
                                            <View
                                                style={[Styles.row, Styles.jSpaceBet, Styles.bgWhite, {height:subEditHeightBy60}]}>

                                                {/*TITLES CARDS*/}
                                                <ScrollView style={[Styles.bgWhite,Styles.flex1,Styles.brdrRt1]}>

                                                    {
                                                        selectedCardTripDetails.attrs
                                                            ?
                                                            selectedCardTripDetails.attrs.requiresClientUserId === 'true'
                                                                ?
                                                                <View>
                                                                    <TouchableOpacity
                                                                        activeOpacity={0.7}
                                                                        onPress={() => {
                                                                            // this.setState({editButton: 'CLIENT_USER_ID'})
                                                                            this.useSelectedDataReport(selectedCardTripDetails, 'CLIENT_USER_ID')
                                                                        }}
                                                                        style={[Styles.row, Styles.padV20,Styles.padH15, Styles.jSpaceBet,Styles.bgLightWhite,Styles.OrdersScreenCardshadow]}>
                                                                        <View/>
                                                                        <Text
                                                                            style={[editButton === 'CLIENT_USER_ID' ? Styles.fWbold : null, Styles.ffRRegular,Styles.f14,Styles.cBlack68]}>Client
                                                                            User ID</Text>
                                                                        <View style={[Styles.aslCenter, Styles.padH5]}>
                                                                            {Services.returnCardStatusIcon(clientUserIdDetailsUpdated)}
                                                                        </View>
                                                                    </TouchableOpacity>
                                                                    <View style={{
                                                                        borderBottomWidth: 1,
                                                                        borderBottomColor: '#D1D1D1'
                                                                    }}/>
                                                                </View>
                                                                :
                                                                null
                                                            :
                                                            null
                                                    }

                                                    <View>
                                                        <TouchableOpacity
                                                            activeOpacity={0.7}
                                                            onPress={() => {
                                                                // this.setState({editButton: 'TRIP_SHEET_ID'})
                                                                this.useSelectedDataReport(selectedCardTripDetails, 'TRIP_SHEET_ID')
                                                            }}
                                                            style={[Styles.row, Styles.padV20,Styles.padH15, Styles.jSpaceBet,Styles.bgLightWhite,Styles.OrdersScreenCardshadow]}>
                                                            <View/>
                                                            <Text
                                                                style={[editButton === 'TRIP_SHEET_ID' ? Styles.fWbold : null, Styles.ffRRegular, Styles.f14,Styles.cBlack68]}>Trip
                                                                Sheet ID</Text>
                                                            <View style={[Styles.aslCenter, Styles.padH5]}>
                                                                {Services.returnCardStatusIcon(tripSheetIdDetailsUpdated)}
                                                            </View>
                                                        </TouchableOpacity>
                                                        <View style={{
                                                            borderBottomWidth: 1,
                                                            borderBottomColor: '#D1D1D1'
                                                        }}/>
                                                    </View>

                                                    {
                                                        tempRole === 1 || tempRole === 10
                                                            ?
                                                            <View>
                                                                <TouchableOpacity
                                                                    activeOpacity={0.7}
                                                                    onPress={() => {
                                                                        // this.setState({editButton: 'PACKAGES'})
                                                                        this.useSelectedDataReport(selectedCardTripDetails, 'PACKAGES')
                                                                    }}
                                                                    style={[Styles.row, Styles.padV20,Styles.padH15, Styles.jSpaceBet,Styles.bgLightWhite,Styles.OrdersScreenCardshadow]}>
                                                                    <View/>
                                                                    <Text
                                                                        style={[editButton === 'PACKAGES' ? Styles.fWbold : null, Styles.ffRRegular,Styles.f14,Styles.cBlack68]}>Packages</Text>
                                                                    <View style={[Styles.aslCenter, Styles.padH5]}>
                                                                        {Services.returnCardStatusIcon(packageDetailsUpdated)}
                                                                    </View>
                                                                </TouchableOpacity>
                                                                <View style={{
                                                                    borderBottomWidth: 1,
                                                                    borderBottomColor: '#D1D1D1'
                                                                }}/>
                                                            </View>
                                                            :
                                                            null
                                                    }

                                                    {
                                                        tempRole === 5 || tempRole === 10
                                                            ?
                                                            <View>
                                                                <TouchableOpacity
                                                                    activeOpacity={0.7}
                                                                    onPress={() => {
                                                                        // this.setState({editButton: 'KILOMETER'})
                                                                        this.useSelectedDataReport(selectedCardTripDetails, 'KILOMETER')
                                                                    }}
                                                                    style={[Styles.row, Styles.padV20,Styles.padH15, Styles.jSpaceBet,Styles.bgLightWhite,Styles.OrdersScreenCardshadow]}>
                                                                    <View/>
                                                                    <Text
                                                                        style={[editButton === 'KILOMETER' ? Styles.fWbold : null, Styles.ffRRegular,Styles.f14,Styles.cBlack68]}>Kilometer</Text>
                                                                    <View style={[Styles.aslCenter, Styles.padH5]}>
                                                                        {Services.returnCardStatusIcon(kilometerDetailsUpdated)}
                                                                    </View>
                                                                </TouchableOpacity>
                                                                <View style={{
                                                                    borderBottomWidth: 1,
                                                                    borderBottomColor: '#D1D1D1'
                                                                }}/>
                                                            </View>
                                                            :
                                                            null
                                                    }

                                                    {/*SHORT CASH*/}
                                                    <View>
                                                        <TouchableOpacity
                                                            activeOpacity={0.7}
                                                            onPress={() => {
                                                                // this.setState({editButton: 'PACKAGES'})
                                                                this.useSelectedDataReport(selectedCardTripDetails, 'SHORT_CASH')
                                                            }}
                                                            style={[Styles.row,  Styles.padV20,Styles.padH15, Styles.jSpaceBet,Styles.bgLightWhite,Styles.OrdersScreenCardshadow]}>
                                                            <View/>
                                                            <Text
                                                                style={[editButton === 'SHORT_CASH' ? Styles.fWbold : null, Styles.ffRRegular,Styles.f14,Styles.cBlack68]}>Short
                                                                Cash</Text>
                                                            <View style={[Styles.aslCenter, Styles.padH5]}>
                                                                {Services.returnCardStatusIcon(shortCashDetailsUpdated)}
                                                            </View>
                                                        </TouchableOpacity>
                                                        <View style={{
                                                            borderBottomWidth: 1,
                                                            borderBottomColor: '#D1D1D1'
                                                        }}/>
                                                    </View>

                                                    {/*PENALTY*/}
                                                    <View>
                                                        <TouchableOpacity
                                                            activeOpacity={0.7}
                                                            onPress={() => {
                                                                // this.setState({editButton: 'PACKAGES'})
                                                                this.useSelectedDataReport(selectedCardTripDetails, 'PENALTY')
                                                            }}
                                                            style={[Styles.row, Styles.padV20,Styles.padH15, Styles.jSpaceBet,Styles.bgLightWhite,Styles.OrdersScreenCardshadow]}>
                                                            <View/>
                                                            <Text
                                                                style={[editButton === 'PENALTY' ? Styles.fWbold : null, Styles.ffRRegular,Styles.f14,Styles.cBlack68]}>Penalty</Text>
                                                            <View style={[Styles.aslCenter, Styles.padH5]}>
                                                                {Services.returnCardStatusIcon(penaltyDetailsUpdated)}
                                                            </View>
                                                        </TouchableOpacity>
                                                        <View style={{
                                                            borderBottomWidth: 1,
                                                            borderBottomColor: '#D1D1D1'
                                                        }}/>
                                                    </View>

                                                    <View style={{marginVertical:40}}/>
                                                </ScrollView>

                                                <View style={[{flex: 1.4}, Styles.bgWhite]}>

                                                    {
                                                        editButton === 'CLIENT_USER_ID'
                                                            ?
                                                            <ScrollView style={[Styles.flex1,Styles.p15, ]}>
                                                                <Text style={[Styles.ffRLight, Styles.f18,Styles.cBlack87]}>Client
                                                                    User ID</Text>
                                                                <ScrollView
                                                                    style={[{height: subEditHeightBy60-100}]}>
                                                                    <Text
                                                                        style={[Styles.ffRRegular, Styles.f14, Styles.pTop15,Styles.cGrey33]}>Entered by Partner</Text>
                                                                    <View
                                                                        style={[Styles.aslCenter, Styles.bgLBlueWhite,Styles.mTop10,Styles.p10,  {
                                                                            width: subEditDetialsWidth
                                                                        }]}>
                                                                        <Text
                                                                            numberOfLines={4}
                                                                            style={[Styles.ffRMedium, Styles.f16,Styles.cGrey4F]}>{clientUserIdDetailsUpdated ? this.state.finalClientUserID : selectedCardTripDetails.clientUserId}</Text>
                                                                    </View>

                                                                    <Text
                                                                        style={[Styles.ffRRegular, Styles.f14, Styles.pTop15,Styles.cGrey33]}>Update Client User ID</Text>

                                                                    <TextInput
                                                                        style={[Styles.aslCenter, Styles.bw1, Styles.bcLightBlue, Styles.mTop10,Styles.cGrey33,Styles.ffRMedium, {
                                                                            // width: 80,
                                                                            width: subEditDetialsWidth,
                                                                            // fontWeight: 'bold',
                                                                            fontSize: 16,
                                                                            padding: 10
                                                                        }]}
                                                                        selectionColor={"black"}
                                                                        // numberOfLines={4}
                                                                        multiline={true}
                                                                        returnKeyType="done"
                                                                        onSubmitEditing={() => {Keyboard.dismiss()}}
                                                                        onChangeText={(tempClientUserId) => this.setState({tempClientUserId})}
                                                                        value={this.state.tempClientUserId}
                                                                    />
                                                                </ScrollView>
                                                                <View
                                                                    style={[Styles.jSpaceBet, Styles.row,Styles.mBtm10]}>
                                                                    <TouchableOpacity
                                                                        onPress={() => this.storeFinalValues()}
                                                                        activeOpacity={0.7}
                                                                        style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth/4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                        <Text
                                                                            style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                color: '#C91A1F'
                                                                            }, Styles.aslCenter, Styles.p5]}>Exit</Text>
                                                                    </TouchableOpacity>

                                                                    <TouchableOpacity
                                                                        onPress={() => {
                                                                            let resp = {}
                                                                            resp = Utils.isValidClientUserIdTrips(this.state.tempClientUserId);
                                                                            if (resp.status === true) {
                                                                                // this.updateTrip()
                                                                                this.setState({finalClientUserID:this.state.tempClientUserId,clientUserIdDetailsUpdated:true},()=>{
                                                                                    Utils.dialogBox('Details Updated','');
                                                                                })
                                                                            } else {
                                                                                Utils.dialogBox(resp.message, '');
                                                                            }
                                                                        }}
                                                                        activeOpacity={0.7}
                                                                        style={[Styles.aslCenter, {backgroundColor: '#C91A1F',width:windowWidth/4.3}, Styles.br5, Styles.padV5, Styles.OrdersScreenCardshadow]}>
                                                                        <Text
                                                                            style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, Styles.cWhite, Styles.aslCenter, Styles.p5]}>Done</Text>
                                                                    </TouchableOpacity>
                                                                </View>
                                                            </ScrollView>
                                                            :
                                                            editButton === 'TRIP_SHEET_ID'
                                                                ?
                                                                <ScrollView
                                                                    style={[Styles.flex1,Styles.p15]}>
                                                                    <Text style={[Styles.ffRLight, Styles.f18,Styles.cBlack87]}>Trip
                                                                        Sheet ID</Text>
                                                                    <ScrollView
                                                                        style={[{height:subEditHeightBy60-100}]}>
                                                                        <Text
                                                                            style={[Styles.ffRRegular, Styles.f14, Styles.pTop15,Styles.cGrey33]}>Entered by Partner</Text>
                                                                        <View
                                                                            style={[Styles.aslCenter, Styles.bgLBlueWhite,Styles.mTop10,Styles.p10, {
                                                                                width: subEditDetialsWidth,
                                                                            }]}>
                                                                            <Text
                                                                                numberOfLines={4}
                                                                                style={[Styles.ffRRegular, Styles.f18,Styles.cGrey4F]}>{tripSheetIdDetailsUpdated ? this.state.finalTripSheetId : selectedCardTripDetails.tripSheetId}</Text>
                                                                        </View>

                                                                        <Text
                                                                            style={[Styles.ffRRegular, Styles.f14, Styles.pTop15,Styles.cGrey33]}>Corrected</Text>
                                                                        <TextInput
                                                                            style={[Styles.aitStart, Styles.bw1, Styles.bcLightBlue, Styles.mTop10,Styles.cGrey33, {
                                                                                width: subEditDetialsWidth,
                                                                                // fontWeight: 'bold',
                                                                                fontSize: 16,
                                                                                padding:10
                                                                            }]}
                                                                            selectionColor={"black"}
                                                                            // numberOfLines={4}
                                                                            multiline={true}
                                                                            returnKeyType="done"
                                                                            onSubmitEditing={() => {Keyboard.dismiss()}}
                                                                            onChangeText={(tempTripSheetId) => this.setState({tempTripSheetId})}
                                                                            value={this.state.tempTripSheetId}
                                                                        />

                                                                    </ScrollView>
                                                                    <View
                                                                        style={[Styles.jSpaceBet, Styles.row,Styles.marV10]}>
                                                                        <TouchableOpacity
                                                                            onPress={() => this.storeFinalValues()}
                                                                            activeOpacity={0.7}
                                                                            style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth/4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                            <Text
                                                                                style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                    color: '#C91A1F'
                                                                                }, Styles.aslCenter, Styles.p5]}>Exit</Text>
                                                                        </TouchableOpacity>

                                                                        <TouchableOpacity
                                                                            onPress={() => {
                                                                                let resp = {}
                                                                                resp = Utils.checkIsValidTripSheetId(this.state.tempTripSheetId, 'Trip Sheet Id');
                                                                                if (resp.status === true) {
                                                                                    // this.updateTrip()
                                                                                    this.setState({finalTripSheetId:this.state.tempTripSheetId,tripSheetIdDetailsUpdated:true},()=>{
                                                                                        Utils.dialogBox('Details Updated','');
                                                                                    })
                                                                                } else {
                                                                                    Utils.dialogBox(resp.message, '');
                                                                                }
                                                                            }}
                                                                            activeOpacity={0.7}
                                                                            style={[Styles.aslCenter, {backgroundColor: '#C91A1F',width: windowWidth/4.3}, Styles.br5,Styles.padV5, Styles.OrdersScreenCardshadow]}>
                                                                            <Text
                                                                                style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, Styles.cWhite, Styles.aslCenter, Styles.p5]}>Done</Text>
                                                                        </TouchableOpacity>
                                                                    </View>
                                                                </ScrollView>
                                                                :
                                                                editButton === 'KILOMETER'
                                                                    ?
                                                                    <View
                                                                        style={[Styles.flex1,Styles.p15]}>
                                                                        <Text
                                                                            style={[Styles.ffRLight, Styles.f18,Styles.cBlack87]}>Delivery</Text>
                                                                        <ScrollView
                                                                            style={[{height: subEditHeightBy60-100}]}>

                                                                            <View>
                                                                                <Text
                                                                                    style={[Styles.ffRRegular, Styles.f14, Styles.pTop15,Styles.cGrey4F]}>Start
                                                                                    Km</Text>

                                                                                <View>
                                                                                    <View>
                                                                                        <TouchableOpacity
                                                                                            style={[Styles.row, Styles.aslCenter]}
                                                                                            onPress={() => {
                                                                                                this.setState({
                                                                                                    imagePreview: true,
                                                                                                    imagePreviewURL: selectedCardTripDetails.startOdometerReadingUploadUrl
                                                                                                })
                                                                                            }}>
                                                                                            <Image
                                                                                                onLoadStart={() => this.setState({imageLoading: true})}
                                                                                                onLoadEnd={() => this.setState({imageLoading: false})}
                                                                                                style={[{
                                                                                                    width: windowWidth/2,
                                                                                                    height: 98
                                                                                                }, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                                                                source={selectedCardTripDetails.startOdometerReadingUploadUrl ? {uri: selectedCardTripDetails.startOdometerReadingUploadUrl} : null}
                                                                                            />
                                                                                        </TouchableOpacity>
                                                                                        <ActivityIndicator
                                                                                            style={[Styles.ImageUploadActivityIndicator]}
                                                                                            animating={this.state.imageLoading}
                                                                                        />
                                                                                    </View>
                                                                                    {/*<View*/}
                                                                                    {/*    style={[Styles.posAbsolute, {top: 0}]}>*/}
                                                                                    {/*    <Text*/}
                                                                                    {/*        style={[Styles.f16, Styles.cWhite, Styles.bgGrn,Styles.ffRRegular]}>Actual</Text>*/}
                                                                                    {/*</View>*/}
                                                                                </View>

                                                                                {/*<View>*/}
                                                                                {/*    {LoadSVG.odometer_image}*/}
                                                                                {/*    <View*/}
                                                                                {/*        style={[Styles.posAbsolute, {top: 0}]}>*/}
                                                                                {/*        <Text*/}
                                                                                {/*            style={[Styles.f16, Styles.cWhite, Styles.bgRed,Styles.ffRRegular]}>Dummy</Text>*/}
                                                                                {/*</View>*/}
                                                                                <TextInput
                                                                                    style={[Styles.aitStart, Styles.bw1, Styles.bcLightAsh, Styles.mTop10,Styles.cGrey33,Styles.ffRMedium,
                                                                                        {
                                                                                            width: windowWidth/2,
                                                                                            // fontWeight: 'bold',
                                                                                            fontSize: 16,
                                                                                            padding:10
                                                                                        }]}
                                                                                    selectionColor={"black"}
                                                                                    maxLength={6}
                                                                                    keyboardType='numeric'
                                                                                    returnKeyType="done"
                                                                                    onSubmitEditing={() => {Keyboard.dismiss()}}
                                                                                    onChangeText={(tempStartingKM) => this.OdometerReadingValidate(tempStartingKM, 'onChange', 'startingKM')}
                                                                                    value={this.state.tempStartingKM}
                                                                                />
                                                                            </View>

                                                                            <View>
                                                                                <Text
                                                                                    style={[Styles.ffRRegular, Styles.f14, Styles.pTop10,Styles.cGrey33]}>End
                                                                                    Km</Text>

                                                                                <View>
                                                                                    <View>
                                                                                        <TouchableOpacity
                                                                                            style={[Styles.row, Styles.aslCenter]}
                                                                                            onPress={() => {
                                                                                                this.setState({
                                                                                                    imagePreview: true,
                                                                                                    imagePreviewURL: selectedCardTripDetails.endOdometerReadingUploadUrl
                                                                                                })
                                                                                            }}>
                                                                                            <Image
                                                                                                onLoadStart={() => this.setState({imageLoading: true})}
                                                                                                onLoadEnd={() => this.setState({imageLoading: false})}
                                                                                                style={[{
                                                                                                    width: windowWidth/2,
                                                                                                    height: 98
                                                                                                }, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                                                                source={selectedCardTripDetails.endOdometerReadingUploadUrl ? {uri: selectedCardTripDetails.endOdometerReadingUploadUrl} : null}
                                                                                            />
                                                                                        </TouchableOpacity>
                                                                                        <ActivityIndicator
                                                                                            style={[Styles.ImageUploadActivityIndicator]}
                                                                                            animating={this.state.imageLoading}
                                                                                        />
                                                                                    </View>
                                                                                </View>

                                                                                <TextInput
                                                                                    style={[Styles.aitStart, Styles.bw1, Styles.bcLightAsh, Styles.mTop10,Styles.ffRMedium,Styles.cGrey33, {
                                                                                        // width: 80,
                                                                                        width:windowWidth/2,
                                                                                        // fontWeight: 'bold',
                                                                                        fontSize: 16,
                                                                                        padding:10
                                                                                    }]}
                                                                                    selectionColor={"black"}
                                                                                    maxLength={6}
                                                                                    keyboardType='numeric'
                                                                                    onChangeText={(tempEndingKm) => this.OdometerReadingValidate(tempEndingKm, 'onChange', 'endingKm')}
                                                                                    value={this.state.tempEndingKm}
                                                                                />
                                                                            </View>


                                                                        </ScrollView>
                                                                        <View
                                                                            style={[Styles.jSpaceBet, Styles.row,Styles.mTop5]}>
                                                                            <TouchableOpacity
                                                                                onPress={() => this.storeFinalValues()}
                                                                                activeOpacity={0.7}
                                                                                style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth/4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                                <Text
                                                                                    style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                        color: '#C91A1F'
                                                                                    }, Styles.aslCenter, Styles.p5]}>Exit</Text>
                                                                            </TouchableOpacity>

                                                                            <TouchableOpacity
                                                                                // onPress={()=>{
                                                                                //     if (this.state.tempStartingKM <= this.state.tempEndingKm) {
                                                                                //         // this.updateTrip()
                                                                                //         this.setState({finalStartingKM:this.state.tempStartingKM,finalEndingKm:this.state.tempEndingKm,
                                                                                //             kilometerDetailsUpdated:true},()=>{
                                                                                //             Utils.dialogBox('Details Updated','');
                                                                                //         })
                                                                                //     } else {
                                                                                //         Utils.dialogBox('End KM readings are less than start', '');
                                                                                //     }
                                                                                // }
                                                                                // }
                                                                                onPress={() => {
                                                                                    let resp = {}
                                                                                    resp = Utils.CompareOdometerReadings(this.state.tempStartingKM,this.state.tempEndingKm);
                                                                                    if (resp.status === true) {

                                                                                        this.setState({
                                                                                            finalStartingKM:this.state.tempStartingKM,
                                                                                            finalEndingKm:this.state.tempEndingKm,
                                                                                            finalKmDifference:resp.message,
                                                                                            kilometerDetailsUpdated: true
                                                                                        }, () => {
                                                                                            Utils.dialogBox('Details Updated', '')
                                                                                        })

                                                                                    }else {
                                                                                        Utils.dialogBox(resp.message, '');
                                                                                    }
                                                                                }}
                                                                                activeOpacity={0.7}
                                                                                style={[Styles.aslCenter, {backgroundColor: '#C91A1F',width:windowWidth/4.3}, Styles.br5, Styles.padV5, Styles.OrdersScreenCardshadow]}>
                                                                                <Text
                                                                                    style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, Styles.cWhite, Styles.aslCenter, Styles.p5]}>Done</Text>
                                                                            </TouchableOpacity>
                                                                        </View>
                                                                    </View>
                                                                    :
                                                                    editButton === 'PACKAGES'
                                                                        ?
                                                                        <View
                                                                            style={[Styles.flex1,Styles.p15]}>
                                                                            <Text
                                                                                style={[Styles.ffRLight, Styles.f18,Styles.cBlack87]}>Delivery</Text>

                                                                            <Text
                                                                                style={[Styles.ffRRegular, Styles.f14, Styles.mTop5,Styles.cGrey33]}>Total
                                                                                Count</Text>
                                                                            <View
                                                                                style={[Styles.aslCenter, Styles.bgLBlueWhite, Styles.p10, Styles.mTop5, {
                                                                                    width: subEditDetialsWidth,
                                                                                }]}>
                                                                                <Text
                                                                                    // style={[Styles.ffRRegular, Styles.f18]}>{this.state.totalDeliveredCount}/{this.state.pickupPackages}</Text>
                                                                                    style={[Styles.ffRMedium, Styles.f18,Styles.cGrey4F]}>{this.state.totalDeliveredCount}</Text>
                                                                            </View>


                                                                            <ScrollView
                                                                                persistentScrollbar={true}
                                                                                style={[{height:subEditHeightBy60/1.2},Styles.marV5]}
                                                                            >
                                                                                <FlatList
                                                                                    data={tempDeliveredPackages}
                                                                                    // data={selectedCardTripDetails.deliveredPackages}
                                                                                    renderItem={({item, index}) =>
                                                                                        <View style={[Styles.marH10,Styles.mTop3]}>
                                                                                            <Text
                                                                                                numberOfLines={1}
                                                                                                style={[Styles.ffRRegular, Styles.f14, Styles.padV3,Styles.pRight15,Styles.cGrey33]}>{_.startCase(_.lowerCase(item.name))}</Text>
                                                                                            <View
                                                                                                style={[Styles.row, Styles.jSpaceBet, {paddingRight: 10}]}>
                                                                                                <TouchableOpacity
                                                                                                    style={[Styles.aslCenter]}
                                                                                                    disabled={item.count === 0}
                                                                                                    onPress={() => this.deliveredPackageValidation(tempDeliveredPackages[index].count, 'Decrement', 'deliveredPackages', index)}
                                                                                                >
                                                                                                    <Text
                                                                                                        style={[Styles.ffRRegular, Styles.bw1, Styles.bgBlk, Styles.padH20, Styles.padV10, Styles.cWhite, Styles.f20]}
                                                                                                    >-</Text></TouchableOpacity>
                                                                                                <View style={[Styles.marH20]}>
                                                                                                    <TextInput
                                                                                                        style={[Styles.txtAlignCen, Styles.bw1, Styles.bcAsh,Styles.ffRMedium,Styles.cGrey33, {
                                                                                                            // width: 80,
                                                                                                            width: windowWidth/6,
                                                                                                            // fontWeight: 'bold',
                                                                                                            fontSize: 16
                                                                                                        }]}
                                                                                                        selectionColor={"black"}
                                                                                                        // editable={accessToEditData}
                                                                                                        maxLength={6}
                                                                                                        keyboardType='numeric'
                                                                                                        returnKeyType="done"
                                                                                                        onSubmitEditing={() => {Keyboard.dismiss()}}
                                                                                                        onChangeText={(value) => this.deliveredPackageValidation(value, 'onChange', 'deliveredPackages', index)}
                                                                                                        // value={tempDeliveredPackages[index].value}
                                                                                                        value={item.count === '' ? item.count : JSON.stringify(item.count)}
                                                                                                    />
                                                                                                </View>
                                                                                                <TouchableOpacity
                                                                                                    style={[Styles.aslCenter]}
                                                                                                    disabled={item.count === 999998}
                                                                                                    onPress={() => this.deliveredPackageValidation(item.count, 'Increment', 'deliveredPackages', index)}
                                                                                                >
                                                                                                    <Text
                                                                                                        style={[Styles.ffRRegular, Styles.bw1, Styles.bgBlk, Styles.padH15, Styles.padV10, Styles.cWhite, Styles.f20]}
                                                                                                    >+</Text></TouchableOpacity>
                                                                                            </View>

                                                                                        </View>

                                                                                    }
                                                                                    keyExtractor={(index, item) => JSON.stringify(item) + index}
                                                                                    extraData={this.state}/>
                                                                            </ScrollView>

                                                                            <View
                                                                                style={[Styles.jSpaceBet, Styles.row,Styles.mTop3]}>
                                                                                <TouchableOpacity
                                                                                    onPress={() => this.storeFinalValues()}
                                                                                    // onPress={() => this.revertValues()}
                                                                                    activeOpacity={0.7}
                                                                                    style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth/4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                                    <Text
                                                                                        style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                            color: '#C91A1F'
                                                                                        }, Styles.aslCenter, Styles.p5]}>Exit</Text>
                                                                                </TouchableOpacity>

                                                                                <TouchableOpacity
                                                                                    onPress={() => {
                                                                                        // this.updateTrip()
                                                                                        this.setState({finalDeliveredPackages:this.state.tempDeliveredPackages,
                                                                                            finalTotalDeliveredCount:this.state.totalDeliveredCount,
                                                                                            packageDetailsUpdated:true},()=>{
                                                                                            Utils.dialogBox('Details Updated','');
                                                                                        })
                                                                                    }}
                                                                                    activeOpacity={0.7}
                                                                                    style={[Styles.aslCenter, {backgroundColor: '#C91A1F',width:windowWidth/4.3},
                                                                                        Styles.br5, Styles.padH20, Styles.padV5, Styles.OrdersScreenCardshadow]}>
                                                                                    <Text
                                                                                        style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, Styles.cWhite, Styles.aslCenter, Styles.p5]}>Done</Text>
                                                                                </TouchableOpacity>
                                                                            </View>

                                                                        </View>
                                                                        :
                                                                        editButton === 'SHORT_CASH'
                                                                            ?
                                                                            <ScrollView
                                                                                style={[Styles.flex1,Styles.p15]}>
                                                                                <Text
                                                                                    style={[Styles.ffRLight, Styles.f18,Styles.cBlack87]}>Short
                                                                                    Cash</Text>
                                                                                <ScrollView
                                                                                    style={[{height: subEditHeightBy60-100}]}>

                                                                                    <Text
                                                                                        style={[Styles.ffRRegular, Styles.f18,Styles.cGrey33,Styles.mTop10]}>Amount</Text>
                                                                                    <View style={[Styles.row ,Styles.mTop5,]}>
                                                                                        <Text
                                                                                            style={[Styles.f36, Styles.cOrangered, Styles.fWbold, Styles.ffRRegular, Styles.aslEnd, Styles.pRight3]}>&#x20B9;</Text>

                                                                                        <TextInput
                                                                                            style={[Styles.aitStart, Styles.bw1, Styles.bcAsh,Styles.cGrey33,Styles.ffRMedium, {
                                                                                                // width: 80,
                                                                                                width: subEditDetialsWidth-20,
                                                                                                // fontWeight: 'bold',
                                                                                                fontSize: 16,
                                                                                                padding: 10
                                                                                            }]}
                                                                                            placeholder={'Type here'}
                                                                                            selectionColor={"black"}
                                                                                            keyboardType='numeric'
                                                                                            // multiline={true}
                                                                                            returnKeyType="done"
                                                                                            onSubmitEditing={() => {Keyboard.dismiss()}}
                                                                                            onChangeText={(shortCash) => this.setState({shortCash})}
                                                                                            value={this.state.shortCash}
                                                                                        />
                                                                                    </View>

                                                                                </ScrollView>
                                                                                <View
                                                                                    style={[Styles.jSpaceBet, Styles.row,Styles.marV10]}>
                                                                                    <TouchableOpacity
                                                                                        onPress={() => this.storeFinalValues()}
                                                                                        activeOpacity={0.7}
                                                                                        style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth/4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                                        <Text
                                                                                            style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                                color: '#C91A1F'
                                                                                            }, Styles.aslCenter, Styles.p5]}>Exit</Text>
                                                                                    </TouchableOpacity>

                                                                                    <TouchableOpacity
                                                                                        onPress={() => {
                                                                                            let resp = {}
                                                                                            resp = Utils.isValidNumberEntered(this.state.shortCash, 'Short Cash');
                                                                                            if (resp.status === true) {
                                                                                                // shortCashDetailsUpdated:false,penaltyDetailsUpdated:false,
                                                                                                this.setState({finalShortCash:this.state.shortCash,
                                                                                                    shortCashDetailsUpdated: true}, () => {
                                                                                                    Utils.dialogBox('Details Updated', '')
                                                                                                })
                                                                                            } else {
                                                                                                Utils.dialogBox(resp.message, '');
                                                                                            }
                                                                                        }}
                                                                                        activeOpacity={0.7}
                                                                                        style={[Styles.aslCenter, {backgroundColor: '#C91A1F',width:windowWidth/4.3}, Styles.br5, Styles.padV5, Styles.OrdersScreenCardshadow]}>
                                                                                        <Text
                                                                                            style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, Styles.cWhite, Styles.aslCenter, Styles.p5]}>Done</Text>
                                                                                    </TouchableOpacity>
                                                                                </View>
                                                                            </ScrollView>
                                                                            :
                                                                            editButton === 'PENALTY'
                                                                                ?
                                                                                <ScrollView
                                                                                    style={[Styles.flex1,Styles.p15]}>
                                                                                    <Text
                                                                                        style={[Styles.ffRLight, Styles.f20,Styles.cBlack87]}>Penalty</Text>
                                                                                    <ScrollView
                                                                                        style={[{height:subEditHeightBy60-100}]}>

                                                                                        <Text
                                                                                            style={[Styles.ffRRegular, Styles.f18,Styles.cGrey33,Styles.mTop10]}>Amount</Text>
                                                                                        <View style={[Styles.row ,Styles.mTop5,]}>
                                                                                            <Text
                                                                                                style={[Styles.f36, Styles.cOrangered, Styles.fWbold, Styles.ffRRegular, Styles.aslEnd, Styles.pRight3]}>&#x20B9;</Text>

                                                                                            <TextInput
                                                                                                style={[Styles.aitStart, Styles.bw1, Styles.bcAsh,Styles.cGrey33,Styles.ffRMedium, {
                                                                                                    // width: 80,
                                                                                                    width: subEditDetialsWidth-20,
                                                                                                    // fontWeight: 'bold',
                                                                                                    fontSize: 16,
                                                                                                    padding: 10
                                                                                                }]}
                                                                                                placeholder={'Type here'}
                                                                                                selectionColor={"black"}
                                                                                                keyboardType='numeric'
                                                                                                // multiline={true}
                                                                                                returnKeyType="done"
                                                                                                onSubmitEditing={() => {Keyboard.dismiss()}}
                                                                                                onChangeText={(penalty) => this.setState({penalty})}
                                                                                                value={this.state.penalty}
                                                                                            />
                                                                                        </View>

                                                                                        <Text
                                                                                            style={[Styles.ffRRegular, Styles.f18,Styles.cGrey33,Styles.mTop10]}>Reason for Penalty</Text>
                                                                                        <TextInput
                                                                                            style={[Styles.aitStart, Styles.bw1, Styles.bcAsh, Styles.mTop5,Styles.cGrey33,Styles.ffRMedium, {
                                                                                                // width: 80,
                                                                                                width: subEditDetialsWidth,
                                                                                                // fontWeight: 'bold',
                                                                                                fontSize: 16,
                                                                                                padding: 10
                                                                                            }]}
                                                                                            placeholder={'Type here'}
                                                                                            selectionColor={"black"}
                                                                                            multiline={true}
                                                                                            returnKeyType="done"
                                                                                            onSubmitEditing={() => {Keyboard.dismiss()}}
                                                                                            onChangeText={(penaltyReason) => this.setState({penaltyReason})}
                                                                                            value={this.state.penaltyReason}
                                                                                        />

                                                                                    </ScrollView>
                                                                                    <View
                                                                                        style={[Styles.jSpaceBet, Styles.row]}>
                                                                                        <TouchableOpacity
                                                                                            onPress={() => this.storeFinalValues()}
                                                                                            activeOpacity={0.7}
                                                                                            style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth/4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite,
                                                                                                Styles.OrdersScreenCardshadow]}>
                                                                                            <Text
                                                                                                style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                                    color: '#C91A1F'
                                                                                                }, Styles.aslCenter, Styles.p5]}>Exit</Text>
                                                                                        </TouchableOpacity>

                                                                                        <TouchableOpacity
                                                                                            onPress={() => {
                                                                                                let resp = {}
                                                                                                resp = Utils.isValidNumberEntered(this.state.penalty, 'Penalty Amount');
                                                                                                if (resp.status === true) {
                                                                                                    resp = Utils.isValidReasonCheck(this.state.penaltyReason);
                                                                                                    if (resp.status === true) {

                                                                                                        this.setState({
                                                                                                            finalPenaltyAmount: this.state.penalty,
                                                                                                            finalPenaltyReason: this.state.penaltyReason,
                                                                                                            penaltyDetailsUpdated: true
                                                                                                        }, () => {
                                                                                                            Utils.dialogBox('Details Updated', '')
                                                                                                        })
                                                                                                    } else {
                                                                                                        Utils.dialogBox(resp.message, '');
                                                                                                    }
                                                                                                }else {
                                                                                                    Utils.dialogBox(resp.message, '');
                                                                                                }
                                                                                            }}
                                                                                            activeOpacity={0.7}
                                                                                            style={[Styles.aslCenter, {backgroundColor: '#C91A1F',width:windowWidth/4.3}, Styles.br5,Styles.padV5, Styles.OrdersScreenCardshadow]}>
                                                                                            <Text
                                                                                                style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, Styles.cWhite, Styles.aslCenter, Styles.p5]}>Done</Text>
                                                                                        </TouchableOpacity>
                                                                                    </View>
                                                                                </ScrollView>
                                                                                :
                                                                                null
                                                    }
                                                </View>


                                            </View>
                                            :
                                            null
                                    }

                                </View>

                            </View>
                        </View>

                    </View>
                </Modal>

                {/*DATE BASED COUNT SHOW Modal*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.dateBasedCountModal}
                    onRequestClose={() => {
                        this.setState({dateBasedCountModal: false},()=>{
                            this.getmappedSitesTripCount()
                        })
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View style={[Styles.flex1, Styles.bgWhite, {
                            width: Dimensions.get('window').width,
                            height: Dimensions.get('window').height
                        }]}>
                            {this.state.spinnerBool === false ? null : <CSpinner/>}
                            <Appbar.Header style={[Styles.bgDarkRed,Styles.jSpaceBet]}>
                                <Appbar.BackAction onPress={() =>   this.setState({dateBasedCountModal: false},()=>{
                                    this.getmappedSitesTripCount()
                                })
                                }/>
                                <Text
                                    style={[Styles.ffRMedium,Styles.cLightWhite,Styles.aslCenter,Styles.f18]}>{this.state.filterSiteCode+' -'} Unverified Trips</Text>
                                <View style={[Styles.padH15]}/>
                            </Appbar.Header>
                            <View style={[Styles.flex1]}>
                                {/*<Text style={[Styles.ffRBold, Styles.f18, Styles.txtAlignCen, Styles.marV15]}>Unverified*/}
                                {/*    Trips</Text>*/}
                                {
                                    this.state.pendingDatesInfo.length === 0
                                        ?
                                        <View style={[Styles.flex1, Styles.aitCenter, Styles.jCenter]}>
                                            <Text style={[Styles.ffRBold, Styles.f18, Styles.alignCenter]}>No Shifts
                                                Found..</Text>
                                        </View>
                                        :
                                        <FlatList
                                            // style={[Styles.aslCenter]}
                                            style={[Styles.mTop10]}
                                            data={this.state.pendingDatesInfo}
                                            renderItem={({item, index}) => {
                                                return (
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            this.setState({filterDate: item.tripDateStr}, () => {
                                                                this.getUnverifiedTripList()
                                                            })
                                                        }}
                                                        activeOpacity={0.7}
                                                        style={[Styles.marH20, Styles.marV7, Styles.row, Styles.aslCenter, Styles.jSpaceBet, Styles.br5, Styles.padH15,Styles.padV15,
                                                            Styles.bgLBlueWhite,Styles.TripReportsCardMainshadow, {
                                                                width: Dimensions.get('window').width - 36
                                                            }]}>

                                                        <View style={[Styles.aslCenter,Styles.row]}>
                                                            <MaterialIcons style={[Styles.aslCenter, Styles.pRight15]}
                                                                           name="error" size={26} color="#EB5757"/>
                                                            <Text
                                                                style={[Styles.f18, Styles.ffRMedium, Styles.cGrey33, Styles.aslCenter]}>{Services.returnDateMonthYearFormatinShort(item.tripDateStr)}</Text>
                                                        </View>
                                                        <View style={[Styles.alignCenter, Styles.row]}>
                                                            <Text
                                                                style={[Styles.f22, Styles.ffRMedium, Styles.cOrange, Styles.aslStart]}>{item.unverifiedCount ? item.unverifiedCount : 0}</Text>
                                                            <MaterialIcons
                                                                style={[Styles.aslCenter, Styles.mLt15, Styles.br8, {backgroundColor: '#F2F2F2'}, Styles.p3]}
                                                                name="chevron-right" size={24} color="#4F4F4F"/>
                                                        </View>
                                                    </TouchableOpacity>
                                                )
                                            }}
                                            extraData={this.state}
                                            keyExtractor={(item, index) => index.toString()}/>
                                }
                            </View>
                        </View>
                    </View>
                </Modal>

                {/*REJECT TRIP Modal*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.rejectTripModal}
                    onRequestClose={() => {
                        this.setState({rejectTripModal: false})
                    }}>
                    <View style={[Styles.modalfrontDarkPosition]}>
                        <View style={[Styles.bgLightWhite, {
                            width: Dimensions.get('window').width - 60,
                            height: Dimensions.get('window').height / 1.8
                        }]}>
                            {this.state.spinnerBool === false ? null : <CSpinner/>}

                            <ScrollView style={[Styles.flex1, Styles.padH20, Styles.padV15,Styles.bgLightWhite]}>
                                <View style={[Styles.mBtm10]} >
                                    <Text style={[Styles.ffRMedium, Styles.f16,{left:10},Styles.cBlack87]}>Select the reason for
                                        rejecting</Text>
                                </View>

                                {
                                    this.state.rejectCardDetails
                                        ?
                                        <View style={[Styles.marV10]}>
                                            {
                                                this.state.rejectCardDetails.attrs
                                                    ?
                                                    this.state.rejectCardDetails.attrs.requiresClientUserId === 'true'
                                                        ?
                                                        <View style={[Styles.row,Styles.mTop5]}>
                                                            <Checkbox
                                                                color={'red'}
                                                                size={25}
                                                                onPress={() => this.setState({clientUserIdReason: !this.state.clientUserIdReason})}
                                                                status={this.state.clientUserIdReason ? 'checked' : 'unchecked'}
                                                            />
                                                            <Text
                                                                style={[Styles.f16, Styles.ffRMedium, Styles.aslCenter,Styles.marH5,Styles.cBlack87]}>Client
                                                                User ID</Text>
                                                        </View>
                                                        :
                                                        null
                                                    :
                                                    null
                                            }

                                            <View style={[Styles.row,Styles.mTop5,]}>
                                                <Checkbox
                                                    color={'red'}
                                                    size={25}
                                                    onPress={() => this.setState({tripSheetIdReason: !this.state.tripSheetIdReason})}
                                                    status={this.state.tripSheetIdReason ? 'checked' : 'unchecked'}
                                                />
                                                <Text
                                                    style={[Styles.f16, Styles.ffRMedium, Styles.aslCenter, Styles.cBlk, Styles.mBtm3,Styles.marH5,Styles.cBlack87]}>Trip
                                                    Sheet ID</Text>
                                            </View>

                                            {
                                                this.state.rejectCardDetails.role === 1 || this.state.rejectCardDetails.role === 10
                                                    ?
                                                    <View style={[Styles.row,Styles.mTop5]}>
                                                        <Checkbox
                                                            color={'red'}
                                                            size={25}
                                                            onPress={() => this.setState({packageReason: !this.state.packageReason})}
                                                            status={this.state.packageReason ? 'checked' : 'unchecked'}
                                                        />
                                                        <Text
                                                            style={[Styles.f16, Styles.ffRMedium, Styles.aslCenter, Styles.marH5,Styles.cBlack87]}>Package
                                                            Type</Text>
                                                    </View>
                                                    :
                                                    null
                                            }

                                            {
                                                this.state.rejectCardDetails.role === 5 || this.state.rejectCardDetails.role === 10
                                                    ?
                                                    <View style={[Styles.row,Styles.mTop5]}>
                                                        <Checkbox
                                                            color={'red'}
                                                            size={25}
                                                            onPress={() => this.setState({kilometerReason: !this.state.kilometerReason})}
                                                            status={this.state.kilometerReason ? 'checked' : 'unchecked'}
                                                        />
                                                        <Text
                                                            style={[Styles.f16, Styles.ffRMedium, Styles.aslCenter,Styles.marH5,Styles.cBlack87]}>Kilometer</Text>
                                                    </View>
                                                    :
                                                    null
                                            }

                                            <View style={[Styles.row,Styles.mTop5]}>
                                                <Checkbox
                                                    color={'red'}
                                                    size={25}
                                                    onPress={() => this.setState({plannedLeave: !this.state.plannedLeave})}
                                                    status={this.state.plannedLeave ? 'checked' : 'unchecked'}
                                                />
                                                <Text
                                                    style={[Styles.f16, Styles.ffRMedium, Styles.aslCenter,Styles.marH5,Styles.cBlack87]}>Planned Leave</Text>
                                            </View>

                                            <View style={[Styles.row,Styles.mTop5]}>
                                                <Checkbox
                                                    color={'red'}
                                                    size={25}
                                                    onPress={() => this.setState({unPlannedLeave: !this.state.unPlannedLeave})}
                                                    status={this.state.unPlannedLeave ? 'checked' : 'unchecked'}
                                                />
                                                <Text
                                                    style={[Styles.f16, Styles.ffRMedium, Styles.aslCenter,Styles.marH5,Styles.cBlack87]}>Un-Planned Leave</Text>
                                            </View>

                                            <View style={[Styles.row,Styles.mTop5]}>
                                                <Checkbox
                                                    color={'red'}
                                                    size={25}
                                                    onPress={() => this.setState({notWorked: !this.state.notWorked})}
                                                    status={this.state.notWorked ? 'checked' : 'unchecked'}
                                                />
                                                <Text
                                                    style={[Styles.f16, Styles.ffRMedium, Styles.aslCenter,Styles.marH5,Styles.cBlack87]}>Reported but Not-Worked</Text>
                                            </View>


                                        </View>
                                        :
                                        null
                                }
                            </ScrollView>
                            <View
                                style={[Styles.jEnd, Styles.row, Styles.padH20, Styles.marV15]}>
                                <TouchableOpacity
                                    onPress={() => {
                                        this.setState({rejectTripModal: false})
                                    }}
                                    activeOpacity={0.7}
                                    style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, Styles.padH20, Styles.padV5, Styles.OrdersScreenCardshadow,
                                        Styles.marH10]}>
                                    <Text
                                        style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, Styles.colorRed, Styles.aslCenter, Styles.p5]}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={()=>{
                                        if (this.state.clientUserIdReason ||this.state.tripSheetIdReason || this.state.packageReason || this.state.kilometerReason
                                            || this.state.plannedLeave || this.state.unPlannedLeave || this.state.notWorked){
                                            this.rejectTripDetails()
                                        }else {
                                            Utils.dialogBox('Please select a Reason','');
                                        }
                                    }}
                                    activeOpacity={0.7}
                                    style={[Styles.aslCenter, {backgroundColor: '#C91A1F'}, Styles.br5, Styles.padH20, Styles.padV5, Styles.OrdersScreenCardshadow]}>
                                    <Text
                                        style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, Styles.cWhite, Styles.aslCenter, Styles.p5]}>Confirm</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/*Images Preview Modal*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.imagePreview}
                    onRequestClose={() => {
                        this.setState({imagePreview: false, imagePreviewURL: ''})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View style={[Styles.flex1, Styles.bgWhite, {
                            width: Dimensions.get('window').width,
                            height: Dimensions.get('window').height
                        }]}>
                            {this.state.spinnerBool === false ? null : <CSpinner/>}
                            <Appbar.Header style={[Styles.bgDarkRed, Styles.jSpaceBet]}>
                                <Appbar.Content title="Image Preview"
                                                titleStyle={[Styles.ffMbold]}/>
                                <MaterialCommunityIcons name="window-close" size={32}
                                                        color="#000" style={{marginRight: 10}}
                                                        onPress={() =>
                                                            this.setState({imagePreview: false, imagePreviewURL: ''})
                                                        }/>
                            </Appbar.Header>
                            <View style={[Styles.flex1]}>
                                {
                                    this.state.imagePreviewURL
                                        ?
                                        <View>
                                            <View style={[Styles.row, Styles.jSpaceBet]}>
                                                <View/>
                                                <TouchableOpacity style={[Styles.row, Styles.marH10]}
                                                                  onPress={() => {
                                                                      this.rotate()
                                                                  }}>
                                                    <Text
                                                        style={[Styles.colorBlue, Styles.f18, Styles.padH5]}>ROTATE</Text>
                                                    <FontAwesome name="rotate-right" size={24} color="black"
                                                    />
                                                </TouchableOpacity>
                                            </View>

                                            <ImageZoom cropWidth={Dimensions.get('window').width}
                                                       cropHeight={Dimensions.get('window').height}
                                                       imageWidth={Dimensions.get('window').width}
                                                       imageHeight={Dimensions.get('window').height}>
                                                <Image
                                                    onLoadStart={() => this.setState({previewLoading: true})}
                                                    onLoadEnd={() => this.setState({previewLoading: false})}
                                                    style={[{
                                                        width: Dimensions.get('window').width - 20,
                                                        height: Dimensions.get('window').height - 90,
                                                        transform: [{rotate: this.state.imageRotate + 'deg'}]
                                                    }, Styles.marV5, Styles.aslCenter, Styles.bgDWhite, Styles.ImgResizeModeContain]}
                                                    source={this.state.imagePreviewURL ? {uri: this.state.imagePreviewURL} : null}
                                                />
                                            </ImageZoom>
                                            <ActivityIndicator
                                                style={[Styles.ImageUploadActivityIndicator]}
                                                animating={this.state.previewLoading}
                                            />
                                        </View>
                                        :
                                        null
                                }

                            </View>


                        </View>
                    </View>
                </Modal>

                {/*MODALS END*/}

            </View>
        );
    }
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5FCFF'
    },
    card: {
        flex: 1,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#E8E8E8',
        justifyContent: 'center',
        backgroundColor: 'white'
    },
    text: {
        textAlign: 'center',
        fontSize: 50,
        backgroundColor: 'transparent'
    },
    done: {
        textAlign: 'center',
        fontSize: 30,
        color: 'white',
        backgroundColor: 'transparent'
    }
})

