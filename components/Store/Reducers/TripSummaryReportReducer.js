import {ACTIONTRIPSUMMARYREPORT} from "../Actions/TripSummaryReportAction"
import Services from '../../../components/common/Services'

const InitialState={

        reportsList: [], page: 1, size: 20, totalElements: 0, refreshing: false,
        spinnerBool: false,
        selectedReportData: [], sitesList: [],
        showReportsModal: false, accessToEditData: false, showShiftData: false,
        tripTypeSelectionModal: false, packageSelectionModal: false, filtersModal: false,
        tripTypeList: [
            // {value: 'REGULAR', name: 'Regular', key: 1},
            // {value: 'IHS 6 hrs', name: 'IHS 6 hrs', key: 2},
            // {value: 'IHS 12 hrs', name: 'IHS 12 hrs', key: 3},
            // {value: 'Permanent 6 hrs', name: 'Permanent 6 hrs', key: 4},
            // {value: 'Permanent 12 hrs', name: ' 12 hrs', key: 5},
            // {value: 'NOLOAD', name: 'No Load', key: 6},
            // {value: 'Absent', name: 'Absent', keyPermanent: 7},
        ],
        filterFromDate: Services.returnYesterdayDate(), filterToDate: Services.returnYesterdayDate(),
        filterVehilceType: 'All', filterVerifiedType: 'All', filterRole: 'All', filterSiteId: 'All',
        vehicleTypeList: [{value: 'All', label: 'All', key: 0},
            {value: '2', label: '2 Wheeler', key: 1},
            {value: '3', label: '3 Wheeler', key: 2},
            {value: '4', label: '4 Wheeler', key: 3}],
        verifiedTypeList: [
            {value: 'All', label: 'All', key: 1},
            {value: 'verified', label: 'Verified', key: 2},
            {value: 'unVerified', label: 'Un-Verified', key: 3}],
        rolesList: [{value: 'All', label: 'All', key: 0},
            {value: '1', label: 'Associate', key: 1},
            {value: '5', label: 'Driver', key: 2},
            {value: '10', label: 'Driver & Associate', key: 3}],
}

function TripSummaryReportReducer(state=InitialState,action){
    switch(action.type){
        case ACTIONTRIPSUMMARYREPORT:
        return Object.assign({}, state, action.payload)
        default:
        return{
            ...state,
        }
    }
}

export default TripSummaryReportReducer
