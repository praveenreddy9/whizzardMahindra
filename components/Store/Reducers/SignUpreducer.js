import {ACTIONSIGNUP} from "../Actions/SignUpAction"

const InitialState={

    //RefferAFriendScreen
      referralData:"",

    //Login Screen
    PhoneNumber: "",
    password: "",
    rememberMe: false,
    token: '',
    spinnerBool: false,
    KeyboardVisible: true,
    ErrorMessage: '',
    isValidMobileNumber: null,
    isValidPassword: null,
    errorPassMessage: null,
    errorMobileMessage: null,
    showLogin: false,
    showPassword:false,

    //SignUp Screen

    fullName:'',
    signupPhonenumber:'',
    errorSignupMobileMessage:null,
    isValidSignUpMobileNumber:null,
    CitiesData:[],
    sitesByCityData:[],
    cities: [],
    cityId: '',
    userRole: '',
    sitesByCity: [],
    clientsBySite: [],
    cityName:'',
   // ErrorMessage: '',
    //isValidMobileNumber: null,
    isValidNoun: null,
    isValidEmail: null,
    isValidRole: null,
    isValidCity: null,
    isValidSite: null,
    isValidDOB: null,
    isValidVehicleType: null,
    isValidVehicleRegNo: null,
    isValidLocation: null,
    errorNameMessage: null,
    errorEmailMessage: null,
    errorDobMessage: null,
    errorRoleMessage: null,
    errorCityMessage: null,
    errorSiteMessage: null,
    errorVehicleTypeMessage: null,
    errorVehicleRegMessage: null,
    errorLocationMessage: null,
    userRolePopup: false,
    cityPopup: false,
    sitePopup: false,
    vehicleTypeModal: false,
    searchFilter: '',
    preferredSiteLocation: null,
    userRoles:[],
    showSites:false,
    // userRoles: [{name: 'Driver', value: 'DRIVER', id: '0'},
    //     {name: 'Associate', value: 'ASSOCIATE', id: '1'},
    //     {name: 'Driver and Associate', value: 'DRIVER_AND_ASSOCIATE', id: '2'},
    //     {name: 'ProcessAssociate', value: 'PROCESS_ASSOCIATE', id: '3'},
    //     {name: 'ShiftLead', value: 'SHIFT_LEAD', id: '4'},
    //     {name: 'Employee', value: 'EMPLOYEE', id: '5'},
    // ],
    vehicleTypeList: [{name: '2 Wheeler', value: '2'},
        {name: '3 Wheeler', value: '3'},
        {name: '4 Wheeler', value: '4'}], dateOfBirth: null, dobBorderColor: false,
    errorFinalVehicleNumber: null,
    part1: '', part2: '', part3: '', part4: '',
    HiringManagerName:'',HiringManagerId:'',showHiringManagerModal:false,HiringManagerList:[],siteId:'',QRVisible: false,showQRModal:false,invalidQR:false,



    //forgot password

    showButton:false,
    //otp verify Screen
    otp1: '', otp2: '', otp3: '', otp4: '', otp5: '', otp6: '', timer:300,

    //Reset password

    newPassword:'',
    confirmPassword:'',
    //isValidMobileNumber: null,
   // isValidPassword: null,
   // errorPassMessage: null,
    isValidCPassword: null,
    errorCPassMessage: null,
    code:''



}

function SignUpreducer(state=InitialState,action){
    switch(action.type){
        case ACTIONSIGNUP:
        return Object.assign({}, state, action.payload)
        default:
        return{
            ...state,
        }
    }
}

export default SignUpreducer
