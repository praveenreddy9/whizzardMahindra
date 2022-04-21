import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    Image,
    TouchableOpacity,
    Dimensions,
    Modal,
    ScrollView, FlatList, ActivityIndicator, Platform, Linking, ImageBackground, TextInput, Keyboard, Alert
} from 'react-native';
import { CText, Styles, CSpinner, LoadSVG, CLoader, LoadImages} from './common'
import Utils from "./common/Utils";
import {
    Appbar,
    DefaultTheme,
    Card,
    Title, RadioButton, Checkbox, Chip
} from "react-native-paper";
import {Column as Col, Row} from "react-native-flexbox-grid";
import Services from "./common/Services";
import Config from "./common/Config";
import _ from "lodash";
import Icon from 'react-native-vector-icons/dist/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/dist/MaterialIcons';
import OfflineNotice from './common/OfflineNotice';
import MonthSelectorCalendar from 'react-native-month-selector';
import FontAwesome from "react-native-vector-icons/dist/FontAwesome";
import moment from "moment";
import OneSignal from "react-native-onesignal";
import HomeScreen from "./HomeScreen";
import FastImage from "react-native-fast-image";
import MaterialCommunityIcons from "react-native-vector-icons/dist/MaterialCommunityIcons";
import ImageZoom from "react-native-image-pan-zoom";



const theme = {
    ...DefaultTheme,
    fonts: {
        medium: 'Muli-Regular'
    }
};

const MORE_ICON = Platform.OS === 'ios' ? 'more-vert' : 'more-vert';

const windowWidth = Dimensions.get('window').width;
const editModalHeight = Dimensions.get('window').height / 1.5;
const subEditHeightBy60 = editModalHeight-60;
const subEditDetialsWidth = windowWidth /2;

