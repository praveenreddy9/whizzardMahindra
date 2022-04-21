import React from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View, ImageBackground, BackHandler, Alert
} from 'react-native';
import {CSpinner, CText, LoadImages, LoadSVG, Styles, SupervisorsModal} from '../common'
import Utils from "../common/Utils";
import Config from "../common/Config";
import Services from "../common/Services";
import {
    Appbar,
    Card,
    Chip, Colors,
    DefaultTheme,
    FAB, List,
    Provider as PaperProvider, Searchbar
} from "react-native-paper";
import _ from 'lodash';
import FontAwesome from 'react-native-vector-icons/dist/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/dist/MaterialIcons';
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import MapView, {Marker} from "react-native-maps";
import OfflineNotice from './../common/OfflineNotice';
import AsyncStorage from "@react-native-community/async-storage";
import OneSignal from "react-native-onesignal";
import HomeScreen from "../HomeScreen";
import MaterialCommunityIcons from "react-native-vector-icons/dist/MaterialCommunityIcons";

const theme = {
    ...DefaultTheme,
    fonts: {
        medium: 'Muli-Bold'
    }
};
const {width, height} = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE = 12.2602;
const LONGITUDE = 77.1461;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;


export default class TeamListingScreen extends React.Component {

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
        this.mapRef = null;
        this.state = {
            refreshing: false, spinnerBool: false,
            loggedInUserDetails: [], ProfileTab: 'Team', UserListOptionsModel: false,
            siteId: '', totalShiftsInfo: [], cancelShiftReasonModal: false,
            isMapReady: false,
            region: {
                latitude: LATITUDE,
                longitude: LONGITUDE,
                LATITUDE_DELTA: LATITUDE_DELTA,
                LONGITUDE_DELTA: LONGITUDE_DELTA
            },
            dayStatus: 0,
            isLoading: true, data: [], activitiesInfo: [], page: 1, ModalSupervisorVisible: false,
            SearchBarView: false,
            searchData: '',
            activityData: '',
            lat: null,
            long: null,
            isRefreshing: false,
            isAllowedAction: false,
            SitesData: [], CancelShiftReason: '', headerPopup: false, filterByRole: false,
            userRolePopup: false,userRolesList:[],
            displayRole: 'Select Role',
            userRoles: [],
            chipsList: [
                {status: '', name: 'All', value: 1},
                {status: 'SHIFT_IN_PROGRESS', name: 'On Duty', value: 4},
                {status: 'ATTENDANCE_MARKED', name: 'Present', value: 3},
                {status: 'INIT', name: 'Not Reported', value: 2},
                {status: 'SHIFT_ENDED', name: 'Completed', value: 5},
                {status: 'SHIFT_AUTOCLOSED', name: 'Auto Closed', value: 6},
                // {status: 'SHIFT_SUSPENDED', name: 'Suspended', value: 7},
                {status: 'SHIFT_CANCELLED_BY_SUPERVISOR', name: 'Cancelled', value: 8},
                {status: 'SHIFT_ENDED_BY_SUPERVISOR', name: 'Supervisor Ended', value: 9}, // Previsouly had SHIFT_CLOSED_BY_SUPERVISOR
            ],
            regularChipsList: [
                {status: '', name: 'All', value: 1},
                {status: 'SHIFT_IN_PROGRESS', name: 'On Duty', value: 4},
                {status: 'ATTENDANCE_MARKED', name: 'Present', value: 3},
                {status: 'INIT', name: 'Not Reported', value: 2},
                {status: 'SHIFT_ENDED', name: 'Completed', value: 5},
                {status: 'SHIFT_AUTOCLOSED', name: 'Auto Closed', value: 6},
                // {status: 'SHIFT_SUSPENDED', name: 'Suspended', value: 7},
                {status: 'SHIFT_CANCELLED_BY_SUPERVISOR', name: 'Cancelled', value: 8},
                {status: 'SHIFT_ENDED_BY_SUPERVISOR', name: 'Supervisor Ended', value: 9},
            ],
            adhocChipsList: [
                {status: '', name: 'All', value: 1},
                {status: 'SHIFT_IN_PROGRESS', name: 'On Duty', value: 4},
                {status: 'ATTENDANCE_MARKED', name: 'Present', value: 3},
                {status: 'SHIFT_ENDED', name: 'Completed', value: 5},
                {status: 'SHIFT_AUTOCLOSED', name: 'Auto Closed', value: 6},
            ],
            selectedChip: '', loggedUserRole: '', siteName: 'All Sites',siteCode: 'All Sites',
            showAdhocShifts: false,
            requestRoleValue:'',
        };
        // LogBox.ignoreAllLogs(value);

    }

    onBack = () => {
        return this.props.navigation.navigate('SiteListingScreen');
    };

    componentDidMount() {
        this.willBlur = this.props.navigation.addListener('willBlur', payload =>
            BackHandler.removeEventListener('hardwareBackPress', this.onBack)
        );
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            AsyncStorage.getItem('Whizzard:userRole').then((userRole) => {
                AsyncStorage.getItem('Whizzard:selectedSiteDetails').then((selectedSiteDetails) => {
                    const parsedselectedSiteDetails = JSON.parse(selectedSiteDetails);
                    this.setState({
                        userRole: userRole,
                        loggedUserRole: userRole,
                        siteId: parsedselectedSiteDetails.siteId,
                        siteName: parsedselectedSiteDetails.siteName,
                        siteCode: parsedselectedSiteDetails.siteCode,
                        selectedChip: ''
                    }, () => {
                        this.onRefresh();
                        // this.getUserLocations()
                    })
                });
            });
        })
    }

    componentWillUnmount() {
        this.didFocus.remove();
        this.willBlur.remove();
        BackHandler.removeEventListener('hardwareBackPress', this.onBack);
        Services.checkMockLocationPermission((response) => {
            if (response) {
                this.props.navigation.navigate('Login')
            }
        })
    }

    //error handling
    errorHandling(error) {
        console.log("Team Listing error", error, error.response);
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

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    roleBasedCount() {
        let siteInfo = this.state.totalShiftsInfo;
        const loggedUserRole = this.state.loggedUserRole;
        let totalElements = siteInfo.filter(function (shift) {
            return shift;
        }).length;
        let associativesCount = siteInfo.filter(function (shift) {
            return shift.role === 1;
        }).length;
        let driversCount = siteInfo.filter(function (shift) {
            return shift.role === 5;
        }).length;
        let ddaCount = siteInfo.filter(function (shift) {
            return shift.role === 10;
        }).length;
        let laboursCount = siteInfo.filter(function (shift) {
            return shift.role === 15;
        }).length;
        let paCount = siteInfo.filter(function (shift) {
            return shift.role === 19;
        }).length;
        let shiftLeadCount = siteInfo.filter(function (shift) {
            return shift.role === 25;
        }).length;
        let hubManagerCount = siteInfo.filter(function (shift) {
            return shift.role === 26;
        }).length;
        let financeCount = siteInfo.filter(function (shift) {
            return shift.role === 27;
        }).length;
        let technologyCount = siteInfo.filter(function (shift) {
            return shift.role === 28;
        }).length;
        let centralCount = siteInfo.filter(function (shift) {
            return shift.role === 29;
        }).length;
        let cmCount = siteInfo.filter(function (shift) {
            return shift.role === 30;
        }).length;
        let omCount = siteInfo.filter(function (shift) {
            return shift.role === 31;
        }).length;
        let cityManagerCount = siteInfo.filter(function (shift) {
            return shift.role === 35;
        }).length;
        let othersCount = siteInfo.filter(function (shift) {
            return shift.role >= 19;
        }).length;
        this.setState({
            totalElements: totalElements,
            userRoles: [{roleName: 'Associate', value: 1, count: associativesCount},
                {roleName: 'Driver', value: 5, count: driversCount},
                {roleName: 'Driver & Associate', value: 10, count: ddaCount},
                // {roleName: 'Labourer', value: 15, count: laboursCount},
                {roleName: 'Process Associate', value: 19, count: paCount},
                {roleName: 'Shift Lead', value: 25, count: shiftLeadCount},
                {roleName: 'Hub Manager', value: 26, count: hubManagerCount},
                // {roleName: 'Finance', value: 27, count: financeCount},
                // {roleName: 'Technology', value: 28, count: technologyCount},
                {roleName: 'Central', value: 29, count: centralCount}
            ],
            filterByRole: true,
            searchData: '',
            activityData: '',
            headerPopup: false,
            userRolePopup: true
        })
    }


    //API CALL to get shifts at particular loactiion
    supervisorShiftData() {
        // const self = this;
        // self.setState({data: []});
        // const getShiftsAtSiteURL = Config.routes.BASE_URL + Config.routes.GET_SHIFTS_FROM_SITE_ID + '?siteId=' + self.state.siteId + '&daysToAdd=' + self.state.dayStatus + '&userName=';
        // const body = '';
        // this.setState({spinnerBool: true}, () => {
        //     Services.AuthHTTPRequest(getShiftsAtSiteURL, "GET", body, function (response) {
        //         if (response.status === 200) {
        //             console.log('Teamlisting resp200', response.data);
        //             self.setState({totalShiftsResponse:response.data},()=>{
        //                 self.manageShiftsData()
        //             })
        //         }
        //     }, function (error) {
        //         self.errorHandling(error);
        //     })
        // });
    }

    //API CALL to get shifts based on siteId
    getShiftsList() {
        const self = this;
        const {page,totalShiftsInfo} = this.state;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_SHIFTS_LIST_BASED_ON_SITE;
        const body = {
            siteId: self.state.siteId,
            daysToAdd: self.state.dayStatus,
            showRegularShifts: !self.state.showAdhocShifts,
            shiftRole:self.state.requestRoleValue,
            shiftStatus : self.state.selectedChip,
            userName:self.state.searchData,
            page: page,
            sort: "name,desc",
            size: 15
        };
        // console.log('shifts list body',body);
        this.setState({spinnerBool: true,}, () => {
            Services.AuthHTTPRequest(apiURL, "POST", body, function (response) {
                if (response.status === 200) {
                    // console.log('shifts list resp200', response);
                    self.setState({
                        totalShiftsInfo: page === 1 ? response.data.content : [...totalShiftsInfo, ...response.data.content],
                        refreshing: false,
                        isRefreshing: false,
                        totalPages: response.data.totalPages,
                        totalElements: response.data.totalElements,
                        spinnerBool: false})
                }
            }, function (error) {
                self.errorHandling(error);
            })
        });
    }

    //API CALL to get superviors list based in site id
    getSupervisorsList() {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_SUPERVISORS_LIST_BASED_ON_SITE + '?siteId=' + self.state.siteId;
        const body = {};
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "GET", body, function (response) {
                if (response.status === 200) {
                    self.setState({
                        SupervisorDetails:response.data,ModalSupervisorVisible: true,headerPopup: false,
                        spinnerBool: false})
                }
            }, function (error) {
                self.errorHandling(error);
            })
        });
    }

    //API CALL to get roles count based in site id
    getRolesCount() {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_ROLES_COUNT_BASED_ON_SITE;
        const body = {
            siteId: self.state.siteId,
            daysToAdd: self.state.dayStatus,
            showRegularShifts: !self.state.showAdhocShifts,
            shiftStatus : self.state.selectedChip,
            userName:'',
        };
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "POST", body, function (response) {
                if (response.status === 200) {
                    // console.log('roles count',response.data);
                    self.setState({
                        userRolesList:response.data,

                        filterByRole: true,
                        searchData: '',
                        activityData: '',
                        headerPopup: false,
                        userRolePopup: true,
                        spinnerBool: false})
                }
            }, function (error) {
                self.errorHandling(error);
            })
        });
    }

    filterData(data) {
        if (this.state.ProfileTab === 'Team') {
            let sitesData = this.state.totalShiftsInfo;
            let filterData = [];
            if (data) {
                for (let i = 0; i < sitesData.length; i++) {
                    if (data === sitesData[i].shiftStatus) {
                        filterData.push(sitesData[i]);
                    }
                }
                this.setState({totalShiftsInfo: filterData, totalElements: filterData.length,});
            }
        } else if (this.state.ProfileTab === 'Map') {
            let coordinates = this.state.filterCoordinates;
            let mapFilterByChip = [];
            if (data) {
                for (let j = 0; j < coordinates.length; j++) {
                    if (data === coordinates[j].status) {
                        mapFilterByChip.push(coordinates[j]);
                    }
                }
                this.setState({coordinates: mapFilterByChip, coordinatesCount: mapFilterByChip.length});
            }
        }
    }

    searchFilter(data) {
        let filteredData = this.state.totalShiftsInfo.filter(function (item) {
            return item.userName.toUpperCase().includes(data.toUpperCase());
        });
        this.setState({totalShiftsInfo: filteredData});
    }

    filterByRole(data) {
        this.setState({selectedChip: '', selectedRoleFilter: data})
        if (this.state.ProfileTab === 'Team') {
            let filteredData = this.state.totalShiftsInfo.filter(function (item) {
                return item.role === parseInt(data);
            });
            this.setState({totalShiftsInfo: filteredData, data: '', totalElements: filteredData.length,});
        } else if (this.state.ProfileTab === 'Map') {
            let filteredData = this.state.filterCoordinates.filter(function (item) {
                return item.role === parseInt(data);
            });
            this.setState({coordinates: filteredData, data: '', coordinatesCount: filteredData.length,});
        }
    }

    activityFilter(data) {
        let filteredData = this.state.activitiesInfo.filter(function (item) {
            return item.activity.toUpperCase().includes(data.toUpperCase());
        });
        // this.setState({data: filteredData});
        this.setState({activitiesInfo: filteredData});
    }


    //get site based activities
    userActivities() {
        const self = this;
        const {data, page,activitiesInfo} = this.state;
        const userActivityURL = Config.routes.BASE_URL + Config.routes.USER_ACTIVITIES + '?siteId=' + self.state.siteId + '&daysToAdd=' + self.state.dayStatus;
        const body = {
            page: self.state.page,
            sort: "name,desc",
            size: 10
        };
        this.setState({spinnerBool: false}, () => {
            Services.AuthHTTPRequest(userActivityURL, 'POST', body, function (response) {
                if (response.status === 200) {
                    self.setState({
                        // isLoading: false,
                        // data: page === 1 ? response.data.content : [...data, ...response.data.content],
                        activitiesInfo: page === 1 ? response.data.content : [...activitiesInfo, ...response.data.content],
                        spinnerBool: false,
                        refreshing: false,
                        isRefreshing: false,
                        totalPages: response.data.totalPages
                    })
                }
            }, function (error) {
                self.errorHandling(error);
            })
        })
    }

    handleLoadMore = () => {
        this.state.page < this.state.totalPages ?
            this.setState({
                page: this.state.page + 1,
            }, () => {
                if (this.state.totalPages >= this.state.page) {
                    if (this.state.ProfileTab === 'Team') {
                        this.getShiftsList();
                    } else if (this.state.ProfileTab === 'Activity') {
                        this.userActivities();
                    }
                }
            }) : null
    }

    renderFooter = () => {
        return (
            this.state.page < this.state.totalPages ?
                <View>
                    <ActivityIndicator animating size="large"/>
                </View> : null
        );
    };

    handleRefresh = () => {
        this.setState({
            isRefreshing: true,
        }, () => {
            if (this.state.ProfileTab === 'Team') {
                this.getShiftsList();
            } else if (this.state.ProfileTab === 'Activity') {
                this.userActivities();
            }
        });
    };


    //User Activities list view
    activityList(item) {
        let Activity = item;
        return (
            <Card style={[Styles.bgWhite, styles.shadow, {
                marginBottom: 15,
                borderRadius: 0,
                padding: 5,
                borderWidth: 1,
                borderBottomWidth: 1,
                borderLeftWidth: 3,
                borderTopWidth: 1,
                borderRightWidth: 1,
                borderLeftColor: '#000',
                borderRightColor: 'rgba(87,87,87,0.17)',
                borderTopColor: 'rgba(87,87,87,0.17)',
                borderBottomColor: 'rgba(87,87,87,0.17)',
            }]}>
                <View
                                  style={[Styles.row, {margin: 5}]}>
                    {Services.returnNotificationIcons(Activity)}
                    <Text
                        style={[Styles.ffLRegular, Styles.aslCenter, {
                            paddingRight: 30,
                            paddingLeft: 10
                        }]}>{Activity.activityTime}-{this.replaceBoldText(Activity.activity)}</Text>
                </View>
            </Card>
        )
    }

    replaceBoldText(actualText) {
        return (
            actualText
        )
    }


    onMapLayout = () => {
        this.setState({isMapReady: true});
        this.mapRef.fitToCoordinates(this.state.coordinates, {
            edgePadding: {top: 0, right: 0, bottom: 0, left: 0},
            animated: true
        })
    }

    userShifts(item) {
        return (
            <PaperProvider theme={theme}>
                <View>
                    <Card
                        onPress={() => {
                            const selectedUserSiteDetails = {
                                siteId: this.state.siteId,
                                siteName: this.state.siteName,
                                siteCode: this.state.siteCode,
                                dayStatus: this.state.dayStatus,
                                userId: item.userId,
                                shiftId: item.shiftId,
                                toScreen: 'userShiftActions'
                            }
                            Utils.setToken('selectedUserSiteDetails', JSON.stringify(selectedUserSiteDetails), function () {
                            })
                            this.props.navigation.navigate('userShiftActions')
                        }}
                        style={[
                            Styles.OrdersScreenCardshadow,
                            this.state.showAdhocShifts ? Styles.bgLBrown : Styles.bgWhite, {
                                marginBottom: 10,
                                padding: 5,
                                borderRadius: 0,
                                // borderBottomWidth:0.5,
                                // borderBottomColor: '#ccc'

                            }]}>
                        <Card.Title
                            left={() =>
                                <View style={{position: 'relative'}}>
                                    {Services.getUserProfilePic(item.profilePicUrl)}
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
                                                backgroundColor: Services.getShiftStatusColours(item.shiftStatus),
                                                borderRadius: 25
                                            }}> </Text>
                                        </View>
                                    </View>
                                </View>}
                            // title={<Text><Text style={[Styles.f18,Styles.ffLBold]}>{_.startCase(_.toLower(item.userName))}</Text> <Text style={[Styles.f14,Styles.ffLRegular]}>( {item.siteCode} )</Text> </Text> }
                            title={<Text><Text
                                style={[Styles.f18, Styles.ffLBold]}>{_.startCase(_.toLower(item.userName))}</Text></Text>}
                            titleStyle={[Styles.ffLBold, Styles.f18, Styles.colorBlue]}
                            subtitleStyle={[Styles.ffLRegular]}
                            subtitle={
                                <Text><Text
                                    style={[Styles.f14, Styles.colorBlue, Styles.ffLBold]}>{item.siteCode}-</Text> <Text
                                    style={[Styles.f14, Styles.ffLRegular, Styles.colorBlue]}>{Services.getUserRolesShortName(item.role)} ({Services.getShiftTimings(item)})</Text></Text>
                                // (Services.getUserRoles(item.role)) + ' ( ' + Services.getShiftTimings(item) + ' )'
                            }
                            right={() =>
                                <MaterialIcons name="chevron-right" size={35} style={{color: '#233167', padding: 3}}/>
                            }
                        >
                        </Card.Title>
                    </Card>
                </View>
            </PaperProvider>
        )
    }


    //get user locations
    getUserLocations() {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_LOCATIONS_BY_SITE_ID + '?siteId=' + self.state.siteId + '&daysToAdd=' + self.state.dayStatus;
        const body = '';
        self.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                self.setState({coordinates: []})
                const usersLocationsData = response.data;
                if (usersLocationsData.length > 0) {
                    const coordinates = [];
                    if (usersLocationsData.length > 0) {
                        for (let i = 0; i < usersLocationsData.length; i++) {
                            if (usersLocationsData[i].latLong != null) {
                                let data = {};
                                data.LatLng = {};
                                let latitude = usersLocationsData[i].latLong.latitude;
                                let longitude = usersLocationsData[i].latLong.longitude;
                                data.LatLng.latitude = latitude;
                                data.LatLng.longitude = longitude;
                                data.latitude = latitude;
                                data.longitude = longitude;
                                data.id = i;
                                data.title = usersLocationsData[i].fullName;
                                data.phoneNumber = usersLocationsData[i].phoneNumber;
                                data.role = usersLocationsData[i].userRole;
                                data.status = usersLocationsData[i].status;
                                data.picUrl = usersLocationsData[i].profilePicURL;
                                data.shiftId = usersLocationsData[i].shiftId;
                                data.userId = usersLocationsData[i].userId;
                                data.locationUpdateTimeDiff = usersLocationsData[i].locationUpdateTimeDiff;
                                if (usersLocationsData[i].locationUpdatedAt != null) {
                                    data.locationDate = new Date(usersLocationsData[i].locationUpdatedAt).toDateString();
                                    data.time = usersLocationsData[i].locationTime;
                                    // data.time = new Date(usersLocationsData[i].locationUpdatedAt).getHours() + ":" + new Date(usersLocationsData[i].locationUpdatedAt).getMinutes();
                                }
                                coordinates.push(data);
                                if (coordinates) {
                                    self.roleBasedCount(coordinates)
                                }
                                self.setState({
                                    showMaps: true,
                                    coordinates: coordinates,
                                    coordinatesCount: coordinates.length,
                                    filterCoordinates: coordinates,
                                    spinnerBool: false,
                                    lat: coordinates[0].LatLng.latitude,
                                    long: coordinates[0].LatLng.longitude,
                                    LAST_INDEX: usersLocationsData.length - 1
                                })
                            }
                        }

                    } else {
                        Utils.dialogBox('No users on Field', '');
                        self.setState({
                            showMaps: false,
                            coordinates: coordinates,
                            spinnerBool: false
                        })
                    }
                } else {
                    self.setState({
                        spinnerBool: false,
                        showMaps: false,
                    })
                    Utils.dialogBox('No users on Field', '')
                }
                self.setState({usersLocationsData: usersLocationsData, spinnerBool: false});
            }, function (error) {
                self.errorHandling(error);
            })
        })
    }

    //TABS DATA
    UsersListTabInfo() {
        const {isRefreshing} = this.state;
        if (this.state.ProfileTab === 'Team') {
            return (
                <View style={[Styles.flex1,Styles.bgDWhite]} refreshControl={
                    <RefreshControl
                        refreshing={this.state.refreshing}
                        onRefresh={this.onRefresh.bind(this)}/>
                }>
                    {
                        this.state.totalShiftsInfo.length === 0
                            ?
                            <Card.Title titleStyle={[Styles.marV1, Styles.txtAlignCen, Styles.ffLBold]}
                                        title="No Shifts found for this Site"
                            />
                            :
                            null
                    }
                    <FlatList
                        data={this.state.totalShiftsInfo}
                        renderItem={({item}) => (this.userShifts(item))}
                        keyExtractor={(item, index) => index.toString()}
                        refreshing={isRefreshing}
                        onRefresh={this.handleRefresh}
                        onEndReached={this.handleLoadMore}
                        onEndReachedThreshold={1}
                        ListFooterComponent={this.renderFooter}
                     />
                </View>
            )
        } else if (this.state.ProfileTab === 'Map') {
            return (
                <View style={[Styles.flex1]}>
                    <View>
                        <View style={[{height: height}]}>
                            {
                                this.state.coordinates ?
                                    this.state.coordinates.length > 0
                                        ?
                                        <MapView
                                            ref={(ref) => {
                                                this.mapRef = ref
                                            }}
                                            initialRegion={{
                                                latitude: this.state.lat,
                                                longitude: this.state.long,
                                                latitudeDelta: LATITUDE_DELTA,
                                                longitudeDelta: LONGITUDE_DELTA,
                                            }}
                                            style={StyleSheet.absoluteFill}// eslint-disable-line react/jsx-no-bind
                                            loadingEnabled={true}
                                            showsUserLocation
                                            zoomEnabled={true}
                                            scrollEnabled={true}
                                            showsScale={true}
                                            onMapReady={this.onMapLayout}
                                            showsMyLocationButton={true}
                                            zoomTapEnabled={true}
                                            zoomControlEnabled={true}
                                        >
                                            {
                                                this.state.isMapReady &&
                                                this.state.coordinates.map(coordinate => (
                                                    <Marker
                                                        coordinate={{
                                                            latitude: coordinate.LatLng.latitude,
                                                            longitude: coordinate.LatLng.longitude
                                                        }}

                                                        pinColor={this.state.dayStatus === 0 ? '#00d033' : this.state.dayStatus === -1 ? 'red' : null}
                                                        pointerEvents='auto'
                                                        mapType={'standard'}
                                                        // onPress={()=>this.props.navigation.navigate('ShiftSummary', {shiftId:coordinate.shiftId})}
                                                        key={coordinate.id}>
                                                        {
                                                            this.state.dayStatus === -1
                                                                ?
                                                                LoadSVG.marker_yesterday
                                                                :
                                                                this.state.dayStatus === 0
                                                                    ?
                                                                    coordinate.status === "ATTENDANCE_MARKED"
                                                                        ?
                                                                        LoadSVG.marker_today_present
                                                                        :
                                                                        coordinate.status === "SHIFT_IN_PROGRESS"
                                                                            ?
                                                                            LoadSVG.marker_today_started
                                                                            :
                                                                            coordinate.status === "SHIFT_ENDED"
                                                                                ?
                                                                                LoadSVG.marker_today_ended
                                                                                :
                                                                                LoadSVG.marker_others
                                                                    :
                                                                    LoadSVG.marker_others

                                                        }

                                                        <MapView.Callout
                                                            // onPress={()=>this.props.navigation.navigate('ShiftSummary',
                                                            //     {shiftId:coordinate.shiftId})}
                                                            onPress={() => {
                                                                const selectedUserSiteDetails = {
                                                                    siteId: this.state.siteId,
                                                                    siteName: this.state.siteName,
                                                                    siteCode: this.state.siteCode,
                                                                    dayStatus: this.state.dayStatus,
                                                                    userId: coordinate.userId,
                                                                    shiftId: coordinate.shiftId,
                                                                    toScreen: 'userShiftActions'
                                                                }
                                                                Utils.setToken('selectedUserSiteDetails', JSON.stringify(selectedUserSiteDetails), function () {
                                                                })
                                                                this.props.navigation.navigate('userShiftActions')
                                                            }}

                                                        >
                                                            <View style={{
                                                                borderRadius: 10,
                                                                padding: 7,
                                                                width: 250,
                                                                flexDirection: 'row'
                                                            }}>
                                                                <View style={{
                                                                    // textAlign: 'center',
                                                                    marginRight: 5,
                                                                    flex: 1 / 2,
                                                                }}>
                                                                    <ImageBackground style={{
                                                                        height: 80,
                                                                        width: 80,
                                                                        // backgroundColor:'yellow'
                                                                    }} source={LoadImages.user_pic}>
                                                                        {coordinate.picUrl ?
                                                                            <Text>
                                                                                <Image
                                                                                    style={{
                                                                                        height: 80,
                                                                                        width: 80,
                                                                                        resizeMode: 'cover',
                                                                                        backgroundColor: 'red'
                                                                                    }}
                                                                                    source={{
                                                                                        uri: coordinate.picUrl,
                                                                                    }}
                                                                                />
                                                                            </Text>
                                                                            :
                                                                            <FontAwesome
                                                                                name="user-circle-o"
                                                                                size={55}
                                                                                color="#000"
                                                                                style={{padding: 5}}/>
                                                                        }
                                                                    </ImageBackground>
                                                                </View>

                                                                <View style={{flex: 1}}>
                                                                    <MaterialIcons name='navigate-next' size={30}
                                                                                   color='#000'
                                                                        // color='#b2beb5'
                                                                                   style={[Styles.txtAlignRt]}/>
                                                                    <Text
                                                                        style={[Styles.aslStart]}> {_.startCase(coordinate.title)}{"\n"}
                                                                        {Services.getShiftStatusName(coordinate.status) || '---'}{"\n"}
                                                                        {Services.getUserRoles(coordinate.role) || '---'}{"\n"}
                                                                        Updated {coordinate.locationUpdateTimeDiff || '---'}
                                                                    </Text>
                                                                </View>


                                                            </View>
                                                        </MapView.Callout>
                                                    </Marker>
                                                ))
                                            }
                                        </MapView>
                                        :
                                        <MapView
                                            initialRegion={{
                                                latitude: LATITUDE,
                                                longitude: LONGITUDE,
                                                latitudeDelta: LATITUDE_DELTA,
                                                longitudeDelta: LONGITUDE_DELTA,
                                            }}
                                            style={StyleSheet.absoluteFill}// eslint-disable-line react/jsx-no-bind
                                            loadingEnabled={true}>
                                            {/* {
                                                Utils.dialogBox('No Location data found =====>', '')
                                            }*/}
                                        </MapView>
                                    : null
                            }
                        </View>
                    </View>
                </View>
            )
        } else if (this.state.ProfileTab === 'Activity') {
            return (
                <View style={[Styles.flex1,Styles.bgDWhite]} refreshControl={
                    <RefreshControl
                        refreshing={this.state.refreshing}
                        onRefresh={this.onRefresh.bind(this)}/>
                }>
                    {
                        this.state.activitiesInfo.length === 0
                            ?
                            <Card.Title titleStyle={[Styles.marV1, Styles.txtAlignCen, Styles.ffLBold]}
                                        title="No Activities Found.."
                            />
                            :
                            null
                    }
                    <FlatList
                        data={this.state.activitiesInfo}
                        renderItem={({item}) => (this.activityList(item))}
                        keyExtractor={(item, index) => index.toString()}
                        refreshing={isRefreshing}
                        onRefresh={this.handleRefresh}
                        onEndReached={this.handleLoadMore}
                        onEndReachedThreshold={1}
                        ListFooterComponent={this.renderFooter}
                    />

                </View>
            )
        }
    }

    previousDate() {
        const self = this;
        if (self.state.dayStatus === 1) {
            self.setState({dayStatus: 0, page: 1}, () => {
                self.onRefresh();
            });
        } else if (self.state.dayStatus === 0) {
            self.setState({dayStatus: -1, activitiesInfo: '', page: 1}, () => {
                self.onRefresh();
            });
        }
    }

    nextDate() {
        const self = this;
        if (self.state.dayStatus === -1) {
            self.setState({dayStatus: 0, page: 1}, () => {
                self.onRefresh();
            });
        } else if (self.state.dayStatus === 0) {
            self.setState({dayStatus: 1, page: 1}, () => {
                self.onRefresh();
            });
        }
    }


    onRefresh() {
        this.setState({
            page: 1,
            SearchBarView: false, selectedChip: ''
        })
        if (this.state.ProfileTab === 'Team') {
            this.setState({totalShiftsInfo: [], SearchBarView: false, displayRole: 'Select Role', filterRoleValue: ''});
            this.getShiftsList();
        } else if (this.state.ProfileTab === 'Activity') {
            this.setState({SearchBarView: false});
            this.userActivities();
        } else if (this.state.ProfileTab === 'Map') {
            this.setState({SearchBarView: false});
            this.getUserLocations()
        }
    }

    render() {
        if (this.state.refreshing) {
            return (
                <View style={[Styles.flex1, Styles.alignCenter]}>
                    {/*<ActivityIndicator/>*/}
                    <ActivityIndicator animating size="large"/>
                </View>
            );
        }
        const {showAdhocShifts, ProfileTab, loggedUserRole} = this.state;
        return (
            this.state.totalShiftsInfo
                ?
                <View style={[[Styles.flex1, Styles.bgWhite, {width: Dimensions.get('window').width}]]}>
                    <OfflineNotice/>
                    <View style={[Styles.bgWhite]}>
                        <Appbar.Header theme={theme} style={Styles.bgDarkRed}>
                            <Appbar.BackAction onPress={() => this.onBack()}/>
                            {/*<Appbar.Action icon="menu"/>*/}
                            <Appbar.Content
                                titleStyle={[Styles.ffLBlack, Styles.f16, Styles.cWhite]}
                                // title={this.state.siteName}/>
                                title={this.state.siteCode}/>

                            <View
                                style={[Styles.bgDarkRed, Styles.aslCenter, Styles.padH10, Styles.row, Styles.br25,]}>
                                <Text
                                    style={[Styles.ffLBlack, Styles.f16, Styles.aslCenter, Styles.cWhite]}>Lite User</Text>
                                <MaterialCommunityIcons name={showAdhocShifts ? "toggle-switch-off" : "toggle-switch"}
                                                        size={40} color="#fff" style={[Styles.padH5]}
                                                        onPress={() => {
                                                            this.setState({
                                                                showAdhocShifts: !showAdhocShifts,
                                                                selectedChip: '',
                                                                chipsList: !showAdhocShifts ? this.state.adhocChipsList : this.state.regularChipsList,
                                                                ProfileTab: !showAdhocShifts ? ProfileTab === 'Map' ? 'Team' : ProfileTab : ProfileTab,
                                                                page:1
                                                            }, () => {
                                                                this.getShiftsList()
                                                            })
                                                        }}/>
                                <Text
                                    style={[Styles.ffLBlack, Styles.f16, Styles.aslCenter, Styles.cWhite]}>Regular</Text>
                            </View>

                            {
                                this.state.SearchBarView === false && this.state.filterByRole === false && this.state.headerPopup === false ?
                                    <Appbar.Action icon="more-vert" onPress={() => this.setState({headerPopup: true})}/>
                                    :
                                    <Appbar.Action onPress={() => {
                                        this.setState({
                                            SearchBarView: false,
                                            searchData: '',
                                            activityData: '',
                                            filterByRole: false,
                                            headerPopup: false,
                                            filteredData: '',
                                            requestRoleValue:'',
                                        }, () => {
                                            this.onRefresh()
                                        })
                                    }} icon="cancel" color={'red'}/>
                            }
                        </Appbar.Header>
                    </View>

                    {/*Search bar of shifts,activity*/}
                    {
                        this.state.SearchBarView === true && this.state.ProfileTab === 'Team'
                            ?
                            <Searchbar
                                style={[Styles.mTop5,{marginHorizontal: 12}]}
                                isFocused="false"
                                placeholder="Search by Name or Number"
                                onChangeText={searchData => {
                                    this.setState({searchData: searchData,page:1},()=>{
                                        this.getShiftsList()
                                    })
                                    // this.searchFilter(searchData)
                                }}
                                onSubmitEditing={()=>{this.getShiftsList()}}
                                value={this.state.searchData}
                            />
                            :
                            this.state.SearchBarView === true && this.state.ProfileTab === 'Activity'
                                ?
                                <Searchbar
                                    style={[Styles.mTop5,{marginHorizontal: 12}]}
                                    isFocused="false"
                                    placeholder="Search Activity"
                                    onChangeText={activityData => {
                                        this.setState({activityData: activityData},()=>{
                                            this.activityFilter(activityData)
                                        })
                                    }}
                                    value={this.state.activityData}
                                /> : null
                    }

                    {/*Filter by Roles dropdown*/}
                    {
                        this.state.filterByRole === true && (this.state.ProfileTab === 'Team' || this.state.ProfileTab === 'Map')
                            ?
                            <Card
                                style={[Styles.m10, Styles.bcAsh, Styles.bw1]}>
                                <TouchableOpacity onPress={() => this.setState({userRolePopup: true})}>
                                    <Card.Title
                                        style={[{height: 50}]}
                                        title={this.state.displayRole}
                                        titleStyle={[Styles.f16, Styles.ffLBold]}
                                        right={() =>
                                            <View style={[Styles.row, {paddingRight: 20}]}>
                                                <Ionicons name='md-arrow-dropdown' size={30}/>
                                            </View>
                                        }
                                    />
                                </TouchableOpacity>
                            </Card>
                            : null
                    }

                    {/*CARD OF DATES CHANGES*/}
                    <View style={{padding: 10, backgroundColor: '#fff'}}>
                        <Card style={{
                            backgroundColor: '#F8F9FA', shadowColor: "#000",
                            shadowOffset: {
                                width: 0,
                                height: 1,
                            },
                            shadowOpacity: 0.22,
                            shadowRadius: 2.22,
                            elevation: 3,
                        }}>
                            <View style={[Styles.row, Styles.jSpaceBet]}>
                                <View>
                                    {this.state.dayStatus === -1 ?
                                        <View style={{paddingVertical: 10, paddingHorizontal: 30}}/>
                                        :
                                        <Ionicons name="md-arrow-dropleft" size={45}
                                                  style={{paddingVertical: 10, paddingHorizontal: 30}}
                                                  onPress={() => {
                                                      this.previousDate();
                                                      this.setState({
                                                          SearchBarView: false,
                                                          filterByRole: false
                                                      },()=>{
                                                          this.onRefresh();
                                                      })
                                                  }}/>
                                    }</View>
                                <View style={[Styles.aslCenter]}>
                                    <Text
                                        style={[Styles.f18, Styles.ffLBold]}>
                                        {this.state.ProfileTab === 'Map' ? this.state.dayStatus === 0 ?
                                                'Today' + ' ' + '(' + (this.state.coordinatesCount ? this.state.coordinatesCount : '0') + ')'
                                                : this.state.dayStatus === 1 ? 'Tomorrow' + ' ' + '(' + (this.state.coordinatesCount ? this.state.coordinatesCount : '0') + ')'
                                                    : this.state.dayStatus === -1 ? 'Yesterday' + ' ' + '(' + (this.state.coordinatesCount ? this.state.coordinatesCount : '0') + ')'
                                                        : null
                                            : this.state.ProfileTab === 'Team' ?
                                                this.state.dayStatus === 0 ? 'Today' + ' ' + '(' + (this.state.totalElements ? this.state.totalElements : '0') + ')' :
                                                    this.state.dayStatus === 1 ? 'Tomorrow' + ' ' + '(' + (this.state.totalElements ? this.state.totalElements : '0') + ')' :
                                                        this.state.dayStatus === -1 ? 'Yesterday' + ' ' + '(' + (this.state.totalElements ? this.state.totalElements : '0') + ')' : '0'
                                                :
                                                this.state.ProfileTab === 'Activity' ?
                                                    this.state.dayStatus === 0 ? 'Today' :
                                                        this.state.dayStatus === 1 ? 'Tomorrow' :
                                                            this.state.dayStatus === -1 ? 'Yesterday' : null : null
                                        }
                                    </Text>
                                    <Text
                                        style={[Styles.f14, Styles.ffLBold, Styles.aslCenter]}>{Services.returnDifferentDates(this.state.dayStatus)}</Text>
                                </View>
                                <View>
                                    {this.state.ProfileTab === 'Map' && this.state.dayStatus === 0 || this.state.dayStatus === 1
                                        ?
                                        // <Ionicons name="md-arrow-dropright" size={45} color='#f5f5f5'
                                        //           style={{paddingVertical: 10, paddingHorizontal: 30}}
                                        // />
                                        <View style={{paddingVertical: 10, paddingHorizontal: 30}}/>
                                        :
                                        <Ionicons name="md-arrow-dropright" size={45}
                                                  style={{paddingVertical: 10, paddingHorizontal: 30}}
                                                  onPress={() => {
                                                      this.nextDate();
                                                      this.setState({
                                                          SearchBarView: false,
                                                          filterByRole: false
                                                      },()=>{
                                                          this.onRefresh();
                                                      })
                                                  }
                                                  }/>
                                    }
                                </View>
                            </View>
                        </Card>
                    </View>


                    {this.renderSpinner()}

                    {/*CHIPS SECTION*/}
                    <View
                        style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', padding: 10}}>
                        {/* CHIPS SECTION */}
                        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}
                                    style={[Styles.row]}>
                            {this.state.chipsList.map((item, index) => {
                                return (
                                    <Chip key={index}
                                          style={[{
                                              backgroundColor: this.state.selectedChip === item.status ? '#db2b30' : '#afadaf',
                                              marginHorizontal: 5
                                          }]}
                                          textStyle={[Styles.ffLBold, Styles.cWhite]}
                                          onPress={() => {
                                              this.setState({selectedChip: item.status, page: 1}, () => {
                                                  this.state.selectedChip === '' ?
                                                      this.onRefresh()
                                                      :
                                                      this.getShiftsList()
                                              })
                                          }}>{item.name}{item.status === '' ? null :
                                        <FontAwesome name="circle" style={[Styles.aslCenter]} size={20}
                                                     color={Services.getShiftStatusColours(item.status)}/>}</Chip>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* TABS FOR TEAM,ACTIVITY,MAP */}
                    <View style={[Styles.row, Styles.m10]}>
                        <TouchableOpacity onPress={() => {
                            this.setState({ProfileTab: 'Team'}, () => {
                                this.onRefresh();
                            })
                        }}
                                          style={[Styles.flex1, Styles.aitCenter,
                                              this.state.ProfileTab === 'Team'
                                                  ?
                                                  {borderBottomWidth: 3, borderBottomColor: '#233167'} : null
                                          ]}>
                            <CText cStyle={[Styles.colorBlue, Styles.f18, Styles.pBtm5, Styles.ffLBold]}>Team</CText>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => {
                            this.setState({ProfileTab: 'Activity'}, () => {
                                this.onRefresh();
                            })
                        }}
                                          style={[Styles.flex1, Styles.aitCenter, this.state.ProfileTab === 'Activity' ? {
                                              borderBottomWidth: 3,
                                              borderBottomColor: '#233167'
                                          } : null
                                          ]}>
                            <CText
                                cStyle={[Styles.colorBlue, Styles.f18, Styles.pBtm5, Styles.ffLBold]}>Activity</CText>
                        </TouchableOpacity>
                        {
                            !showAdhocShifts
                                ?
                                <TouchableOpacity
                                    disabled={this.state.dayStatus === 1}
                                    onPress={() => {
                                        this.setState({ProfileTab: 'Map'}, () => {
                                            this.onRefresh();
                                        })
                                    }}
                                    style={[Styles.flex1, Styles.aitCenter, this.state.ProfileTab === 'Map' ? {
                                        borderBottomWidth: 3,
                                        borderBottomColor: '#233167'
                                    } : null]}>
                                    <CText
                                        cStyle={[Styles.colorBlue, Styles.f18, Styles.pBtm5, Styles.ffLBold]}>Map</CText>
                                </TouchableOpacity>
                                :
                                null
                        }
                    </View>

                    {/*pull to refresh will enable in map view*/}
                    <View style={[Styles.flex1, {backgroundColor: '#fff', padding: 8}]}>
                        {this.UsersListTabInfo()}
                    </View>

                    {this.state.ProfileTab === 'Team' && this.state.dayStatus === 0 || this.state.dayStatus === 1 ?
                        <View style={{position: "absolute", bottom: 10, right: 20}}>
                            <FAB
                                style={{backgroundColor: "#db2b30"}}
                                icon="add"
                                color={'#fff'}
                                onPress={() => {
                                    // if (showAdhocShifts && (loggedUserRole === '19')){
                                    if (showAdhocShifts && (loggedUserRole === '19' || loggedUserRole === '20' || loggedUserRole === '25' || loggedUserRole === '26' || loggedUserRole === '30' || loggedUserRole === '31')) {
                                        this.props.navigation.navigate('CreateNonRegisteredAdhocShift')
                                    } else {
                                        const selectedUserSiteDetails = {
                                            siteId: this.state.siteId,
                                            siteName: this.state.siteName,
                                            siteCode: this.state.siteCode,
                                            dayStatus: this.state.dayStatus,
                                            toScreen: 'Pipeline'
                                        }
                                        Utils.setToken('selectedUserSiteDetails', JSON.stringify(selectedUserSiteDetails), function () {
                                        })
                                        this.props.navigation.navigate('Pipeline')
                                    }
                                }}
                            />
                        </View>
                        : null
                    }


                    {/*MODALS START*/}

                    {/*USER ROLE POP-UP*/}
                    <Modal transparent={true}
                           visible={this.state.userRolePopup}
                           animated={true}
                           animationType='fade'
                           onRequestClose={() => {
                               this.setState({userRolePopup: false})
                           }}>
                        <View style={[Styles.modalfrontPosition]}>
                            <View
                                style={[[Styles.bw1, Styles.aslCenter, Styles.p15, Styles.br40, Styles.bgWhite, {
                                    width: Dimensions.get('window').width - 80,
                                }]]}>
                                <View style={[Styles.bgWhite,{height: Dimensions.get('window').height/1.9,}]}>
                                    <View style={Styles.alignCenter}>
                                        <Text
                                            style={[Styles.ffLBold, Styles.colorBlue, Styles.f22, Styles.m10, Styles.mBtm20]}>Select Role</Text>
                                    </View>
                                    <ScrollView persistentScrollbar={true}>
                                        {this.state.userRolesList.length > 0
                                            ?
                                            <List.Section>
                                                {
                                                    this.state.userRolesList.map((role,index) => {
                                                        return (
                                                                <List.Item
                                                                    onPress={() => this.setState({
                                                                        userRolePopup: false,
                                                                        displayRole: role.roleName,
                                                                        filterRoleValue: role.roleValue,
                                                                        requestRoleValue: role.roleValue,
                                                                        page:1
                                                                    }, function () {
                                                                        // this.filterByRole(role.value);
                                                                        this.getShiftsList()
                                                                    })}
                                                                    style={{marign: 0, padding: 0,}}
                                                                    theme={theme}
                                                                    key={index}
                                                                    title={role.roleName + ' ' + '(' + (role.count) + ')'}
                                                                    titleStyle={[Styles.ffLRegular,
                                                                        Styles.colorBlue,
                                                                        Styles.f16,
                                                                        Styles.aslCenter,
                                                                        Styles.bw1,
                                                                        Styles.br100,
                                                                        {
                                                                            width: 210,
                                                                            textAlign: 'center',
                                                                            paddingHorizontal: 5,
                                                                            paddingVertical: 10,
                                                                            backgroundColor: this.state.filterRoleValue === role.roleValue ? '#C91A1F' : '#fff',
                                                                            color: this.state.filterRoleValue === role.roleValue ? '#fff' : '#233167',
                                                                            borderWidth: this.state.filterRoleValue === role.roleValue ? 0 : 1,
                                                                        }]}
                                                                />
                                                        );
                                                    })
                                                }
                                            </List.Section>
                                            :
                                            <Text style={[Styles.ffLRegular, Styles.aslCenter]}>No Shifts Found </Text>}
                                    </ScrollView>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => {
                                this.setState({userRolePopup: false})
                            }} style={{marginTop: 20}}>
                                {LoadSVG.cancelIcon}
                            </TouchableOpacity>
                        </View>
                    </Modal>

                    {/*MODAL for header FILTERS LIST*/}
                    <Modal
                        transparent={true}
                        visible={this.state.headerPopup}
                        onRequestClose={() => {
                            this.setState({headerPopup: false})
                        }}>
                        <View style={[Styles.headerWithOutBg]}>
                            <TouchableOpacity style={[Styles.modalbgPosition]}
                                              onPress={() => {
                                                  this.setState({headerPopup: false})
                                              }}/>
                            <View
                                style={[[Styles.bgWhite, Styles.p10, Styles.aslCenter, Styles.headerModal, {width: Dimensions.get('window').width / 3.5}]]}>

                                <TouchableOpacity style={[Styles.p10, Styles.bgDash, Styles.br100, Styles.aslCenter]}>
                                    <MaterialIcons name="phone" size={25}
                                                   onPress={()=>{this.getSupervisorsList()}}
                                        //                onPress={() => this.setState({
                                        //     ModalSupervisorVisible: true,
                                        //     headerPopup: false
                                        // })}
                                    />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[Styles.bgDash, Styles.br100, Styles.aslCenter, Styles.marV10]}>
                                    <MaterialIcons name="search"
                                                   size={25} style={[Styles.p10]} onPress={() => this.setState({
                                        SearchBarView: true,
                                        searchData: '',
                                        activityData: '',
                                        headerPopup: false
                                    })}/>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[Styles.bgDash, Styles.br100, Styles.aslCenter]}>
                                    <FontAwesome name="filter"
                                                 size={25} style={[Styles.p10]}
                                                 // onPress={() => this.roleBasedCount()}
                                                 onPress={() => this.getRolesCount()}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                    {/*MODAL FOR SITE SUPERVISOR LIST VIEW*/}
                    <SupervisorsModal visible={this.state.ModalSupervisorVisible}
                                      closeModal={() => this.setState({ModalSupervisorVisible: false})}
                                      siteName={this.state.siteName}
                                      children={this.state.SupervisorDetails}/>

                    {/*MODALS END*/}
                </View>
                :
                <CSpinner/>
        );
    }
}

const styles = StyleSheet.create({
    appbar: {
        backgroundColor: "white"
    },
    container: {
        marginTop: 10
    },
    surface: {
        padding: 4,
        alignItems: "center",
        justifyContent: "center",
        elevation: 1
    },
    row: {
        marginLeft: 10,
        marginTop: 2,
        marginRight: 10
    },
    containerMap: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        alignItems: 'center',
    }, callout: {
        padding: 10,
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    section: {
        backgroundColor: "white"
    },
    time: {
        marginTop: 9,
        marginRight: 10,
        fontFamily: 'Muli-Bold'
    },
    item: {
        borderBottomColor: Colors.grey200,
        borderBottomWidth: 1,
        fontFamily: 'Muli-Regular',
        fontSize: 16
    },
    shadowPop: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,
        elevation: 2,
        borderRadius: 0,
        borderWidth: 1,
        borderColor: '#000',
        marginVertical: 6,
        textTransform: 'uppercase'
    },
    chip: {
        color: '#fff',
        fontSize: 17
    }

});
