import {ACTIONHOMESCREEN} from "../Actions/HomeScreenAction"
import Services from '../../../components/common/Services'

const InitialState={

    refreshing: false, spinnerBool: false, userId: '',
    currentShift: '',
    completedShifts: '',
    otherShifts: '',
    loggedInUserDetails: [],
    ModalUserShiftList: false, ShowModal: true,
    NotificationToken: '', noShiftModel: false, siteSupervisorsInfo: '',
    primarySiteSupervisorsModal: false,
    trainingProgressModal: false, successModal: false, progress: '0', trainingProgressList: [],
    termsAndConditionsModal: false, profileInfoRatio: 0, primarySiteSupervisorsInfo: [],
    SignatureModal: false, SignatureURL: '', signatureDragged: false, notificationsCount: '',

    //userlog

    usersLogList: [],
    page: 1,
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


}

function HomeScreenReducer(state=InitialState,action){
    switch(action.type){
        case ACTIONHOMESCREEN:
        return Object.assign({}, state, action.payload)
        default:
        return{
            ...state,
        }
    }
}

export default HomeScreenReducer