export default class MyTrips extends React.Component {

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
        this.state = {
            showPackagesListModal: false,
            refreshing: false,
            ascendingOrder: true,
            data: [],
            page: 1,
            spinnerBool: false,
            size: 10,
            isLoading: false,
            dateFilterModal: false,
            month: new Date().getMonth(),
            year: new Date().getFullYear(), cancelledShifts: false, cancelledShiftModal: false, tabOne: true, tabTwo: false,

            //design changes
            showTripDetailsModal:false,

            //verification screen list
            reportsList: [],
            totalElements: 0,

            //latest
            imagePreview: false,
            imagePreviewURL: '',
            imageRotate: '0',
            dateBasedCountModal: false,
            tripDetailsCardModal: false,

            sitesListBasedOnDateModal:false,
            // cards: [...range(1, 5)],
            cards: [],
            siteInfo: [],
            pendingDatesInfo: [],
            swipedAllCards: false,
            swipeDirection: '',
            cardIndex: 0,
            editTripDetailsModal: false,
            clientUserIdDetailsUpdated: false,tripSheetIdDetailsUpdated: false,kilometerDetailsUpdated: false,packageDetailsUpdated: false,
            shortCashDetailsUpdated: false,penaltyDetailsUpdated: false,clientEmployeeIdDetailsUpdated:false,liteUserPaymentDetailsUpdated:false,partnerDetailsUpdated:false,clientLoginIdDetailsUpdated:false,paymentPlanDetailsUpdated:false,
            clientUserIdReason:false,tripSheetIdReason:false,packageReason:false,kilometerReason:false,
            plannedLeave:false,unPlannedLeave :false,notWorked:false,
            infinite:false,currentIndex:0,currentCardCount:0,
            filterTripType:'ALL',rejectTripModal:false,rejectReasonsList:[],
            chipsList: [
                {status: '', name: 'All', value: 1},
                {status: 'verified', name: 'Verified', value: 2},
                {status: 'rejected', name: 'Rejected', value: 3},
                {status: 'unVerified', name: 'Un-Verified', value: 4}
            ],selectedChip:'',
            penaltyReasons:[
                {reason: 'Late reporting', value: 0,status:false},
                {reason: 'Incorrect client login ID', value: 1,status:false},
                {reason: 'Incorrect kilometer readings', value: 2,status:false},
                {reason: 'Incorrect package count', value: 3,status:false},
                {reason: 'Short Cash', value: 4,status:false},
                {reason: 'Trip verification incomplete', value: 5,status:false},
                {reason: 'Incorrect payment details', value: 6,status:false},
            ],
            shiftId:'',
            // tripSummary:[]
        }
    }



    componentDidMount() {
        const self = this;
        const {navigation} = this.props;
        this.focusListener = navigation.addListener('didFocus', () => {
        // this._subscribe = this.props.navigation.addListener('didFocus', () => {
        let notificationTripId = self.props.navigation.state.params.shiftId
            this.setState({month: new Date().getMonth(), year: new Date().getFullYear(),
                notificationTripId:notificationTripId ,}, () => {
                self.getAllTrips();
                if (notificationTripId){
                    self.getFirstTripDetails(notificationTripId)
                }
            })
            Services.checkMockLocationPermission((response) => {
                if (response){
                    this.props.navigation.navigate('Login')
                }
            })
        })
    };

    componentWillUnmount() {
        // Remove the event listener
        this.focusListener.remove();
    }

    handleLoadMore = () => {
        this.state.page < this.state.totalPages ?
            this.setState({
                page: this.state.page + 1
            }, () => {
                this.getAllTrips();
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
        this.state.page < this.state.totalPages ?
            this.setState({
                refreshing: true,
            }, () => {
                this.getAllTrips();
            }) : null
    };

    errorHandling(error) {
        // console.log("My trips error", error, error.response);
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

    getAllTrips() {
        const {data, page} = this.state;
        this.setState({isLoading: true});
        const self = this;
        // const getTrips = Config.routes.BASE_URL + Config.routes.GET_TRIPS;
        const getTrips = Config.routes.BASE_URL + Config.routes.GET_USER_ALL_TRIPS;
        const body = {
            month: self.state.month+1 +'-'+self.state.year,
            filter : self.state.selectedChip
        };
        // console.log('all trips body', body)
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(getTrips, "POST", body, function (response) {
                if (response.status === 200) {
                    const tripsData = response.data;
                    // console.log("getAllTrips data===tripsData", tripsData);
                    self.setState({
                        // data: tripsData.content,
                        // data: tripsData.all,
                        data: tripsData.data,
                        totalPages: response.data.totalPages,
                        spinnerBool: false, refreshing: false
                    })
                }
            }, function (error) {
                self.errorHandling(error);
            });
        })
    }

    getCancelledShifts() {
        const {cancelledData, page} = this.state;
        this.setState({isLoading: true});
        const self = this;
        const getTrips = Config.routes.BASE_URL + Config.routes.GET_CANCELLED_SHIFTS;
        const body = {
            page: self.state.page,
            sort: "name,asc",
            size: 100,
            month: self.state.month,
            year: self.state.year,
        };
        // console.log('all cancalled body', body)
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(getTrips, "POST", body, function (response) {
                if (response.status === 200) {
                    const tripsData = response.data;
                    // console.log("all cancalled resp200", tripsData);
                    self.setState({
                        cancelledData: page === 1 ? tripsData.content : [...cancelledData, ...tripsData.content],
                        totalPages: response.data.totalPages,
                        spinnerBool: false, refreshing: false
                    })
                }
            }, function (error) {
                // console.log('all cancalled error')
                self.errorHandling(error)
            });
        })
    }

    showOrHidePackages(data) {
        if (data === true) {
            this.setState({showPackages: true})
        } else {
            this.setState({showPackages: false})
        }
    }


    ShiftTimings(item) {
        var timeHours = new Date(item).getHours();
        var timeMinutes = new Date(item).getMinutes();
        return (
            <Title style={{
                fontSize: 18,
                textAlign: 'center',
                fontFamily: 'Muli-Bold'
            }}>{timeHours <= 9 ? ('0' + timeHours) : (timeHours)}:{timeMinutes <= 9 ? ("0" + timeMinutes) : timeMinutes}</Title>
        )
    }

    sortingFilter(sortType) {
        if (sortType === "ascending") {
            const filteredData = _.sortBy(this.state.data, function (data) {
                return new Date(data.shiftDate);
            });
            this.setState({data: filteredData, ascendingOrder: false})
        } else {
            const filteredData = _.sortBy(this.state.data, function (data) {
                return new Date(data.shiftDate);
            });
            filteredData.reverse();
            this.setState({data: filteredData, ascendingOrder: true})
        }
    }

    //Will form an array with pickup and delivery packages
    getAllTypesOfPackages = (item) => {
        const packagesData = item;
        const deliveryPackages = packagesData.deliveredPackagesInfo; //data from params
        const pickupPackages = packagesData.pickUpPackagesInfo; //data from API
        const EndShiftArray = [];
        if (pickupPackages && deliveryPackages) {
            for (var i = 0; i < pickupPackages.length; i++) {
                for (var j = 0; j < deliveryPackages.length; j++) {
                    if (pickupPackages[i].type === deliveryPackages[j].type) {
                        let sample = {};
                        sample.type = pickupPackages[i].type;
                        sample.pickupCount = pickupPackages[i].count;
                        sample.deliveryCount = deliveryPackages[j].count;
                        sample.statuses = deliveryPackages[j].statuses;
                        EndShiftArray.push(sample);
                    }
                }
            }
        }
        this.setState({deliveryHistory: EndShiftArray});
    };

    FetchFinalCount(item) {
        return (
            <View style={[Styles.bgWhite]}>
                <View style={styles.inline}>
                    <Text style={[Styles.ffMregular, Styles.f18]}>{item.type}</Text>
                    <Text style={[Styles.ffMbold, Styles.f20]}>{item.deliveryCount}/{item.pickupCount}</Text>
                    {/*<Text style={[Styles.ffMbold,Styles.f20]}>{item.deliveryCount}</Text>*/}
                </View>
                <FlatList
                    data={item.statuses} renderItem={({item}) =>
                    <View style={[Styles.row, Styles.jSpaceBet, Styles.marH20, Styles.p5]}>
                        <Text style={[Styles.f16, Styles.ffMregular, Styles.txtAlignLt]}>{item.status}</Text>
                        <Text style={[Styles.f16, Styles.ffMregular, Styles.txtAlignRt]}>{item.count}</Text>
                    </View>
                }/>
            </View>
        )
    }

    getShiftRole(role) {
        return (
            role === 1 ? "Associate"
                : role === 5 ? "Driver"
                : role === 10 ? "Driver & Associate"
                    : role === 15 ? "Labourer"
                        : role === 19 ? "Process Associate"
                            : role === 20 ? 'Supervisor'
                                : role === 25 ? 'Shift Lead'
                                    : role === 26 ? 'Hub Manager'
                                        : role === 30 ? 'Cluster Manager'
                                            : role === 31 ? 'Ops Manager'
                                                : role === 35 ? 'City Manager' :
                                                    role === 45 ? 'Super User' : null
        )

    }


    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    //API to get first trip details
    getFirstTripDetails(tripId) {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_TRIP_DETAILS+tripId;
        const body = {}
        // console.log('get first Trip Details apiURL', apiURL, body)
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "GET", body, (response) => {
                if (response.status === 200) {
                    let responseList = response.data
                    // console.log('get first Trip Details resp200', responseList);

                    self.setState({
                        spinnerBool: false,
                        showTripDetailsModal:true,currentTripsDetails:responseList
                    },()=>{
                        self.useSelectedDataReport(responseList,'TESTING')
                        if (responseList.requireClientLoginId){
                            self.getEnteredPhoneNumberProfiles(responseList.clientLoginIdMobileNumber)
                        }
                    });
                }
            }, (error) => {
                self.errorHandling(error)
            })
        });
    }


    tripsList(item) {
        return (
            <View style={[Styles.mBtm10,]}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={()=>this.getFirstTripDetails(item.id)}
                    style={[Styles.padH10, Styles.OrdersScreenCardshadow, Styles.bgWhite,
                        {
                            width: Dimensions.get('window').width - 20,
                            borderLeftColor: Services.getShiftStatusColours(item.attrs.shiftStatus),
                            borderLeftWidth: 10,
                            // backgroundColor:Services.getTripVerificationStatus(item.status)
                        }]}>
                    <View style={[Styles.padV5]}>
                        <View style={[Styles.row,Styles.jSpaceBet]}>
                             <Text style={[Styles.f16, Styles.colorBlue, Styles.ffLBlack,Styles.flex1,{color:Services.getTripVerificationStatus(item.status)}]}>{item.status}</Text>
                            <Text style={[Styles.f16, Styles.ffLBlack,Styles.colorBlue,{flex:0.7}]}>{Services.getUserRolesShortName(item.role)}</Text>
                            <Text style={[Styles.f16, Styles.cVoiletPinkMix, Styles.ffLBlack,{flex:0.6}]}>{item.tripDateStr}</Text>
                        </View>


                        <View style={[Styles.row]}>
                                <View style={[Styles.row,Styles.flex1]}>
                                    <Text style={[Styles.f22, Styles.colorBlue, Styles.ffLBlack]}>{item.attrs.siteCode}</Text>
                                </View>
                            <View style={[Styles.row,Styles.flex1]}>
                                <Text  style={[Styles.f24, Styles.colorBlue, Styles.ffMbold]}>{item.attrs.shiftDurationString}</Text>
                            </View>
                           <View style={[{flex:1}]}>
                               <Text style={[Styles.f16, Styles.ffLBlack,Styles.colorBlue,Styles.aslEnd,Styles.jEnd]}>{item.attrs.shiftType}</Text>
                           </View>
                        </View>

                        <View style={[Styles.row]}>
                                <Text
                                    style={[Styles.f16,Styles.ffLBlack,{color:Services.getShiftStatusColours(item.attrs.shiftStatus)}]}>{_.startCase(_.lowerCase(item.attrs.shiftStatus))}</Text>
                        </View>

                    </View>
                </TouchableOpacity>
            </View>



            // <View style={[Styles.bcAsh, {marginBottom: 15}]}>
            // {/*    <View style={[Styles.bgWhite]}>*/}
            //         <TouchableOpacity
            // {/*            onPress={()=>{this.setState({showTripDetailsModal:true,currentTripsDetails:item})}}*/}
            // {/*            style={[Styles.OrdersScreenCardshadow]}>*/}
            // {/*            <View style={[Styles.bgWhite, Styles.row, Styles.jSpaceBet, Styles.p5, Styles.alignCenter, Styles.aslCenter]}>*/}
            // {/*                <View style={[Styles.row, Styles.jSpaceBet, Styles.alignCenter]}>*/}

            //                     {
            //                         item.role === 1 || item.role === 5 || item.role === 10
            //                         ?
            //                             <View>
            //                                 {
            //                                     item.role === 1 || item.role === 10
            //                                         ?
            //                                         <View style={[Styles.row]}>
            //                                             <Text style={[Styles.ffMbold,Styles.cBlk,Styles.f18]}>{item.startingKM - item.endingKm}</Text>
            //                                             <Text style={[Styles.ffMregular]}>km</Text>
            //                                         </View>
            //                                         :
            //                                         null
            //                                 }
            //                                 {
            //                                     item.role === 1 || item.role === 10
            //                                         ?
            //                                         <View style={[Styles.row]}>
            //                                             <Text
            //                                                 style={[Styles.ffMbold,Styles.cBlk,Styles.f18]}>{item.totalDeliveries}</Text>
            //                                             <Text style={[Styles.ffMregular]}>Packages</Text>
            //                                         </View>
            //                                         :
            //                                         null
            //                                 }
            //                             </View>
            // {/*                            :*/}
            // {/*                            <View style={styles.dHistoryGridOne}>*/}
            // {/*                                <CText cStyle={[styles.dHistoryGridSub, {fontSize: 19}]}>---</CText>*/}
            // {/*                            </View>*/}
            //                     }
            //
            //                     <View style={styles.dHistoryGridTwo}>
            //                         <CText
            //                             cStyle={[styles.dHistoryGridSub, {fontSize: 16}]}>shift status : {item.status}</CText><CText
            //                             cStyle={[styles.dHistoryGridSub, {fontSize: 16}]}>{item.tripDateStr}</CText><CText
            //                             cStyle={[styles.dHistoryGridSub, {fontSize: 16}]}>{item.attrs.shiftDurationString || '--'}</CText>
            // {/*                        <CText cStyle={[{*/}
            //                             fontFamily: 'Muli-Regular',
            // {/*                            textAlign: 'center', fontSize: 14*/}
            //                         }]}>{item.attrs.shiftDate}</CText>
            //                         <CText cStyle={[{
            //                             fontFamily: 'Muli-Regular',
            //                             textAlign: 'center', fontSize: 14
            //                         }]}>
            //                             {this.getShiftRole(item.userRole)}
            //                         </CText>
            //                     </View>
            //                 </View>
            //                 <TouchableOpacity style={[Styles.txtAlignRt]}
            //                                   // onPress={() => this.setState({
            //                                   //     showPackagesListModal: true,
            //                                   //     deliveriesData: item
            //                                   // }, () => {
            //                                   //     this.getAllTypesOfPackages(item);
            //                                   //     this.getFirstTripDetails(item.id)
            //                                   // })}
            //                     onPress={()=>{this.setState({showTripDetailsModal:true,currentTripsDetails:item})}}
            //                 >
            //                     <Text style={{fontFamily: 'Muli-Regular', padding: 20}}>
            //                         <MaterialIcons name="info-outline" size={40} color={'#909090'}/>
            //                     </Text>
            //                 </TouchableOpacity>
            //             </View>
            // {/*        </TouchableOpacity>*/}
            // {/*    </View>*/}

            // {/*</View>*/}
        )
    }

    cancelledTrips(item) {
        return (
            <View style={[Styles.bcAsh, {marginBottom: 15}]}>
                <View style={[{backgroundColor: '#fff'}, Styles.row, Styles.jSpaceBet, Styles.alignCenter]}>
                    <View style={[Styles.flex1]}>
                        <CText
                            cStyle={[styles.dHistoryGridSub, {fontSize: 16}]}>{item.shiftDateStr || '-------'}</CText>
                        <CText cStyle={[{
                            fontFamily: 'Muli-Regular',
                            textAlign: 'center', fontSize: 15
                        }]}>
                            {this.getShiftRole(item.userRole)}
                        </CText>
                    </View>
                    <TouchableOpacity style={[Styles.txtAlignRt]}
                                      onPress={() => this.setState({
                                          cancelledShiftModal: true, cancelledShiftData: item
                                      })}>
                        <Text style={{fontFamily: 'Muli-Regular', padding: 20}}>
                            <MaterialIcons name="info-outline" size={40} color={'#909090'}/>
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    getMonthFromString() {
        var formattedMonth = moment(this.state.month + 1, 'MM').format('MMMM')
        return (
            <Text>{formattedMonth + ' ' + this.state.year}</Text>
        )
    }



    useSelectedDataReport(item, selectedButton) {
        let tempStatus = item.status === "VERIFIED"
        this.setState({
            selectedCardTripDetails: item,
            tempClientUserId:  item.clientUserId,
            tempTripSheetId:   item.tripSheetId,
            tempEmployeeId:   item.clientEmployeeId,
            tempPartnerDetails:   item.partnerDetails,
            tempStartingKM: JSON.stringify(item.startingKM),
            tempEndingKm: JSON.stringify(item.endingKm),
            pickupPackages: JSON.stringify(item.packages),
            totalDeliveredCount: JSON.stringify(item.packages),
            tempDeliveredPackages: item.deliveredPackages,
            tempRole:item.role,
            penalty: item.penalty ? JSON.stringify(item.penalty) :'0',
            // penaltyReason:item.penaltyReason,
            penaltyReasons:item.penaltyReasons,
            shortCash:item.shortCash ? JSON.stringify(item.shortCash) :'0',
            tempPlanName: item.planName,
            tempPlanId:item.planId,
            tempUpdatePlanInProfile:item.updatePlanInProfile,

            //lite user payment detials
            liteUserAmount:item.attrs.amountPaid,
            liteUserBenName:item.attrs.beneficiaryName,
            liteUserBenAccountNo:item.attrs.beneficiaryAccountNumber,
            liteUserBenPAN:item.attrs.beneficiaryPanNumber,
            liteUserBenIFSC:item.attrs.ifscCode,
            liteUserPaymentType:item.attrs.paymentMode,

            tempSearchPhoneNumber:item.clientLoginIdMobileNumber,

            // editTripDetailsModal: true,
            editTripDetailsModal: selectedButton !== 'TESTING',
            editButton: selectedButton,
            clientUserIdDetailsUpdated:tempStatus,
            tripSheetIdDetailsUpdated:tempStatus,
            kilometerDetailsUpdated:tempStatus,
            packageDetailsUpdated:tempStatus,
            shortCashDetailsUpdated:tempStatus,
            penaltyDetailsUpdated:tempStatus,
            clientEmployeeIdDetailsUpdated:tempStatus,
            liteUserPaymentDetailsUpdated:tempStatus,
            partnerDetailsUpdated:tempStatus,
            clientLoginIdDetailsUpdated:tempStatus,
            paymentPlanDetailsUpdated:tempStatus,
        })
    };


    renderCard = (card,index) => {
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
            tripSummary
        } = this.state
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
                        }]}>1/1</Text>
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
                                <View style={[ card.unRegisteredUserAdhocShift ? Styles.bgLYellow2 : Styles.bgLBlueWhite, Styles.br10, Styles.pBtm10]}>
                                    <View style={[Styles.posAbsolute, {top: -35}]}>
                                        {/*{*/}
                                        {/*    card.attrs.profilePicUrl*/}
                                        {/*        ?*/}
                                        {/*        <View*/}
                                        {/*            style={[Styles.row, Styles.aslCenter, Styles.br50, Styles.bw3, Styles.bcWhite, Styles.OrdersScreenCardshadow]}>*/}
                                        {/*            <ImageBackground*/}
                                        {/*                style={[Styles.img70, Styles.aslCenter, Styles.br50]}*/}
                                        {/*                source={LoadImages.Thumbnail}>*/}
                                        {/*                <Image*/}
                                        {/*                    style={[Styles.img70, Styles.aslCenter, Styles.br50]}*/}
                                        {/*                    source={card.attrs.profilePicUrl ? {uri: card.attrs.profilePicUrl} : null}/>*/}
                                        {/*            </ImageBackground>*/}
                                        {/*        </View>*/}
                                        {/*        :*/}
                                        {/*        <FastImage*/}
                                        {/*            style={[Styles.aslCenter, Styles.img70, Styles.bw3, Styles.bcWhite, Styles.br50, Styles.OrdersScreenCardshadow]}*/}
                                        {/*            source={LoadImages.user_pic}/>*/}
                                        {/*}*/}
                                        <FastImage
                                            style={[Styles.aslCenter, Styles.img70, Styles.bw3, Styles.bcWhite, Styles.br50, Styles.OrdersScreenCardshadow]}
                                            source={LoadImages.user_pic}/>
                                    </View>
                                    <Text
                                        numberOfLines={2}
                                        // style={[Styles.f24, Styles.cDarkBlue, Styles.txtAlignCen, Styles.ffRMedium,Styles.pTop45]}>{_.startCase(card.attrs.userName)}</Text>
                                        style={[Styles.f24,Styles.cDarkBlue, Styles.txtAlignCen,Styles.pTop45,Styles.ffRMedium]}>{_.startCase(card.attrs.userName)}</Text>
                                    {/*style={[Styles.f24,card.unRegisteredUserAdhocShift ? Styles.cRed : Styles.cDarkBlue, Styles.txtAlignCen,Styles.pTop45,Styles.ffRMedium]}>{_.startCase(card.attrs.userName)}</Text>*/}

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
                                                        // style={[Styles.aslCenter,Styles.bgLBlueAsh,{ width:46,height:32}]}>{Services.returnVehicleType(card.vehicleType)}</View>
                                                        style={[Styles.aslCenter]}>{Services.returnVehicleType(card.vehicleType)}</View>
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
                                                // <View style={[Styles.aslCenter,Styles.bgLBlueAsh, {width: 70,height:32}]}>
                                                <View style={[Styles.aslCenter]}>
                                                    <Image
                                                        style={[ {height: 32, width: 46},Styles.ImgResizeModeCenter]}
                                                        source={LoadImages.profile_user}/>
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
                                            <Text style={[Styles.f14, Styles.cDarkBlue, Styles.aslCenter, Styles.ffRMedium]}>{Services.returnDateMonthYearFormatinShort(card.tripDateStr)}</Text>
                                        </View>
                                        <View style={[Styles.flex1, Styles.alignCenter]}>
                                            <Text
                                                style={[Styles.f14, Styles.cDarkBlue, Styles.aslCenter, Styles.ffRMedium]}>{card.attrs.shiftEndedTimeIn24HrsFormat || '--'}</Text>
                                        </View>
                                    </View>
                                    <View style={[Styles.row,Styles.mBtm5]}>
                                        <View style={[Styles.flex1, Styles.alignCenter]}>
                                            <Text
                                                style={[Styles.f12, Styles.cLightBlue, Styles.aslCenter, Styles.ffRMedium]}>{_.startCase(_.lowerCase(card.attrs.shiftType)) || '--'} Trip</Text>
                                        </View>
                                        <View style={{flex:1/2}} />
                                        <View style={[Styles.flex1, Styles.alignCenter]}>
                                            <Text
                                                numberOfLines={1}
                                                style={[Styles.f12, Styles.cLightBlue, Styles.aslCenter, Styles.ffRMedium]}>{_.startCase(_.lowerCase(card.attrs.shiftStatus)) || '--'}</Text>
                                        </View>
                                    </View>
                                </View>


                                <ScrollView>
                                    <View style={[Styles.row, Styles.flexWrap, Styles.alignCenter, Styles.marV15,Styles.padV5]}>

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
                                                        <View style={[Styles.posAbsolute, {top: 46, left: Dimensions.get('window').width/8.5}]}>
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
                                                        this.setState({tempCardIndex: index, cardIndex: index,selectedCardTripDetails:card}, () => {
                                                            this.useSelectedDataReport(card, 'CLIENT_LOGIN_ID')
                                                            // this.getEnteredPhoneNumberProfiles(card.clientLoginIdMobileNumber)
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
                                                                style={[Styles.f12, Styles.cLightBlue, Styles.aslCenter, Styles.ffRRegular]}>Client Login Id</Text>
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
                                                        this.setState({tempCardIndex:index,cardIndex:index},()=>{
                                                            this.useSelectedDataReport(card, 'EMPLOYEE_ID')
                                                        })
                                                    }}
                                                    activeOpacity={0.7}
                                                    style={[Styles.row, Styles.mTop5,]}>
                                                    <View
                                                        style={[Styles.bw1,card.clientEmployeeId ? Styles.bcAsh :Styles.bcLightRed, Styles.br5, Styles.marH5, Styles.mBtm10]}>
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
                                                                style={[Styles.f12, Styles.cLightBlue, Styles.aslCenter, Styles.ffRRegular]}>Employee ID</Text>
                                                        </View>
                                                        <View style={[Styles.posAbsolute, {top: 46, left: Dimensions.get('window').width/8.5}]}>
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
                                                                width: Dimensions.get('window').width / 3.8,
                                                                height: 55
                                                            }]}>
                                                            <Text
                                                                style={[Styles.f14, card.tripDistance >0 ? Styles.cLightNavyBlue : Styles.cLightRed, Styles.aslCenter, Styles.ffRRegular]}>{card.tripDistance}</Text>
                                                        </View>
                                                        <View
                                                            style={[Styles.bgWhite, Styles.padV10, Styles.aslCenter, {
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
                                                        style={[Styles.f14, card.shortCash >0 ? Styles.cLightNavyBlue : Styles.cLightRed, Styles.aslCenter, Styles.ffRRegular]}>&#x20B9;{' '}{card.shortCash === 0 ? 0 : card.shortCash || '--'}</Text>
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
                                                        style={[Styles.f14, card.penalty >0 ? Styles.cLightNavyBlue : Styles.cLightRed, Styles.aslCenter, Styles.ffRRegular]}>&#x20B9;{' '}{card.penalty === 0 ? 0 : card.penalty || '--'}</Text>
                                                </View>
                                                <View
                                                    style={[Styles.bgWhite, Styles.padV10, Styles.aslCenter, {
                                                        height: 36
                                                    }]}>
                                                    <Text
                                                        style={[Styles.f12, Styles.cLightBlue, Styles.aslCenter, Styles.ffRRegular]}>Penalty</Text>
                                                </View>
                                                <View style={[Styles.posAbsolute,{top: 46, left: Dimensions.get('window').width/8.5}]}>
                                                    {Services.returnCardStatusIcon(penaltyDetailsUpdated)}
                                                </View>
                                            </View>
                                        </TouchableOpacity>

                                        {
                                            card.unRegisteredUserAdhocShift
                                                ?
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        this.setState({tempCardIndex:index,cardIndex:index},()=>{
                                                            this.useSelectedDataReport(card, 'LITE_USER_PAYMENT_DETAILS')
                                                        })
                                                    }}
                                                    activeOpacity={0.7}
                                                    style={[Styles.row, Styles.mTop5,]}>
                                                    <View
                                                        style={[Styles.bw1,card.attrs.amountPaid >0 ? Styles.bcAsh :Styles.bcLightRed, Styles.br5, Styles.marH5, Styles.mBtm10]}>
                                                        <View
                                                            style={[card.attrs.amountPaid >0 ? Styles.bgLBlueWhite : Styles.bgLPink, Styles.padV10, Styles.alignCenter, {
                                                                width: Dimensions.get('window').width / 3.8,
                                                                height: 55
                                                            }]}>
                                                            <Text
                                                                numberOfLines={1}
                                                                style={[Styles.f14,card.attrs.amountPaid >0 ? Styles.cLightNavyBlue : Styles.cLightRed, Styles.aslCenter, Styles.ffRRegular]}>&#x20B9;{' '}{card.attrs ? card.attrs.amountPaid : '' || '--'}</Text>                                                        </View>
                                                        <View
                                                            style={[Styles.bgWhite, Styles.padV10, Styles.aslCenter, {
                                                                height: 36
                                                            }]}>
                                                            <Text
                                                                style={[Styles.f12, Styles.cLightBlue, Styles.aslCenter, Styles.ffRRegular]}>Payment Details</Text>
                                                        </View>
                                                        <View style={[Styles.posAbsolute, {top: 46, left: Dimensions.get('window').width/8.5}]}>
                                                            {Services.returnCardStatusIcon(liteUserPaymentDetailsUpdated)}
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
                                                        this.setState({tempCardIndex:index,cardIndex:index},()=>{
                                                            this.useSelectedDataReport(card, 'PARTNER_DETAILS')
                                                        })
                                                    }}
                                                    activeOpacity={0.7}
                                                    style={[Styles.row, Styles.mTop5,]}>
                                                    <View
                                                        style={[Styles.bw1,card.partnerDetails ?  Styles.bcAsh :Styles.bcLightRed, Styles.br5, Styles.marH5, Styles.mBtm10]}>
                                                        <View
                                                            style={[card.partnerDetails ?  Styles.bgLBlueWhite : Styles.bgLPink, Styles.padV10, Styles.alignCenter, {
                                                                width: Dimensions.get('window').width / 3.8,
                                                                height: 55
                                                            }]}>
                                                            <Text
                                                                numberOfLines={1}
                                                                style={[Styles.f14,card.partnerDetails ? Styles.cLightNavyBlue : Styles.cLightRed, Styles.aslCenter, Styles.ffRRegular]}>{card.partnerDetails|| '--'}</Text>
                                                        </View>
                                                        <View
                                                            style={[Styles.bgWhite, Styles.padV10, Styles.aslCenter, {
                                                                height: 36
                                                            }]}>
                                                            <Text
                                                                style={[Styles.f12, Styles.cLightBlue, Styles.aslCenter, Styles.ffRRegular]}>Partner Name</Text>
                                                        </View>
                                                        <View style={[Styles.posAbsolute, {top: 46, left: Dimensions.get('window').width/8.5}]}>
                                                            {Services.returnCardStatusIcon(partnerDetailsUpdated)}
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
                            {
                                card.status === 'VERIFIED' || card.status === 'REJECTED'
                                    ?
                                    <View style={[Styles.row, Styles.aslCenter, {bottom: 30}]}>
                                        {
                                            card.status === 'VERIFIED'
                                                ?
                                                <Image style={[Styles.aslCenter, Styles.img100]}
                                                       source={LoadImages.approved}/>
                                                :
                                                card.status === 'REJECTED'
                                                    ?
                                                    <Image style={[Styles.aslCenter, Styles.img100]}
                                                           source={LoadImages.rejected}/>
                                                    :
                                                    null
                                        }
                                        <View style={[Styles.jEnd,Styles.pLeft15]}>
                                            {
                                                card.status === 'REJECTED'
                                                ?
                                                    <Text style={[Styles.f16,Styles.ffLBlack,Styles.cBlk]}>{card.rejectedOn}</Text>
                                                    :
                                                    card.status === 'VERIFIED'
                                                        ?
                                                    <Text style={[Styles.f16,Styles.ffLBlack,Styles.cBlk]}>{card.verifiedAt}</Text>
                                                        :
                                                        null
                                            }

                                            {
                                                card.status === 'REJECTED'
                                                    ?
                                                    <View>
                                                        <Text
                                                            style={[Styles.f16, Styles.cBlk,Styles.ffLBold]}>( {card.rejectionReasons[0]} )</Text>
                                                    </View>
                                                    :
                                                    null
                                            }

                                            {/*{*/}
                                            {/*    card.status === 'REJECTED'*/}
                                            {/*        ?*/}
                                            {/*        <TouchableOpacity*/}
                                            {/*            style={[{borderBottomColor:'#FF0000',borderBottomWidth:2}]}*/}
                                            {/*            onPress={()=>{this.setState({rejectTripModal:true,rejectReasonsList:card.rejectionReasons})}}>*/}
                                            {/*            <Text*/}
                                            {/*                style={[Styles.f16, Styles.cRed,Styles.ffLBold]}>Reason for Trip Rejection</Text>*/}
                                            {/*        </TouchableOpacity>*/}
                                            {/*        :*/}
                                            {/*        null*/}
                                            {/*}*/}

                                        </View>
                                    </View>
                                    :
                                    null
                            }
                        </View>
                    </View>
                </View>
            )
        }
    };

    //API CALL to get profile based on phone number search
    getEnteredPhoneNumberProfiles(searchNumber,) {
        const {currentTripsDetails} = this.state;
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_PROFILES_BASED_ON_PHONE_NUMBER_SEARCH + 'siteCode='+currentTripsDetails.attrs.siteCode +'&phoneNumber='+searchNumber ;
        const body = {};
        // console.log("profile search body", body,'apiURL==>',apiURL);
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "GET", body, function (response) {
                if (response.status === 200) {
                    // console.log("profile search resp200", response);
                    self.setState({
                        spinnerBool: false,
                        tempSearchPhoneNumber:searchNumber,
                        phoneNumberSearchData:response.data,
                        selectedClientUserID:'',
                        clientEmployeeId:''
                    })
                }
            }, function (error) {
                self.errorHandling(error)
            });
        })
    }

    rotate() {
        let newRotation = JSON.parse(this.state.imageRotate) + 90;
        if (newRotation >= 360) {
            newRotation = -360;
        }
        this.setState({
            imageRotate: JSON.stringify(newRotation),
        })
    }

    render() {
        const {
            data, refreshing, cancelledData,
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
            tempRole,
            cardIndex
        } = this.state;
        return (
            this.state.data ?
                <View style={[Styles.flex1, {backgroundColor: '#f1f5f4'}]}>
                    <OfflineNotice/>
                    <Appbar.Header theme={theme} style={Styles.bgWhite}>
                        {/*<Appbar.BackAction onPress={() => this.props.navigation.goBack()}*/}
                        {/*/>*/}
                        <Appbar.Action onPress={() => {
                            this.props.navigation.openDrawer()
                        }} icon="menu"/>
                            <Appbar.Content title="My Trips" subtitle=""/>
                    </Appbar.Header>
                    {this.renderSpinner()}
                    {/*DATE CARD*/}
                    <View style={[Styles.m10]}>
                        <Card style={[styles.shadowCard]}>
                            <Card.Title theme={theme}
                                        style={[Styles.bgWhite]}
                                        title={this.getMonthFromString()}
                                        titleStyle={[Styles.f20, Styles.ffMbold]}
                                        rightStyle={[Styles.marH10]}
                                        right={() => <FontAwesome onPress={() => {
                                            this.setState({dateFilterModal: true, page: 1})
                                        }} name="calendar" size={30} color="#000"
                                        />}
                            />
                        </Card>
                    </View>

                    {/*CHIPS SECTION*/}
                    <View
                        style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', padding: 10}}>
                        {/* CHIPS SECTION */}
                        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}
                                    style={[Styles.row]}>
                            {this.state.chipsList.map((item,index) => {
                                return (
                                    <Chip key={index}
                                          style={[{
                                              backgroundColor: this.state.selectedChip === item.status ? '#db2b30' : '#afadaf',
                                              marginHorizontal: 5
                                          }]}
                                          textStyle={[Styles.ffLBold, Styles.cWhite]}
                                          onPress={() => {
                                              this.setState({selectedChip: item.status}, () => {
                                                      this.getAllTrips(item.status)
                                              })
                                          }}>{item.name}
                                    </Chip>
                                );
                            })}
                        </ScrollView>
                    </View>


                    <View style={[Styles.m10,Styles.flex1]}>
                        {
                            this.state.data
                                ?
                                this.state.data.length === 0
                                    ?
                                    <View style={[Styles.flex1,Styles.alignCenter]}>
                                        <Text style={[Styles.f20,Styles.colorBlue,Styles.ffMbold]}>No Trips found...</Text>
                                    </View>
                                    :
                                    <FlatList
                                        style={[Styles.flex1]}
                                        data={this.state.tabOne === true ? data : cancelledData}
                                        renderItem={({item}) => (this.tripsList(item))}
                                        keyExtractor={(item, index) => index.toString()}
                                        refreshing={refreshing}
                                        onRefresh={this.handleRefresh}
                                        onEndReached={this.handleLoadMore}
                                        onEndReachedThreshold={1}
                                        ListFooterComponent={this.renderFooter}
                                        contentContainerStyle={{marginBottom: 150}}
                                    />
                                :
                                <CSpinner/>

                        }

                    </View>



                    {/*MODALS START*/}

                    {/*SELECTED TRIP CARD DETAILS Modal*/}
                    <Modal
                        transparent={true}
                        animated={true}
                        animationType='slide'
                        visible={this.state.showTripDetailsModal}
                        onRequestClose={() => {
                            this.setState({showTripDetailsModal: false})
                        }}>
                        <View style={[Styles.modalfrontPosition]}>
                            <View style={[Styles.flex1, Styles.bgWhite, {
                                width: Dimensions.get('window').width,
                                height: Dimensions.get('window').height
                            }]}>
                                {this.state.spinnerBool === false ? null : <CLoader/>}
                                <View style={[Styles.flex1]}>
                                    {
                                        this.state.currentTripsDetails
                                        ?
                                            this.renderCard(this.state.currentTripsDetails,1)
                                            :
                                            null
                                    }
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
                            this.setState({editTripDetailsModal: false})
                        }}>
                        <View style={[Styles.modalfrontPosition]}>
                            <View>
                                <View style={[Styles.flex1]}/>
                                <View style={[Styles.bgWhite,{
                                    width: Dimensions.get('window').width,
                                    height: editModalHeight
                                }]}>
                                    {this.state.spinnerBool === false ? null : <CLoader/>}
                                    <View style={[Styles.flex1, Styles.bgWhite,{borderTopRightRadius:10,
                                        borderTopLeftRadius:10}]}>
                                        <View
                                            style={[Styles.row, Styles.jSpaceBet, Styles.bgWhite, Styles.padV10, Styles.brdrBtm1, {borderBottomColor: '#D1D1D1',
                                                borderTopRightRadius:10,
                                                borderTopLeftRadius:10}]}>
                                            <Text style={[Styles.ffRMedium, Styles.f16, Styles.aslCenter, Styles.padH20,Styles.cBlack87,Styles.padV8]}>View
                                                Trip Information</Text>
                                           <MaterialCommunityIcons name="window-close" size={32}
                                                                 color="#C91A1F" style={{marginRight: 10}}
                                                                 onPress={() => this.setState({editTripDetailsModal:false})}
                                            />
                                        </View>

                                        {
                                            selectedCardTripDetails
                                                ?
                                                <View
                                                    style={[Styles.row, Styles.jSpaceBet, Styles.bgWhite, {height:subEditHeightBy60}]}>

                                                    {/*TITLES CARDS*/}
                                                    <ScrollView
                                                        persistentScrollbar={true}
                                                        style={[Styles.bgWhite,Styles.flex1,Styles.brdrRt1]}>

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

                                                        {
                                                            selectedCardTripDetails.requireClientLoginId
                                                                ?
                                                                <View>
                                                                    <TouchableOpacity
                                                                        activeOpacity={0.7}
                                                                        onPress={() => {
                                                                            this.useSelectedDataReport(selectedCardTripDetails, 'CLIENT_LOGIN_ID')
                                                                            // this.getEnteredPhoneNumberProfiles(selectedCardTripDetails.clientLoginIdMobileNumber)
                                                                        }}
                                                                        style={[Styles.row, Styles.padV20,Styles.padH15, Styles.jSpaceBet,Styles.bgLightWhite,Styles.OrdersScreenCardshadow]}>
                                                                        <View/>
                                                                        <Text
                                                                            style={[editButton === 'CLIENT_LOGIN_ID' ? Styles.fWbold : null, Styles.ffRRegular,Styles.f14,Styles.cBlack68]}>Client Login Id</Text>
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
                                                                            style={[Styles.row, Styles.padV20,Styles.padH15, Styles.jSpaceBet,Styles.bgLightWhite,Styles.OrdersScreenCardshadow]}>
                                                                            <View/>
                                                                            <Text
                                                                                style={[editButton === 'EMPLOYEE_ID' ? Styles.fWbold : null, Styles.ffRRegular,Styles.f14,Styles.cBlack68]}>Employee ID</Text>
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
                                                                            // this.setState({editButton: 'TRIP_SHEET_ID'})
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

                                                        {/*PAYMENT DETAILS*/}
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
                                                                        style={[Styles.row, Styles.padV20,Styles.padH15, Styles.jSpaceBet,Styles.bgLightWhite,Styles.OrdersScreenCardshadow]}>
                                                                        <View/>
                                                                        <Text
                                                                            style={[editButton === 'PARTNER_DETAILS' ? Styles.fWbold : null, Styles.ffRRegular,Styles.f14,Styles.cBlack68]}>Partner</Text>
                                                                        <View style={[Styles.aslCenter, Styles.padH5]}>
                                                                            {Services.returnCardStatusIcon(partnerDetailsUpdated)}
                                                                            {/*<MaterialIcons name="info" size={22} color="black" />*/}
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

                                                        <View style={{marginVertical:40}}/>
                                                    </ScrollView>

                                                    {/*EDIT DETAILS VIEW*/}
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
                                                                            style={[Styles.ffRRegular, Styles.f14, Styles.pTop15,Styles.cGrey33]}>Entered by Fleet</Text>
                                                                        <View
                                                                            style={[Styles.aslCenter, Styles.bgLBlueWhite,Styles.mTop10,Styles.p10,  {
                                                                                width: subEditDetialsWidth
                                                                            }]}>
                                                                            <Text
                                                                                numberOfLines={4}
                                                                                // style={[Styles.ffRMedium, Styles.f16,Styles.cGrey4F]}>{clientUserIdDetailsUpdated ? this.state.finalClientUserID : selectedCardTripDetails.clientUserId}</Text>
                                                                                style={[Styles.ffRMedium, Styles.f16,Styles.cGrey4F]}>{selectedCardTripDetails.dataBeforeUpdate ? selectedCardTripDetails.dataBeforeUpdate.clientUserId : ''}</Text>
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
                                                                            editable={false}
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
                                                                            onPress={() => this.setState({editTripDetailsModal:false})}
                                                                            activeOpacity={0.7}
                                                                            style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth/4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                            <Text
                                                                                style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                    color: '#C91A1F'
                                                                                }, Styles.aslCenter, Styles.p5]}>Exit</Text>
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
                                                                                style={[Styles.ffRRegular, Styles.f14, Styles.pTop15,Styles.cGrey33]}>Entered by Fleet</Text>
                                                                            <View
                                                                                style={[Styles.aslCenter, Styles.bgLBlueWhite,Styles.mTop10,Styles.p10, {
                                                                                    width: subEditDetialsWidth,
                                                                                }]}>
                                                                                <Text
                                                                                    numberOfLines={4}
                                                                                    style={[Styles.ffRRegular, Styles.f18,Styles.cGrey4F]}>{selectedCardTripDetails.dataBeforeUpdate ? selectedCardTripDetails.dataBeforeUpdate.tripSheetId : ''}</Text>
                                                                            </View>

                                                                            <Text
                                                                                style={[Styles.ffRRegular, Styles.f14, Styles.pTop15,Styles.cGrey33]}>Update Trip Sheet ID</Text>
                                                                            <TextInput
                                                                                style={[Styles.aitStart, Styles.bw1, Styles.bcLightBlue, Styles.mTop10,Styles.cGrey33, {
                                                                                    width: subEditDetialsWidth,
                                                                                    // fontWeight: 'bold',
                                                                                    fontSize: 16,
                                                                                    padding:10
                                                                                }]}
                                                                                selectionColor={"black"}
                                                                                editable={false}
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
                                                                                onPress={() => this.setState({editTripDetailsModal:false})}
                                                                                activeOpacity={0.7}
                                                                                style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth/4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                                <Text
                                                                                    style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                        color: '#C91A1F'
                                                                                    }, Styles.aslCenter, Styles.p5]}>Exit</Text>
                                                                            </TouchableOpacity>
                                                                        </View>
                                                                    </ScrollView>
                                                                    :
                                                                    editButton === 'KILOMETER'
                                                                        ?
                                                                        <View
                                                                            style={[Styles.flex1,Styles.p15]}>
                                                                            <Text
                                                                                style={[Styles.ffRLight, Styles.f18,Styles.cBlack87]}>Kilometer</Text>
                                                                            <Text
                                                                                style={[Styles.ffRRegular, Styles.f14, Styles.mTop5,Styles.cGrey33]}>Total
                                                                                Distance</Text>
                                                                            <View
                                                                                style={[Styles.aslCenter, Styles.bgLBlueWhite, Styles.p10, Styles.mTop5, {
                                                                                    width: subEditDetialsWidth,
                                                                                }]}>
                                                                                {/*<Text style={[Styles.ffRMedium, Styles.f18,Styles.cGrey4F]}>{this.state.finalKmDifference}</Text>*/}
                                                                                <Text style={[Styles.ffRMedium, Styles.f18,Styles.cGrey4F]}>{
                                                                                    this.state.tempEndingKm && this.state.tempStartingKM
                                                                                        ?
                                                                                        this.state.tempEndingKm >= this.state.tempStartingKM
                                                                                            ?
                                                                                            JSON.parse(this.state.tempEndingKm)-JSON.parse(this.state.tempStartingKM) : '' : ''
                                                                                }</Text>
                                                                            </View>
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
                                                                                                        width: windowWidth/2,
                                                                                                        height: 98
                                                                                                    }, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                                                                    source={selectedCardTripDetails.startOdometerReadingUploadUrl ? {uri: selectedCardTripDetails.startOdometerReadingUploadUrl} : null}
                                                                                                />
                                                                                                {/*<MaterialCommunityIcons name="resize"  size={24} color="black"/>*/}

                                                                                            </TouchableOpacity>
                                                                                            {
                                                                                                selectedCardTripDetails.startOdometerReadingUploadUrl
                                                                                                    ?
                                                                                                    <MaterialIcons name="zoom-in" size={28} color="#000"  style={[Styles.ZoomIconPosition]} />
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
                                                                                        style={[Styles.aitStart, Styles.bw1, Styles.bcLightAsh, Styles.mTop10,Styles.cGrey33,Styles.ffRMedium,
                                                                                            {
                                                                                                width: windowWidth/2,
                                                                                                // fontWeight: 'bold',
                                                                                                fontSize: 16,
                                                                                                padding:10
                                                                                            }]}
                                                                                        selectionColor={"black"}
                                                                                        maxLength={6}
                                                                                        editable={false}
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
                                                                                                        width: windowWidth/2,
                                                                                                        height: 98
                                                                                                    }, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                                                                    source={selectedCardTripDetails.endOdometerReadingUploadUrl ? {uri: selectedCardTripDetails.endOdometerReadingUploadUrl} : null}
                                                                                                />
                                                                                            </TouchableOpacity>
                                                                                            {
                                                                                                selectedCardTripDetails.endOdometerReadingUploadUrl
                                                                                                    ?
                                                                                                    <MaterialIcons name="zoom-in" size={28} color="#000"  style={[Styles.ZoomIconPosition]} />
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
                                                                                        style={[Styles.aitStart, Styles.bw1, Styles.bcLightAsh, Styles.mTop10,Styles.ffRMedium,Styles.cGrey33, {
                                                                                            // width: 80,
                                                                                            width:windowWidth/2,
                                                                                            // fontWeight: 'bold',
                                                                                            fontSize: 16,
                                                                                            padding:10
                                                                                        }]}
                                                                                        selectionColor={"black"}
                                                                                        editable={false}
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
                                                                                    onPress={() => this.setState({editTripDetailsModal:false})}
                                                                                    activeOpacity={0.7}
                                                                                    style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth/4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                                    <Text
                                                                                        style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                            color: '#C91A1F'
                                                                                        }, Styles.aslCenter, Styles.p5]}>Exit</Text>
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
                                                                                                    style={[Styles.row, Styles.jSpaceBet,]}>
                                                                                                    <TouchableOpacity
                                                                                                        style={[Styles.aslCenter]}
                                                                                                        disabled={true}
                                                                                                        onPress={() => this.deliveredPackageValidation(tempDeliveredPackages[index].count, 'Decrement', 'deliveredPackages', index)}
                                                                                                    >
                                                                                                        <Text
                                                                                                            style={[Styles.ffRRegular, Styles.bw1, Styles.bgBlk, Styles.padH15, Styles.padV10, Styles.cWhite, Styles.f20]}
                                                                                                        >-</Text></TouchableOpacity>
                                                                                                    <View>
                                                                                                        <TextInput
                                                                                                            style={[Styles.txtAlignCen, Styles.bw1, Styles.bcAsh,Styles.ffRMedium,Styles.cGrey33, {
                                                                                                                // width: 80,
                                                                                                                width: windowWidth/6,
                                                                                                                // fontWeight: 'bold',
                                                                                                                fontSize: 16
                                                                                                            }]}
                                                                                                            selectionColor={"black"}
                                                                                                            editable={false}
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
                                                                                                        disabled={true}
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
                                                                                        onPress={() => this.setState({editTripDetailsModal:false})}
                                                                                        activeOpacity={0.7}
                                                                                        style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth/4.4}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                                        <Text
                                                                                            style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                                color: '#C91A1F'
                                                                                            }, Styles.aslCenter, Styles.p5]}>Exit</Text>
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
                                                                                        <View style={[Styles.row ,Styles.mTop5, Styles.bw1, Styles.bcAsh,{width: subEditDetialsWidth-20,}]}>
                                                                                            <Text
                                                                                                style={[Styles.f36, Styles.cOrangered, Styles.fWbold, Styles.ffRRegular, Styles.aslEnd,Styles.padH2]}>&#x20B9;</Text>

                                                                                            <TextInput
                                                                                                style={[Styles.aitStart,Styles.cGrey33,Styles.ffRMedium, {
                                                                                                    // width: 80,
                                                                                                    width: subEditDetialsWidth-40,
                                                                                                    // fontWeight: 'bold',
                                                                                                    fontSize: 16,
                                                                                                    padding: 10
                                                                                                }]}
                                                                                                placeholder={'Type here'}
                                                                                                selectionColor={"black"}
                                                                                                keyboardType='numeric'
                                                                                                editable={false}
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
                                                                                            onPress={() => this.setState({editTripDetailsModal:false})}
                                                                                            activeOpacity={0.7}
                                                                                            style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth/4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                                            <Text
                                                                                                style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                                    color: '#C91A1F'
                                                                                                }, Styles.aslCenter, Styles.p5]}>Exit</Text>
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
                                                                                            <View style={[Styles.row ,Styles.mTop5,Styles.bw1, Styles.bcAsh,{width: subEditDetialsWidth-20,}]}>
                                                                                                <Text
                                                                                                    style={[Styles.f36, Styles.cOrangered, Styles.fWbold, Styles.ffRRegular, Styles.aslEnd, Styles.padH2]}>&#x20B9;</Text>

                                                                                                <TextInput
                                                                                                    style={[Styles.aitStart,Styles.cGrey33,Styles.ffRMedium, {
                                                                                                        // width: 80,
                                                                                                        width: subEditDetialsWidth-40,
                                                                                                        // fontWeight: 'bold',
                                                                                                        fontSize: 16,
                                                                                                        padding: 10
                                                                                                    }]}
                                                                                                    placeholder={'Type here'}
                                                                                                    selectionColor={"black"}
                                                                                                    maxLength={4}
                                                                                                    keyboardType='numeric'
                                                                                                    editable={false}
                                                                                                    returnKeyType="done"
                                                                                                    onSubmitEditing={() => {Keyboard.dismiss()}}
                                                                                                    onChangeText={(penalty) => this.setState({penalty})}
                                                                                                    value={this.state.penalty}
                                                                                                />
                                                                                            </View>

                                                                                            <Text
                                                                                                style={[Styles.ffRRegular, Styles.f18,Styles.cGrey33,Styles.mTop10]}>Reason for penalty</Text>
                                                                                            {/*<TextInput*/}
                                                                                            {/*    style={[Styles.aitStart, Styles.bw1, Styles.bcAsh, Styles.mTop5,Styles.cGrey33,Styles.ffRMedium, {*/}
                                                                                            {/*        // width: 80,*/}
                                                                                            {/*        width: subEditDetialsWidth-20,*/}
                                                                                            {/*        // fontWeight: 'bold',*/}
                                                                                            {/*        fontSize: 16,*/}
                                                                                            {/*        padding: 10*/}
                                                                                            {/*    }]}*/}
                                                                                            {/*    placeholder={'Type here'}*/}
                                                                                            {/*    selectionColor={"black"}*/}
                                                                                            {/*    editable={false}*/}
                                                                                            {/*    multiline={true}*/}
                                                                                            {/*    returnKeyType="done"*/}
                                                                                            {/*    onSubmitEditing={() => {Keyboard.dismiss()}}*/}
                                                                                            {/*    onChangeText={(penaltyReason) => this.setState({penaltyReason})}*/}
                                                                                            {/*    value={this.state.penaltyReason}*/}
                                                                                            {/*/>*/}

                                                                                            <View style={[Styles.mTop5]}>
                                                                                                <RadioButton.Group
                                                                                                    // onValueChange={penaltyReason => this.setState({penaltyReason})}
                                                                                                    value={true}>
                                                                                                    {
                                                                                                        this.state.penaltyReasons
                                                                                                            ?
                                                                                                            <FlatList
                                                                                                                data={this.state.penaltyReasons}
                                                                                                                renderItem={({item, index}) =>
                                                                                                                    <View key={index} style={[Styles.row, Styles.aslStart]}>
                                                                                                                        <RadioButton disabled={true} value={true} color={'red'} />
                                                                                                                        <Text
                                                                                                                            style={[Styles.ffRMedium, Styles.cGrey33, Styles.aslCenter, Styles.f14,Styles.flexWrap]}>{item}</Text>
                                                                                                                    </View>
                                                                                                                }
                                                                                                                keyExtractor={(item, index) => index.toString()}
                                                                                                            />
                                                                                                            :
                                                                                                            null
                                                                                                    }

                                                                                                </RadioButton.Group>
                                                                                            </View>

                                                                                        </ScrollView>
                                                                                        <View
                                                                                            style={[Styles.jSpaceBet, Styles.row]}>
                                                                                            <TouchableOpacity
                                                                                                onPress={() => this.setState({editTripDetailsModal:false})}
                                                                                                activeOpacity={0.7}
                                                                                                style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth/4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite,
                                                                                                    Styles.OrdersScreenCardshadow]}>
                                                                                                <Text
                                                                                                    style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                                        color: '#C91A1F'
                                                                                                    }, Styles.aslCenter, Styles.p5]}>Exit</Text>
                                                                                            </TouchableOpacity>
                                                                                        </View>
                                                                                    </ScrollView>
                                                                                    :
                                                                                    editButton === 'EMPLOYEE_ID'
                                                                                        ?
                                                                                        <ScrollView style={[Styles.flex1,Styles.p15, ]}>
                                                                                            <Text style={[Styles.ffRLight, Styles.f18,Styles.cBlack87]}>Employee ID</Text>
                                                                                            <ScrollView
                                                                                                style={[{height: subEditHeightBy60-100}]}>
                                                                                                <Text
                                                                                                    style={[Styles.ffRRegular, Styles.f14, Styles.pTop15,Styles.cGrey33]}>Entered by Fleet</Text>
                                                                                                <View
                                                                                                    style={[Styles.aslCenter, Styles.bgLBlueWhite,Styles.mTop10,Styles.p10,  {
                                                                                                        width: subEditDetialsWidth
                                                                                                    }]}>
                                                                                                    <Text
                                                                                                        numberOfLines={4}
                                                                                                        style={[Styles.ffRMedium, Styles.f16,Styles.cGrey4F]}>{selectedCardTripDetails.dataBeforeUpdate ? selectedCardTripDetails.dataBeforeUpdate.clientEmployeeId : ''}</Text>
                                                                                                </View>

                                                                                                <Text
                                                                                                    style={[Styles.ffRRegular, Styles.f14, Styles.pTop15,Styles.cGrey33]}>Update Employee ID</Text>

                                                                                                <TextInput
                                                                                                    style={[Styles.aslCenter, Styles.bw1, Styles.bcLightBlue, Styles.mTop10,Styles.cGrey33,Styles.ffRMedium, {
                                                                                                        width: subEditDetialsWidth,
                                                                                                        fontSize: 16,
                                                                                                        padding: 10
                                                                                                    }]}
                                                                                                    selectionColor={"black"}
                                                                                                    editable={false}
                                                                                                    multiline={true}
                                                                                                    returnKeyType="done"
                                                                                                    onSubmitEditing={() => {Keyboard.dismiss()}}
                                                                                                    onChangeText={(tempEmployeeId) => this.setState({tempEmployeeId})}
                                                                                                    value={this.state.tempEmployeeId}
                                                                                                />
                                                                                            </ScrollView>
                                                                                            <View
                                                                                                style={[Styles.jSpaceBet, Styles.row,Styles.mBtm10]}>
                                                                                                <TouchableOpacity
                                                                                                    onPress={() => this.setState({editTripDetailsModal:false})}
                                                                                                    activeOpacity={0.7}
                                                                                                    style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth/4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                                                    <Text
                                                                                                        style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                                            color: '#C91A1F'
                                                                                                        }, Styles.aslCenter, Styles.p5]}>Exit</Text>
                                                                                                </TouchableOpacity>
                                                                                            </View>
                                                                                        </ScrollView>
                                                                                        :
                                                                                        editButton === 'LITE_USER_PAYMENT_DETAILS'
                                                                                            ?
                                                                                            <ScrollView
                                                                                                style={[Styles.flex1,Styles.p15, ]}>
                                                                                                <Text style={[Styles.ffRLight, Styles.f18,Styles.cBlack87]}>Payment Details</Text>
                                                                                                <ScrollView
                                                                                                    persistentScrollbar={true}
                                                                                                    style={[{height: subEditHeightBy60-100}]}>

                                                                                                    <Text
                                                                                                        style={[Styles.ffRRegular, Styles.f14, Styles.pTop15,Styles.cGrey33]}>Payment Mode</Text>
                                                                                                    <RadioButton.Group
                                                                                                        onValueChange={liteUserPaymentType => this.setState({liteUserPaymentType})}
                                                                                                        value={this.state.liteUserPaymentType}>
                                                                                                        <View style={[Styles.row, Styles.aslStart,]}>
                                                                                                            <View style={[Styles.row, Styles.alignCenter]}>
                                                                                                                <RadioButton value={'Now'}/>
                                                                                                                <Text
                                                                                                                    style={[Styles.ffRMedium, Styles.cGrey33, Styles.aslCenter, Styles.f16]}>Now (Cash)</Text>
                                                                                                            </View>
                                                                                                            <View style={[Styles.row, Styles.alignCenter]}>
                                                                                                                <RadioButton value={'Later'}/>
                                                                                                                <Text
                                                                                                                    style={[Styles.ffRMedium, Styles.cGrey33, Styles.aslCenter, Styles.f16]}>Later</Text>
                                                                                                            </View>
                                                                                                        </View>
                                                                                                    </RadioButton.Group>

                                                                                                    <Text
                                                                                                        style={[Styles.ffRRegular, Styles.f14, Styles.pTop15,Styles.cGrey33]}>Amount</Text>
                                                                                                    <TextInput
                                                                                                        style={[Styles.aslCenter, Styles.bw1, Styles.bcLightBlue, Styles.mTop10,Styles.cGrey33,Styles.ffRMedium, {
                                                                                                            width: subEditDetialsWidth,
                                                                                                            fontSize: 16,
                                                                                                            padding: 10
                                                                                                        }]}
                                                                                                        selectionColor={"black"}
                                                                                                        editable={false}
                                                                                                        keyboardType='numeric'
                                                                                                        returnKeyType="done"
                                                                                                        onSubmitEditing={() => {Keyboard.dismiss()}}
                                                                                                        onChangeText={(liteUserAmount) => this.setState({liteUserAmount})}
                                                                                                        value={this.state.liteUserAmount}
                                                                                                    />

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
                                                                                                                    editable={false}
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
                                                                                                                    No</Text>
                                                                                                                <TextInput
                                                                                                                    style={[Styles.aslCenter, Styles.bw1, Styles.bcLightBlue, Styles.mTop10, Styles.cGrey33, Styles.ffRMedium, {
                                                                                                                        width: subEditDetialsWidth,
                                                                                                                        fontSize: 16,
                                                                                                                        padding: 10
                                                                                                                    }]}
                                                                                                                    selectionColor={"black"}
                                                                                                                    multiline={true}
                                                                                                                    editable={false}
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
                                                                                                                    multiline={true}
                                                                                                                    editable={false}
                                                                                                                    returnKeyType="done"
                                                                                                                    onSubmitEditing={() => {
                                                                                                                        Keyboard.dismiss()
                                                                                                                    }}
                                                                                                                    onChangeText={(liteUserBenIFSC) => this.setState({liteUserBenIFSC})}
                                                                                                                    value={this.state.liteUserBenIFSC}
                                                                                                                />

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
                                                                                                                    multiline={true}
                                                                                                                    editable={false}
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
                                                                                                <View
                                                                                                    style={[Styles.jSpaceBet, Styles.row,Styles.mBtm10]}>
                                                                                                    <TouchableOpacity
                                                                                                        onPress={() => this.setState({editTripDetailsModal:false})}
                                                                                                        activeOpacity={0.7}
                                                                                                        style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth/4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                                                        <Text
                                                                                                            style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                                                color: '#C91A1F'
                                                                                                            }, Styles.aslCenter, Styles.p5]}>Exit</Text>
                                                                                                    </TouchableOpacity>
                                                                                                </View>
                                                                                            </ScrollView>
                                                                                            :
                                                                                            editButton === 'PARTNER_DETAILS'
                                                                                                ?
                                                                                                <ScrollView style={[Styles.flex1,Styles.p15, ]}>
                                                                                                    <Text style={[Styles.ffRLight, Styles.f18,Styles.cBlack87]}>Partner Details</Text>
                                                                                                    <ScrollView
                                                                                                        style={[{height: subEditHeightBy60-100}]}>
                                                                                                        <Text
                                                                                                            style={[Styles.ffRRegular, Styles.f14, Styles.pTop15,Styles.cGrey33]}>Entered by Fleet</Text>
                                                                                                        <View
                                                                                                            style={[Styles.aslCenter, Styles.bgLBlueWhite,Styles.mTop10,Styles.p10,  {
                                                                                                                width: subEditDetialsWidth
                                                                                                            }]}>
                                                                                                            <Text
                                                                                                                numberOfLines={4}
                                                                                                                style={[Styles.ffRMedium, Styles.f16,Styles.cGrey4F]}>{selectedCardTripDetails.dataBeforeUpdate ? selectedCardTripDetails.dataBeforeUpdate.partnerDetails : ''}</Text>
                                                                                                        </View>

                                                                                                        <Text
                                                                                                            style={[Styles.ffRRegular, Styles.f14, Styles.pTop15,Styles.cGrey33]}>Update Employee ID</Text>

                                                                                                        <TextInput
                                                                                                            style={[Styles.aslCenter, Styles.bw1, Styles.bcLightBlue, Styles.mTop10,Styles.cGrey33,Styles.ffRMedium, {
                                                                                                                width: subEditDetialsWidth,
                                                                                                                fontSize: 16,
                                                                                                                padding: 10
                                                                                                            }]}
                                                                                                            selectionColor={"black"}
                                                                                                            editable={false}
                                                                                                            multiline={true}
                                                                                                            returnKeyType="done"
                                                                                                            onSubmitEditing={() => {Keyboard.dismiss()}}
                                                                                                            onChangeText={(tempPartnerDetails) => this.setState({tempPartnerDetails})}
                                                                                                            value={this.state.tempPartnerDetails}
                                                                                                        />
                                                                                                    </ScrollView>
                                                                                                    <View
                                                                                                        style={[Styles.jSpaceBet, Styles.row,Styles.mBtm10]}>
                                                                                                        <TouchableOpacity
                                                                                                            onPress={() => this.setState({editTripDetailsModal:false})}
                                                                                                            activeOpacity={0.7}
                                                                                                            style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth/4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                                                            <Text
                                                                                                                style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                                                    color: '#C91A1F'
                                                                                                                }, Styles.aslCenter, Styles.p5]}>Exit</Text>
                                                                                                        </TouchableOpacity>
                                                                                                    </View>
                                                                                                </ScrollView>
                                                                                                :
                                                                                                editButton === 'CLIENT_LOGIN_ID'
                                                                                                    ?
                                                                                                    <ScrollView style={[Styles.flex1,Styles.padV15,Styles.padH5, ]}>
                                                                                                        <Text style={[Styles.ffRLight, Styles.f18,Styles.cBlack87]}>Client Login Id</Text>
                                                                                                        <ScrollView
                                                                                                            style={[{height: subEditHeightBy60-100}]}>
                                                                                                            <Text
                                                                                                                style={[Styles.ffRRegular, Styles.f14,Styles.cGrey33,Styles.pTop15]}>Entered by Fleet</Text>
                                                                                                            <View
                                                                                                                style={[Styles.aslCenter, Styles.bgLBlueWhite,Styles.mTop10, {
                                                                                                                    width: windowWidth/1.8
                                                                                                                }]}>
                                                                                                                {/*<Text*/}
                                                                                                                {/*    numberOfLines={4}*/}
                                                                                                                {/*    style={[Styles.ffRMedium, Styles.f16,Styles.cGrey4F]}>{selectedCardTripDetails.dataBeforeUpdate ? this.state.tempSearchPhoneNumber : ''}</Text>*/}
                                                                                                                <View>
                                                                                                                    {/*{Services.returnUserProfileCardTripVerification(this.state.tempPhoneNumberSearchData,selectedCardTripDetails.clientLoginIdMobileNumber)}*/}
                                                                                                                    <Card
                                                                                                                        style={[
                                                                                                                            Styles.OrdersScreenCardshadow,Styles.bgLBlueWhite,Styles.br0,Styles.p5]}>
                                                                                                                        <Card.Title
                                                                                                                            left={() =>
                                                                                                                                <View>
                                                                                                                                    {Services.getUserProfilePic(selectedCardTripDetails.attrs.clientLoginIdPhoto)}
                                                                                                                                </View>}
                                                                                                                            title={<Text style={[Styles.f14,Styles.ffLBold]}>{_.startCase(_.toLower(selectedCardTripDetails.attrs.clientLoginIdName))}</Text>}
                                                                                                                            titleStyle={[Styles.ffLBold, Styles.f14,Styles.colorBlue]}
                                                                                                                            subtitleStyle={[Styles.ffLRegular]}
                                                                                                                            subtitle={
                                                                                                                                <Text style={[Styles.f12,Styles.ffLBold, Styles.colorBlue]}>{selectedCardTripDetails.attrs.clientLoginIdStatus} ({selectedCardTripDetails.dataBeforeUpdate ? selectedCardTripDetails.dataBeforeUpdate.clientLoginIdMobileNumber : '--'})</Text>
                                                                                                                            }
                                                                                                                        >
                                                                                                                        </Card.Title>
                                                                                                                    </Card>
                                                                                                                </View>
                                                                                                            </View>

                                                                                                            <Text style={[Styles.ffRRegular, Styles.f14, Styles.pTop15,Styles.cGrey33]}>Update Client Login Id</Text>

                                                                                                            <View style={[{width: windowWidth/1.8 }]}>

                                                                                                                <TextInput
                                                                                                                    style={[Styles.bgWhite, Styles.mTop10, Styles.bw1,Styles.cBlk]}
                                                                                                                    isFocused="false"
                                                                                                                    placeholder="Search by phone number"
                                                                                                                    editable={false}
                                                                                                                    maxLength={10}
                                                                                                                    keyboardType={'numeric'}
                                                                                                                    returnKeyType="done"
                                                                                                                    onSubmitEditing={() => {Keyboard.dismiss()}}
                                                                                                                    onChangeText={tempSearchPhoneNumber => {
                                                                                                                        this.setState({tempSearchPhoneNumber}, () => {
                                                                                                                            if (tempSearchPhoneNumber.length === 10) {
                                                                                                                                this.getEnteredPhoneNumberProfiles(this.state.tempSearchPhoneNumber)
                                                                                                                            }else {
                                                                                                                                this.setState({phoneNumberSearchData:[]})
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
                                                                                                                            <View style={[Styles.mTop10]}>
                                                                                                                                {Services.returnUserProfileCardTripVerification(this.state.phoneNumberSearchData,this.state.tempSearchPhoneNumber)}
                                                                                                                            </View>
                                                                                                                            :
                                                                                                                            this.state.phoneNumberSearchData.existedUser === false
                                                                                                                                ?
                                                                                                                                <View>
                                                                                                                                    <Text style={[Styles.f14,Styles.ffRBold,Styles.cRed,Styles.padV5,Styles.aslStart]}>Please enter the registered phone number</Text>
                                                                                                                                    <Text style={[Styles.f14,Styles.ffRBold,Styles.cRed,Styles.padV5,Styles.aslStart]}>User not in the system</Text>
                                                                                                                                </View>
                                                                                                                                :
                                                                                                                                null
                                                                                                                        :
                                                                                                                        null
                                                                                                                }
                                                                                                            </View>

                                                                                                        </ScrollView>
                                                                                                        <View
                                                                                                            style={[Styles.jSpaceBet, Styles.row,Styles.mBtm10]}>
                                                                                                            <View
                                                                                                                style={[Styles.jSpaceBet, Styles.row,Styles.mBtm10]}>
                                                                                                                <TouchableOpacity
                                                                                                                    onPress={() => this.setState({editTripDetailsModal:false})}
                                                                                                                    activeOpacity={0.7}
                                                                                                                    style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth/4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                                                                    <Text
                                                                                                                        style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                                                            color: '#C91A1F'
                                                                                                                        }, Styles.aslCenter, Styles.p5]}>Exit</Text>
                                                                                                                </TouchableOpacity>
                                                                                                            </View>

                                                                                                        </View>
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
                                                                                                                <Text
                                                                                                                    style={[Styles.ffRRegular, Styles.f14, Styles.pTop15, Styles.cGrey33]}>Entered
                                                                                                                    by Fleet</Text>
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
                                                                                                                        disabled={true}
                                                                                                                        style={[Styles.aslCenter, Styles.bw1, Styles.bcLightBlue, Styles.mTop10, {
                                                                                                                            width: subEditDetialsWidth,
                                                                                                                            padding: 10
                                                                                                                        }]}
                                                                                                                        activeOpacity={0.7}
                                                                                                                        onPress={() => {
                                                                                                                            // this.setState({paymentPlanSelectionModal: true})
                                                                                                                            this.getPaymentPlansList(selectedCardTripDetails.siteId)
                                                                                                                        }}>
                                                                                                                        <Text style={[  Styles.cGrey33, Styles.ffRMedium,Styles.f16,Styles.pRight20,Styles.padV3]}>{this.state.tempPlanName}</Text>
                                                                                                                    </TouchableOpacity>
                                                                                                                </View>

                                                                                                                <View
                                                                                                                    style={[Styles.row, Styles.mTop10]}>
                                                                                                                    <Checkbox
                                                                                                                        style={[Styles.aslCenter]}
                                                                                                                        color={'red'}
                                                                                                                        size={25}
                                                                                                                        // onPress={() => {
                                                                                                                        //     this.setState({tempUpdatePlanInProfile: !this.state.tempUpdatePlanInProfile})
                                                                                                                        // }}
                                                                                                                        status={this.state.tempUpdatePlanInProfile ? 'checked' : 'unchecked'}
                                                                                                                    />
                                                                                                                    <Text
                                                                                                                        numberOfLines={2}
                                                                                                                        style={[Styles.f16, Styles.ffRMedium, Styles.aslCenter, Styles.cBlack87,{width: subEditDetialsWidth-30}]}>Update Plan in Profile</Text>
                                                                                                                </View>
                                                                                                            </ScrollView>
                                                                                                            <View
                                                                                                                style={[Styles.jSpaceBet, Styles.row, Styles.mBtm10]}>
                                                                                                                <TouchableOpacity
                                                                                                                    onPress={() => this.setState({editTripDetailsModal:false})}
                                                                                                                    activeOpacity={0.7}
                                                                                                                    style={[Styles.aslCenter, Styles.bgWhite, Styles.br5, {width: windowWidth/4.3}, Styles.padV5, Styles.bw1, Styles.bcLightWhite, Styles.OrdersScreenCardshadow]}>
                                                                                                                    <Text
                                                                                                                        style={[Styles.f16, Styles.ffRuBold, Styles.fWbold, {
                                                                                                                            color: '#C91A1F'
                                                                                                                        }, Styles.aslCenter, Styles.p5]}>Exit</Text>
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
                            <TouchableOpacity onPress={() => {
                                this.setState({rejectTripModal: false})
                            }} style={[Styles.modalbgPosition]}>
                            </TouchableOpacity>
                            {this.state.spinnerBool === false ? null : <CLoader/>}
                            <View style={[ {
                                width: Dimensions.get('window').width - 60,
                                height: Dimensions.get('window').height / 2
                            }]}>
                                <ScrollView
                                    persistentScrollbar={true}
                                    style={[Styles.flex1, Styles.padH20, Styles.padV15,Styles.bgLightWhite]}>
                                    <View style={[Styles.mBtm10]} >
                                        <Text style={[Styles.ffRMedium, Styles.f16,{left:10},Styles.cBlack87]}>Reason for Rejecting</Text>
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
                                                            status={'checked'}
                                                        />
                                                        <Text
                                                            style={[Styles.f16, Styles.ffRMedium, Styles.aslCenter, Styles.marH5, Styles.cBlack87]}>{item}</Text>
                                                    </View>
                                                }
                                                keyExtractor={(item, index) => index.toString()}
                                                contentContainerStyle={{paddingBottom: 50}}
                                            />
                                            :
                                            null
                                    }
                                </ScrollView>
                            </View>
                        </View>
                    </Modal>

                    {/*MODAL FOR date filter*/}
                    <Modal
                        transparent={true}
                        animated={true}
                        animationType='slide'
                        visible={this.state.dateFilterModal}
                        onRequestClose={() => {
                            this.setState({dateFilterModal: false})
                        }}>
                        <View style={[Styles.modalfrontPosition]}>
                            <TouchableOpacity onPress={() => {
                                this.setState({dateFilterModal: false})
                            }} style={[Styles.modalbgPosition]}>
                            </TouchableOpacity>
                            <View
                                style={[Styles.bw1, Styles.bgWhite, Styles.aslCenter, Styles.p10, Styles.br15, {width: Dimensions.get('window').width - 100}]}>
                                <MonthSelectorCalendar
                                    // selectedDate={this.state.month}
                                    onMonthTapped={(date) => {
                                        // console.log(date)
                                        const month = new Date(date).getMonth();
                                        const year = new Date(date).getFullYear();
                                        this.setState({month: month, year: year, dateFilterModal: false}, function () {
                                            this.getAllTrips();})
                                    }}
                                />
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

                    {/*modal to show summary*/}
                    <Modal
                        transparent={true}
                        visible={this.state.showPackagesListModal}
                        onRequestClose={() => {
                            this.setState({showPackagesListModal: false, showPackages: false})
                        }}>
                        <View style={[Styles.modalfrontPosition]}>
                            <TouchableOpacity onPress={() => {
                                this.setState({showPackagesListModal: false, showPackages: false})
                            }} style={[Styles.modalbgPosition]}>
                            </TouchableOpacity>
                            <View style={[Styles.bgWhite, {
                                width: Dimensions.get('window').width - 30,
                                height: Dimensions.get('window').height - (this.state.showPackages === true ? 100 : 200),
                            }]}>
                                {
                                    this.state.deliveriesData
                                        ?
                                        <View style={{margin: 5}}>
                                            <View style={{padding: 10}}>
                                                <View style={[Styles.row, Styles.jSpaceBet, {fontSize: 20}]}>
                                                    <Text style={{
                                                        fontSize: 20,
                                                        fontFamily: 'Muli-Bold',
                                                        color: '#000'
                                                    }}>Summary</Text>
                                                    <Text style={{fontSize: 18, fontFamily: 'Muli-Light'}}>
                                                        {new Date(this.state.deliveriesData.shiftDate).toDateString()}
                                                    </Text>
                                                </View>
                                                <View style={[Styles.row, Styles.jSpaceBet]}>
                                                    <Text style={{
                                                        fontFamily: 'Muli-Regular',
                                                        fontSize: 16,
                                                        paddingBottom: 10,
                                                        marginTop: 10
                                                    }}>
                                                        Reported at <Text style={{fontFamily: 'Muli-Bold'}}>
                                                        {this.state.deliveriesData.attrs.siteName}
                                                        ({this.state.deliveriesData.attrs.clientName}) {'\n'}
                                                        {this.state.deliveriesData.clientUserIdInfo === null
                                                            ? null
                                                            : this.state.deliveriesData.clientUserIdInfo.clientUserId}</Text>
                                                    </Text>

                                                </View>
                                            </View>

                                            <ScrollView
                                                style={{height: Dimensions.get('window').height / (this.state.showPackages === true ? 1.6 : 1.9)}}>
                                                <Card theme={theme}
                                                      style={[Styles.marH10, {marginTop: 1, borderRadius: 0}]}>
                                                    <Card.Content
                                                        style={[Styles.row, Styles.jSpaceBet, {fontSize: 18}]}>
                                                        <Title style={{fontSize: 18}}>Duration</Title>
                                                        <Title></Title>
                                                        <Title style={{
                                                            fontFamily: 'Muli-Bold',
                                                            fontSize: 18
                                                        }}>{this.state.deliveriesData.durationStr || '--:--'}({(this.state.deliveriesData.expectedDuration) / 60}h)</Title>
                                                    </Card.Content>
                                                </Card>
                                                <View
                                                    style={[Styles.row, Styles.marH10, Styles.alignCenter]}>
                                                    <Card theme={theme}
                                                          style={[Styles.flex1, Styles.alignCenter, {
                                                              borderRadius: 0,
                                                              marginVertical: 1,
                                                              marginRight: 1,
                                                              padding: 5
                                                          }]}>
                                                        <Text
                                                            style={[Styles.f16, Styles.cBlk, Styles.ffMregular]}>{this.ShiftTimings(this.state.deliveriesData.reportingTime)}({this.state.deliveriesData.startTime.hours <= 9
                                                            ? "0" + this.state.deliveriesData.startTime.hours : this.state.deliveriesData.startTime.hours}:{this.state.deliveriesData.startTime.minutes <= 9
                                                            ? "0" + this.state.deliveriesData.startTime.minutes : this.state.deliveriesData.startTime.minutes})
                                                        </Text>
                                                    </Card>
                                                    <Card theme={theme} style={[Styles.flex1, Styles.alignCenter, {
                                                        borderRadius: 0,
                                                        marginVertical: 1,
                                                        padding: 5
                                                    }]}>
                                                        <Text
                                                            style={[Styles.f16, Styles.cBlk, Styles.ffMregular]}>{this.ShiftTimings(this.state.deliveriesData.actualEndTime)}({this.state.deliveriesData.endTime.hours <= 9
                                                            ? "0" + this.state.deliveriesData.endTime.hours : this.state.deliveriesData.endTime.hours}:{this.state.deliveriesData.endTime.minutes <= 9
                                                            ? "0" + this.state.deliveriesData.endTime.minutes : this.state.deliveriesData.endTime.minutes})
                                                        </Text>
                                                    </Card>

                                                </View>
                                                {
                                                    //Ododmeter reading for everyone, Except Assocaite and Labour
                                                    this.state.deliveriesData.userRole === 1 || this.state.deliveriesData.userRole >= 15
                                                        ?
                                                        null
                                                        :
                                                        <View style={{marginTop: 5, marginBottom: 5}}>
                                                            <Card theme={theme}
                                                                  style={[Styles.marH10, {
                                                                      marginTop: 5,
                                                                      borderRadius: 0
                                                                  }]}>
                                                                <Card.Content
                                                                    style={[Styles.row, Styles.jSpaceBet, {fontSize: 18}]}>
                                                                    <Title style={{fontSize: 18}}>Trip</Title>
                                                                    <Title></Title>
                                                                    <Title></Title>
                                                                    <Title style={{
                                                                        fontFamily: 'Muli-Bold',
                                                                        fontSize: 18
                                                                    }}>
                                                                        {this.state.deliveriesData.endOdometerReading - this.state.deliveriesData.startOdometerReading}
                                                                        km</Title>
                                                                    <MaterialIcons
                                                                        onPress={() => this.setState({showPackagesListModal: false}, function () {
                                                                            this.props.navigation.navigate('MyTripsMapView', {shiftId: this.state.deliveriesData.id})
                                                                        })}
                                                                        name="location-on" size={30}/>
                                                                </Card.Content>
                                                            </Card>
                                                            <View
                                                                style={[Styles.row, Styles.jSpaceBet, Styles.marH10, Styles.alignCenter]}>
                                                                <Card theme={theme}
                                                                      style={[Styles.flex1, {
                                                                          borderRadius: 0,
                                                                          marginVertical: 1,
                                                                          marginRight: 1
                                                                      }]}>
                                                                    <Card.Content>
                                                                        <Title style={{
                                                                            fontSize: 18,
                                                                            textAlign: 'center',
                                                                            fontFamily: 'Muli-Bold'
                                                                        }}>{this.state.deliveriesData.startOdometerReading}</Title>
                                                                    </Card.Content>

                                                                </Card>
                                                                <Card theme={theme}
                                                                      style={[Styles.flex1, {
                                                                          borderRadius: 0,
                                                                          marginVertical: 1,
                                                                          textAlign: 'center'
                                                                      }]}>
                                                                    <Card.Content>
                                                                        <Title style={{
                                                                            fontSize: 18,
                                                                            textAlign: 'center',
                                                                            fontFamily: 'Muli-Bold'
                                                                        }}>{this.state.deliveriesData.endOdometerReading}</Title>
                                                                    </Card.Content>
                                                                </Card>

                                                            </View>
                                                        </View>

                                                }

                                                {
                                                    //CashCollected For Everyone, Except Driver and Labour
                                                    this.state.deliveriesData.userRole === 5 || this.state.deliveriesData.userRole >= 15
                                                        ?
                                                        null
                                                        :
                                                        <View>
                                                            <Card theme={theme}
                                                                  style={[Styles.marH10, {
                                                                      marginTop: 5,
                                                                      borderRadius: 0
                                                                  }]}>
                                                                <Card.Content
                                                                    style={[Styles.row, Styles.jSpaceBet, {fontSize: 18}]}>
                                                                    <Title style={{fontSize: 18}}>Cash
                                                                        Collected</Title>
                                                                    <Title></Title>
                                                                    <Title style={{
                                                                        fontFamily: 'Muli-Bold',
                                                                        fontSize: 18
                                                                    }}> <Icon name="inr"
                                                                              size={20}/> {this.state.deliveriesData.cashCollected}
                                                                    </Title>
                                                                </Card.Content>
                                                            </Card>
                                                        </View>
                                                }

                                                {
                                                    //packages For Everyone, Except Driver and Labour
                                                    this.state.deliveriesData.userRole === 5 || this.state.deliveriesData.userRole >= 15
                                                        ?
                                                        null
                                                        :
                                                        <TouchableOpacity
                                                            onPress={() => this.showOrHidePackages(!this.state.showPackages)}>
                                                            <Card theme={theme}
                                                                  style={[Styles.marV10, Styles.marH10, {
                                                                      borderRadius: 0,
                                                                      backgroundColor: this.state.showPackages === true ? '#ccc' : '#fff'
                                                                  }]}>
                                                                <Card.Content
                                                                    style={[Styles.row, Styles.jSpaceBet, {fontSize: 18}]}>
                                                                    <Title style={{fontSize: 18}}>Packages</Title>
                                                                    <Title></Title>
                                                                    <Title style={{
                                                                        fontSize: 18,
                                                                        fontFamily: 'Muli-Bold'
                                                                    }}>{this.state.deliveriesData.totalDeliveries}/{this.state.deliveriesData.totalPackages}</Title>
                                                                    <Title><MaterialIcons
                                                                        name={this.state.showPackages === true ? 'expand-less' : 'expand-more'}
                                                                        size={30}/></Title>
                                                                </Card.Content>
                                                            </Card>
                                                        </TouchableOpacity>
                                                }
                                                {
                                                    //Packages Details,will show only after showPackages is true
                                                    this.state.showPackages === true ?
                                                        <View style={{paddingHorizontal: 20}}>
                                                            <FlatList
                                                                style={[]}
                                                                data={this.state.deliveryHistory}
                                                                renderItem={({item}) => this.FetchFinalCount(item)}
                                                                extraData={this.state}
                                                                keyExtractor={(item, index) => index.toString()}/>
                                                        </View>
                                                        : null
                                                }

                                            </ScrollView>
                                            <TouchableOpacity style={[Styles.mTop5]} onPress={() => {
                                                this.setState({showPackagesListModal: false})
                                            }}>
                                                <Card.Title theme={theme}
                                                            titleStyle={[Styles.f16, Styles.ffMregular, Styles.aslCenter]}
                                                            title='tap to dismiss'/>
                                            </TouchableOpacity>
                                        </View>
                                        : null
                                }


                            </View>
                        </View>
                    </Modal>

                    <Modal
                        transparent={true}
                        visible={this.state.cancelledShiftModal}
                        onRequestClose={() => {
                            this.setState({cancelledShiftModal: false})
                        }}>
                        <View style={[Styles.modalfrontPosition]}>
                            <TouchableOpacity onPress={() => {
                                this.setState({cancelledShiftModal: false})
                            }} style={[Styles.modalbgPosition]}>
                            </TouchableOpacity>
                            {this.state.cancelledShiftData ?
                                <View style={[Styles.bgWhite, Styles.br30, {
                                    width: Dimensions.get('window').width - 80,
                                }, Styles.p20, Styles.aslCenter]}>
                                    <View style={[Styles.p15, Styles.br15]}><Text
                                        style={[Styles.f18, Styles.ffMregular]}>Shift cancelled at <Text
                                        style={[Styles.ffMbold, Styles.f18, Styles.colorBlue]}>
                                        {this.state.cancelledShiftData.shiftCancelledOn ? Services.returnBoldTimeStampFormat(this.state.cancelledShiftData.shiftCancelledOn) :'NA'},{"\n"}
                                        {this.state.cancelledShiftData.shiftCancelledOn ? new Date(this.state.cancelledShiftData.shiftCancelledOn).toDateString() : 'Not Available'}</Text> {"\n"} By {'\n'}
                                    </Text>
                                        <Text
                                            style={[styles.cardDesign, Styles.ffMregular]}>{this.state.cancelledShiftData.shiftCancelledBy || 'NA'}</Text>
                                        <Text style={[Styles.ffMregular, Styles.f18, Styles.mTop15]}>
                                            Cancel Comment
                                        </Text>
                                        <Text
                                            style={[styles.cardDesign, Styles.ffMregular]}>{this.state.cancelledShiftData.cancellationReason || 'NA'}</Text>
                                    </View>
                                </View>

                                : null}
                            <TouchableOpacity onPress={() => {
                                this.setState({cancelledShiftModal: false})
                            }} style={{marginTop: 20}}>
                                {LoadSVG.cancelIcon}
                            </TouchableOpacity>
                        </View>
                    </Modal>

                    {/*MODALS END*/}
                </View>
                :
                <CSpinner/>
        );
    }
}

const styles = StyleSheet.create({
    surface: {
        padding: 12,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        borderRightWidth: 1,
        borderRightColor: "#f5f5f5"
    },
    title: {
        fontFamily: 'Muli-Bold',
        paddingBottom: 12,
        color: "rgba(175,173,175,0.77)"
    },
    data: {
        fontFamily: 'Muli-Regular',
        fontSize: 16,
    },
    dHistoryGridOne: {
        fontFamily: 'Muli-Bold',
        color: '#000',
        width: 110,
        textAlign: 'center',
        borderRightWidth: 1,
        borderRightColor: '#ccc',
    },
    dHistoryGridTwo: {
        fontFamily: 'Muli-Bold',
        color: '#000',
        width: 180,
        textAlign: 'center',
    },
    dHistoryGridSub: {
        fontFamily: 'Muli-Bold',
        // backgroundColor: '#397af9',
        textAlign: 'center',
        color: '#000',
    },
    inline: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderRadius: 5,
        padding: 8
    },
    cardDesign: {
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        fontSize: 18,
        marginTop: 3
    }

});
