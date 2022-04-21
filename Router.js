import React, {Fragment, useEffect} from 'react';
import AuthNav from "./components/AuthNav";

import ProfileStatusScreen from "./components/ProfileStatusScreen";
import RejectedUsersScreen from "./components/RejectedUsersScreen";

import LoginScreen from "./components/LoginScreen";
import SignupScreen from "./components/SignupScreen";
import ResetPassword from "./components/ForgotPasswordStack/ResetPassword";
import ForgotPassword from "./components/ForgotPasswordStack/ForgotPassword";
import OTPverificationScreen from "./components/ForgotPasswordStack/OTPverificationScreen";

import HomeScreen from "./components/HomeScreen";
import DeliveriesHistory from "./components/DeliveriesHistory";
import MyTrips from "./components/MyTrips";

import DrawerComponents from './components/DrawerComponents';

import Settings from "./components/Settings";
import Faqs from "./components/settingsStack/Faqs";
import Privacy from "./components/settingsStack/Privacy";
import TermsOfService from "./components/settingsStack/TermsOfService";

import {
    createStackNavigator,
    createAppContainer,
    createSwitchNavigator,
    createDrawerNavigator
} from "react-navigation";

import ScanQRcode from "./components/ScanQRcode";
import StartShiftScreen from './components/StartShiftScreen';
import EndShiftScreen from "./components/EndShiftScreen";
import UpdateShiftScreen from "./components/UpdateShiftScreen";
import CompletedShiftScreen from "./components/CompletedShiftScreen";

import ReferAFriend from './components/ReferAFriend';

import Notifications from "./components/Notifications";
import Summary from './components/Summary';

import SiteListingScreen from "./components/SiteListingScreen";
// import TeamListingScreen from './components/TeamListingScreen';
import Pipeline from './components/Pipeline';
import MyTripsMapView from "./components/MyTripsMapView";

import UsersMapView from "./components/SupervisorStack/UsersMapView";
import TeamListingScreen from './components/SupervisorStack/TeamListingScreen';
import CreateShift from './components/SupervisorStack/CreateShift';
import ErrorScreen from "./components/common/ErrorScreen";
import ErrorHandling from "./components/common/ErrorHandling";

import article from "./components/Article";
import ReferredList from "./components/ReferredList";
import ShiftExpensesScreen from './components/ShiftExpensesScreen';
import {UserLogHistory} from "./components/UserLogHistory";

import userShiftActions from "./components/SupervisorStack/userShiftActions";
import {MyPlans} from "./components/MyPlans";
import {MyVouchers} from "./components/MyVouchers";
import {AddVoucher} from "./components/SupervisorStack/AddVoucher";
import userQRcode from "./components/swiggy/userQRcode";
import getUserHistory from "./components/swiggy/getUserHistory";
import postUserData from "./components/swiggy/postUserData";
import ShiftSummary from './components/SupervisorStack/ShiftSummary';
import PendingUsersScreen from './components/SupervisorStack/PendingUsersScreen';

//order management screens
import OrdersListScreen from './components/OrderManagementStack/OrdersListScreen';
import OrdersStartScreen from './components/OrderManagementStack/OrdersStartScreen';
import OrdersEndScreen from './components/OrderManagementStack/OrdersEndScreen';
import NewProfileScreen from "./components/ProfileStack/newProfileScreen";
import NewPersonalScreen from "./components/ProfileStack/NewPersonalScreen";

import VehicleDetailsScreen from "./components/ProfileStack/VehicleDetailsScreen";
import BankDetailsScreen from "./components/ProfileStack/BankDetailsScreen";
import OrderQRCode from "./components/OrderManagementStack/OrderQRCode";
import CalendarShifts from "./components/CalendarShifts";
import CalendarTimeline from "./components/CalendarTimeline";
import TripSummaryReport from "./components/TripSummaryReport";
import {ReimbursementExpenses} from "./components/ReimbursementExpenses";
import CreateNonRegisteredAdhocShift from "./components/CreateNonRegisteredAdhocShift";
import TripsVerification from "./components/TripsVerification";
import CashClosure from "./components/CashClosure";
import TripSummary from "./components/TripSummary";
import HelpDesk from "./components/HelpDesk";
import socketSetup from "./components/socketSetup";


const AuthNavigate = createStackNavigator(
    {
        Login: LoginScreen,
        Signup: SignupScreen,
        ResetPassword: ResetPassword,
        ForgotPassword: ForgotPassword,
        OTPverificationScreen: OTPverificationScreen,
        ErrorHandling: ErrorHandling
    },
    {
        defaultNavigationOptions: {
            header: null
        }
    }
);

const DrawerNavigator = createDrawerNavigator(
    {
        HomeScreen: HomeScreen,
        DeliveriesHistory: DeliveriesHistory,
        MyTrips: MyTrips,
        ReferAFriend: ReferAFriend,
        ReferredList: ReferredList,
        UserLogHistory:UserLogHistory,
        NewProfileScreen: NewProfileScreen,
        Settings: Settings,
        MyPlans: MyPlans,
        MyVouchers: MyVouchers,
        PendingUsersScreen: PendingUsersScreen,
        // CalendarShifts:CalendarShifts,
        TripSummaryReport:TripSummaryReport,
        ReimbursementExpenses:ReimbursementExpenses,
    },
    {
        // drawerType: "slide",
        // drawerPosition: 'right',
        contentComponent: DrawerComponents
    }
);


