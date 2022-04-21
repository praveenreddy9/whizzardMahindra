import {ACTIONNOTIFICATION} from "../Actions/NotificationAction"
import Services from '../../../components/common/Services'

const InitialState={

    data: [],
    page: 1,
    spinnerBool: false,
    size: 10,
    isLoading: false,
    isRefreshing: false,
    notificationImage: '',
    showBirthdayCard: false,
    showButtons: false,
    userAttendanceModal: false,errorRejectReason:null,rejectReason:'',notificationData:''

}

function NotificationReducer(state=InitialState,action){
    switch(action.type){
        case ACTIONNOTIFICATION:
        return Object.assign({}, state, action.payload)
        default:
        return{
            ...state,
        }
    }
}

export default NotificationReducer
