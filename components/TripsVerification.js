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
    Alert,
    Image,
    ActivityIndicator, StyleSheet, ImageBackground, Linking
} from "react-native";
import {
    Appbar,
    Card,
    DefaultTheme,
    List,
    RadioButton,
    Checkbox,
    Searchbar
} from "react-native-paper";
import OneSignal from "react-native-onesignal";
import HomeScreen from './HomeScreen';
import {CDismissButton, CSpinner, LoadImages, LoadSVG, Styles, CLoader} from "./common";
import Utils from './common/Utils';
import OfflineNotice from "./common/OfflineNotice";
import Config from "./common/Config";
import Services from "./common/Services";
import MaterialCommunityIcons from "react-native-vector-icons/dist/MaterialCommunityIcons";
import MaterialIcons from "react-native-vector-icons/dist/MaterialIcons";
import FontAwesome from "react-native-vector-icons/dist/FontAwesome";
import AsyncStorage from "@react-native-community/async-storage";
import _ from 'lodash';
import ImageZoom from "react-native-image-pan-zoom";
import Swiper from 'react-native-deck-swiper'
import FastImage from "react-native-fast-image";

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
const subEditHeightBy60 = editModalHeight - 60;
const subEditDetialsWidth = windowWidth / 2;

export default class TripsVerification extends React.Component {

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

            sitesListBasedOnDateModal: false,
            // cards: [...range(1, 5)],
            cards: [],
            siteInfo: [],
            pendingDatesInfo: [],
            swipedAllCards: false,
            swipeDirection: '',
            cardIndex: 0,
            editTripDetailsModal: false,
            clientUserIdDetailsUpdated: false,
            tripSheetIdDetailsUpdated: false,
            kilometerDetailsUpdated: false,
            packageDetailsUpdated: false,
            shortCashDetailsUpdated: false,
            penaltyDetailsUpdated: false,
            clientEmployeeIdDetailsUpdated: false,
            liteUserPaymentDetailsUpdated: false,
            partnerDetailsUpdated: false,
            clientLoginIdDetailsUpdated: false,
            paymentPlanDetailsUpdated: false,
            operationsTypeDetailsUpdated: false,
            rejectTripModal: false,
            plannedLeave: false,
            unPlannedLeave: false,
            notWorked: false,
            infinite: false,
            currentIndex: 0,
            currentCardCount: 0,
            filterTripType: 'ALL',
            requiredTripFilter: 'UN_VERIFIED', //UN_VERIFIED,VERIFIED,REJECTED
            showUnVerifiedTripData:true,
            nextCardfetched: false,
            penaltyReasons: [
                {reason: 'Late reporting', value: 0,status:false},
                {reason: 'Incorrect client login ID', value: 1,status:false},
                {reason: 'Incorrect kilometer readings', value: 2,status:false},
                {reason: 'Incorrect package count', value: 3,status:false},
                {reason: 'Short Cash', value: 4,status:false},
                {reason: 'Trip verification incomplete', value: 5,status:false},
                {reason: 'Incorrect payment details', value: 6,status:false},
            ],plansList:[],searchedPaymentPlanList:[],paymentPlanSelectionModal:false,
            operationsTypeList:[],operationsTypeSelectionModal:false,
            errorBeneficiaryIFSCcode: null,

