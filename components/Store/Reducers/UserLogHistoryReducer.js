import {ACTIONUSERLOGHISTORY} from "../Actions/UserLogHistoryAction"
import Services from '../../../components/common/Services'

const InitialState={

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
    userLogStatus:[],attendenceTypes:[],userLogStatusModal:false,
    sitesList:[],rolesList:[],logTypeList:[],filterLogStatus:'',myLogCount:[],


    //calendar shifts

    shiftsList: [],
    markedDates: {},
    searchList: [],
    selectedDate: '',
    userId: '',
    statuses: '',
    userRole: '',
    selectedChip: '',
    chipsList:[],


    //calender timeline

    // shiftsList: [],
    // markedDates: {},
    // searchList: [],
    // selectedDate:new Date(),
    // userId: '',
    // statuses: '',
    // userRole: '',
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
  //  selectedChip: '',
  //   page: 1,
   // spinnerBool: false,
   //  size: 20,
    shiftsData:[]

}

function UserLogHistoryReducer(state=InitialState,action){
    switch(action.type){
        case ACTIONUSERLOGHISTORY:
        return Object.assign({}, state, action.payload)
        default:
        return{
            ...state,
        }
    }
}

export default UserLogHistoryReducer
