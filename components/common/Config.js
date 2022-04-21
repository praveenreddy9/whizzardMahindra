import React, {version} from "react";

const routes = {
    // BASE_URL: "http://13.126.68.69:8090",   //Main IP
    // BASE_URL: "http://192.168.29.157:8090",  //Sravan IP
    // BASE_URL: "http://192.168.29.145:8090",  //Jeevan IP
    // BASE_URL: "http://192.168.0.101:8090",  //Jeevan IP TECH#2
    // BASE_URL: "http://192.168.29.54:8090",  //SAI IP
    // BASE_URL: "http://192.168.100.10:8090",  //SAI HOSTEL IP
    // BASE_URL: "http://192.168.238.109:8090",  //SAI HOSTEL IP NEW
    // BASE_URL: "http://192.168.29.18:8090",  //SAI OFFICE IP 2.4
    // BASE_URL: "http://192.168.0.108:8090",  //SAI OFFICE IP Tech#2
    //  BASE_URL: "http://test.wellpointtek.com",   //Testing URL
    //  BASE_URL: "http://52.66.188.61:8090",   //NEW TEST IP
    // BASE_URL: "http://qa.whizzard.in",   //old TEST URL (because of Web security)
    // BASE_URL: "http://srinikandula.com",   //NEW LIVE URL HOLD


    // BASE_URL: "http://api.whizzard.in",  // live URL HOLD for Server Break
    // 172.31.8.41  ===>test IP


    BASE_URL: "http://testing.whizzard.in",   //NEW testing URL (13.233.126.214==>new IP)
    // BASE_URL: "http://mobileapi.whizzard.in",  // New Server live URL
    // BASE_URL: "http://mobileapi.whizzard.mll.in",  // New Server live URL
    // BASE_URL: "https://mllapi.whizzard.in",           //MLL URL

    APP_VERSION_NUMBER:'2.5.45', //2.5.62 is live deployed //2.5.45 is test //2.5.13 is jeevan


    showAPKDate:false,
    APK_DATA:'21-Apr-2022',


    //OPERATIONS_TYPE
    //operationsTypeDetailsUpdated
    //(card.requiredTripType ? operationsTypeDetailsUpdated : true) &&
    //finalTripType, tempTripType


    //checks before live build
    // Base url to live
    // App Version Number
    // Newtork util (Live URL)
    // Build Gradle Number
    // Build version
    // Services No auth Headers (Device Id check)(74 line)
    //Services Comment alerts,consoles of API response (Auth,No-Auth,Image upload,Image Delete)
    //check verifyOTP enabled at Lite users (verifyOTP)
    //check user location enabled at Cash closure (validatingLocation)
    //MOCK locaiton-successCall back from backend
    //Mock-AuthNav requireMock or not
    //Mock-Clear Async
    //show APK data at config
    //APP.js at render ignore all Logs


    // git reset --keep HEAD~1     ==>will reset to commit (will store the changes made)
    // git reset --hard HEAD~1     ==>will reset to last commit (will remove the changes)


    // USER ROLE NUMBERS
    Associate: 1,
    Driver: 5,
    DriverAndAssociate: 10,
    Labourer: 15,
    ProcessAssociate: 19,
    // Supervisor: 20,
    ShiftLead: 25,
    HubManager: 26,
    Finance: 27,
    Technology: 28,
    Central: 26,
    ClusterManager: 30,
    OpsManager: 31,
    CityManager: 35,
    RegionalManager:40,
    SuperUser: 45,
    Employee:65,

    // Whizzard://Notifications  ==>to notifications screen
    // Whizzard://ShiftSummary  ==>to shift summary screen

    //Shift Status
    // MARKED_ATTENDANCE
    // STARTED_SHIFT
    // ENDED_SHIFT
    // UPDATED_PACKAGES
    // SHIFT_CREATED
    // SHIFT_CANCELLED
    // USER_SIGN_UP

    // Order Status
    // AT_DC
    // READY_FOR_PICKUP
    // OUT_ON_ROAD
    // REJECTED
    // REJECTED_BY_CUSTOMER
    // CANCELLED
    // DELIVERED
    // PARTIALLY_DELIVERED
    // ATTEMPTED


    //For calendar
    // INIT
    // ATTENDANCE_MARKED
    // SHIFT_IN_PROGRESS
    // SHIFT_ENDED
    // SHIFT_AUTOCLOSED
    // SHIFT_SUSPENDED
    // SHIFT_CLOSED_BY_SUPERVISOR
    // SHIFT_CANCELLED_BY_SUPERVISOR
    // REPORTED_ABSENT

    //Trip Types
    // Regular
    // IHS 6 hrs
    // IHS 12 hrs
    // Permanent 6 hrs
    // Permanent 12 hrs
    // No Load


    //startshift(orders count in resp,show card)
    //endshift(cashcollected on change)
    //summary(cash collected value show)

    //Auth Screen
    // get mobile app version code without token,
    APP_VERSION_NUMBER_WITHOUT_TOKEN: '/api/noauth/checkMobileAppVersion',
    APP_UPDATE_NUMBER_WITHOUT_TOKEN: '/api/noauth/checkMobileAppUpdate', //new API for update and critical update check
    // get user profile status and app version
    USER_STATUS_AND_APP_VERSION: '/api/v1/statusAndAppVersion',

    //Login Screen
    POST_LOGIN: "/api/auth/signin",

    //Signup Screen
    POST_SIGNUP: "/api/auth/signup",
    GET_CITIES_SITES_CLIENTS_NOAUTH: '/api/noauth/getCitiesSitesAndClients',
    GET_HIRING_MANAGERS_LIST: '/api/noauth/getHiringManagers/',
    GET_SIGNUP_ROLES_LIST: '/api/noauth/getRolesForSignUp?',

    //Home Screen
    TOKEN_VERIFICATION: "/api/v1/test/user", //to check token
    LOGGEDIN_USER_DETAILS: "/api/v1/userLoginInfo",// get details of logged in user
    USERSHIFT_ACTIVE: "/api/v1/userShift/markUserShiftActive/",// marking user shift activated from list of Shifts
    CHANGE_SHIFT: '/api/v1/userShift/selectShift',// interchange shifts
    ACCEPT_TERMS_CONDITIONS: '/api/v1/user/updateTermsAcceptedDate', // accept terms and Conditions
    //signature's
    UPLOAD_USER_SIGNATURE : '/api/v1/user/uploadUser/DigitalSignature', //not using
    UPLOAD_DIGITAL_SIGNATURE : '/api/v1/user/uploadDigitalSignatureAndUpdateTermsAcceptedDate', //used for base64 upload

    //Calendar Shifts List
    GET_SHIFTS_LIST : '/api/v1/userShift/userShiftsDataCalendarView/?',
    // GET_SHIFTS_BY_SEARCH : '/api/v1/userShift/search', //not used--only for web
    GET_SHIFTS_BY_SEARCH : '/api/v1/userShift/searchShiftsForCalendarViewMobile', //date:'',status:[],userId:[] in body
    GET_SHIFTS_COUNT : '/api/v1/userShift/getUserShiftsCount/?', //not used

    //Trip Summary Report
    GET_TRIP_SUMMARY_REPORTS :'/api/v1/tripSummary/getTripSummaryReports',
    VERIFY_TRIP_DETAILS :'/api/v1/tripSummary/verifyTripSummaryReport/',
    UPDATE_TRIP_DETAILS :'/api/v1/tripSummary/updateTripSummaryReports?status=',
    GET_TRIP_TYPES_LIST :'/api/v1/tripSummary/getTripTypes',
    // GET_TRIP_SUMMARY_REPORTS :'/api/v1/tripSummary/getTripSummaryReportsForWeb', //new API after trip verification issue not used in mobile

    //new Trip API's
    GET_SITES_TRIPS_COUNT :'/api/v1/tripSummary/getUnverifiedTripsCount',
    GET_DATES_LIST_TRIPS_COUNT :'/api/v1/tripSummary/getUnverifiedTripsBySite',
    GET_UN_VERIFIED_TRIPS_LIST :'/api/v1/tripSummary/getUnverifiedTrips',
    REJECT_TRIP_DETAILS :'/api/v1/tripSummary/rejectTripSummaryReport',
    UPDATE_VERIFY_TRIP :'/api/v1/tripSummary/verifyTripSummary/',
    GET_UN_VERIFIED_TRIPS_ID :'/api/v1/tripSummary/getUnverifiedTripsByDate',
    GET_TRIP_DETAILS :'/api/v1/tripSummary/getTripSummaryReport/',
    GET_TRIP_REJECT_REASONS :'/api/v1/tripSummary/getRejectionReasons/', //based on shiftId
    GET_TRIPS_COUNTS_DATE :'/api/v1/tripSummary/getUnverifiedTripsCountDateWise', //HOLD for showing verified count
    GET_TRIPS_COUNTS_DATE_MOBILE :'/api/v1/tripSummary/getUnverifiedTripsCountDateWiseForMobile', //new api converted to body,and POST
    GET_TRIPS_COUNTS_SITE_AND_DATE_BASED :'/api/v1/tripSummary/getSiteWiseUnverifiedTripsByDate', //HOLD for showing verified count
    GET_TRIPS_COUNTS_SITE_AND_DATE_BASED_MOBILE :'/api/v1/tripSummary/getSiteWiseUnverifiedTripsByDateForMobile', //new api converted to body and POST
    GET_PENALTY_REASONS :'/api/v1/paymentPenalty/getPenalty/',
    GET_PAYMENT_PLANS_LIST :'/api/v1/Plan/getAllPlanNames',
    GET_PAYMENT_PLANS_SITE_BASED :'/api/v1/Plan/getPlansBySite/',
    GET_TRIP_TYPE_LIST :'/api/v1/userShift/getTripTypes?',

    //cash closure screen
    GET_PREVIOUS_CASH_DETAILS :'/api/v1/cashClosure/getOpeningAmount/',
    CREATE_TODAY_CASH_CLOSURE :'/api/v1/cashClosure/addCashClosure',
    UPLOAD_CASH_CLOSURE_PROFILE_PIC :'/api/v1/cashClosure/uploadImage/',
    UPLOAD_CASH_CLOSURE_DOCUMENT_IMAGES :'/api/v1/cashClosure/uploadDocument/',
    GET_ALL_CREATED_CASH_CLOSURES :'/api/v1/cashClosure/getAllCashClosures', //hold beacuse of more data
    GET_ALL_CREATED_CASH_CLOSURES_MOBILE :'/api/v1/cashClosure/getAllCashClosuresForMobile', //using for pagination
    UPDATE_TODAY_CASH_CLOSURE :'/api/v1/cashClosure/updateCashClosure/',
    DOCUMENTS_OF_CASH_CLOSURE :'/api/v1/cashClosure/uploadDoc/',  //new will send documentType
    CASH_CLOSURE_USER_IMAGE :'/api/v1/cashClosure/uploadImage/',
    CASH_CLOSURE_DEPOSITED_IMAGE :'/api/v1/cashClosure/uploadDepositedBankDoc/',
    CASH_CLOSURE_SYSTEM_COD :'/api/v1/cashClosure/uploadSytemCodDoc/',
    CASH_CLOSURE_OTHER_IMAGE :'/api/v1/cashClosure/uploadOtherDoc/',
    GET_DETAILS_OF_CASH_CLOSURE :'/api/v1/cashClosure/getCashCloserById/',  //new will send documentType
    POST_DETAILS_OF_CASH_CLOSURE :'/api/v1/cashClosure/saveOrSubmitCashClosure',  //new used to update and post
    GET_CASH_CLOSURE_SITES_LIST:'/api/v1/site/getSitesForCashClosure',  //new,some sites won't have cash closure


    //profile status screen
    GET_PROFILE_MISSING_FIELDS : "/api/v1/user/getUserMissingFields",
    //Profile Intro Screen
    GET_USER_PROFILE_DETAILS: "/api/v1/userProfile/getUserProfileInfo",
    GET_EMERGENCY_INFORMATION_WEB: '/api/v1/userProfile/getEmergencyContactInfo',
    UPDATE_EMERGENCY_INFORMATION_WEB: '/api/v1/userProfile/updateEmergencyContactInfo',

    //get insurance
    // GET_USER_INSURANCE_CARD:'/api/v1/userProfile/getInsuranceInfo', //OLD
    GET_USER_INSURANCE_CARD:'/api/v1/userProfile/getInsuranceInfoWeb', //new sending userId
    GET_USER_ID_CARD:'/api/v1/userProfile/userIdCardInfo',
    // GET_USER_CONTRACT_DETAILS:'/api/v1/userProfile/downloadContract/',  //used in mobile,not using in mobile
    GET_USER_CONTRACT_DETAILS:'/api/v1/userProfile/downloadContractForMobile/',

    //Personal Info Screen
    GET_PERSONAL_INFORMATION_WEB: "/api/v1/userProfile/getUserPersonalInfoWeb",
    //New Individual API's to Save or Update User Personal Information
    saveOrUpdatePersonalInfo: '/api/v1/userProfile/updatePersonalDetails',
    saveOrUpdateFamilyInfo: '/api/v1/userProfile/updateFamilyDetails',
    saveOrUpdateAadharCardInfo: '/api/v1/userProfile/updateAadhaarCardDetails',
    saveOrUpdatePANCardInfo: '/api/v1/userProfile/updatePANCardDetails',
    saveOrUpdateAddressInfo: '/api/v1/userProfile/updateAddressDetails',
    saveOrUpdateClothingInfo: '/api/v1/userProfile/updateClothingDetails',
    saveOrUpdateDrivingLicenseInfo: '/api/v1/userProfile/updateDLDetails',

    //Vehicle Screen
    USER_VEHICLES: "/api/v1/vehicle/getVehiclesForUser",  //to get ALL vehicles list based on usersId
    GET_VEHICLE: "/api/v1/vehicle/getVehicle/",  //to get vehicles details based on vehicleId
    UPDATE_VEHICLE: "/api/v1/vehicle/updateVehicle/",  //to update vehicle details
    SAVE_VEHICLE: "/api/v1/vehicle/saveVehicle", //to create new vehicle (sending RC pic formdata in body)
    DELETE_VEHICLE: "/api/v1/vehicle/delete/",  //to delete selected vehicle

    //Bank Screen
    USER_BANK_ACCOUNT_DETAILS: "/api/v1/userProfile/getUserBankInfoWeb",  //to get details
    UPDATE_BANK_ACCOUNT_DETAILS: "/api/v1/userProfile/updateUserBankInfo", //to update Details
    VERIFY_IFSC_CODE: "/api/v1/userProfile/verifyIFSCCode", //to verify IFSC code
    GET_BENEFICIARY_DETAILS_BY_PAN: "/api/v1/beneficiary/findBeneficiaryByPanNumber", //to check PAN number in system

    UPLOAD_BANK_DOCUMENT: '/api/v1/userProfile/uploadBankInfo',
    OTHER_BANK_DOCUMENT: '/api/v1/userProfile/uploadOtherBankProofDetails',
    BENEFICIARY_BANK_PROOF_UPLOAD: "/api/v1/beneficiary/uploadBankInfo",
    BENEFICIARY_PAN_PIC_UPLOAD: "/api/v1/beneficiary/uploadPanInfo",
    BENEFICIARY_AADHAR_PIC_UPLOAD: "/api/v1/beneficiary/uploadAadharInfo",

    //Common used
    DELETE_UPLOADED_IMAGE: "/api/v1/userProfile/deleteFileUpload", //TO DELETE IMAGE
    DELETE_VEHICLE_UPLOADED_IMAGE: "/api/v1/userProfile/deleteVehicleFileUpload",

    //Settings Screen
    LOGOUT_MOBILE: "/api/auth/logoutForMobile",
    LOCK_USER: "/api/v1/user/lockUser",

    //referralCode
    GET_REFERRAL_CODE: "/api/v1/user/getReferralCode",
    //APPLICATION Installation ID
    POST_INSTALLATION_ID: "/api/noauth/appInstalled",
    UPDATE_MOBILE_DETAILS: "/api/v1/user/updateUserMobileInfo", //kalyani given new

    //UPLOAD IMAGES FOR PROFILE
    UPLOAD_PROFILE_PIC: "/api/v1/userProfile/uploadProfilePic",
    UPLOAD_AADHAAR_PIC: "/api/v1/userProfile/uploadAadharCard",
    UPLOAD_AADHAAR_BACK_PIC: "/api/v1/userProfile/uploadAadharCardBackSidePic",
    UPLOAD_DRIVING_LICENSE: "/api/v1/userProfile/uploadDrivingLicensePhoto",
    UPLOAD_DRIVING_LICENCE_BACK: "/api/v1/userProfile/uploadLicenseBackSidePhoto",
    UPLOAD_INSURANCE_POLICY: "/api/v1/userProfile/uploadInsurancePolicyPhoto",
    UPLOAD_VEHICLE_RC: "/api/v1/userProfile/uploadVehicleRc",
    UPLOAD_POLLUTION_CHECK: "/api/v1/userProfile/uploadPollutionCheck",
    UPLOAD_ROAD_TAX: "/api/v1/userProfile/uploadRoadTax",
    UPLOAD_PAN_CARD: "/api/v1/userProfile/uploadPanCardPhoto",


    UPDATE_PROFILE_DETAILS: "/api/v1/userProfile/updateProfileDetails", //Profile Details POST
    GET_PROFILE_DETAILS: "/api/v1/userProfile/getUserProfile/",  //GET profile Details



    //VEHICLE SCREEN API's
    USER_INSURANCE_PIC: '/api/v1/vehicle/uploadInsurancePolicy/',
    USER_POLLUTION_PIC: '/api/v1/vehicle/uploadPollutionExpiryCopy/',
    USER_VEHICLE_RC_PIC: '/api/v1/vehicle/uploadRc/',
    USER_ROAD_TAX_PIC: '/api/v1/vehicle/uploadRoadTax/',
    VEHICLE_RC_BACK_PIC: '/api/v1/vehicle/uploadRCBackSidePic/',
    VEHICLE_FRONT_NUMBER_PLATE: '/api/v1/vehicle/uploadVehicleNumberPlateImage/',



    //Supervisor API's
    GET_SUPERVISOR_INFO: "/api/v1/user/getSupervisorsInfo/",  //to get sites list
    CANCEL_SHIFT: "/api/v1/userShift/cancelShift",
    // UPDATE_CLIENT_ID: "/api/v1/clientUserId/updateClientUserIdBySupervisor/",
    //SCAN QR CODE SCREEN
    UPDATE_MARK_ATTENDENCE: "/api/v1/userShift/markUserAttendanceBySupervisor/",
    // GET_CLIENT_ID: "/api/v1/clientUserId/getClientUserIdForShiftUser/",
    UPDATE_PICK_UP_PACKAGES: "/api/v1/userShift/updatePackagesInfo/",
    //Pipeline
    USERS_SUPERVISOR: "/api/v1/user/getUsersForSupervisors", //for users
    GET_USERS_ATSITE: "/api/v1/userShift/getShiftsAtSite/", //for particular site shifts

    //createShift
    // GET_ALL_CLIENTS: "/api/v1/client/getAllClients",
    // GET_CLIENT_SITES: "/api/v1/site/getClientSites/",
    CREATE_ADHOC_SHIFT: "/api/v1/userShift/createAdhocShiftBySupervisor/",
    SELF_ADHOC_SHIFT: "/api/v1/userShift/createShiftOnDemand/",
    // GET_ALL_SITES: "/api/v1/site/getLoggedUserSites", //HOLD because of it showing data of logged user sites
    GET_ALL_SITES: "/api/v1/site/getUserSites/", //SITES fetch based on userId
    GET_SITES_CLIENTS: "/api/v1/site/getSiteClients/",
    GET_ALL_VEHICLE_TYPES: "/api/v1/vehicle/getVehicles",
    GET_ROLES_LIST: "/api/v1/user/getRolesForShiftAssignment",
    GET_VEHICLE_LIST_FOR_USER: "/api/v1/vehicle/getVehicleTypesForUser?userId=",
    GET_ROLES_BY_SELECTED_USER_ROLE: '/api/v1/user/getRolesInHierarchyByUserRoleWhileShiftCreate/',

    //QR SCAN
    QR_SITE_LOCATION: '/api/v1/site/getSiteInfo/',
    QR_SCAN: "/api/v1/userShift/markUserAttendance/",

    //Shift start,end by User
    START_SHIFT: '/api/v1/userShift/startShift/',
    END_SHIFT: '/api/v1/userShift/endShift/',
    TOLL_EXPENSES: '/api/v1/userShift/uploadTollExpenses',
    ODOMETER_READINGS_IMAGE: '/api/v1/userShift/uploadOdometerReading?',
    GET_PROFILES_BASED_ON_PHONE_NUMBER_SEARCH: '/api/v1/user/getClientEmployeeIdAndClientUserIdInfo?', //

    //Shift update, Completed by User and Supervisor
    UPDATE_SHIFT: '/api/v1/userShift/updateShift/',

    //shift start and end by SUPERVISOR
    START_SHIFT_BY_SUPERVISOR: '/api/v1/userShift/startShiftBySupervisor/',
    END_SHIFT_BY_SUPERVISOR: '/api/v1/userShift/endShiftBySupervisor/',

    //forgot password
    GET_SMS: '/api/auth/sendPasswordResetCode/',
    //OTP Verification
    OTP_VERIFICATION: '/api/auth/verifyResetCode/',
    //reset password
    RESET_PASSWORD: '/api/auth/resetUserPassword/',
    //update password during first login
    UPDATE_PASSWORD: '/api/v1/user/changeUserPassword',
    //user validating through mobile number
    USER_PHONE_NUMBER_VALIDATE: '/api/noauth/findUser',
    //get Trips
    GET_TRIPS: '/api/v1/userShift/getTrips',
    GET_CANCELLED_SHIFTS: '/api/v1/userShift/getCancelledShiftsForUser',
    GET_USER_ALL_TRIPS: '/api/v1/tripSummary/getMyTrips',
    // Save GEO Locations(Background API)
    SAVE_LOCATIONS: '/api/v1/userShift/saveShiftGeoLocations',
    //get geolocations
    GET_LOCATIONS: '/api/v1/userShift/getShiftLocations/',
    //TeamListingScreen
    GET_AllUsersList: "/api/v1/user/getAllUsers",
    //get packages list
    GET_PACKAGES_LIST: '/api/v1/packageTypes/getPackageTypesForClient/',
    /*get shifts by siteId based on Supervisor*/
    //Team Listing screen
    GET_SHIFTS_FROM_SITE_ID: "/api/v1/userShift/getSiteShiftSummary/",                       //Hold for pagination and JSON
    GET_SHIFTS_LIST_BASED_ON_SITE: "/api/v1/userShift/getShiftsBasedOnSite",                //sai given
    GET_SUPERVISORS_LIST_BASED_ON_SITE: "/api/v1/userShift/getSupervisorsListSiteBased",    //sai given
    GET_ROLES_COUNT_BASED_ON_SITE: "/api/v1/userShift/getRolesCountSiteBased",              //sai given

    //get Shifts with SIte ID
    GET_SHIFTS_FROM_SITE: "/api/v1/userShift/getShiftsAtSite/",
    //saving device geoLocation
    SAVE_DEVICE_LOCATIONS: '/api/noauth/userShift/saveDeviceGeoLocation',
    //get the user locations by Site
    GET_LOCATIONS_BY_SITE_ID: '/api/v1/user/getUsersLocation/',
    //ShiftStatusScreen
    GET_STARTSHIFT_DETAILS: '/api/v1/userShift/getShiftInfo/',

    //get locations by shift
    SHIFT_LOCATION: '/api/v1/userShift/getShiftLocations/',
    //activity in supervisor
    USER_ACTIVITIES: '/api/v1/userActivity/getUserActivities',
    // get plans by site id
    GET_PLANS_BY_SITE_ID: '/api/v1/Plan/getPlansForSite/',
    // get All plans
    // GET_ALL_PLANS: '/api/v1/Plan/getAll',
    GET_ALL_PLANS: '/api/v1/Plan/getAllPlanNames',
    //user notifications
    USER_NOTIFICATIONS: '/api/v1/userActivity/userNotifications',
    USER_ATTENDANCE_UPDATE: '/api/v1/shiftAttendance/acceptAttendance',
    //shift actions in Team Listing Screen
    IS_SHIFT_ACTIONS_ALLOWED: '/api/v1/userShift/isShiftActionsAllowed',
    //Referred List Screen API
    GET_REFERRED_LIST: '/api/v1/user/myReferrals',

    //LOG ATTENDANCE SCREEN
    USER_ATTENDENCE_LOG: "/api/v1/userAttendanceLog/createUserAttendanceLog", //to update log status scan,Leave,Remotely
    GET_USER_LOG_HISTORY: '/api/v1/userAttendanceLog/getUserAttendanceLog/',  //to get all users logs
    GET_USER_LOG_STATUS: '/api/v1/userAttendanceLog/getUserAttendanceLogStatus/',  //to check log status scan,Leave,Remotely
    GET_USER_MONTH_COUNT: '/api/v1/userAttendanceLog/getUserAttendanceLogsForAMonth',  //to check MONTH COUNT
    GET_USER_LOGS_FILTER_BASED: '/api/v1/user/getUsersForEmployeeAttendance',  //not used
    GET_USER_LOGS_COUNT: '/api/v1/userAttendanceLog/getUserAttendanceLogCount', //not used

    //REIMBURSEMENT SCREEN
    GET_REIMBURSEMENT_TYPES : "/api/v1/expense/getReimbursementsTypes/", //central,station
    GET_EXPENSES_TYPES : "/api/v1/expense/getExpenseTypes/", //STAFFWELFARECENTRAL
    ADD_EXPENSES : "/api/v1/expense/addExpense",
    EDIT_EXPENSE : "/api/v1/expense/editExpense/", //to edit expense
    UPDATE_EXPENSE : "/api/v1/expense/updateExpense",  //to update expenses status
    GET_CREATED_EXPENSES_LIST : "/api/v1/expense/getExpensesByStatus/",
    GET_EXPENSES_DETAILS : "/api/v1/expense/getExpense/",  //to get details of expense -used in pending,reject,delete
    GET_SITES_DROPDOWN : "/api/v1/site/getSitesForDropdown",
    GET_SITES_DETAILS : "/api/v1/expense/getSiteDetails/",
    GET_SITES_LIST : "/api/v1/expense/getSitesDropDownForExpense",
    GET_EXPENSE_LIST : "/api/v1/expense/getAllPendingExpense",
    OTHER_EXPENSE_IMAGE : "/api/v1/expense/uploadExpenseDocument",
    EXTRA_EXPENSE_IMAGE_UPLOAD : "/api/v1/expense/uploadExpenseDocument?expenseId=",
    DELETE_EXPENSE_IMAGE : "/api/v1/expense/deleteExpenseDocument/?",

    GET_ALL_STATES : "/api/v1/region/getAllStates",
    GET_ALL_BUSINESS_UNITS : "/api/v1/expense/getBusinessUnits",
    GET_EXPENSE_ROLES : "/api/v1/expense/getRolesDropDownForExpenseFilter/",
    GET_EXPENSE_SITES : "/api/v1/expense/getSitesDropDownForExpenseFilter/",
    GET_MONTHLY_USER_REPORT : "/api/v1/expense/getCurrentMonthPaidExpensesReportOfUser/",
    GET_PAID_EXPENSE_LIST : "/api/v1/expense/getCurrentMontPaidExpensesCountAndTotalAmountOfUsers",
    GET_TO_PAY_EXPENSE_LIST : "/api/v1/expense/getToPayExpensesCountAndTotalAmountOfUsers",
    GET_TO_PAY_MONTHLY_USER_REPORT : "/api/v1/expense/getToPayExpensesReportOfUser/",
    UPDATE_TO_PAY_EXPENSE : "/api/v1/expense/updateExpensesStatusToPayToPaid/",

    //NON_REGISTERED USERS ADHOC SHIFT CREATION
    VERIFY_MOBILE_NUMBER : "/api/v1/user/getUserByPhoneNumber/",
    CREATE_UNREGISTERED_ADHOC : "/api/v1/userShift/createAdhocShiftForUnRegisteredUser?",
    GET_ADHOC_SHIFT_REASONS : "/api/v1/userShift/getUnRegisteredUserAdhocShiftReasons",
    UPLOAD_ADHOC_USER_PIC : "/api/v1/userShift/uploadAdhocUserImage?",
    GET_ADHOC_SITE_PLANS : "/api/v1/Plan/getPlansForAdhocUserShift",
    CHECK_USER_LOCATION : "/api/v1/userShift/checkUserLocation",
    CREATE_BENEFICARY : "/api/v1/beneficiary/saveBeneficiaryData",
    GET_ADHOC_SHIFTS_CREATED : "/api/v1/userShift/getAllAdhocUserShiftsCreated",
    GET_ADHOC_SHIFTS_CREATED_WITH_FILTERS : "/api/v1/userShift/getAllAdhocUserShifts",  //web used
    SEND_OTP_TO_USER : "/api/v1/userShift/sendOTP/",
    VERIFY_OTP : "/api/v1/userShift/verifyOTP?",
    UPLOAD_ADHOC_USER_BANK_DETAILS : "/api/v1/userShift/uploadAdhocUserBankDocument/",

    //LOGGED RELATED
    GET_LOGGED_USER_SITES : "/api/v1/site/getLoggedUserSites",  //can be used at trips,log attendance
    GET_ROLES_LIST_LOG_ATTENDANCE : "/api/v1/user/getRolesForEmpAttendanceFilter",  //can be used at trips,log attendance

    //MY PLANS SCREEN
    GET_USER_PLANS: '/api/v1/userPlan/getAllUserPlans',


    //Get user Details in Add Voucher Screen
    GET_INITIATE_VOUCHER_DETAILS: '/api/v1/voucher/initiateVoucher/',
    VALIDATE_VOUCHER_DETAILS: '/api/v1/voucher/validate/',
    POST_VOUCHER_DETAILS: '/api/v1/voucher/add/',
    GET_OTP_TO_VALIDATE_VOUCHER: '/api/v1/voucher/sendVoucherApprovalCode/',
    GET_MY_VOUCHERS: '/api/v1/voucher/findByUserId/',
    GET_CREATEDBYME_VOUCHERS: '/api/v1/voucher/getCreatedVouchers/',
    GET_VOUCHERS_DETAILS: '/api/v1/voucher/find/',

    //get shift summary supervisor flow
    GET_SHIFT_SUMMARY: '/api/v1/userShift/getUserShift/',

    //swiggyDistribution api's
    GET_SWIGGY_USER_HISTORY: '/api/v1/swiggyDistribution/getHistory/',
    POST_SWIGGY_USER: '/api/v1/swiggyDistribution/addNew',
    POST_SWIGGY_USER_WITH_FILE: '/api/v1/swiggyDistribution/addNewWithFileUpload',

    // //LOCUS API
    // GET_ALL_ORDERS_LIST: '/api/v1/more/orders/search', //to get all orders OLD
    // GET_ORDERS_LIST: '/api/v1/more/orders/getOrders', //orders list of user
    // START_ORDER: '/api/v1/more/orders/pickUpOrder', //for pickup
    // END_ORDER: '/api/v1/more/orders/deliverOrder', //for delivery
    // REJECT_ORDER: '/api/v1/more/orders/rejectOrder', //to reject selected order (in list screen)
    // CANCEL_ORDER: '/api/v1/more/orders/cancelOrder', //Attempted (end order ,selects reason for not delivering)
    // MULTIPLE_START_ORDER: '/api/v1/more/orders/pickUpOrders', //to start multiple before pickup (list screen)
    // MULTIPLE_REJECT_ORDER: '/api/v1/more/orders/rejectOrders', //to reject multiple before pickup (list screen)
    // REJECT_ORDER_BY_CUSTOMER: '/api/v1/more/orders/rejectOrderByCustomer', //to reject after Pickup (end order screen)
    // DELIVERED_IMAGE_UPLOAD: '/api/v1/orders/uploadImage?id=', //to upload image before end order (end order screen)

    //LOCUS API
    GET_ALL_ORDERS_LIST: '/api/v1/more/orders/search', //to get all orders OLD Not using
    GET_ORDERS_LIST: '/api/v1/orders/getOrders', //orders list of user
    START_ORDER: '/api/v1/orders/pickUpOrder', //for pickup
    END_ORDER: '/api/v1/orders/deliver', //for delivery ===========changed
    REJECT_ORDER: '/api/v1/orders/rejectOrder', //to reject selected order (in list screen)
    CANCEL_ORDER: '/api/v1/orders/cancelOrder', //Attempted (end order ,selects reason for not delivering)
    MULTIPLE_START_ORDER: '/api/v1/orders/pickUpOrders', //to start multiple before pickup (list screen)
    MULTIPLE_REJECT_ORDER: '/api/v1/orders/rejectOrders', //to reject multiple before pickup (list screen)
    REJECT_ORDER_BY_CUSTOMER: '/api/v1/orders/rejectItem', //to reject after Pickup (end order screen)======>changed
    DELIVERED_IMAGE_UPLOAD: '/api/v1/orders/uploadImage?id=', //to upload image before end order (end order screen)
    SEND_TRACKING_LINK: '/api/v1/userShift/sendTrackingLink', //to send tracking link(end order screen)
    PICKUP_ORDER_NOTIFICATION_BASED: '/api/v1/orders/acceptOrder', //to pickup order using notification

    //pending users screen
    GET_PENDING_USERS_LIST: '/api/v1/user/getActivationPendingUsers',
    UPDATE_PENDING_USERS_PASSWORD: '/api/v1/user/changeUserPassword',
    REJECT_PENDING_USER: '/api/v1/user/rejectUser/',
    ACCEPT_PENDING_USER: '/api/v1/user/activateUser/',
    GET_PENDING_USERS_ROLES_LIST: '/api/v1/user/getAllRoles',
    // GET_PENDING_USERS_SITES_LIST: '/api/v1/site/getSites', //HOLD timeout
    GET_PENDING_USERS_SITES_LIST: '/api/v1/site/getSiteNames',

};
export default {routes};
