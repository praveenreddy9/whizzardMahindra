import * as React from "react";
import {
    View,
    StyleSheet,
    Text,
    DatePickerAndroid,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    FlatList, Animated, Dimensions, BackHandler, Alert
} from "react-native";
import {Appbar, Card, Chip, DefaultTheme, Provider as PaperProvider, Title} from "react-native-paper";
import OneSignal from "react-native-onesignal";
import HomeScreen from './HomeScreen';
import {CSpinner, CText, Styles} from "./common";
import Utils from './common/Utils';
import OfflineNotice from "./common/OfflineNotice";
import FontAwesome from "react-native-vector-icons/dist/FontAwesome";
import {Calendar, CalendarList, Agenda, theme} from 'react-native-calendars';
import MaterialCommunityIcons from "react-native-vector-icons/dist/MaterialCommunityIcons";
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


export default class CalendarShifts extends React.Component {

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
        this.didFocus = props.navigation.addListener('didFocus', payload =>
            BackHandler.addEventListener('hardwareBackPress', this.onBack),
        );
        this.state = {
            shiftsList: [],
            markedDates: {},
            searchList: [],
            selectedDate: new Date(),
            userId: '',
            statuses: '',
            userRole: '',
            selectedChip: '',chipsList:[]
        }
    }

    onBack = () => {
        if (this.state.userId === ''){
            return this.props.navigation.navigate('HomeScreen')
        }else {
            return this.props.navigation.goBack();
        }
    };

    componentDidMount() {
        const self = this;
        this.willBlur = this.props.navigation.addListener('willBlur', payload =>
            BackHandler.removeEventListener('hardwareBackPress', this.onBack)
        );
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            Services.checkMockLocationPermission((response) => {
                if (response){
                    this.props.navigation.navigate('Login')
                }
            })
        })
        // this._subscribe = this.props.navigation.addListener('didFocus', () => {
            AsyncStorage.getItem('Whizzard:userRole').then((userRole) => {
                let userId = self.props.navigation.state.params.userId
                self.setState({
                    userId: userId, userRole: userRole,
                    selectedDate: Services.returnCalendarFormat(new Date()),
                    markedDates:{}
                }, () => {
                    self.getShiftsList(userId)
                })
            // })
        });
    }

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }


    errorHandling(error) {
        // console.log("Calendar shifts error", error, error.response);
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


    //API CALL FOR ShiftsList
    getShiftsList() {
        const self = this;
        // let todayDate = Services.returnCalendarFormat(new Date());
        let todayDate = self.state.selectedDate;
        let userId = self.state.userId;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_SHIFTS_COUNT + '&date=' + todayDate + '?&userId=' + userId;
        const body = {};
        // console.log('getShifts List apiURL', apiURL)
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "GET", body, (response) => {
                if (response.status === 200) {
                    let shiftsData = response.data
                    console.log(' getShifts List 200', shiftsData);

                    let chipsList = [
                        {status: 'SHIFT_IN_PROGRESS', name: 'On Duty', value: 4,count :shiftsData.shiftInProgressCount},
                        {status: 'ATTENDANCE_MARKED', name: 'Present', value: 3,count :shiftsData.markedAttendanceCount},
                        {status: 'INIT', name: 'Not Reported', value: 2,count :shiftsData.initCount},
                        {status: 'SHIFT_ENDED', name: 'Completed', value: 5,count :shiftsData.shiftsEndedCount},
                        {status: 'SHIFT_AUTOCLOSED', name: 'Auto Closed', value: 6,count :shiftsData.autoClosedShiftsCount},
                        {status: 'SHIFT_CANCELLED_BY_SUPERVISOR', name: 'Cancelled', value: 8,count :(shiftsData.shiftsCancelledCount + shiftsData.suspendedShiftsCount + shiftsData.shiftsClosedBySupervisorCount) },
                        {status: 'REPORTED_ABSENT', name: 'Absent', value: 10,count :shiftsData.reportedAbsentCount},
                        // {status: 'SHIFT_CLOSED_BY_SUPERVISOR', name: 'Closed', value: 9,count :shiftsData.shiftsClosedBySupervisorCount},
                        // {status: 'SHIFT_SUSPENDED', name: 'Suspended', value: 7,count :shiftsData.suspendedShiftsCount},
                    ]

                    self.setState({
                        // shiftsList: response.data,
                        shiftsList: response.data.userShiftCountDTOList,
                        chipsList:chipsList,
                        // markedDates: newDaysObject,
                        // markedDates:{},
                        spinnerBool: false,
                    });
                }
            }, (error) => {
                // console.log('error in getShifts List');
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
            this.getShiftsList()
        });
    }

    render() {
        return (
            <View style={[[Styles.flex1, Styles.bgWhite]]}>
                <OfflineNotice/>
                {this.renderSpinner()}
                <View style={[Styles.bgWhite]}>
                    <Appbar.Header style={[Styles.bgDarkRed]}>
                        <Appbar.BackAction onPress={() =>  this.onBack()}/>
                        <Appbar.Content
                            title={"Calendar Shifts" + ' (' + Services.returnCalendarMonthYear(this.state.selectedDate) + ')'}/>
                    </Appbar.Header>
                </View>

                <ScrollView style={[ Styles.flex1, Styles.bgWhite]}>

                        {/* CHIPS SECTION */}
                        <View style={[Styles.row,Styles.flexWrap,Styles.pTop5]}>
                            {this.state.chipsList.map((chipsList,index) => {
                                if (chipsList.count){
                                    return (
                                        <View
                                            key = {index}
                                            style={[Styles.row,Styles.aslStart,Styles.marH5,{width:Dimensions.get('window').width/2.2}]}>
                                            <FontAwesome name="circle" size={20} style={[Styles.aslCenter]} color={ Services.getShiftStatusColours(chipsList.status)} />
                                            <Text style={[Styles.colorBlue,Styles.ffMbold,Styles.f16,Styles.aslCenter,Styles.padH5]}>{chipsList.name + ' (' + chipsList.count + ')'}</Text>
                                        </View>

                                    );
                                }
                            })}
                        </View>


                    {
                        this.state.shiftsList.length > 0
                            ?
                            <View >
                                <View style={[  Styles.aslCenter,{   position: 'absolute',top: 15,zIndex:9999 }]}>
                                    <Text style={[Styles.ffMbold,Styles.f18]}>{Services.returnCalendarMonthYear(this.state.selectedDate)}</Text>
                                </View>
                                <Calendar
                                    current={Services.returnCalendarFormat(this.state.selectedDate)}
                                    onDayPress={(day) => {
                                        this.onDaySelected(day.dateString)
                                    }}
                                    onDayLongPress={(day) => {
                                        this.onDaySelected(day.dateString)
                                    }}
                                    monthFormat={'yyyy MM'}
                                    onMonthChange={(month) => {
                                        this.onDaySelected(month.dateString)
                                    }}
                                    hideArrows={false}
                                    // renderArrow={(direction) => (<Arrow/>)}
                                    renderArrow={(direction) => {
                                        if (direction === "right") {
                                            return (
                                                <MaterialIcons
                                                    name={"chevron-right"}
                                                    size={24} color="#000"
                                                    style={[Styles.bgLWhite, Styles.br15]}/>
                                            );
                                        }
                                        if (direction === "left") {
                                            return (
                                                <MaterialIcons
                                                    name={"chevron-left"}
                                                    size={24} color="#000"
                                                    style={[Styles.bgLWhite, Styles.br15]}/>
                                            );
                                        }
                                    }}
                                        hideExtraDays={true}
                                    disableMonthChange={true}
                                    firstDay={0}
                                    hideDayNames={false}
                                    showWeekNumbers={false}
                                    onPressArrowLeft={subtractMonth => subtractMonth()}
                                    onPressArrowRight={addMonth => addMonth()}
                                    disableArrowLeft={false}
                                    disableArrowRight={false}
                                    disableAllTouchEventsForDisabledDays={false}
                                    // Replace default month and year title with custom one. the function receive a date as parameter.
                                    // renderHeader={(date) => {console.log('renderheader date',date,new Date(date).toDateString()) }}
                                    renderHeader={(date) => {this.setState({selectedDate: Services.returnCalendarFormat(date)})}}
                                    enableSwipeMonths={true}
                                    markedDates={this.state.markedDates}
                                    displayLoadingIndicator={true}
                                    markingType={'multi-dot'}
                                    theme={{
                                        'stylesheet.calendar.main': {
                                            week: {
                                                marginTop: 0,
                                                marginBottom: 0,
                                                flexDirection: 'row',
                                                justifyContent: 'space-around',
                                                backgroundColor:'#fff',
                                                borderWidth:0.5
                                            },
                                        },
                                        'stylesheet.calendar.header': {
                                            week: {
                                                marginTop: 0,
                                                marginBottom: 0,
                                                flexDirection: 'row',
                                                justifyContent: 'space-around',
                                                backgroundColor:'#000',
                                            },
                                        }
                                    }}
                                    dayComponent={({date, state}) => {
                                        let tempArray = this.state.shiftsList
                                        // console.log('inside render==>',tempArray,'date',date);
                                        let shiftsData = tempArray[date.day - 1];
                                        // console.log('inside render==>shiftsData==',shiftsData,'====>day',date.day,'dynamic data date');
                                        // console.log('date.day==>',date.day,'shiftsData===>',shiftsData);
                                        return (
                                            <TouchableOpacity
                                                activeOpacity={0.7}
                                                onPress={() => {
                                                    this.props.navigation.navigate('CalendarTimeline', {
                                                        userId: this.state.userId,
                                                        selectedDate: date.dateString,
                                                        shiftsData:shiftsData
                                                    })
                                                }}
                                                style={[{borderLeftWidth:0.5,borderBottomWidth:0.5,borderRightWidth:0.5,borderTopWidth:0.5}]}>
                                                <View style={[Styles.mBtm5,
                                                ]}>
                                                    <Text
                                                        style={[Styles.f16, Styles.ffMbold, Styles.aslCenter,[date.dateString === Services.returnCalendarFormat(new Date()) ? [Styles.cBlue] : null]]}>
                                                        {date.day}
                                                    </Text>
                                                </View>
                                                {
                                                    shiftsData
                                                        ?
                                                        shiftsData.autoClosedShiftsCount || shiftsData.initCount || shiftsData.markedAttendanceCount || shiftsData.reportedAbsentCount
                                                            || shiftsData.shiftInProgressCount || shiftsData.shiftsCancelledCount || shiftsData.shiftsClosedBySupervisorCount ||
                                                        shiftsData.shiftsEndedCount || shiftsData.suspendedShiftsCount
                                                        ?
                                                        <View style={[ Styles.row, Styles.flexWrap,  {
                                                            height:79,
                                                        }]}>

                                                            {
                                                                shiftsData.shiftsEndedCount
                                                                    ?
                                                                    <View style={[ Styles.br5, Styles.p3, Styles.m2, {backgroundColor: Services.getShiftStatusColours('SHIFT_ENDED')} ]}>
                                                                        <Text style={[Styles.cWhite,Styles.f8, Styles.aslCenter,]}>
                                                                            {shiftsData.shiftsEndedCount}
                                                                        </Text>
                                                                    </View>
                                                                    :
                                                                    null
                                                            }

                                                            {
                                                                shiftsData.shiftsCancelledCount || shiftsData.shiftsClosedBySupervisorCount || shiftsData.suspendedShiftsCount
                                                                    ?
                                                                    <View style={[ Styles.br5, Styles.p3, Styles.m2, {backgroundColor: Services.getShiftStatusColours('SHIFT_CANCELLED_BY_SUPERVISOR')} ]}>
                                                                        <Text
                                                                            style={[Styles.cWhite,Styles.f8, Styles.aslCenter,]}>
                                                                            {(shiftsData.shiftsCancelledCount+shiftsData.shiftsClosedBySupervisorCount+shiftsData.suspendedShiftsCount)}
                                                                        </Text>
                                                                    </View>
                                                                    :
                                                                    null
                                                            }

                                                            {
                                                                shiftsData.autoClosedShiftsCount
                                                                    ?
                                                                    <View style={[ Styles.br5, Styles.p3, Styles.m2, {backgroundColor: Services.getShiftStatusColours('SHIFT_AUTOCLOSED')} ]}>
                                                                        <Text style={[Styles.cWhite,Styles.f8, Styles.aslCenter,]}>
                                                                            {shiftsData.autoClosedShiftsCount}
                                                                        </Text>
                                                                    </View>
                                                                    :
                                                                    null
                                                            }

                                                            {
                                                                shiftsData.initCount
                                                                    ?
                                                                    <View style={[ Styles.br5, Styles.p3, Styles.m2, {backgroundColor: Services.getShiftStatusColours('INIT')} ]}>
                                                                        <Text style={[Styles.cWhite,Styles.f8, Styles.aslCenter,]}>
                                                                            {shiftsData.initCount}
                                                                        </Text>
                                                                    </View>
                                                                    :
                                                                    null
                                                            }

                                                            {
                                                                shiftsData.markedAttendanceCount
                                                                    ?
                                                                    <View style={[ Styles.br5, Styles.p3, Styles.m2, {backgroundColor: Services.getShiftStatusColours('ATTENDANCE_MARKED')} ]}>
                                                                        <Text style={[Styles.cWhite,Styles.f8, Styles.aslCenter,]}>
                                                                            {shiftsData.markedAttendanceCount}
                                                                        </Text>
                                                                    </View>
                                                                    :
                                                                    null
                                                            }

                                                            {
                                                                shiftsData.shiftInProgressCount
                                                                    ?
                                                                    <View style={[ Styles.br5, Styles.p3, Styles.m2, {backgroundColor: Services.getShiftStatusColours('SHIFT_IN_PROGRESS')} ]}>
                                                                        <Text style={[Styles.cWhite,Styles.f8, Styles.aslCenter,]}>
                                                                            {shiftsData.shiftInProgressCount}
                                                                        </Text>
                                                                    </View>
                                                                    :
                                                                    null
                                                            }

                                                            {
                                                                shiftsData.reportedAbsentCount
                                                                    ?
                                                                    <View style={[ Styles.br5, Styles.p3, Styles.m2, {backgroundColor: Services.getShiftStatusColours('REPORTED_ABSENT')}]}>
                                                                        <Text style={[Styles.cWhite,Styles.f8, Styles.aslCenter,]}>
                                                                            {shiftsData.reportedAbsentCount}
                                                                        </Text>
                                                                    </View>
                                                                    :
                                                                    null
                                                            }


                                                            {/*showing suspended,closed bu supervisor in cancelled*/}
                                                            {/*{*/}
                                                            {/*    shiftsData.shiftsClosedBySupervisorCount*/}
                                                            {/*        ?*/}
                                                            {/*        <View style={[ Styles.br5, Styles.p3, Styles.m2, {backgroundColor: Services.getShiftStatusColours('SHIFT_CLOSED_BY_SUPERVISOR')} ]}>*/}
                                                            {/*            <Text style={[Styles.cWhite,Styles.f8, Styles.aslCenter,]}>*/}
                                                            {/*                {shiftsData.shiftsClosedBySupervisorCount}*/}
                                                            {/*            </Text>*/}
                                                            {/*        </View>*/}
                                                            {/*        :*/}
                                                            {/*        null*/}
                                                            {/*}*/}

                                                            {/*{*/}
                                                            {/*    shiftsData.suspendedShiftsCount*/}
                                                            {/*        ?*/}
                                                            {/*        <View style={[ Styles.br5, Styles.p3, Styles.m2, {backgroundColor: Services.getShiftStatusColours('SHIFT_SUSPENDED')} ]}>*/}
                                                            {/*            <Text style={[Styles.cWhite,Styles.f8, Styles.aslCenter,]}>*/}
                                                            {/*                {shiftsData.suspendedShiftsCount}*/}
                                                            {/*            </Text>*/}
                                                            {/*        </View>*/}
                                                            {/*        :*/}
                                                            {/*        null*/}
                                                            {/*}*/}



                                                            <Text
                                                                style={[{width:50}]}>
                                                            </Text>

                                                        </View>
                                                        :
                                                        <View style={[ Styles.row, Styles.flexWrap,  {height:79,
                                                            }]}>
                                                                <View style={[ Styles.br5, Styles.p3, Styles.m2]}>
                                                                    <Text style={[Styles.colorBlue,Styles.f16, Styles.aslCenter,]}>
                                                                        NA
                                                                    </Text>
                                                                </View>
                                                            <Text
                                                                style={[{width:50}]}>
                                                            </Text>
                                                        </View>
                                                        :
                                                        <View style={[ Styles.row, Styles.flexWrap,  {
                                                            height:79,
                                                        }]}>
                                                            <View style={[ Styles.br5, Styles.p3, Styles.m2]}>
                                                                <Text style={[Styles.colorBlue,Styles.f16, Styles.aslCenter,]}>
                                                                    NA
                                                                </Text>
                                                            </View>
                                                            <Text
                                                                style={[{width:50}]}>
                                                            </Text>
                                                        </View>
                                                }
                                            </TouchableOpacity>
                                        );
                                    }}
                                />
                            </View>
                            :
                            null
                    }

                </ScrollView>

            </View>
        );
    }
};

