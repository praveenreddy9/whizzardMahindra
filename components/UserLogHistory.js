import React, {Component} from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Modal, Dimensions, ScrollView, Picker, Alert, Button, DatePickerAndroid
} from "react-native";
import {Appbar, Card, Colors, DefaultTheme, List} from "react-native-paper";
import Config from "./common/Config";
import Services from "./common/Services";
import Utils from "./common/Utils";
import {CSpinner, CText, LoadSVG, Styles} from "./common";
import OfflineNotice from './common/OfflineNotice';
import {Row, Column as Col} from "react-native-flexbox-grid";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import OneSignal from "react-native-onesignal";
import HomeScreen from "./HomeScreen";
import AsyncStorage from "@react-native-community/async-storage";

const theme = {
    ...DefaultTheme,
    fonts: {
        medium: 'Muli-Regular'
    }
};

export class UserLogHistory extends Component {
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
            usersLogList: [],
            page: 1,
            spinnerBool: false,
            size: 10,
            isLoading: false,
            isRefreshing: false,
            logAttendanceDataModal: false,filtersModal:false,searchActive:false,
            filterFromDate:Services.returnCalendarFormat(new Date()),filterToDate :Services.returnCalendarFormat(new Date()),
            // attendenceTypes: [
            //     {value: '', label: 'Attendence Type', key: 0},
            //     {value: 'Scan QR Code', label: 'Scan QR Code', key: 1},
            //     {value: 'Working remotely', label: 'Working remotely', key: 2},
            //     {value: 'Day off', label: 'Day off', key: 3},
            //     ],
            attendenceSelected:'',userLogStatus:[],attendenceTypes:[],userLogStatusModal:false,
            sitesList:[],rolesList:[],logTypeList:[],filterLogStatus:'',myLogCount:[]
        };
    }


    componentDidMount() {
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            AsyncStorage.getItem('Whizzard:switchState').then((switchState) => {
                AsyncStorage.getItem('Whizzard:userId').then((userId) => {
                    // console.log('userId',userId);
                    this.setState({page:1,switchState: JSON.parse(switchState),loggedUserId:userId,filterUserId:userId,logTab: 'SiteLogs'},()=>{

                        // this.getRolesForEmpAttendanceFilter()  //to use roles list at filters
                        // this.getLoggedUserSites()     //to use sites list at filters
                        // this.getLogTypes()           //to use log types at filters

                        // this.getLogHistory()      //to get logs list of all users
                        this.getUserLogStatus()   //to check logged or not
                    })
                })
            })
            Services.checkMockLocationPermission((response) => {
                if (response){
                    this.props.navigation.navigate('Login')
                }
            })
        });
    }

    componentWillUnmount() {
        // this.didFocus.remove();
    }

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    errorHandling(error) {
        // console.log("log attendance report error", error, error.response);
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

    getLoggedUserSites() {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_LOGGED_USER_SITES;
        const body = {
            businessUnits: [],
            cityIds: [],
            regionIds: [],
            states: [],
            // page: self.state.page,
            // size: 15
        };
        // console.log('get LoggedUser Sites apiUrl==>',apiUrl,'body==>', body,)
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'POST', body, function (response) {
                if (response.status === 200) {
                    // console.log("Sites resp200", response.data);
                    let tempResponse = response.data
                    tempResponse.push({id:'',siteLable:'All'})
                    tempResponse.unshift(tempResponse.pop());
                    self.setState({
                        sitesList:tempResponse,
                        spinnerBool: false
                    })
                }
            }, function (error) {
                // console.log('get LoggedUser Sites error', error, error.response, error.response.data);
                self.errorHandling(error)
            })
        })
    };

    getRolesForEmpAttendanceFilter() {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_ROLES_LIST_LOG_ATTENDANCE;
        const body = {};
        // console.log('get LoggedUser roles apiUrl==>',apiUrl,'body==>', body,)
        this.setState({spinnerBool: true,rolesList:[]}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response.status === 200) {
                    // console.log("roles resp200", response.data);
                    let tempResponse =[]
                    tempResponse = response.data
                    tempResponse.push({value:'',key:'All'})
                    tempResponse.unshift(tempResponse.pop());
                    self.setState({
                        rolesList:  tempResponse,
                        spinnerBool: false
                    })
                    self.getLoggedUserSites()     //to use sites list at filters
                }
            }, function (error) {
                // console.log('get LoggedUser roles error', error, error.response, error.response.data);
                self.errorHandling(error)
            })
        })
    };

    getLogTypes() {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_USER_LOG_STATUS;
        const body = {};
        // console.log("get Log Types body");
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response.status === 200) {
                    // console.log("get Log Types resp200  ==>", response.data);
                    const tempData = response.data
                    let tempResponse = tempData.logTypes
                    tempResponse.push({value:'',name:'All'})
                    tempResponse.unshift(tempResponse.pop());
                    // console.log('tempResponse==',tempResponse);
                    self.setState({logTypeList:tempResponse,spinnerBool:false})
                }
                self.getRolesForEmpAttendanceFilter()  //to use roles list at filters
            }, function (error) {
                // console.log('get Log Types error', error, error.response, error.response.data);
                self.errorHandling(error)
            })
        })
    };




    getUserLogStatus() {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_USER_LOG_STATUS;
        const body = {};
        // console.log('get UserLog Status body');
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response.status === 200) {
                    // console.log("get UserLog Status resp200 ==>", response.data);
                    const tempData = response.data
                    const sampleLogType = tempData.logTypes
                    // console.log('sampleLogType',sampleLogType);

                    if (tempData.status === null && tempData.showQRCode){
                        self.setState({userLogStatusModal:true,attendenceTypes:sampleLogType,spinnerBool:false,})
                    }else {
                        self.setState({spinnerBool: false ,
                            userLogStatus :tempData,attendenceTypes:sampleLogType
                        })
                    }
                    self.getLogHistory()
                }
            }, function (error) {
                // console.log('get User LogStatus error', error, error.response, error.response.data);
                self.errorHandling(error)
            })
        })
    };

    //API CALL to update user log status
    updateUserLogStatus(StatusKey){
        // console.log('UserAttendanceLog fun enter');
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.USER_ATTENDENCE_LOG
        const body = {logStatus: StatusKey};
        // console.log('update UserLog Status body',body);
        self.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, "POST", body, function (response) {
                if (response.status === 200) {
                    // console.log('user log update 200', response.data);
                    self.setState({spinnerBool: false,userLogStatusModal:false})
                    Utils.dialogBox(response.data.message, '');
                    self.getUserLogStatus()
                    // self.getLogHistory()
                }
            }, function (error) {
                // console.log('update User Log Status error', error, error.response, error.response.data);
                self.errorHandling(error)
            })
        });
    };

    getLogHistory() {
        const {usersLogList, page,logTab} = this.state;
        this.setState({isLoading: true});
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_USER_LOG_HISTORY;
        const body = {
            adminIds: [],
            businessUnits: [],
            // byNoLogOut: false,
            cityIds: [],
            // endDate: Services.returnCalendarFormat(new Date()),
            endDate:Services.returnCalendarFormat(self.state.filterToDate) ,
            roles: self.state.filterRoleId ? [self.state.filterRoleId]:[],
            siteIds: self.state.filterSiteId ? [self.state.filterSiteId]:[],
            // startDate: logTab === 'SiteLogs' ? Services.returnCalendarFormat(new Date()) : "2021-01-01",
            startDate:Services.returnCalendarFormat(self.state.filterFromDate),
            states: [],
            userIds:logTab === 'SiteLogs' ?[] : [this.state.filterUserId],
            status:self.state.filterLogStatus,
            page: self.state.page,
            size: 15
        };
        // console.log('log history body', body,'apiUrl===',apiUrl);
        this.setState({spinnerBool: true,attendenceSelected:''}, () => {
            Services.AuthHTTPRequest(apiUrl, 'POST', body, function (response) {
                if (response.status === 200) {
                    // console.log("log history resp200", response.data);
                    let siteLogs = response.data.userAttendanceLogDTOPage
                    let myLogs = response.data.logsCount
                    self.setState({
                        usersLogList: page === 1 ? siteLogs.content : [...usersLogList, ...siteLogs.content],
                        totalPages: siteLogs.totalPages,
                        myLogCount:myLogs,
                        isRefreshing: false,
                        spinnerBool: false,
                        filtersModal:false
                    })
                }
            }, function (error) {
                // console.log('get LogHistory error', error, error.response, error.response.data);
                self.errorHandling(error)
            })
        })
    };

    handleLoadMore = () => {
        // console.log('this.state.page', this.state.page);
        this.state.page < this.state.totalPages ?
            this.setState({
                page: this.state.page + 1
            }, () => {
                // console.log('this.state.page ----', this.state.page);
                this.getLogHistory();
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
            isRefreshing: true, page: 1
        }, () => {
            this.getLogHistory();
        });
    };

    datePicker(option) {
        const self = this;
        try {
            const {action, year, month, day} = DatePickerAndroid.open({
                date: new Date(),
                maxDate: new Date(),
                // minDate: null,
                // mode: 'spinner',
            }).then((response) => {
                // console.log('date pciker response',response)

                if (response.action === "dateSetAction") {
                    let tempDate = new Date()
                    tempDate = new Date(response.year, response.month, response.day)
                    if (option === 'filterToDate'){
                        var filterToDate = Services.returnCalendarFormat(tempDate);
                        var filterFromDate = Services.returnCalendarFormat(this.state.filterFromDate);

                        if(filterFromDate <= filterToDate){
                            self.setState({filterToDate: tempDate});
                        }else{
                            Utils.dialogBox('Selected Date is less than from date','')
                        }
                    }else {
                        self.setState({filterFromDate: tempDate,filterToDate: tempDate});
                    }

                }
            });
        } catch ({code, message}) {
            console.warn('Cannot open date picker', message);
        }
    }


    onTabChange(logTab){
        this.setState({
            logTab:logTab,
            filterFromDate:Services.returnCalendarFormat(new Date()),
            filterToDate :Services.returnCalendarFormat(new Date()),
            filterSiteId:'',
            filterRoleId:'',
            filterLogStatus:'',
            searchActive:false,usersLogList:[],page :1},()=>{
            this.getLogHistory();
        })
    }


    render() {
        const {usersLogList, isRefreshing,logTab,myLogCount} = this.state;
        return (
            <View style={styles.container}>
                {this.renderSpinner()}
                <OfflineNotice/>
                <Appbar.Header theme={theme} style={styles.appbar}>
                    {/*<Appbar.BackAction onPress={() => this.props.navigation.goBack()}/>*/}
                    <Appbar.Action icon="menu" size={30} onPress={() => {
                        this.props.navigation.openDrawer();
                    }}/>
                    <Appbar.Content title="Log History"/>
                    {
                        this.state.userLogStatus
                            ?
                            <View style={[Styles.row,Styles.aslCenter]}>
                                {
                                    // this.state.userLogStatus.status &&
                                    this.state.userLogStatus.showQRCode
                                        ?
                                        <TouchableOpacity
                                            style={[Styles.aslCenter]} onPress={() => {
                                            this.props.navigation.navigate('ScanQRcode', {UserFlow: 'UserAttendanceLog'});
                                        }}>
                                            <View style={[Styles.row]}>
                                                <FontAwesome name="qrcode" size={28}/>
                                                <Text style={[Styles.ffMregular, {
                                                    paddingLeft: 5,
                                                    paddingRight: 15,
                                                    fontSize: 16
                                                }]}>Scan</Text>
                                            </View>
                                        </TouchableOpacity>
                                        :
                                        null
                                }
                            </View>
                            :
                            null
                    }
                </Appbar.Header>
                {this.renderSpinner()}
                <View style={{flex: 1, alignItems: 'center', backgroundColor: '#dcdcdc',paddingBottom:30}}>

                    {/* TABS FOR MY LOGS,SITE LOGS */}
                    <View style={[Styles.row,Styles.jSpaceArd]}>
                        <View style={[Styles.row, Styles.m10,Styles.jSpaceArd,Styles.OrdersScreenCardshadow]}>
                            <TouchableOpacity
                                activeOpacity={0.7} onPress={() => { this.setState({filterUserId:this.state.loggedUserId},()=>{this.onTabChange('SiteLogs')})
                            }}
                                style={[  Styles.aitCenter,Styles.padH10,
                                    logTab === 'SiteLogs'? Styles.bgDarkRed : Styles.bgWhite
                                ]}>
                                <Text style={[  Styles.f18, Styles.p5, Styles.ffMbold, logTab === 'SiteLogs'? Styles.cWhite : Styles.cBlk]}>Site Logs</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => {this.setState({filterUserId:this.state.loggedUserId},()=>{this.onTabChange('MyLogs')})
                                }}
                                style={[  Styles.aitCenter,Styles.padH10,
                                    logTab === 'MyLogs' ? Styles.bgDarkRed : Styles.bgWhite
                                ]}>
                                <Text style={[  Styles.f18,Styles.p5,  Styles.ffMbold, logTab === 'MyLogs' ? Styles.cWhite : Styles.cBlk]}>My Logs</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={[Styles.row,Styles.aslCenter,Styles.mLt5]}>
                            <FontAwesome name="filter" size={30} style={[Styles.jEnd]} onPress={() => {
                                this.setState({filtersModal:true},()=>{
                                    this.getLogTypes()           //to use log types at filters
                                })
                            }}/>
                            {
                                this.state.searchActive
                                    ?
                                    <TouchableOpacity style={[Styles.aslCenter,Styles.mLt5]}
                                                      onPress={()=>{this.onTabChange(logTab)}}>
                                        <Text style={[Styles.cBlk,Styles.f14,{borderBottomWidth:1}]}>(Reset)</Text>
                                    </TouchableOpacity>
                                    :
                                    null
                            }

                        </View>

                    </View>

                    {
                        logTab === 'MyLogs'
                            ?
                            <View style={[Styles.row,Styles.flexWrap,Styles.pTop5]}>
                                {myLogCount.map(list => {
                                    return (
                                        <View
                                            style={[Styles.padV5,Styles.padH10,]}><Text
                                            style={[Styles.ffMregular, Styles.colorBlue,Styles.f16]}><Text
                                            style={[Styles.ffMbold, Styles.colorBlue]}>{list.status}:</Text> {list.value}
                                        </Text>
                                        </View>
                                    );
                                })}
                            </View>
                            :
                            null
                    }


                    <Row size={12} nowrap style={[Styles.row, Styles.p10, Styles.alignCenter,Styles.bgOrangeYellow]}>
                        <Col sm={4}>
                            <Text style={[Styles.ffMbold, Styles.f16,Styles.alignCenter]}>Name</Text>
                        </Col>
                        <Col sm={4}>
                            <Text style={[Styles.ffMbold, Styles.f16,Styles.alignCenter]}>Site/Status</Text>
                        </Col>
                        <Col sm={1.5}>
                            <Text style={[Styles.ffMbold, Styles.f16,Styles.aslCenter]}>IN</Text>
                        </Col>
                        <Col sm={1.5}>
                            <Text style={[Styles.ffMbold, Styles.f16,Styles.aslCenter]}>OUT</Text>
                        </Col>
                        <Col sm={1}>
                            {/*<Text style={[Styles.ffMbold, Styles.f16]}>Time</Text>*/}
                        </Col>
                    </Row>
                    <View style={[Styles.row, Styles.aslCenter,{marginBottom:30}]}>
                        {
                            usersLogList.length > 0 ?
                                <FlatList
                                    style={[Styles.mBtm30]}
                                    data={usersLogList}
                                    renderItem={({item, index}) => (
                                        <TouchableOpacity onPress={() => this.setState({
                                            logAttendanceData: item,
                                            logAttendanceDataModal: true
                                        })}>
                                            <Row size={12} nowrap
                                                 style={[Styles.row, Styles.p10, Styles.alignCenter,{
                                                     backgroundColor:item.in === true || item.out === true ?  ((index % 2) === 0 ? '#f5f5f5' : '#fff') : ((index % 2) === 0 ? '#ffcccb' : '#f6e1c8')
                                                 }
                                                 ]}>
                                                <Col sm={4}>
                                                    <Text
                                                        style={[Styles.ffMregular, Styles.f14]}>{item.attrs.userName || '---'}{' ('+ Services.getUserRolesShortName(item.role)+')'+'-'+ new Date(item.dateStr).toLocaleDateString()}</Text>
                                                </Col>
                                                <Col sm={4}>
                                                    {
                                                        item.in === true || item.out === true
                                                            ?
                                                            <Text  style={[Styles.ffMregular, Styles.f14,Styles.padH1]}>{item.attrs.siteName || '---'}{' '}({item.attrs.siteCode || '---'})</Text>
                                                            :
                                                            <Text  style={[Styles.ffMregular, Styles.f14,Styles.padH1]}>{item.status|| '---'}</Text>
                                                    }
                                                </Col>

                                                <Col sm={1.5}>
                                                    <View style={[Styles.alignCenter]}>
                                                        <Text
                                                            style={[Styles.ffMbold, Styles.f16, Styles.alignCenter]}>{item.in === true ? 'IN' : '--'}</Text>
                                                        {
                                                            item.in === true
                                                                ?
                                                                <Text style={[Styles.ffMregular, Styles.f12, Styles.alignCenter,Styles.cBlk]}>({item.inTime ? Services.convertTimeStamptoBlueColorHM(item.inTime) : '--'})</Text>
                                                                :
                                                                null
                                                        }

                                                    </View>
                                                </Col>
                                                <Col sm={1.5}>
                                                    <View style={[Styles.alignCenter]}>
                                                        <Text
                                                            style={[Styles.ffMbold, Styles.f16, Styles.alignCenter]}>{item.out === true ? 'OUT' : '---'}</Text>
                                                        {
                                                            item.out === true
                                                                ?
                                                                <Text style={[Styles.ffMregular, Styles.f12, Styles.alignCenter,Styles.cBlk]}>({item.outTime ? Services.convertTimeStamptoBlueColorHM(item.outTime) : '--'})</Text>
                                                                :
                                                                null
                                                        }

                                                    </View>
                                                </Col>
                                                <Col sm={1}>
                                                    <FontAwesome name="info-circle" size={26} color="#000"
                                                                 onPress={() => this.setState({ logAttendanceData: item,  logAttendanceDataModal: true  })}
                                                    />
                                                </Col>
                                            </Row>
                                        </TouchableOpacity>

                                    )}
                                    keyExtractor={(item, index) => index.toString()}
                                    refreshing={isRefreshing}
                                    onRefresh={this.handleRefresh}
                                    onEndReached={this.handleLoadMore}
                                    contentContainerStyle={{paddingBottom: 50}}
                                    onEndReachedThreshold={1}
                                    ListFooterComponent={this.renderFooter}
                                />
                                :
                                <Text style={[Styles.cBlk, Styles.f20, Styles.aslCenter, Styles.ffMregular,Styles.pTop20]}>No
                                    Attendance Logs
                                    Found....</Text>
                        }
                    </View>
                </View>

                {/*Selected Log Attendance Modal */}
                <Modal
                    transparent={true}
                    visible={this.state.logAttendanceDataModal}
                    onRequestClose={() => {
                        this.setState({logAttendanceDataModal: false})
                    }}>
                    <View style={[Styles.aitCenter, Styles.jCenter, {
                        backgroundColor: 'rgba(0, 0, 0 ,0.7)',
                        top: 0,
                        bottom: 0,
                        flex: 1
                    }]}>
                        <TouchableOpacity onPress={() => {
                            this.setState({logAttendanceDataModal: false})
                        }} style={[Styles.modalbgPosition]}>
                        </TouchableOpacity>
                        <View
                            style={[Styles.bw1, Styles.bgWhite, Styles.aslCenter, Styles.p10, Styles.br30, Styles.mBtm20, {
                                width: Dimensions.get('window').width - 60,
                                height: Dimensions.get('window').height / 1.4
                            }]}>
                            {this.state.logAttendanceData ?
                                <ScrollView>
                                    <View style={[Styles.row,Styles.aslCenter]}>
                                        <Text style={[Styles.f18, Styles.ffMbold, Styles.aslCenter, Styles.padV10, Styles.colorBlue]}>LOG DETAILS</Text>
                                        {
                                            logTab === 'MyLogs'
                                                ? null
                                                :
                                                <TouchableOpacity style={[Styles.aslCenter, Styles.mLt10]}
                                                                  onPress={() => {
                                                                      this.setState({
                                                                          filterUserId: this.state.logAttendanceData.userId,
                                                                          logAttendanceDataModal: false
                                                                      }, () => {
                                                                          this.onTabChange('MyLogs')
                                                                      })
                                                                  }}>
                                                    <Text
                                                        style={[Styles.colorGreen, Styles.ffMbold, Styles.f16, {borderBottomWidth: 1}]}>(See
                                                        ALL Logs)</Text>
                                                </TouchableOpacity>
                                        }
                                    </View>
                                    <View style={[Styles.p5]}><Text
                                        style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                        style={[Styles.ffMbold, Styles.colorBlue]}>Date:</Text> {this.state.logAttendanceData.dateStr || '--'}
                                    </Text></View>
                                    <View style={[Styles.p5]}><Text
                                        style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                        style={[Styles.ffMbold, Styles.colorBlue]}>Name:</Text> {this.state.logAttendanceData.attrs.userName || '--'}
                                    </Text></View>
                                    <View style={[Styles.p5]}><Text
                                        style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                        style={[Styles.ffMbold, Styles.colorBlue]}>Mobile:</Text> {this.state.logAttendanceData.attrs.phoneNumber || '--'}
                                    </Text></View>
                                    <View style={[Styles.p5]}><Text style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                        style={[Styles.ffMbold, Styles.colorBlue]}>Site
                                        Name:</Text> {this.state.logAttendanceData.attrs.siteName || '--'}</Text></View>
                                    <View style={[Styles.p5]}><Text style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                        style={[Styles.ffMbold, Styles.colorBlue]}>Site
                                        Code:</Text> {this.state.logAttendanceData.attrs.siteCode || '--'}</Text></View>
                                    <View style={[Styles.p5]}><Text style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                        style={[Styles.ffMbold, Styles.colorBlue]}>Role:</Text> {this.state.logAttendanceData.role ? Services.getUserRoles(this.state.logAttendanceData.role):'--' || '--'}</Text></View>
                                    <View style={[Styles.p5]}><Text style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                        style={[Styles.ffMbold, Styles.colorBlue]}>IN
                                        Status:</Text> {this.state.logAttendanceData.in === true ? 'Yes' : '--'}
                                    </Text></View>
                                    <View style={[Styles.p5]}><Text style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                        style={[Styles.ffMbold, Styles.colorBlue]}>IN
                                        Time:</Text> {this.state.logAttendanceData.inTime ? Services.convertTimeStamptoBlueColorHM(this.state.logAttendanceData.inTime) : '--'}
                                    </Text></View>
                                    <View style={[Styles.p5]}><Text style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                        style={[Styles.ffMbold, Styles.colorBlue]}>OUT Status:</Text> {this.state.logAttendanceData.out === true ? 'Yes' : '--'}</Text></View>
                                    <View style={[Styles.p5]}><Text style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                        style={[Styles.ffMbold, Styles.colorBlue]}>OUT
                                        Time:</Text> {this.state.logAttendanceData.outTime ? Services.convertTimeStamptoBlueColorHM(this.state.logAttendanceData.outTime) : '--'}
                                    </Text></View>
                                    <View style={[Styles.p5]}><Text style={[Styles.ffMregular, Styles.colorBlue]}>
                                        <Text
                                            style={[Styles.ffMbold, Styles.colorBlue]}>Duration:</Text> {this.state.logAttendanceData.attrs.duration || '--'}
                                    </Text></View>
                                    <View style={[Styles.p5]}><Text style={[Styles.ffMregular, Styles.colorBlue]}>
                                        <Text
                                            style={[Styles.ffMbold, Styles.colorBlue]}>Status:</Text> {this.state.logAttendanceData.status  || '--'}
                                    </Text></View>
                                    <View style={[Styles.p5]}><Text style={[Styles.ffMregular, Styles.colorBlue]}>
                                        <Text
                                            style={[Styles.ffMbold, Styles.colorBlue]}>Time:</Text> {this.state.logAttendanceData.time  || '--'}
                                    </Text></View>
                                    <View style={[Styles.p5]}><Text style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                        style={[Styles.ffMbold, Styles.colorBlue]}>Longitude:</Text> {this.state.logAttendanceData.longitude || '--'}</Text></View>
                                    <View style={[Styles.p5]}><Text style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                        style={[Styles.ffMbold, Styles.colorBlue]}>Latitude:</Text>  {this.state.logAttendanceData.latitude || '--'}</Text></View>
                                </ScrollView> : null
                            }
                        </View>

                    </View>

                </Modal>


                {/*USER Status Selection POP-UP*/}
                <Modal transparent={true}
                       visible={this.state.userLogStatusModal}
                       animated={true}
                       animationType='slide'
                       onRequestClose={() => {
                           // this.setState({userLogStatusModal: false})
                       }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View
                            style={[[Styles.bw1, Styles.aslCenter, Styles.p15, Styles.br40, Styles.bgWhite, {
                                width: Dimensions.get('window').width - 80,
                            }]]}>
                            <View style={[Styles.bgWhite, {height: Dimensions.get('window').height / 2.1,}]}>
                                <View style={Styles.aslCenter}>
                                    <Text
                                        style={[Styles.ffMbold, Styles.colorBlue, Styles.f20, Styles.m10, Styles.mBtm20]}>Select
                                        Attendance Status</Text>
                                </View>
                                <ScrollView>
                                    <List.Section>
                                        {
                                            this.state.attendenceTypes.map(item => {
                                                return (
                                                    <List.Item
                                                        onPress={() => {
                                                            if (item.value === 1) {
                                                                this.setState({userLogStatusModal: false},()=>{
                                                                    this.props.navigation.navigate('ScanQRcode', {UserFlow: 'UserAttendanceLog'});
                                                                })
                                                            } else {
                                                                Alert.alert('Are you sure you want to select ' + item.name + ' ?', alert,
                                                                    [{
                                                                        text: 'Yes', onPress: () => {  this.updateUserLogStatus(item.key)   }
                                                                    },{text: 'No'}
                                                                    ]
                                                                )
                                                            }
                                                        }}
                                                        style={{marign: 0, padding: 0,}}
                                                        theme={theme}
                                                        key={item.value}
                                                        title={item.name }
                                                        titleStyle={[Styles.ffMregular, Styles.colorBlue, Styles.f16, Styles.aslCenter, Styles.bw1, Styles.br100,
                                                            {
                                                                width: 210,
                                                                textAlign: 'center',
                                                                paddingHorizontal: 5,
                                                                paddingVertical: 10,
                                                                backgroundColor: '#fff',
                                                                color:  '#233167',
                                                                borderWidth:  1,
                                                            }]}
                                                    />
                                                );
                                            })
                                        }

                                    </List.Section>
                                </ScrollView>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => {
                            this.setState({userLogStatusModal: false},()=>{
                                this.props.navigation.goBack()
                            })
                        }} style={{marginTop: 20}}>
                            {LoadSVG.cancelIcon}
                        </TouchableOpacity>
                    </View>
                </Modal>

                {/*filters*/}
                <Modal transparent={true}
                       visible={this.state.filtersModal}
                       animated={true}
                       animationType='fade'
                       onRequestClose={() => {
                           this.setState({filtersModal: false})
                       }}>
                    <View style={[Styles.modalfrontPosition]}>
                        {this.state.spinnerBool === false ? null : <CSpinner/>}
                        <View
                            style={[[Styles.bw1, Styles.aslCenter, Styles.p15, Styles.br40, Styles.bgWhite, {
                                width: Dimensions.get('window').width - 30,
                            }]]}>
                            <View style={[Styles.bgWhite, {height: Dimensions.get('window').height / 1.3}]}>
                                <ScrollView>
                                    <Text
                                        style={[Styles.ffMbold, Styles.aslCenter, Styles.colorBlue, Styles.f20, Styles.m10, Styles.mBtm10]}>Select filters</Text>


                                    {/*FROM DATE*/}
                                    <Card style={[Styles.OrdersScreenCardshadow,Styles.m10]}
                                          onPress={() => {
                                              this.datePicker('filterFromDate')
                                          }}>
                                        <Card.Title
                                            style={[Styles.bgWhite]}
                                            // title={new Date().toDateString()}
                                            title={Services.returnCalendarFormat(this.state.filterFromDate)}
                                            titleStyle={[Styles.f18, Styles.ffMbold]}
                                            subtitle={'From Date'}
                                            rightStyle={[Styles.marH10]}
                                            right={() => <FontAwesome  name="calendar" size={30} color="#000"
                                            />}
                                        />
                                    </Card>

                                    {/*TO DATE*/}
                                    <Card style={[Styles.OrdersScreenCardshadow,Styles.m10]}
                                          onPress={() => {
                                              this.datePicker('filterToDate')
                                          }}>
                                        <Card.Title
                                            style={[Styles.bgWhite]}
                                            // title={new Date().toDateString()}
                                            title={Services.returnCalendarFormat(this.state.filterToDate)}
                                            titleStyle={[Styles.f18, Styles.ffMbold]}
                                            subtitle={'To Date'}
                                            rightStyle={[Styles.marH10]}
                                            right={() => <FontAwesome  name="calendar" size={30} color="#000"
                                            />}
                                        />
                                    </Card>


                                    {/*SITES DROPDOWN*/}
                                    <Text style={[Styles.ffMregular, Styles.aslStart, Styles.colorBlue, Styles.f16, Styles.mTop10,Styles.marH10]}>Select Site</Text>
                                    <Card style={[Styles.OrdersScreenCardshadow, Styles.marH10,Styles.mBtm10]}>
                                        <Picker
                                            itemStyle={[Styles.ffMregular, Styles.f18, Styles.colorBlue, Styles.aslCenter, Styles.bgGrn]}
                                            selectedValue={this.state.filterSiteId}
                                            mode='dropdown'
                                            onValueChange={(itemValue, itemIndex) => this.setState({filterSiteId: itemValue})}
                                        >
                                            {this.state.sitesList.map((item, index) => {
                                                return (< Picker.Item
                                                    label={item.id ? item.attrs.siteLable : item.siteLable}
                                                    value={item.id}
                                                    key={index}/>);
                                            })}
                                        </Picker>
                                    </Card>

                                    {/*ROLES LIST*/}
                                    <Text style={[Styles.ffMregular, Styles.aslStart, Styles.colorBlue, Styles.f16, Styles.mTop10,Styles.marH10]}>Select Role</Text>
                                    <Card style={[Styles.OrdersScreenCardshadow,Styles.marH10,Styles.mBtm10]}>
                                        <Picker
                                            itemStyle={[Styles.ffMregular, Styles.f18, Styles.colorBlue, Styles.aslCenter, Styles.bgGrn]}
                                            selectedValue={this.state.filterRoleId}
                                            mode='dropdown'
                                            onValueChange={(itemValue, itemIndex) => this.setState({filterRoleId: itemValue})}
                                        >
                                            {this.state.rolesList.map((item, index) => {
                                                return (< Picker.Item
                                                    label={Services.returnRoleName(item.key)}
                                                    value={item.value}
                                                    key={index}/>);
                                            })}
                                        </Picker>
                                    </Card>

                                    {/*LOG TYPES LIST*/}
                                    <Text style={[Styles.ffMregular, Styles.aslStart, Styles.colorBlue, Styles.f16, Styles.mTop10,Styles.marH10]}>Select Log Type</Text>
                                    <Card style={[Styles.OrdersScreenCardshadow,Styles.marH10,Styles.mBtm10]}>
                                        <Picker
                                            itemStyle={[Styles.ffMregular, Styles.f18, Styles.colorBlue, Styles.aslCenter, Styles.bgGrn]}
                                            selectedValue={this.state.filterLogStatus}
                                            mode='dropdown'
                                            onValueChange={(itemValue, itemIndex) => this.setState({filterLogStatus: itemValue})}
                                        >
                                            {this.state.logTypeList.map((item, index) => {
                                                return (< Picker.Item
                                                    label={item.name}
                                                    value={item.key}
                                                    key={index}/>);
                                            })}
                                        </Picker>
                                    </Card>


                                    <Card.Actions
                                        style={[Styles.row, Styles.jSpaceArd, Styles.pTop10, Styles.pBtm5]}>
                                        <Button title='Reset Filters ' color={'#1e90ff'} compact={true}
                                                onPress={() =>{
                                                    this.onTabChange(logTab)
                                                }}
                                        />
                                        <Button title=' Search '
                                                color={'#36A84C'}
                                                compact={true}
                                                onPress={() => {
                                                    this.setState({usersLogList: [],page: 1,searchActive:true},()=>{
                                                        this.getLogHistory();
                                                    })
                                                }
                                                }>></Button>
                                    </Card.Actions>


                                </ScrollView>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => {
                            this.setState({filtersModal: false})
                        }} style={{marginTop: 20}}>
                            {LoadSVG.cancelIcon}
                        </TouchableOpacity>
                    </View>
                </Modal>


            </View>
        );
    }
}

const styles = StyleSheet.create({
    appbar: {
        backgroundColor: "white"
    },
    section: {
        backgroundColor: "white"
    },
    container: {
        flex: 1,
        backgroundColor: "white"
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
