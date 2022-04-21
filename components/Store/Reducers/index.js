import {combineReducers} from 'redux';
import SignUpreducer  from "./SignUpreducer"
import HomeScreenReducer  from "./HomeScreenReducer"
import UserLogHistoryReducer from "./UserLogHistoryReducer"
import TripSummaryReportReducer from "./TripSummaryReportReducer"
import PendingUserReducer from "./PendingUsersReducer"
import NotificationReducer from "./NotificationReducer"

const reducers = combineReducers({
    SignUp: SignUpreducer,
    HomeScreen : HomeScreenReducer,
    UserLogHistory: UserLogHistoryReducer,
    TripSummaryReport : TripSummaryReportReducer,
    PendingUsers : PendingUserReducer,
    Notification : NotificationReducer

    
})

export default reducers;