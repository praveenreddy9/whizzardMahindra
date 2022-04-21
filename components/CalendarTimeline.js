import * as React from "react";
import {
    View,
    StyleSheet,
    Text,
    ScrollView,
    RefreshControl,
    FlatList, ActivityIndicator, Alert
} from "react-native";
import {Appbar, Card, Chip, DefaultTheme, Provider as PaperProvider, Title} from "react-native-paper";
import OneSignal from "react-native-onesignal";
import HomeScreen from './HomeScreen';
import {CSpinner, CText, Styles} from "./common";
import Utils from './common/Utils';
import OfflineNotice from "./common/OfflineNotice";
import FontAwesome from "react-native-vector-icons/dist/FontAwesome";
import MaterialIcons from "react-native-vector-icons/dist/MaterialIcons";
import Config from "./common/Config";
import Services from "./common/Services";
import AsyncStorage from "@react-native-community/async-storage";
import Ionicons from "react-native-vector-icons/dist/Ionicons";
import _ from "lodash";


INIT
ATTENDANCE_MARKED
SHIFT_IN_PROGRESS
SHIFT_ENDED
SHIFT_AUTOCLOSED
SHIFT_SUSPENDED
SHIFT_CLOSED_BY_SUPERVISOR
SHIFT_CANCELLED_BY_SUPERVISOR
REPORTED_ABSENT

const vacation = {key: 'vacation', color: 'red', selectedDotColor: 'blue'};
const massage = {key: 'massage', color: 'blue', selectedDotColor: 'blue'};
const workout = {key: 'workout', color: 'green'};
// const INIT = {key:'INIT', color: 'green'};
const MARKED = {key: 'MARKED', color: 'yellow'};
const STARTED = {key: 'STARTED', color: 'green'};
const ENDED = {key: 'ENDED', color: 'blue'};
const REJECTED = {key: 'REJECTED', color: 'red'};
const ABSENT = {key: 'ABSENT', color: 'black'};


const INIT = {key: 'INIT', color: '#fae7a8'};
const ATTENDANCE_MARKED = {key: 'ATTENDANCE_MARKED', color: '#ccf6d8'};
const SHIFT_IN_PROGRESS = {key: 'SHIFT_IN_PROGRESS', color: '#f3cc14'};
const SHIFT_ENDED = {key: 'SHIFT_ENDED', color: '#28a745'};
const SHIFT_AUTOCLOSED = {key: 'SHIFT_AUTOCLOSED', color: '#6f42c1'};
const SHIFT_SUSPENDED = {key: 'SHIFT_SUSPENDED', color: '#000000'};
const SHIFT_CLOSED_BY_SUPERVISOR = {key: 'SHIFT_CLOSED_BY_SUPERVISOR', color: '#FF0000'};
const SHIFT_CANCELLED_BY_SUPERVISOR = {key: 'SHIFT_CANCELLED_BY_SUPERVISOR', color: '#FF0000'};
const REPORTED_ABSENT = {key: 'REPORTED_ABSENT', color: '#8b0000'};


