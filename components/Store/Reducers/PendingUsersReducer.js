import {ACTIONPENDINGUSERS} from "../Actions/PendingUsersAction"

const InitialState={

    usersList: [],rolesList:[],sitesList:[],userRole:'',
    showAcceptModal: false, showChangePassword: false,showRejectUserModal:false,RejectReason:'',errorRejectReason:null,
    AcceptRoleValue:'',AcceptSiteValue:'',
    AcceptReason:'',errorAcceptReason:null,isContractor:false,errorRoleValue:null,errorSiteValue:null,
    password: '',
    confirmPassword: '',
    ErrorMessage: '',
    isValidPassword: null,
    errorPassMessage: null,
    isValidCPassword: null,
    errorCPassMessage: null,
    errorMobileMessage: null,
    showButton: false,
    refreshing: false,
    data: [],
    page: 1,
    spinnerBool: false,
    size: 10,
    isLoading: false,
    ascendingOrder: true,
    userProfileRemarks:[],showRemarksList:false,
    SearchBarView: false,searchData:''

}

function PendingUserReducer(state=InitialState,action){
    switch(action.type){
        case ACTIONPENDINGUSERS:
        return Object.assign({}, state, action.payload)
        default:
        return{
            ...state,
        }
    }
}

export default PendingUserReducer