const AppStackNavigator = createStackNavigator(
    {
        HomeScreen: DrawerNavigator,
        Settings: Settings,
        Faqs: Faqs,
        Privacy: Privacy,
        TermsOfService: TermsOfService,
        // MyTrips: MyTrips,
        DeliveriesHistory: DeliveriesHistory,
        Notifications: Notifications,
        CreateShift: CreateShift,
        ScanQRcode: ScanQRcode,
        Summary: Summary,
        Pipeline: Pipeline,
        TeamListingScreen: TeamListingScreen,
        SiteListingScreen: SiteListingScreen,
        MyTripsMapView: MyTripsMapView,
        ReferAFriend: ReferAFriend,
        UsersMapView: UsersMapView,
        ErrorScreen: ErrorScreen,
        EndShiftScreen: EndShiftScreen,
        StartShiftScreen: StartShiftScreen,
        UpdateShiftScreen: UpdateShiftScreen,
        CompletedShiftScreen: CompletedShiftScreen,
        ErrorHandling: ErrorHandling,
        ReferredList: ReferredList,
        ShiftExpensesScreen: ShiftExpensesScreen,
        UserLogHistory: UserLogHistory,
        userShiftActions: userShiftActions,
        AddVoucher: AddVoucher,
        MyPlans: MyPlans,
        MyVouchers: MyVouchers,
        //Swiggy Components
        userQRcode: userQRcode,
        getUserHistory: getUserHistory,
        postUserData: postUserData,
        ShiftSummary: ShiftSummary,
        //order management screens
        OrdersListScreen: OrdersListScreen,
        OrdersStartScreen: OrdersStartScreen,
        OrdersEndScreen: OrdersEndScreen,
        OrderQRCode:OrderQRCode,
        //NEW PROFILE SCREEN DESIGN
        NewProfileScreen: NewProfileScreen,   //New Profile Intro Screen
        NewPersonalScreen: NewPersonalScreen,  //new Personal Screen
        VehicleDetailsScreen: VehicleDetailsScreen, //new Vehicle Screen
        BankDetailsScreen: BankDetailsScreen, //new Bank Details Screen
        PendingUsersScreen: PendingUsersScreen,
        CalendarShifts: CalendarShifts,
        CalendarTimeline:CalendarTimeline,
        TripSummaryReport:TripSummaryReport,
        ReimbursementExpenses:ReimbursementExpenses,
        CreateNonRegisteredAdhocShift:CreateNonRegisteredAdhocShift,
        TripsVerification:TripsVerification,
        CashClosure:CashClosure,
        TripSummary:TripSummary,
        HelpDesk:HelpDesk,
        socketSetup:socketSetup
    },
    {
        defaultNavigationOptions: {
            header: null
        }
    }
);

const PendingProfileStack = createStackNavigator(
    {
        ProfileStatusScreen: ProfileStatusScreen,
        // profile:profile,
        // PersonalInformationScreen:PersonalInformationScreen,
        // VehicleInformationScreen:VehicleInformationScreen,
        // BankAccountDetailsScreen:BankAccountDetailsScreen,
        //NEW PROFILE SCREEN DESIGN
        // NewProfileScreen:NewProfileScreen,   //New Profile Intro Screen
        // NewPersonalScreen:NewPersonalScreen,  //new Personal Screen
        // VehicleDetailsScreen:VehicleDetailsScreen, //new Vehicle Screen
        // BankDetailsScreen:BankDetailsScreen, //new Bank Details Screen
    },
    {
        defaultNavigationOptions: {
            header: null
        }
    }
);

const RejectedStack = createStackNavigator(
    {
        RejectedUsersScreen: RejectedUsersScreen
    },
    {
        defaultNavigationOptions: {
            header: null
        }
    }
);
const ErrorStack = createStackNavigator(
    {
        ErrorScreen: ErrorScreen
    },
    {
        defaultNavigationOptions: {
            header: null
        }
    }
);

const DeepLinkingStack = createStackNavigator(
    {
        article: {screen: article},
        // HomeScreen:{ screen: HomeScreen },
    },
    {
        defaultNavigationOptions: {
            header: null
        }
    }
);


// const prefix = 'whizzard://whizzard/';
// const App = createAppContainer(AppStackNavigator)
// const MainApp = () => <App uriPrefix={prefix} />;
// // export default MainApp;


export default createAppContainer(
    createSwitchNavigator({
        // MainApp:MainApp,
        // DeepLinkingStack:DeepLinkingStack,
        authNavigator: AuthNav,
        Auth: AuthNavigate,
        AppNav: AppStackNavigator,
        PendingUsers: PendingProfileStack,
        RejectedUsers: RejectedStack,
        ErrorsList: ErrorStack,
    })
);

//Auth is for navigating to login page and signup page etc which doesnot require token
//AppNAv is for navigating screens which require token