export default class CalendarTimeline extends React.Component {

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
            shiftsList: [],
            markedDates: {},
            searchList: [],
            selectedDate:Services.returnCalendarFormat(new Date()),
            userId: '',
            statuses: '',
            userRole: '',
            // chipsList: [
            //     {status: '', name: 'All', value: 1},
            //     {status: 'SHIFT_IN_PROGRESS', name: 'On Duty', value: 4},
            //     {status: 'ATTENDANCE_MARKED', name: 'Present', value: 3},
            //     {status: 'INIT', name: 'Not Reported', value: 2},
            //     {status: 'SHIFT_ENDED', name: 'Completed', value: 5},
            //     {status: 'SHIFT_AUTOCLOSED', name: 'Auto Closed', value: 6},
            //     {status: 'SHIFT_SUSPENDED', name: 'Suspended', value: 7},
            //     {status: 'SHIFT_CANCELLED_BY_SUPERVISOR', name: 'Cancelled', value: 8},
            //     {status: 'SHIFT_CLOSED_BY_SUPERVISOR', name: 'Closed', value: 9},
            //     {status: 'REPORTED_ABSENT', name: 'Absent', value: 10},
            // ],
            selectedChip: '',
            page: 1,
            spinnerBool: false,
            size: 20,shiftsData:[]
        }
    }

    componentDidMount() {
        const self = this;
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            AsyncStorage.getItem('Whizzard:userRole').then((userRole) => {
                let userId = self.props.navigation.state.params.userId
                let selectedDate = self.props.navigation.state.params.selectedDate
                let shiftsData = self.props.navigation.state.params.shiftsData
                let chipsList = [
                    {status: '', name: 'All', value: 1,count :''},
                    {status: 'SHIFT_IN_PROGRESS', name: 'On Duty', value: 4,count :shiftsData.shiftInProgressCount},
                    {status: 'ATTENDANCE_MARKED', name: 'Present', value: 3,count :shiftsData.markedAttendanceCount},
                    {status: 'INIT', name: 'Not Reported', value: 2,count :shiftsData.initCount},
                    {status: 'SHIFT_ENDED', name: 'Completed', value: 5,count :shiftsData.shiftsEndedCount},
                    {status: 'SHIFT_AUTOCLOSED', name: 'Auto Closed', value: 6,count :shiftsData.autoClosedShiftsCount},
                    {status: 'SHIFT_CANCELLED_BY_SUPERVISOR', name: 'Cancelled', value: 8,count :shiftsData.shiftsCancelledCount},
                    {status: 'SHIFT_CLOSED_BY_SUPERVISOR', name: 'Closed', value: 9,count :shiftsData.shiftsClosedBySupervisorCount},
                    {status: 'REPORTED_ABSENT', name: 'Absent', value: 10,count :shiftsData.reportedAbsentCount},
                    {status: 'SHIFT_SUSPENDED', name: 'Suspended', value: 7,count :shiftsData.suspendedShiftsCount},
                ]

                self.setState({
                    userId: userId, userRole: userRole,
                    selectedDate: selectedDate,
                    shiftsData:shiftsData,
                    chipsList:chipsList
                }, () => {
                    self.getShiftsBySearch()
                })
            })
            Services.checkMockLocationPermission((response) => {
                if (response){
                    this.props.navigation.navigate('Login')
                }
            })
        });
    }

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }


    errorHandling(error) {
        // console.log("calendar timeline error", error, error.response);
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



    //API CALL FOR Shifts List by selected date
    getShiftsBySearch() {
        const self = this;
        const { page,searchList} = self.state;
        // let todayDate = Services.returnCalendarFormat(new Date());
        // const apiURL = Config.routes.BASE_URL + Config.routes.GET_SHIFTS_LIST+ '&date='+'2021-00-01' +'?&userId=' + '5f278d0880d0103af11272b8';
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_SHIFTS_BY_SEARCH;
        const body = {
            'startDate': self.state.selectedDate,
            'endDate': self.state.selectedDate,
            'userIds': self.state.userId ? [self.state.userId] : [],
            'statuses': self.state.statuses ? [self.state.statuses] : [],
            page: page,
            size: 20
        };
        // console.log('search apiURL', apiURL, body)
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "POST", body, (response) => {
                if (response.status === 200) {
                    // let searchList = response.data.content
                    // console.log(' search 200', response);

                    self.setState({
                        searchList: page === 1 ? response.data.content : [...searchList, ...response.data.content],
                        totalPages: response.data.totalPages,
                        totalElements: response.data.totalElements,
                        showSelectedData: true,
                        spinnerBool: false,
                    });
                }
            }, (error) => {
                // console.log('error in search');
                self.errorHandling(error)
            })
        });
    }

    onDaySelected = (checkedDate) => {
        // console.log('on day selected', checkedDate);

        this.setState({
            selectedDate: checkedDate,
            statuses: '',
            selectedChip: '',
            markedDates: {[checkedDate]: {selected: true, selectedColor: '#466A8F'}},
            shiftsList: []
        }, () => {
            this.getShiftsBySearch()
        });
    }

    handleLoadMore = () => {
        // console.log('handleLoadMore', this.state.page,this.state.totalPages);
        this.state.page < this.state.totalPages ?
            this.setState({
                page: this.state.page + 1
            }, () => {
                // console.log('this.state.page ----', this.state.page);
                this.getShiftsBySearch();
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

    userShifts(item,index) {
        // console.log('index',index,index === (this.state.totalElements-1))
        return (
            <PaperProvider>
                <View style={[Styles.row]}
                      key={index}>
                    <View style={[Styles.alignCenter, {
                        borderLeftWidth: 2,
                        borderBottomLeftRadius: 0,
                        borderLeftColor: '#b2beb5',
                        position: 'absolute',
                        marginTop: index === 0 ? 43 : 0,
                        marginBottom: index === (this.state.totalElements-1) ? 43 : 0,
                        // marginBottom:   43 ,
                        top: 0,
                        left: 27,
                        right: 0,
                        bottom: 0
                    }]}>
                    </View>
                    <View style={[Styles.aslCenter,Styles.pRight15]}>
                        {/*<Text>{new Date(item.expectedStartTime).toLocaleTimeString()} </Text>*/}
                        <Text style={{textAlign: 'center', backgroundColor:'#ff9797', color:'white', padding:5, borderRadius:13}}>{Services.returnHMformat(item)} </Text>
                        {/*<FontAwesome name="circle" size={24} color="black" />*/}
                    </View>


                    <Card  onPress={() => {
                            this.props.navigation.navigate('ShiftSummary', {shiftId: item.id})
                        }}
                        style={[Styles.bgWhite,Styles.flex1, Styles.OrdersScreenCardshadow,
                            {
                                marginBottom: 10,
                                padding: 5,
                                borderLeftColor: Services.getShiftStatusColours(item.status), borderLeftWidth: 3
                            }]}>
                        <Card.Title
                            left={() =>
                                <View style={{position: 'relative'}}>
                                    {Services.getUserProfilePic(item.attrs.profilePicUrl)}
                                    <View style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: -20,
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}>
                                        <View style={{backgroundColor: "#fff", padding: 2, borderRadius: 25}}>
                                            <Text style={{
                                                height: 14,
                                                width: 14,
                                                backgroundColor: Services.getShiftStatusColours(item.status),
                                                borderRadius: 25
                                            }}> </Text>
                                        </View>
                                    </View>
                                </View>}
                            title={<Text><Text style={[Styles.f18,Styles.ffLBold]}>{_.startCase(_.toLower(item.attrs.userName))}</Text></Text> }
                            titleStyle={[Styles.ffMbold, Styles.f18]}
                            subtitleStyle={[Styles.ffMregular]}
                            subtitle={
                                <Text><Text style={[Styles.f14,Styles.colorBlue,Styles.ffLBold]}>{item.attrs.siteCode}-</Text> <Text style={[Styles.f14,Styles.ffLRegular,Styles.colorBlue]}>{Services.getUserRolesShortName(item.userRole)} ({Services.returnExpectedTimings(item)})</Text></Text>
                            }
                            right={() =>
                                <MaterialIcons name="chevron-right" size={35} style={{color: '#000', padding: 3}}/>
                            }
                        >
                        </Card.Title>
                    </Card>
                </View>
            </PaperProvider>
        )
    }

    render() {
        return (
            <View style={[[Styles.flex1, Styles.bgWhite]]}>
                <OfflineNotice/>
                {this.renderSpinner()}
                <View style={[Styles.bgWhite]}>
                    <Appbar.Header style={[Styles.bgDarkRed]}>
                        <Appbar.BackAction onPress={() => this.props.navigation.goBack()}/>
                        <Appbar.Content
                            title={"Shifts" + ' (' + this.state.selectedDate + ')'}/>
                    </Appbar.Header>
                </View>
                <View style={[Styles.flex1, Styles.bgLWhite]}>
                    {
                        this.state.showSelectedData
                            ?
                            <View style={[Styles.flex1]}>
                                {/*CHIPS SECTION*/}
                                {
                                    this.state.userRole >= '19'
                                        ?
                                        <View style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'flex-start',
                                            padding: 10
                                        }}>
                                            {/* CHIPS SECTION */}
                                            <ScrollView horizontal={true}
                                                        showsHorizontalScrollIndicator={false}
                                                        style={[Styles.row]}>
                                                {this.state.chipsList.map(chipsList => {
                                                    return (
                                                        <Chip key={chipsList.value} style={{
                                                            backgroundColor: this.state.selectedChip === chipsList.status ? '#db2b30' : '#afadaf',
                                                            marginHorizontal: 5
                                                        }}
                                                              textStyle={[Styles.ffMbold, Styles.cWhite,Styles.aslCenter]}
                                                              onPress={() => {
                                                                  this.setState({
                                                                      selectedChip: chipsList.status,
                                                                      statuses: chipsList.status,
                                                                      page: 1,
                                                                      searchList: []
                                                                  }, () => {
                                                                      this.getShiftsBySearch()
                                                                  })
                                                              }}>{chipsList.name}{chipsList.count === '' ? null : ' ' + '(' + chipsList.count + ')'}{chipsList.status === '' ? null :
                                                            <FontAwesome name="circle" style={[Styles.aslCenter]} size={20} color={ Services.getShiftStatusColours(chipsList.status)} />}</Chip>
                                                    );
                                                })}
                                            </ScrollView>
                                        </View>
                                        :
                                        null
                                }
                                {
                                    this.state.searchList.length > 0
                                        ?
                                        <View style={[Styles.flex1]}
                                        >
                                            <FlatList
                                                style={[Styles.marH10, Styles.mBtm10, Styles.mTop10]}
                                                data={this.state.searchList}
                                                renderItem={({item, index}) => this.userShifts(item, index)}
                                                extraData={this.state}
                                                keyExtractor={(item, index) => index.toString()}
                                                onEndReached={this.handleLoadMore}
                                                contentContainerStyle={{paddingBottom: 20}}
                                                onEndReachedThreshold={1}
                                                ListFooterComponent={this.renderFooter}
                                            />
                                        </View>
                                        :
                                        <PaperProvider>
                                            <View style={[Styles.m10]}>
                                                <Card
                                                    style={[Styles.bgWhite, Styles.OrdersScreenCardshadow]}>
                                                    <Card.Title
                                                        title={"No Shifts found"}
                                                        titleStyle={[Styles.ffMbold, Styles.f18, Styles.aslCenter]}
                                                    >
                                                    </Card.Title>
                                                </Card>
                                            </View>
                                        </PaperProvider>
                                }
                            </View>
                            :
                            null
                    }
                </View>

            </View>
        );
    }
};