            // tempSearchPhoneNumber:'8096712223'
        }

        // cardIndex ===> Uses to update the data (will increase and decrease the index),the Index is position from cards list,
        //currentIndex ===>will Increase the index if card is verified/rejected
        //swipedIndex ===>Index of selected card (uses the index at renderCard)
    }

    componentDidMount() {
        const self = this;
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            Services.checkMockLocationPermission((response) => {
                if (response){
                    this.props.navigation.navigate('Login')
                }
            })
        })
        AsyncStorage.getItem('Whizzard:userRole').then((userRole) => {
            let tempRole = JSON.parse(userRole)
            self.setState({userRole: tempRole}, () => {
                self.getAllDatesTripCount()
            })
        })
    }
    // componentWillUnmount() {
    //     this.didFocus.remove()
    // }

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CLoader/>
        return false;
    }

    errorHandling(error) {
        console.log("trip verification error", error, error.response);
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

    //API to get date trip count
    getAllDatesTripCount() {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_TRIPS_COUNTS_DATE_MOBILE;
        // const apiURL = Config.routes.BASE_URL + Config.routes.GET_TRIPS_COUNTS_DATE + '?tripType=' + self.state.filterTripType;
        const body = {
            tripType: self.state.filterTripType,
            requiredTrips:self.state.requiredTripFilter
        }
        // console.log('get dates trips count apiURL', apiURL, body)
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "POST", body, (response) => {
            // Services.AuthHTTPRequest(apiURL, "GET", body, (response) => {
                if (response.status === 200) {
                    let responseList = response.data
                    self.setState({
                        spinnerBool: false,
                        pendingDatesInfo: responseList,
                        swipedAllCards: false,
                        showUnVerifiedTripData:self.state.requiredTripFilter === 'UN_VERIFIED'
                    });
                }
            }, (error) => {
                self.errorHandling(error)
            })
        });
    }

    //API mapped sites trip count based on ddate
    getMappedSiteCountBasedOnDate() {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_TRIPS_COUNTS_SITE_AND_DATE_BASED_MOBILE;
        // const apiURL = Config.routes.BASE_URL + Config.routes.GET_TRIPS_COUNTS_SITE_AND_DATE_BASED + '?date=' + self.state.filterDate + '&tripType=' + self.state.filterTripType;
        const body = {
            reportDateStr:self.state.filterDate,
            tripType:self.state.filterTripType,
            requiredTrips:self.state.requiredTripFilter
        }
        // console.log('get site mapped trips apiURL', apiURL, body)
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "POST", body, (response) => {
                if (response.status === 200) {
                    let responseList = response.data
                    self.setState({
                        spinnerBool: false,
                        siteInfo: responseList.reports,
                        totalReports: responseList.totalReports,
                        sitesListBasedOnDateModal: true
                    });
                }
            }, (error) => {
                self.errorHandling(error)
            })
        });
    }

    // //API to get all trips list
    getUnverifiedTripList() {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_UN_VERIFIED_TRIPS_ID;
        const body = {
            siteId: self.state.filterSiteId,
            reportDateStr: self.state.filterDate,
            tripType: self.state.filterTripType,
            requiredTrips: self.state.requiredTripFilter
        }
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "POST", body, (response) => {
                if (response.status === 200) {
                    let responseList = response.data
                    if (responseList.length === 0) {
                        self.setState({
                            spinnerBool: false,
                            cards: responseList,
                            swipedAllCards: false,
                            tripDetailsCardModal: true,
                            cardIndex: 0,
                            currentIndex: 0,
                            currentCardCount: 0
                        });
                    } else {
                        self.setState({
                            cardIndex: 0,
                            currentIndex: 0,
                            currentCardCount: 0
                        }, () => {
                            self.getFirstTripDetails(responseList[0].id, responseList)
                        });
                    }

                }
            }, (error) => {
                self.errorHandling(error)
            })
        });
    }

    //API to get first trip details
    getFirstTripDetails(tripId, totalList) {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_TRIP_DETAILS + tripId;
        const body = {}
        // console.log('get first Trip Details apiURL', apiURL, body)
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "GET", body, (response) => {
                if (response.status === 200) {
                    let responseList = response.data
                    console.log('get first Trip Details resp200', responseList);
                    self.clearUpdatedValues(responseList.status === "VERIFIED")
                    let totalCards = totalList
                    let tempIndex = 0

                    totalCards[0] = responseList

                    self.setState({
                        spinnerBool: false,
                        // cards: totalList,         //if not keep un-comment
                        cards: totalCards,          //if not keep comment
                        swipedAllCards: false,
                        tripDetailsCardModal: true,
                        currentCardDetails: responseList,
                        cardIndex: 0,
                        allowVerifySwipe: false,
                        allowRejectSwipe: false,
                        currentCardCount: 0,
                        reasonsForPenalty :self.state.penaltyReasons
                    });
                }
            }, (error) => {
                self.errorHandling(error)
            })
        });
    }

    //API to get all trips list
    getSecondTripDetails(tripId, button) {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_TRIP_DETAILS + tripId;
        const body = {}
        // console.log('second Trip Details apiURL', apiURL, body)
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "GET", body, (response) => {
                if (response.status === 200) {
                    let responseList = response.data
                    console.log('second Trip Details resp200', responseList);

                    if (!self.state.swipedCurrentCard) {
                        if (button === 'VERIFY') {
                            self.swipeRight()
                        } else if (button === 'REJECT') {
                            self.swipeLeft()
                        } else if (button === 'SKIP_LATER') {
                            self.swipeTop()
                        }
                    }

                    let totalCards = self.state.cards
                    // let tempIndex = self.state.swipedIndex+1
                    let tempNextCard = self.state.currentCardCount + 1

                    totalCards[tempNextCard] = responseList

                    self.setState({
                        spinnerBool: false,
                        nextCardfetched: self.state.swipedDirection === 'leftPush' || self.state.swipedDirection === 'topPush' || self.state.swipedDirection === 'rightPush',
                        cardIndex: 1,
                        cards: totalCards,   //if not keep comment,
                        currentCardDetails: responseList,
                        allowVerifySwipe: false,
                        allowRejectSwipe: false,
                        currentCardCount: tempNextCard,
                        reasonsForPenalty :self.state.penaltyReasons
                    }, () => {
                        if (button === 'SKIP_LATER') {
                            self.clearUpdatedValues(responseList.status === "VERIFIED")
                        }
                    });
                }
            }, (error) => {
                self.errorHandling(error)
            })
        });
    }

    //API to get trip types based on tripId
    getTripTypeList(tripId) {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_TRIP_TYPE_LIST + tripId;
        const body = {}
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "GET", body, (response) => {
                if (response.status === 200) {
                    let responseList = response.data
                    self.setState({
                        spinnerBool: false,
                        operationsTypeList:responseList,
                        operationsTypeSelectionModal:true,
                    });
                }
            }, (error) => {
                self.errorHandling(error)
            })
        });
    }

    //API to get all payment plans based on siteId
    getPaymentPlansList(siteId) {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_PAYMENT_PLANS_SITE_BASED + siteId;
        const body = {}
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "GET", body, (response) => {
                if (response.status === 200) {
                    let tempResponse = response.data
                    self.setState({
                        plansList:tempResponse,
                        searchedPaymentPlanList:tempResponse,
                        paymentPlanSelectionModal:true,
                        planSearchString:'',
                        spinnerBool: false});
                }
            }, (error) => {
                self.errorHandling(error)
            })
        });
    }

    clearUpdatedValues(statusCheck) {
        // let testValue = this.state.requiredTripFilter === 'VERIFIED'
        let testValue = statusCheck
        return (
            this.setState({
                clientUserIdDetailsUpdated: testValue,
                tripSheetIdDetailsUpdated: testValue,
                kilometerDetailsUpdated: testValue,
                packageDetailsUpdated: testValue,
                shortCashDetailsUpdated: testValue,
                penaltyDetailsUpdated: testValue,
                clientEmployeeIdDetailsUpdated: testValue,
                liteUserPaymentDetailsUpdated: testValue,
                partnerDetailsUpdated: testValue,
                clientLoginIdDetailsUpdated: testValue,
                paymentPlanDetailsUpdated:testValue,
                operationsTypeDetailsUpdated:testValue,
                // clientUserIdDetailsUpdated: false,
                // tripSheetIdDetailsUpdated: false,
                // kilometerDetailsUpdated: false,
                // packageDetailsUpdated: false,
                // shortCashDetailsUpdated: false,
                // penaltyDetailsUpdated: false,
                // clientEmployeeIdDetailsUpdated: false,
                // liteUserPaymentDetailsUpdated: false,
                // partnerDetailsUpdated: false,
                // clientLoginIdDetailsUpdated: false,
                // paymentPlanDetailsUpdated:false,
                // operationsTypeDetailsUpdated:false,
             })
        )
    }

    //API to get reject reasons
    getTripRejectReasons(shiftId) {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_TRIP_REJECT_REASONS + shiftId;
        const body = {}
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "GET", body, (response) => {
                if (response.status === 200) {
                    let responseList = response.data
                    self.setState({
                        spinnerBool: false,
                        rejectReasonsList: responseList,
                        rejectTripModal: true,
                        shiftRejectReasonSelected: ''
                    });
                }
            }, (error) => {
                self.errorHandling(error)
            })
        });
    }

    //API CALL to reject trip
    rejectTripDetails(reasons) {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.REJECT_TRIP_DETAILS;
        const body = {
            "tripSummaryReportId": self.state.rejectCardDetails.id,
            "rejectionReasons": reasons
        };
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "PUT", body, (response) => {
                if (response.status === 200) {
                    let tempNextCard = self.state.currentCardCount + 1
                    self.setState({
                        spinnerBool: false,
                        rejectTripModal: false,
                        currentIndex: self.state.currentIndex + 1,
                        cardIndex: 2
                    }, () => {
                        self.clearUpdatedValues(false)
                        Utils.dialogBox("Trip Rejected Succesfully", '');
                        if (tempNextCard === self.state.cards.length) {
                            if (!self.state.swipedCurrentCard) {
                                self.swipeLeft()
                            }
                        } else {
                            self.getSecondTripDetails(self.state.cards[tempNextCard].id, 'REJECT')
                        }

                    });
                }
            }, (error) => {
                self.errorHandling(error)
            })
        });
    }

    //API CALL to update and Verify  trip
    updateAndVerifyTrip(tripId) {
        const {selectedCardTripDetails} = this.state;
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.UPDATE_VERIFY_TRIP + 'reportDate=' + self.state.filterDate;
        let tempBody = {
            // "tripSummaryReportId": tripId,
            // "templateId": self.state.selectedCardTripDetails.templateId, //added for payemnt plan check jeevan ask
            // "userId": self.state.selectedCardTripDetails.userId, //added for payemnt plan check jeevan ask
            // "siteId": self.state.selectedCardTripDetails.siteId, //added for payemnt plan check jeevan ask
            // // "id": tripId,
            // "tripSheetId": self.state.finalTripSheetId,
            // "clientUserId": self.state.finalClientUserID,
            // "clientEmployeeId": self.state.finalEmployeeID,
            // "partnerDetails": self.state.finalPartnerDetails,
            // "startingKM": self.state.finalStartingKM,
            // "endingKm": self.state.finalEndingKm,
            // "packages": self.state.finalTotalDeliveredCount,
            // "deliveredPackages": self.state.finalDeliveredPackages,
            // "shortCash": self.state.finalShortCash,
            // "penalty": self.state.selectedCardTripDetails.penalty,
            // "penaltyReasons": self.state.selectedCardTripDetails.penaltyReasons,
            // //lite user payment fields
            // "beneficiaryName": self.state.selectedCardTripDetails.attrs.beneficiaryName,
            // "accountNumber": self.state.selectedCardTripDetails.attrs.beneficiaryAccountNumber,
            // "ifscCode": self.state.selectedCardTripDetails.attrs.ifscCode,
            // "pan": self.state.selectedCardTripDetails.attrs.beneficiaryPanNumber,
            // "tripAmount": self.state.selectedCardTripDetails.attrs.amountPaid,
            // "paymentMode": self.state.selectedCardTripDetails.attrs.paymentMode,
            // "liteUser": self.state.selectedCardTripDetails.unRegisteredUserAdhocShift,
            // "clientLoginIdMobileNumber": self.state.finalSearchPhoneNumber,
            // "planId": self.state.finalPlanId,
            // "planName": self.state.finalPlanName,
            // "updatePlanInProfile": self.state.finalUpdatePlanInProfile,



            "tripSummaryReportId": tripId,
            "templateId": selectedCardTripDetails.templateId, //added for payemnt plan check jeevan ask
            "userId": selectedCardTripDetails.userId, //added for payemnt plan check jeevan ask
            "siteId": selectedCardTripDetails.siteId, //added for payemnt plan check jeevan ask
            // "id": tripId,
            "tripSheetId": selectedCardTripDetails.tripSheetId,
            "clientUserId": selectedCardTripDetails.clientUserId,
            "clientEmployeeId":selectedCardTripDetails.clientEmployeeId,
            "partnerDetails":selectedCardTripDetails.partnerDetails,
            "startingKM": selectedCardTripDetails.startingKM,
            "endingKm": selectedCardTripDetails.endingKm,
            "packages": selectedCardTripDetails.packages,
            "deliveredPackages": selectedCardTripDetails.deliveredPackages,
            "shortCash": selectedCardTripDetails.shortCash,
            "penalty": selectedCardTripDetails.penalty,
            "penaltyReasons": selectedCardTripDetails.penaltyReasons,
            //lite user payment fields
            "beneficiaryName": selectedCardTripDetails.attrs.beneficiaryName,
            "accountNumber": selectedCardTripDetails.attrs.beneficiaryAccountNumber,
            "ifscCode": selectedCardTripDetails.attrs.ifscCode,
            "pan": selectedCardTripDetails.attrs.beneficiaryPanNumber,
            "tripAmount": selectedCardTripDetails.attrs.amountPaid,
            "paymentMode": selectedCardTripDetails.attrs.paymentMode,
            "liteUser": selectedCardTripDetails.unRegisteredUserAdhocShift,
            "clientLoginIdMobileNumber": selectedCardTripDetails.clientLoginIdMobileNumber,
            "planId": selectedCardTripDetails.planId,
            "planName": selectedCardTripDetails.planName,
            "updatePlanInProfile": selectedCardTripDetails.updatePlanInProfile,
            "tripType": selectedCardTripDetails.tripType,
        }
        const body = JSON.stringify(tempBody);
        // console.log('update verify Trip apiURL', apiURL, body)
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "PUT", body, (response) => {
                if (response.status === 200) {
                    // console.log('update verify Trip List 200', response.data);
                    // let tempNextCard = self.state.swipedIndex + 1
                    let tempNextCard = self.state.currentCardCount + 1
                    self.setState({
                        spinnerBool: false,
                        currentIndex: self.state.currentIndex + 1
                    }, () => {
                        self.clearUpdatedValues(false)
                        Utils.dialogBox("Trip Verified Succesfully", '');
                        if (tempNextCard === self.state.cards.length) {
                            if (!self.state.swipedCurrentCard) {
                                self.swipeRight()
                            }
                        } else {
                            self.getSecondTripDetails(self.state.cards[tempNextCard].id, 'VERIFY')
                        }
                    });
                }
            }, (error) => {
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
        // console.log('render card index',index);
        const {
            clientUserIdDetailsUpdated,
            tripSheetIdDetailsUpdated,
            kilometerDetailsUpdated,
            packageDetailsUpdated,
            shortCashDetailsUpdated,
            penaltyDetailsUpdated,
            clientEmployeeIdDetailsUpdated,
            liteUserPaymentDetailsUpdated,
            partnerDetailsUpdated,
            clientLoginIdDetailsUpdated,
            paymentPlanDetailsUpdated,
            operationsTypeDetailsUpdated
        } = this.state;
        if (card) {
            return (
                <View style={{
                    width: Dimensions.get('window').width,
                    height: Dimensions.get('window').height,
                    alignSelf: 'center',
                    // backgroundColor: 'rgba(0,0,0,0.5)'
                    backgroundColor: '#000'
                    // backgroundColor: 'red'
                }}>
                    <View style={[Styles.alignEndEnd, Styles.padH10,]}>
                        <Text style={[Styles.ffRBold, Styles.f18, Styles.padH15, Styles.br10, Styles.marV10, {
                            backgroundColor: '#D1FFE9',
                            color: '#03B675'
                            // }]}>{index + 1}/{this.state.cards.length}</Text>
                        // }]}>{this.state.currentIndex}/{this.state.cards.length}</Text>
                        }]}>{this.state.showUnVerifiedTripData ? this.state.currentIndex : index + 1}/{this.state.cards.length}</Text>
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
                                <View
                                    style={[card.unRegisteredUserAdhocShift ? Styles.bgLYellow2 : Styles.bgLBlueWhite, Styles.br10, Styles.pBtm10]}>
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
                                        style={[Styles.f24, Styles.cDarkBlue, Styles.txtAlignCen, Styles.pTop45, Styles.ffRMedium]}>{_.startCase(card.attrs.userName)}</Text>
                                    <Text
                                        style={[Styles.f12, Styles.cLightBlue, Styles.txtAlignCen, Styles.ffRMedium]}>{Services.getUserRoles(card.role)}</Text>
                                    <View style={[Styles.row, Styles.padH30, Styles.jSpaceBet, Styles.mTop10]}>
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
                                                        style={[Styles.aslCenter]}>{Services.returnVehicleType(card.vehicleType)}</View>
                                                    {
                                                        card.vehicleType
                                                            ?
                                                            <Text
                                                                style={[Styles.f12, Styles.cLightBlue, Styles.aslCenter, Styles.ffRRegular, {letterSpacing: 1}]}>{card.attrs.vehicleRegNo}</Text>
                                                            :
                                                            null
                                                    }
                                                </View>
                                                :
                                                <View style={[Styles.aslCenter]}>
                                                    <Image
                                                        style={[{height: 32, width: 46}, Styles.ImgResizeModeCenter]}
                                                        source={LoadImages.profile_user}/>
                                                </View>
                                        }
                                    </View>

                                    <View
                                        style={[Styles.row, Styles.bgWhite, Styles.padV10, Styles.padH5, Styles.marV20, Styles.marH10, Styles.br10]}>
                                        <View style={[Styles.flex1, Styles.alignCenter]}>
                                            <Text
                                                style={[Styles.f14, Styles.cDarkBlue, Styles.aslCenter, Styles.ffRMedium]}>{card.attrs.shiftStartedTimeIn24HrsFormat || '--'}</Text>
                                        </View>
                                        <View style={[Styles.flex1, Styles.alignCenter]}>
                                            <Text
                                                style={[Styles.f24, Styles.cDarkBlue, Styles.aslCenter, Styles.ffRMedium]}>{card.attrs.shiftDurationString || '--'}</Text>
                                            <Text
                                                numberOfLines={1}
                                                style={[Styles.f14, Styles.cDarkBlue, Styles.aslCenter, Styles.ffRMedium]}>{Services.returnDateMonthYearFormatinMonthShort(card.tripDateStr)}</Text>
                                        </View>
                                        <View style={[Styles.flex1, Styles.alignCenter]}>
                                            <Text
                                                style={[Styles.f14, Styles.cDarkBlue, Styles.aslCenter, Styles.ffRMedium]}>{card.attrs.shiftEndedTimeIn24HrsFormat || '--'}</Text>
                                        </View>
                                    </View>
                                    <View style={[Styles.row, Styles.mBtm5]}>
                                        <View style={[Styles.flex1, Styles.alignCenter]}>
                                            <Text
                                                style={[Styles.f12, Styles.cLightBlue, Styles.aslCenter, Styles.ffRMedium]}>{_.startCase(_.lowerCase(card.attrs.shiftType)) || '--'} Trip</Text>
                                        </View>
                                        <View style={{flex: 1 / 2}}/>
                                        <View style={[Styles.flex1, Styles.alignCenter]}>
                                            <Text
                                                numberOfLines={1}
                                                style={[Styles.f12, Styles.cLightBlue, Styles.aslCenter, Styles.ffRMedium]}>{_.startCase(_.lowerCase(card.attrs.shiftStatus)) || '--'}</Text>
                                        </View>
                                    </View>
                                </View>

                                <ScrollView persistentScrollbar={true}>
                                    <View
                                        style={[Styles.row, Styles.flexWrap, Styles.alignCenter, Styles.marV15, Styles.padV5]}>

                                        {
                                            card.requiredPaymentPlan
                                                ?
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        this.setState({tempCardIndex: index, cardIndex: index}, () => {
                                                            this.useSelectedDataReport(card, 'PAYMENT_PLAN')
                                                        })
                                                    }}
                                                    activeOpacity={0.7}
                                                    style={[Styles.row, Styles.mTop5]}>
                                                    <View
                                                        style={[Styles.bw1, card.planId ? Styles.bcAsh : Styles.bcLightRed, Styles.br5, Styles.marH5, Styles.mBtm10]}>
                                                        <View
                                                            style={[card.planId ? Styles.bgLBlueWhite : Styles.bgLPink, Styles.padV10, Styles.alignCenter, {
                                                                width: Dimensions.get('window').width / 3.8,
                                                                height: 55
                                                            }]}>
                                                            <Text
                                                                numberOfLines={1}
                                                                style={[Styles.f14, card.planId ? Styles.cLightNavyBlue : Styles.cLightRed, Styles.aslCenter, Styles.ffRRegular]}>{card.planName || '--'}</Text>
                                                        </View>
                                                        <View style={[Styles.bgWhite, Styles.padV10, Styles.aslCenter, {
                                                            height: 36
                                                        }]}>
                                                            <Text
                                                                style={[Styles.f12, Styles.cLightBlue, Styles.aslCenter, Styles.ffRRegular]}>Payment Plan</Text>
                                                        </View>
                                                        <View style={[Styles.posAbsolute, {
                                                            top: 46,
                                                            left: Dimensions.get('window').width / 8.5
                                                        }]}>
                                                            {Services.returnCardStatusIcon(paymentPlanDetailsUpdated)}
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                                :
                                                null
                                        }

                                        {
                                            card.requiredTripType
                                                ?
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        this.setState({tempCardIndex: index, cardIndex: index}, () => {
                                                            this.useSelectedDataReport(card, 'OPERATIONS_TYPE')
                                                        })
                                                    }}
                                                    activeOpacity={0.7}
                                                    style={[Styles.row, Styles.mTop5]}>
                                                    <View
                                                        style={[Styles.bw1, card.tripType ? Styles.bcAsh : Styles.bcLightRed, Styles.br5, Styles.marH5, Styles.mBtm10]}>
                                                        <View
                                                            style={[card.tripType ? Styles.bgLBlueWhite : Styles.bgLPink, Styles.padV10, Styles.alignCenter, {
                                                                width: Dimensions.get('window').width / 3.8,
                                                                height: 55
                                                            }]}>
                                                            <Text
                                                                numberOfLines={1}
                                                                // style={[Styles.f14, card.tripType ? Styles.cLightNavyBlue : Styles.cLightRed, Styles.aslCenter, Styles.ffRRegular]}>{card.tripType || '--'}</Text>
                                                                style={[Styles.f14, card.tripType ? Styles.cLightNavyBlue : Styles.cLightRed, Styles.aslCenter, Styles.ffRRegular]}>{_.startCase(_.toLower(card.tripType)) || '--'}</Text>
                                                        </View>
                                                        <View style={[Styles.bgWhite, Styles.padV10, Styles.aslCenter, {
                                                            height: 36
                                                        }]}>
                                                            <Text
                                                                style={[Styles.f12, Styles.cLightBlue, Styles.aslCenter, Styles.ffRRegular]}>Operations Type</Text>
                                                        </View>
                                                        <View style={[Styles.posAbsolute, {
                                                            top: 46,
                                                            left: Dimensions.get('window').width / 8.5
                                                        }]}>
                                                            {Services.returnCardStatusIcon(operationsTypeDetailsUpdated)}
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                                :
                                                null
                                        }

                                        {
                                            card.attrs.requirePartnerDetails === 'true'
                                                ?
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        this.setState({tempCardIndex: index, cardIndex: index}, () => {
                                                            this.useSelectedDataReport(card, 'PARTNER_DETAILS')
                                                        })
                                                    }}
                                                    activeOpacity={0.7}
                                                    style={[Styles.row, Styles.mTop5,]}>
                                                    <View
                                                        style={[Styles.bw1, card.partnerDetails ? Styles.bcAsh : Styles.bcLightRed, Styles.br5, Styles.marH5, Styles.mBtm10]}>
                                                        <View
                                                            style={[card.partnerDetails ? Styles.bgLBlueWhite : Styles.bgLPink, Styles.padV10, Styles.alignCenter, {
                                                                width: Dimensions.get('window').width / 3.8,
                                                                height: 55
                                                            }]}>
                                                            <Text
                                                                numberOfLines={1}
                                                                style={[Styles.f14, card.partnerDetails ? Styles.cLightNavyBlue : Styles.cLightRed, Styles.aslCenter, Styles.ffRRegular]}>{card.partnerDetails || '--'}</Text>
                                                        </View>
                                                        <View
                                                            style={[Styles.bgWhite, Styles.padV10, Styles.aslCenter, {
                                                                height: 36
                                                            }]}>
                                                            <Text
                                                                style={[Styles.f12, Styles.cLightBlue, Styles.aslCenter, Styles.ffRRegular]}>Partner
                                                                Name</Text>
                                                        </View>
                                                        <View style={[Styles.posAbsolute, {
                                                            top: 46,
                                                            left: Dimensions.get('window').width / 8.5
                                                        }]}>
                                                            {Services.returnCardStatusIcon(partnerDetailsUpdated)}
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                                :
                                                null
                                        }

                                        {
                                            card.attrs.requiresClientUserId === 'true'
                                                ?
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        this.setState({tempCardIndex: index, cardIndex: index}, () => {
                                                            this.useSelectedDataReport(card, 'CLIENT_USER_ID')
                                                        })
                                                    }}
                                                    activeOpacity={0.7}
                                                    style={[Styles.row, Styles.mTop5,]}>
                                                    <View
                                                        style={[Styles.bw1, card.clientUserId ? Styles.bcAsh : Styles.bcLightRed, Styles.br5, Styles.marH5, Styles.mBtm10]}>
                                                        <View
                                                            style={[card.clientUserId ? Styles.bgLBlueWhite : Styles.bgLPink, Styles.padV10, Styles.alignCenter, {
                                                                width: Dimensions.get('window').width / 3.8,
                                                                height: 55
                                                            }]}>
                                                            <Text
                                                                numberOfLines={1}
                                                                style={[Styles.f14, card.clientUserId ? Styles.cLightNavyBlue : Styles.cLightRed, Styles.aslCenter, Styles.ffRRegular]}>{card.clientUserId || '--'}</Text>
                                                        </View>
                                                        <View
                                                            style={[Styles.bgWhite, Styles.padV10, Styles.aslCenter, {
                                                                height: 36
                                                            }]}>
                                                            <Text
                                                                style={[Styles.f12, Styles.cLightBlue, Styles.aslCenter, Styles.ffRRegular]}>Client
                                                                User ID</Text>
                                                        </View>
                                                        <View style={[Styles.posAbsolute, {
                                                            top: 46,
                                                            left: Dimensions.get('window').width / 8.5
                                                        }]}>
                                                            {Services.returnCardStatusIcon(clientUserIdDetailsUpdated)}
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                                :
                                                null
                                        }

                                        {
                                            card.requireClientLoginId
                                                ?
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        this.setState({
                                                            tempCardIndex: index,
                                                            cardIndex: index,
                                                            selectedCardTripDetails: card
                                                        }, () => {
                                                            this.useSelectedDataReport(card, 'CLIENT_LOGIN_ID')
                                                            this.getEnteredPhoneNumberProfiles(card.clientLoginIdMobileNumber)
                                                        })
                                                    }}
                                                    activeOpacity={0.7}
                                                    style={[Styles.row, Styles.mTop5,]}>
                                                    <View
                                                        style={[Styles.bw1, card.clientLoginIdMobileNumber ? Styles.bcAsh : Styles.bcLightRed, Styles.br5, Styles.marH5, Styles.mBtm10]}>
                                                        <View
                                                            style={[card.clientLoginIdMobileNumber ? Styles.bgLBlueWhite : Styles.bgLPink, Styles.padV10, Styles.alignCenter, {
                                                                width: Dimensions.get('window').width / 3.8,
                                                                height: 55
                                                            }]}>
                                                            <Text
                                                                numberOfLines={1}
                                                                style={[Styles.f14, card.clientLoginIdMobileNumber ? Styles.cLightNavyBlue : Styles.cLightRed, Styles.aslCenter, Styles.ffRRegular]}>{card.clientLoginIdMobileNumber || '--'}</Text>
                                                        </View>
                                                        <View
                                                            style={[Styles.bgWhite, Styles.padV10, Styles.aslCenter, {
                                                                height: 36
                                                            }]}>
                                                            <Text
                                                                style={[Styles.f12, Styles.cLightBlue, Styles.aslCenter, Styles.ffRRegular]}>Client
                                                                Login Id</Text>
                                                        </View>
                                                        <View style={[Styles.posAbsolute, {
                                                            top: 46,
                                                            left: Dimensions.get('window').width / 8.5
                                                        }]}>
                                                            {Services.returnCardStatusIcon(clientLoginIdDetailsUpdated)}
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                                :
                                                null
                                        }


                                        {
                                            card.attrs.requiresEmployeeId === 'true'
                                                ?
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        this.setState({tempCardIndex: index, cardIndex: index}, () => {
                                                            this.useSelectedDataReport(card, 'EMPLOYEE_ID')
                                                        })
                                                    }}
                                                    activeOpacity={0.7}
                                                    style={[Styles.row, Styles.mTop5,]}>
                                                    <View
                                                        style={[Styles.bw1, card.clientEmployeeId ? Styles.bcAsh : Styles.bcLightRed, Styles.br5, Styles.marH5, Styles.mBtm10]}>
                                                        <View
                                                            style={[card.clientEmployeeId ? Styles.bgLBlueWhite : Styles.bgLPink, Styles.padV10, Styles.alignCenter, {
                                                                width: Dimensions.get('window').width / 3.8,
                                                                height: 55
                                                            }]}>
                                                            <Text
                                                                numberOfLines={1}
                                                                style={[Styles.f14, card.clientEmployeeId ? Styles.cLightNavyBlue : Styles.cLightRed, Styles.aslCenter, Styles.ffRRegular]}>{card.clientEmployeeId || '--'}</Text>
                                                        </View>
                                                        <View
                                                            style={[Styles.bgWhite, Styles.padV10, Styles.aslCenter, {
                                                                height: 36
                                                            }]}>
                                                            <Text
                                                                style={[Styles.f12, Styles.cLightBlue, Styles.aslCenter, Styles.ffRRegular]}>Employee
                                                                ID</Text>
                                                        </View>
                                                        <View style={[Styles.posAbsolute, {
                                                            top: 46,
                                                            left: Dimensions.get('window').width / 8.5
                                                        }]}>
                                                            {Services.returnCardStatusIcon(clientEmployeeIdDetailsUpdated)}
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                                :
                                                null
                                        }

                                        {
                                            card.tripSheetIdNeeded
                                                ?
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        this.setState({tempCardIndex: index, cardIndex: index}, () => {
                                                            this.useSelectedDataReport(card, 'TRIP_SHEET_ID')
                                                        })
                                                    }}
                                                    activeOpacity={0.7}
                                                    style={[Styles.row, Styles.mTop5]}>
                                                    <View
                                                        style={[Styles.bw1, card.tripSheetId ? Styles.bcAsh : Styles.bcLightRed, Styles.br5, Styles.marH5, Styles.mBtm10]}>
                                                        <View
                                                            style={[card.tripSheetId ? Styles.bgLBlueWhite : Styles.bgLPink, Styles.padV10, Styles.alignCenter, {
                                                                width: Dimensions.get('window').width / 3.8,
                                                                height: 55
                                                            }]}>
                                                            <Text
                                                                numberOfLines={1}
                                                                style={[Styles.f14, card.tripSheetId ? Styles.cLightNavyBlue : Styles.cLightRed, Styles.aslCenter, Styles.ffRRegular]}>{card.tripSheetId || '--'}</Text>
                                                        </View>
                                                        <View style={[Styles.bgWhite, Styles.padV10, Styles.aslCenter, {
                                                            height: 36
                                                        }]}>
                                                            <Text
                                                                style={[Styles.f12, Styles.cLightBlue, Styles.aslCenter, Styles.ffRRegular]}>Trip
                                                                Sheet ID</Text>
                                                        </View>
                                                        <View style={[Styles.posAbsolute, {
                                                            top: 46,
                                                            left: Dimensions.get('window').width / 8.5
                                                        }]}>
                                                            {Services.returnCardStatusIcon(tripSheetIdDetailsUpdated)}
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                                :
                                                null
                                        }

                                        {
                                            card.role === 1 || card.role === 10
                                                ?
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        this.setState({tempCardIndex: index, cardIndex: index}, () => {
                                                            this.useSelectedDataReport(card, 'PACKAGES')
                                                        })
                                                    }}
                                                    activeOpacity={0.7}
                                                    style={[Styles.row, Styles.mTop5]}>
                                                    <View
                                                        style={[Styles.bw1, card.packages > 0 ? Styles.bcAsh : Styles.bcLightRed, Styles.br5, Styles.marH5, Styles.mBtm10]}>
                                                        <View
                                                            style={[card.packages > 0 ? Styles.bgLBlueWhite : Styles.bgLPink, Styles.padV10, Styles.alignCenter, {
                                                                width: Dimensions.get('window').width / 3.8,
                                                                height: 55
                                                            }]}>
                                                            <Text
                                                                style={[Styles.f14, card.packages > 0 ? Styles.cLightNavyBlue : Styles.cLightRed, Styles.aslCenter, Styles.ffRRegular]}>Delivery</Text>
                                                        </View>
                                                        <View
                                                            style={[Styles.bgWhite, Styles.padV10, Styles.aslCenter, {
                                                                height: 36
                                                            }]}>
                                                            <Text
                                                                style={[Styles.f12, Styles.cLightBlue, Styles.aslCenter, Styles.ffRRegular]}>Package
                                                                Type</Text>
                                                        </View>
                                                        <View style={[Styles.posAbsolute, {
                                                            top: 46,
                                                            left: Dimensions.get('window').width / 8.5
                                                        }]}>
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
                                                        this.setState({tempCardIndex: index, cardIndex: index}, () => {
                                                            this.useSelectedDataReport(card, 'KILOMETER')
                                                        })
                                                    }}
                                                    activeOpacity={0.7}
                                                    style={[Styles.row, Styles.mTop5]}>
                                                    <View
                                                        style={[Styles.bw1, card.tripDistance > 0 ? Styles.bcAsh : Styles.bcLightRed, Styles.br5, Styles.marH5, Styles.mBtm10]}>
                                                        <View
                                                            style={[card.tripDistance > 0 ? Styles.bgLBlueWhite : Styles.bgLPink, Styles.padV10, Styles.alignCenter, {
                                                                width: Dimensions.get('window').width / 3.8,
                                                                height: 55
                                                            }]}>
                                                            <Text
                                                                style={[Styles.f14, card.tripDistance > 0 ? Styles.cLightNavyBlue : Styles.cLightRed, Styles.aslCenter, Styles.ffRRegular]}>{card.tripDistance}</Text>
                                                        </View>
                                                        <View
                                                            style={[Styles.bgWhite, Styles.padV10, Styles.aslCenter, {
                                                                height: 36
                                                            }]}>
                                                            <Text
                                                                style={[Styles.f12, Styles.cLightBlue, Styles.aslCenter, Styles.ffRRegular]}>Kilometer</Text>
                                                        </View>
                                                        <View style={[Styles.posAbsolute, {
                                                            top: 46,
                                                            left: Dimensions.get('window').width / 8.5
                                                        }]}>
                                                            {Services.returnCardStatusIcon(kilometerDetailsUpdated)}
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                                :
                                                null
                                        }

                                        <TouchableOpacity
                                            onPress={() => {
                                                this.setState({tempCardIndex: index, cardIndex: index}, () => {
                                                    this.useSelectedDataReport(card, 'SHORT_CASH')
                                                })
                                            }}
                                            activeOpacity={0.7}
                                            style={[Styles.row, Styles.mTop5]}>
                                            <View
                                                style={[Styles.bw1, card.shortCash > 0 ? Styles.bcAsh : Styles.bcLightRed, Styles.br5, Styles.marH5, Styles.mBtm10]}>
                                                <View
                                                    style={[card.shortCash > 0 ? Styles.bgLBlueWhite : Styles.bgLPink, Styles.padV10, Styles.alignCenter, {
                                                        width: Dimensions.get('window').width / 3.8,
                                                        height: 55
                                                    }]}>
                                                    <Text
                                                        style={[Styles.f14, card.shortCash > 0 ? Styles.cLightNavyBlue : Styles.cLightRed, Styles.aslCenter, Styles.ffRRegular]}>&#x20B9;{' '}{card.shortCash === 0 ? 0 : card.shortCash || '--'}</Text>
                                                </View>
                                                <View
                                                    style={[Styles.bgWhite, Styles.padV10, Styles.aslCenter, {
                                                        height: 36
                                                    }]}>
                                                    <Text
                                                        style={[Styles.f12, Styles.cLightBlue, Styles.aslCenter, Styles.ffRRegular]}>Short
                                                        Cash</Text>
                                                </View>
                                                <View style={[Styles.posAbsolute, {
                                                    top: 46,
                                                    left: Dimensions.get('window').width / 8.5
                                                }]}>
                                                    {Services.returnCardStatusIcon(shortCashDetailsUpdated)}
                                                </View>
                                            </View>
                                        </TouchableOpacity>


                                        <TouchableOpacity
                                            onPress={() => {
                                                this.setState({tempCardIndex: index, cardIndex: index}, () => {
                                                    this.useSelectedDataReport(card, 'PENALTY')
                                                })
                                            }}
                                            activeOpacity={0.7}
                                            style={[Styles.row, Styles.mTop5]}>
                                            <View
                                                style={[Styles.bw1, card.penalty > 0 ? Styles.bcAsh : Styles.bcLightRed, Styles.br5, Styles.marH5, Styles.mBtm10]}>
                                                <View
                                                    style={[card.penalty > 0 ? Styles.bgLBlueWhite : Styles.bgLPink, Styles.padV10, Styles.alignCenter, {
                                                        width: Dimensions.get('window').width / 3.8,
                                                        height: 55
                                                    }]}>
                                                    <Text
                                                        style={[Styles.f14, card.penalty > 0 ? Styles.cLightNavyBlue : Styles.cLightRed, Styles.aslCenter, Styles.ffRRegular]}>&#x20B9;{' '}{card.penalty === 0 ? 0 : card.penalty || '--'}</Text>
                                                </View>
                                                <View
                                                    style={[Styles.bgWhite, Styles.padV10, Styles.aslCenter, {
                                                        height: 36
                                                    }]}>
                                                    <Text
                                                        style={[Styles.f12, Styles.cLightBlue, Styles.aslCenter, Styles.ffRRegular]}>Penalty</Text>
                                                </View>
                                                <View style={[Styles.posAbsolute, {
                                                    top: 46,
                                                    left: Dimensions.get('window').width / 8.5
                                                }]}>
                                                    {Services.returnCardStatusIcon(penaltyDetailsUpdated)}
                                                </View>
                                            </View>
                                        </TouchableOpacity>

                                        {
                                            card.unRegisteredUserAdhocShift
                                                ?
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        this.setState({tempCardIndex: index, cardIndex: index}, () => {
                                                            this.useSelectedDataReport(card, 'LITE_USER_PAYMENT_DETAILS')
                                                        })
                                                    }}
                                                    activeOpacity={0.7}
                                                    style={[Styles.row, Styles.mTop5,]}>
                                                    <View
                                                        style={[Styles.bw1, card.attrs.amountPaid > 0 ? Styles.bcAsh : Styles.bcLightRed, Styles.br5, Styles.marH5, Styles.mBtm10]}>
                                                        <View
                                                            style={[card.attrs.amountPaid > 0 ? Styles.bgLBlueWhite : Styles.bgLPink, Styles.padV10, Styles.alignCenter, {
                                                                width: Dimensions.get('window').width / 3.8,
                                                                height: 55
                                                            }]}>
                                                            <Text
                                                                numberOfLines={1}
                                                                style={[Styles.f14, card.attrs.amountPaid > 0 ? Styles.cLightNavyBlue : Styles.cLightRed, Styles.aslCenter, Styles.ffRRegular]}>&#x20B9;{' '}{card.attrs ? card.attrs.amountPaid : '' || '--'}</Text>
                                                        </View>
                                                        <View
                                                            style={[Styles.bgWhite, Styles.padV10, Styles.aslCenter, {
                                                                height: 36
                                                            }]}>
                                                            <Text
                                                                style={[Styles.f12, Styles.cLightBlue, Styles.aslCenter, Styles.ffRRegular]}>Payment
                                                                Details</Text>
                                                        </View>
                                                        <View style={[Styles.posAbsolute, {
                                                            top: 46,
                                                            left: Dimensions.get('window').width / 8.5
                                                        }]}>
                                                            {Services.returnCardStatusIcon(liteUserPaymentDetailsUpdated)}
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                                :
                                                null
                                        }

                                    </View>
                                </ScrollView>

                            </View>

                            {/*FOOTER BUTTONS*/}
                            <View>
                                {
                                    this.state.showUnVerifiedTripData
                                    ?
                                        <View style={[Styles.aslStretch, {bottom: 30}]}>
                                            <View style={[Styles.row, Styles.jSpaceBet, Styles.marH20]}>
                                                        <TouchableOpacity
                                                            activeOpacity={0.9}
                                                            disabled={!card.canReject}
                                                            onPress={() => {
                                                                // this.swipeLeft()
                                                                this.setState({
                                                                    rejectCardDetails: card, swipedIndex: index,
                                                                    swipedCurrentCard: false, currentCardCount: index,
                                                                    swipedDirection: 'leftPush'
                                                                }, () => {
                                                                    this.getTripRejectReasons(card.shiftId)
                                                                })
                                                            }}
                                                            style={[Styles.alignCenter, Styles.padV3, !card.canReject ? Styles.bgDisabled : Styles.bgWhite, Styles.br3, Styles.bw1, !card.canReject ? Styles.bcLightAsh : Styles.bcDisabled,
                                                                Styles.OrdersScreenCardshadow, {width: windowWidth / 3.6}]}>
                                                            <Text
                                                                style={[Styles.f14, Styles.padV8, Styles.ffRuBold, Styles.fWbold, !card.canReject ? Styles.cWhite : Styles.cGrey33]}>Reject</Text>
                                                        </TouchableOpacity>

                                                <TouchableOpacity
                                                    activeOpacity={0.9}
                                                    onPress={() => {
                                                        this.setState({
                                                            swipedIndex: index,
                                                            swipedCurrentCard: false,
                                                            currentCardCount: index,
                                                            swipedDirection: 'topPush'
                                                        }, () => {
                                                            if (this.state.currentCardCount + 1 === this.state.cards.length) {
                                                                this.swipeTop()
                                                            } else {
                                                                this.getSecondTripDetails(this.state.cards[this.state.currentCardCount + 1].id, 'SKIP_LATER')
                                                            }
                                                        })
                                                    }}
                                                    style={[Styles.alignCenter, Styles.padV3, Styles.bgWhite, Styles.br3, Styles.bw1, Styles.bcLightWhite,
                                                        Styles.OrdersScreenCardshadow, {width: windowWidth / 3.6}]}>
                                                    <Text
                                                        style={[Styles.f14, Styles.padV8, Styles.ffRuBold, Styles.fWbold, Styles.cGrey33]}>Skip
                                                        For Later</Text>
                                                </TouchableOpacity>

                                                        <TouchableOpacity
                                                            activeOpacity={0.9}
                                                            onPress={() => {
                                                                if (card.role === 10) {
                                                                    if ((card.attrs.requiresClientUserId === 'true' ? (clientUserIdDetailsUpdated) : true) &&
                                                                        (card.attrs.requiresEmployeeId === 'true' ? (clientEmployeeIdDetailsUpdated) : true) &&
                                                                        (card.unRegisteredUserAdhocShift ? liteUserPaymentDetailsUpdated : true) &&
                                                                        (card.tripSheetIdNeeded ? tripSheetIdDetailsUpdated : true) &&
                                                                        (card.attrs.requirePartnerDetails === 'true' ? partnerDetailsUpdated : true) &&
                                                                        (card.requireClientLoginId ? clientLoginIdDetailsUpdated : true) &&
                                                                        (card.requiredPaymentPlan ? paymentPlanDetailsUpdated : true) &&
                                                                        (card.requiredTripType ? operationsTypeDetailsUpdated : true) &&
                                                                        (kilometerDetailsUpdated) && (packageDetailsUpdated) && (shortCashDetailsUpdated) && (penaltyDetailsUpdated)) {
                                                                        this.setState({
                                                                            swipedIndex: index,
                                                                            swipedCurrentCard: false,
                                                                            currentCardCount: index,
                                                                            swipedDirection: 'rightPush'
                                                                        }, () => {
                                                                            this.updateAndVerifyTrip(card.id)
                                                                        })
                                                                    } else {
                                                                        Utils.dialogBox('Please update the details', '');
                                                                    }
                                                                } else if (card.role === 5) {
                                                                    if ((card.attrs.requiresClientUserId === 'true' ? (clientUserIdDetailsUpdated) : true) &&
                                                                        (card.attrs.requiresEmployeeId === 'true' ? (clientEmployeeIdDetailsUpdated) : true) &&
                                                                        (card.unRegisteredUserAdhocShift ? liteUserPaymentDetailsUpdated : true) &&
                                                                        (card.tripSheetIdNeeded ? tripSheetIdDetailsUpdated : true) &&
                                                                        (card.attrs.requirePartnerDetails === 'true' ? partnerDetailsUpdated : true) &&
                                                                        (card.requireClientLoginId ? clientLoginIdDetailsUpdated : true) &&
                                                                        (card.requiredPaymentPlan ? paymentPlanDetailsUpdated : true) &&
                                                                        (card.requiredTripType ? operationsTypeDetailsUpdated : true) &&
                                                                        (kilometerDetailsUpdated) && (shortCashDetailsUpdated) && (penaltyDetailsUpdated)) {
                                                                        this.setState({
                                                                            swipedIndex: index,
                                                                            swipedCurrentCard: false,
                                                                            currentCardCount: index,
                                                                            swipedDirection: 'rightPush'
                                                                        }, () => {
                                                                            this.updateAndVerifyTrip(card.id)
                                                                        })
                                                                    } else {
                                                                        Utils.dialogBox('Please update the details', '');
                                                                    }
                                                                } else if (card.role === 1) {
                                                                    if ((card.attrs.requiresClientUserId === 'true' ? (clientUserIdDetailsUpdated) : true) &&
                                                                        (card.attrs.requiresEmployeeId === 'true' ? (clientEmployeeIdDetailsUpdated) : true) &&
                                                                        (card.unRegisteredUserAdhocShift ? liteUserPaymentDetailsUpdated : true) &&
                                                                        (card.tripSheetIdNeeded ? tripSheetIdDetailsUpdated : true) &&
                                                                        (card.attrs.requirePartnerDetails === 'true' ? partnerDetailsUpdated : true) &&
                                                                        (card.requireClientLoginId ? clientLoginIdDetailsUpdated : true) &&
                                                                        (card.requiredPaymentPlan ? paymentPlanDetailsUpdated : true) &&
                                                                        (card.requiredTripType ? operationsTypeDetailsUpdated : true) &&
                                                                        (packageDetailsUpdated) && (shortCashDetailsUpdated) && (penaltyDetailsUpdated)) {
                                                                        this.setState({
                                                                            swipedIndex: index,
                                                                            swipedCurrentCard: false,
                                                                            currentCardCount: index,
                                                                            swipedDirection: 'rightPush'
                                                                        }, () => {
                                                                            this.updateAndVerifyTrip(card.id)
                                                                        })
                                                                    } else {
                                                                        Utils.dialogBox('Please update the details', '');
                                                                    }
                                                                } else {
                                                                    if ((card.attrs.requiresClientUserId === 'true' ? (clientUserIdDetailsUpdated) : true) &&
                                                                        (card.attrs.requiresEmployeeId === 'true' ? (clientEmployeeIdDetailsUpdated) : true) &&
                                                                        (card.unRegisteredUserAdhocShift ? liteUserPaymentDetailsUpdated : true) &&
                                                                        (card.tripSheetIdNeeded ? tripSheetIdDetailsUpdated : true) &&
                                                                        (card.attrs.requirePartnerDetails === 'true' ? partnerDetailsUpdated : true) &&
                                                                        (card.requireClientLoginId ? clientLoginIdDetailsUpdated : true) &&
                                                                        (card.requiredPaymentPlan ? paymentPlanDetailsUpdated : true) &&
                                                                        (card.requiredTripType ? operationsTypeDetailsUpdated : true) &&
                                                                        (shortCashDetailsUpdated) && (penaltyDetailsUpdated)) {
                                                                        this.setState({
                                                                            swipedIndex: index,
                                                                            currentCardCount: index,
                                                                            swipedDirection: 'rightPush'
                                                                        }, () => {
                                                                            this.updateAndVerifyTrip(card.id)
                                                                        })
                                                                    } else {
                                                                        Utils.dialogBox('Please update the details', '');
                                                                    }
                                                                }
                                                            }}
                                                            disabled={!card.canVerify}
                                                            style={[Styles.alignCenter, Styles.padV3, !card.canVerify ? Styles.bgDisabled : Styles.bgDarkRed, Styles.br3, Styles.bw1, !card.canVerify ? Styles.bcLightAsh : Styles.bcLightRed,
                                                                Styles.OrdersScreenCardshadow, {width: windowWidth / 3.6}]}>
                                                            <Text
                                                                style={[Styles.f14, Styles.padV8, Styles.ffRuBold, Styles.fWbold, Styles.cWhite]}>Verify</Text>
                                                        </TouchableOpacity>
                                            </View>
                                        </View>
                                        :
                                        <View style={[Styles.aslStretch,{bottom:10}]}>

                                            <View style={[Styles.row, Styles.jSpaceBet, Styles.marH20]}>
                                                {
                                                    card.status === 'VERIFIED' || card.status === 'REJECTED'
                                                        ?
                                                        <View>
                                                            <Text style={[Styles.f16,Styles.ffLBlack,
                                                                card.status === 'VERIFIED' ? Styles.colorGreen:card.status === 'REJECTED' ? Styles.cRed:Styles.cBlk]}>{card.status}</Text>
                                                            {
                                                                card.status === 'REJECTED'
                                                                    ?
                                                                    <Text style={[Styles.f14,Styles.ffLBlack,Styles.cBlk]}>{card.rejectedOn}</Text>
                                                                    :
                                                                    card.status === 'VERIFIED'
                                                                        ?
                                                                        <Text style={[Styles.f14,Styles.ffLBlack,Styles.cBlk]}>{card.verifiedOn}</Text>
                                                                        :
                                                                        null
                                                            }
                                                            <View>
                                                                <Text style={[Styles.f14, Styles.cBlk,Styles.ffLBlack]}>{card.uniqueShiftId}</Text>
                                                            </View>
                                                        </View>
                                                        :
                                                        null
                                                }
                                                <View style={[Styles.aslEnd,]}>
                                                    <TouchableOpacity
                                                        activeOpacity={0.9}
                                                        onPress={() => {
                                                            this.setState({
                                                                swipedIndex: index,
                                                                swipedCurrentCard: false,
                                                                currentCardCount: index,
                                                                swipedDirection: 'topPush'
                                                            }, () => {
                                                                if (this.state.currentCardCount + 1 === this.state.cards.length) {
                                                                    this.swipeTop()
                                                                } else {
                                                                    this.getSecondTripDetails(this.state.cards[this.state.currentCardCount + 1].id, 'SKIP_LATER')
                                                                }
                                                            })
                                                        }}
                                                        style={[Styles.alignCenter, Styles.padV3, Styles.bgDarkRed, Styles.br3, Styles.bw1, Styles.bcLightWhite,
                                                            Styles.OrdersScreenCardshadow, {width: windowWidth / 3.6}]}>
                                                        <Text
                                                            style={[Styles.f14, Styles.padV8, Styles.ffRuBold, Styles.fWbold, Styles.cWhite]}>Next</Text>
                                                    </TouchableOpacity>
                                                </View>

                                            </View>
                                        </View>
                                }
                            </View>
                        </View>
                    </View>
                </View>
            )
        }
    };

    onSwiped = (type) => {
        // console.log(`after swiped ${type}`)
        if (type === 'left' || type === 'right' || type === 'top') {
            this.setState({
                cardIndex: this.state.cardIndex - 1,

                nextCardfetched: false,

                finalClientUserID: '',
                finalTripSheetId: '',
                finalEmployeeID: '',
                finalStartingKM: '',
                finalEndingKm: '',
                finalKmDifference: '',
                finalDeliveredPackages: [],
                finalTotalDeliveredCount: '',
                finalPenaltyAmount: '',
                finalPenaltyReason: '',
                finalShortCash: '',

                swipedDirection: type
            })
        } else {
            this.setState({
                cardIndex: this.state.cardIndex - 1,

                finalClientUserID: '',
                finalTripSheetId: '',
                finalEmployeeID: '',
                finalStartingKM: '',
                finalEndingKm: '',
                finalKmDifference: '',
                finalDeliveredPackages: [],
                finalTotalDeliveredCount: '',
                finalPenaltyAmount: '',
                finalPenaltyReason: '',
                finalShortCash: '',

                swipedDirection: type
            })
        }

    }

    onSwiping = () => {
        // console.log('swiping ${type}')
        // this.getSecondTripDetails(this.state.cards[this.state.swipedIndex+1].id)
    };

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
        if (operator === 'onChange') {
            var value = Math.trunc(parseInt(item));
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
                    this.calculatePackages(tempDeliveredPackages)
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
                this.calculatePackages(tempDeliveredPackages)
            }
        }
    }

    // calculatePackages(deliveredPackages, attempts, rejectedCount, cReturnPickedUp) {
    calculatePackages(packagesList) {
        let tempSum = packagesList.reduce((n, {count}) => n + count, 0);
        this.setState({totalDeliveredCount: JSON.stringify(tempSum), tempDeliveredPackages: packagesList})
    }

    useSelectedDataReport(item, selectedButton) {
        this.setState({
            selectedCardTripDetails: item,
            tempClientUserId: item.clientUserId,
            tempTripSheetId: item.tripSheetId,
            tempEmployeeId: item.clientEmployeeId,
            tempPartnerDetails: item.partnerDetails,
            tempStartingKM: JSON.stringify(item.startingKM),
            tempEndingKm: JSON.stringify(item.endingKm),
            pickupPackages: JSON.stringify(item.packages),
            totalDeliveredCount: JSON.stringify(item.packages),
            tempDeliveredPackages: item.deliveredPackages,
            tempRole: item.role,
            penalty: item.penalty ? JSON.stringify(item.penalty) : '0',
            tempPenaltyReason: item.penaltyReasons,
            shortCash: item.shortCash ? JSON.stringify(item.shortCash) : '0',
            tempPlanName: item.planName,
            tempPlanId:item.planId,
            tempUpdatePlanInProfile:item.updatePlanInProfile,
            tempTripType:item.tripType,

            //lite user payment detials
            liteUserAmount: item.attrs.amountPaid,
            liteUserBenName: item.attrs.beneficiaryName,
            liteUserBenAccountNo: item.attrs.beneficiaryAccountNumber,
            liteUserBenPAN: item.attrs.beneficiaryPanNumber,
            liteUserBenIFSC: item.attrs.ifscCode,
            liteUserPaymentType: item.attrs.paymentMode,

            tempSearchPhoneNumber: item.clientLoginIdMobileNumber,

            errorBeneficiaryIFSCcode: null,BeneficaryIFSCverified:null,

            editTripDetailsModal: true,
            editButton: selectedButton
        }, () => {
            this.initialPackages(item.deliveredPackages)
            if (item.supervisorPenalty > 0){
                this.setState({penaltyDetailsUpdated:true})
            }
        })
    };


    // calculatePackages(deliveredPackages, attempts, rejectedCount, cReturnPickedUp) {
    initialPackages(packagesList) {
        let tempSum = packagesList.reduce((n, {count}) => n + count, 0);
        this.setState({totalDeliveredCount: JSON.stringify(tempSum)})
    }

    deckSwiperData() {
        const {cardIndex, infinite} = this.state;
        return (
            <Swiper
                ref={swiper => {
                    this.swiper = swiper
                }}
                backgroundColor={'#fff'}
                // onSwiped={() => this.onSwiped('general')}
                onSwipedLeft={() => this.onSwiped('left')}
                onSwipedRight={() => this.onSwiped('right')}
                onSwipedTop={() => this.onSwiped('top')}
                onSwipedBottom={() => this.onSwiped('bottom')}
                disableBottomSwipe={true}
                disableRightSwipe={true}
                disableLeftSwipe={true}
                disableTopSwipe={true}
                // infinite={true}
                infinite={false}
                cards={this.state.cards}
                // cardIndex={this.state.cardIndex}
                cardIndex={cardIndex}
                cardVerticalMargin={0}
                renderCard={this.renderCard}
                onSwipedAll={this.onSwipedAllCards}
                stackSize={3}
                stackSeparation={3}
                animateOverlayLabelsOpacity
                animateCardOpacity
                swipeBackCard
                overlayLabels={{
                    left: {
                        title: 'REJECT',
                        style: {
                            label: {
                                backgroundColor: '#C91A1F',
                                borderColor: 'black',
                                color: 'white',
                                borderWidth: 1
                            },
                            wrapper: {
                                flexDirection: 'column',
                                alignItems: 'flex-end',
                                // justifyContent: 'flex-start',
                                justifyContent: 'center',
                                // marginTop: 50,
                                marginLeft: -30
                            }
                        }
                    },
                    right: {
                        title: 'VERIFY',
                        style: {
                            label: {
                                backgroundColor: '#36A84C',
                                borderColor: 'black',
                                color: 'white',
                                borderWidth: 1
                            },
                            wrapper: {
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                justifyContent: 'center',
                                // marginTop: 50,
                                marginLeft: 30
                            }
                        }
                    },
                    top: {
                        title: 'SKIP',
                        style: {
                            label: {
                                backgroundColor: '#f8a555',
                                borderColor: 'black',
                                color: 'white',
                                borderWidth: 1
                            },
                            wrapper: {
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                            }
                        }
                    }
                }}
            >
            </Swiper>
        )
    }

    storeFinalValues() {
        const {
            finalClientUserID, finalTripSheetId, finalEmployeeID, finalStartingKM, finalEndingKm, finalKmDifference,
            finalDeliveredPackages, finalTotalDeliveredCount,
            finalPenaltyAmount, finalPenaltyReason, finalShortCash,
            finalPartnerDetails, finalSearchPhoneNumber,finalPlanName,finalPlanId,finalUpdatePlanInProfile,

            clientUserIdDetailsUpdated,
            tripSheetIdDetailsUpdated,
            kilometerDetailsUpdated,
            packageDetailsUpdated,
            shortCashDetailsUpdated,
            penaltyDetailsUpdated, clientEmployeeIdDetailsUpdated, liteUserPaymentDetailsUpdated,
            partnerDetailsUpdated, clientLoginIdDetailsUpdated,paymentPlanDetailsUpdated,operationsTypeDetailsUpdated,

            tempClientUserId,
            tempTripSheetId,
            tempEmployeeId,

            tempStartingKM,
            tempEndingKm,

            tempDeliveredPackages,
            totalDeliveredCount,

            shortCash,
            penalty,
            penaltyReason,tempPenaltyReason,
            tempPartnerDetails, tempSearchPhoneNumber,tempPlanName,tempPlanId,tempUpdatePlanInProfile,
            finalTripType, tempTripType,
            //lite user bank info
            liteUserAmount, liteUserBenName, liteUserBenAccountNo,
            liteUserBenPAN, liteUserBenIFSC, liteUserPaymentType, finalPaymentDetails,

            selectedButton
        } = this.state;


        let totalCards = this.state.cards
        let tempIndex = this.state.cardIndex

        let tempData = totalCards[tempIndex]           //if not keep comment


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
                tempData.startingKM = kilometerDetailsUpdated ? finalStartingKM ? JSON.parse(finalStartingKM) : '' : tempStartingKM ? JSON.parse(tempStartingKM) : ''
                :
                null
        }
        {
            kilometerDetailsUpdated
                ?
                tempData.endingKm = kilometerDetailsUpdated ? finalEndingKm ? JSON.parse(finalEndingKm) : '' : tempEndingKm ? JSON.parse(tempEndingKm) : ''
                :
                null
        }
        {
            kilometerDetailsUpdated
                ?
                tempData.tripDistance = kilometerDetailsUpdated ? finalKmDifference ? JSON.parse(finalKmDifference) : '' : tempData.tripDistance ? JSON.parse(tempData.tripDistance) : ''
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
                tempData.packages = packageDetailsUpdated ? finalTotalDeliveredCount ? JSON.parse(finalTotalDeliveredCount) : '' : totalDeliveredCount ? JSON.parse(totalDeliveredCount) : ''
                :
                null
        }
        if (penaltyDetailsUpdated){
            if(this.state.selectedCardTripDetails.supervisorPenalty === 0){
                tempData.penalty = penaltyDetailsUpdated ? finalPenaltyAmount ? JSON.parse(finalPenaltyAmount) : 0 : penalty ? JSON.parse(penalty) : penalty === '0' ? 0 : ''
                tempData.penaltyReasons = penaltyDetailsUpdated ? finalPenaltyReason : tempPenaltyReason
            }else {
                tempData.penalty = this.state.selectedCardTripDetails.supervisorPenalty
                tempData.penaltyReasons = [this.state.selectedCardTripDetails.supervisorPenaltyReason]
            }
        }
        {
            shortCashDetailsUpdated
                ?
                tempData.shortCash = shortCashDetailsUpdated ? finalShortCash ? JSON.parse(finalShortCash) : 0 : shortCash ? JSON.parse(shortCash) : shortCash === '0' ? 0 : ''
                :
                null
        }
        {
            clientEmployeeIdDetailsUpdated
                ?
                tempData.clientEmployeeId = clientEmployeeIdDetailsUpdated ? finalEmployeeID : tempEmployeeId
                :
                null
        }

        if (liteUserPaymentDetailsUpdated) {
            if(this.state.liteUserPaymentType === 'Later'){
                tempData.attrs.amountPaid = liteUserPaymentDetailsUpdated ? finalPaymentDetails.amountPaid : liteUserAmount
                tempData.attrs.beneficiaryName = liteUserPaymentDetailsUpdated ? finalPaymentDetails.beneficiaryName : liteUserBenName
                tempData.attrs.beneficiaryAccountNumber = liteUserPaymentDetailsUpdated ? finalPaymentDetails.beneficiaryAccountNumber : liteUserBenAccountNo
                tempData.attrs.beneficiaryPanNumber = liteUserPaymentDetailsUpdated ? finalPaymentDetails.beneficiaryPanNumber : liteUserBenPAN
                tempData.attrs.ifscCode = liteUserPaymentDetailsUpdated ? finalPaymentDetails.ifscCode : liteUserBenIFSC
                tempData.attrs.paymentMode = liteUserPaymentDetailsUpdated ? finalPaymentDetails.paymentMode : liteUserPaymentType
            }else {
                tempData.attrs.amountPaid = liteUserPaymentDetailsUpdated ? finalPaymentDetails.amountPaid : liteUserAmount
                tempData.attrs.paymentMode = liteUserPaymentDetailsUpdated ? finalPaymentDetails.paymentMode : liteUserPaymentType
            }
        }

        if (tempData.requiredPaymentPlan && paymentPlanDetailsUpdated) {
                tempData.planName = paymentPlanDetailsUpdated ? finalPlanName : tempPlanName
                tempData.planId = paymentPlanDetailsUpdated ? finalPlanId : tempPlanId
                tempData.updatePlanInProfile = paymentPlanDetailsUpdated ? finalUpdatePlanInProfile : tempUpdatePlanInProfile
            }

        if (partnerDetailsUpdated) {
            tempData.partnerDetails = partnerDetailsUpdated ? finalPartnerDetails : tempPartnerDetails
            }

        if (clientLoginIdDetailsUpdated) {
            tempData.clientLoginIdMobileNumber = clientLoginIdDetailsUpdated ? finalSearchPhoneNumber : tempSearchPhoneNumber
            }

        if (operationsTypeDetailsUpdated) {
                tempData.tripType = operationsTypeDetailsUpdated ? finalTripType : tempTripType
            }


        if (selectedButton === 'EXIT') {
            this.checkSubmittedDetails(totalCards, tempIndex, tempData)
        } else {
            this.setState({
                cards: totalCards,
            }, () => {
                Utils.dialogBox('Details Updated', '')
            })
        }

    }

    checkSubmittedDetails(totalCards, tempIndex, tempData) {
        const {
            clientUserIdDetailsUpdated,
            tripSheetIdDetailsUpdated,
            kilometerDetailsUpdated,
            packageDetailsUpdated,
            shortCashDetailsUpdated,
            penaltyDetailsUpdated,
            clientEmployeeIdDetailsUpdated,
            liteUserPaymentDetailsUpdated,
            partnerDetailsUpdated,
            clientLoginIdDetailsUpdated,
            paymentPlanDetailsUpdated,
            operationsTypeDetailsUpdated
        } = this.state;
        let card = this.state.currentCardDetails;
        if (card.role === 10) {
            if ((card.attrs.requiresClientUserId === 'true' ? (clientUserIdDetailsUpdated) : true) &&
                (card.attrs.requiresEmployeeId === 'true' ? (clientEmployeeIdDetailsUpdated) : true) &&
                (card.unRegisteredUserAdhocShift ? liteUserPaymentDetailsUpdated : true) &&
                (card.tripSheetIdNeeded ? tripSheetIdDetailsUpdated : true) &&
                (card.attrs.requirePartnerDetails === 'true' ? partnerDetailsUpdated : true) &&
                (card.requireClientLoginId ? clientLoginIdDetailsUpdated : true) &&
                (card.requiredPaymentPlan  ? paymentPlanDetailsUpdated : true) &&
                (card.requiredTripType  ? operationsTypeDetailsUpdated : true) &&
                (kilometerDetailsUpdated) && (packageDetailsUpdated) && (shortCashDetailsUpdated) && (penaltyDetailsUpdated)) {
                this.setState({
                    allowVerifySwipe: true,
                    cards: totalCards,
                    cardIndex: tempIndex + 1,
                    editTripDetailsModal: false,
                })
            } else {
                this.setState({
                    allowVerifySwipe: false,
                    cards: totalCards,
                    cardIndex: tempIndex + 1,
                    editTripDetailsModal: false,
                })
            }
        } else if (card.role === 5) {
            if ((card.attrs.requiresClientUserId === 'true' ? (clientUserIdDetailsUpdated) : true) &&
                (card.attrs.requiresEmployeeId === 'true' ? (clientEmployeeIdDetailsUpdated) : true) &&
                (card.unRegisteredUserAdhocShift ? liteUserPaymentDetailsUpdated : true) &&
                (card.tripSheetIdNeeded ? tripSheetIdDetailsUpdated : true) &&
                (card.attrs.requirePartnerDetails === 'true' ? partnerDetailsUpdated : true) &&
                (card.requireClientLoginId ? clientLoginIdDetailsUpdated : true) &&
                (card.requiredPaymentPlan  ? paymentPlanDetailsUpdated : true) &&
                (card.requiredTripType  ? operationsTypeDetailsUpdated : true) &&
                (kilometerDetailsUpdated) && (shortCashDetailsUpdated) && (penaltyDetailsUpdated)) {
                this.setState({
                    allowVerifySwipe: true,
                    cards: totalCards,
                    cardIndex: tempIndex + 1,
                    editTripDetailsModal: false,
                })
            } else {
                this.setState({
                    allowVerifySwipe: false,
                    cards: totalCards,
                    cardIndex: tempIndex + 1,
                    editTripDetailsModal: false,
                })
            }
        } else if (card.role === 1) {
            if ((card.attrs.requiresClientUserId === 'true' ? (clientUserIdDetailsUpdated) : true) &&
                (card.attrs.requiresEmployeeId === 'true' ? (clientEmployeeIdDetailsUpdated) : true) &&
                (card.unRegisteredUserAdhocShift ? liteUserPaymentDetailsUpdated : true) &&
                (card.tripSheetIdNeeded ? tripSheetIdDetailsUpdated : true) &&
                (card.attrs.requirePartnerDetails === 'true' ? partnerDetailsUpdated : true) &&
                (card.requireClientLoginId ? clientLoginIdDetailsUpdated : true) &&
                (card.requiredPaymentPlan  ? paymentPlanDetailsUpdated : true) &&
                (card.requiredTripType  ? operationsTypeDetailsUpdated : true) &&
                (packageDetailsUpdated) && (shortCashDetailsUpdated) && (penaltyDetailsUpdated)) {
                this.setState({
                    allowVerifySwipe: true,
                    cards: totalCards,
                    cardIndex: tempIndex + 1,
                    editTripDetailsModal: false,
                })
            } else {
                this.setState({
                    allowVerifySwipe: false,
                    cards: totalCards,
                    cardIndex: tempIndex + 1,
                    editTripDetailsModal: false,
                })
            }
        } else {
            if ((card.attrs.requiresClientUserId === 'true' ? (clientUserIdDetailsUpdated) : true) &&
                (card.attrs.requiresEmployeeId === 'true' ? (clientEmployeeIdDetailsUpdated) : true) &&
                (card.unRegisteredUserAdhocShift ? liteUserPaymentDetailsUpdated : true) &&
                (card.tripSheetIdNeeded ? tripSheetIdDetailsUpdated : true) &&
                (card.attrs.requirePartnerDetails === 'true' ? partnerDetailsUpdated : true) &&
                (card.requireClientLoginId ? clientLoginIdDetailsUpdated : true) &&
                (card.requiredPaymentPlan  ? paymentPlanDetailsUpdated : true) &&
                (card.requiredTripType  ? operationsTypeDetailsUpdated : true) &&
                (shortCashDetailsUpdated) && (penaltyDetailsUpdated)) {
                this.setState({
                    allowVerifySwipe: true,
                    cards: totalCards,
                    cardIndex: tempIndex + 1,
                    editTripDetailsModal: false,
                })
            } else {
                this.setState({
                    allowVerifySwipe: false,
                    cards: totalCards,
                    cardIndex: tempIndex + 1,
                    editTripDetailsModal: false,
                })
            }
        }
    }

    validatePaymentDetails() {
        let resp;
        let result = {};
        resp = Utils.isValueSelected(this.state.liteUserPaymentType, 'Please select Payment Mode');
        if (resp.status === true) {
            result.paymentMode = resp.message;
            resp = Utils.isEmptyValueEntered(this.state.liteUserAmount, 'Please enter Amount');
            if (resp.status === true) {
                result.amountPaid = resp.message;

            if(this.state.liteUserPaymentType === 'Later'){

                    resp = Utils.isValidFullName(this.state.liteUserBenName);
                    if (resp.status === true) {
                        result.beneficiaryName = resp.message;
                        resp = Utils.isValidBankAccountNumber(this.state.liteUserBenAccountNo);
                        if (resp.status === true) {
                            result.beneficiaryAccountNumber = resp.message;
                            resp = Utils.isValidIFSCCode(this.state.liteUserBenIFSC);
                            if (resp.status === true) {
                                this.setState({spinnerBool:true})
                                    Services.checkIFSCfromList(this.state.liteUserBenIFSC,(ifscCheck) => {
                                        this.setState({spinnerBool:false})
                                if (ifscCheck) {
                                result.ifscCode = resp.message;
                                this.setState({errorBeneficiaryIFSCcode: null,BeneficaryIFSCverified:true});
                                resp = Utils.isValidPAN(this.state.liteUserBenPAN);
                                if (resp.status === true) {
                                    result.beneficiaryPanNumber = resp.message;

                                    this.setState({
                                        finalPaymentDetails: result,
                                        finalLiteUserAmount: this.state.liteUserAmount,
                                        finalLiteUserBenName: this.state.liteUserBenName,
                                        finalLiteUserBenAccountNo: this.state.liteUserBenAccountNo,
                                        finalLiteUserBenPAN: this.state.liteUserBenPAN,
                                        finalLiteUserBenIFSC: this.state.liteUserBenIFSC,
                                        finalLiteUserPaymentType: this.state.liteUserPaymentType,
                                        liteUserPaymentDetailsUpdated: true, selectedButton: 'DONE'
                                    }, () => {
                                        this.storeFinalValues()
                                    })

                                } else {
                                    Utils.dialogBox(resp.message, '')
                                }
                            } else {
                                this.setState({spinnerBool:false,errorBeneficiaryIFSCcode: 'Please enter Verified IFSC Code'});
                            }
                         })
                            } else {
                                Utils.dialogBox(resp.message, '')
                            }
                        } else {
                            Utils.dialogBox(resp.message, '')
                        }
                    } else {
                        Utils.dialogBox(resp.message, '')
                    }
            }else {
                this.setState({
                    finalPaymentDetails: result,
                    finalLiteUserAmount: this.state.liteUserAmount,
                    finalLiteUserPaymentType: this.state.liteUserPaymentType,
                    liteUserPaymentDetailsUpdated: true, selectedButton: 'DONE'
                }, () => {
                    this.storeFinalValues()
                })
            }

            } else {
                Utils.dialogBox(resp.message, '')
            }
        } else {
            Utils.dialogBox(resp.message, '')
        }
    }

    //API CALL to get profile based on phone number search
    getEnteredPhoneNumberProfiles(searchNumber,) {
        const {selectedCardTripDetails} = this.state;
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_PROFILES_BASED_ON_PHONE_NUMBER_SEARCH + 'siteCode=' + selectedCardTripDetails.attrs.siteCode + '&phoneNumber=' + searchNumber;
        const body = {};
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "GET", body, function (response) {
                if (response.status === 200) {
                    self.setState({
                        spinnerBool: false,
                        tempSearchPhoneNumber: searchNumber,
                        phoneNumberSearchData: response.data,
                        selectedClientUserID: '',
                        clientEmployeeId: ''
                    })
                }
            }, function (error) {
                self.errorHandling(error)
            });
        })
    }

    //API CALL TO CHECK Beneficary IFSC CODE
    checkBeneficaryIFSCCode(IFSCcode) {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.VERIFY_IFSC_CODE + '?ifscCode=' + _.toUpper(IFSCcode);
        const body = '';
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response) {
                    self.setState({spinnerBool: false, BeneficaryIFSCverified: response.data});
                }
            }, function (error) {
                self.errorHandling(error)
            });
        });
    }

    searchPaymentPlan = (searchData) => {
        if (searchData) {
            let filteredData = this.state.plansList.filter(function (item) {
                // let tempName = item.name;
                let tempName = item.planName;
                return tempName.toUpperCase().includes(searchData.toUpperCase());
            });
            this.setState({searchedPaymentPlanList: filteredData, planSearchString: searchData});
        } else {
            this.setState({searchedPaymentPlanList: this.state.plansList, planSearchString: searchData})
        }
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
            clientEmployeeIdDetailsUpdated,
            liteUserPaymentDetailsUpdated,
            partnerDetailsUpdated,
            clientLoginIdDetailsUpdated,
            paymentPlanDetailsUpdated,
            operationsTypeDetailsUpdated,
            tempRole,
            cardIndex
        } = this.state;
        // const colors = ['#D6D1B4', '#F3F2F2', '#FFEE93', '#ccf6d8', '#F8F1EC', '#ECF3AB', '#F4EDAB'];
        return (
            <View style={[Styles.flex1, Styles.bgWhite]}>
                {this.renderSpinner()}
                <OfflineNotice/>
                <Appbar.Header style={[Styles.bgDarkRed, Styles.jSpaceBet]}>
                    <Appbar.BackAction onPress={() => this.props.navigation.goBack()}/>
                    <Text
                        style={[Styles.ffRMedium, Styles.cLightWhite, Styles.aslCenter, Styles.f18]}>Trip
                        Verification</Text>
                    <View style={[Styles.padH15]}/>
                </Appbar.Header>
                {/*<View style={{borderBottomWidth: 1, marginBottom: 5,marginTop:5, borderBottomColor: '#E1E1E1'}}/>*/}
                {this.renderSpinner()}
                <View style={[Styles.flex1, Styles.bgWhite]}>
                    <Text style={[Styles.f14,Styles.ffRBlack, Styles.fWbold,Styles.colorLblue,Styles.marH20,Styles.pTop10,Styles.pBtm5]}>Trip type</Text>
                    <View style={[Styles.row, Styles.jSpaceBet,Styles.marH20]}>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={()=>{this.setState({requiredTripFilter:'UN_VERIFIED'},()=>{this.getAllDatesTripCount()})}}
                            style={[Styles.alignCenter, Styles.padV3,this.state.requiredTripFilter === 'UN_VERIFIED' ? Styles.bgDarkRed : Styles.dgLWhite, Styles.br8,
                                Styles.OrdersScreenCardshadow, {width: windowWidth /3.6}]}>
                            <Text
                                style={[Styles.f14, Styles.padV5, Styles.ffRMedium, Styles.fWbold,this.state.requiredTripFilter === 'UN_VERIFIED' ? Styles.colorLWhite : Styles.cGrey33]}>Un Verified</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={()=>{this.setState({requiredTripFilter:'VERIFIED'},()=>{this.getAllDatesTripCount()})}}
                            style={[Styles.alignCenter, Styles.padV3,this.state.requiredTripFilter === 'VERIFIED' ? Styles.bgDarkRed : Styles.dgLWhite, Styles.br8,
                                Styles.OrdersScreenCardshadow, {width: windowWidth /3.6}]}>
                            <Text
                                style={[Styles.f14, Styles.padV5, Styles.ffRMedium, Styles.fWbold,this.state.requiredTripFilter === 'VERIFIED' ? Styles.colorLWhite : Styles.cGrey33]}>Verified</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={()=>{this.setState({requiredTripFilter:'REJECTED'},()=>{this.getAllDatesTripCount()})}}
                            style={[Styles.alignCenter, Styles.padV3,this.state.requiredTripFilter === 'REJECTED' ? Styles.bgDarkRed : Styles.dgLWhite, Styles.br8,
                                Styles.OrdersScreenCardshadow, {width: windowWidth /3.6}]}>
                            <Text
                                style={[Styles.f14, Styles.padV5, Styles.ffRMedium, Styles.fWbold,this.state.requiredTripFilter === 'REJECTED' ? Styles.colorLWhite : Styles.cGrey33]}>Rejected</Text>
                        </TouchableOpacity>
                        {/*<View style={[{width: windowWidth /3.6}]}/>*/}
                    </View>

                    <Text style={[Styles.f14,Styles.ffRRegular, Styles.fWbold,Styles.colorLblue,Styles.marH20,Styles.padV10]}>User type</Text>
                    <View style={[Styles.pBtm10,Styles.marH20]}>
                        <RadioButton.Group
                            onValueChange={filterTripType => this.setState({filterTripType}, () => {
                                this.getAllDatesTripCount()
                            })}
                            value={this.state.filterTripType}>
                            <View style={[]}>

                              <View style={[Styles.row]}>
                                  <View style={[Styles.row, Styles.aslStart,Styles.flex1]}>
                                      <RadioButton value={'ALL'} color={'red'} uncheckedColor={'#C91A1F'}/>
                                      <TouchableOpacity
                                          activeOpacity={0.7}
                                          onPress={()=>{this.setState({filterTripType:'ALL'},()=>{this.getAllDatesTripCount()})}}
                                          style={[Styles.aslCenter]}>
                                          <Text style={[Styles.ffRMedium, Styles.cGrey33,Styles.f16]}>{' '}All</Text>
                                      </TouchableOpacity>
                                  </View>
                                  <View style={[Styles.row, Styles.aslStart,Styles.flex1]}>
                                      <RadioButton value={'LITE_USER'} color={'red'} uncheckedColor={'#C91A1F'}/>
                                      <TouchableOpacity
                                          activeOpacity={0.7}
                                          onPress={()=>{this.setState({filterTripType:'LITE_USER'},()=>{this.getAllDatesTripCount()})}}
                                          style={[Styles.aslCenter]}>
                                          <Text style={[Styles.ffRMedium, Styles.cGrey33,Styles.f16]}>{' '}Lite User</Text>
                                      </TouchableOpacity>
                                  </View>

                              </View>
                              <View style={[Styles.row]}>
                                  <View style={[Styles.row, Styles.aslStart,Styles.flex1]}>
                                      <RadioButton value={'AUTO_CREATED_SHIFT'} color={'red'} uncheckedColor={'#C91A1F'}/>
                                      <TouchableOpacity
                                          activeOpacity={0.7}
                                          onPress={()=>{this.setState({filterTripType:'AUTO_CREATED_SHIFT'},()=>{this.getAllDatesTripCount()})}}
                                      style={[Styles.aslCenter]}>
                                          <Text style={[Styles.ffRMedium, Styles.cGrey33,Styles.f16]}>{' '}Regular auto</Text>
                                      </TouchableOpacity>
                                  </View>
                                  <View style={[Styles.row, Styles.aslStart,Styles.flex1]}>
                                      <RadioButton value={'ADHOC_SHIFT'} color={'red'} uncheckedColor={'#C91A1F'}/>
                                      <TouchableOpacity
                                          activeOpacity={0.7}
                                          onPress={()=>{this.setState({filterTripType:'ADHOC_SHIFT'},()=>{this.getAllDatesTripCount()})}}
                                          style={[Styles.aslCenter]}>
                                          <Text style={[Styles.ffRMedium, Styles.cGrey33,Styles.f16]}>{' '}Regular Manual</Text>
                                      </TouchableOpacity>
                                  </View>
                              </View>
                            </View>
                        </RadioButton.Group>
                    </View>
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
                                // style={[Styles.mTop5]}
                                data={this.state.pendingDatesInfo}
                                renderItem={({item, index}) => {
                                    return (
                                        <TouchableOpacity
                                            onPress={() => {
                                                this.setState({filterDate: item.tripDateStr}, () => {
                                                    this.getMappedSiteCountBasedOnDate()
                                                })
                                            }}
                                            activeOpacity={0.7}
                                            style={[Styles.marH20, Styles.marV7, Styles.row, Styles.aslCenter, Styles.jSpaceBet, Styles.br5, Styles.padH15, Styles.padV15,
                                                Styles.bgLBlueWhite, Styles.TripReportsCardMainshadow, {
                                                    width: Dimensions.get('window').width - 36
                                                }]}>

                                            <View style={[Styles.aslCenter, Styles.row]}>
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


                {/*MODALS START*/}

                {/*Trip Details Show Modal*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.tripDetailsCardModal}
                    onRequestClose={() => {
                        this.setState({tripDetailsCardModal: false}, () => {
                            this.getMappedSiteCountBasedOnDate()
                        })
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View style={[Styles.flex1, Styles.bgBlk, {
                            width: Dimensions.get('window').width,
                            height: Dimensions.get('window').height
                        }]}>
                            {this.state.spinnerBool === false ? null : <CLoader/>}
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
                                                                // }]}>{this.state.cards.length}/{this.state.cards.length}</Text>
                                                            // }]}>{this.state.currentIndex}/{this.state.cards.length}</Text>
                                                            }]}>{this.state.showUnVerifiedTripData ? this.state.currentIndex : this.state.cards.length}/{this.state.cards.length}</Text>
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
                                                                                this.getMappedSiteCountBasedOnDate()
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
                            <View style={[Styles.bgWhite, {
                                width: Dimensions.get('window').width,
                                height: editModalHeight
                            }]}>
                                {this.state.spinnerBool === false ? null : <CLoader/>}
                                <View style={[Styles.flex1, Styles.bgWhite, {
                                    borderTopRightRadius: 10,
                                    borderTopLeftRadius: 10
                                }]}>
                                    <View
                                        style={[Styles.row, Styles.jSpaceBet, Styles.bgWhite, Styles.padV10, Styles.brdrBtm1, {
                                            borderBottomColor: '#D1D1D1',
                                            borderTopRightRadius: 10,
                                            borderTopLeftRadius: 10
                                        }]}>
                                        <Text
                                            style={[Styles.ffRMedium, Styles.f16, Styles.aslCenter, Styles.padH20, Styles.cBlack87, Styles.padV8]}>Edit
                                            Trip Information</Text>
                                    </View>

                                    {
                                        selectedCardTripDetails
                                            ?
                                            <View
                                                style={[Styles.row, Styles.jSpaceBet, Styles.bgWhite, {height: subEditHeightBy60}]}>

                                                {/*TITLES CARDS*/}
                                                <ScrollView
                                                    persistentScrollbar={true}
                                                    style={[Styles.bgWhite, Styles.flex1, Styles.brdrRt1]}>

                                                    {
                                                        selectedCardTripDetails.requiredPaymentPlan
                                                            ?
                                                            <View>
                                                                <TouchableOpacity
                                                                    activeOpacity={0.7}
                                                                    onPress={() => {
                                                                        this.useSelectedDataReport(selectedCardTripDetails, 'PAYMENT_PLAN')
                                                                    }}
                                                                    style={[Styles.row, Styles.padV20, Styles.padH15, Styles.jSpaceBet, Styles.bgLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                    <View/>
                                                                    <Text
                                                                        style={[editButton === 'PAYMENT_PLAN' ? Styles.fWbold : null, Styles.ffRRegular, Styles.f14, Styles.cBlack68]}>Payment Plan</Text>
                                                                    <View style={[Styles.aslCenter, Styles.padH5]}>
                                                                        {Services.returnCardStatusIcon(paymentPlanDetailsUpdated)}
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

                                                    {/*OPERATIONS TYPE*/}
                                                    {
                                                        selectedCardTripDetails.requiredTripType
                                                            ?
                                                            <View>
                                                                <TouchableOpacity
                                                                    activeOpacity={0.7}
                                                                    onPress={() => {
                                                                        this.useSelectedDataReport(selectedCardTripDetails, 'OPERATIONS_TYPE')
                                                                    }}
                                                                    style={[Styles.row, Styles.padV20, Styles.padH15, Styles.jSpaceBet, Styles.bgLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                    <View/>
                                                                    <Text
                                                                        style={[editButton === 'OPERATIONS_TYPE' ? Styles.fWbold : null, Styles.ffRRegular, Styles.f14, Styles.cBlack68]}>Operations Type</Text>
                                                                    <View style={[Styles.aslCenter, Styles.padH5]}>
                                                                        {Services.returnCardStatusIcon(operationsTypeDetailsUpdated)}
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

                                                    {/*PARTNER_DETAILS*/}
                                                    {
                                                        selectedCardTripDetails.attrs.requirePartnerDetails === 'true'
                                                            ?
                                                            <View>
                                                                <TouchableOpacity
                                                                    activeOpacity={0.7}
                                                                    onPress={() => {
                                                                        this.useSelectedDataReport(selectedCardTripDetails, 'PARTNER_DETAILS')
                                                                    }}
                                                                    style={[Styles.row, Styles.padV20, Styles.padH15, Styles.jSpaceBet, Styles.bgLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                    <View/>
                                                                    <Text
                                                                        style={[editButton === 'PARTNER_DETAILS' ? Styles.fWbold : null, Styles.ffRRegular, Styles.f14, Styles.cBlack68]}>Partner</Text>
                                                                    <View style={[Styles.aslCenter, Styles.padH5]}>
                                                                        {Services.returnCardStatusIcon(partnerDetailsUpdated)}
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
                                                                        style={[Styles.row, Styles.padV20, Styles.padH15, Styles.jSpaceBet, Styles.bgLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                        <View/>
                                                                        <Text
                                                                            style={[editButton === 'CLIENT_USER_ID' ? Styles.fWbold : null, Styles.ffRRegular, Styles.f14, Styles.cBlack68]}>Client
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
                                                    {
                                                        selectedCardTripDetails.requireClientLoginId
                                                            ?
                                                            <View>
                                                                <TouchableOpacity
                                                                    activeOpacity={0.7}
                                                                    onPress={() => {
                                                                        this.useSelectedDataReport(selectedCardTripDetails, 'CLIENT_LOGIN_ID')
                                                                        this.getEnteredPhoneNumberProfiles(selectedCardTripDetails.clientLoginIdMobileNumber)
                                                                    }}
                                                                    style={[Styles.row, Styles.padV20, Styles.padH15, Styles.jSpaceBet, Styles.bgLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                    <View/>
                                                                    <Text
                                                                        style={[editButton === 'CLIENT_LOGIN_ID' ? Styles.fWbold : null, Styles.ffRRegular, Styles.f14, Styles.cBlack68]}>Client
                                                                        Login Id</Text>
                                                                    <View style={[Styles.aslCenter, Styles.padH5]}>
                                                                        {Services.returnCardStatusIcon(clientLoginIdDetailsUpdated)}
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
                                                        selectedCardTripDetails.attrs
                                                            ?
                                                            selectedCardTripDetails.attrs.requiresEmployeeId === 'true'
                                                                ?
                                                                <View>
                                                                    <TouchableOpacity
                                                                        activeOpacity={0.7}
                                                                        onPress={() => {
                                                                            this.useSelectedDataReport(selectedCardTripDetails, 'EMPLOYEE_ID')
                                                                        }}
                                                                        style={[Styles.row, Styles.padV20, Styles.padH15, Styles.jSpaceBet, Styles.bgLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                        <View/>
                                                                        <Text
                                                                            style={[editButton === 'EMPLOYEE_ID' ? Styles.fWbold : null, Styles.ffRRegular, Styles.f14, Styles.cBlack68]}>Employee
                                                                            ID</Text>
                                                                        <View style={[Styles.aslCenter, Styles.padH5]}>
                                                                            {Services.returnCardStatusIcon(clientEmployeeIdDetailsUpdated)}
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

                                                    {
                                                        selectedCardTripDetails.tripSheetIdNeeded
                                                            ?
                                                            <View>
                                                                <TouchableOpacity
                                                                    activeOpacity={0.7}
                                                                    onPress={() => {
                                                                        this.useSelectedDataReport(selectedCardTripDetails, 'TRIP_SHEET_ID')
                                                                    }}
                                                                    style={[Styles.row, Styles.padV20, Styles.padH15, Styles.jSpaceBet, Styles.bgLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                    <View/>
                                                                    <Text
                                                                        style={[editButton === 'TRIP_SHEET_ID' ? Styles.fWbold : null, Styles.ffRRegular, Styles.f14, Styles.cBlack68]}>Trip
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
                                                            :
                                                            null
                                                    }

                                                    {
                                                        selectedCardTripDetails.role === 1 || selectedCardTripDetails.role === 10
                                                            ?
                                                            <View>
                                                                <TouchableOpacity
                                                                    activeOpacity={0.7}
                                                                    onPress={() => {
                                                                        this.useSelectedDataReport(selectedCardTripDetails, 'PACKAGES')
                                                                    }}
                                                                    style={[Styles.row, Styles.padV20, Styles.padH15, Styles.jSpaceBet, Styles.bgLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                    <View/>
                                                                    <Text
                                                                        style={[editButton === 'PACKAGES' ? Styles.fWbold : null, Styles.ffRRegular, Styles.f14, Styles.cBlack68]}>Packages</Text>
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
                                                        selectedCardTripDetails.role === 5 || selectedCardTripDetails.role === 10
                                                            ?
                                                            <View>
                                                                <TouchableOpacity
                                                                    activeOpacity={0.7}
                                                                    onPress={() => {
                                                                        this.useSelectedDataReport(selectedCardTripDetails, 'KILOMETER')
                                                                    }}
                                                                    style={[Styles.row, Styles.padV20, Styles.padH15, Styles.jSpaceBet, Styles.bgLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                    <View/>
                                                                    <Text
                                                                        style={[editButton === 'KILOMETER' ? Styles.fWbold : null, Styles.ffRRegular, Styles.f14, Styles.cBlack68]}>Kilometer</Text>
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
                                                                this.useSelectedDataReport(selectedCardTripDetails, 'SHORT_CASH')
                                                            }}
                                                            style={[Styles.row, Styles.padV20, Styles.padH15, Styles.jSpaceBet, Styles.bgLightWhite, Styles.OrdersScreenCardshadow]}>
                                                            <View/>
                                                            <Text
                                                                style={[editButton === 'SHORT_CASH' ? Styles.fWbold : null, Styles.ffRRegular, Styles.f14, Styles.cBlack68]}>Short
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
                                                                this.useSelectedDataReport(selectedCardTripDetails, 'PENALTY')
                                                            }}
                                                            style={[Styles.row, Styles.padV20, Styles.padH15, Styles.jSpaceBet, Styles.bgLightWhite, Styles.OrdersScreenCardshadow]}>
                                                            <View/>
                                                            <Text
                                                                style={[editButton === 'PENALTY' ? Styles.fWbold : null, Styles.ffRRegular, Styles.f14, Styles.cBlack68]}>Penalty</Text>
                                                            <View style={[Styles.aslCenter, Styles.padH5]}>
                                                                {Services.returnCardStatusIcon(penaltyDetailsUpdated)}
                                                            </View>
                                                        </TouchableOpacity>
                                                        <View style={{
                                                            borderBottomWidth: 1,
                                                            borderBottomColor: '#D1D1D1'
                                                        }}/>
                                                    </View>

                                                    {/*LITE USER PAYMENT DETAILS*/}
                                                    {
                                                        selectedCardTripDetails.unRegisteredUserAdhocShift
                                                            ?
                                                            <View>
                                                                <TouchableOpacity
                                                                    activeOpacity={0.7}
                                                                    onPress={() => {
                                                                        this.useSelectedDataReport(selectedCardTripDetails, 'LITE_USER_PAYMENT_DETAILS')
                                                                    }}
                                                                    style={[Styles.row, Styles.padV20, Styles.padH15, Styles.jSpaceBet, Styles.bgLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                    <View/>
                                                                    <Text
                                                                        style={[editButton === 'LITE_USER_PAYMENT_DETAILS' ? Styles.fWbold : null, Styles.ffRRegular, Styles.f14, Styles.cBlack68]}>Payment</Text>
                                                                    <View style={[Styles.aslCenter, Styles.padH5]}>
                                                                        {Services.returnCardStatusIcon(liteUserPaymentDetailsUpdated)}
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

                                                    <View style={{marginVertical: 40}}/>
                                                </ScrollView>

                                                <View style={[{flex: 1.4}, Styles.bgWhite]}>

                                                    {
                                                        editButton === 'CLIENT_USER_ID'
                                                            ?
                                                            <ScrollView style={[Styles.flex1, Styles.p15,]}>
                                                                <Text
                                                                    style={[Styles.ffRLight, Styles.f18, Styles.cBlack87]}>Client
                                                                    User ID</Text>
                                                                <ScrollView
                                                                    style={[{height: subEditHeightBy60 - 100}]}>
                                                                    <Text
                                                                        style={[Styles.ffRRegular, Styles.f14, Styles.pTop15, Styles.cGrey33]}>Entered
                                                                        by Fleet</Text>
                                                                    <View
                                                                        style={[Styles.aslCenter, Styles.bgLBlueWhite, Styles.mTop10, Styles.p10, {
                                                                            width: subEditDetialsWidth
                                                                        }]}>
                                                                        <Text
                                                                            numberOfLines={4}
                                                                            style={[Styles.ffRMedium, Styles.f16, Styles.cGrey4F]}>{selectedCardTripDetails.dataBeforeUpdate ? selectedCardTripDetails.dataBeforeUpdate.clientUserId : ''}</Text>
                                                                    </View>

                                                                    <Text
                                                                        style={[Styles.ffRRegular, Styles.f14, Styles.pTop15, Styles.cGrey33]}>Update
                                                                        Client User ID</Text>

                                                                    <TextInput
                                                                        style={[Styles.aslCenter, Styles.bw1, Styles.bcLightBlue, Styles.mTop10, Styles.cGrey33, Styles.ffRMedium, {
                                                                            width: subEditDetialsWidth,
                                                                            fontSize: 16,
                                                                            padding: 10
                                                                        }]}
                                                                        selectionColor={"black"}
                                                                        editable={this.state.showUnVerifiedTripData}
                                                                        multiline={true}
                                                                        returnKeyType="done"
                                                                        onSubmitEditing={() => {
                                                                            Keyboard.dismiss()
                                                                        }}
                                                                        onChangeText={(tempClientUserId) => this.setState({tempClientUserId})}
                                                                        value={this.state.tempClientUserId}
                                                                    />
                                                                </ScrollView>
                                                                {
                                                                    !this.state.showUnVerifiedTripData
                                                                    ?
                                                                        <View
                                                                            style={[Styles.jSpaceBet, Styles.row, Styles.mBtm10]}>
                                                                            <TouchableOpacity
                                                                                onPress={() => this.setState({editTripDetailsModal: false})}
                                                                                activeOpacity={0.7}
                                                                                style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth / 4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                                <Text
                                                                                    style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                        color: '#C91A1F'
                                                                                    }, Styles.aslCenter, Styles.p5]}>Exit</Text>
                                                                            </TouchableOpacity>
                                                                        </View>
                                                                        :
                                                                        <View style={[Styles.jSpaceBet, Styles.row, Styles.mBtm10]}>
                                                                            <TouchableOpacity
                                                                                onPress={() => this.setState({selectedButton: 'EXIT'}, () => {
                                                                                    this.storeFinalValues()
                                                                                })}
                                                                                activeOpacity={0.7}
                                                                                style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth / 4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                                <Text
                                                                                    style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                        color: '#C91A1F'
                                                                                    }, Styles.aslCenter, Styles.p5]}>Exit</Text>
                                                                            </TouchableOpacity>

                                                                            <TouchableOpacity
                                                                                onPress={() => {
                                                                                    let resp = {}
                                                                                    resp = Utils.isValidClientUserIdTripsifEmpty(this.state.tempClientUserId);
                                                                                    if (resp.status === true) {
                                                                                        this.setState({
                                                                                            finalClientUserID: this.state.tempClientUserId,
                                                                                            clientUserIdDetailsUpdated: true,
                                                                                            selectedButton: 'DONE'
                                                                                        }, () => {
                                                                                            this.storeFinalValues()
                                                                                        })
                                                                                    } else {
                                                                                        Utils.dialogBox(resp.message, '');
                                                                                    }
                                                                                }}
                                                                                activeOpacity={0.7}
                                                                                style={[Styles.aslCenter, {
                                                                                    backgroundColor: '#C91A1F',
                                                                                    width: windowWidth / 4.3
                                                                                }, Styles.br5, Styles.padV5, Styles.OrdersScreenCardshadow]}>
                                                                                <Text
                                                                                    style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, Styles.cWhite, Styles.aslCenter, Styles.p5]}>Done</Text>
                                                                            </TouchableOpacity>
                                                                        </View>
                                                                }
                                                            </ScrollView>
                                                            :
                                                            editButton === 'TRIP_SHEET_ID'
                                                                ?
                                                                <ScrollView
                                                                    style={[Styles.flex1, Styles.p15]}>
                                                                    <Text
                                                                        style={[Styles.ffRLight, Styles.f18, Styles.cBlack87]}>Trip
                                                                        Sheet ID</Text>
                                                                    <ScrollView
                                                                        style={[{height: subEditHeightBy60 - 100}]}>
                                                                        <Text
                                                                            style={[Styles.ffRRegular, Styles.f14, Styles.pTop15, Styles.cGrey33]}>Entered
                                                                            by Fleet</Text>
                                                                        <View
                                                                            style={[Styles.aslCenter, Styles.bgLBlueWhite, Styles.mTop10, Styles.p10, {
                                                                                width: subEditDetialsWidth,
                                                                            }]}>
                                                                            <Text
                                                                                numberOfLines={4}
                                                                                style={[Styles.ffRRegular, Styles.f18, Styles.cGrey4F]}>{selectedCardTripDetails.dataBeforeUpdate ? selectedCardTripDetails.dataBeforeUpdate.tripSheetId : ''}</Text>
                                                                        </View>

                                                                        <Text
                                                                            style={[Styles.ffRRegular, Styles.f14, Styles.pTop15, Styles.cGrey33]}>Update
                                                                            Trip Sheet ID</Text>
                                                                        <TextInput
                                                                            style={[Styles.aitStart, Styles.bw1, Styles.bcLightBlue, Styles.mTop10, Styles.cGrey33, {
                                                                                width: subEditDetialsWidth,
                                                                                fontSize: 16,
                                                                                padding: 10
                                                                            }]}
                                                                            selectionColor={"black"}
                                                                            editable={this.state.showUnVerifiedTripData}
                                                                            multiline={true}
                                                                            returnKeyType="done"
                                                                            onSubmitEditing={() => {
                                                                                Keyboard.dismiss()
                                                                            }}
                                                                            onChangeText={(tempTripSheetId) => this.setState({tempTripSheetId})}
                                                                            value={this.state.tempTripSheetId}
                                                                        />

                                                                    </ScrollView>
                                                                    {
                                                                        !this.state.showUnVerifiedTripData
                                                                            ?
                                                                            <View
                                                                                style={[Styles.jSpaceBet, Styles.row, Styles.mBtm10]}>
                                                                                <TouchableOpacity
                                                                                    onPress={() => this.setState({editTripDetailsModal: false})}
                                                                                    activeOpacity={0.7}
                                                                                    style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth / 4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                                    <Text
                                                                                        style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                            color: '#C91A1F'
                                                                                        }, Styles.aslCenter, Styles.p5]}>Exit</Text>
                                                                                </TouchableOpacity>
                                                                            </View>
                                                                            :
                                                                            <View
                                                                                style={[Styles.jSpaceBet, Styles.row, Styles.marV10]}>
                                                                                <TouchableOpacity
                                                                                    onPress={() => this.setState({selectedButton: 'EXIT'}, () => {
                                                                                        this.storeFinalValues()
                                                                                    })}
                                                                                    activeOpacity={0.7}
                                                                                    style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth / 4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
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
                                                                                            this.setState({
                                                                                                finalTripSheetId: this.state.tempTripSheetId,
                                                                                                tripSheetIdDetailsUpdated: true,
                                                                                                selectedButton: 'DONE'
                                                                                            }, () => {
                                                                                                this.storeFinalValues()
                                                                                            })
                                                                                        } else {
                                                                                            Utils.dialogBox(resp.message, '');
                                                                                        }
                                                                                    }}
                                                                                    activeOpacity={0.7}
                                                                                    style={[Styles.aslCenter, {
                                                                                        backgroundColor: '#C91A1F',
                                                                                        width: windowWidth / 4.3
                                                                                    }, Styles.br5, Styles.padV5, Styles.OrdersScreenCardshadow]}>
                                                                                    <Text
                                                                                        style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, Styles.cWhite, Styles.aslCenter, Styles.p5]}>Done</Text>
                                                                                </TouchableOpacity>
                                                                            </View>
                                                                    }
                                                                </ScrollView>
                                                                :
                                                                editButton === 'KILOMETER'
                                                                    ?
                                                                    <View
                                                                        style={[Styles.flex1, Styles.p15]}>
                                                                        <Text
                                                                            style={[Styles.ffRLight, Styles.f18, Styles.cBlack87]}>Kilometer</Text>
                                                                        {
                                                                            selectedCardTripDetails.systemCalculatedTripDistance > 0
                                                                                ?
                                                                                    <View
                                                                                        style={[Styles.aslCenter, Styles.bgLBlueWhite, Styles.p10, Styles.mTop5, {
                                                                                            width: subEditDetialsWidth,
                                                                                        }]}>
                                                                                        <Text
                                                                                            style={[Styles.ffRMedium, Styles.f18, Styles.cGrey4F]}>System Calculated: {selectedCardTripDetails.systemCalculatedTripDistance}</Text>
                                                                                    </View>
                                                                                :
                                                                                null
                                                                        }

                                                                        <Text
                                                                            // style={[Styles.ffRRegular, Styles.f14, Styles.mTop5, Styles.cGrey33]}>Total Distance</Text>
                                                                            style={[Styles.ffRRegular, Styles.f14, Styles.mTop5, Styles.cGrey33]}>Distance Entered by Fleet</Text>
                                                                        <View
                                                                            style={[Styles.aslCenter, Styles.bgLBlueWhite, Styles.p10, Styles.mTop5, {
                                                                                width: subEditDetialsWidth,
                                                                            }]}>
                                                                            <Text
                                                                                style={[Styles.ffRMedium, Styles.f18, Styles.cGrey4F]}>{
                                                                                this.state.tempEndingKm && this.state.tempStartingKM
                                                                                    ?
                                                                                    this.state.tempEndingKm >= this.state.tempStartingKM
                                                                                        ?
                                                                                        JSON.parse(this.state.tempEndingKm) - JSON.parse(this.state.tempStartingKM) : '' : ''
                                                                            }</Text>
                                                                        </View>
                                                                        <ScrollView
                                                                            style={[{height: subEditHeightBy60 - 100}]}>

                                                                            <View>
                                                                                <Text
                                                                                    style={[Styles.ffRRegular, Styles.f14, Styles.pTop15, Styles.cGrey4F]}>Start
                                                                                    Km</Text>

                                                                                <View>
                                                                                    <View>
                                                                                        <TouchableOpacity
                                                                                            style={[Styles.row, Styles.aslCenter]}
                                                                                            disabled={!selectedCardTripDetails.startOdometerReadingUploadUrl}
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
                                                                                                    width: windowWidth / 2,
                                                                                                    height: 98
                                                                                                }, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                                                                source={selectedCardTripDetails.startOdometerReadingUploadUrl ? {uri: selectedCardTripDetails.startOdometerReadingUploadUrl} : null}
                                                                                            />
                                                                                        </TouchableOpacity>
                                                                                        {
                                                                                            selectedCardTripDetails.startOdometerReadingUploadUrl
                                                                                                ?
                                                                                                <MaterialIcons
                                                                                                    name="zoom-in"
                                                                                                    size={28}
                                                                                                    color="#000"
                                                                                                    style={[Styles.ZoomIconPosition]}/>
                                                                                                :
                                                                                                null
                                                                                        }
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
                                                                                    style={[Styles.aitStart, Styles.bw1, Styles.bcLightAsh, Styles.mTop10, Styles.cGrey33, Styles.ffRMedium,
                                                                                        {
                                                                                            width: windowWidth / 2,
                                                                                            fontSize: 16,
                                                                                            padding: 10
                                                                                        }]}
                                                                                    selectionColor={"black"}
                                                                                    editable={this.state.showUnVerifiedTripData}
                                                                                    maxLength={6}
                                                                                    keyboardType='numeric'
                                                                                    returnKeyType="done"
                                                                                    onSubmitEditing={() => {
                                                                                        Keyboard.dismiss()
                                                                                    }}
                                                                                    onChangeText={(tempStartingKM) => this.OdometerReadingValidate(tempStartingKM, 'onChange', 'startingKM')}
                                                                                    value={this.state.tempStartingKM}
                                                                                />
                                                                            </View>

                                                                            <View>
                                                                                <Text
                                                                                    style={[Styles.ffRRegular, Styles.f14, Styles.pTop10, Styles.cGrey33]}>End
                                                                                    Km</Text>

                                                                                <View>
                                                                                    <View>
                                                                                        <TouchableOpacity
                                                                                            style={[Styles.row, Styles.aslCenter]}
                                                                                            disabled={!selectedCardTripDetails.endOdometerReadingUploadUrl}
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
                                                                                                    width: windowWidth / 2,
                                                                                                    height: 98
                                                                                                }, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                                                                source={selectedCardTripDetails.endOdometerReadingUploadUrl ? {uri: selectedCardTripDetails.endOdometerReadingUploadUrl} : null}
                                                                                            />
                                                                                        </TouchableOpacity>
                                                                                        {
                                                                                            selectedCardTripDetails.endOdometerReadingUploadUrl
                                                                                                ?
                                                                                                <MaterialIcons
                                                                                                    name="zoom-in"
                                                                                                    size={28}
                                                                                                    color="#000"
                                                                                                    style={[Styles.ZoomIconPosition]}/>
                                                                                                :
                                                                                                null
                                                                                        }
                                                                                        <ActivityIndicator
                                                                                            style={[Styles.ImageUploadActivityIndicator]}
                                                                                            animating={this.state.imageLoading}
                                                                                        />
                                                                                    </View>
                                                                                </View>

                                                                                <TextInput
                                                                                    style={[Styles.aitStart, Styles.bw1, Styles.bcLightAsh, Styles.mTop10, Styles.ffRMedium, Styles.cGrey33, {
                                                                                        width: windowWidth / 2,fontSize: 16,
                                                                                        padding: 10
                                                                                    }]}
                                                                                    selectionColor={"black"}
                                                                                    editable={this.state.showUnVerifiedTripData}
                                                                                    maxLength={6}
                                                                                    keyboardType='numeric'
                                                                                    onChangeText={(tempEndingKm) => this.OdometerReadingValidate(tempEndingKm, 'onChange', 'endingKm')}
                                                                                    value={this.state.tempEndingKm}
                                                                                />
                                                                            </View>


                                                                        </ScrollView>
                                                                        {
                                                                            !this.state.showUnVerifiedTripData
                                                                                ?
                                                                                <View
                                                                                    style={[Styles.jSpaceBet, Styles.row, Styles.mBtm10]}>
                                                                                    <TouchableOpacity
                                                                                        onPress={() => this.setState({editTripDetailsModal: false})}
                                                                                        activeOpacity={0.7}
                                                                                        style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth / 4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                                        <Text
                                                                                            style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                                color: '#C91A1F'
                                                                                            }, Styles.aslCenter, Styles.p5]}>Exit</Text>
                                                                                    </TouchableOpacity>
                                                                                </View>
                                                                                :
                                                                                <View
                                                                                    style={[Styles.jSpaceBet, Styles.row, Styles.mTop5]}>
                                                                                    <TouchableOpacity
                                                                                        onPress={() => this.setState({selectedButton: 'EXIT'}, () => {
                                                                                            this.storeFinalValues()
                                                                                        })}
                                                                                        activeOpacity={0.7}
                                                                                        style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth / 4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                                        <Text
                                                                                            style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                                color: '#C91A1F'
                                                                                            }, Styles.aslCenter, Styles.p5]}>Exit</Text>
                                                                                    </TouchableOpacity>

                                                                                    <TouchableOpacity
                                                                                        onPress={() => {
                                                                                            let resp = {}
                                                                                            resp = Utils.CompareOdometerReadings(this.state.tempStartingKM, this.state.tempEndingKm);
                                                                                            if (resp.status === true) {

                                                                                                this.setState({
                                                                                                    finalStartingKM: this.state.tempStartingKM,
                                                                                                    finalEndingKm: this.state.tempEndingKm,
                                                                                                    finalKmDifference: resp.message,
                                                                                                    kilometerDetailsUpdated: true,
                                                                                                    selectedButton: 'DONE'
                                                                                                }, () => {
                                                                                                    this.storeFinalValues()
                                                                                                })

                                                                                            } else {
                                                                                                Utils.dialogBox(resp.message, '');
                                                                                            }
                                                                                        }}
                                                                                        activeOpacity={0.7}
                                                                                        style={[Styles.aslCenter, {
                                                                                            backgroundColor: '#C91A1F',
                                                                                            width: windowWidth / 4.3
                                                                                        }, Styles.br5, Styles.padV5, Styles.OrdersScreenCardshadow]}>
                                                                                        <Text
                                                                                            style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, Styles.cWhite, Styles.aslCenter, Styles.p5]}>Done</Text>
                                                                                    </TouchableOpacity>
                                                                                </View>
                                                                        }
                                                                    </View>
                                                                    :
                                                                    editButton === 'PACKAGES'
                                                                        ?
                                                                        <View
                                                                            style={[Styles.flex1, Styles.p15]}>
                                                                            <Text
                                                                                style={[Styles.ffRLight, Styles.f18, Styles.cBlack87]}>Delivery</Text>

                                                                            <Text
                                                                                style={[Styles.ffRRegular, Styles.f14, Styles.mTop5, Styles.cGrey33]}>Total
                                                                                Count</Text>
                                                                            <View
                                                                                style={[Styles.aslCenter, Styles.bgLBlueWhite, Styles.p10, Styles.mTop5, {
                                                                                    width: subEditDetialsWidth,
                                                                                }]}>
                                                                                <Text
                                                                                    style={[Styles.ffRMedium, Styles.f18, Styles.cGrey4F]}>{this.state.totalDeliveredCount}</Text>
                                                                            </View>


                                                                            <ScrollView
                                                                                persistentScrollbar={true}
                                                                                style={[{height: subEditHeightBy60 / 1.2}, Styles.marV5]}
                                                                            >
                                                                                <FlatList
                                                                                    data={tempDeliveredPackages}
                                                                                    renderItem={({item, index}) =>
                                                                                        <View
                                                                                            style={[Styles.marH10, Styles.mTop3]}>
                                                                                            <Text
                                                                                                numberOfLines={1}
                                                                                                style={[Styles.ffRRegular, Styles.f14, Styles.padV3, Styles.pRight15, Styles.cGrey33]}>{_.startCase(_.lowerCase(item.name))}</Text>
                                                                                            <View
                                                                                                style={[Styles.row, Styles.jSpaceBet,]}>
                                                                                                <TouchableOpacity
                                                                                                    style={[Styles.aslCenter]}
                                                                                                    disabled={item.count === 0 || !this.state.showUnVerifiedTripData}
                                                                                                    onPress={() => this.deliveredPackageValidation(tempDeliveredPackages[index].count, 'Decrement', 'deliveredPackages', index)}
                                                                                                >
                                                                                                    <Text
                                                                                                        style={[Styles.ffRRegular, Styles.bw1, Styles.bgBlk, Styles.padH15, Styles.padV10, Styles.cWhite, Styles.f20]}
                                                                                                    >-</Text></TouchableOpacity>
                                                                                                <View>
                                                                                                    <TextInput
                                                                                                        style={[Styles.txtAlignCen, Styles.bw1, Styles.bcAsh, Styles.ffRMedium, Styles.cGrey33, {
                                                                                                            width: windowWidth / 6,
                                                                                                            fontSize: 16
                                                                                                        }]}
                                                                                                        selectionColor={"black"}
                                                                                                        maxLength={6}
                                                                                                        editable={this.state.showUnVerifiedTripData}
                                                                                                        keyboardType='numeric'
                                                                                                        returnKeyType="done"
                                                                                                        onSubmitEditing={() => {
                                                                                                            Keyboard.dismiss()
                                                                                                        }}
                                                                                                        onChangeText={(value) => this.deliveredPackageValidation(value, 'onChange', 'deliveredPackages', index)}
                                                                                                        value={item.count === '' ? item.count : JSON.stringify(item.count)}
                                                                                                    />
                                                                                                </View>
                                                                                                <TouchableOpacity
                                                                                                    style={[Styles.aslCenter]}
                                                                                                    disabled={item.count === 999998 || !this.state.showUnVerifiedTripData}
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

                                                                            {
                                                                                !this.state.showUnVerifiedTripData
                                                                                    ?
                                                                                    <View
                                                                                        style={[Styles.jSpaceBet, Styles.row, Styles.mBtm10]}>
                                                                                        <TouchableOpacity
                                                                                            onPress={() => this.setState({editTripDetailsModal: false})}
                                                                                            activeOpacity={0.7}
                                                                                            style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth / 4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                                            <Text
                                                                                                style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                                    color: '#C91A1F'
                                                                                                }, Styles.aslCenter, Styles.p5]}>Exit</Text>
                                                                                        </TouchableOpacity>
                                                                                    </View>
                                                                                    :
                                                                                    <View
                                                                                        style={[Styles.jSpaceBet, Styles.row, Styles.mTop3]}>
                                                                                        <TouchableOpacity
                                                                                            onPress={() => this.setState({selectedButton: 'EXIT'}, () => {
                                                                                                this.storeFinalValues()
                                                                                            })}
                                                                                            activeOpacity={0.7}
                                                                                            style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth / 4.4}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                                            <Text
                                                                                                style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                                    color: '#C91A1F'
                                                                                                }, Styles.aslCenter, Styles.p5]}>Exit</Text>
                                                                                        </TouchableOpacity>

                                                                                        <TouchableOpacity
                                                                                            onPress={() => {
                                                                                                this.setState({
                                                                                                    finalDeliveredPackages: this.state.tempDeliveredPackages,
                                                                                                    finalTotalDeliveredCount: this.state.totalDeliveredCount,
                                                                                                    packageDetailsUpdated: true,
                                                                                                    selectedButton: 'DONE'
                                                                                                }, () => {
                                                                                                    this.storeFinalValues()
                                                                                                })
                                                                                            }}
                                                                                            activeOpacity={0.7}
                                                                                            style={[Styles.aslCenter, {
                                                                                                backgroundColor: '#C91A1F',
                                                                                                width: windowWidth / 4.3
                                                                                            },
                                                                                                Styles.br5, Styles.padH20, Styles.padV5, Styles.OrdersScreenCardshadow]}>
                                                                                            <Text
                                                                                                numberOfLines={1}
                                                                                                style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, Styles.cWhite, Styles.aslCenter, Styles.p5]}>Done</Text>
                                                                                        </TouchableOpacity>
                                                                                    </View>
                                                                            }

                                                                        </View>
                                                                        :
                                                                        editButton === 'SHORT_CASH'
                                                                            ?
                                                                            <ScrollView
                                                                                style={[Styles.flex1, Styles.p15]}>
                                                                                <Text
                                                                                    style={[Styles.ffRLight, Styles.f18, Styles.cBlack87]}>Short
                                                                                    Cash</Text>
                                                                                <ScrollView
                                                                                    style={[{height: subEditHeightBy60 - 100}]}>

                                                                                    <Text
                                                                                        style={[Styles.ffRRegular, Styles.f18, Styles.cGrey33, Styles.mTop10]}>Amount</Text>
                                                                                    <View
                                                                                        style={[Styles.row, Styles.mTop5, Styles.bw1, Styles.bcAsh, {width: subEditDetialsWidth - 20,}]}>
                                                                                        <Text
                                                                                            style={[Styles.f22, Styles.cOrangered, Styles.fWbold, Styles.ffRRegular, Styles.aslCenter, Styles.padH2]}>&#x20B9;</Text>

                                                                                        <TextInput
                                                                                            style={[Styles.aitStart, Styles.cGrey33, Styles.ffRMedium, {
                                                                                                width: subEditDetialsWidth - 40,
                                                                                                fontSize: 16,
                                                                                                padding: 10
                                                                                            }]}
                                                                                            placeholder={'Type here'}
                                                                                            selectionColor={"black"}
                                                                                            editable={this.state.showUnVerifiedTripData}
                                                                                            keyboardType='numeric'
                                                                                            returnKeyType="done"
                                                                                            onSubmitEditing={() => {
                                                                                                Keyboard.dismiss()
                                                                                            }}
                                                                                            onChangeText={(shortCash) => this.setState({shortCash})}
                                                                                            value={this.state.shortCash}
                                                                                        />
                                                                                    </View>

                                                                                </ScrollView>
                                                                                {
                                                                                    !this.state.showUnVerifiedTripData
                                                                                        ?
                                                                                        <View
                                                                                            style={[Styles.jSpaceBet, Styles.row, Styles.mBtm10]}>
                                                                                            <TouchableOpacity
                                                                                                onPress={() => this.setState({editTripDetailsModal: false})}
                                                                                                activeOpacity={0.7}
                                                                                                style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth / 4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                                                <Text
                                                                                                    style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                                        color: '#C91A1F'
                                                                                                    }, Styles.aslCenter, Styles.p5]}>Exit</Text>
                                                                                            </TouchableOpacity>
                                                                                        </View>
                                                                                        :
                                                                                        <View
                                                                                            style={[Styles.jSpaceBet, Styles.row, Styles.marV10]}>
                                                                                            <TouchableOpacity
                                                                                                onPress={() => this.setState({selectedButton: 'EXIT'}, () => {
                                                                                                    this.storeFinalValues()
                                                                                                })}
                                                                                                activeOpacity={0.7}
                                                                                                style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth / 4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
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
                                                                                                        this.setState({
                                                                                                            finalShortCash: this.state.shortCash,
                                                                                                            shortCashDetailsUpdated: true,
                                                                                                            selectedButton: 'DONE'
                                                                                                        }, () => {
                                                                                                            this.storeFinalValues()
                                                                                                        })
                                                                                                    } else {
                                                                                                        Utils.dialogBox(resp.message, '');
                                                                                                    }
                                                                                                }}
                                                                                                activeOpacity={0.7}
                                                                                                style={[Styles.aslCenter, {
                                                                                                    backgroundColor: '#C91A1F',
                                                                                                    width: windowWidth / 4.3
                                                                                                }, Styles.br5, Styles.padV5, Styles.OrdersScreenCardshadow]}>
                                                                                                <Text
                                                                                                    style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, Styles.cWhite, Styles.aslCenter, Styles.p5]}>Done</Text>
                                                                                            </TouchableOpacity>
                                                                                        </View>
                                                                                }
                                                                            </ScrollView>
                                                                            :
                                                                            editButton === 'PENALTY'
                                                                                ?
                                                                                <ScrollView
                                                                                    style={[Styles.flex1, Styles.marV15]}>
                                                                                    <Text
                                                                                        style={[Styles.ffRLight, Styles.f20, Styles.cBlack87,Styles.marH5]}>Penalty</Text>
                                                                                    <ScrollView
                                                                                        style={[{height: subEditHeightBy60 - 100}]}>

                                                                                        <Text
                                                                                            style={[Styles.ffRRegular, Styles.f18, Styles.cGrey33, Styles.mTop10,Styles.marH5]}>Amount</Text>
                                                                                        <View
                                                                                            style={[Styles.row, Styles.mTop5, Styles.bw1, Styles.bcAsh, {width: subEditDetialsWidth - 20,},Styles.marH5]}>
                                                                                            <Text
                                                                                                style={[Styles.f22, Styles.cOrangered, Styles.fWbold, Styles.ffRRegular, Styles.aslCenter, Styles.padH2]}>&#x20B9;</Text>

                                                                                            {
                                                                                                selectedCardTripDetails.supervisorPenalty === 0
                                                                                                ?
                                                                                                    <TextInput
                                                                                                        style={[Styles.aitStart, Styles.cGrey33, Styles.ffRMedium, {
                                                                                                            width: subEditDetialsWidth - 40,
                                                                                                            fontSize: 16,
                                                                                                            padding: 10
                                                                                                        }]}
                                                                                                        placeholder={'Type here'}
                                                                                                        selectionColor={"black"}
                                                                                                        editable={this.state.showUnVerifiedTripData}
                                                                                                        maxLength={4}
                                                                                                        keyboardType='numeric'
                                                                                                        returnKeyType="done"
                                                                                                        onSubmitEditing={() => {
                                                                                                            Keyboard.dismiss()
                                                                                                        }}
                                                                                                        onChangeText={(penalty) => this.setState({penalty})}
                                                                                                        value={this.state.penalty}
                                                                                                    />
                                                                                                    :

                                                                                                <View
                                                                                                style={[Styles.aslCenter, Styles.p10, Styles.mTop5, {
                                                                                                width: subEditDetialsWidth,
                                                                                            }]}>
                                                                                                <Text
                                                                                                style={[Styles.ffRMedium, Styles.f18, Styles.cGrey33]}>{selectedCardTripDetails.supervisorPenalty}</Text>
                                                                                                </View>
                                                                                            }

                                                                                        </View>

                                                                                        <Text
                                                                                            style={[Styles.ffRRegular, Styles.f14, Styles.cGrey33, Styles.mTop10,Styles.marH5]}>Reason
                                                                                            for penalty</Text>
                                                                                        <View style={[Styles.mTop5,Styles.mRt30]}>
                                                                                            {
                                                                                                selectedCardTripDetails.supervisorPenalty === 0
                                                                                                ?
                                                                                                this.state.reasonsForPenalty
                                                                                                    ?
                                                                                                    this.state.showUnVerifiedTripData
                                                                                                    ?
                                                                                                    <FlatList
                                                                                                        data={this.state.reasonsForPenalty}
                                                                                                        renderItem={({item,index}) => {
                                                                                                            if (selectedCardTripDetails.unRegisteredUserAdhocShift ? item.value : item.value !== 6) {
                                                                                                                return (
                                                                                                                    <View
                                                                                                                        key={index}
                                                                                                                        style={[Styles.row, Styles.aslStart]}>
                                                                                                                        <Checkbox
                                                                                                                            color={'red'}
                                                                                                                            size={25}
                                                                                                                            disabled={!this.state.showUnVerifiedTripData}
                                                                                                                            onPress={() =>{
                                                                                                                                let reasonsForPenalty = [...this.state.reasonsForPenalty]
                                                                                                                                reasonsForPenalty[index] = {
                                                                                                                                    ...reasonsForPenalty[index],
                                                                                                                                    status: !item.status
                                                                                                                                }
                                                                                                                                this.setState({reasonsForPenalty})
                                                                                                                            }}
                                                                                                                            status={item.status ? 'checked' : 'unchecked'}
                                                                                                                        />
                                                                                                                        <Text
                                                                                                                            style={[Styles.ffRMedium, Styles.cGrey33, Styles.aslCenter, Styles.f14, Styles.flexWrap]}>{item.reason}</Text>
                                                                                                                    </View>
                                                                                                                )
                                                                                                            }
                                                                                                        }}
                                                                                                        keyExtractor={(item, index) => index.toString()}
                                                                                                    />
                                                                                                        :
                                                                                                        <View style={[Styles.mTop5]}>
                                                                                                            <RadioButton.Group
                                                                                                                value={true}>
                                                                                                                {
                                                                                                                    this.state.selectedCardTripDetails.penaltyReasons.length === 0
                                                                                                                        ?
                                                                                                                        <Text
                                                                                                                            style={[Styles.ffRMedium, Styles.cGrey33, Styles.aslCenter, Styles.f14,Styles.flexWrap]}>No Penalty</Text>
                                                                                                                        :
                                                                                                                        <FlatList
                                                                                                                            data={this.state.selectedCardTripDetails.penaltyReasons}
                                                                                                                            renderItem={({item, index}) =>
                                                                                                                                <View key={index} style={[Styles.row, Styles.aslStart]}>
                                                                                                                                    <RadioButton disabled={true} value={true} color={'red'} />
                                                                                                                                    <Text
                                                                                                                                        style={[Styles.ffRMedium, Styles.cGrey33, Styles.aslCenter, Styles.f14,Styles.flexWrap]}>{item}</Text>
                                                                                                                                </View>
                                                                                                                            }
                                                                                                                            keyExtractor={(item, index) => index.toString()}
                                                                                                                        />
                                                                                                                }
                                                                                                            </RadioButton.Group>
                                                                                                        </View>
                                                                                                    :
                                                                                                    null
                                                                                                    :
                                                                                                    <View
                                                                                                        style={[Styles.aslCenter, Styles.bgLBlueWhite, Styles.p10, Styles.mTop5, {
                                                                                                            width: subEditDetialsWidth,
                                                                                                        }]}>
                                                                                                        <Text
                                                                                                            numberOfLines={3}
                                                                                                            style={[Styles.ffRMedium, Styles.f18, Styles.cGrey4F]}>{selectedCardTripDetails.supervisorPenaltyReason}</Text>
                                                                                                    </View>
                                                                                            }
                                                                                        </View>

                                                                                    </ScrollView>
                                                                                    {
                                                                                        !this.state.showUnVerifiedTripData
                                                                                            ?
                                                                                            <View
                                                                                                style={[Styles.jSpaceBet, Styles.row, Styles.mBtm10]}>
                                                                                                <TouchableOpacity
                                                                                                    onPress={() => this.setState({editTripDetailsModal: false})}
                                                                                                    activeOpacity={0.7}
                                                                                                    style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth / 4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                                                    <Text
                                                                                                        style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                                            color: '#C91A1F'
                                                                                                        }, Styles.aslCenter, Styles.p5]}>Exit</Text>
                                                                                                </TouchableOpacity>
                                                                                            </View>
                                                                                            :
                                                                                            <View
                                                                                                style={[Styles.jSpaceBet, Styles.row, Styles.padH10]}>
                                                                                                <TouchableOpacity
                                                                                                    onPress={() => this.setState({selectedButton: 'EXIT'}, () => {
                                                                                                        this.storeFinalValues()
                                                                                                    })}
                                                                                                    activeOpacity={0.7}
                                                                                                    style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth / 4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite,
                                                                                                        Styles.OrdersScreenCardshadow]}>
                                                                                                    <Text
                                                                                                        style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                                            color: '#C91A1F'
                                                                                                        }, Styles.aslCenter, Styles.p5]}>Exit</Text>
                                                                                                </TouchableOpacity>

                                                                                                {
                                                                                                    selectedCardTripDetails.supervisorPenalty === 0
                                                                                                        ?
                                                                                                        <TouchableOpacity
                                                                                                            onPress={() => {
                                                                                                                let resp = {}
                                                                                                                resp = Utils.isValidNumberEntered(this.state.penalty, 'Penalty Amount');
                                                                                                                if (resp.status === true) {

                                                                                                                    let tempList = this.state.reasonsForPenalty;
                                                                                                                    let selectedArray = []
                                                                                                                    for (let i = 0; i < tempList.length; i++) {
                                                                                                                        if (tempList[i].status === true) {
                                                                                                                            selectedArray.push(tempList[i].reason)
                                                                                                                        }
                                                                                                                    }

                                                                                                                    if (this.state.penalty === '0') {
                                                                                                                        if (selectedArray.length === 0) {
                                                                                                                            this.setState({
                                                                                                                                finalPenaltyAmount: this.state.penalty,
                                                                                                                                finalPenaltyReason: this.state.tempPenaltyReason,
                                                                                                                                penaltyDetailsUpdated: true,
                                                                                                                                selectedButton: 'DONE'
                                                                                                                            }, () => {
                                                                                                                                this.storeFinalValues()
                                                                                                                            })
                                                                                                                        } else {
                                                                                                                            Utils.dialogBox('Please enter Penalty Amount', '');
                                                                                                                        }

                                                                                                                    } else {
                                                                                                                        if (selectedArray.length === 0) {
                                                                                                                            Utils.dialogBox('Please select a Reason', '');
                                                                                                                        } else {
                                                                                                                            this.setState({
                                                                                                                                finalPenaltyAmount: this.state.penalty,
                                                                                                                                finalPenaltyReason: selectedArray,
                                                                                                                                finalSelectedPenaltyReasons: selectedArray,
                                                                                                                                penaltyDetailsUpdated: true,
                                                                                                                                selectedButton: 'DONE'
                                                                                                                            }, () => {
                                                                                                                                this.storeFinalValues()
                                                                                                                            })
                                                                                                                        }
                                                                                                                    }

                                                                                                                } else {
                                                                                                                    Utils.dialogBox(resp.message, '');
                                                                                                                }
                                                                                                            }}
                                                                                                            activeOpacity={0.7}
                                                                                                            style={[Styles.aslCenter, {
                                                                                                                backgroundColor: '#C91A1F',
                                                                                                                width: windowWidth / 4.3
                                                                                                            }, Styles.br5, Styles.padV5, Styles.OrdersScreenCardshadow]}>
                                                                                                            <Text
                                                                                                                style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, Styles.cWhite, Styles.aslCenter, Styles.p5]}>Done</Text>
                                                                                                        </TouchableOpacity>
                                                                                                        :
                                                                                                        null
                                                                                                }
                                                                                            </View>
                                                                                    }
                                                                                </ScrollView>
                                                                                :
                                                                                editButton === 'EMPLOYEE_ID'
                                                                                    ?
                                                                                    <ScrollView
                                                                                        style={[Styles.flex1, Styles.p15,]}>
                                                                                        <Text
                                                                                            style={[Styles.ffRLight, Styles.f18, Styles.cBlack87]}>Employee
                                                                                            ID</Text>
                                                                                        <ScrollView
                                                                                            style={[{height: subEditHeightBy60 - 100}]}>
                                                                                            <Text
                                                                                                style={[Styles.ffRRegular, Styles.f14, Styles.pTop15, Styles.cGrey33]}>Entered
                                                                                                by Fleet</Text>
                                                                                            <View
                                                                                                style={[Styles.aslCenter, Styles.bgLBlueWhite, Styles.mTop10, Styles.p10, {
                                                                                                    width: subEditDetialsWidth
                                                                                                }]}>
                                                                                                <Text
                                                                                                    numberOfLines={4}
                                                                                                    style={[Styles.ffRMedium, Styles.f16, Styles.cGrey4F]}>{selectedCardTripDetails.dataBeforeUpdate ? selectedCardTripDetails.dataBeforeUpdate.clientEmployeeId : ''}</Text>
                                                                                            </View>

                                                                                            <Text
                                                                                                style={[Styles.ffRRegular, Styles.f14, Styles.pTop15, Styles.cGrey33]}>Update
                                                                                                Employee ID</Text>

                                                                                            <TextInput
                                                                                                style={[Styles.aslCenter, Styles.bw1, Styles.bcLightBlue, Styles.mTop10, Styles.cGrey33, Styles.ffRMedium, {
                                                                                                    width: subEditDetialsWidth,
                                                                                                    fontSize: 16,
                                                                                                    padding: 10
                                                                                                }]}
                                                                                                selectionColor={"black"}
                                                                                                editable={this.state.showUnVerifiedTripData}
                                                                                                multiline={true}
                                                                                                returnKeyType="done"
                                                                                                onSubmitEditing={() => {
                                                                                                    Keyboard.dismiss()
                                                                                                }}
                                                                                                onChangeText={(tempEmployeeId) => this.setState({tempEmployeeId})}
                                                                                                value={this.state.tempEmployeeId}
                                                                                            />
                                                                                        </ScrollView>
                                                                                        {
                                                                                            !this.state.showUnVerifiedTripData
                                                                                                ?
                                                                                                <View
                                                                                                    style={[Styles.jSpaceBet, Styles.row, Styles.mBtm10]}>
                                                                                                    <TouchableOpacity
                                                                                                        onPress={() => this.setState({editTripDetailsModal: false})}
                                                                                                        activeOpacity={0.7}
                                                                                                        style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth / 4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                                                        <Text
                                                                                                            style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                                                color: '#C91A1F'
                                                                                                            }, Styles.aslCenter, Styles.p5]}>Exit</Text>
                                                                                                    </TouchableOpacity>
                                                                                                </View>
                                                                                                :
                                                                                                <View
                                                                                                    style={[Styles.jSpaceBet, Styles.row, Styles.mBtm10]}>
                                                                                                    <TouchableOpacity
                                                                                                        onPress={() => this.setState({selectedButton: 'EXIT'}, () => {
                                                                                                            this.storeFinalValues()
                                                                                                        })}
                                                                                                        activeOpacity={0.7}
                                                                                                        style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth / 4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                                                        <Text
                                                                                                            style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                                                color: '#C91A1F'
                                                                                                            }, Styles.aslCenter, Styles.p5]}>Exit</Text>
                                                                                                    </TouchableOpacity>

                                                                                                    <TouchableOpacity
                                                                                                        onPress={() => {
                                                                                                            let resp = {}
                                                                                                            resp = Utils.checkIsValidTripSheetId(this.state.tempEmployeeId, 'Employee Id');
                                                                                                            if (resp.status === true) {
                                                                                                                this.setState({
                                                                                                                    finalEmployeeID: this.state.tempEmployeeId,
                                                                                                                    clientEmployeeIdDetailsUpdated: true,
                                                                                                                    selectedButton: 'DONE'
                                                                                                                }, () => {
                                                                                                                    this.storeFinalValues()
                                                                                                                })
                                                                                                            } else {
                                                                                                                Utils.dialogBox(resp.message, '');
                                                                                                            }
                                                                                                        }}
                                                                                                        activeOpacity={0.7}
                                                                                                        style={[Styles.aslCenter, {
                                                                                                            backgroundColor: '#C91A1F',
                                                                                                            width: windowWidth / 4.3
                                                                                                        }, Styles.br5, Styles.padV5, Styles.OrdersScreenCardshadow]}>
                                                                                                        <Text
                                                                                                            style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, Styles.cWhite, Styles.aslCenter, Styles.p5]}>Done</Text>
                                                                                                    </TouchableOpacity>
                                                                                                </View>
                                                                                        }
                                                                                    </ScrollView>
                                                                                    :
                                                                                    editButton === 'LITE_USER_PAYMENT_DETAILS'
                                                                                        ?
                                                                                        <ScrollView
                                                                                            style={[Styles.flex1, Styles.p15,]}>
                                                                                            <Text
                                                                                                style={[Styles.ffRLight, Styles.f18, Styles.cBlack87]}>Payment
                                                                                                Details</Text>
                                                                                            <ScrollView
                                                                                                persistentScrollbar={true}
                                                                                                style={[{height: subEditHeightBy60 - 100}]}>

                                                                                                {
                                                                                                    selectedCardTripDetails.dataBeforeUpdate.planName
                                                                                                        ?
                                                                                                        <View>
                                                                                                            <Text
                                                                                                                style={[Styles.ffRRegular, Styles.f14, Styles.pTop15, Styles.cGrey33]}>Payment
                                                                                                                Plan </Text>
                                                                                                            <View
                                                                                                                style={[Styles.aslCenter, Styles.bgLBlueWhite, Styles.mTop10, Styles.p10, {
                                                                                                                    width: subEditDetialsWidth
                                                                                                                }]}>
                                                                                                                <Text
                                                                                                                    numberOfLines={4}
                                                                                                                    style={[Styles.ffRMedium, Styles.f16, Styles.cGrey4F]}>{selectedCardTripDetails.dataBeforeUpdate ? selectedCardTripDetails.dataBeforeUpdate.planName : ''}</Text>
                                                                                                            </View>
                                                                                                        </View>
                                                                                                        :
                                                                                                        null
                                                                                                }
                                                                                                <Text
                                                                                                    style={[Styles.ffRRegular, Styles.f14, Styles.pTop15, Styles.cGrey33]}>Payment
                                                                                                    Mode</Text>
                                                                                                <RadioButton.Group
                                                                                                    onValueChange={liteUserPaymentType => this.setState({liteUserPaymentType})}
                                                                                                    value={this.state.liteUserPaymentType}>
                                                                                                    <View
                                                                                                        style={[Styles.row, Styles.aslStart,]}>
                                                                                                        <View
                                                                                                            style={[Styles.row, Styles.alignCenter]}>
                                                                                                            <RadioButton
                                                                                                                // disabled={!this.state.showUnVerifiedTripData || selectedCardTripDetails.dataBeforeUpdate.planName}
                                                                                                                disabled={true}
                                                                                                                value={'Now'}/>
                                                                                                            <Text
                                                                                                                style={[Styles.ffRMedium, Styles.cGrey33, Styles.aslCenter, Styles.f16]}>Now
                                                                                                                (Cash)</Text>
                                                                                                        </View>
                                                                                                        <View
                                                                                                            style={[Styles.row, Styles.alignCenter]}>
                                                                                                            <RadioButton
                                                                                                                // disabled={!this.state.showUnVerifiedTripData || selectedCardTripDetails.dataBeforeUpdate.planName}
                                                                                                                disabled={true}
                                                                                                                value={'Later'}/>
                                                                                                            <Text
                                                                                                                style={[Styles.ffRMedium, Styles.cGrey33, Styles.aslCenter, Styles.f16]}>Later</Text>
                                                                                                        </View>
                                                                                                    </View>
                                                                                                </RadioButton.Group>

                                                                                                {
                                                                                                    selectedCardTripDetails.dataBeforeUpdate.planName
                                                                                                        ?
                                                                                                        null
                                                                                                        :
                                                                                                      <View>
                                                                                                          <Text
                                                                                                              style={[Styles.ffRRegular, Styles.f14, Styles.pTop15, Styles.cGrey33]}>Amount</Text>
                                                                                                          <TextInput
                                                                                                              style={[Styles.aslCenter, Styles.bw1, Styles.bcLightBlue, Styles.mTop10, Styles.cGrey33, Styles.ffRMedium, {
                                                                                                                  width: subEditDetialsWidth,
                                                                                                                  fontSize: 16,
                                                                                                                  padding: 10
                                                                                                              }]}
                                                                                                              selectionColor={"black"}
                                                                                                              editable={this.state.showUnVerifiedTripData}
                                                                                                              keyboardType='numeric'
                                                                                                              returnKeyType="done"
                                                                                                              onSubmitEditing={() => {
                                                                                                                  Keyboard.dismiss()
                                                                                                              }}
                                                                                                              onChangeText={(liteUserAmount) => this.setState({liteUserAmount})}
                                                                                                              value={this.state.liteUserAmount}
                                                                                                          />
                                                                                                      </View>
                                                                                                }

                                                                                                {/*BANK DETAILS*/}
                                                                                                {
                                                                                                    this.state.liteUserPaymentType === 'Later'
                                                                                                        ?
                                                                                                        <View
                                                                                                            style={[Styles.bgLBlueWhite, Styles.marV15]}>
                                                                                                            <Text
                                                                                                                style={[Styles.ffRRegular, Styles.f14, Styles.cGrey33]}>Beneficiary
                                                                                                                Name</Text>
                                                                                                            <TextInput
                                                                                                                style={[Styles.aslCenter, Styles.bw1, Styles.bcLightBlue, Styles.mTop10, Styles.cGrey33, Styles.ffRMedium, {
                                                                                                                    width: subEditDetialsWidth,
                                                                                                                    fontSize: 16,
                                                                                                                    padding: 10
                                                                                                                }]}
                                                                                                                selectionColor={"black"}
                                                                                                                editable={this.state.showUnVerifiedTripData}
                                                                                                                multiline={true}
                                                                                                                returnKeyType="done"
                                                                                                                onSubmitEditing={() => {
                                                                                                                    Keyboard.dismiss()
                                                                                                                }}
                                                                                                                onChangeText={(liteUserBenName) => this.setState({liteUserBenName})}
                                                                                                                value={this.state.liteUserBenName}
                                                                                                            />

                                                                                                            <Text
                                                                                                                style={[Styles.ffRRegular, Styles.f14, Styles.mTop15, Styles.cGrey33]}>Account
                                                                                                                Number</Text>
                                                                                                            <TextInput
                                                                                                                style={[Styles.aslCenter, Styles.bw1, Styles.bcLightBlue, Styles.mTop10, Styles.cGrey33, Styles.ffRMedium, {
                                                                                                                    width: subEditDetialsWidth,
                                                                                                                    fontSize: 16,
                                                                                                                    padding: 10
                                                                                                                }]}
                                                                                                                selectionColor={"black"}
                                                                                                                editable={this.state.showUnVerifiedTripData}
                                                                                                                multiline={true}
                                                                                                                keyboardType='numeric'
                                                                                                                returnKeyType="done"
                                                                                                                onSubmitEditing={() => {
                                                                                                                    Keyboard.dismiss()
                                                                                                                }}
                                                                                                                onChangeText={(liteUserBenAccountNo) => this.setState({liteUserBenAccountNo})}
                                                                                                                value={this.state.liteUserBenAccountNo}
                                                                                                            />

                                                                                                            <Text
                                                                                                                style={[Styles.ffRRegular, Styles.f14, Styles.mTop15, Styles.cGrey33]}>IFSC
                                                                                                                Code</Text>
                                                                                                            <TextInput
                                                                                                                style={[Styles.aslCenter, Styles.bw1, Styles.bcLightBlue, Styles.mTop10, Styles.cGrey33, Styles.ffRMedium, {
                                                                                                                    width: subEditDetialsWidth,
                                                                                                                    fontSize: 16,
                                                                                                                    padding: 10
                                                                                                                }]}
                                                                                                                selectionColor={"black"}
                                                                                                                editable={this.state.showUnVerifiedTripData}
                                                                                                                multiline={true}
                                                                                                                returnKeyType="done"
                                                                                                                onSubmitEditing={() => {
                                                                                                                    Keyboard.dismiss()
                                                                                                                }}
                                                                                                                value={this.state.liteUserBenIFSC}
                                                                                                                // onChangeText={(liteUserBenIFSC) => this.setState({liteUserBenIFSC})}
                                                                                                            // />
                                                                                                                    onChangeText={(liteUserBenIFSC) => this.setState({liteUserBenIFSC}, () => {
                                                                                                                    let resp;
                                                                                                                    resp = Utils.isValidIFSCCode(this.state.liteUserBenIFSC);
                                                                                                                    if (resp.status === true) {
                                                                                                                        this.setState({errorBeneficiaryIFSCcode: null}, () => {
                                                                                                                            this.checkBeneficaryIFSCCode(this.state.liteUserBenIFSC)
                                                                                                                        });
                                                                                                                    } else {
                                                                                                                        this.setState({errorBeneficiaryIFSCcode: resp.message});
                                                                                                                    }
                                                                                                                })}/>
                                                                                                            {
                                                                                                                this.state.errorBeneficiaryIFSCcode ?
                                                                                                                    <Text style={{
                                                                                                                        color: 'red',
                                                                                                                        fontFamily: 'Muli-Regular',
                                                                                                                        // paddingLeft: 30,
                                                                                                                        marginBottom: 2
                                                                                                                    }}>{this.state.errorBeneficiaryIFSCcode}</Text>
                                                                                                                    :
                                                                                                                    this.state.liteUserBenIFSC && this.state.BeneficaryIFSCverified === false ?
                                                                                                                        Services.returnIFSCStatusViewTripVerification('NotVerified')
                                                                                                                        :
                                                                                                                        this.state.liteUserBenIFSC && this.state.BeneficaryIFSCverified === true
                                                                                                                            ?
                                                                                                                            Services.returnIFSCStatusViewTripVerification('Verified')
                                                                                                                            : null
                                                                                                            }

                                                                                                            <Text
                                                                                                                style={[Styles.ffRRegular, Styles.f14, Styles.mTop15, Styles.cGrey33]}>PAN
                                                                                                                Number</Text>
                                                                                                            <TextInput
                                                                                                                style={[Styles.aslCenter, Styles.bw1, Styles.bcLightBlue, Styles.marV10, Styles.cGrey33, Styles.ffRMedium, {
                                                                                                                    width: subEditDetialsWidth,
                                                                                                                    fontSize: 16,
                                                                                                                    padding: 10
                                                                                                                }]}
                                                                                                                selectionColor={"black"}
                                                                                                                editable={this.state.showUnVerifiedTripData}
                                                                                                                multiline={true}
                                                                                                                returnKeyType="done"
                                                                                                                onSubmitEditing={() => {
                                                                                                                    Keyboard.dismiss()
                                                                                                                }}
                                                                                                                onChangeText={(liteUserBenPAN) => this.setState({liteUserBenPAN})}
                                                                                                                value={this.state.liteUserBenPAN}
                                                                                                            />
                                                                                                        </View>
                                                                                                        :
                                                                                                        null
                                                                                                }

                                                                                            </ScrollView>
                                                                                            {
                                                                                                !this.state.showUnVerifiedTripData
                                                                                                    ?
                                                                                                    <View
                                                                                                        style={[Styles.jSpaceBet, Styles.row, Styles.mBtm10]}>
                                                                                                        <TouchableOpacity
                                                                                                            onPress={() => this.setState({editTripDetailsModal: false})}
                                                                                                            activeOpacity={0.7}
                                                                                                            style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth / 4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                                                            <Text
                                                                                                                style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                                                    color: '#C91A1F'
                                                                                                                }, Styles.aslCenter, Styles.p5]}>Exit</Text>
                                                                                                        </TouchableOpacity>
                                                                                                    </View>
                                                                                                    :
                                                                                                    <View
                                                                                                        style={[Styles.jSpaceBet, Styles.row, Styles.mBtm10]}>
                                                                                                        <TouchableOpacity
                                                                                                            onPress={() => this.setState({selectedButton: 'EXIT'}, () => {
                                                                                                                this.storeFinalValues()
                                                                                                            })}
                                                                                                            activeOpacity={0.7}
                                                                                                            style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth / 4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                                                            <Text
                                                                                                                style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                                                    color: '#C91A1F'
                                                                                                                }, Styles.aslCenter, Styles.p5]}>Exit</Text>
                                                                                                        </TouchableOpacity>

                                                                                                        <TouchableOpacity
                                                                                                            onPress={() => {
                                                                                                                this.validatePaymentDetails()
                                                                                                            }}
                                                                                                            activeOpacity={0.7}
                                                                                                            style={[Styles.aslCenter, {
                                                                                                                backgroundColor: '#C91A1F',
                                                                                                                width: windowWidth / 4.3
                                                                                                            }, Styles.br5, Styles.padV5, Styles.OrdersScreenCardshadow]}>
                                                                                                            <Text
                                                                                                                style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, Styles.cWhite, Styles.aslCenter, Styles.p5]}>Done</Text>
                                                                                                        </TouchableOpacity>
                                                                                                    </View>
                                                                                            }
                                                                                        </ScrollView>
                                                                                        :
                                                                                        editButton === 'PARTNER_DETAILS'
                                                                                            ?
                                                                                            <ScrollView
                                                                                                style={[Styles.flex1, Styles.p15,]}>
                                                                                                <Text
                                                                                                    style={[Styles.ffRLight, Styles.f18, Styles.cBlack87]}>Partner
                                                                                                    Name</Text>
                                                                                                <ScrollView
                                                                                                    style={[{height: subEditHeightBy60 - 100}]}>
                                                                                                    <Text
                                                                                                        style={[Styles.ffRRegular, Styles.f14, Styles.pTop15, Styles.cGrey33]}>Entered
                                                                                                        by Fleet</Text>
                                                                                                    <View
                                                                                                        style={[Styles.aslCenter, Styles.bgLBlueWhite, Styles.mTop10, Styles.p10, {
                                                                                                            width: subEditDetialsWidth
                                                                                                        }]}>
                                                                                                        <Text
                                                                                                            numberOfLines={4}
                                                                                                            style={[Styles.ffRMedium, Styles.f16, Styles.cGrey4F]}>{selectedCardTripDetails.dataBeforeUpdate ? selectedCardTripDetails.dataBeforeUpdate.partnerDetails : ''}</Text>
                                                                                                    </View>

                                                                                                    <Text
                                                                                                        style={[Styles.ffRRegular, Styles.f14, Styles.pTop15, Styles.cGrey33]}>Update
                                                                                                        Partner
                                                                                                        Name</Text>

                                                                                                    <TextInput
                                                                                                        style={[Styles.aslCenter, Styles.bw1, Styles.bcLightBlue, Styles.mTop10, Styles.cGrey33, Styles.ffRMedium, {
                                                                                                            width: subEditDetialsWidth,
                                                                                                            fontSize: 16,
                                                                                                            padding: 10
                                                                                                        }]}
                                                                                                        selectionColor={"black"}
                                                                                                        editable={this.state.showUnVerifiedTripData}
                                                                                                        multiline={true}
                                                                                                        returnKeyType="done"
                                                                                                        onSubmitEditing={() => {
                                                                                                            Keyboard.dismiss()
                                                                                                        }}
                                                                                                        onChangeText={(tempPartnerDetails) => this.setState({tempPartnerDetails})}
                                                                                                        value={this.state.tempPartnerDetails}
                                                                                                    />
                                                                                                </ScrollView>
                                                                                                {
                                                                                                    !this.state.showUnVerifiedTripData
                                                                                                        ?
                                                                                                        <View
                                                                                                            style={[Styles.jSpaceBet, Styles.row, Styles.mBtm10]}>
                                                                                                            <TouchableOpacity
                                                                                                                onPress={() => this.setState({editTripDetailsModal: false})}
                                                                                                                activeOpacity={0.7}
                                                                                                                style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth / 4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                                                                <Text
                                                                                                                    style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                                                        color: '#C91A1F'
                                                                                                                    }, Styles.aslCenter, Styles.p5]}>Exit</Text>
                                                                                                            </TouchableOpacity>
                                                                                                        </View>
                                                                                                        :
                                                                                                        <View
                                                                                                            style={[Styles.jSpaceBet, Styles.row, Styles.mBtm10]}>
                                                                                                            <TouchableOpacity
                                                                                                                onPress={() => this.setState({selectedButton: 'EXIT'}, () => {
                                                                                                                    this.storeFinalValues()
                                                                                                                })}
                                                                                                                activeOpacity={0.7}
                                                                                                                style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth / 4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                                                                <Text
                                                                                                                    style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                                                        color: '#C91A1F'
                                                                                                                    }, Styles.aslCenter, Styles.p5]}>Exit</Text>
                                                                                                            </TouchableOpacity>

                                                                                                            <TouchableOpacity
                                                                                                                onPress={() => {
                                                                                                                    let resp = {}
                                                                                                                    resp = Utils.checkIsValidTripSheetId(this.state.tempPartnerDetails, 'Partner Name');
                                                                                                                    if (resp.status === true) {
                                                                                                                        this.setState({
                                                                                                                            finalPartnerDetails: this.state.tempPartnerDetails,
                                                                                                                            partnerDetailsUpdated: true,
                                                                                                                            selectedButton: 'DONE'
                                                                                                                        }, () => {
                                                                                                                            this.storeFinalValues()
                                                                                                                        })
                                                                                                                    } else {
                                                                                                                        Utils.dialogBox(resp.message, '');
                                                                                                                    }
                                                                                                                }}
                                                                                                                activeOpacity={0.7}
                                                                                                                style={[Styles.aslCenter, {
                                                                                                                    backgroundColor: '#C91A1F',
                                                                                                                    width: windowWidth / 4.3
                                                                                                                }, Styles.br5, Styles.padV5, Styles.OrdersScreenCardshadow]}>
                                                                                                                <Text
                                                                                                                    style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, Styles.cWhite, Styles.aslCenter, Styles.p5]}>Done</Text>
                                                                                                            </TouchableOpacity>
                                                                                                        </View>
                                                                                                }
                                                                                            </ScrollView>
                                                                                            :
                                                                                            editButton === 'CLIENT_LOGIN_ID'
                                                                                                ?
                                                                                                <ScrollView
                                                                                                    style={[Styles.flex1, Styles.padV15, Styles.padH5,]}>
                                                                                                    <Text
                                                                                                        style={[Styles.ffRLight, Styles.f18, Styles.cBlack87]}>Client Login ID</Text>
                                                                                                    <ScrollView
                                                                                                        style={[{height: subEditHeightBy60 - 100}]}>
                                                                                                        <Text
                                                                                                            style={[Styles.ffRRegular, Styles.f14, Styles.cGrey33, Styles.pTop15]}>Entered by Fleet</Text>
                                                                                                        <View
                                                                                                            style={[Styles.aslCenter, Styles.bgLBlueWhite, Styles.mTop10, {
                                                                                                                width: windowWidth / 1.8
                                                                                                            }]}>
                                                                                                          <View>
                                                                                                                <Card
                                                                                                                    style={[
                                                                                                                        Styles.OrdersScreenCardshadow, Styles.bgLBlueWhite, Styles.br0, Styles.p5]}>
                                                                                                                    <Card.Title
                                                                                                                        left={() =>
                                                                                                                            <View>
                                                                                                                                {Services.getUserProfilePic(selectedCardTripDetails.attrs.clientLoginIdPhoto)}
                                                                                                                            </View>}
                                                                                                                        title={
                                                                                                                            <Text
                                                                                                                                style={[Styles.f14, Styles.ffLBold]}>{_.startCase(_.toLower(selectedCardTripDetails.attrs.clientLoginIdName))}</Text>}
                                                                                                                        titleStyle={[Styles.ffLBold, Styles.f14, Styles.colorBlue]}
                                                                                                                        subtitleStyle={[Styles.ffLRegular]}
                                                                                                                        subtitle={
                                                                                                                            <Text
                                                                                                                                style={[Styles.f12, Styles.ffLBold, Styles.colorBlue]}>{selectedCardTripDetails.attrs.clientLoginIdStatus} ({selectedCardTripDetails.dataBeforeUpdate ? selectedCardTripDetails.dataBeforeUpdate.clientLoginIdMobileNumber : '--'})</Text>
                                                                                                                        }
                                                                                                                    >
                                                                                                                    </Card.Title>
                                                                                                                </Card>
                                                                                                            </View>
                                                                                                        </View>

                                                                                                        <Text
                                                                                                            style={[Styles.ffRRegular, Styles.f14, Styles.pTop15, Styles.cGrey33]}>Update
                                                                                                            Client Login ID if required</Text>

                                                                                                        <View
                                                                                                            style={[{width: windowWidth / 1.8}]}>

                                                                                                            <TextInput
                                                                                                                style={[Styles.bgWhite, Styles.mTop10, Styles.bw1]}
                                                                                                                isFocused="false"
                                                                                                                placeholder="Search by phone number"
                                                                                                                editable={this.state.showUnVerifiedTripData}
                                                                                                                maxLength={10}
                                                                                                                keyboardType={'numeric'}
                                                                                                                returnKeyType="done"
                                                                                                                onSubmitEditing={() => {
                                                                                                                    Keyboard.dismiss()
                                                                                                                }}
                                                                                                                onChangeText={tempSearchPhoneNumber => {
                                                                                                                    this.setState({tempSearchPhoneNumber}, () => {
                                                                                                                        if (tempSearchPhoneNumber.length === 10) {
                                                                                                                            this.getEnteredPhoneNumberProfiles(this.state.tempSearchPhoneNumber)
                                                                                                                        } else {
                                                                                                                            this.setState({phoneNumberSearchData: []})
                                                                                                                        }
                                                                                                                    })
                                                                                                                }}
                                                                                                                value={this.state.tempSearchPhoneNumber}
                                                                                                            />

                                                                                                            {
                                                                                                                this.state.phoneNumberSearchData
                                                                                                                    ?
                                                                                                                    this.state.phoneNumberSearchData.existedUser
                                                                                                                        ?
                                                                                                                        <View
                                                                                                                            style={[Styles.mTop10]}>
                                                                                                                            {Services.returnUserProfileCardTripVerification(this.state.phoneNumberSearchData, this.state.tempSearchPhoneNumber)}
                                                                                                                        </View>
                                                                                                                        :
                                                                                                                        this.state.phoneNumberSearchData.existedUser === false
                                                                                                                            ?
                                                                                                                            <View>
                                                                                                                                <Text
                                                                                                                                    style={[Styles.f14, Styles.ffRBold, Styles.cRed, Styles.padV5, Styles.aslStart]}>Please
                                                                                                                                    enter
                                                                                                                                    the
                                                                                                                                    registered
                                                                                                                                    phone
                                                                                                                                    number</Text>
                                                                                                                                <Text
                                                                                                                                    style={[Styles.f14, Styles.ffRBold, Styles.cRed, Styles.padV5, Styles.aslStart]}>User
                                                                                                                                    not
                                                                                                                                    in
                                                                                                                                    the
                                                                                                                                    system</Text>
                                                                                                                            </View>
                                                                                                                            :
                                                                                                                            null
                                                                                                                    :
                                                                                                                    null
                                                                                                            }
                                                                                                        </View>

                                                                                                    </ScrollView>
                                                                                                    {
                                                                                                        !this.state.showUnVerifiedTripData
                                                                                                            ?
                                                                                                            <View
                                                                                                                style={[Styles.jSpaceBet, Styles.row, Styles.mBtm10]}>
                                                                                                                <TouchableOpacity
                                                                                                                    onPress={() => this.setState({editTripDetailsModal: false})}
                                                                                                                    activeOpacity={0.7}
                                                                                                                    style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth / 4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                                                                    <Text
                                                                                                                        style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                                                            color: '#C91A1F'
                                                                                                                        }, Styles.aslCenter, Styles.p5]}>Exit</Text>
                                                                                                                </TouchableOpacity>
                                                                                                            </View>
                                                                                                            :
                                                                                                            <View
                                                                                                                style={[Styles.jSpaceBet, Styles.row, Styles.mBtm10]}>
                                                                                                                <TouchableOpacity
                                                                                                                    onPress={() => this.setState({selectedButton: 'EXIT'}, () => {
                                                                                                                        this.storeFinalValues()
                                                                                                                    })}
                                                                                                                    activeOpacity={0.7}
                                                                                                                    style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth / 4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                                                                    <Text
                                                                                                                        style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                                                            color: '#C91A1F'
                                                                                                                        }, Styles.aslCenter, Styles.p5]}>Exit</Text>
                                                                                                                </TouchableOpacity>

                                                                                                                <TouchableOpacity
                                                                                                                    onPress={() => {
                                                                                                                        let resp = {}
                                                                                                                        resp = Utils.isValidMobileNumber(this.state.tempSearchPhoneNumber);
                                                                                                                        if (resp.status === true) {
                                                                                                                            if (this.state.phoneNumberSearchData.existedUser) {
                                                                                                                                this.setState({
                                                                                                                                    finalSearchPhoneNumber: this.state.tempSearchPhoneNumber,
                                                                                                                                    clientLoginIdDetailsUpdated: true,
                                                                                                                                    selectedButton: 'DONE'
                                                                                                                                }, () => {
                                                                                                                                    this.storeFinalValues()
                                                                                                                                })
                                                                                                                            } else {
                                                                                                                                Utils.dialogBox('Please enter registered mobile number', '');
                                                                                                                            }
                                                                                                                        } else {
                                                                                                                            Utils.dialogBox(resp.message, '');
                                                                                                                        }
                                                                                                                    }}
                                                                                                                    activeOpacity={0.7}
                                                                                                                    style={[Styles.aslCenter, {
                                                                                                                        backgroundColor: '#C91A1F',
                                                                                                                        width: windowWidth / 4.3
                                                                                                                    }, Styles.br5, Styles.padV5, Styles.OrdersScreenCardshadow]}>
                                                                                                                    <Text
                                                                                                                        style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, Styles.cWhite, Styles.aslCenter, Styles.p5]}>Done</Text>
                                                                                                                </TouchableOpacity>
                                                                                                            </View>
                                                                                                    }
                                                                                                </ScrollView>
                                                                                                :
                                                                                                editButton === 'PAYMENT_PLAN'
                                                                                                    ?
                                                                                                    <ScrollView
                                                                                                        style={[Styles.flex1, Styles.p15,]}>
                                                                                                        <Text
                                                                                                            style={[Styles.ffRLight, Styles.f18, Styles.cBlack87]}>Payment Plan</Text>
                                                                                                        <ScrollView
                                                                                                            style={[{height: subEditHeightBy60 - 100}]}>
                                                                                                            {/*<Text*/}
                                                                                                            {/*    style={[Styles.ffRRegular, Styles.f14, Styles.pTop15, Styles.cGrey33]}>Entered*/}
                                                                                                            {/*    by Fleet</Text>*/}
                                                                                                            <Text
                                                                                                                style={[Styles.ffRRegular, Styles.f14, Styles.pTop15, Styles.cGrey33]}>Payment Plan from Profile</Text>
                                                                                                            <View
                                                                                                                style={[Styles.aslCenter, Styles.bgLBlueWhite, Styles.mTop10, Styles.p10, {
                                                                                                                    width: subEditDetialsWidth
                                                                                                                }]}>
                                                                                                                <Text
                                                                                                                    numberOfLines={4}
                                                                                                                    style={[Styles.ffRMedium, Styles.f16, Styles.cGrey4F]}>{selectedCardTripDetails.dataBeforeUpdate ? selectedCardTripDetails.dataBeforeUpdate.planName : ''}</Text>
                                                                                                            </View>

                                                                                                            <Text
                                                                                                                style={[Styles.ffRRegular, Styles.f14, Styles.pTop15, Styles.cGrey33]}>Update
                                                                                                                Payment Plan</Text>
                                                                                                            <View>
                                                                                                                <TouchableOpacity
                                                                                                                    style={[Styles.aslCenter, Styles.bw1, Styles.bcLightBlue, Styles.mTop10, {
                                                                                                                        width: subEditDetialsWidth,
                                                                                                                        padding: 10
                                                                                                                    }]}
                                                                                                                    disabled={!this.state.showUnVerifiedTripData}
                                                                                                                    activeOpacity={0.7}
                                                                                                                    onPress={() => {
                                                                                                                        this.getPaymentPlansList(selectedCardTripDetails.siteId)
                                                                                                                    }}>
                                                                                                                    <Text style={[  Styles.cGrey33, Styles.ffRMedium,Styles.f16,Styles.pRight20,Styles.padV3]}>{this.state.tempPlanName ? this.state.tempPlanName : 'Select Payment Plan'}</Text>
                                                                                                                    <MaterialIcons name='expand-more' color='#9e9e9e' size={35}
                                                                                                                                   style={{
                                                                                                                                       position: 'absolute',
                                                                                                                                       right: 2,
                                                                                                                                       top: 4
                                                                                                                                   }}/>
                                                                                                                </TouchableOpacity>
                                                                                                            </View>
                                                                                                            {
                                                                                                                selectedCardTripDetails.showUpdatePlanInProfile
                                                                                                                    ?
                                                                                                                    <View
                                                                                                                        style={[Styles.row, Styles.mTop10]}>
                                                                                                                        <Checkbox
                                                                                                                            style={[Styles.aslCenter]}
                                                                                                                            color={'red'}
                                                                                                                            disabled={!this.state.showUnVerifiedTripData}
                                                                                                                            size={25}
                                                                                                                            onPress={() => {
                                                                                                                                this.setState({tempUpdatePlanInProfile: !this.state.tempUpdatePlanInProfile}, () => {
                                                                                                                                    if (this.state.tempUpdatePlanInProfile) {
                                                                                                                                        Alert.alert('This will permanently map the new payment plan to user', alert,
                                                                                                                                            [{
                                                                                                                                                text: 'Cancel',
                                                                                                                                                onPress: () => {
                                                                                                                                                    this.setState({tempUpdatePlanInProfile: false})
                                                                                                                                                }
                                                                                                                                            }, {
                                                                                                                                                text: 'OK',
                                                                                                                                                onPress: () => {
                                                                                                                                                    this.setState({tempUpdatePlanInProfile: true})
                                                                                                                                                }
                                                                                                                                            }]
                                                                                                                                        )
                                                                                                                                    }
                                                                                                                                })
                                                                                                                            }}
                                                                                                                            status={this.state.tempUpdatePlanInProfile ? 'checked' : 'unchecked'}
                                                                                                                        />
                                                                                                                        <Text
                                                                                                                            numberOfLines={2}
                                                                                                                            style={[Styles.f16, Styles.ffRMedium, Styles.aslCenter, Styles.cBlack87, {width: subEditDetialsWidth - 30}]}>Update
                                                                                                                            Plan
                                                                                                                            in
                                                                                                                            Profile</Text>
                                                                                                                    </View>
                                                                                                                    :
                                                                                                                    null
                                                                                                            }
                                                                                                        </ScrollView>
                                                                                                        {
                                                                                                            !this.state.showUnVerifiedTripData
                                                                                                                ?
                                                                                                                <View
                                                                                                                    style={[Styles.jSpaceBet, Styles.row, Styles.mBtm10]}>
                                                                                                                    <TouchableOpacity
                                                                                                                        onPress={() => this.setState({editTripDetailsModal: false})}
                                                                                                                        activeOpacity={0.7}
                                                                                                                        style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth / 4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                                                                        <Text
                                                                                                                            style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                                                                color: '#C91A1F'
                                                                                                                            }, Styles.aslCenter, Styles.p5]}>Exit</Text>
                                                                                                                    </TouchableOpacity>
                                                                                                                </View>
                                                                                                                :
                                                                                                                <View
                                                                                                                    style={[Styles.jSpaceBet, Styles.row, Styles.mBtm10]}>
                                                                                                                    <TouchableOpacity
                                                                                                                        onPress={() => this.setState({selectedButton: 'EXIT'}, () => {
                                                                                                                            this.storeFinalValues()
                                                                                                                        })}
                                                                                                                        activeOpacity={0.7}
                                                                                                                        style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth / 4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                                                                        <Text
                                                                                                                            style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                                                                color: '#C91A1F'
                                                                                                                            }, Styles.aslCenter, Styles.p5]}>Exit</Text>
                                                                                                                    </TouchableOpacity>

                                                                                                                    <TouchableOpacity
                                                                                                                        onPress={() => {
                                                                                                                            let resp = {}
                                                                                                                            resp = Utils.checkIsValueEmpty(this.state.tempPlanId, 'Please select Payment Plan');
                                                                                                                            if (resp.status === true) {
                                                                                                                                this.setState({
                                                                                                                                    finalPlanId: this.state.tempPlanId,
                                                                                                                                    finalPlanName: this.state.tempPlanName,
                                                                                                                                    finalUpdatePlanInProfile: this.state.tempUpdatePlanInProfile,
                                                                                                                                    paymentPlanDetailsUpdated: true,
                                                                                                                                    selectedButton: 'DONE'
                                                                                                                                }, () => {
                                                                                                                                    this.storeFinalValues()
                                                                                                                                })
                                                                                                                            } else {
                                                                                                                                Utils.dialogBox(resp.message, '');
                                                                                                                            }
                                                                                                                        }}
                                                                                                                        activeOpacity={0.7}
                                                                                                                        style={[Styles.aslCenter, {
                                                                                                                            backgroundColor: '#C91A1F',
                                                                                                                            width: windowWidth / 4.3
                                                                                                                        }, Styles.br5, Styles.padV5, Styles.OrdersScreenCardshadow]}>
                                                                                                                        <Text
                                                                                                                            style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, Styles.cWhite, Styles.aslCenter, Styles.p5]}>Done</Text>
                                                                                                                    </TouchableOpacity>
                                                                                                                </View>
                                                                                                        }
                                                                                                    </ScrollView>
                                                                                                    :
                                                                                                editButton === 'OPERATIONS_TYPE'
                                                                                                    ?
                                                                                                    <ScrollView
                                                                                                        style={[Styles.flex1, Styles.p15,]}>
                                                                                                        <Text
                                                                                                            style={[Styles.ffRLight, Styles.f18, Styles.cBlack87]}>Operations Type</Text>
                                                                                                        <ScrollView
                                                                                                            style={[{height: subEditHeightBy60 - 100}]}>
                                                                                                            <Text
                                                                                                                style={[Styles.ffRRegular, Styles.f14, Styles.pTop15, Styles.cGrey33]}>Entered by Fleet</Text>
                                                                                                            <View
                                                                                                                style={[Styles.aslCenter, Styles.bgLBlueWhite, Styles.mTop10, Styles.p10, {
                                                                                                                    width: subEditDetialsWidth
                                                                                                                }]}>
                                                                                                                <Text
                                                                                                                    numberOfLines={4}
                                                                                                                    style={[Styles.ffRMedium, Styles.f16, Styles.cGrey4F]}>{selectedCardTripDetails.dataBeforeUpdate ? _.startCase(selectedCardTripDetails.dataBeforeUpdate.tripType) : ''}</Text>
                                                                                                            </View>

                                                                                                            <Text
                                                                                                                style={[Styles.ffRRegular, Styles.f14, Styles.pTop15, Styles.cGrey33]}>Update Operations Type</Text>
                                                                                                            <View>
                                                                                                                <TouchableOpacity
                                                                                                                    style={[Styles.aslCenter, Styles.bw1, Styles.bcLightBlue, Styles.mTop10, {
                                                                                                                        width: subEditDetialsWidth,
                                                                                                                        padding: 10
                                                                                                                    }]}
                                                                                                                    disabled={!this.state.showUnVerifiedTripData}
                                                                                                                    activeOpacity={0.7}
                                                                                                                    onPress={() => {
                                                                                                                        this.getTripTypeList(selectedCardTripDetails.id)
                                                                                                                    }}>
                                                                                                                    <Text style={[  Styles.cGrey33, Styles.ffRMedium,Styles.f16,Styles.pRight20,Styles.padV3]}>{this.state.tempTripType ? _.startCase(this.state.tempTripType) : 'Select Operations Type'}</Text>
                                                                                                                    <MaterialIcons name='expand-more' color='#9e9e9e' size={35}
                                                                                                                                   style={{
                                                                                                                                       position: 'absolute',
                                                                                                                                       right: 2,
                                                                                                                                       top: 4
                                                                                                                                   }}/>
                                                                                                                </TouchableOpacity>
                                                                                                            </View>
                                                                                                        </ScrollView>
                                                                                                        {
                                                                                                            !this.state.showUnVerifiedTripData
                                                                                                                ?
                                                                                                                <View
                                                                                                                    style={[Styles.jSpaceBet, Styles.row, Styles.mBtm10]}>
                                                                                                                    <TouchableOpacity
                                                                                                                        onPress={() => this.setState({editTripDetailsModal: false})}
                                                                                                                        activeOpacity={0.7}
                                                                                                                        style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth / 4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                                                                        <Text
                                                                                                                            style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                                                                color: '#C91A1F'
                                                                                                                            }, Styles.aslCenter, Styles.p5]}>Exit</Text>
                                                                                                                    </TouchableOpacity>
                                                                                                                </View>
                                                                                                                :
                                                                                                                <View
                                                                                                                    style={[Styles.jSpaceBet, Styles.row, Styles.mBtm10]}>
                                                                                                                    <TouchableOpacity
                                                                                                                        onPress={() => this.setState({selectedButton: 'EXIT'}, () => {
                                                                                                                            this.storeFinalValues()
                                                                                                                        })}
                                                                                                                        activeOpacity={0.7}
                                                                                                                        style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth / 4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                                                                        <Text
                                                                                                                            style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                                                                color: '#C91A1F'
                                                                                                                            }, Styles.aslCenter, Styles.p5]}>Exit</Text>
                                                                                                                    </TouchableOpacity>

                                                                                                                    <TouchableOpacity
                                                                                                                        onPress={() => {
                                                                                                                            let resp = {}
                                                                                                                            resp = Utils.checkIsValueEmpty(this.state.tempTripType, 'Please select Operations Type');
                                                                                                                            if (resp.status === true) {
                                                                                                                                this.setState({
                                                                                                                                    finalTripType: this.state.tempTripType,
                                                                                                                                    operationsTypeDetailsUpdated: true,
                                                                                                                                    selectedButton: 'DONE'
                                                                                                                                }, () => {
                                                                                                                                    this.storeFinalValues()
                                                                                                                                })
                                                                                                                            } else {
                                                                                                                                Utils.dialogBox(resp.message, '');
                                                                                                                            }
                                                                                                                        }}
                                                                                                                        activeOpacity={0.7}
                                                                                                                        style={[Styles.aslCenter, {
                                                                                                                            backgroundColor: '#C91A1F',
                                                                                                                            width: windowWidth / 4.3
                                                                                                                        }, Styles.br5, Styles.padV5, Styles.OrdersScreenCardshadow]}>
                                                                                                                        <Text
                                                                                                                            style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, Styles.cWhite, Styles.aslCenter, Styles.p5]}>Done</Text>
                                                                                                                    </TouchableOpacity>
                                                                                                                </View>
                                                                                                        }
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
                        this.setState({dateBasedCountModal: false}, () => {
                            this.getmappedSitesTripCount()
                        })
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View style={[Styles.flex1, Styles.bgWhite, {
                            width: Dimensions.get('window').width,
                            height: Dimensions.get('window').height
                        }]}>
                            {this.state.spinnerBool === false ? null : <CLoader/>}
                            <Appbar.Header style={[Styles.bgDarkRed, Styles.jSpaceBet]}>
                                <Appbar.BackAction onPress={() => this.setState({dateBasedCountModal: false}, () => {
                                    this.getmappedSitesTripCount()
                                })
                                }/>
                                <Text
                                    style={[Styles.ffRMedium, Styles.cLightWhite, Styles.aslCenter, Styles.f18]}>{this.state.filterSiteCode + ' -'} Unverified
                                    Trips</Text>
                                <View style={[Styles.padH15]}/>
                            </Appbar.Header>
                            <View style={[Styles.flex1]}>
                                {
                                    this.state.pendingDatesInfo.length === 0
                                        ?
                                        <View style={[Styles.flex1, Styles.aitCenter, Styles.jCenter]}>
                                            <Text style={[Styles.ffRBold, Styles.f18, Styles.alignCenter]}>No Shifts
                                                Found..</Text>
                                        </View>
                                        :
                                        <FlatList
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
                                                        style={[Styles.marH20, Styles.marV7, Styles.row, Styles.aslCenter, Styles.jSpaceBet, Styles.br5, Styles.padH15, Styles.padV15,
                                                            Styles.bgLBlueWhite, Styles.TripReportsCardMainshadow, {
                                                                width: Dimensions.get('window').width - 36
                                                            }]}>

                                                        <View style={[Styles.aslCenter, Styles.row]}>
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

                {/*Modal for SITES LIST BASED ON DATE*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.sitesListBasedOnDateModal}
                    onRequestClose={() => {
                        this.setState({sitesListBasedOnDateModal: false}, () => {
                            this.getAllDatesTripCount()
                        })
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View style={[Styles.flex1, Styles.bgWhite, {
                            width: Dimensions.get('window').width,
                            height: Dimensions.get('window').height
                        }]}>
                            {this.state.spinnerBool === false ? null : <CLoader/>}
                            <Appbar.Header style={[Styles.bgDarkRed, Styles.jSpaceBet]}>
                                <Appbar.BackAction
                                    onPress={() => this.setState({sitesListBasedOnDateModal: false}, () => {
                                        this.getAllDatesTripCount()
                                    })
                                    }/>
                                <Text
                                    style={[Styles.ffRMedium, Styles.cLightWhite, Styles.aslCenter, Styles.f18]}>{_.startCase(_.lowerCase(this.state.filterTripType === 'AUTO_CREATED_SHIFT' ? 'Auto Created' : this.state.filterTripType === 'ADHOC_SHIFT' ? 'Adhoc' :this.state.filterTripType))} Trips
                                    ({Services.returnDateMonthYearFormatinMonthShort(this.state.filterDate)})</Text>
                                <View style={[Styles.padH15]}/>
                            </Appbar.Header>
                            <View style={[Styles.flex1]}>
                                {
                                    this.state.siteInfo
                                        ?
                                        <ScrollView style={[Styles.marV15]}>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    this.setState({filterSiteId: '', filterSiteCode: 'ALL'}, () => {
                                                        this.getUnverifiedTripList()
                                                    })
                                                }}
                                                activeOpacity={0.7}
                                                style={[Styles.marH20, Styles.marV7, Styles.row, Styles.aslCenter, Styles.jSpaceBet, Styles.br5, Styles.padH20, Styles.padV15,
                                                    Styles.bgLBlueWhite, Styles.TripReportsCardMainshadow, {
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
                                                data={this.state.siteInfo}
                                                renderItem={({item, index}) => {
                                                    return (
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                this.setState({
                                                                    filterSiteId: item.siteId,
                                                                    filterSiteCode: item.siteCode
                                                                }, () => {
                                                                    this.getUnverifiedTripList()
                                                                })
                                                            }}
                                                            activeOpacity={0.7}
                                                            style={[Styles.marH20, Styles.marV7, Styles.row, Styles.aslCenter, Styles.jSpaceBet, Styles.br5, Styles.padH20, Styles.padV15,
                                                                Styles.bgLBlueWhite, Styles.TripReportsCardMainshadow, {
                                                                    width: Dimensions.get('window').width - 36
                                                                }]}>

                                                            <View style={[Styles.aslCenter]}>
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
                                            <Text style={[Styles.ffRBold, Styles.f20, Styles.alignCenter]}>No Shifts
                                                Found..</Text>
                                        </View>
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
                        {this.state.spinnerBool === false ? null : <CLoader/>}
                        <View style={[{
                            width: Dimensions.get('window').width - 60,
                            height: Dimensions.get('window').height / 1.7
                        }]}>
                            <ScrollView
                                persistentScrollbar={true}
                                style={[Styles.flex1, Styles.padH20, Styles.padV15, Styles.bgLightWhite]}>
                                <View style={[Styles.mBtm10]}>
                                    <Text style={[Styles.ffRMedium, Styles.f16, {left: 10}, Styles.cBlack87]}>Select the
                                        reason for
                                        rejecting</Text>
                                </View>

                                {
                                    this.state.rejectReasonsList
                                        ?
                                        <FlatList
                                            data={this.state.rejectReasonsList}
                                            renderItem={({item, index}) =>
                                                <View
                                                    key={index}
                                                    style={[Styles.row, Styles.mTop5]}>
                                                    <Checkbox
                                                        color={'red'}
                                                        size={25}
                                                        onPress={() => {
                                                            this.setState({shiftRejectReasonSelected: item.name})
                                                        }}
                                                        status={item.name === this.state.shiftRejectReasonSelected ? 'checked' : 'unchecked'}
                                                    />
                                                    <Text
                                                        style={[Styles.f16, Styles.ffRMedium, Styles.aslCenter, Styles.marH5, Styles.cBlack87]}>{item.name}</Text>
                                                </View>
                                            }
                                            keyExtractor={(item, index) => index.toString()}
                                            contentContainerStyle={{paddingBottom: 50}}
                                        />
                                        :
                                        null
                                }
                            </ScrollView>
                            <View
                                style={[Styles.jEnd, Styles.row, Styles.padH20, Styles.padV15, Styles.bgLightWhite]}>
                                <TouchableOpacity
                                    onPress={() => {
                                        this.setState({
                                            rejectTripModal: false,
                                            currentCardCount: this.state.currentCardCount - 1,
                                            swipedAllCards:false
                                        }, () => {
                                            if (this.state.swipedCurrentCard) {
                                                this.swiper.swipeBack()
                                            }
                                        })
                                    }}
                                    activeOpacity={0.7}
                                    style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, Styles.padH20, Styles.padV5, Styles.OrdersScreenCardshadow,
                                        Styles.marH10]}>
                                    <Text
                                        style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, Styles.colorRed, Styles.aslCenter, Styles.p5]}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => {
                                        let selectedArray = [this.state.shiftRejectReasonSelected]
                                        if (this.state.shiftRejectReasonSelected === '') {
                                            Utils.dialogBox('Please select a Reason', '');
                                        } else {
                                            this.rejectTripDetails(selectedArray)
                                        }
                                    }}
                                    activeOpacity={0.7}
                                    style={[Styles.aslCenter, {backgroundColor: '#C91A1F'}, Styles.br5, Styles.padH20, Styles.padV5, Styles.OrdersScreenCardshadow]}>
                                    <Text
                                        style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, Styles.cWhite, Styles.aslCenter, Styles.p5]}>Reject</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/*MODAL for payemnt plan selection*/}
                <Modal transparent={true}
                       visible={this.state.paymentPlanSelectionModal}
                       animated={true}
                       animationType='slide'
                       onRequestClose={() => {
                           this.setState({paymentPlanSelectionModal: false})
                       }}>
                    <View style={[Styles.modalfrontPosition]}>
                        {this.state.spinnerBool === false ? null : <CLoader/>}
                        <View
                            style={[[  Styles.bgWhite,  {
                                width: Dimensions.get('window').width-20,
                                height: Dimensions.get('window').height/1.5,
                            }]]}>
                            <View style={[Styles.flex1]}>
                                <View style={[Styles.aslCenter, Styles.mTop20]}>
                                    <Text style={[Styles.ffRMedium, Styles.f18, Styles.alignCenter,Styles.cBlack87]}>Payment Plans</Text>
                                </View>
                                <View style={[Styles.alignCenter, Styles.marV10]}>
                                    <Searchbar
                                        style={{
                                            width: Dimensions.get('window').width - 60,
                                            borderWidth: 1,
                                            backgroundColor: '#f5f5f5',
                                        }}
                                        isFocused="false"
                                        placeholder="Search a plan"
                                        onSubmitEditing={() => {
                                            this.searchPaymentPlan(this.state.planSearchString), () => {
                                                Keyboard.dismiss()
                                            }
                                        }}
                                        value={this.state.planSearchString}
                                        onChangeText={(planSearchString) => {
                                            this.searchPaymentPlan(planSearchString)
                                        }}
                                    />
                                </View>

                                {this.state.searchedPaymentPlanList.length > 0 ?
                                    <ScrollView
                                        persistentScrollbar={true}
                                        style={{height: Dimensions.get('window').height - 80}}>
                                        <List.Section style={[Styles.alignCenter]}>
                                            {this.state.searchedPaymentPlanList.map((list, index) => {
                                                return (
                                                    <View
                                                        key={index}>
                                                        <TouchableOpacity
                                                            onPress={()=>{
                                                                this.setState({tempPlanId: list.id,tempPlanName:list.planName,paymentPlanSelectionModal:false})
                                                            }}
                                                            style={[Styles.p5,Styles.marV5,Styles.bw1,Styles.bcAsh,{width: Dimensions.get('window').width - 60}]}
                                                            activeOpacity={0.7}>
                                                                <Text style={[Styles.f18, Styles.ffRLight, Styles.aslCenter,Styles.cBlack87]}>{list.planName}</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                );
                                            })}
                                        </List.Section>
                                    </ScrollView>
                                    :
                                    <View style={[Styles.aslCenter, Styles.mTop20]}>
                                        <Text style={[Styles.ffRMedium, Styles.f18, Styles.alignCenter,Styles.cBlack87]}>No Payment Plans Found</Text>
                                    </View>
                                }
                            </View>

                        </View>
                        <TouchableOpacity style={{marginTop: 20}} onPress={() => {
                            this.setState({paymentPlanSelectionModal: false})
                        }}>
                            {LoadSVG.cancelIcon}
                        </TouchableOpacity>
                    </View>
                </Modal>

                {/*MODAL for operationsType selection*/}
                <Modal transparent={true}
                       visible={this.state.operationsTypeSelectionModal}
                       animated={true}
                       animationType='slide'
                       onRequestClose={() => {
                           this.setState({operationsTypeSelectionModal: false})
                       }}>
                    <View style={[Styles.modalfrontPosition]}>
                        {this.state.spinnerBool === false ? null : <CLoader/>}
                        <View
                            style={[[  Styles.bgWhite,  {
                                width: Dimensions.get('window').width-20,
                                height: Dimensions.get('window').height/1.5,
                            }]]}>
                            <View style={[Styles.flex1]}>
                                <View style={Styles.aslCenter}>
                                    <Text
                                        style={[Styles.ffMbold, Styles.colorBlue, Styles.f20, Styles.m10, Styles.mBtm10]}>Select
                                        Operations Type</Text>
                                </View>
                                {this.state.operationsTypeList.length > 0 ?
                                    <ScrollView
                                        persistentScrollbar={true}
                                        style={{height: Dimensions.get('window').height - 80}}>
                                        <List.Section style={[Styles.alignCenter]}>
                                            {this.state.operationsTypeList.map((list, index) => {
                                                return (
                                                    <View
                                                        key={index}>
                                                        <TouchableOpacity
                                                            onPress={()=>{
                                                                this.setState({tempTripType:list.key,operationsTypeSelectionModal:false})
                                                            }}
                                                            style={[Styles.p5,Styles.marV5,Styles.bw1,Styles.bcAsh,{width: Dimensions.get('window').width - 60},
                                                                this.state.tempTripType === list.key ? [Styles.bgDarkRed, Styles.bw0] : [Styles.bgWhite, Styles.bw1],]}
                                                            activeOpacity={0.7}>
                                                            <Text style={[Styles.f18, Styles.ffRBold, Styles.aslCenter,
                                                                this.state.tempTripType === list.key ? [Styles.cWhite]: [Styles.colorBlue]]}>{list.name}</Text>
                                                            {/*<Text style={[Styles.f18, Styles.ffRMedium, Styles.aslCenter,Styles.cLightBlue]}>{_.startCase(_.toLower(list.key))}</Text>*/}
                                                        </TouchableOpacity>
                                                    </View>
                                                );
                                            })}
                                        </List.Section>
                                    </ScrollView>
                                    :
                                    <View style={[Styles.aslCenter, Styles.mTop20]}>
                                        <Text style={[Styles.ffRMedium, Styles.f18, Styles.alignCenter,Styles.cBlack87]}>No Operations Types Found</Text>
                                    </View>
                                }
                            </View>

                        </View>
                        <TouchableOpacity style={{marginTop: 20}} onPress={() => {
                            this.setState({operationsTypeSelectionModal: false})
                        }}>
                            {LoadSVG.cancelIcon}
                        </TouchableOpacity>
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
                            {this.state.spinnerBool === false ? null : <CLoader/>}
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

